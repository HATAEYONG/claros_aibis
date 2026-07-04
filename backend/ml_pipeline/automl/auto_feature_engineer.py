"""
Auto Feature Engineer

Automated feature engineering for time series data
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import feature engineering libraries
TSFRESH_AVAILABLE = False
FEATURETOOLS_AVAILABLE = False

try:
    import tsfresh
    from tsfresh import extract_features
    from tsfresh.feature_extraction import EfficientFCParameters
    TSFRESH_AVAILABLE = True
except ImportError:
    pass

try:
    import featuretools as ft
    FEATURETOOLS_AVAILABLE = True
except ImportError:
    pass


class AutoFeatureEngineer:
    """
    Automated feature engineering for time series

    Features:
    - Automatic feature generation
    - Feature selection
    - Feature importance ranking
    - Feature transformation
    """

    def __init__(
        self,
        max_features: int = 100,
        feature_selection_method: str = 'importance',  # importance, correlation, mutual
        scaling_method: str = 'standard'  # standard, minmax, robust
    ):
        self.max_features = max_features
        self.feature_selection_method = feature_selection_method
        self.scaling_method = scaling_method

        self.generated_features = []
        self.selected_features = []
        self.feature_importance = {}
        self.scaler = None

        logger.info("AutoFeatureEngineer initialized")

    def generate_features(
        self,
        data: pd.DataFrame,
        time_col: str = 'date',
        target_col: str = 'value',
        include_tsfresh: bool = True,
        include_manual: bool = True
    ) -> pd.DataFrame:
        """
        Generate features automatically

        Args:
            data: Input data
            time_col: Time column name
            target_col: Target column name
            include_tsfresh: Include tsfresh features
            include_manual: Include manual features

        Returns:
            DataFrame with generated features
        """
        logger.info("Generating features automatically")

        df = data.copy()
        df[time_col] = pd.to_datetime(df[time_col])

        features_df = df[[time_col, target_col]].copy()

        # Manual features
        if include_manual:
            features_df = self._generate_manual_features(
                features_df,
                time_col,
                target_col
            )

        # TSFresh features
        if include_tsfresh and TSFRESH_AVAILABLE:
            features_df = self._generate_tsfresh_features(
                features_df,
                time_col,
                target_col
            )

        self.generated_features = [
            col for col in features_df.columns
            if col not in [time_col, target_col]
        ]

        logger.info(f"Generated {len(self.generated_features)} features")

        return features_df

    def _generate_manual_features(
        self,
        df: pd.DataFrame,
        time_col: str,
        target_col: str
    ) -> pd.DataFrame:
        """Generate manual time series features"""
        # Temporal features
        df['year'] = df[time_col].dt.year
        df['month'] = df[time_col].dt.month
        df['day'] = df[time_col].dt.day
        df['dayofweek'] = df[time_col].dt.dayofweek
        df['dayofyear'] = df[time_col].dt.dayofyear
        df['week'] = df[time_col].dt.isocalendar().week.values
        df['quarter'] = df[time_col].dt.quarter
        df['is_weekend'] = (df[time_col].dt.dayofweek >= 5).astype(int)
        df['is_month_start'] = df[time_col].dt.is_month_start.astype(int)
        df['is_month_end'] = df[time_col].dt.is_month_end.astype(int)
        df['is_quarter_start'] = df[time_col].dt.is_quarter_start.astype(int)
        df['is_quarter_end'] = df[time_col].dt.is_quarter_end.astype(int)

        # Lag features
        for lag in [1, 2, 3, 7, 14, 30]:
            df[f'lag_{lag}'] = df[target_col].shift(lag)

        # Rolling window features
        for window in [3, 7, 14, 30]:
            df[f'rolling_mean_{window}'] = df[target_col].rolling(window=window).mean()
            df[f'rolling_std_{window}'] = df[target_col].rolling(window=window).std()
            df[f'rolling_min_{window}'] = df[target_col].rolling(window=window).min()
            df[f'rolling_max_{window}'] = df[target_col].rolling(window=window).max()
            df[f'rolling_median_{window}'] = df[target_col].rolling(window=window).median()

        # Difference features
        df['diff_1'] = df[target_col].diff(1)
        df['diff_7'] = df[target_col].diff(7)
        df['diff_30'] = df[target_col].diff(30)

        # Percentage change
        df['pct_change_1'] = df[target_col].pct_change(1)
        df['pct_change_7'] = df[target_col].pct_change(7)
        df['pct_change_30'] = df[target_col].pct_change(30)

        # Expanding features
        df['expanding_mean'] = df[target_col].expanding().mean()
        df['expanding_std'] = df[target_col].expanding().std()
        df['expanding_max'] = df[target_col].expanding().max()
        df['expanding_min'] = df[target_col].expanding().min()

        # Seasonal features (sine/cosine)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['dayofweek_sin'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
        df['dayofweek_cos'] = np.cos(2 * np.pi * df['dayofweek'] / 7)

        # Trend features
        df['trend'] = range(len(df))
        df['trend_squared'] = df['trend'] ** 2

        # Momentum
        df['momentum_7'] = df[target_col] - df[target_col].shift(7)
        df['momentum_30'] = df[target_col] - df[target_col].shift(30)

        # Volatility
        df['volatility_7'] = df[target_col].rolling(7).std()
        df['volatility_30'] = df[target_col].rolling(30).std()

        return df

    def _generate_tsfresh_features(
        self,
        df: pd.DataFrame,
        time_col: str,
        target_col: str
    ) -> pd.DataFrame:
        """Generate TSFresh features"""
        if not TSFRESH_AVAILABLE:
            return df

        try:
            # Prepare data for TSFresh
            tsfresh_df = df.copy()
            tsfresh_df['id'] = 1  # Single time series

            # Extract features
            extracted_features = extract_features(
                tsfresh_df[[time_col, target_col, 'id']],
                column_id='id',
                column_sort=time_col,
                column_value=target_col,
                default_fc_parameters=EfficientFCParameters(),
                n_jobs=0
            )

            # Merge features
            merged = pd.concat([df.reset_index(drop=True), extracted_features.reset_index(drop=True)], axis=1)

            return merged

        except Exception as e:
            logger.error(f"TSFresh feature generation failed: {e}")
            return df

    def select_features(
        self,
        features_df: pd.DataFrame,
        target_col: str = 'value',
        method: Optional[str] = None
    ) -> List[str]:
        """
        Select best features

        Args:
            features_df: DataFrame with features
            target_col: Target column name
            method: Selection method (overrides init)

        Returns:
            List of selected feature names
        """
        method = method or self.feature_selection_method

        logger.info(f"Selecting features using {method}")

        # Get feature columns
        feature_cols = [col for col in features_df.columns if col not in [target_col, 'date']]

        if not feature_cols:
            return []

        if method == 'importance':
            self.selected_features = self._select_by_importance(features_df, feature_cols, target_col)
        elif method == 'correlation':
            self.selected_features = self._select_by_correlation(features_df, feature_cols, target_col)
        elif method == 'mutual':
            self.selected_features = self._select_by_mutual_info(features_df, feature_cols, target_col)
        else:
            self.selected_features = feature_cols[:self.max_features]

        logger.info(f"Selected {len(self.selected_features)} features")

        return self.selected_features

    def _select_by_importance(
        self,
        df: pd.DataFrame,
        feature_cols: List[str],
        target_col: str
    ) -> List[str]:
        """Select features by importance using Random Forest"""
        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.impute import SimpleImputer

            # Prepare data
            X = df[feature_cols].fillna(0)
            y = df[target_col].dropna()

            # Align
            X = X.loc[y.index]

            # Train random forest
            rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            rf.fit(X, y)

            # Get importance
            importance = dict(zip(feature_cols, rf.feature_importances_))
            self.feature_importance = importance

            # Sort and select
            sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)

            return [f[0] for f in sorted_features[:self.max_features]]

        except Exception as e:
            logger.error(f"Feature selection by importance failed: {e}")
            return feature_cols[:self.max_features]

    def _select_by_correlation(
        self,
        df: pd.DataFrame,
        feature_cols: List[str],
        target_col: str
    ) -> List[str]:
        """Select features by correlation with target"""
        correlations = {}

        for col in feature_cols:
            try:
                corr = df[col].corr(df[target_col])
                if not np.isnan(corr):
                    correlations[col] = abs(corr)
            except:
                pass

        self.feature_importance = correlations

        sorted_features = sorted(correlations.items(), key=lambda x: x[1], reverse=True)

        return [f[0] for f in sorted_features[:self.max_features]]

    def _select_by_mutual_info(
        self,
        df: pd.DataFrame,
        feature_cols: List[str],
        target_col: str
    ) -> List[str]:
        """Select features by mutual information"""
        try:
            from sklearn.feature_selection import mutual_info_regression
            from sklearn.impute import SimpleImputer

            # Prepare data
            X = df[feature_cols].fillna(0)
            y = df[target_col].dropna()

            # Align
            X = X.loc[y.index]

            # Calculate mutual information
            mi = mutual_info_regression(X, y, random_state=42)

            # Get importance
            importance = dict(zip(feature_cols, mi))
            self.feature_importance = importance

            # Sort and select
            sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)

            return [f[0] for f in sorted_features[:self.max_features]]

        except Exception as e:
            logger.error(f"Feature selection by mutual info failed: {e}")
            return feature_cols[:self.max_features]

    def scale_features(
        self,
        df: pd.DataFrame,
        feature_cols: Optional[List[str]] = None,
        method: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Scale features

        Args:
            df: Input DataFrame
            feature_cols: Columns to scale (default: selected_features)
            method: Scaling method (default: from init)

        Returns:
            DataFrame with scaled features
        """
        method = method or self.scaling_method
        feature_cols = feature_cols or self.selected_features

        if not feature_cols:
            return df

        from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

        # Get scaler
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        elif method == 'robust':
            scaler = RobustScaler()
        else:
            return df

        # Scale
        df_scaled = df.copy()

        # Handle NaN values
        X = df[feature_cols].fillna(0)

        # Fit and transform
        scaled_values = scaler.fit_transform(X)

        # Update DataFrame
        for i, col in enumerate(feature_cols):
            df_scaled[col] = scaled_values[:, i]

        self.scaler = scaler

        return df_scaled

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        return self.feature_importance

    def transform(
        self,
        data: pd.DataFrame,
        time_col: str = 'date',
        target_col: str = 'value'
    ) -> pd.DataFrame:
        """
        Transform data using fitted feature engineer

        Args:
            data: Input data
            time_col: Time column name
            target_col: Target column name

        Returns:
            Transformed DataFrame
        """
        # Generate features
        features_df = self.generate_features(data, time_col, target_col)

        # Select features
        if self.selected_features:
            cols_to_keep = [time_col, target_col] + self.selected_features
            features_df = features_df[[col for col in cols_to_keep if col in features_df.columns]]

        # Scale features
        if self.scaler:
            features_df = self.scale_features(features_df)

        return features_df


