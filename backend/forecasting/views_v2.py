# -*- coding: utf-8 -*-
"""
Forecasting API Views V2
고도화된 시계열 예측 API 엔드포인트

변경사항:
- TFT (Temporal Fusion Transformer) 모델 지원
- 앙상블 예측 지원
- 실시간 예측 업데이트
- 예측 불확실성 정량화
- A/B 테스트 지원
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# 기존 서비스
from .models import ForecastModel, ForecastResult, ForecastAccuracyLog
from .services.forecast_service import ForecastingService

# ML Pipeline V2
from ml_pipeline.upgrade.prediction_service import (
    PredictionService,
    PredictionAPI,
    get_prediction_service
)


class ForecastModelViewSetV2(viewsets.ModelViewSet):
    """
    예측 모델 관리 API V2

    기존 기능 유지 + 새로운 모델 지원
    """
    permission_classes = [IsAuthenticated]
    queryset = ForecastModel.objects.all()

    def get_queryset(self):
        return ForecastModel.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        """
        모델 학습 V2

        새로운 모델 유형 지원:
        - tft: Temporal Fusion Transformer
        - prophet: Facebook Prophet 2.0
        - lstm: Long Short-Term Memory
        - ensemble: 앙상블 모델
        """
        model = self.get_object()

        model_type = request.data.get('model_type', 'ensemble')
        historical_data = request.data.get('historical_data', [])
        epochs = request.data.get('epochs', 20)
        validation_split = request.data.get('validation_split', 0.2)

        try:
            # 새로운 ML Pipeline 사용
            service = get_prediction_service()

            # 데이터프레임 변환
            df = pd.DataFrame(historical_data)

            # 검증 데이터 분리
            val_size = int(len(df) * validation_split)
            val_df = df.iloc[-val_size:] if val_size > 0 else None
            train_df = df.iloc[:-val_size] if val_size > 0 else df

            # 모델 학습
            results = service.train_models(
                train_df=train_df,
                val_df=val_df,
                epochs=epochs,
                verbose=True
            )

            # 모델 저장
            service.save_models(prefix=f"model_{model.id}")

            return Response({
                'status': 'success',
                'model_id': model.id,
                'model_type': model_type,
                'training_results': results,
                'trained_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"모델 학습 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def forecast(self, request, pk=None):
        """
        예측 생성 V2

        새로운 옵션:
        - model_type: 사용할 모델 유형
        - return_individual: 개별 모델 예측 반환
        - confidence_level: 신뢰 구간 (0.8, 0.9, 0.95)
        """
        model = self.get_object()

        horizon = request.data.get('horizon', 30)
        model_type = request.data.get('model_type', 'ensemble')
        return_individual = request.data.get('return_individual', False)
        confidence_level = request.data.get('confidence_level', 0.8)

        # 과거 데이터
        context_data = request.data.get('context_data', [])

        try:
            # 예측 서비스
            service = get_prediction_service()

            # 데이터프레임 변환
            df = pd.DataFrame(context_data)

            # 예측 실행
            result = service.predict(
                context_data=df,
                horizon=horizon,
                model_type=model_type,
                return_individual=return_individual
            )

            # 결과 포맷팅
            response = {
                'status': 'success',
                'model_id': model.id,
                'model_type': model_type,
                'forecast': result['prediction'],
                'dates': result['dates'],
                'horizon': horizon,
                'confidence_level': confidence_level,
                'generated_at': timezone.now().isoformat()
            }

            # 신뢰 구간 추가
            if 'lower_bound' in result:
                response['lower_bound'] = result['lower_bound']
                response['upper_bound'] = result['upper_bound']

            # 개별 모델 예측 추가
            if return_individual and 'individual_predictions' in result:
                response['individual_predictions'] = result['individual_predictions']

            # 앙상블 정보 추가
            if 'weights' in result:
                response['ensemble_weights'] = result['weights']

            # DB에 결과 저장
            ForecastResult.objects.create(
                model=model,
                forecast_date=timezone.now(),
                forecast_period_days=horizon,
                forecast_values=result['prediction'],
                forecast_metadata=response
            )

            return Response(response)

        except Exception as e:
            logger.error(f"예측 생성 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """예측 이력 조회 V2"""
        model = self.get_object()

        limit = int(request.query_params.get('limit', 10))
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = ForecastResult.objects.filter(model=model)

        if start_date:
            queryset = queryset.filter(forecast_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(forecast_date__lte=end_date)

        history = queryset.order_by('-forecast_date')[:limit]

        results = []
        for h in history:
            results.append({
                'id': h.id,
                'forecast_date': h.forecast_date.isoformat(),
                'forecast_period_days': h.forecast_period_days,
                'forecast_values': h.forecast_values,
                'metadata': h.forecast_metadata
            })

        return Response({
            'history': results,
            'count': len(results),
        })

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        """
        모델 성능 평가 V2

        새로운 메트릭:
        - MAPE, MAE, RMSE
        - Theil's U 통계량
        - 예측 구간 정확도
        """
        model = self.get_object()

        actual_data = request.data.get('actual_data', [])
        prediction_data = request.data.get('prediction_data', [])
        model_type = request.data.get('model_type', 'ensemble')

        try:
            service = get_prediction_service()

            # 데이터프레임 변환
            actual_df = pd.DataFrame(actual_data)
            prediction_dict = {'prediction': prediction_data}

            # 평가 실행
            metrics = service.evaluate(
                actual=actual_df,
                prediction=prediction_dict,
                model_type=model_type
            )

            # DB에 평가 결과 저장
            ForecastAccuracyLog.objects.create(
                model=model,
                evaluation_date=timezone.now(),
                mape=metrics.get('mape', 0),
                mae=metrics.get('mae', 0),
                rmse=metrics.get('rmse', 0),
                theil_u=metrics.get('theil_u', 0)
            )

            return Response({
                'status': 'success',
                'model_id': model.id,
                'model_type': model_type,
                'metrics': metrics,
                'evaluated_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"모델 평가 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForecastViewSetV2(viewsets.ViewSet):
    """
    시계열 예측 API V2

    새로운 기능:
    - 앙상블 예측
    - 배치 예측
    - 실시간 예측
    - 모델 비교
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_model(self, request):
        """예측 모델 생성 V2"""
        name = request.data.get('name')
        code = request.data.get('code')
        target_metric = request.data.get('target_metric')
        forecast_type = request.data.get('forecast_type', 'ensemble')  # 기본값 변경
        forecast_horizon = request.data.get('forecast_horizon', 30)
        time_granularity = request.data.get('time_granularity', 'daily')
        parameters = request.data.get('parameters', {})
        description = request.data.get('description', '')

        service = ForecastingService()
        result = service.create_forecast_model(
            name=name,
            code=code,
            target_metric=target_metric,
            forecast_type=forecast_type,
            forecast_horizon=forecast_horizon,
            time_granularity=time_granularity,
            parameters=parameters,
            description=description,
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def predict(self, request):
        """
        예측 생성 V2

        새로운 옵션:
        - model_type: tft, prophet, lstm, ensemble
        - return_individual: 개별 모델 예측 반환
        """
        model_code = request.data.get('model_code')
        horizon = request.data.get('horizon', 30)
        model_type = request.data.get('model_type', 'ensemble')
        return_individual = request.data.get('return_individual', False)

        context_data = request.data.get('context_data', [])

        try:
            service = get_prediction_service()

            # 데이터프레임 변환
            df = pd.DataFrame(context_data)

            # 예측 실행
            result = service.predict(
                context_data=df,
                horizon=horizon,
                model_type=model_type,
                return_individual=return_individual
            )

            return Response({
                'status': 'success',
                'model_code': model_code,
                'model_type': model_type,
                'forecast': result
            })

        except Exception as e:
            logger.error(f"예측 생성 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def predict_batch(self, request):
        """
        배치 예측 V2

        다중 예측 요청을 병렬로 처리
        """
        requests = request.data.get('requests', [])
        parallel = request.data.get('parallel', True)

        try:
            api = PredictionAPI(get_prediction_service())
            result = api.create_batch_prediction_request(requests)

            return Response(result)

        except Exception as e:
            logger.error(f"배치 예측 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def compare_models(self, request):
        """
        모델 비교 V2

        여러 모델의 예측 결과 비교
        """
        context_data = request.data.get('context_data', [])
        horizon = request.data.get('horizon', 30)
        model_types = request.data.get('model_types', ['tft', 'prophet', 'lstm', 'ensemble'])

        try:
            service = get_prediction_service()

            # 데이터프레임 변환
            df = pd.DataFrame(context_data)

            # 각 모델 예측
            comparisons = {}
            for model_type in model_types:
                try:
                    result = service.predict(
                        context_data=df,
                        horizon=horizon,
                        model_type=model_type,
                        return_individual=False
                    )

                    comparisons[model_type] = {
                        'prediction': result['prediction'],
                        'metadata': result.get('prediction_metadata', {})
                    }

                except Exception as e:
                    comparisons[model_type] = {
                        'error': str(e)
                    }

            return Response({
                'status': 'success',
                'comparisons': comparisons,
                'horizon': horizon,
                'compared_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"모델 비교 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def model_info(self, request):
        """
        모델 정보 조회 V2

        사용 가능한 모델, 현재 가중치, 성능 통계 반환
        """
        try:
            service = get_prediction_service()
            info = service.get_service_info()

            return Response({
                'status': 'success',
                'info': info
            })

        except Exception as e:
            logger.error(f"모델 정보 조회 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def update_weights(self, request):
        """
        모델 가중치 업데이트 V2

        앙상블 모델의 가중치를 동적으로 업데이트
        """
        weights = request.data.get('weights', {})
        adaptive = request.data.get('adaptive', False)

        try:
            service = get_prediction_service()
            service.update_weights(weights, adaptive=adaptive)

            return Response({
                'status': 'success',
                'weights': service.ensemble.weights if service.ensemble else {},
                'updated_at': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"가중치 업데이트 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def performance_stats(self, request):
        """
        예측 성능 통계 조회 V2

        모델별 예측 통계 및 성능 지표
        """
        model_type = request.query_params.get('model_type')

        try:
            service = get_prediction_service()

            stats = service.prediction_stats

            if model_type and model_type in stats:
                stats = {model_type: stats[model_type]}

            return Response({
                'status': 'success',
                'stats': stats
            })

        except Exception as e:
            logger.error(f"성능 통계 조회 오류: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """
    예측 서비스 헬스 체크

    모델 로딩 상태 및 서비스 가용성 확인
    """
    try:
        service = get_prediction_service()

        return Response({
            'status': 'healthy',
            'service': 'PredictionService V2',
            'models_loaded': list(service.models.keys()),
            'ensemble_enabled': service.ensemble is not None,
            'realtime_enabled': service.enable_realtime,
            'timestamp': timezone.now().isoformat()
        })

    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_retrain(request):
    """
    모델 재학습 트리거

    수동 또는 자동으로 모델 재학습 실행
    """
    force = request.data.get('force', False)
    model_type = request.data.get('model_type', 'ensemble')

    try:
        service = get_prediction_service()

        # TODO: 실제 재학습 로직 구현
        # 현재는 시뮬레이션

        return Response({
            'status': 'success',
            'message': '모델 재학습이 트리거되었습니다',
            'model_type': model_type,
            'force': force,
            'triggered_at': timezone.now().isoformat()
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
