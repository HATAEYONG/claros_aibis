"""
Reinforcement Learning API

REST API endpoints for RL-based forecasting
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging
from datetime import datetime

from .rl_forecaster import (
    RLForecaster,
    DQNAgent,
    PPOAgent,
    A3CAgent,
    ModelSelectionAgent,
    AdaptiveEnsemble,
    get_available_rl_libraries
)
from .adaptive_learning import (
    AdaptiveLearner,
    OnlineModelUpdater,
    ConceptDriftDetector,
    PerformanceMonitor
)
from .reward_system import (
    RewardCalculator,
    ForecastingReward,
    AccuracyReward,
    BusinessReward,
    create_reward_calculator
)

logger = logging.getLogger(__name__)


# Global instances
_rl_forecaster = None
_adaptive_learner = None
_drift_detector = None
_performance_monitor = None


def get_rl_forecaster():
    """Get or create global RL forecaster"""
    global _rl_forecaster
    if _rl_forecaster is None:
        _rl_forecaster = RLForecaster()
    return _rl_forecaster


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'module': 'reinforcement_learning',
        'timestamp': datetime.now().isoformat(),
        'libraries': get_available_rl_libraries()
    })


@csrf_exempt
@require_http_methods(["POST"])
def train_rl_forecaster(request):
    """
    Train RL Forecaster

    Body:
    {
        "train_data": {...},
        "validation_data": {...},
        "target_col": "value",
        "config": {
            "rl_algorithm": "dqn",
            "state_dim": 64,
            "action_dim": 10,
            "episodes": 100
        }
    }
    """
    try:
        body = json.loads(request.body)

        train_data = body.get('train_data', {})
        validation_data = body.get('validation_data')
        target_col = body.get('target_col', 'value')
        config = body.get('config', {})

        # Convert to DataFrame
        import pandas as pd
        train_df = pd.DataFrame(train_data)
        val_df = pd.DataFrame(validation_data) if validation_data else None

        # Get or create forecaster
        forecaster = get_rl_forecaster()

        # Update config
        if config:
            forecaster.rl_algorithm = config.get('rl_algorithm', forecaster.rl_algorithm)
            forecaster.state_dim = config.get('state_dim', forecaster.state_dim)
            forecaster.action_dim = config.get('action_dim', forecaster.action_dim)

        # Train
        episodes = config.get('episodes', 100)
        result = forecaster.fit(
            train_df,
            val_df,
            target_col,
            episodes=episodes
        )

        return JsonResponse({
            'success': True,
            'training_result': result
        })

    except Exception as e:
        logger.error(f"Training failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def rl_predict(request):
    """
    Generate RL-based forecast

    Body:
    {
        "data": {...},
        "horizon": 30,
        "target_col": "value"
    }
    """
    try:
        body = json.loads(request.body)

        data = body.get('data', {})
        horizon = body.get('horizon', 30)
        target_col = body.get('target_col', 'value')

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Get forecaster
        forecaster = get_rl_forecaster()

        if not forecaster.is_fitted:
            return JsonResponse({
                'success': False,
                'error': 'Model must be trained before prediction'
            }, status=400)

        # Generate forecast
        result = forecaster.predict(df, horizon, target_col)

        return JsonResponse({
            'success': True,
            'forecast': result
        })

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def adapt_model(request):
    """
    Adapt model to new data

    Body:
    {
        "model_info": {...},
        "new_data": {...},
        "target_col": "value",
        "config": {
            "window_size": 100,
            "threshold": 0.1
        }
    }
    """
    try:
        body = json.loads(request.body)

        new_data = body.get('new_data', {})
        target_col = body.get('target_col', 'value')
        config = body.get('config', {})

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(new_data)

        # Get or create adaptive learner
        global _adaptive_learner
        if _adaptive_learner is None:
            _adaptive_learner = AdaptiveLearner(
                window_size=config.get('window_size', 100),
                adaptation_threshold=config.get('threshold', 0.1)
            )

        # Adapt
        result = _adaptive_learner.adapt(None, df, target_col)

        return JsonResponse({
            'success': True,
            'adaptation_result': result
        })

    except Exception as e:
        logger.error(f"Adaptation failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def detect_drift(request):
    """
    Detect concept drift

    Body:
    {
        "prediction": 100.0,
        "actual": 105.0,
        "baseline_error": 0.05,
        "method": "ddm"
    }
    """
    try:
        body = json.loads(request.body)

        prediction = body.get('prediction')
        actual = body.get('actual')
        baseline_error = body.get('baseline_error')
        method = body.get('method', 'ddm')

        # Get or create drift detector
        global _drift_detector
        if _drift_detector is None or _drift_detector.detection_method != method:
            _drift_detector = ConceptDriftDetector(detection_method=method)

        # Detect drift
        result = _drift_detector.detect(prediction, actual, baseline_error)

        return JsonResponse({
            'success': True,
            'drift_detection': result
        })

    except Exception as e:
        logger.error(f"Drift detection failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def update_performance(request):
    """
    Update performance monitoring

    Body:
    {
        "predictions": [100, 102, 98, ...],
        "actuals": [105, 100, 99, ...]
    }
    """
    try:
        body = json.loads(request.body)

        predictions = body.get('predictions', [])
        actuals = body.get('actuals', [])

        if len(predictions) != len(actuals):
            return JsonResponse({
                'success': False,
                'error': 'Predictions and actuals must have same length'
            }, status=400)

        # Get or create performance monitor
        global _performance_monitor
        if _performance_monitor is None:
            _performance_monitor = PerformanceMonitor()

        # Update
        import numpy as np
        metrics = _performance_monitor.update(
            np.array(predictions),
            np.array(actuals)
        )

        # Check if retraining is needed
        should_retrain, reason = _performance_monitor.should_retrain()

        return JsonResponse({
            'success': True,
            'metrics': metrics,
            'should_retrain': should_retrain,
            'retrain_reason': reason
        })

    except Exception as e:
        logger.error(f"Performance update failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def select_model(request):
    """
    Select model using RL agent

    Body:
    {
        "state": [0.1, 0.2, ...],
        "available_models": ["tft", "prophet", "lstm"],
        "explore": true
    }
    """
    try:
        body = json.loads(request.body)

        state = np.array(body.get('state', []))
        models = body.get('available_models', ['tft', 'prophet', 'lstm'])
        explore = body.get('explore', True)

        # Create model selection agent
        agent = ModelSelectionAgent(models)

        # Select model
        selected_model = agent.select_model(state, explore)

        return JsonResponse({
            'success': True,
            'selected_model': selected_model,
            'available_models': models
        })

    except Exception as e:
        logger.error(f"Model selection failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def update_ensemble_weights(request):
    """
    Update ensemble weights adaptively

    Body:
    {
        "predictions": {
            "tft": [100, 102, 98, ...],
            "prophet": [99, 101, 99, ...]
        },
        "actuals": [105, 100, 99, ...],
        "learning_rate": 0.01
    }
    """
    try:
        body = json.loads(request.body)

        predictions_dict = body.get('predictions', {})
        actuals = body.get('actuals', [])
        learning_rate = body.get('learning_rate', 0.01)

        # Get models
        models = list(predictions_dict.keys())

        # Create adaptive ensemble
        ensemble = AdaptiveEnsemble(models, learning_rate=learning_rate)

        # Convert to numpy arrays
        predictions = {k: np.array(v) for k, v in predictions_dict.items()}
        actuals_array = np.array(actuals)

        # Update weights
        weights = ensemble.update_weights(predictions, actuals_array)

        return JsonResponse({
            'success': True,
            'ensemble_weights': weights,
            'normalized_sum': float(sum(weights.values()))
        })

    except Exception as e:
        logger.error(f"Ensemble weight update failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def calculate_reward(request):
    """
    Calculate reward for RL training

    Body:
    {
        "prediction": 100.0,
        "actual": 105.0,
        "reward_type": "accuracy",
        "context": {...}
    }
    """
    try:
        body = json.loads(request.body)

        prediction = body.get('prediction')
        actual = body.get('actual')
        reward_type = body.get('reward_type', 'accuracy')
        context = body.get('context', {})

        # Create reward calculator
        calculator = create_reward_calculator(reward_type)

        # Calculate reward
        reward = calculator.calculate(prediction, actual, **context)

        return JsonResponse({
            'success': True,
            'reward': float(reward),
            'reward_type': reward_type
        })

    except Exception as e:
        logger.error(f"Reward calculation failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_adaptation_stats(request):
    """Get adaptation statistics"""
    global _adaptive_learner

    if _adaptive_learner is None:
        return JsonResponse({
            'success': False,
            'error': 'Adaptive learner not initialized'
        })

    stats = _adaptive_learner.get_adaptation_stats()

    return JsonResponse({
        'success': True,
        'adaptation_stats': stats
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_drift_stats(request):
    """Get drift detection statistics"""
    global _drift_detector

    if _drift_detector is None:
        return JsonResponse({
            'success': False,
            'error': 'Drift detector not initialized'
        })

    stats = _drift_detector.get_drift_stats()

    return JsonResponse({
        'success': True,
        'drift_stats': stats
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_performance_summary(request):
    """Get performance summary"""
    global _performance_monitor

    if _performance_monitor is None:
        return JsonResponse({
            'success': False,
            'error': 'Performance monitor not initialized'
        })

    summary = _performance_monitor.get_performance_summary()

    return JsonResponse({
        'success': True,
        'performance_summary': summary
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_rl_info(request):
    """Get reinforcement learning module information"""
    return JsonResponse({
        'success': True,
        'info': {
            'module': 'reinforcement_learning',
            'version': '1.0.0',
            'description': 'Reinforcement Learning-based adaptive forecasting',
            'features': {
                'rl_algorithms': ['DQN', 'PPO', 'A3C'],
                'adaptive_learning': ['Online updates', 'Concept drift detection'],
                'reward_systems': ['Accuracy', 'Business', 'Multi-objective'],
                'ensemble_methods': ['Adaptive weights', 'Model selection']
            },
            'available_libraries': get_available_rl_libraries(),
            'supported_algorithms': ['dqn', 'ppo', 'a3c'],
            'drift_detection_methods': ['ddm', 'eddm', 'adwin', 'page_hinkley'],
            'timestamp': datetime.now().isoformat()
        }
    })
