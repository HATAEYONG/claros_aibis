# ML Pipeline MLOps - A/B Testing Framework
# 모델 A/B 테스트 시스템

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
from scipy import stats

logger = logging.getLogger(__name__)


class ABTestStatus(Enum):
    """A/B 테스트 상태"""
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    STOPPED = 'stopped'


@dataclass
class ABTestConfig:
    """A/B 테스트 설정"""
    test_name: str
    model_a: str  # 모델 A 이름 또는 버전
    model_b: str  # 모델 B 이름 또는 버전
    test_period_days: int = 30
    traffic_split: float = 0.5  # 0.5 = 50:50 분배
    min_sample_size: int = 1000
    significance_level: float = 0.05  # 유의수준 (95% 신뢰수준)
    metric: str = 'mape'  # 비교 메트릭
    description: str = ''

    def __post_init__(self):
        if not 0 < self.traffic_split < 1:
            raise ValueError("traffic_split은 0과 1 사이여야 합니다.")


@dataclass
class ABTestResult:
    """A/B 테스트 결과"""
    test_name: str
    status: ABTestStatus
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    # 테스트 통계
    sample_size_a: int = 0
    sample_size_b: int = 0
    metric_a: float = 0
    metric_b: float = 0
    metric_diff: float = 0
    relative_improvement: float = 0

    # 통계적 유의성
    p_value: float = 1.0
    is_significant: bool = False
    confidence_interval: Tuple[float, float] = (0, 0)

    # 승자
    winner: Optional[str] = None
    confidence: float = 0

    # 상세 결과
    raw_predictions_a: List[float] = field(default_factory=list)
    raw_predictions_b: List[float] = field(default_factory=list)
    raw_actuals: List[float] = field(default_factory=list)


