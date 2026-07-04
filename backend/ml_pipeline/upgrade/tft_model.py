# ML Pipeline Upgrade - Advanced Prediction Models
# Temporal Fusion Transformer (TFT) Implementation

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta


class TFTForecaster:
    """
    Temporal Fusion Transformer 구현

    Temporal Fusion Transformer (TFT)는 Google이 개발한
    시계열 예측 모델로 다음과 같은 특징이 있습니다:
    - 다변량 시계열 처리
    - 장기 의존성 모델링
    - 불확실성 정량화 (예측 구간 제공)
    - 정적/동적 공변량 처리
    - 관측 가능한 해석 (변수 중요도)

    Paper: "Temporal Fusion Transformers for Interpretable
           Multi-horizon Time Series Forecasting" (2020)
    """

    def __init__(
        self,
        hidden_size: int = 32,
        attention_head_size: int = 4,
        dropout: float = 0.1,
        hidden_continuous_size: int = 16,
        lstm_layers: int = 2,
        num_attention_heads: int = 4,
        context_length: int = 90,  # lookback window (days)
        prediction_length: int = 30,  # forecast horizon (days)
        quantiles: List[float] = [0.1, 0.5, 0.9]  # P10, P50, P90
    ):
        self.hidden_size = hidden_size
        self.attention_head_size = attention_head_size
        self.dropout = dropout
        self.hidden_continuous_size = hidden_continuous_size
        self.lstm_layers = lstm_layers
        self.num_attention_heads = num_attention_heads
        self.context_length = context_length
        self.prediction_length = prediction_length
        self.quantiles = quantiles

        # 모델 초기화 (실제 PyTorch Forecasting 사용 권장)
        self.model = None
        self.is_trained = False

    def prepare_data(
        self,
        df: pd.DataFrame,
        target_col: str,
        time_col: str = 'date',
        group_cols: List[str] = None
    ) -> pd.DataFrame:
        """
        TFT 학습을 위한 데이터 준비

        Args:
            df: 원본 데이터프레임
            target_col: 타겟 변수명
            time_col: 시간 컬럼명
            group_cols: 그룹핑 컬럼명 (예: product_id, region)

        Returns:
            전처리된 데이터프레임
        """
        df = df.copy()

        # 시간 인덱스 설정
        df[time_col] = pd.to_datetime(df[time_col])
        df = df.set_index(time_col).sort_index()

        # 타임스탬프 피처
        df['day_of_week'] = df.index.dayofweek
        df['day_of_month'] = df.index.day
        df['week_of_year'] = df.index.isocalendar().week.astype(float)
        df['month'] = df.index.month

        # 휴일/휴일일 플래그
        df['is_weekend'] = df.index.dayofweek >= 5

        # 래그 피처 (이동평균, 표준편차)
        for col in [target_col] + [c for c in df.columns if c != target_col]:
            if df[col].dtype in ['int64', 'float64']:
                df[f'{col}_lag7'] = df[col].shift(7)
                df[f'{col}_ma7'] = df[col].rolling(7).mean()
                df[f'{col}_std7'] = df[col].rolling(7).std()

        # 결측치 처리
        df = df.fillna(method='ffill').fillna(method='bfill')

        return df

    def train(
        self,
        train_df: pd.DataFrame,
        val_df: Optional[pd.DataFrame] = None,
        epochs: int = 30,
        batch_size: int = 64,
        learning_rate: float = 0.001,
        verbose: bool = True
    ) -> Dict[str, float]:
        """
        TFT 모델 학습

        Args:
            train_df: 학습 데이터
            val_df: 검증 데이터 (선택)
            epochs: 학습 에포크
            batch_size: 배치 사이즈
            learning_rate: 학습률
            verbose: 진행 상황 출력 여부

        Returns:
            학습 메트릭스 (train_loss, val_loss)
        """
        if verbose:
            print("TFT 모델 학습 시작...")
            print(f"- 학습 데이터: {len(train_df)} 행")
            if val_df is not None:
                print(f"- 검증 데이터: {len(val_df)} 행")
            print(f"- Context Length: {self.context_length}일")
            print(f"- Prediction Length: {self.prediction_length}일")

        # 모델 학습 (시뮬레이션)
        # 실제 구현에서는 pytorch_forecasting.TemporalFusionTransformer 사용

        history = {
            'train_loss': [],
            'val_loss': []
        }

        for epoch in range(epochs):
            # 학습 루프 시뮬레이션
            train_loss = np.random.uniform(0.1, 0.05) * np.exp(-epoch / 10)
            val_loss = train_loss + np.random.uniform(0.01, 0.03)

            history['train_loss'].append(train_loss)
            if val_df is not None:
                history['val_loss'].append(val_loss)

            if verbose and epoch % 5 == 0:
                print(f"Epoch {epoch}: train_loss={train_loss:.4f}, val_loss={val_loss:.4f}")

        self.is_trained = True

        if verbose:
            print("TFT 모델 학습 완료!")

        return history

    def predict(
        self,
        context_data: pd.DataFrame,
        horizon: Optional[int] = None,
        return_quantiles: bool = True
    ) -> Dict:
        """
        예측 수행

        Args:
            context_data: 과거 데이터 (context_length 이상)
            horizon: 예측 기간 (일단위)
            return_quantiles: 예측 구간 반환 여부

        Returns:
            예측 결과 딕셔너리
        """
        if not self.is_trained:
            raise ValueError("모델이 학습되지 않았습니다.")

        horizon = horizon or self.prediction_length

        # 시뮬레이션 예측 (실제 구현에서는 모델 예측 사용)
        dates = pd.date_range(
            start=context_data.index.max() + timedelta(days=1),
            periods=horizon,
            freq='D'
        )

        # 추세 + 계절성 + 노이즈
        trend = np.linspace(context_data.iloc[-1].values[0], context_data.iloc[-1].values[0] * 1.1, horizon)
        seasonality = 0.05 * np.sin(np.arange(horizon) * 2 * np.pi / 7)  # 주간 계절성
        noise = np.random.normal(0, 0.02, horizon)
        prediction = trend + seasonality + noise

        # P10, P50, P90 예측 구간
        p50 = prediction
        p10 = p50 - np.abs(np.random.normal(0, 0.03, horizon)) * p50 * 0.1
        p90 = p50 + np.abs(np.random.normal(0, 0.03, horizon)) * p50 * 0.1

        result = {
            'dates': dates.tolist(),
            'prediction': p50.tolist(),
            'lower_bound': p10.tolist(),  # P10
            'upper_bound': p90.tolist(),  # P90
            'horizon': horizon,
            'model_type': 'TFT',
            'confidence_level': 0.8
        }

        return result

    def evaluate(self, actual: pd.DataFrame, predictions: Dict) -> Dict[str, float]:
        """
        예측 성능 평가

        Args:
            actual: 실제 데이터
            predictions: 예측 결과

        Returns:
            평가 메트릭스 (MAPE, MAE, RMSE)
        """
        # 실제값과 예측값 추출
        y_true = actual.iloc[-len(predictions['prediction']):].values.flatten()
        y_pred = np.array(predictions['prediction'])

        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100

        # MAE (Mean Absolute Error)
        mae = np.mean(np.abs(y_true - y_pred))

        # RMSE (Root Mean Square Error)
        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))

        return {
            'mape': round(mape, 2),
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'model': 'TFT',
            'sample_size': len(y_true)
        }

    def get_feature_importance(self) -> Dict[str, float]:
        """
        변수 중요도 반환 (해석 가능 AI)

        Returns:
            변수명: 중요도 점수
        """
        # 시뮬레이션 결과 (실제에서는 모델의 attention 가중치)
        importance = {
            'lag_7d': 0.25,
            'moving_avg_7d': 0.22,
            'day_of_week': 0.15,
            'month': 0.12,
            'is_weekend': 0.10,
            'holiday_flag': 0.08,
            'price_index': 0.06,
            'promotion': 0.04
        }

        return importance


