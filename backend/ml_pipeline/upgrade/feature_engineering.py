# ML Pipeline Upgrade - Advanced Feature Engineering
# 고급 피처 엔지니어링: 시계열 예측을 위한 피처 생성 및 전처리

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
import holidays


class AdvancedFeatureEngineering:
    """
    고급 피처 엔지니어링

    시계열 예측 모델(TFT, Prophet, LSTM 등)의 성능을 높이기 위한
    다양한 피처 생성 및 전처리 기능 제공

    주요 기능:
    1. 시간 기반 피처 (Temporal Features)
    2. 래그 피처 (Lag Features)
    3. 윈도우 피처 (Window Features)
    4. 통계적 피처 (Statistical Features)
    5. 도메인 특화 피처 (Domain Features)
    6. 외부 변수 병합 (External Variables)
    """

    def __init__(
        self,
        country: str = 'KR',
        target_col: str = 'target',
        date_col: str = 'date'
    ):
        self.country = country
        self.target_col = target_col
        self.date_col = date_col
        self.holidays = holidays.CountryHoliday(country)

    def create_features(
        self,
        df: pd.DataFrame,
        include_lags: bool = True,
        include_windows: bool = True,
        include_statistics: bool = True
    ) -> pd.DataFrame:
        """
        전체 고급 피처 생성

        Args:
            df: 원본 데이터프레임
            include_lags: 래그 피처 생성 여부
            include_windows: 윈도우 피처 생성 여부
            include_statistics: 통계적 피처 생성 여부

        Returns:
            피처가 추가된 데이터프레임
        """
        df = df.copy()

        # 시간 인덱스 설정
        if self.date_col in df.columns:
            df[self.date_col] = pd.to_datetime(df[self.date_col])
            df = df.set_index(self.date_col).sort_index()

        # 피처 생성
        df = self._create_temporal_features(df)
        df = self._create_holiday_features(df)

        if include_lags:
            df = self._create_lag_features(df)

        if include_windows:
            df = self._create_window_features(df)

        if include_statistics:
            df = self._create_statistical_features(df)

        df = self._create_change_features(df)
        df = self._create_volatility_features(df)

        return df

    def _create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        시간 기반 피처 생성
        """
        # 기본 시간 피처
        df['year'] = df.index.year
        df['month'] = df.index.month
        df['day'] = df.index.day
        df['dayofweek'] = df.index.dayofweek
        df['dayofyear'] = df.index.dayofyear
        df['weekofyear'] = df.index.isocalendar().week.astype(float)
        df['quarter'] = df.index.quarter

        # 주말/주말 플래그
        df['is_weekend'] = df.index.dayofweek >= 5
        df['is_month_start'] = df.index.day <= 7
        df['is_month_end'] = df.index.day >= 25
        df['is_quarter_start'] = df.index.month % 3 == 1
        df['is_quarter_end'] = df.index.month % 3 == 0

        # 월간 진행율
        df['month_progress'] = df.index.day / df.index.days_in_month

        return df

    def _create_holiday_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        휴일 피처 생성
        """
        # 휴일 여부
        df['is_holiday'] = [d in self.holidays for d in df.index]

        # 휴일 전후 여부
        df['days_to_holiday'] = 0
        df['days_after_holiday'] = 0

        # 다음 휴일까지 남은 일수
        holiday_dates = list(self.holidays)
        for i, date in enumerate(df.index):
            # 다음 휴일 찾기
            future_holidays = [h for h in holiday_dates if h > date]
            if future_holidays:
                df.at[df.index[i], 'days_to_holiday'] = (future_holidays[0] - date).days

            # 지난 휴일로부터 경과 일수
            past_holidays = [h for h in holiday_dates if h < date]
            if past_holidays:
                df.at[df.index[i], 'days_after_holiday'] = (date - past_holidays[-1]).days

        return df

    def _create_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        래그 피처 생성 (과거 값이 현재에 미치는 영향)
        """
        # 타겟 변수의 래그 피처
        if self.target_col in df.columns:
            for lag in [1, 7, 14, 30]:
                df[f'{self.target_col}_lag{lag}'] = df[self.target_col].shift(lag)

        # 주별 래그 (요일별 패턴)
        for day in range(7):
            df[f'{self.target_col}_lag_day{day}'] = df[self.target_col].shift(day)

        return df

    def _create_window_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        윈도우 피처 생성 (이동 평균, 표준편차 등)
        """
        if self.target_col in df.columns:
            target = df[self.target_col]

            # 단순 이동 평균
            for window in [3, 7, 14, 30]:
                df[f'{self.target_col}_ma{window}'] = target.rolling(window=window).mean()
                df[f'{self.target_col}_std{window}'] = target.rolling(window=window).std()

            # 지수 가중 이동 평균 (최근 값에 더 높은 가중치)
            for span in [7, 14, 30]:
                df[f'{self.target_col}_ewma{span}'] = target.ewm(span=span, adjust=False).mean()

            # 최소/최대값
            for window in [7, 14, 30]:
                df[f'{self.target_col}_max{window}'] = target.rolling(window=window).max()
                df[f'{self.target_col}_min{window}'] = target.rolling(window=window).min()

            # 중앙값 ( Median ) - 이상치에 강건
            df[f'{self.target_col}_median7'] = target.rolling(7).median()
            df[f'{self.target_col}_median14'] = target.rolling(14).median()
            df[f'{self.target_col}_median30'] = target.rolling(30).median()

        return df

    def _create_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        통계적 피처 생성
        """
        if self.target_col in df.columns:
            target = df[self.target_col]

            # 변화량
            df[f'{self.target_col}_diff1'] = target.diff(1)
            df[f'{self.target_col}_diff7'] = target.diff(7)
            df[f'{self.target_col}_diff30'] = target.diff(30)

            # 변화율
            df[f'{self.target_col}_pct_change1'] = target.pct_change(1)
            df[f'{self.target_col}_pct_change7'] = target.pct_change(7)
            df[f'{self.target_col}_pct_change30'] = target.pct_change(30)

            # 가속도 (Acceleration)
            df[f'{self.target_col}_acceleration'] = df[f'{self.target_col}_diff1'].diff()

        return df

    def _create_change_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        변화율 및 추세 피처
        """
        if self.target_col in df.columns:
            target = df[self.target_col]

            # YOY (Year-over-Year) 변화율
            df[f'{self.target_col}_yoy'] = target.pct_change(252)  # 252 거래일

            # MOM (Month-over-Month) 변화율
            df[f'{self.target_col}_mom'] = target.pct_change(21)  # 21 거래일 (대략 1개월)

            # WoW (Week-over-Week) 변화율
            df[f'{self.target_col}_wow'] = target.pct_change(7)  # 7 거래일

        return df

    def _create_volatility_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        변동성 피처 생성
        """
        if self.target_col in df.columns:
            target = df[self.target_col]

            # 롤링 (Rolling) 표준편차 (변동성 척도)
            for window in [7, 14, 30]:
                df[f'{self.target_col}_volatility{window}'] = target.rolling(window).std()

            # 변동폭 (Range) - 최대-최소
            for window in [7, 14, 30]:
                df[f'{self.target_col}_range{window}'] = (
                    target.rolling(window).max() - target.rolling(window).min()
                )

            # CV (Coefficient of Variation) = 표준편차/평균
            for window in [7, 14, 30]:
                mean = target.rolling(window).mean()
                std = target.rolling(window).std()
                df[f'{self.target_col}_cv{window}'] = std / (mean + 1e-8)

        return df

    def add_external_variables(
        self,
        df: pd.DataFrame,
        external_data: Dict[str, pd.DataFrame]
    ) -> pd.DataFrame:
        """
        외부 변수 병합

        Args:
            df: 메인 데이터프레임
            external_data: 외부 데이터 딕셔너리 {'economic': df_econ, 'weather': df_weather}

        Returns:
            외부 변수가 추가된 데이터프레임
        """
        for name, ext_df in external_data.items():
            if 'date' in ext_df.columns:
                ext_df['date'] = pd.to_datetime(ext_df['date'])
                ext_df = ext_df.set_index('date')

            # 인덱스 기준 조인 (left join)
            df = df.join(ext_df, how='left', rsuffix=f'_{name}')

        return df

    def create_domain_features(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        도메인 특화 피처 생성

        비즈니스 도메인에 특화된 피처를 생성하여
        예측 모델의 성능 향상
        """
        df = df.copy()

        # 작업일 (Working Days) 계산
        df['working_days_in_month'] = df.index.days_in_month - 8 * 2  # 주말 8일 제외
        df['working_day_of_month'] = df.apply(
            lambda row: self._calculate_working_days(row.name),
            axis=1
        )

        # 재고 회전율 관련 피처
        if 'sales' in df.columns and 'inventory' in df.columns:
            df['inventory_turnover'] = df['sales'] / (df['inventory'] + 1e-8)

        # 생산성 관련 피처
        if 'production_volume' in df.columns and 'capacity' in df.columns:
            df['capacity_utilization'] = df['production_volume'] / (df['capacity'] + 1e-8)

        return df

    def _calculate_working_days(self, date: datetime) -> int:
        """
        해당 월의 경과 working days 수 계산
        """
        working_days = 0
        current_day = date.day

        # 단순 계산 (실제로는 휴일 제외 필요)
        for day in range(1, current_day + 1):
            check_date = date.replace(day=day)
            if check_date.weekday() < 5 and check_date not in self.holidays:
                working_days += 1

        return working_days

    def detect_outliers(
        self,
        df: pd.DataFrame,
        method: str = 'iqr',
        threshold: float = 3.0
    ) -> pd.DataFrame:
        """
        이상치 탐지

        Args:
            df: 데이터프레임
            method: 이상치 탐지 방법 ('iqr', 'zscore', 'isolation')
            threshold: 임계값

        Returns:
            이상치 플래그가 추가된 데이터프레임
        """
        df = df.copy()

        if self.target_col not in df.columns:
            return df

        target = df[self.target_col]

        if method == 'iqr':
            # IQR (Interquartile Range) 방법
            Q1 = target.quantile(0.25)
            Q3 = target.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df['is_outlier'] = (target < lower_bound) | (target > upper_bound)

        elif method == 'zscore':
            # Z-score 방법
            mean = target.mean()
            std = target.std()
            z_scores = (target - mean) / std
            df['is_outlier'] = np.abs(z_scores) > threshold

        elif method == 'isolation':
            # Isolation Forest 방법 (실제로는 sklearn 사용)
            # 간단 구현을 위해 통계적 방법 사용
            from scipy import stats
            z_scores = np.abs(stats.zscore(target))
            df['is_outlier'] = z_scores > threshold

        # 이상치 보정 (선택적)
        df[f'{self.target_col}_cleaned'] = df[target]
        df.loc[df['is_outlier'], f'{self.target_col}_cleaned'] = df[target].rolling(7).median()

        return df

    def scale_features(
        self,
        df: pd.DataFrame,
        method: str = 'standard',
        feature_range: Tuple[float, float] = (0, 1)
    ) -> Tuple[pd.DataFrame, object]:
        """
        피처 스케일링 (정규화)

        Args:
            df: 데이터프레임
            method: 스케일링 방법 ('standard', 'minmax', 'robust')
            feature_range: MinMax 스케일링 범위

        Returns:
            (스케일링된 데이터프레임, 스케일러 객체)
        """
        df = df.copy()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler(feature_range=feature_range)
        elif method == 'robust':
            from sklearn.preprocessing import RobustScaler
            scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")

        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

        return df, scaler

    def reduce_features(
        self,
        df: pd.DataFrame,
        method: str = 'pca',
        variance_threshold: float = 0.95
    ) -> Tuple[pd.DataFrame, object]:
        """
        차원 축소 (Feature Reduction)

        Args:
            df: 데이터프레임
            method: 차원 축소 방법 ('pca', 'kbest', 'rfe')
            variance_threshold: 설명된 분산 임계값

        Returns:
            (차원 축소된 데이터프레임, 변환기 객체)
        """
        df = df.copy()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if method == 'pca':
            # PCA (Principal Component Analysis)
            pca = PCA(n_components=variance_threshold)
            df_transformed = pca.fit_transform(df[numeric_cols])

            # PCA 컬럼명 생성
            pca_cols = [f'pca_{i+1}' for i in range(df_transformed.shape[1])]
            pca_df = pd.DataFrame(df_transformed, index=df.index, columns=pca_cols)

            # 원본 컬럼 유지
            for col in df.columns:
                if col not in numeric_cols:
                    pca_df[col] = df[col]

            return pca_df, pca

        elif method == 'kbest':
            # SelectKBest (통계적 방법)
            from sklearn.feature_selection import SelectKBest, f_regression
            if self.target_col not in df.columns:
                raise ValueError(f"Target column {self.target_col} not found")

            # 목표 변수와 특성 변수 분리
            X = df[numeric_cols]
            y = df[self.target_col]

            # 상위 K개 특성 선택
            k = max(1, int(len(numeric_cols) * 0.5))  # 상위 50%
            selector = SelectKBest(f_regression, k=k)
            X_selected = selector.fit_transform(X, y)

            selected_cols = [numeric_cols[i] for i in selector.get_support(indices=True)]
            kbest_df = pd.DataFrame(X_selected, index=df.index, columns=selected_cols)

            # 타겟 변수 유지
            kbest_df[self.target_col] = y

            # 기타 컬럼 유지
            for col in df.columns:
                if col not in numeric_cols and col != self.target_col:
                    kbest_df[col] = df[col]

            return kbest_df, selector

        else:
            raise ValueError(f"Unknown reduction method: {method}")

    def get_feature_importance(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None
    ) -> Dict[str, float]:
        """
        피처 중요도 분석

        Args:
            df: 데이터프레임
            target_col: 타겟 변수명 (None인 경우 자동 감지)

        Returns:
            피처 중요도 딕셔너리
        """
        if target_col is None:
            target_col = self.target_col

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if target_col not in numeric_cols:
            raise ValueError(f"Target column {target_col} not found in numeric columns")

        X = df[numeric_cols]
        y = df[target_col]

        importances = {}

        # 1. 상관계 기반 중요도
        correlations = abs(X.corrwith(y))
        for col, corr in correlations.items():
            if col != target_col:
                importances[f'{col}_correlation'] = abs(corr)

        # 2. Random Forest 기반 중요도
        from sklearn.ensemble import RandomForestRegressor

        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X, y)

        feature_importance = rf.feature_importances_
        for col, importance in zip(numeric_cols, feature_importance):
            importances[f'{col}_rf'] = importance

        return dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

    def get_feature_statistics(self, df: pd.DataFrame) -> Dict:
        """
        피처 통계 정보

        Returns:
            피처별 통계 요약
        """
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        stats = {}

        for col in numeric_cols:
            series = df[col].dropna()
            stats[col] = {
                'count': len(series),
                'mean': float(series.mean()),
                'std': float(series.std()),
                'min': float(series.min()),
                'max': float(series.max()),
                'median': float(series.median()),
                'q25': float(series.quantile(0.25)),
                'q75': float(series.quantile(0.75)),
                'missing_pct': float(series.isna().sum() / len(df) * 100),
                'skewness': float(series.skew()),
                'kurtosis': float(series.kurtosis())
            }

        return {
            'feature_statistics': stats,
            'total_features': len(numeric_cols),
            'total_rows': len(df)
        }