class ABTestFramework:
    """
    A/B 테스트 프레임워크

    두 모델의 성능을 통계적으로 비교하는 시스템

    기능:
    - 테스트 생성 및 관리
    - 트래픽 분배 (50:50 또는 커스텀)
    - 실시간 성능 추적
    - 통계적 유의성 검정
    - 자동 승자 선정
    """

    def __init__(
        self,
        prediction_service=None,
        registry=None
    ):
        """
        A/B 테스트 프레임워크 초기화

        Args:
            prediction_service: 예측 서비스 인스턴스
            registry: 모델 레지스트리 인스턴스
        """
        self.prediction_service = prediction_service
        self.registry = registry

        # 테스트 저장소
        self.tests: Dict[str, ABTestResult] = {}
        self.configs: Dict[str, ABTestConfig] = {}

        logger.info("A/B 테스트 프레임워크 초기화 완료")

    def create_test(
        self,
        config: ABTestConfig
    ) -> str:
        """
        A/B 테스트 생성

        Args:
            config: 테스트 설정

        Returns:
            테스트 ID
        """
        test_id = f"{config.test_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # 설정 저장
        self.configs[test_id] = config

        # 결과 초기화
        self.tests[test_id] = ABTestResult(
            test_name=config.test_name,
            status=ABTestStatus.PENDING,
            start_date=datetime.now().isoformat()
        )

        logger.info(f"A/B 테스트 생성: {test_id}")
        logger.info(f"  Model A: {config.model_a}")
        logger.info(f"  Model B: {config.model_b}")
        logger.info(f"  Traffic Split: {config.traffic_split*100:.0f}%:{(1-config.traffic_split)*100:.0f}%")

        return test_id

    def start_test(self, test_id: str) -> bool:
        """
        A/B 테스트 시작

        Args:
            test_id: 테스트 ID

        Returns:
            성공 여부
        """
        if test_id not in self.tests:
            logger.error(f"테스트 없음: {test_id}")
            return False

        if self.tests[test_id].status != ABTestStatus.PENDING:
            logger.warning(f"테스트가 이미 시작됨: {test_id}")
            return False

        self.tests[test_id].status = ABTestStatus.RUNNING
        logger.info(f"A/B 테스트 시작: {test_id}")

        return True

    def allocate_traffic(
        self,
        test_id: str,
        user_id: Optional[str] = None
    ) -> str:
        """
        트래픽 분배

        Args:
            test_id: 테스트 ID
            user_id: 사용자 ID (None인 경우 랜덤 분배)

        Returns:
            'A' 또는 'B'
        """
        if test_id not in self.configs:
            return 'A'

        config = self.configs[test_id]

        # 사용자 ID 기반 일관된 분배
        if user_id:
            hash_value = hash(user_id + test_id) % 100
            return 'A' if hash_value < config.traffic_split * 100 else 'B'
        else:
            import random
            return 'A' if random.random() < config.traffic_split else 'B'

    def record_prediction(
        self,
        test_id: str,
        group: str,  # 'A' 또는 'B'
        prediction: float,
        actual: Optional[float] = None
    ):
        """
        예측 결과 기록

        Args:
            test_id: 테스트 ID
            group: 그룹 ('A' 또는 'B')
            prediction: 예측값
            actual: 실제값 (나중에 제공 가능)
        """
        if test_id not in self.tests:
            return

        result = self.tests[test_id]

        if group == 'A':
            result.raw_predictions_a.append(prediction)
        elif group == 'B':
            result.raw_predictions_b.append(prediction)

        if actual is not None:
            result.raw_actuals.append(actual)

    def calculate_metrics(
        self,
        predictions: List[float],
        actuals: List[float],
        metric: str = 'mape'
    ) -> float:
        """
        메트릭 계산

        Args:
            predictions: 예측값 리스트
            actuals: 실제값 리스트
            metric: 메트릭 유형

        Returns:
            메트릭 값
        """
        if len(predictions) != len(actuals) or len(predictions) == 0:
            return 0.0

        y_pred = np.array(predictions)
        y_true = np.array(actuals)

        if metric == 'mape':
            return np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100
        elif metric == 'mae':
            return np.mean(np.abs(y_true - y_pred))
        elif metric == 'rmse':
            return np.sqrt(np.mean((y_true - y_pred) ** 2))
        elif metric == 'smape':
            return np.mean(2 * np.abs(y_true - y_pred) / (np.abs(y_true) + np.abs(y_pred) + 1e-8)) * 100
        else:
            raise ValueError(f"알 수 없는 메트릭: {metric}")

    def evaluate_test(
        self,
        test_id: str,
        actuals_a: Optional[List[float]] = None,
        actuals_b: Optional[List[float]] = None
    ) -> ABTestResult:
        """
        A/B 테스트 평가

        Args:
            test_id: 테스트 ID
            actuals_a: 그룹 A 실제값 (None인 경우 저장된 값 사용)
            actuals_b: 그룹 B 실제값 (None인 경우 저장된 값 사용)

        Returns:
            테스트 결과
        """
        if test_id not in self.tests:
            raise ValueError(f"테스트 없음: {test_id}")

        config = self.configs[test_id]
        result = self.tests[test_id]

        # 실제값 설정
        if actuals_a is not None and actuals_b is not None:
            # 명시적으로 제공된 실제값 사용
            predictions_a = result.raw_predictions_a[:len(actuals_a)]
            predictions_b = result.raw_predictions_b[:len(actuals_b)]
        else:
            # 저장된 실제값 사용
            actuals_a = result.raw_actuals[:len(result.raw_predictions_a)]
            actuals_b = result.raw_actuals[:len(result.raw_predictions_b)]
            predictions_a = result.raw_predictions_a
            predictions_b = result.raw_predictions_b

        # 샘플 사이즈 확인
        result.sample_size_a = len(predictions_a)
        result.sample_size_b = len(predictions_b)

        if result.sample_size_a < config.min_sample_size or result.sample_size_b < config.min_sample_size:
            logger.warning(
                f"샘플 사이즈 부족: A={result.sample_size_a}, B={result.sample_size_b}, "
                f"필요={config.min_sample_size}"
            )
            result.status = ABTestStatus.FAILED
            return result

        # 메트릭 계산
        result.metric_a = self.calculate_metrics(predictions_a, actuals_a, config.metric)
        result.metric_b = self.calculate_metrics(predictions_b, actuals_b, config.metric)

        # 차이 계산
        result.metric_diff = result.metric_b - result.metric_a
        result.relative_improvement = (result.metric_diff / result.metric_a * 100) if result.metric_a > 0 else 0

        # 통계적 유의성 검정 (t-test)
        # 오차 계산
        errors_a = np.array(actuals_a) - np.array(predictions_a)
        errors_b = np.array(actuals_b) - np.array(predictions_b)

        # 독립 표본 t-검정 (두 모델의 오차 분산 비교)
        t_stat, p_value = stats.ttest_ind(errors_a, errors_b)
        result.p_value = p_value
        result.is_significant = p_value < config.significance_level

        # 신뢰 구간 계산
        se_diff = np.sqrt(
            np.var(errors_a) / len(errors_a) +
            np.var(errors_b) / len(errors_b)
        )
        ci_margin = 1.96 * se_diff  # 95% 신뢰구간
        result.confidence_interval = (
            result.metric_diff - ci_margin,
            result.metric_diff + ci_margin
        )

        # 승자 선정
        if config.metric == 'mape' or config.metric == 'mae' or config.metric == 'rmse':
            # 낮을수록 좋은 메트릭
            if result.metric_b < result.metric_a:
                result.winner = config.model_b
                result.confidence = (1 - p_value) * 100 if result.is_significant else 50
            elif result.metric_a < result.metric_b:
                result.winner = config.model_a
                result.confidence = (1 - p_value) * 100 if result.is_significant else 50
            else:
                result.winner = 'tie'
                result.confidence = 50
        else:
            # 높을수록 좋은 메트릭
            if result.metric_b > result.metric_a:
                result.winner = config.model_b
                result.confidence = (1 - p_value) * 100 if result.is_significant else 50
            elif result.metric_a > result.metric_b:
                result.winner = config.model_a
                result.confidence = (1 - p_value) * 100 if result.is_significant else 50
            else:
                result.winner = 'tie'
                result.confidence = 50

        result.status = ABTestStatus.COMPLETED
        result.end_date = datetime.now().isoformat()

        logger.info(f"A/B 테스트 완료: {test_id}")
        logger.info(f"  Model A ({config.model_a}): {result.metric_a:.4f}")
        logger.info(f"  Model B ({config.model_b}): {result.metric_b:.4f}")
        logger.info(f"  Winner: {result.winner} ({result.confidence:.1f}% 신뢰도)")
        logger.info(f"  P-value: {p_value:.4f}, Significant: {result.is_significant}")

        return result

    def stop_test(self, test_id: str) -> bool:
        """
        A/B 테스트 중지

        Args:
            test_id: 테스트 ID

        Returns:
            성공 여부
        """
        if test_id not in self.tests:
            return False

        self.tests[test_id].status = ABTestStatus.STOPPED
        self.tests[test_id].end_date = datetime.now().isoformat()

        logger.info(f"A/B 테스트 중지: {test_id}")
        return True

    def get_test_result(self, test_id: str) -> Optional[ABTestResult]:
        """
        테스트 결과 조회

        Args:
            test_id: 테스트 ID

        Returns:
            테스트 결과
        """
        return self.tests.get(test_id)

    def get_test_summary(
        self,
        test_id: str
    ) -> Dict[str, Any]:
        """
        테스트 요약 정보

        Args:
            test_id: 테스트 ID

        Returns:
            요약 정보 딕셔너리
        """
        if test_id not in self.tests or test_id not in self.configs:
            return {}

        result = self.tests[test_id]
        config = self.configs[test_id]

        return {
            'test_id': test_id,
            'test_name': config.test_name,
            'status': result.status.value,
            'model_a': config.model_a,
            'model_b': config.model_b,
            'start_date': result.start_date,
            'end_date': result.end_date,
            'sample_size_a': result.sample_size_a,
            'sample_size_b': result.sample_size_b,
            'metric_a': result.metric_a,
            'metric_b': result.metric_b,
            'winner': result.winner,
            'confidence': result.confidence,
            'is_significant': result.is_significant
        }

    def list_tests(
        self,
        status: Optional[ABTestStatus] = None
    ) -> List[Dict[str, Any]]:
        """
        테스트 목록 조회

        Args:
            status: 필터링할 상태

        Returns:
            테스트 정보 리스트
        """
        results = []

        for test_id, result in self.tests.items():
            if status and result.status != status:
                continue

            results.append(self.get_test_summary(test_id))

        return results

    def delete_test(self, test_id: str) -> bool:
        """
        테스트 삭제

        Args:
            test_id: 테스트 ID

        Returns:
            성공 여부
        """
        if test_id in self.tests:
            del self.tests[test_id]
        if test_id in self.configs:
            del self.configs[test_id]

        logger.info(f"A/B 테스트 삭제: {test_id}")
        return True