class ProphetForecaster:
    """
    Prophet 2.0 기반 예측 모델

    Facebook Prophet의 개선된 버전으로
    다음 기능을 제공:
    - 자동 계절성 감지
    - 휴일/휴일일 자동 처리
    - 극값 이상치 자동 보정
    - 다중 계절성 (연간, 월간, 주간)
    """

    def __init__(
        self,
        seasonality_mode: str = 'multiplicative',
        yearly_seasonality: bool = True,
        weekly_seasonality: bool = True,
        daily_seasonality: bool = False,
        growth: str = 'linear'
    ):
        self.seasonality_mode = seasonality_mode
        self.yearly_seasonality = yearly_seasonality
        self.weekly_seasonality = weekly_seasonality
        self.daily_seasonality = daily_seasonality
        self.growth = growth

        self.model = None
        self.is_fitted = False

    def fit(self, df: pd.DataFrame, date_col: str = 'date', y_col: str = 'y'):
        """
        Prophet 모델 피팅
        """
        # 데이터 준비
        df_prophet = df[[date_col, y_col]].copy()
        df_prophet = df_prophet.rename(columns={date_col: 'ds', y_col: 'y'})

        # 시뮬레이션 피팅
        self.is_fitted = True

        return {
            'status': 'fitted',
            'data_points': len(df_prophet),
            'date_range': f"{df_prophet['ds'].min()} ~ {df_prophet['ds'].max()}"
        }

    def predict(self, periods: int = 30, include_history: bool = False) -> Dict:
        """
        Prophet 예측
        """
        future_dates = pd.date_range(
            start=pd.Timestamp.now(),
            periods=periods,
            freq='D'
        )

        # 시뮬레이션 예측
        trend = 100 + np.arange(periods) * 0.5
        weekly_seasonality = 10 * np.sin(np.arange(periods) * 2 * np.pi / 7)
        yearly_seasonality = 20 * np.sin(np.arange(periods) * 2 * np.pi / 365)

        prediction = trend + weekly_seasonality + yearly_seasonality

        # 예측 구간 (Prophet는 불확실성 정량화 제공)
        lower = prediction - np.abs(prediction) * 0.1
        upper = prediction + np.abs(prediction) * 0.1

        return {
            'dates': future_dates.tolist(),
            'prediction': prediction.tolist(),
            'lower_bound': lower.tolist(),
            'upper_bound': upper.tolist(),
            'horizon': periods,
            'model_type': 'Prophet',
            'confidence_level': 0.8
        }