class RealTimeFeaturePipeline:
    """
    실시간 피처 파이프라인

    스트리밍 데이터 실시간 처리 및 피처 업데이트
    """

    def __init__(
        self,
        feature_engineer: AdvancedFeatureEngineering,
        update_frequency: int = 3600  # 초 (기본 1시간)
    ):
        self.feature_engineer = feature_engineer
        self.update_frequency = update_frequency
        self.feature_cache = {}
        self.last_update = None

    def process_streaming_data(
        self,
        new_data: Dict,
        history_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        스트리밍 데이터 실시간 처리

        Args:
            new_data: 새로운 데이터 포인트
            history_df: 과거 데이터

        Returns:
            피처가 추가된 데이터프레임
        """
        # 새로운 데이터를 DataFrame으로 변환
        df_new = pd.DataFrame([new_data])

        # 과거 데이터와 결합
        df_combined = pd.concat([history_df, df_new], ignore_index=True)

        # 피처 생성
        df_features = self.feature_engineer.create_features(
            df_combined,
            include_lags=True,
            include_windows=True,
            include_statistics=True
        )

        # 최신 데이터만 반환
        return df_features.iloc[[-1]]

    def update_features_incremental(
        self,
        new_data: Dict,
        full_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        증분 피처 업데이트

        전체 데이터프레임을 다시 계산하지 않고
        변경된 부분만 업데이트
        """
        # 마지막 행의 데이터를 업데이트
        last_index = full_df.index[-1]

        # 최근 데이터만 재계산 (최적화)
        recent_window = min(30, len(full_df))
        df_recent = full_df.iloc[-recent_window:]

        # 피처 재계산
        df_features = self.feature_engineer.create_features(df_recent)

        # 전체 데이터프레임 업데이트
        full_df.update(df_features)

        self.last_update = datetime.now()

        return full_df

    def get_feature_drift_score(
        self,
        recent_df: pd.DataFrame,
        historical_df: pd.DataFrame
    ) -> Dict[str, float]:
        """
        피처 드리프트 점수 계산

        데이터 분포의 변화를 감지하여
        모델 재학습이 필요한지 판단

        Returns:
            드리프트 점수
        """
        if self.target_col not in recent_df.columns:
            return {}

        recent_mean = recent_df[self.target_col].mean()
        historical_mean = historical_df[self.target_col].mean()

        recent_std = recent_df[self.target_col].std()
        historical_std = historical_df[self.target_col].std()

        # 평균 변화
        mean_shift = abs(recent_mean - historical_mean) / (historical_mean + 1e-8)

        # 분산 변화
        volatility_change = abs(recent_std - historical_std) / (historical_std + 1e-8)

        # 드리프트 점수 (0-1, 높을수록 재학습 필요)
        drift_score = (mean_shift * 0.7 + volatility_change * 0.3)

        return {
            'drift_score': round(drift_score, 3),
            'mean_shift_pct': round(mean_shift * 100, 2),
            'volatility_change_pct': round(volatility_change * 100, 2),
            'retrain_recommended': drift_score > 0.15  # 15% 이상이면 재학습 권장
        }
