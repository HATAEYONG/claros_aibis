# ML Pipeline Upgrade - Unified Prediction Service
# 통합 예측 서비스: 모든 예측 모델을 관리하고 API 제공

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta
import json
import logging
from pathlib import Path
import pickle
import joblib

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from .tft_model import TFTForecaster, ProphetForecaster, LSTMForecaster
from .ensemble_model import PredictionEnsemble, AdaptiveEnsemble
from .feature_engineering import AdvancedFeatureEngineering
from .realtime_pipeline import RealtimeDataPipeline, PredictionTrigger


class PredictionService:
    """
    통합 예측 서비스

    기능:
    - 다중 모델 예측 관리
    - 앙상블 예측 조정
    - 실시간 예측 업데이트
    - 모델 성능 모니터링
    - A/B 테스트 지원
    - 예측 결과 캐싱

    특징:
    - 단일 인터페이스로 모든 예측 모델 접근
    - 자동 모델 선택 및 가중치 조정
    - 예측 불확실성 정량화
    - 실시간 데이터 기반 재학습
    """

    def __init__(
        self,
        model_dir: str = 'models/saved_models',
        cache_predictions: bool = True,
        cache_ttl_seconds: int = 3600,  # 1시간
        enable_realtime: bool = True,
        enable_ab_testing: bool = False
    ):
        """
        예측 서비스 초기화

        Args:
            model_dir: 저장된 모델 디렉토리
            cache_predictions: 예측 결과 캐싱 여부
            cache_ttl_seconds: 캐시 유효 시간
            enable_realtime: 실시간 업데이트 활성화
            enable_ab_testing: A/B 테스트 활성화
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.cache_predictions = cache_predictions
        self.cache_ttl_seconds = cache_ttl_seconds
        self.enable_realtime = enable_realtime
        self.enable_ab_testing = enable_ab_testing

        # 예측 캐시
        self.prediction_cache: Dict[str, Tuple[Dict, datetime]] = {}

        # 모델 초기화
        self.models: Dict[str, object] = {}
        self.ensemble: Optional[PredictionEnsemble] = None
        self.adaptive_ensemble: Optional[AdaptiveEnsemble] = None

        # 피처 엔지니어링
        self.feature_engineer = AdvancedFeatureEngineering()

        # 실시간 파이프라인
        self.realtime_pipeline: Optional[RealtimeDataPipeline] = None
        self.prediction_trigger: Optional[PredictionTrigger] = None

        # A/B 테스트
        self.ab_test_groups: Dict[str, str] = {}
        self.ab_test_results: Dict[str, List[Dict]] = {}

        # 통계
        self.prediction_stats: Dict[str, Dict] = {}

        logger.info("PredictionService 초기화 완료")

    def initialize_models(
        self,
        model_types: List[str] = ['tft', 'prophet', 'lstm'],
        use_ensemble: bool = True,
        ensemble_method: str = 'weighted_average'
    ):
        """
        예측 모델 초기화

        Args:
            model_types: 사용할 모델 유형 리스트
            use_ensemble: 앙상블 사용 여부
            ensemble_method: 앙상블 방법
        """
        logger.info(f"모델 초기화 시작: {model_types}")

        # 개별 모델 초기화
        for model_type in model_types:
            try:
                if model_type == 'tft':
                    self.models['tft'] = TFTForecaster(
                        context_length=90,
                        prediction_length=30,
                        quantiles=[0.1, 0.5, 0.9]
                    )
                elif model_type == 'prophet':
                    self.models['prophet'] = ProphetForecaster(
                        seasonality_mode='multiplicative',
                        yearly_seasonality=True,
                        weekly_seasonality=True
                    )
                elif model_type == 'lstm':
                    self.models['lstm'] = LSTMForecaster(
                        sequence_length=30,
                        hidden_units=[64, 32],
                        dropout=0.2
                    )

                logger.info(f"{model_type} 모델 초기화 완료")

            except Exception as e:
                logger.error(f"{model_type} 모델 초기화 실패: {str(e)}")

        # 앙상블 초기화
        if use_ensemble and self.models:
            self.ensemble = PredictionEnsemble(
                models=self.models,
                ensemble_method=ensemble_method
            )

            # 적응형 앙상블 초기화
            self.adaptive_ensemble = AdaptiveEnsemble(self.ensemble)

            logger.info(f"앙상블 초기화 완료 (method: {ensemble_method})")

        # 실시간 파이프라인 초기화
        if self.enable_realtime:
            self.realtime_pipeline = RealtimeDataPipeline(
                enable_auto_retraining=True,
                retraining_threshold=0.15
            )

            # 예측 트리거
            self.prediction_trigger = PredictionTrigger(
                trigger_interval=300,  # 5분
                min_data_points=30,
                prediction_horizon=30
            )

            # 이벤트 핸들러 등록
            self.realtime_pipeline.register_event_handler(
                'on_prediction_trigger',
                self._on_realtime_data
            )

            logger.info("실시간 파이프라인 초기화 완료")

    def _on_realtime_data(self, data: pd.DataFrame):
        """실시간 데이터 수신 시 핸들러"""
        if self.prediction_trigger and self.prediction_trigger.should_trigger(len(data)):
            logger.info("실시간 예측 트리거 발생")
            self.prediction_trigger.update_last_trigger()

    def train_models(
        self,
        train_df: pd.DataFrame,
        val_df: Optional[pd.DataFrame] = None,
        epochs: int = 20,
        verbose: bool = True
    ) -> Dict[str, Dict]:
        """
        모든 모델 학습

        Args:
            train_df: 학습 데이터
            val_df: 검증 데이터
            epochs: 학습 에포크
            verbose: 진행 상황 출력

        Returns:
            학습 결과 딕셔너리
        """
        logger.info("모델 학습 시작")

        # 피처 엔지니어링
        train_df = self.feature_engineer.create_features(train_df)
        if val_df is not None:
            val_df = self.feature_engineer.create_features(val_df)

        # 앙상블 학습 (모든 모델 학습)
        if self.ensemble:
            results = self.ensemble.fit(
                train_df,
                val_df,
                verbose=verbose
            )

            logger.info("모델 학습 완료")
            return results

        return {}

    def predict(
        self,
        context_data: pd.DataFrame,
        horizon: int = 30,
        model_type: str = 'ensemble',
        return_individual: bool = False,
        use_cache: bool = True,
        cache_key: Optional[str] = None
    ) -> Dict:
        """
        예측 수행

        Args:
            context_data: 과거 데이터
            horizon: 예측 기간
            model_type: 사용할 모델 ('ensemble', 'tft', 'prophet', 'lstm')
            return_individual: 개별 모델 예측 반환 여부
            use_cache: 캐시 사용 여부
            cache_key: 캐시 키 (None = 자동 생성)

        Returns:
            예측 결과 딕셔너리
        """
        # 캐시 확인
        if use_cache and self.cache_predictions:
            key = cache_key or self._generate_cache_key(context_data, horizon, model_type)
            cached_result = self._get_from_cache(key)
            if cached_result is not None:
                logger.info(f"캐시된 예측 반환: {key}")
                return cached_result

        logger.info(f"예측 실행: model_type={model_type}, horizon={horizon}")

        # 피처 엔지니어링
        context_data = self.feature_engineer.create_features(context_data)

        try:
            # 앙상블 예측
            if model_type == 'ensemble' and self.ensemble:
                result = self.ensemble.predict(
                    context_data=context_data,
                    horizon=horizon,
                    return_individual=return_individual,
                    verbose=False
                )

            # 개별 모델 예측
            elif model_type in self.models:
                model = self.models[model_type]
                result = model.predict(
                    context_data=context_data,
                    horizon=horizon
                )

            else:
                raise ValueError(f"알 수 없는 모델 유형: {model_type}")

            # 메타데이터 추가
            result['prediction_metadata'] = {
                'model_type': model_type,
                'horizon': horizon,
                'context_data_points': len(context_data),
                'prediction_timestamp': datetime.now().isoformat(),
                'service_version': '2.0'
            }

            # 캐시 저장
            if use_cache and self.cache_predictions:
                key = cache_key or self._generate_cache_key(context_data, horizon, model_type)
                self._save_to_cache(key, result)

            # 통계 업데이트
            self._update_prediction_stats(model_type, result)

            return result

        except Exception as e:
            logger.error(f"예측 오류: {str(e)}")
            raise

    def predict_batch(
        self,
        predictions: List[Dict],
        parallel: bool = True
    ) -> List[Dict]:
        """
        배치 예측

        Args:
            predictions: 예측 요청 리스트
            parallel: 병렬 처리 여부

        Returns:
            예측 결과 리스트
        """
        logger.info(f"배치 예측 시작: {len(predictions)}개 요청")

        results = []

        if parallel:
            # 병렬 처리 (실제 구현에서는 concurrent.futures 사용)
            from concurrent.futures import ThreadPoolExecutor

            with ThreadPoolExecutor(max_workers=4) as executor:
                future_to_pred = {
                    executor.submit(self.predict, **pred): pred
                    for pred in predictions
                }

                for future in future_to_pred:
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        logger.error(f"배치 예측 오류: {str(e)}")
                        results.append({'error': str(e)})
        else:
            # 순차 처리
            for pred in predictions:
                try:
                    result = self.predict(**pred)
                    results.append(result)
                except Exception as e:
                    logger.error(f"배치 예측 오류: {str(e)}")
                    results.append({'error': str(e)})

        logger.info(f"배치 예측 완료: {len(results)}개 결과")
        return results

    def evaluate(
        self,
        actual: pd.DataFrame,
        prediction: Dict,
        model_type: str = 'ensemble'
    ) -> Dict[str, float]:
        """
        예측 성능 평가

        Args:
            actual: 실제 데이터
            prediction: 예측 결과
            model_type: 모델 유형

        Returns:
            평가 메트릭스
        """
        if model_type == 'ensemble' and self.ensemble:
            metrics = self.ensemble.evaluate(actual, prediction)
        elif model_type in self.models:
            model = self.models[model_type]
            metrics = model.evaluate(actual, prediction)
        else:
            raise ValueError(f"알 수 없는 모델 유형: {model_type}")

        logger.info(f"{model_type} 평가 완료: MAPE={metrics.get('mape', 'N/A')}%")
        return metrics

    def _generate_cache_key(
        self,
        context_data: pd.DataFrame,
        horizon: int,
        model_type: str
    ) -> str:
        """캐시 키 생성"""
        # 데이터의 해시 기반 키 생성
        data_hash = hash(str(context_data.index[-1]) + str(len(context_data)))
        return f"{model_type}_{horizon}_{data_hash}"

    def _get_from_cache(self, key: str) -> Optional[Dict]:
        """캐시에서 가져오기"""
        if key in self.prediction_cache:
            result, timestamp = self.prediction_cache[key]
            age = (datetime.now() - timestamp).total_seconds()

            if age <= self.cache_ttl_seconds:
                return result
            else:
                # 만료된 캐시 삭제
                del self.prediction_cache[key]

        return None

    def _save_to_cache(self, key: str, result: Dict):
        """캐시에 저장"""
        self.prediction_cache[key] = (result, datetime.now())

        # 캐시 크기 제한
        if len(self.prediction_cache) > 100:
            # 가장 오래된 캐시 삭제
            oldest_key = min(
                self.prediction_cache.keys(),
                key=lambda k: self.prediction_cache[k][1]
            )
            del self.prediction_cache[oldest_key]

    def _update_prediction_stats(self, model_type: str, result: Dict):
        """예측 통계 업데이트"""
        if model_type not in self.prediction_stats:
            self.prediction_stats[model_type] = {
                'total_predictions': 0,
                'total_horizon': 0,
                'last_prediction': None
            }

        self.prediction_stats[model_type]['total_predictions'] += 1
        self.prediction_stats[model_type]['total_horizon'] += result.get('horizon', 0)
        self.prediction_stats[model_type]['last_prediction'] = datetime.now().isoformat()

    def save_models(self, prefix: str = 'model'):
        """모델 저장"""
        logger.info("모델 저장 시작")

        for model_name, model in self.models.items():
            model_path = self.model_dir / f"{prefix}_{model_name}.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"{model_name} 모델 저장 완료: {model_path}")

    def load_models(self, prefix: str = 'model'):
        """모델 로드"""
        logger.info("모델 로드 시작")

        for model_name in self.models.keys():
            model_path = self.model_dir / f"{prefix}_{model_name}.pkl"

            if model_path.exists():
                with open(model_path, 'rb') as f:
                    self.models[model_name] = pickle.load(f)
                logger.info(f"{model_name} 모델 로드 완료: {model_path}")
            else:
                logger.warning(f"{model_name} 모델 파일 없음: {model_path}")

    def get_service_info(self) -> Dict:
        """서비스 정보 반환"""
        return {
            'models': list(self.models.keys()),
            'ensemble_method': self.ensemble.ensemble_method if self.ensemble else None,
            'realtime_enabled': self.enable_realtime,
            'ab_testing_enabled': self.enable_ab_testing,
            'cache_enabled': self.cache_predictions,
            'cache_size': len(self.prediction_cache),
            'prediction_stats': self.prediction_stats
        }

    def clear_cache(self):
        """캐시 비우기"""
        self.prediction_cache.clear()
        logger.info("예측 캐시 비움")

    def update_weights(
        self,
        new_weights: Dict[str, float],
        adaptive: bool = False
    ):
        """
        모델 가중치 업데이트

        Args:
            new_weights: 새로운 가중치
            adaptive: 적응형 업데이트 여부
        """
        if self.ensemble:
            if adaptive:
                # 부드러운 업데이트
                for model_name, new_weight in new_weights.items():
                    old_weight = self.ensemble.weights.get(model_name, 0)
                    self.ensemble.weights[model_name] = 0.7 * old_weight + 0.3 * new_weight
            else:
                # 즉시 업데이트
                self.ensemble.weights.update(new_weights)

            logger.info(f"가중치 업데이트 완료: {self.ensemble.weights}")


class PredictionAPI:
    """
    예측 API 래퍼

    Django REST Framework와 통합을 위한 API 인터페이스
    """

    def __init__(self, service: PredictionService):
        self.service = service

    def create_prediction_request(
        self,
        data: Dict,
        horizon: int = 30,
        model_type: str = 'ensemble'
    ) -> Dict:
        """
        예측 요청 생성

        Args:
            data: 요청 데이터
            horizon: 예측 기간
            model_type: 모델 유형

        Returns:
            예측 응답
        """
        try:
            # 데이터프레임 변환
            df = pd.DataFrame(data)

            # 예측 실행
            result = self.service.predict(
                context_data=df,
                horizon=horizon,
                model_type=model_type
            )

            return {
                'status': 'success',
                'data': result
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    def create_batch_prediction_request(
        self,
        requests: List[Dict]
    ) -> Dict:
        """
        배치 예측 요청 생성

        Args:
            requests: 요청 리스트

        Returns:
            배치 예측 응답
        """
        try:
            results = self.service.predict_batch(requests)

            return {
                'status': 'success',
                'data': {
                    'results': results,
                    'total': len(results),
                    'success': sum(1 for r in results if 'error' not in r),
                    'failed': sum(1 for r in results if 'error' in r)
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    def get_model_info(self) -> Dict:
        """모델 정보 반환"""
        return {
            'status': 'success',
            'data': self.service.get_service_info()
        }

    def get_prediction_stats(self) -> Dict:
        """예측 통계 반환"""
        return {
            'status': 'success',
            'data': self.service.prediction_stats
        }


# 전역 서비스 인스턴스
_prediction_service: Optional[PredictionService] = None


def get_prediction_service() -> PredictionService:
    """전역 예측 서비스 인스턴스 반환"""
    global _prediction_service

    if _prediction_service is None:
        _prediction_service = PredictionService()
        _prediction_service.initialize_models()

    return _prediction_service
