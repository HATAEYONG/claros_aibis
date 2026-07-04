"""
AutoML API

REST API endpoints for AutoML functionality
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import json
import tempfile
import os

from .automl_forecaster import (
    AutoMLForecaster,
    AutoGluonForecaster,
    AutoEnsemble,
    get_available_automl_tools
)

from .auto_feature_engineer import (
    AutoFeatureEngineer,
    FeatureSelector,
    AutoPreprocessor
)

from .hpo import (
    HyperparameterOptimizer,
    OptunaOptimizer,
    get_tft_search_space,
    get_prophet_search_space,
    get_lstm_search_space
)

logger = logging.getLogger(__name__)

# Global AutoML instances
_automl_models: Dict[str, AutoMLForecaster] = {}
_feature_engineers: Dict[str, AutoFeatureEngineer] = {}

# Development mode: disable authentication for easier testing
DEV_MODE = getattr(settings, 'DEBUG', True)

# Get permission class based on environment
def get_permission_classes():
    """환경에 따른 권한 클래스 반환"""
    return [AllowAny] if DEV_MODE else [IsAuthenticated]


@api_view(['GET'])
@permission_classes(get_permission_classes())
def health_check(request):
    """AutoML module health check"""
    available_tools = get_available_automl_tools()

    # available_tools는 리스트이므로 딕셔너리로 변환
    tools_dict = {
        'autogluon': 'autogluon' in available_tools,
        'flaml': 'flaml' in available_tools,
        'custom': 'custom' in available_tools,
        'all_tools': available_tools
    }

    return Response({
        'status': 'healthy',
        'module': 'AutoML',
        'version': '1.0.0',
        'available_tools': available_tools,
        'autogluon_available': tools_dict['autogluon'],
        'flaml_available': tools_dict['flaml'],
        'custom_available': tools_dict['custom'],
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes(get_permission_classes())
def automl_train(request):
    """
    Train AutoML model

    POST /api/ml-pipeline/automl/train/

    Body:
    {
        "model_id": "automl_v1",
        "tool": "autogluon",  // autogluon, flaml, custom
        "train_data": [
            {"date": "2024-01-01", "value": 100},
            ...
        ],
        "target_col": "value",
        "time_col": "date",
        "prediction_length": 30,
        "time_limit": 3600,  // seconds
        "eval_metric": "MAPE",
        "presets": ["fast_training", "best_quality"]
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')
        tool = data.get('tool', 'autogluon')

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse training data
        train_data = data.get('train_data', [])
        if not train_data:
            return Response({
                'error': 'train_data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        df = pd.DataFrame(train_data)
        time_col = data.get('time_col', 'date')
        target_col = data.get('target_col', 'value')

        # Create AutoML forecaster
        forecaster = AutoMLForecaster(
            tool=tool,
            prediction_length=data.get('prediction_length', 30),
            time_limit=data.get('time_limit', 3600),
            eval_metric=data.get('eval_metric', 'MAPE'),
            presets=data.get('presets')
        )

        # Train
        result = forecaster.fit(
            train_data=df,
            target_col=target_col,
            time_col=time_col,
            id_col=data.get('id_col')
        )

        # Store model
        _automl_models[model_id] = forecaster

        return Response({
            'success': True,
            'model_id': model_id,
            'tool': tool,
            'training_result': result,
            'is_fitted': forecaster.is_fitted,
            'trained_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"AutoML training error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes(get_permission_classes())
def automl_predict(request):
    """
    Generate AutoML forecast

    POST /api/ml-pipeline/automl/predict/

    Body:
    {
        "model_id": "automl_v1",
        "horizon": 30
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get model
        forecaster = _automl_models.get(model_id)
        if not forecaster:
            return Response({
                'error': f'Model {model_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Generate prediction
        horizon = data.get('horizon', forecaster.prediction_length)
        result = forecaster.predict(horizon=horizon)

        return Response({
            'success': True,
            'model_id': model_id,
            'forecast': result['forecast'],
            'dates': result['dates'],
            'horizon': result['horizon'],
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"AutoML prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes(get_permission_classes())
def automl_leaderboard(request):
    """
    Get AutoML model leaderboard

    GET /api/ml-pipeline/automl/leaderboard/?model_id=automl_v1
    """
    model_id = request.query_params.get('model_id')

    if not model_id:
        return Response({
            'error': 'model_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get model
    forecaster = _automl_models.get(model_id)
    if not forecaster:
        return Response({
            'error': f'Model {model_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get leaderboard
    leaderboard = forecaster.get_leaderboard()

    if leaderboard.empty:
        return Response({
            'success': True,
            'model_id': model_id,
            'leaderboard': [],
            'best_model': forecaster.get_best_model()
        })

    return Response({
        'success': True,
        'model_id': model_id,
        'leaderboard': leaderboard.to_dict('records'),
        'best_model': forecaster.get_best_model()
    })


@api_view(['POST'])
@permission_classes(get_permission_classes())
def auto_ensemble(request):
    """
    Build automatic ensemble

    POST /api/ml-pipeline/automl/ensemble/

    Body:
    {
        "ensemble_id": "ensemble_v1",
        "train_data": [...],
        "val_data": [...],
        "target_col": "value",
        "max_models": 5,
        "weight_optimization": "greedy"  // greedy, bayesian
    }
    """
    try:
        data = request.data
        ensemble_id = data.get('ensemble_id')

        if not ensemble_id:
            return Response({
                'error': 'ensemble_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse data
        train_data = pd.DataFrame(data.get('train_data', []))
        val_data = pd.DataFrame(data.get('val_data', []))
        target_col = data.get('target_col', 'value')
        time_col = data.get('time_col', 'date')

        # Create ensemble
        ensemble = AutoEnsemble(
            max_models=data.get('max_models', 5),
            weight_optimization=data.get('weight_optimization', 'greedy')
        )

        # Build ensemble
        result = ensemble.build_ensemble(
            train_data=train_data,
            val_data=val_data,
            target_col=target_col,
            time_col=time_col
        )

        # Store ensemble
        _automl_models[ensemble_id] = ensemble

        return Response({
            'success': True,
            'ensemble_id': ensemble_id,
            'result': result,
            'created_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Auto ensemble error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes(get_permission_classes())
def auto_feature_engineering(request):
    """
    Generate features automatically

    POST /api/ml-pipeline/automl/features/

    Body:
    {
        "data": [
            {"date": "2024-01-01", "value": 100},
            ...
        ],
        "target_col": "value",
        "time_col": "date",
        "max_features": 100,
        "selection_method": "importance",
        "include_tsfresh": true
    }
    """
    try:
        data = request.data
        input_data = pd.DataFrame(data.get('data', []))
        target_col = data.get('target_col', 'value')
        time_col = data.get('time_col', 'date')

        # Create feature engineer
        engineer = AutoFeatureEngineer(
            max_features=data.get('max_features', 100),
            feature_selection_method=data.get('selection_method', 'importance')
        )

        # Generate features
        features_df = engineer.generate_features(
            data=input_data,
            time_col=time_col,
            target_col=target_col,
            include_tsfresh=data.get('include_tsfresh', True),
            include_manual=True
        )

        # Select features
        selected_features = engineer.select_features(
            features_df=features_df,
            target_col=target_col
        )

        # Get feature importance
        importance = engineer.get_feature_importance()

        return Response({
            'success': True,
            'num_generated': len(engineer.generated_features),
            'num_selected': len(selected_features),
            'selected_features': selected_features,
            'feature_importance': importance,
            'features': features_df.head(10).to_dict('records')  # Return sample
        })

    except Exception as e:
        logger.error(f"Auto feature engineering error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes(get_permission_classes())
def hyperparameter_optimization(request):
    """
    Run hyperparameter optimization

    POST /api/ml-pipeline/automl/hpo/

    Body:
    {
        "model_id": "tft_v1",
        "train_data": [...],
        "val_data": [...],
        "target_col": "value",
        "model_type": "tft",  // tft, prophet, lstm
        "n_trials": 100,
        "timeout": 3600
    }
    """
    try:
        data = request.data
        model_type = data.get('model_type', 'tft')

        # Parse data
        train_data = pd.DataFrame(data.get('train_data', []))
        val_data = pd.DataFrame(data.get('val_data', []))
        target_col = data.get('target_col', 'value')
        time_col = data.get('time_col', 'date')

        # Get search space
        if model_type == 'tft':
            search_space = get_tft_search_space()
        elif model_type == 'prophet':
            search_space = get_prophet_search_space()
        elif model_type == 'lstm':
            search_space = get_lstm_search_space()
        else:
            search_space = get_tft_search_space()

        # Create optimizer
        optimizer = OptunaOptimizer(
            n_trials=data.get('n_trials', 100),
            timeout=data.get('timeout')
        )

        # Run optimization
        result = optimizer.optimize_forecasting_model(
            train_data=train_data,
            val_data=val_data,
            target_col=target_col,
            time_col=time_col
        )

        return Response({
            'success': True,
            'model_type': model_type,
            'best_params': result['best_params'],
            'best_value': result['best_value'],
            'n_trials': result['n_trials'],
            'optimized_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"HPO error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes(get_permission_classes())
def feature_selection(request):
    """
    Automatic feature selection

    POST /api/ml-pipeline/automl/features/select/

    Body:
    {
        "features_df": [...],  // Data with features
        "target_col": "value",
        "method": "rfe",  // rfe, kbest, sfs
        "n_features": 50
    }
    """
    try:
        data = request.data
        features_df = pd.DataFrame(data.get('features_df', []))
        target_col = data.get('target_col', 'value')

        # Prepare data
        feature_cols = [col for col in features_df.columns if col != target_col and col != 'date']
        X = features_df[feature_cols]
        y = features_df[target_col]

        # Create selector
        selector = FeatureSelector(
            method=data.get('method', 'rfe'),
            n_features=data.get('n_features', 50)
        )

        # Fit and transform
        selected_df = selector.fit_transform(X, y)

        return Response({
            'success': True,
            'method': data.get('method', 'rfe'),
            'original_features': len(feature_cols),
            'selected_features': list(selected_df.columns),
            'num_selected': len(selected_df.columns)
        })

    except Exception as e:
        logger.error(f"Feature selection error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes(get_permission_classes())
def auto_preprocess(request):
    """
    Automatic data preprocessing

    POST /api/ml-pipeline/automl/preprocess/

    Body:
    {
        "data": [...],
        "target_col": "value",
        "impute_method": "forward_fill",
        "outlier_method": "iqr",
        "scaling_method": "standard"
    }
    """
    try:
        data = request.data
        input_df = pd.DataFrame(data.get('data', []))
        target_col = data.get('target_col', 'value')

        # Create preprocessor
        preprocessor = AutoPreprocessor(
            impute_method=data.get('impute_method', 'forward_fill'),
            outlier_method=data.get('outlier_method', 'iqr'),
            scaling_method=data.get('scaling_method', 'standard')
        )

        # Fit and transform
        result_df = preprocessor.fit_transform(input_df, target_col)

        return Response({
            'success': True,
            'original_rows': len(input_df),
            'processed_rows': len(result_df),
            'preprocessing_steps': {
                'imputation': data.get('impute_method', 'forward_fill'),
                'outlier_handling': data.get('outlier_method', 'iqr'),
                'scaling': data.get('scaling_method', 'standard')
            },
            'sample_data': result_df.head(10).to_dict('records')
        })

    except Exception as e:
        logger.error(f"Auto preprocessing error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes(get_permission_classes())
def automl_info(request):
    """
    Get AutoML information and available tools

    GET /api/ml-pipeline/automl/info/
    """
    available_tools = get_available_automl_tools()

    info = {
        'autogluon': {
            'name': 'AutoGluon',
            'provider': 'Amazon',
            'description': 'AutoML for tabular, time series, and multimodal data',
            'available': 'autogluon' in available_tools,
            'install_command': 'pip install autogluon',
            'supported_models': [
                'ARIMA', 'SARIMA', 'ETS', 'Prophet',
                'TFT', 'DeepAR', 'N-BEATS'
            ]
        },
        'flaml': {
            'name': 'FLAML',
            'provider': 'Microsoft',
            'description': 'Fast and lightweight AutoML',
            'available': 'flaml' in available_tools,
            'install_command': 'pip install flaml',
            'supported_models': [
                'XGBoost', 'LightGBM', 'CatBoost', 'RF', 'Prophet'
            ]
        },
        'optuna': {
            'name': 'Optuna',
            'provider': 'Preferred Networks',
            'description': 'Hyperparameter optimization framework',
            'available': True,  # Pure Python
            'install_command': 'pip install optuna',
            'features': ['TPE sampling', 'CMA-ES', 'Multi-objective', 'Pruning']
        },
        'tsfresh': {
            'name': 'TSFresh',
            'provider': 'Max Planck Institute',
            'description': 'Automated feature extraction for time series',
            'available': True,  # Pure Python
            'install_command': 'pip install tsfresh',
            'features': ['700+ features', 'Automatic relevance calculation']
        }
    }

    return Response({
        'success': True,
        'tools': info,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
@permission_classes(get_permission_classes())
def list_models(request):
    """
    List all AutoML models

    GET /api/ml-pipeline/automl/models/
    """
    models = []

    for model_id, model in _automl_models.items():
        model_info = {
            'model_id': model_id,
            'tool': model.tool,
            'is_fitted': model.is_fitted,
            'prediction_length': model.prediction_length
        }

        # Get best model if available
        if hasattr(model, 'get_best_model'):
            model_info['best_model'] = model.get_best_model()

        models.append(model_info)

    return Response({
        'success': True,
        'models': models,
        'total_count': len(models),
        'timestamp': datetime.now().isoformat()
    })