class MultiArmedBandit:
    """
    Multi-Armed Bandit (MAB) 테스트

    A/B 테스트의 확장된 형태로, 여러 모델을 동시에 테스트하고
    성능이 좋은 모델에 더 많은 트래픽을 할당

    알고리즘:
    - Epsilon-Greedy: ε 확률로 탐색, (1-ε) 확률로 최적 활용
    - UCB (Upper Confidence Bound): 신뢰 상계 기반 선택
    - Thompson Sampling: 베이지안 접근
    """

    def __init__(
        self,
        models: List[str],
        algorithm: str = 'epsilon_greedy',
        epsilon: float = 0.1
    ):
        """
        MAB 초기화

        Args:
            models: 테스트할 모델 리스트
            algorithm: 알고리즘 ('epsilon_greedy', 'ucb', 'thompson')
            epsilon: 탐색 확률 (epsilon_greedy)
        """
        self.models = models
        self.algorithm = algorithm
        self.epsilon = epsilon

        # 통계
        self.counts: Dict[str, int] = {m: 0 for m in models}  # 선택 횟수
        self.rewards: Dict[str, float] = {m: 0.0 for m in models}  # 보상 합계
        self.avg_rewards: Dict[str, float] = {m: 0.0 for m in models}  # 평균 보상

        logger.info(f"MAB 초기화: {len(models)}개 모델, 알고리즘={algorithm}")

    def select_model(self) -> str:
        """
        모델 선택

        Returns:
            선택된 모델 이름
        """
        import random

        if self.algorithm == 'epsilon_greedy':
            return self._epsilon_greedy()
        elif self.algorithm == 'ucb':
            return self._ucb()
        elif self.algorithm == 'thompson':
            return self._thompson_sampling()
        else:
            return random.choice(self.models)

    def _epsilon_greedy(self) -> str:
        """Epsilon-Greedy 알고리즘"""
        import random

        if random.random() < self.epsilon:
            # 탐색: 랜덤 선택
            return random.choice(self.models)
        else:
            # 활용: 최고 평균 보상 모델 선택
            best_model = max(self.avg_rewards.items(), key=lambda x: x[1])
            return best_model[0]

    def _ucb(self) -> str:
        """UCB (Upper Confidence Bound) 알고리즘"""
        total_count = sum(self.counts.values())

        if total_count == 0:
            import random
            return random.choice(self.models)

        # UCB 계산
        ucb_values = {}
        for model in self.models:
            if self.counts[model] == 0:
                ucb_values[model] = float('inf')
            else:
                avg_reward = self.avg_rewards[model]
                exploration = np.sqrt(2 * np.log(total_count) / self.counts[model])
                ucb_values[model] = avg_reward + exploration

        # 최대 UCB 모델 선택
        return max(ucb_values.items(), key=lambda x: x[1])[0]

    def _thompson_sampling(self) -> str:
        """Thompson Sampling 알고리즘"""
        samples = {}

        for model in self.models:
            if self.counts[model] == 0:
                samples[model] = float('inf')
            else:
                # Beta 분포에서 샘플링
                # 성공 = 보상, 실패 = 선택 횟수 - 보상
                alpha = self.rewards[model] + 1
                beta = self.counts[model] - self.rewards[model] + 1
                samples[model] = np.random.beta(alpha, beta)

        return max(samples.items(), key=lambda x: x[1])[0]

    def update_reward(
        self,
        model: str,
        reward: float
    ):
        """
        보상 업데이트

        Args:
            model: 모델 이름
            reward: 보상 (0-1 사이)
        """
        self.counts[model] += 1
        self.rewards[model] += reward
        self.avg_rewards[model] = self.rewards[model] / self.counts[model]

    def get_statistics(self) -> Dict[str, Dict[str, Any]]:
        """
        통계 정보 조회

        Returns:
            모델별 통계
        """
        stats = {}
        for model in self.models:
            stats[model] = {
                'count': self.counts[model],
                'total_reward': self.rewards[model],
                'avg_reward': self.avg_rewards[model],
                'selection_rate': self.counts[model] / max(1, sum(self.counts.values()))
            }

        return stats

    def reset(self):
        """통계 리셋"""
        self.counts = {m: 0 for m in self.models}
        self.rewards = {m: 0.0 for m in self.models}
        self.avg_rewards = {m: 0.0 for m in self.models}
        logger.info("MAB 통계 리셋")
