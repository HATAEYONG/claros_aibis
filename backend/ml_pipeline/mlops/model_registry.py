# ML Pipeline MLOps - Model Registry
# MLflow 기반 모델 레지스트리 및 버전 관리

import os
import json
import pickle
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

try:
    import mlflow
    import mlflow.sklearn
    import mlflow.pytorch
    import mlflow.pyfunc
    from mlflow.tracking import MlflowClient
    from mlflow.entities import ViewType
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    logger.warning("MLflow가 설치되지 않음. 로컬 모델 레지스트리 사용.")


@dataclass
class ModelMetadata:
    """모델 메타데이터"""
    model_name: str
    version: str
    model_type: str  # 'tft', 'prophet', 'lstm', 'ensemble'
    created_at: str
    created_by: str
    description: str
    metrics: Dict[str, float]
    parameters: Dict[str, Any]
    tags: Dict[str, str]
    framework: str  # 'pytorch', 'sklearn', 'custom'
    artifact_path: str
    stage: str  # 'Development', 'Staging', 'Production', 'Archived'

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'ModelMetadata':
        return cls(**data)


@dataclass
class ExperimentInfo:
    """실험 정보"""
    experiment_id: str
    name: str
    artifact_location: str
    lifecycle_stage: str
    creation_time: datetime
    last_update_time: Optional[datetime] = None


