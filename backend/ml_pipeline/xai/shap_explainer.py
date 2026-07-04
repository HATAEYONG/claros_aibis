# ML Pipeline XAI - SHAP Explainer
# SHAP (SHapley Additive exPlanations) 기반 예측 설명

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP가 설치되지 않음. pip install shap")

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    logger.warning("시각화 라이브러리 없음")


class SHAPExplainer:
    """
    SHAP 기반 예측 설명 시스템

    기능:
    - 전역 변수 중요도 (Global Feature Importance)
    - 로컬 예측 설명 (Local Prediction Explanation)
    - 의존도 플롯 (Dependence Plot)
    - 상호작용 효과 (Interaction Effects)
    - 워터폴 플롯 (Waterfall Plot)
    """

    def __init__(
        self,
        model: Any,
        model_type: str = 'tree',  # 'tree', 'linear', 'deep', 'kernel'
        feature_names: Optional[List[str]] = None,
        background_data: Optional[np.ndarray] = None
    ):
        """
        SHAP Explainer 초기화

        Args:
            model: 설명할 모델
            model_type: 모델 유형
            feature_names: 피처 이름 리스트
            background_data: 백그라운드 데이터 (KernelSHAP용)
        """
        if not SHAP_AVAILABLE:
            raise ImportError("SHAP가 설치되지 않음. pip install shap")

        self.model = model
        self.model_type = model_type
        self.feature_names = feature_names or [f'feature_{i}' for i in range(100)]
        self.background_data = background_data

        # Explainer 초기화
        self.explainer = self._init_explainer()

        logger.info(f"SHAP Explainer 초기화: model_type={model_type}")

    def _init_explainer(self):
        """Explainer 초기화"""
        if self.model_type == 'tree':
            # TreeExplainer: 트리 기반 모델 (Random Forest, XGBoost, LightGBM)
            return shap.TreeExplainer(self.model)
        elif self.model_type == 'linear':
            # LinearExplainer: 선형 모델
            return shap.LinearExplainer(self.model, self.background_data)
        elif self.model_type == 'deep':
            # DeepExplainer: 딥러닝 모델
            return shap.DeepExplainer(self.model, self.background_data)
        else:
            # KernelSHAP: 모델 불가지 블랙박스 설명
            return shap.KernelExplainer(
                self.model.predict,
                self.background_data or np.zeros((1, len(self.feature_names)))
            )

    def explain_prediction(
        self,
        instance: Union[np.ndarray, pd.DataFrame, pd.Series],
        plot_type: str = 'waterfall'
    ) -> Dict[str, Any]:
        """
        단일 예측 설명 (로컬 설명)

        Args:
            instance: 설명할 인스턴스
            plot_type: 플롯 유형 ('waterfall', 'force', 'bar')

        Returns:
            설명 결과 딕셔너리
        """
        # 데이터프레임/시리즈 변환
        if isinstance(instance, (pd.DataFrame, pd.Series)):
            instance_array = instance.values.reshape(1, -1)
        else:
            instance_array = np.array(instance).reshape(1, -1)

        # SHAP 값 계산
        shap_values = self.explainer.shap_values(instance_array)

        # 단일 인스턴스인 경우 1D로 변환
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        if len(shap_values.shape) > 1:
            shap_values = shap_values[0]

        # 기준값 (expected value)
        expected_value = self.explainer.expected_value
        if isinstance(expected_value, list):
            expected_value = expected_value[0]

        # 예측값
        prediction = self.model.predict(instance_array.reshape(1, -1))[0] if hasattr(self.model, 'predict') else None

        # 변수 중요도 계산
        feature_importance = dict(zip(
            self.feature_names[:len(shap_values)],
            shap_values.tolist()
        ))

        # 정렬
        sorted_importance = sorted(
            feature_importance.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        return {
            'instance_id': hash(str(instance_array)) % 10000,
            'prediction': float(prediction) if prediction is not None else None,
            'expected_value': float(expected_value),
            'shap_values': shap_values.tolist(),
            'feature_importance': dict(sorted_importance),
            'top_positive': [
                {'feature': k, 'value': float(v)}
                for k, v in sorted_importance if v > 0
            ][:5],
            'top_negative': [
                {'feature': k, 'value': float(v)}
                for k, v in sorted_importance if v < 0
            ][:5],
            'plot_type': plot_type,
            'explained_at': datetime.now().isoformat()
        }

    def explain_batch(
        self,
        instances: Union[np.ndarray, pd.DataFrame],
        max_samples: int = 100
    ) -> Dict[str, Any]:
        """
        배치 예측 설명

        Args:
            instances: 설명할 인스턴스들
            max_samples: 최대 샘플 수

        Returns:
            설명 결과 딕셔너리
        """
        # 데이터프레임 변환
        if isinstance(instances, pd.DataFrame):
            instances_array = instances.values
        else:
            instances_array = np.array(instances)

        # 샘플링
        if len(instances_array) > max_samples:
            indices = np.random.choice(len(instances_array), max_samples, replace=False)
            instances_array = instances_array[indices]

        # SHAP 값 계산
        shap_values = self.explainer.shap_values(instances_array)

        # 평균 절대 SHAP 값 (변수 중요도)
        if isinstance(shap_values, list):
            mean_abs_shap = np.mean(np.abs(shap_values[0]), axis=0)
        else:
            mean_abs_shap = np.mean(np.abs(shap_values), axis=0)

        feature_importance = dict(zip(
            self.feature_names[:len(mean_abs_shap)],
            mean_abs_shap.tolist()
        ))

        sorted_importance = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return {
            'num_instances': len(instances_array),
            'global_feature_importance': dict(sorted_importance),
            'mean_abs_shap': mean_abs_shap.tolist(),
            'feature_names': self.feature_names[:len(mean_abs_shap)],
            'explained_at': datetime.now().isoformat()
        }

    def get_global_importance(
        self,
        X: Union[np.ndarray, pd.DataFrame],
        plot_type: str = 'bar'
    ) -> Dict[str, Any]:
        """
        전역 변수 중요도

        Args:
            X: 입력 데이터
            plot_type: 플롯 유형 ('bar', 'beeswarm', 'violin')

        Returns:
            변수 중요도 딕셔너리
        """
        result = self.explain_batch(X)

        # 통계 정보 추가
        importance_values = list(result['global_feature_importance'].values())

        return {
            **result,
            'statistics': {
                'mean': float(np.mean(importance_values)),
                'std': float(np.std(importance_values)),
                'min': float(np.min(importance_values)),
                'max': float(np.max(importance_values)),
                'median': float(np.median(importance_values))
            },
            'plot_type': plot_type
        }

    def plot_summary(
        self,
        X: Union[np.ndarray, pd.DataFrame],
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        SHAP 요약 플롯

        Args:
            X: 입력 데이터
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            logger.warning("시각화 불가: matplotlib/seaborn 미설치")
            return None

        # SHAP 값 계산
        shap_values = self.explainer.shap_values(X)

        # 요약 플롯
        plt.figure(figsize=(10, 6))
        shap.summary_plot(
            shap_values,
            X,
            feature_names=self.feature_names[:X.shape[1]],
            show=False
        )

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            logger.info(f"요약 플롯 저장: {save_path}")
            return save_path
        else:
            plt.show()
            return None

    def plot_waterfall(
        self,
        instance: Union[np.ndarray, pd.DataFrame],
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        워터폴 플롯 (단일 예측 설명)

        Args:
            instance: 설명할 인스턴스
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            return None

        # SHAP 값 계산
        shap_values = self.explainer.shap_values(instance.reshape(1, -1))

        # 워터폴 플롯
        plt.figure(figsize=(10, 6))
        shap.waterfall_plot(
            shap.Explanation(
                values=shap_values[0] if isinstance(shap_values, list) else shap_values,
                base_values=self.explainer.expected_value,
                data=instance.reshape(-1),
                feature_names=self.feature_names[:len(instance)]
            ),
            show=False
        )

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            return save_path
        else:
            plt.show()
            return None

    def plot_dependence(
        self,
        X: Union[np.ndarray, pd.DataFrame],
        feature_idx: int,
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        의존도 플롯

        Args:
            X: 입력 데이터
            feature_idx: 피처 인덱스
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            return None

        # SHAP 값 계산
        shap_values = self.explainer.shap_values(X)

        # 의존도 플롯
        plt.figure(figsize=(10, 6))
        shap.dependence_plot(
            feature_idx,
            shap_values[0] if isinstance(shap_values, list) else shap_values,
            X,
            feature_names=self.feature_names[:X.shape[1]],
            show=False
        )

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            return save_path
        else:
            plt.show()
            return None

    def get_interaction_values(
        self,
        instance: Union[np.ndarray, pd.DataFrame]
    ) -> Dict[str, Any]:
        """
        상호작용 효과 분석

        Args:
            instance: 분석할 인스턴스

        Returns:
            상호작용 값 딕셔너리
        """
        if not hasattr(self.explainer, 'shap_interaction_values'):
            logger.warning("현재 explainer는 상호작용 값을 지원하지 않음")
            return {}

        # 상호작용 값 계산
        interaction_values = self.explainer.shap_interaction_values(instance.reshape(1, -1))

        # 메인 효과 (대각선)
        main_effects = np.diag(interaction_values[0])

        # 상위 상호작용 쌍
        n_features = len(main_effects)
        interactions = []

        for i in range(n_features):
            for j in range(i + 1, n_features):
                interaction_strength = abs(interaction_values[0][i][j])
                interactions.append({
                    'feature_1': self.feature_names[i],
                    'feature_2': self.feature_names[j],
                    'interaction_value': float(interaction_values[0][i][j]),
                    'strength': float(interaction_strength)
                })

        interactions.sort(key=lambda x: x['strength'], reverse=True)

        return {
            'main_effects': dict(zip(
                self.feature_names[:len(main_effects)],
                main_effects.tolist()
            )),
            'top_interactions': interactions[:10],
            'explained_at': datetime.now().isoformat()
        }

    def compare_instances(
        self,
        instance_a: Union[np.ndarray, pd.DataFrame],
        instance_b: Union[np.ndarray, pd.DataFrame]
    ) -> Dict[str, Any]:
        """
        두 인스턴스의 예측 설명 비교

        Args:
            instance_a: 첫 번째 인스턴스
            instance_b: 두 번째 인스턴스

        Returns:
            비교 결과
        """
        explanation_a = self.explain_prediction(instance_a)
        explanation_b = self.explain_prediction(instance_b)

        # SHAP 값 차이
        shap_diff = np.array(explanation_a['shap_values']) - np.array(explanation_b['shap_values'])

        comparison = {
            'instance_a': {
                'prediction': explanation_a['prediction'],
                'top_features': explanation_a['top_positive'][:3]
            },
            'instance_b': {
                'prediction': explanation_b['prediction'],
                'top_features': explanation_b['top_positive'][:3]
            },
            'prediction_diff': float(
                (explanation_a['prediction'] or 0) - (explanation_b['prediction'] or 0)
            ),
            'shap_difference': dict(zip(
                self.feature_names[:len(shap_diff)],
                shap_diff.tolist()
            )),
            'most_different_features': sorted(
                [
                    {'feature': k, 'difference': float(v)}
                    for k, v in zip(self.feature_names[:len(shap_diff)], shap_diff)
                ],
                key=lambda x: abs(x['difference']),
                reverse=True
            )[:5]
        }

        return comparison

    def save_explanation(
        self,
        explanation: Dict[str, Any],
        filepath: str
    ):
        """
        설명 결과 저장

        Args:
            explanation: 설명 결과
            filepath: 저장 경로
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(explanation, f, indent=2, ensure_ascii=False)

        logger.info(f"설명 결과 저장: {filepath}")

    def load_explanation(
        self,
        filepath: str
    ) -> Dict[str, Any]:
        """
        설명 결과 로드

        Args:
            filepath: 파일 경로

        Returns:
            설명 결과
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)


class PermutationImportance:
    """
    순열 중요도 (Permutation Importance)

    피처 값을 무작위로 섞어서 모델 성능 변화를 측정하여
    변수 중요도를 계산하는 방법
    """

    def __init__(
        self,
        model: Any,
        scoring_fn: Optional[callable] = None
    ):
        """
        순열 중요도 초기화

        Args:
            model: 평가할 모델
            scoring_fn: 성능 측정 함수 (기본: MAPE)
        """
        self.model = model
        self.scoring_fn = scoring_fn or self._default_scoring

    def _default_scoring(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> float:
        """기본 성능 함수 (MAPE)"""
        return np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100

    def compute(
        self,
        X: Union[np.ndarray, pd.DataFrame],
        y: Union[np.ndarray, pd.Series],
        n_repeats: int = 10,
        random_state: int = 42
    ) -> Dict[str, Any]:
        """
        순열 중요도 계산

        Args:
            X: 입력 데이터
            y: 타겟 값
            n_repeats: 반복 횟수
            random_state: 랜덤 시드

        Returns:
            순열 중요도 결과
        """
        np.random.seed(random_state)

        # 기준 성능
        y_pred_baseline = self.model.predict(X) if hasattr(self.model, 'predict') else None
        baseline_score = self.scoring_fn(y, y_pred_baseline) if y_pred_baseline is not None else 0

        # 피처별 중요도
        if isinstance(X, pd.DataFrame):
            feature_names = X.columns.tolist()
            X_array = X.values
        else:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]
            X_array = X

        importances = []
        importances_std = []

        for feature_idx in range(X_array.shape[1]):
            feature_scores = []

            for _ in range(n_repeats):
                # 해당 피처만 섞기
                X_permuted = X_array.copy()
                X_permuted[:, feature_idx] = np.random.permutation(X_permuted[:, feature_idx])

                # 예측 및 성능 측정
                y_pred_permuted = self.model.predict(X_permuted) if hasattr(self.model, 'predict') else None

                if y_pred_permuted is not None:
                    permuted_score = self.scoring_fn(y, y_pred_permuted)
                    # 성능 저하도가 중요도
                    importance = permuted_score - baseline_score
                    feature_scores.append(importance)

            importances.append(np.mean(feature_scores))
            importances_std.append(np.std(feature_scores))

        # 결과 정렬
        sorted_idx = np.argsort(importances)[::-1]

        return {
            'baseline_score': float(baseline_score),
            'feature_importance': [
                {
                    'feature': feature_names[i],
                    'importance': float(importances[i]),
                    'std': float(importances_std[i])
                }
                for i in sorted_idx
            ],
            'feature_names': [feature_names[i] for i in sorted_idx],
            'importance_values': [float(importances[i]) for i in sorted_idx],
            'importance_std': [float(importances_std[i]) for i in sorted_idx],
            'computed_at': datetime.now().isoformat()
        }
