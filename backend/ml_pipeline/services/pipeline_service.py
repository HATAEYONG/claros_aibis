# -*- coding: utf-8 -*-
"""
ML Pipeline Services
Machine Learning Pipeline 서비스
"""
import time
import uuid
import pickle
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from django.db import transaction

from ..models import MLModel, TrainingJob, PredictionRequest, FeatureStore, Experiment


class MLPipelineService:
    """
    ML 파이프라인 서비스
    모델 학습, 예측, 관리 기능 제공
    """

    def __init__(self):
        self.service_name = "ml_pipeline"

    def train_model(
        self,
        model_name: str,
        model_code: str,
        model_type: str,
        algorithm: str,
        target_feature: str,
        features: List[str],
        hyperparameters: Dict[str, Any],
        training_data: List[Dict[str, Any]],
        created_by: str = "system"
    ) -> Dict[str, Any]:
        """
        모델 학습

        Args:
            model_name: 모델명
            model_code: 모델 코드
            model_type: 모델 유형
            algorithm: 알고리즘
            target_feature: 타겟 피쳐
            features: 피쳐 목록
            hyperparameters: 하이퍼파라미터
            training_data: 학습 데이터
            created_by: 생성자

        Returns:
            학습 결과
        """
        job_id = str(uuid.uuid4())

        try:
            # 학습 작업 생성
            training_job = TrainingJob.objects.create(
                job_name=f"Train {model_name}",
                job_type="training",
                parameters={
                    'model_code': model_code,
                    'algorithm': algorithm,
                    'hyperparameters': hyperparameters,
                    'features': features,
                    'target_feature': target_feature,
                },
                status='running',
                started_at=timezone.now(),
            )

            # ML 모델 생성
            ml_model = MLModel.objects.create(
                name=model_name,
                code=model_code,
                model_type=model_type,
                algorithm=algorithm,
                target_feature=target_feature,
                features=features,
                hyperparameters=hyperparameters,
                status='training',
                trained_at=None,
                created_by=created_by,
            )

            training_job.model = ml_model
            training_job.save()

            start_time = time.time()

            # 모델 학습 시뮬레이션 (실제 구현시 scikit-learn 등 사용)
            model, metrics = self._train_model(
                algorithm=algorithm,
                training_data=training_data,
                target_feature=target_feature,
                features=features,
                hyperparameters=hyperparameters
            )

            training_time = int((time.time() - start_time) * 1000)

            # 모델 업데이트
            ml_model.status = 'trained'
            ml_model.metrics = metrics
            ml_model.trained_at = timezone.now()
            ml_model.training_samples = len(training_data)
            ml_model.training_time_ms = training_time
            ml_model.save()

            # 학습 작업 완료
            training_job.status = 'completed'
            training_job.progress = 100
            training_job.completed_at = timezone.now()
            training_job.duration_ms = training_time
            training_job.result = {
                'model_id': str(ml_model.id),
                'metrics': metrics,
                'training_samples': len(training_data),
            }
            training_job.save()

            return {
                'success': True,
                'job_id': job_id,
                'model_id': str(ml_model.id),
                'model_code': ml_model.code,
                'metrics': metrics,
                'training_time_ms': training_time,
            }

        except Exception as e:
            # 실패 처리
            if 'ml_model' in locals():
                ml_model.status = 'failed'
                ml_model.error_message = str(e)
                ml_model.save()

            if 'training_job' in locals():
                training_job.status = 'failed'
                training_job.error_message = str(e)
                training_job.completed_at = timezone.now()
                training_job.save()

            return {
                'success': False,
                'job_id': job_id,
                'error': str(e),
            }

    def _train_model(
        self,
        algorithm: str,
        training_data: List[Dict[str, Any]],
        target_feature: str,
        features: List[str],
        hyperparameters: Dict[str, Any]
    ) -> tuple:
        """
        모델 학습 (시뮬레이션)

        Returns:
            (model, metrics)
        """
        # 실제 구현시 scikit-learn, XGBoost 등 사용
        # 여기서는 간단한 시뮬레이션

        # 데이터 준비
        X = []
        y = []

        for row in training_data:
            feature_values = [row.get(f, 0) for f in features]
            X.append(feature_values)
            y.append(row.get(target_feature, 0))

        X = np.array(X)
        y = np.array(y)

        # 알고리즘별 모델 생성 (시뮬레이션)
        if algorithm == 'linear_regression':
            # 간단한 선형 회귀 시뮬레이션
            from sklearn.linear_model import LinearRegression

            model = LinearRegression(**hyperparameters)
            model.fit(X, y)

            # 메트릭 계산
            y_pred = model.predict(X)
            mse = np.mean((y - y_pred) ** 2)
            rmse = np.sqrt(mse)

            metrics = {
                'mse': float(mse),
                'rmse': float(rmse),
                'r2_score': float(model.score(X, y)),
            }

        elif algorithm == 'random_forest':
            from sklearn.ensemble import RandomForestRegressor

            model = RandomForestRegressor(**hyperparameters)
            model.fit(X, y)

            y_pred = model.predict(X)
            mse = np.mean((y - y_pred) ** 2)
            rmse = np.sqrt(mse)

            metrics = {
                'mse': float(mse),
                'rmse': float(rmse),
                'r2_score': float(model.score(X, y)),
                'feature_importances': {f: float(imp) for f, imp in zip(features, model.feature_importances_)},
            }

        else:
            # 기본 모델
            model = None
            metrics = {'status': 'simulated'}

        return model, metrics

    def predict(
        self,
        model_code: str,
        input_data: Dict[str, Any],
        requested_by: str = "api"
    ) -> Dict[str, Any]:
        """
        예측 수행

        Args:
            model_code: 모델 코드
            input_data: 입력 데이터
            requested_by: 요청자

        Returns:
            예측 결과
        """
        try:
            # 모델 조회
            model = MLModel.objects.get(
                code=model_code,
                status__in=['trained', 'deployed']
            )

            # 예측 요청 생성
            request_id = str(uuid.uuid4())
            prediction_request = PredictionRequest.objects.create(
                model=model,
                request_id=request_id,
                input_data=input_data,
                requested_by=requested_by,
            )

            start_time = time.time()

            # 예측 수행
            prediction_result = self._predict(
                model=model,
                input_data=input_data
            )

            inference_time = int((time.time() - start_time) * 1000)

            # 결과 저장
            prediction_request.prediction_result = prediction_result
            prediction_request.inference_time_ms = inference_time
            prediction_request.save()

            return {
                'success': True,
                'request_id': request_id,
                'prediction': prediction_result,
                'inference_time_ms': inference_time,
            }

        except MLModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_code}',
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def _predict(
        self,
        model: MLModel,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        예측 수행 (내부)
        """
        # 실제 구현시 저장된 모델 파일 로드 후 예측
        # 여기서는 시뮬레이션

        features = model.features
        X = [[input_data.get(f, 0) for f in features]]

        if model.model_file:
            # 저장된 모델 로드
            try:
                with open(model.model_file.path, 'rb') as f:
                    trained_model = pickle.load(f)
                prediction = trained_model.predict(X)[0]
            except:
                prediction = 0.0
        else:
            # 시뮬레이션 예측
            if model.model_type == 'regression':
                prediction = float(np.mean([input_data.get(f, 0) for f in features]))
            elif model.model_type == 'classification':
                prediction = int(np.mean([input_data.get(f, 0) for f in features]) > 0.5)
            else:
                prediction = 0.0

        return {
            'prediction': prediction,
            'model_type': model.model_type,
            'model_version': model.version,
        }

    def batch_predict(
        self,
        model_code: str,
        input_data_list: List[Dict[str, Any]],
        requested_by: str = "api"
    ) -> Dict[str, Any]:
        """
        일괄 예측 수행

        Args:
            model_code: 모델 코드
            input_data_list: 입력 데이터 목록
            requested_by: 요청자

        Returns:
            일괄 예측 결과
        """
        try:
            model = MLModel.objects.get(
                code=model_code,
                status__in=['trained', 'deployed']
            )

            predictions = []
            start_time = time.time()

            for input_data in input_data_list:
                prediction = self._predict(model, input_data)
                predictions.append({
                    'input': input_data,
                    'prediction': prediction,
                })

            total_time = int((time.time() - start_time) * 1000)

            return {
                'success': True,
                'model_code': model_code,
                'predictions': predictions,
                'total_count': len(predictions),
                'total_time_ms': total_time,
                'avg_time_ms': total_time / len(predictions) if predictions else 0,
            }

        except MLModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_code}',
            }

    def deploy_model(
        self,
        model_id: str
    ) -> Dict[str, Any]:
        """
        모델 배포

        Args:
            model_id: 모델 ID

        Returns:
            배포 결과
        """
        try:
            model = MLModel.objects.get(id=model_id)

            # 이전 배포 모델 해제
            MLModel.objects.filter(
                code=model.code,
                is_deployed=True
            ).update(is_deployed=False, deployed_at=None)

            # 현재 모델 배포
            model.is_deployed = True
            model.deployed_at = timezone.now()
            model.status = 'deployed'
            model.save()

            return {
                'success': True,
                'model_id': str(model.id),
                'model_code': model.code,
                'deployed_at': model.deployed_at.isoformat(),
            }

        except MLModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_id}',
            }

    def list_models(
        self,
        model_type: Optional[str] = None,
        status: Optional[str] = None,
        is_deployed: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """
        모델 목록 조회

        Args:
            model_type: 모델 유형 필터
            status: 상태 필터
            is_deployed: 배포 여부 필터

        Returns:
            모델 목록
        """
        queryset = MLModel.objects.all()

        if model_type:
            queryset = queryset.filter(model_type=model_type)
        if status:
            queryset = queryset.filter(status=status)
        if is_deployed is not None:
            queryset = queryset.filter(is_deployed=is_deployed)

        models = queryset.order_by('-created_at')

        return [
            {
                'id': str(model.id),
                'name': model.name,
                'code': model.code,
                'version': model.version,
                'model_type': model.model_type,
                'algorithm': model.algorithm,
                'status': model.status,
                'is_deployed': model.is_deployed,
                'metrics': model.metrics,
                'trained_at': model.trained_at.isoformat() if model.trained_at else None,
                'created_at': model.created_at.isoformat(),
            }
            for model in models
        ]

    def get_model_details(
        self,
        model_id: str
    ) -> Dict[str, Any]:
        """
        모델 상세 정보 조회

        Args:
            model_id: 모델 ID

        Returns:
            모델 상세 정보
        """
        try:
            model = MLModel.objects.get(id=model_id)

            # 관련 학습 작업
            training_jobs = model.training_jobs.all().order_by('-created_at')[:5]

            # 최근 예측
            recent_predictions = model.predictions.all().order_by('-created_at')[:10]

            return {
                'id': str(model.id),
                'name': model.name,
                'code': model.code,
                'version': model.version,
                'model_type': model.model_type,
                'algorithm': model.algorithm,
                'target_feature': model.target_feature,
                'features': model.features,
                'hyperparameters': model.hyperparameters,
                'metrics': model.metrics,
                'status': model.status,
                'is_deployed': model.is_deployed,
                'trained_at': model.trained_at.isoformat() if model.trained_at else None,
                'deployed_at': model.deployed_at.isoformat() if model.deployed_at else None,
                'training_samples': model.training_samples,
                'training_time_ms': model.training_time_ms,
                'description': model.description,
                'created_by': model.created_by,
                'created_at': model.created_at.isoformat(),
                'updated_at': model.updated_at.isoformat(),
                'training_jobs': [
                    {
                        'id': str(job.id),
                        'job_name': job.job_name,
                        'status': job.status,
                        'created_at': job.created_at.isoformat(),
                    }
                    for job in training_jobs
                ],
                'recent_predictions': [
                    {
                        'id': str(pred.id),
                        'request_id': pred.request_id,
                        'created_at': pred.created_at.isoformat(),
                    }
                    for pred in recent_predictions
                ],
            }

        except MLModel.DoesNotExist:
            return {
                'error': f'Model not found: {model_id}',
            }


class FeatureEngineeringService:
    """
    피쳐 엔지니어링 서비스
    피쳐 생성, 변환, 관리
    """

    def create_feature(
        self,
        name: str,
        display_name: str,
        feature_type: str,
        source_table: str,
        source_column: str,
        description: str = "",
        data_type: str = "float"
    ) -> Dict[str, Any]:
        """
        피쳐 생성

        Args:
            name: 피쳐명
            display_name: 표시명
            feature_type: 피쳐 유형
            source_table: 소스 테이블
            source_column: 소스 컬럼
            description: 설명
            data_type: 데이터 타입

        Returns:
            생성된 피쳐 정보
        """
        try:
            feature = FeatureStore.objects.create(
                name=name,
                display_name=display_name,
                feature_type=feature_type,
                source_table=source_table,
                source_column=source_column,
                description=description,
                data_type=data_type,
            )

            return {
                'success': True,
                'feature_id': str(feature.id),
                'name': feature.name,
                'display_name': feature.display_name,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def calculate_feature_statistics(
        self,
        feature_id: str
    ) -> Dict[str, Any]:
        """
        피쳐 통계 계산

        Args:
            feature_id: 피쳐 ID

        Returns:
            통계 정보
        """
        try:
            feature = FeatureStore.objects.get(id=feature_id)

            # 실제 구현시 소스 테이블에서 데이터 조회 후 통계 계산
            # 여기서는 시뮬레이션

            statistics = {
                'mean': 0.0,
                'std': 1.0,
                'min': 0.0,
                'max': 100.0,
                'median': 50.0,
                'q25': 25.0,
                'q75': 75.0,
                'count': 1000,
                'null_count': 0,
            }

            # 통계 저장
            feature.statistics = statistics
            feature.save()

            return {
                'success': True,
                'feature_id': str(feature.id),
                'statistics': statistics,
            }

        except FeatureStore.DoesNotExist:
            return {
                'success': False,
                'error': f'Feature not found: {feature_id}',
            }

    def list_features(
        self,
        feature_type: Optional[str] = None,
        source_table: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        피쳐 목록 조회

        Args:
            feature_type: 피쳐 유형 필터
            source_table: 소스 테이블 필터

        Returns:
            피쳐 목록
        """
        queryset = FeatureStore.objects.filter(is_active=True)

        if feature_type:
            queryset = queryset.filter(feature_type=feature_type)
        if source_table:
            queryset = queryset.filter(source_table=source_table)

        features = queryset.order_by('name')

        return [
            {
                'id': str(f.id),
                'name': f.name,
                'display_name': f.display_name,
                'feature_type': f.feature_type,
                'source_table': f.source_table,
                'source_column': f.source_column,
                'data_type': f.data_type,
                'statistics': f.statistics,
            }
            for f in features
        ]