class ModelRegistry:
    """
    모델 레지스트리

    MLflow를 활용한 모델 버전 관리 및 추적

    기능:
    - 모델 등록 및 버전 관리
    - 모델 스테이징 (Development → Staging → Production)
    - 모델 메타데이터 관리
    - 모델 아카이빙 및 롤백
    - 실험 추적 및 비교
    """

    def __init__(
        self,
        tracking_uri: Optional[str] = None,
        registry_uri: Optional[str] = None,
        artifact_root: str = 'mlartifacts',
        use_mlflow: bool = True
    ):
        """
        모델 레지스트리 초기화

        Args:
            tracking_uri: MLflow tracking 서버 URI
            registry_uri: MLflow model registry URI
            artifact_root: 아티팩트 저장 경로
            use_mlflow: MLflow 사용 여부 (False인 경우 로컬 파일 사용)
        """
        self.artifact_root = Path(artifact_root)
        self.artifact_root.mkdir(parents=True, exist_ok=True)

        self.use_mlflow = use_mlflow and MLFLOW_AVAILABLE

        if self.use_mlflow:
            # MLflow 설정
            if tracking_uri:
                mlflow.set_tracking_uri(tracking_uri)
            if registry_uri:
                mlflow.set_registry_uri(registry_uri)

            self.client = MlflowClient()
            logger.info(f"MLflow 레지스트리 초기화: tracking_uri={mlflow.get_tracking_uri()}")
        else:
            self.client = None
            # 로컬 레지스트리 초기화
            self._init_local_registry()
            logger.info("로컬 모델 레지스트리 초기화")

        # 로컬 캐시
        self._local_cache: Dict[str, ModelMetadata] = {}

    def _init_local_registry(self):
        """로컬 레지스트리 초기화"""
        self.registry_file = self.artifact_root / 'registry.json'
        self.models_dir = self.artifact_root / 'models'
        self.models_dir.mkdir(exist_ok=True)

        if self.registry_file.exists():
            with open(self.registry_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for model_data in data.get('models', []):
                    metadata = ModelMetadata.from_dict(model_data)
                    key = f"{metadata.model_name}:{metadata.version}"
                    self._local_cache[key] = metadata
        else:
            # 초기 레지스트리 생성
            self._save_local_registry()

    def _save_local_registry(self):
        """로컬 레지스트리 저장"""
        data = {
            'version': '1.0',
            'last_updated': datetime.now().isoformat(),
            'models': [m.to_dict() for m in self._local_cache.values()]
        }
        with open(self.registry_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def register_model(
        self,
        model: Any,
        model_name: str,
        model_type: str,
        metrics: Dict[str, float],
        parameters: Dict[str, Any],
        tags: Optional[Dict[str, str]] = None,
        description: str = '',
        framework: str = 'custom',
        artifact_file: Optional[str] = None
    ) -> ModelMetadata:
        """
        모델 등록

        Args:
            model: 모델 객체
            model_name: 모델 이름
            model_type: 모델 유형 (tft, prophet, lstm, ensemble)
            metrics: 성능 메트릭스 (mape, mae, rmse 등)
            parameters: 하이퍼파라미터
            tags: 태그
            description: 모델 설명
            framework: 프레임워크 (pytorch, sklearn, custom)
            artifact_file: 모델 파일 경로

        Returns:
            모델 메타데이터
        """
        timestamp = datetime.now()
        version = self._generate_version(model_name)

        metadata = ModelMetadata(
            model_name=model_name,
            version=version,
            model_type=model_type,
            created_at=timestamp.isoformat(),
            created_by='system',
            description=description,
            metrics=metrics,
            parameters=parameters,
            tags=tags or {},
            framework=framework,
            artifact_path='',
            stage='Development'
        )

        if self.use_mlflow:
            # MLflow에 모델 등록
            metadata = self._register_mlflow_model(
                model, metadata, artifact_file
            )
        else:
            # 로컬에 모델 저장
            metadata = self._register_local_model(
                model, metadata, artifact_file
            )

        logger.info(f"모델 등록 완료: {model_name}:{version}")
        return metadata

    def _generate_version(self, model_name: str) -> str:
        """버전 생성 (Semantic Versioning)"""
        if self.use_mlflow:
            try:
                versions = self.client.search_model_versions(f"name='{model_name}'")
                if versions:
                    latest_version = int(versions[0].version)
                    return str(latest_version + 1)
            except Exception as e:
                logger.warning(f"버전 조회 실패: {str(e)}")

        return datetime.now().strftime("%Y%m%d_%H%M%S")

    def _register_mlflow_model(
        self,
        model: Any,
        metadata: ModelMetadata,
        artifact_file: Optional[str] = None
    ) -> ModelMetadata:
        """MLflow에 모델 등록"""
        run_name = f"{metadata.model_name}_{metadata.version}"

        with mlflow.start_run(run_name=run_name):
            # 파라미터 로깅
            mlflow.log_params(metadata.parameters)

            # 메트릭 로깅
            mlflow.log_metrics(metadata.metrics)

            # 태그 로깅
            mlflow.set_tags(metadata.tags)

            # 모델 저장
            if metadata.framework == 'pytorch' and mlflow.pytorch:
                mlflow.pytorch.log_model(model, 'model')
            elif metadata.framework == 'sklearn' and mlflow.sklearn:
                mlflow.sklearn.log_model(model, 'model')
            else:
                # 커스텀 모델
                if artifact_file:
                    mlflow.log_artifact(artifact_file, 'model')
                else:
                    # 피클로 저장
                    model_path = self.artifact_root / f"{metadata.model_name}_{metadata.version}.pkl"
                    with open(model_path, 'wb') as f:
                        pickle.dump(model, f)
                    mlflow.log_artifact(str(model_path), 'model')

            # 모델 등록
            run_id = mlflow.active_run().info.run_id
            model_uri = f"runs:/{run_id}/model"

            try:
                mlflow.register_model(
                    model_uri=model_uri,
                    name=metadata.model_name,
                    tags=metadata.tags
                )

                metadata.artifact_path = model_uri
                metadata.stage = 'Development'

            except Exception as e:
                logger.warning(f"모델 레지스트리 등록 실패: {str(e)}")

        return metadata

    def _register_local_model(
        self,
        model: Any,
        metadata: ModelMetadata,
        artifact_file: Optional[str] = None
    ) -> ModelMetadata:
        """로컬에 모델 등록"""
        # 모델 파일 저장
        if artifact_file:
            model_path = self.models_dir / Path(artifact_file).name
            if Path(artifact_file).exists():
                import shutil
                shutil.copy(artifact_file, model_path)
        else:
            model_path = self.models_dir / f"{metadata.model_name}_{metadata.version}.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)

        metadata.artifact_path = str(model_path)

        # 캐시 및 레지스트리 저장
        key = f"{metadata.model_name}:{metadata.version}"
        self._local_cache[key] = metadata
        self._save_local_registry()

        return metadata

    def get_model(
        self,
        model_name: str,
        version: Optional[str] = None,
        stage: Optional[str] = None
    ) -> tuple[Any, ModelMetadata]:
        """
        모델 로드

        Args:
            model_name: 모델 이름
            version: 버전 (None인 경우 최신 버전)
            stage: 스테이지 (Production, Staging, Development)

        Returns:
            (모델 객체, 메타데이터)
        """
        if self.use_mlflow:
            return self._get_mlflow_model(model_name, version, stage)
        else:
            return self._get_local_model(model_name, version, stage)

    def _get_mlflow_model(
        self,
        model_name: str,
        version: Optional[str],
        stage: Optional[str]
    ) -> tuple[Any, ModelMetadata]:
        """MLflow에서 모델 로드"""
        if stage:
            # 스테이지 기반 로드
            model_uri = f"models:/{model_name}/{stage}"
        else:
            # 버전 기반 로드
            version = version or self._get_latest_version(model_name)
            model_uri = f"models:/{model_name}/{version}"

        # 모델 로드
        model = mlflow.pyfunc.load_model(model_uri)

        # 메타데이터 조회
        model_version_info = self.client.get_model_version(model_name, version or self._get_latest_version(model_name))

        metadata = ModelMetadata(
            model_name=model_name,
            version=version or self._get_latest_version(model_name),
            model_type=model_version_info.tags.get('model_type', 'unknown'),
            created_at=datetime.fromtimestamp(model_version_info.creation_timestamp / 1000).isoformat(),
            created_by=model_version_info.user_id or 'unknown',
            description=model_version_info.description or '',
            metrics={},
            parameters={},
            tags=model_version_info.tags or {},
            framework='mlflow',
            artifact_path=model_uri,
            stage=model_version_info.current_stage
        )

        return model, metadata

    def _get_local_model(
        self,
        model_name: str,
        version: Optional[str],
        stage: Optional[str]
    ) -> tuple[Any, ModelMetadata]:
        """로컬에서 모델 로드"""
        if stage:
            # 스테이지 필터링
            candidates = [
                m for m in self._local_cache.values()
                if m.model_name == model_name and m.stage == stage
            ]
            if not candidates:
                raise ValueError(f"{stage} 스테이지의 모델 없음: {model_name}")
            metadata = sorted(candidates, key=lambda x: x.created_at, reverse=True)[0]
        else:
            # 버전 또는 최신 버전
            if version:
                key = f"{model_name}:{version}"
                if key not in self._local_cache:
                    raise ValueError(f"모델 없음: {model_name}:{version}")
                metadata = self._local_cache[key]
            else:
                candidates = [
                    m for m in self._local_cache.values()
                    if m.model_name == model_name
                ]
                if not candidates:
                    raise ValueError(f"모델 없음: {model_name}")
                metadata = sorted(candidates, key=lambda x: x.created_at, reverse=True)[0]

        # 모델 로드
        with open(metadata.artifact_path, 'rb') as f:
            model = pickle.load(f)

        return model, metadata

    def _get_latest_version(self, model_name: str) -> str:
        """최신 버전 조회"""
        if self.use_mlflow:
            versions = self.client.search_model_versions(f"name='{model_name}'")
            if versions:
                return versions[0].version
        return "1"

    def transition_model_stage(
        self,
        model_name: str,
        version: str,
        new_stage: str
    ) -> bool:
        """
        모델 스테이지 전환

        Args:
            model_name: 모델 이름
            version: 버전
            new_stage: 새로운 스테이지 (Production, Staging, Development, Archived)

        Returns:
            성공 여부
        """
        valid_stages = ['Development', 'Staging', 'Production', 'Archived']
        if new_stage not in valid_stages:
            raise ValueError(f"잘못된 스테이지: {new_stage}")

        if self.use_mlflow:
            try:
                self.client.transition_model_version_stage(
                    name=model_name,
                    version=version,
                    stage=new_stage
                )
                logger.info(f"스테이지 전환: {model_name}:{version} → {new_stage}")
                return True
            except Exception as e:
                logger.error(f"스테이지 전환 실패: {str(e)}")
                return False
        else:
            # 로컬 레지스트리 업데이트
            key = f"{model_name}:{version}"
            if key in self._local_cache:
                self._local_cache[key].stage = new_stage
                self._save_local_registry()
                logger.info(f"스테이지 전환: {model_name}:{version} → {new_stage}")
                return True
            return False

    def list_models(
        self,
        model_name: Optional[str] = None,
        stage: Optional[str] = None
    ) -> List[ModelMetadata]:
        """
        모델 목록 조회

        Args:
            model_name: 필터링할 모델 이름
            stage: 필터링할 스테이지

        Returns:
            모델 메타데이터 리스트
        """
        if self.use_mlflow:
            return self._list_mlflow_models(model_name, stage)
        else:
            return self._list_local_models(model_name, stage)

    def _list_mlflow_models(
        self,
        model_name: Optional[str],
        stage: Optional[str]
    ) -> List[ModelMetadata]:
        """MLflow 모델 목록 조회"""
        filter_str = ""
        if model_name:
            filter_str = f"name='{model_name}'"

        models = self.client.search_model_versions(filter_str)

        result = []
        for model in models:
            if stage and model.current_stage != stage:
                continue

            metadata = ModelMetadata(
                model_name=model.name,
                version=model.version,
                model_type=model.tags.get('model_type', 'unknown'),
                created_at=datetime.fromtimestamp(model.creation_timestamp / 1000).isoformat(),
                created_by=model.user_id or 'unknown',
                description=model.description or '',
                metrics={},  # MLflow API에서 별도 조회 필요
                parameters={},
                tags=model.tags or {},
                framework='mlflow',
                artifact_path=f"models:/{model.name}/{model.version}",
                stage=model.current_stage
            )
            result.append(metadata)

        return result

    def _list_local_models(
        self,
        model_name: Optional[str],
        stage: Optional[str]
    ) -> List[ModelMetadata]:
        """로컬 모델 목록 조회"""
        models = list(self._local_cache.values())

        if model_name:
            models = [m for m in models if m.model_name == model_name]
        if stage:
            models = [m for m in models if m.stage == stage]

        return sorted(models, key=lambda x: x.created_at, reverse=True)

    def delete_model(
        self,
        model_name: str,
        version: str
    ) -> bool:
        """
        모델 삭제

        Args:
            model_name: 모델 이름
            version: 버전

        Returns:
            성공 여부
        """
        if self.use_mlflow:
            try:
                self.client.delete_model_version(
                    name=model_name,
                    version=version
                )
                logger.info(f"모델 삭제: {model_name}:{version}")
                return True
            except Exception as e:
                logger.error(f"모델 삭제 실패: {str(e)}")
                return False
        else:
            key = f"{model_name}:{version}"
            if key in self._local_cache:
                # 파일 삭제
                metadata = self._local_cache[key]
                if Path(metadata.artifact_path).exists():
                    Path(metadata.artifact_path).unlink()

                # 캐시에서 삭제
                del self._local_cache[key]
                self._save_local_registry()

                logger.info(f"모델 삭제: {model_name}:{version}")
                return True
            return False

    def get_model_info(
        self,
        model_name: str,
        version: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        모델 상세 정보 조회

        Args:
            model_name: 모델 이름
            version: 버전

        Returns:
            모델 정보 딕셔너리
        """
        if self.use_mlflow:
            version = version or self._get_latest_version(model_name)
            model_version = self.client.get_model_version(model_name, version)

            return {
                'name': model_version.name,
                'version': model_version.version,
                'stage': model_version.current_stage,
                'description': model_version.description,
                'created_at': datetime.fromtimestamp(model_version.creation_timestamp / 1000).isoformat(),
                'created_by': model_version.user_id,
                'tags': model_version.tags,
                'run_id': model_version.run_id,
                'source': model_version.source
            }
        else:
            key = f"{model_name}:{version}"
            if key in self._local_cache:
                return self._local_cache[key].to_dict()
            return {}

    def compare_models(
        self,
        model_name: str,
        version_a: str,
        version_b: str
    ) -> Dict[str, Any]:
        """
        모델 버전 비교

        Args:
            model_name: 모델 이름
            version_a: 비교할 버전 A
            version_b: 비교할 버전 B

        Returns:
            비교 결과
        """
        info_a = self.get_model_info(model_name, version_a)
        info_b = self.get_model_info(model_name, version_b)

        return {
            'model_name': model_name,
            'version_a': {
                'version': version_a,
                'metrics': info_a.get('metrics', {}),
                'stage': info_a.get('stage', '')
            },
            'version_b': {
                'version': version_b,
                'metrics': info_b.get('metrics', {}),
                'stage': info_b.get('stage', '')
            },
            'comparison': {
                'mape_diff': (
                    info_b.get('metrics', {}).get('mape', 0) -
                    info_a.get('metrics', {}).get('mape', 0)
                ),
                'mae_diff': (
                    info_b.get('metrics', {}).get('mae', 0) -
                    info_a.get('metrics', {}).get('mae', 0)
                ),
                'rmse_diff': (
                    info_b.get('metrics', {}).get('rmse', 0) -
                    info_a.get('metrics', {}).get('rmse', 0)
                )
            }
        }


class ExperimentTracker:
    """
    실험 추적 시스템

    MLflow Experiments를 활용한 실험 관리
    """

    def __init__(
        self,
        tracking_uri: Optional[str] = None,
        experiment_name: str = 'ml_pipeline_experiments'
    ):
        """
        실험 추적기 초기화

        Args:
            tracking_uri: MLflow tracking URI
            experiment_name: 실험 이름
        """
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)

        self.experiment_name = experiment_name
        self.experiment_id = self._get_or_create_experiment()

        logger.info(f"실험 추적기 초기화: {experiment_name} ({self.experiment_id})")

    def _get_or_create_experiment(self) -> str:
        """실험 ID 조회 또는 생성"""
        if not MLFLOW_AVAILABLE:
            return 'local'

        try:
            experiment = mlflow.get_experiment_by_name(self.experiment_name)
            if experiment:
                return experiment.experiment_id

            # 새 실험 생성
            experiment_id = mlflow.create_experiment(
                name=self.experiment_name,
                artifact_location=f'mlartifacts/{self.experiment_name}',
                tags={'purpose': 'ml_pipeline_experiments'}
            )
            return experiment_id

        except Exception as e:
            logger.error(f"실험 생성 실패: {str(e)}")
            return 'local'

    def start_run(
        self,
        run_name: str,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        실험 런 시작

        Args:
            run_name: 런 이름
            tags: 태그
        """
        if MLFLOW_AVAILABLE:
            mlflow.start_run(
                run_name=run_name,
                experiment_id=self.experiment_id,
                tags=tags
            )

    def log_params(self, params: Dict[str, Any]):
        """하이퍼파라미터 로깅"""
        if MLFLOW_AVAILABLE and mlflow.active_run():
            mlflow.log_params(params)

    def log_metrics(
        self,
        metrics: Dict[str, float],
        step: Optional[int] = None
    ):
        """메트릭 로깅"""
        if MLFLOW_AVAILABLE and mlflow.active_run():
            mlflow.log_metrics(metrics, step=step)

    def log_model(
        self,
        model: Any,
        artifact_path: str = 'model',
        framework: str = 'sklearn'
    ):
        """모델 로깅"""
        if MLFLOW_AVAILABLE and mlflow.active_run():
            if framework == 'pytorch' and mlflow.pytorch:
                mlflow.pytorch.log_model(model, artifact_path)
            elif framework == 'sklearn' and mlflow.sklearn:
                mlflow.sklearn.log_model(model, artifact_path)
            else:
                # 커스텀 모델 - 피클로 저장
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pkl') as f:
                    pickle.dump(model, f)
                    mlflow.log_artifact(f.name, artifact_path)

    def log_artifact(self, file_path: str, artifact_path: Optional[str] = None):
        """아티팩트 로깅"""
        if MLFLOW_AVAILABLE and mlflow.active_run():
            mlflow.log_artifact(file_path, artifact_path)

    def end_run(self, status: str = 'FINISHED'):
        """실험 런 종료"""
        if MLFLOW_AVAILABLE and mlflow.active_run():
            mlflow.end_run(status=status)

    def get_runs(
        self,
        max_results: int = 100,
        order_by: List[str] = ['metrics.mape ASC']
    ) -> List[Dict]:
        """
        실험 런 목록 조회

        Args:
            max_results: 최대 결과 수
            order_by: 정렬 기준

        Returns:
            런 정보 리스트
        """
        if not MLFLOW_AVAILABLE:
            return []

        try:
            from mlflow.entities import ViewType

            runs = mlflow.search_runs(
                experiment_ids=[self.experiment_id],
                max_results=max_results,
                order_by=order_by,
                view_type=ViewType.ACTIVE_ONLY
            )

            result = []
            for run in runs:
                result.append({
                    'run_id': run.info.run_id,
                    'name': run.info.run_name,
                    'status': run.info.status,
                    'start_time': datetime.fromtimestamp(run.info.start_time / 1000).isoformat(),
                    'metrics': run.data.metrics,
                    'params': run.data.params
                })

            return result

        except Exception as e:
            logger.error(f"런 조회 실패: {str(e)}")
            return []

    def get_best_run(self, metric_name: str = 'mape') -> Optional[Dict]:
        """
        최적 실험 런 조회

        Args:
            metric_name: 기준 메트릭명

        Returns:
            최적 런 정보
        """
        runs = self.get_runs(order_by=[f'metrics.{metric_name} ASC'])
        return runs[0] if runs else None