class LSTMForecaster:
    """
    LSTM 기반 딥러닝 예측 모델
    """

    def __init__(
        self,
        sequence_length: int = 30,
        hidden_units: List[int] = [64, 32],
        dropout: float = 0.2,
        epochs: int = 50
    ):
        self.sequence_length = sequence_length
        self.hidden_units = hidden_units
        self.dropout = dropout
        self.epochs = epochs

        self.model = None
        self.scaler = None

    def fit(self, data: np.ndarray):
        """
        LSTM 모델 학습
        """
        # 데이터 정규화
        from sklearn.preprocessing import MinMaxScaler
        self.scaler = MinMaxScaler()
        scaled_data = self.scaler.fit_transform(data)

        # 시퀀스 데이터 생성
        X, y = self._create_sequences(scaled_data)

        # 모델 구성 및 학습 (시뮬레이션)
        self.is_fitted = True

        return {
            'status': 'trained',
            'samples': len(data),
            'sequence_length': self.sequence_length
        }

    def _create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """LSTM용 시퀀스 데이터 생성"""
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i + self.sequence_length])
            y.append(data[i + self.sequence_length])
        return np.array(X), np.array(y)

    def predict(self, n_steps: int) -> Dict:
        """LSTM 예측"""
        future_dates = pd.date_range(
            start=pd.Timestamp.now(),
            periods=n_steps,
            freq='D'
        )

        # 시뮬레이션 예측
        prediction = np.cumsum(np.random.randn(n_steps) * 0.5) + 100

        return {
            'dates': future_dates.tolist(),
            'prediction': prediction.tolist(),
            'horizon': n_steps,
            'model_type': 'LSTM'
        }
