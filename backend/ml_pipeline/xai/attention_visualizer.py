# ML Pipeline XAI - Attention Visualizer
# Transformer 어텐션 가중치 시각화

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    from matplotlib.patches import Rectangle
    import plotly.graph_objects as go
    import plotly.express as px
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    logger.warning("시각화 라이브러리 없음")


class AttentionVisualizer:
    """
    Attention 가중치 시각화

    TFT (Temporal Fusion Transformer)의 Multi-head Attention
    가중치를 시각화하여 모델이 어떤 시점에 집중하는지 파악

    기능:
    - Attention Heatmap
    - Time Point Importance
    - Variable Selection Weights
    - Attention Flow Animation
    """

    def __init__(
        self,
        model: Optional[Any] = None,
        attention_heads: int = 4,
        context_length: int = 90
    ):
        """
        Attention Visualizer 초기화

        Args:
            model: TFT 모델
            attention_heads: Attention 헤드 수
            context_length: 컨텍스트 길이
        """
        self.model = model
        self.attention_heads = attention_heads
        self.context_length = context_length

        # Attention weights 저장소
        self.attention_weights: Dict[str, np.ndarray] = {}

        logger.info("Attention Visualizer 초기화 완료")

    def set_attention_weights(
        self,
        layer_name: str,
        weights: np.ndarray
    ):
        """
        Attention 가중치 설정

        Args:
            layer_name: 레이어 이름
            weights: Attention 가중치 (batch, heads, seq_len, seq_len)
        """
        self.attention_weights[layer_name] = weights
        logger.info(f"Attention 가중치 설정: {layer_name}, shape={weights.shape}")

    def extract_attention_weights(
        self,
        input_data: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """
        모델에서 Attention 가중치 추출

        Args:
            input_data: 입력 데이터

        Returns:
            레이어별 Attention 가중치
        """
        # 실제 구현에서는 모델의 forward hook을 사용하여
        # Attention 가중치를 추출
        # 여기서는 시뮬레이션

        batch_size = input_data.shape[0] if len(input_data.shape) > 1 else 1
        seq_len = input_data.shape[1] if len(input_data.shape) > 1 else self.context_length

        # 시뮬레이션: 랜덤 Attention 가중치
        self.attention_weights['self_attention'] = np.random.rand(
            batch_size,
            self.attention_heads,
            seq_len,
            seq_len
        )

        # Softmax 적용 (각 행이 합이 1이 되도록)
        for b in range(batch_size):
            for h in range(self.attention_heads):
                for t in range(seq_len):
                    self.attention_weights['self_attention'][b, h, t, :] = \
                        softmax(self.attention_weights['self_attention'][b, h, t, :])

        logger.info("Attention 가중치 추출 완료 (시뮬레이션)")
        return self.attention_weights

    def plot_attention_heatmap(
        self,
        layer_name: str = 'self_attention',
        sample_idx: int = 0,
        head_idx: int = 0,
        save_path: Optional[str] = None,
        interactive: bool = False
    ) -> Optional[str]:
        """
        Attention Heatmap 시각화

        Args:
            layer_name: 레이어 이름
            sample_idx: 샘플 인덱스
            head_idx: Attention 헤드 인덱스
            save_path: 저장 경로
            interactive: Plotly 인터랙티브 플롯

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            return None

        if layer_name not in self.attention_weights:
            logger.warning(f"Attention 가중치 없음: {layer_name}")
            return None

        weights = self.attention_weights[layer_name]
        attention_matrix = weights[sample_idx, head_idx]

        if interactive:
            return self._plot_interactive_heatmap(
                attention_matrix,
                layer_name,
                sample_idx,
                head_idx,
                save_path
            )
        else:
            return self._plot_static_heatmap(
                attention_matrix,
                layer_name,
                sample_idx,
                head_idx,
                save_path
            )

    def _plot_static_heatmap(
        self,
        attention_matrix: np.ndarray,
        layer_name: str,
        sample_idx: int,
        head_idx: int,
        save_path: Optional[str]
    ) -> Optional[str]:
        """정적 Heatmap 플롯"""
        fig, ax = plt.subplots(figsize=(12, 10))

        sns.heatmap(
            attention_matrix,
            cmap='viridis',
            cbar_kws={'label': 'Attention Weight'},
            ax=ax
        )

        ax.set_xlabel('Key Position', fontsize=12)
        ax.set_ylabel('Query Position', fontsize=12)
        ax.set_title(
            f'Attention Heatmap: {layer_name}\n'
            f'Sample: {sample_idx}, Head: {head_idx}',
            fontsize=14
        )

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            logger.info(f"Heatmap 저장: {save_path}")
            return save_path
        else:
            plt.show()
            return None

    def _plot_interactive_heatmap(
        self,
        attention_matrix: np.ndarray,
        layer_name: str,
        sample_idx: int,
        head_idx: int,
        save_path: Optional[str]
    ) -> Optional[str]:
        """인터랙티브 Heatmap 플롯 (Plotly)"""
        fig = go.Figure(data=go.Heatmap(
            z=attention_matrix,
            colorscale='Viridis',
            colorbar=dict(title='Attention Weight')
        ))

        fig.update_layout(
            title=f'Attention Heatmap: {layer_name} (Sample: {sample_idx}, Head: {head_idx})',
            xaxis_title='Key Position',
            yaxis_title='Query Position',
            width=800,
            height=800
        )

        if save_path:
            fig.write_html(save_path)
            logger.info(f"인터랙티브 Heatmap 저장: {save_path}")
            return save_path
        else:
            fig.show()
            return None

    def get_temporal_importance(
        self,
        layer_name: str = 'self_attention',
        sample_idx: int = 0,
        aggregate_heads: bool = True
    ) -> Dict[str, Any]:
        """
        시점별 중요도 분석

        Args:
            layer_name: 레이어 이름
            sample_idx: 샘플 인덱스
            aggregate_heads: 헤드 평균 여부

        Returns:
            시점별 중요도
        """
        if layer_name not in self.attention_weights:
            return {}

        weights = self.attention_weights[layer_name]
        sample_weights = weights[sample_idx]

        if aggregate_heads:
            # 모든 헤드 평균
            temporal_importance = np.mean(sample_weights, axis=0)
        else:
            # 특정 헤드
            temporal_importance = sample_weights[0]

        # 각 시점이 받은 총 Attention (열 합계)
        attention_received = np.sum(temporal_importance, axis=0)

        # 각 시점이 준 Attention (행 합계)
        attention_given = np.sum(temporal_importance, axis=1)

        return {
            'attention_received': attention_received.tolist(),
            'attention_given': attention_given.tolist(),
            'most_attended_time': int(np.argmax(attention_received)),
            'least_attended_time': int(np.argmin(attention_received)),
            'time_points': list(range(len(attention_received))),
            'aggregated': aggregate_heads,
            'analyzed_at': datetime.now().isoformat()
        }

    def plot_temporal_importance(
        self,
        layer_name: str = 'self_attention',
        sample_idx: int = 0,
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        시점별 중요도 플롯

        Args:
            layer_name: 레이어 이름
            sample_idx: 샘플 인덱스
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            return None

        importance = self.get_temporal_importance(layer_name, sample_idx)

        if not importance:
            return None

        fig, axes = plt.subplots(2, 1, figsize=(14, 8))

        # Attention Received
        axes[0].bar(
            importance['time_points'],
            importance['attention_received'],
            color='steelblue'
        )
        axes[0].set_xlabel('Time Point', fontsize=12)
        axes[0].set_ylabel('Attention Received', fontsize=12)
        axes[0].set_title('How Much Each Time Point is Attended To', fontsize=14)
        axes[0].grid(axis='y', alpha=0.3)

        # Attention Given
        axes[1].bar(
            importance['time_points'],
            importance['attention_given'],
            color='coral'
        )
        axes[1].set_xlabel('Time Point', fontsize=12)
        axes[1].set_ylabel('Attention Given', fontsize=12)
        axes[1].set_title('How Much Each Time Point Attends Others', fontsize=14)
        axes[1].grid(axis='y', alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            return save_path
        else:
            plt.show()
            return None

    def get_head_importance(
        self,
        layer_name: str = 'self_attention',
        sample_idx: int = 0
    ) -> Dict[str, Any]:
        """
        Attention 헤드별 중요도

        Args:
            layer_name: 레이어 이름
            sample_idx: 샘플 인덱스

        Returns:
            헤드별 중요도
        """
        if layer_name not in self.attention_weights:
            return {}

        weights = self.attention_weights[layer_name]
        sample_weights = weights[sample_idx]

        # 각 헤드의 평균 Attention 강도
        head_importance = []
        for head_idx in range(sample_weights.shape[0]):
            head_matrix = sample_weights[head_idx]
            # 엔트로피 (낮을수록 더 집중)
            entropy = -np.sum(
                head_matrix * np.log(head_matrix + 1e-10),
                axis=(0, 1)
            ) / (head_matrix.shape[0] * head_matrix.shape[1])
            # 평균 Attention 강도
            mean_attention = np.mean(head_matrix)

            head_importance.append({
                'head': head_idx,
                'entropy': float(entropy),
                'mean_attention': float(mean_attention),
                'max_attention': float(np.max(head_matrix))
            })

        # 엔트로피 기반 정렬 (낮을수록 좋음)
        head_importance.sort(key=lambda x: x['entropy'])

        return {
            'head_importance': head_importance,
            'most_focused_head': head_importance[0]['head'],
            'analyzed_at': datetime.now().isoformat()
        }

    def compare_heads(
        self,
        layer_name: str = 'self_attention',
        sample_idx: int = 0,
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        헤드별 비교 시각화

        Args:
            layer_name: 레이어 이름
            sample_idx: 샘플 인덱스
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE:
            return None

        if layer_name not in self.attention_weights:
            return None

        weights = self.attention_weights[layer_name]
        sample_weights = weights[sample_idx]

        n_heads = sample_weights.shape[0]
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        axes = axes.flatten()

        for head_idx in range(min(n_heads, 4)):
            ax = axes[head_idx]

            sns.heatmap(
                sample_weights[head_idx],
                cmap='viridis',
                cbar_kws={'label': 'Attention'},
                ax=ax
            )

            ax.set_title(f'Head {head_idx}', fontsize=14)

        plt.suptitle(f'Attention Heads Comparison: {layer_name}', fontsize=16)
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            return save_path
        else:
            plt.show()
            return None


def softmax(x: np.ndarray) -> np.ndarray:
    """Softmax 함수"""
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()


class VariableSelectionVisualizer:
    """
    Variable Selection 시각화

    TFT의 Variable Selection Network가 선택한 변수 중요도 시각화
    """

    def __init__(
        self,
        variable_names: List[str],
        selection_weights: Optional[np.ndarray] = None
    ):
        """
        Variable Selection Visualizer 초기화

        Args:
            variable_names: 변수 이름 리스트
            selection_weights: 선택 가중치
        """
        self.variable_names = variable_names
        self.selection_weights = selection_weights

        logger.info("Variable Selection Visualizer 초기화 완료")

    def set_weights(self, weights: np.ndarray):
        """가중치 설정"""
        self.selection_weights = weights

    def plot_selection_weights(
        self,
        save_path: Optional[str] = None
    ) -> Optional[str]:
        """
        변수 선택 가중치 플롯

        Args:
            save_path: 저장 경로

        Returns:
            저장된 파일 경로
        """
        if not PLOTTING_AVAILABLE or self.selection_weights is None:
            return None

        fig, ax = plt.subplots(figsize=(12, 8))

        # 정렬
        sorted_idx = np.argsort(self.selection_weights)[::-1]

        y_pos = np.arange(len(self.variable_names))
        weights = self.selection_weights[sorted_idx]
        names = [self.variable_names[i] for i in sorted_idx]

        bars = ax.barh(y_pos, weights, color='steelblue')

        # 상위 10개 강조
        for i in range(min(10, len(bars))):
            bars[i].set_color('coral')

        ax.set_yticks(y_pos)
        ax.set_yticklabels(names)
        ax.invert_yaxis()
        ax.set_xlabel('Selection Weight', fontsize=12)
        ax.set_title('Variable Selection Weights', fontsize=14)
        ax.grid(axis='x', alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            plt.close()
            return save_path
        else:
            plt.show()
            return None

    def get_top_variables(
        self,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        상위 변수 조회

        Args:
            top_k: 반환할 변수 수

        Returns:
            상위 변수 리스트
        """
        if self.selection_weights is None:
            return []

        sorted_idx = np.argsort(self.selection_weights)[::-1]

        return [
            {
                'rank': i + 1,
                'variable': self.variable_names[idx],
                'weight': float(self.selection_weights[idx])
            }
            for i, idx in enumerate(sorted_idx[:top_k])
        ]

    def get_selection_summary(self) -> Dict[str, Any]:
        """
        선택 요약 조회

        Returns:
            요약 정보
        """
        if self.selection_weights is None:
            return {}

        return {
            'total_variables': len(self.variable_names),
            'selected_variables': int(np.sum(self.selection_weights > 0.1)),
            'top_variable': self.variable_names[np.argmax(self.selection_weights)],
            'max_weight': float(np.max(self.selection_weights)),
            'mean_weight': float(np.mean(self.selection_weights)),
            'std_weight': float(np.std(self.selection_weights)),
            'top_variables': self.get_top_variables(10)
        }