class FeatureSelector:
    """
    Automatic feature selection

    Methods:
    - Recursive Feature Elimination (RFE)
    - SelectKBest
    - Sequential Feature Selection
    """

    def __init__(
        self,
        method: str = 'rfe',  # rfe, kbest, sfs
        n_features: int = 50,
        estimator: str = 'random_forest'  # random_forest, gradient_boosting, linear
    ):
        self.method = method
        self.n_features = n_features
        self.estimator_type = estimator
        self.selector = None

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series
    ) -> 'FeatureSelector':
        """Fit feature selector"""
        from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
        from sklearn.linear_model import LinearRegression

        # Get estimator
        if self.estimator_type == 'random_forest':
            estimator = RandomForestRegressor(n_estimators=100, random_state=42)
        elif self.estimator_type == 'gradient_boosting':
            estimator = GradientBoostingRegressor(random_state=42)
        else:
            estimator = LinearRegression()

        # Get selector
        if self.method == 'rfe':
            from sklearn.feature_selection import RFE
            self.selector = RFE(estimator, n_features_to_select=self.n_features)
        elif self.method == 'kbest':
            from sklearn.feature_selection import SelectKBest, f_regression
            self.selector = SelectKBest(f_regression, k=self.n_features)
        elif self.method == 'sfs':
            from sklearn.feature_selection import SequentialFeatureSelector
            self.selector = SequentialFeatureSelector(estimator, n_features_to_select=self.n_features)

        # Fit
        self.selector.fit(X.fillna(0), y)

        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform features"""
        if self.selector is None:
            raise ValueError("FeatureSelector not fitted. Call fit first.")

        mask = self.selector.get_support()
        selected_cols = X.columns[mask]

        return X[selected_cols]

    def fit_transform(self, X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
        """Fit and transform"""
        self.fit(X, y)
        return self.transform(X)

    def get_selected_features(self) -> List[str]:
        """Get selected feature names"""
        if self.selector is None:
            return []

        mask = self.selector.get_support()
        return list(mask)


class AutoPreprocessor:
    """
    Automated data preprocessing

    Features:
    - Missing value imputation
    - Outlier detection and handling
    - Data type inference
    - Automatic scaling
    """

    def __init__(
        self,
        impute_method: str = 'forward_fill',  # forward_fill, backward_fill, mean, median, knn
        outlier_method: str = 'iqr',  # iqr, zscore, isolation
        scaling_method: str = 'standard'  # standard, minmax, robust
    ):
        self.impute_method = impute_method
        self.outlier_method = outlier_method
        self.scaling_method = scaling_method

        self.imputer = None
        self.scaler = None
        self.outlier_bounds = {}

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None
    ) -> pd.DataFrame:
        """Fit preprocessor and transform data"""
        result = df.copy()

        # Handle missing values
        result = self._impute_missing(result, target_col)

        # Handle outliers
        if target_col:
            result = self._handle_outliers(result, target_col)

        # Scale features
        feature_cols = [col for col in result.columns if col != target_col]
        if feature_cols:
            result = self._scale_features(result, feature_cols)

        return result

    def _impute_missing(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None
    ) -> pd.DataFrame:
        """Impute missing values"""
        result = df.copy()

        for col in result.columns:
            if result[col].isnull().any():
                if self.impute_method == 'forward_fill':
                    result[col] = result[col].fillna(method='ffill').fillna(method='bfill')
                elif self.impute_method == 'mean':
                    result[col] = result[col].fillna(result[col].mean())
                elif self.impute_method == 'median':
                    result[col] = result[col].fillna(result[col].median())
                elif self.impute_method == 'knn':
                    try:
                        from sklearn.impute import KNNImputer
                        if self.imputer is None:
                            self.imputer = KNNImputer(n_neighbors=5)
                        numeric_cols = result.select_dtypes(include=[np.number]).columns
                        result[numeric_cols] = self.imputer.fit_transform(result[numeric_cols])
                    except:
                        result[col] = result[col].fillna(result[col].median())

        return result

    def _handle_outliers(
        self,
        df: pd.DataFrame,
        target_col: str
    ) -> pd.DataFrame:
        """Handle outliers"""
        result = df.copy()

        if self.outlier_method == 'iqr':
            Q1 = result[target_col].quantile(0.25)
            Q3 = result[target_col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            self.outlier_bounds[target_col] = (lower_bound, upper_bound)

            # Cap outliers
            result[target_col] = result[target_col].clip(lower_bound, upper_bound)

        elif self.outlier_method == 'zscore':
            mean = result[target_col].mean()
            std = result[target_col].std()

            lower_bound = mean - 3 * std
            upper_bound = mean + 3 * std

            self.outlier_bounds[target_col] = (lower_bound, upper_bound)

            result[target_col] = result[target_col].clip(lower_bound, upper_bound)

        return result

    def _scale_features(
        self,
        df: pd.DataFrame,
        feature_cols: List[str]
    ) -> pd.DataFrame:
        """Scale features"""
        from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

        if self.scaling_method == 'standard':
            scaler = StandardScaler()
        elif self.scaling_method == 'minmax':
            scaler = MinMaxScaler()
        elif self.scaling_method == 'robust':
            scaler = RobustScaler()
        else:
            return df

        result = df.copy()

        # Scale numeric features
        numeric_cols = result[feature_cols].select_dtypes(include=[np.number]).columns

        if len(numeric_cols) > 0:
            result[numeric_cols] = scaler.fit_transform(result[numeric_cols])
            self.scaler = scaler

        return result

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform using fitted preprocessor"""
        result = df.copy()

        # Apply imputation
        if self.imputer and hasattr(self.imputer, 'transform'):
            numeric_cols = result.select_dtypes(include=[np.number]).columns
            result[numeric_cols] = self.imputer.transform(result[numeric_cols])

        # Apply scaling
        if self.scaler:
            numeric_cols = result.select_dtypes(include=[np.number]).columns
            result[numeric_cols] = self.scaler.transform(result[numeric_cols])

        # Apply outlier bounds
        for col, (lower, upper) in self.outlier_bounds.items():
            if col in result.columns:
                result[col] = result[col].clip(lower, upper)

        return result


# Utility functions
def get_available_feature_libraries() -> Dict[str, bool]:
    """Get availability of feature engineering libraries"""
    return {
        'tsfresh': TSFRESH_AVAILABLE,
        'featuretools': FEATURETOOLS_AVAILABLE
    }


def install_tsfresh() -> str:
    """Return pip install command for TSFresh"""
    return "pip install tsfresh"


def install_featuretools() -> str:
    """Return pip install command for Featuretools"""
    return "pip install featuretools"
