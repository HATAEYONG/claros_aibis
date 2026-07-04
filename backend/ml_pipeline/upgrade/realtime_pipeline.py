# ML Pipeline Upgrade - Real-time Data Pipeline
# 실시간 데이터 수집 및 처리 파이프라인

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
import json
import asyncio
from dataclasses import dataclass
from enum import Enum
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataSourceType(Enum):
    """데이터 소스 유형"""
    KAFKA = 'kafka'
    WEBSOCKET = 'websocket'
    REST_API = 'rest_api'
    DATABASE = 'database'
    FILE = 'file'


@dataclass
class DataStream:
    """데이터 스트림 메타데이터"""
    source_id: str
    source_type: DataSourceType
    topic: str
    schema: Dict[str, str]
    update_frequency: str  # 'realtime', '1min', '5min', '1hour'


class RealtimeDataPipeline:
    """
    실시간 데이터 파이프라인

    기능:
    - Kafka/WebSocket 실시간 데이터 수집
    - 스트리밍 데이터 전처리
    - 이상치 탐지 및 처리
    - 온라인 피처 업데이트
    - 모델 예측 트리거

    특징:
    - 이벤트 기반 아키텍처
    - 비동기 처리
    - 장애 복구 메커니즘
    - 백프레셔 처리
    """

    def __init__(
        self,
        buffer_size: int = 1000,
        processing_batch_size: int = 100,
        anomaly_detection_method: str = 'isolation_forest',
        enable_auto_retraining: bool = True,
        retraining_threshold: float = 0.15  # MAPE 15% 초과 시 재학습
    ):
        """
        실시간 파이프라인 초기화

        Args:
            buffer_size: 데이터 버퍼 크기
            processing_batch_size: 배치 처리 크기
            anomaly_detection_method: 이상치 탐지 방법
            enable_auto_retraining: 자동 재학습 활성화
            retraining_threshold: 재학습 트리거 임계값
        """
        self.buffer_size = buffer_size
        self.processing_batch_size = processing_batch_size
        self.anomaly_detection_method = anomaly_detection_method
        self.enable_auto_retraining = enable_auto_retraining
        self.retraining_threshold = retraining_threshold

        # 데이터 버퍼
        self.data_buffer: List[Dict] = []
        self.processed_data: List[Dict] = []

        # 이상치 탐지 모델
        self.anomaly_detector = None
        self._init_anomaly_detector()

        # 피처 엔지니어링
        from .feature_engineering import AdvancedFeatureEngineering
        self.feature_engineer = AdvancedFeatureEngineering()

        # 성능 모니터링
        self.prediction_errors: List[float] = []
        self.model_performance: Dict[str, List[float]] = {
            'mape': [],
            'mae': [],
            'rmse': []
        }

        # 이벤트 핸들러
        self.event_handlers: Dict[str, List[Callable]] = {
            'on_data_received': [],
            'on_anomaly_detected': [],
            'on_prediction_trigger': [],
            'on_model_retrain': []
        }

        logger.info("RealtimeDataPipeline 초기화 완료")

    def _init_anomaly_detector(self):
        """이상치 탐지 모델 초기화"""
        if self.anomaly_detection_method == 'isolation_forest':
            from sklearn.ensemble import IsolationForest
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_jobs=-1
            )
        elif self.anomaly_detection_method == 'local_outlier_factor':
            from sklearn.neighbors import LocalOutlierFactor
            self.anomaly_detector = LocalOutlierFactor(
                n_neighbors=20,
                contamination=0.1,
                novelty=True
            )
        elif self.anomaly_detection_method == 'one_class_svm':
            from sklearn.svm import OneClassSVM
            self.anomaly_detector = OneClassSVM(
                nu=0.1,
                kernel='rbf'
            )

    def register_event_handler(
        self,
        event_type: str,
        handler: Callable
    ):
        """
        이벤트 핸들러 등록

        Args:
            event_type: 이벤트 유형
            handler: 핸들러 함수
        """
        if event_type in self.event_handlers:
            self.event_handlers[event_type].append(handler)
            logger.info(f"이벤트 핸들러 등록: {event_type}")

    def _trigger_event(self, event_type: str, data: Any):
        """이벤트 트리거"""
        for handler in self.event_handlers.get(event_type, []):
            try:
                handler(data)
            except Exception as e:
                logger.error(f"이벤트 핸들러 오류 ({event_type}): {str(e)}")

    async def consume_kafka_stream(
        self,
        bootstrap_servers: str,
        topic: str,
        group_id: str = 'ml_pipeline_consumer',
        max_poll_records: int = 100
    ):
        """
        Kafka 스트림 소비

        Args:
            bootstrap_servers: Kafka 서버 주소
            topic: 토픽명
            group_id: 컨슈머 그룹 ID
            max_poll_records: 최대 폴링 레코드 수
        """
        try:
            from kafka import KafkaConsumer
            import asyncio

            # 비동기 Kafka 컨슈머 생성
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=bootstrap_servers,
                group_id=group_id,
                max_poll_records=max_poll_records,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                enable_auto_commit=True
            )

            logger.info(f"Kafka 컨슈머 시작: {topic}")

            # 메시지 수집 루프
            loop = asyncio.get_event_loop()
            for message in consumer:
                try:
                    # 데이터 수신 이벤트 트리거
                    self._trigger_event('on_data_received', message.value)

                    # 버퍼에 추가
                    await self._add_to_buffer(message.value)

                    # 배치 처리
                    if len(self.data_buffer) >= self.processing_batch_size:
                        await self._process_batch()

                except Exception as e:
                    logger.error(f"메시지 처리 오류: {str(e)}")

        except ImportError:
            logger.warning("kafka-python 패키지가 설치되지 않음. 시뮬레이션 모드로 실행.")
            await self._simulate_kafka_stream(topic)
        except Exception as e:
            logger.error(f"Kafka 소비 오류: {str(e)}")

    async def _simulate_kafka_stream(self, topic: str, num_messages: int = 100):
        """Kafka 스트림 시뮬레이션 (개발 환경용)"""
        logger.info(f"Kafka 스트림 시뮬레이션 시작: {topic}")

        for i in range(num_messages):
            # 시뮬레이션 데이터 생성
            simulated_message = {
                'timestamp': datetime.now().isoformat(),
                'topic': topic,
                'data': {
                    'production_quantity': np.random.randint(80, 120),
                    'quality_rate': np.random.uniform(0.85, 0.98),
                    'inventory_level': np.random.randint(500, 1500),
                    'sales': np.random.randint(100, 200),
                    'machine_efficiency': np.random.uniform(0.75, 0.95)
                }
            }

            await self._add_to_buffer(simulated_message)

            # 배치 처리
            if len(self.data_buffer) >= self.processing_batch_size:
                await self._process_batch()

            # 비동기 대기
            await asyncio.sleep(0.1)

        logger.info(f"시뮬레이션 완료: {num_messages}개 메시지 처리")

    async def _add_to_buffer(self, data: Dict):
        """버퍼에 데이터 추가"""
        self.data_buffer.append(data)

        # 버퍼 크기 제한
        if len(self.data_buffer) > self.buffer_size:
            self.data_buffer = self.data_buffer[-self.buffer_size:]

    async def _process_batch(self):
        """배치 처리"""
        if not self.data_buffer:
            return

        logger.info(f"배치 처리 시작: {len(self.data_buffer)}개 레코드")

        try:
            # DataFrame으로 변환
            df = pd.DataFrame(self.data_buffer)

            # 타임스탬프 인덱싱
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df.set_index('timestamp')

            # 전처리
            df = self._preprocess_batch(df)

            # 이상치 탐지
            anomalies = self._detect_anomalies(df)

            if anomalies is not None and anomalies.sum() > 0:
                logger.warning(f"이상치 탐지: {anomalies.sum()}개")
                self._trigger_event('on_anomaly_detected', {
                    'df': df,
                    'anomalies': anomalies
                })

                # 이상치 처리
                df = self._handle_anomalies(df, anomalies)

            # 피처 엔지니어링
            df = self.feature_engineer.create_features(
                df,
                include_lags=False,  # 실시간에서는 래그 피처 제외
                include_windows=False
            )

            # 처리된 데이터 저장
            self.processed_data.extend(df.to_dict('records'))

            # 버퍼 비우기
            self.data_buffer = []

            # 예측 트리거 이벤트
            self._trigger_event('on_prediction_trigger', df)

            # 성능 모니터링
            await self._monitor_performance(df)

            logger.info("배치 처리 완료")

        except Exception as e:
            logger.error(f"배치 처리 오류: {str(e)}")

    def _preprocess_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """배치 데이터 전처리"""
        # 중복 제거
        df = df.drop_duplicates()

        # 결측치 처리
        df = df.fillna(method='ffill').fillna(method='bfill')

        # 데이터 타입 변환
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    df[col] = pd.to_numeric(df[col])
                except ValueError:
                    pass

        return df

    def _detect_anomalies(self, df: pd.DataFrame) -> pd.Series:
        """이상치 탐지"""
        # 수치형 컬럼만 선택
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) == 0:
            return pd.Series([False] * len(df))

        X = df[numeric_cols].values

        # IQR 방식 (빠른 이상치 탐지)
        if self.anomaly_detection_method == 'iqr':
            anomalies = pd.Series([False] * len(df))
            for col in numeric_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                col_anomalies = (df[col] < lower_bound) | (df[col] > upper_bound)
                anomalies = anomalies | col_anomalies
            return anomalies

        # 머신러닝 방식
        elif self.anomaly_detector is not None:
            try:
                # 학습 데이터가 충분하지 않으면 Isolation Forest는 fit 먼저 필요
                if hasattr(self.anomaly_detector, 'fit_predict'):
                    predictions = self.anomaly_detector.fit_predict(X)
                    return pd.Series(predictions == -1)
                else:
                    predictions = self.anomaly_detector.predict(X)
                    return pd.Series(predictions == -1)
            except Exception as e:
                logger.error(f"이상치 탐지 오류: {str(e)}")
                return pd.Series([False] * len(df))

        return pd.Series([False] * len(df))

    def _handle_anomalies(
        self,
        df: pd.DataFrame,
        anomalies: pd.Series
    ) -> pd.DataFrame:
        """이상치 처리"""
        df = df.copy()

        # 이상치를 NaN으로 변환 후 보간
        df.loc[anomalies, :] = np.nan
        df = df.interpolate(method='linear').fillna(method='ffill')

        return df

    async def _monitor_performance(self, df: pd.DataFrame):
        """모델 성능 모니터링"""
        # 실제값이 있는 경우 예측 오차 계산
        # (실제 구현에서는 예측값과 실제값 비교)

        # 시뮬레이션: 랜덤 MAPE 생성
        current_mape = np.random.uniform(0.02, 0.12)  # 2-12%
        self.model_performance['mape'].append(current_mape)

        # 최근 30개 MAPE 평균
        recent_mape = np.mean(self.model_performance['mape'][-30:])

        # 재학습 트리거 확인
        if self.enable_auto_retraining and recent_mape > self.retraining_threshold:
            logger.warning(f"성능 저하 감지: MAPE {recent_mape:.1%} > {self.retraining_threshold:.1%}")
            self._trigger_event('on_model_retrain', {
                'current_mape': recent_mape,
                'threshold': self.retraining_threshold
            })

    def get_processed_data(
        self,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        처리된 데이터 반환

        Args:
            limit: 반환할 데이터 개수 (None = 전체)

        Returns:
            처리된 데이터 리스트
        """
        if limit is None:
            return self.processed_data
        return self.processed_data[-limit:]

    def get_performance_stats(self) -> Dict:
        """
        성능 통계 반환

        Returns:
            성능 메트릭 딕셔너리
        """
        stats = {}

        for metric, values in self.model_performance.items():
            if values:
                stats[metric] = {
                    'current': values[-1],
                    'mean': np.mean(values),
                    'std': np.std(values),
                    'min': np.min(values),
                    'max': np.max(values)
                }

        return stats

    def clear_buffer(self):
        """버퍼 비우기"""
        self.data_buffer = []
        logger.info("데이터 버퍼 비움")

    def reset_performance_tracking(self):
        """성능 추적 리셋"""
        self.model_performance = {
            'mape': [],
            'mae': [],
            'rmse': []
        }
        logger.info("성능 추적 리셋")


class PredictionTrigger:
    """
    예측 트리거 시스템

    실시간 데이터 수집 시 자동으로 예측을 실행하는 트리거
    """

    def __init__(
        self,
        trigger_interval: int = 300,  # 5분
        min_data_points: int = 30,
        prediction_horizon: int = 30
    ):
        self.trigger_interval = trigger_interval
        self.min_data_points = min_data_points
        self.prediction_horizon = prediction_horizon

        self.last_trigger_time = None
        self.prediction_cache: Dict = {}

    def should_trigger(self, data_count: int) -> bool:
        """
        예측 트리거 조건 확인

        Args:
            data_count: 현재 데이터 개수

        Returns:
            트리거 여부
        """
        now = datetime.now()

        # 첫 트리거 또는 인터벌 경과 확인
        if self.last_trigger_time is None:
            time_passed = True
        else:
            time_passed = (now - self.last_trigger_time).total_seconds() >= self.trigger_interval

        # 데이터 개수 확인
        sufficient_data = data_count >= self.min_data_points

        return time_passed and sufficient_data

    def update_last_trigger(self):
        """마지막 트리거 시간 업데이트"""
        self.last_trigger_time = datetime.now()

    def cache_prediction(self, key: str, prediction: Dict):
        """예측 결과 캐싱"""
        self.prediction_cache[key] = {
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        }

    def get_cached_prediction(self, key: str, max_age_seconds: int = 3600) -> Optional[Dict]:
        """캐시된 예측 반환"""
        if key not in self.prediction_cache:
            return None

        cached = self.prediction_cache[key]
        cache_time = datetime.fromisoformat(cached['timestamp'])
        age = (datetime.now() - cache_time).total_seconds()

        if age <= max_age_seconds:
            return cached['prediction']
        else:
            # 오래된 캐시 삭제
            del self.prediction_cache[key]
            return None
