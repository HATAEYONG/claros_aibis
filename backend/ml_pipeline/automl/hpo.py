"""
Hyperparameter Optimization (HPO)

Automated hyperparameter tuning using Optuna, Ray Tune, or custom methods
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

# Try to import HPO libraries
OPTUNA_AVAILABLE = False
RAY_TUNE_AVAILABLE = False

try:
    import optuna
    from optuna.pruners import MedianPruner
    from optuna.samplers import TPESampler, CmaEsSampler
    OPTUNA_AVAILABLE = True
except ImportError:
    pass

try:
    import ray
    from ray import tune
    from ray.tune import CLIReporter
    RAY_TUNE_AVAILABLE = True
except ImportError:
    pass


class HyperparameterOptimizer:
    """
    Hyperparameter optimization for forecasting models

    Features:
    - Multiple optimization algorithms (TPE, CMA-ES, Random)
    - Early stopping with pruning
    - Multi-objective optimization
    - Parallel optimization
    """

    def __init__(
        self,
        tool: str = 'optuna',
        n_trials: int = 100,
        timeout: Optional[int] = None,
        n_jobs: int = 1,
        sampler: str = 'tpe',  # tpe, cmaes, random
        pruner: str = 'median'  # median, none
    ):
        """
        Initialize hyperparameter optimizer

        Args:
            tool: Optimization tool ('optuna', 'ray_tune', 'custom')
            n_trials: Number of trials
            timeout: Time limit in seconds
            n_jobs: Number of parallel jobs
            sampler: Sampling method
            pruner: Pruning method
        """
        self.tool = tool
        self.n_trials = n_trials
        self.timeout = timeout
        self.n_jobs = n_jobs
        self.sampler = sampler
        self.pruner = pruner

        self.study = None
        self.best_params = None
        self.best_value = None
        self.trials_history = []

        logger.info(f"HyperparameterOptimizer initialized with tool={tool}")

    def optimize(
        self,
        objective: Callable,
        search_space: Dict[str, Any],
        direction: str = 'minimize'
    ) -> Dict[str, Any]:
        """
        Run hyperparameter optimization

        Args:
            objective: Objective function to optimize
            search_space: Hyperparameter search space
            direction: Optimization direction ('minimize' or 'maximize')

        Returns:
            Optimization results
        """
        logger.info(f"Starting hyperparameter optimization with {self.tool}")

        if self.tool == 'optuna':
            return self._optimize_optuna(objective, search_space, direction)
        elif self.tool == 'ray_tune':
            return self._optimize_ray_tune(objective, search_space, direction)
        else:
            return self._optimize_custom(objective, search_space, direction)

    def _optimize_optuna(
        self,
        objective: Callable,
        search_space: Dict[str, Any],
        direction: str
    ) -> Dict[str, Any]:
        """Optimize with Optuna"""
        if not OPTUNA_AVAILABLE:
            logger.warning("Optuna not available, using custom optimization")
            return self._optimize_custom(objective, search_space, direction)

        # Create study
        sampler = self._get_sampler()
        pruner = self._get_pruner()

        self.study = optuna.create_study(
            direction=direction,
            sampler=sampler,
            pruner=pruner
        )

        # Wrap objective for Optuna
        def optuna_objective(trial):
            # Suggest parameters
            params = {}
            for name, space in search_space.items():
                params[name] = self._suggest_param(trial, name, space)

            return objective(params)

        # Optimize
        start_time = datetime.now()
        self.study.optimize(
            optuna_objective,
            n_trials=self.n_trials,
            timeout=self.timeout,
            n_jobs=self.n_jobs,
            show_progress_bar=True
        )
        elapsed_time = (datetime.now() - start_time).total_seconds()

        # Get best results
        self.best_params = self.study.best_params
        self.best_value = self.study.best_value

        # Store trials
        self.trials_history = [
            {
                'params': trial.params,
                'value': trial.value,
                'number': trial.number
            }
            for trial in self.study.trials
        ]

        return {
            'tool': 'optuna',
            'best_params': self.best_params,
            'best_value': self.best_value,
            'n_trials': len(self.study.trials),
            'elapsed_time_seconds': elapsed_time,
            'trials': self.trials_history
        }

    def _optimize_ray_tune(
        self,
        objective: Callable,
        search_space: Dict[str, Any],
        direction: str
    ) -> Dict[str, Any]:
        """Optimize with Ray Tune"""
        if not RAY_TUNE_AVAILABLE:
            logger.warning("Ray Tune not available, using custom optimization")
            return self._optimize_custom(objective, search_space, direction)

        # Convert search space to Ray Tune format
        ray_search_space = {}
        for name, space in search_space.items():
            ray_search_space[name] = self._convert_to_ray_space(space)

        # Wrap objective for Ray Tune
        def ray_objective(config):
            result = objective(config)
            tune.report(**{'metric': result})

        # Create reporter
        reporter = CLIReporter(
            metric_columns=['metric']
        )

        # Run optimization
        analysis = tune.run(
            ray_objective,
            config=ray_search_space,
            num_samples=self.n_trials,
            time_budget_s=self.timeout,
            resources_per_trial={'cpu': 1},
            progress_reporter=reporter,
            verbose=1
        )

        self.best_params = analysis.best_config
        self.best_value = analysis.best_result['metric']

        return {
            'tool': 'ray_tune',
            'best_params': self.best_params,
            'best_value': self.best_value,
            'n_trials': len(analysis.trials),
        }

    def _optimize_custom(
        self,
        objective: Callable,
        search_space: Dict[str, Any],
        direction: str
    ) -> Dict[str, Any]:
        """Custom optimization (random search)"""
        best_value = float('inf') if direction == 'minimize' else float('-inf')
        best_params = {}
        trials = []

        for i in range(self.n_trials):
            # Sample parameters
            params = self._sample_params(search_space)

            # Evaluate
            try:
                value = objective(params)

                # Update best
                is_better = (value < best_value) if direction == 'minimize' else (value > best_value)

                if is_better:
                    best_value = value
                    best_params = params

                trials.append({
                    'params': params,
                    'value': value,
                    'number': i
                })

            except Exception as e:
                logger.error(f"Trial {i} failed: {e}")
                continue

        self.best_params = best_params
        self.best_value = best_value
        self.trials_history = trials

        return {
            'tool': 'custom',
            'best_params': self.best_params,
            'best_value': self.best_value,
            'n_trials': len(trials),
            'trials': trials
        }

    def _get_sampler(self):
        """Get Optuna sampler"""
        if not OPTUNA_AVAILABLE:
            return None

        if self.sampler == 'tpe':
            return TPESampler(seed=42)
        elif self.sampler == 'cmaes':
            return CmaEsSampler(seed=42)
        else:
            return optuna.samplers.RandomSampler(seed=42)

    def _get_pruner(self):
        """Get Optuna pruner"""
        if not OPTUNA_AVAILABLE:
            return None

        if self.pruner == 'median':
            return MedianPruner()
        else:
            return None

    def _suggest_param(self, trial, name: str, space: Dict):
        """Suggest parameter value for Optuna trial"""
        space_type = space.get('type')

        if space_type == 'int':
            return trial.suggest_int(
                name,
                space.get('low', 0),
                space.get('high', 100),
                log=space.get('log', False)
            )
        elif space_type == 'float':
            return trial.suggest_float(
                name,
                space.get('low', 0.0),
                space.get('high', 1.0),
                log=space.get('log', False)
            )
        elif space_type == 'categorical':
            return trial.suggest_categorical(name, space.get('choices', []))
        else:
            return trial.suggest_float(name, 0, 1)

    def _convert_to_ray_space(self, space: Dict):
        """Convert search space to Ray Tune format"""
        if not RAY_TUNE_AVAILABLE:
            return space

        space_type = space.get('type')

        if space_type == 'int':
            return tune.randint(
                space.get('low', 0),
                space.get('high', 100)
            )
        elif space_type == 'float':
            return tune.uniform(
                space.get('low', 0.0),
                space.get('high', 1.0)
            )
        elif space_type == 'categorical':
            return tune.choice(space.get('choices', []))
        else:
            return tune.uniform(0, 1)

    def _sample_params(self, search_space: Dict[str, Any]) -> Dict[str, Any]:
        """Sample parameters for custom optimization"""
        params = {}

        for name, space in search_space.items():
            space_type = space.get('type')

            if space_type == 'int':
                params[name] = np.random.randint(
                    space.get('low', 0),
                    space.get('high', 100) + 1
                )
            elif space_type == 'float':
                params[name] = np.random.uniform(
                    space.get('low', 0.0),
                    space.get('high', 1.0)
                )
            elif space_type == 'categorical':
                choices = space.get('choices', [])
                params[name] = np.random.choice(choices) if choices else None
            else:
                params[name] = np.random.uniform(0, 1)

        return params


class OptunaOptimizer(HyperparameterOptimizer):
    """
    Specialized optimizer using Optuna

    Features:
    - TPE (Tree-structured Parzen Estimator) sampling
    - Median pruning
    - Multi-objective optimization
    """

    def __init__(
        self,
        n_trials: int = 100,
        timeout: Optional[int] = None,
        n_jobs: int = 1,
        multi_objective: bool = False
    ):
        super().__init__(
            tool='optuna',
            n_trials=n_trials,
            timeout=timeout,
            n_jobs=n_jobs,
            sampler='tpe',
            pruner='median'
        )
        self.multi_objective = multi_objective

    def optimize_forecasting_model(
        self,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str = 'value',
        time_col: str = 'date'
    ) -> Dict[str, Any]:
        """
        Optimize hyperparameters for forecasting model

        Args:
            train_data: Training data
            val_data: Validation data
            target_col: Target column
            time_col: Time column

        Returns:
            Optimization results
        """
        # Define search space for common forecasting models
        search_space = self._get_forecasting_search_space()

        # Define objective
        def objective(params):
            try:
                # Train model with given parameters
                model = self._create_model(params)
                model.fit(train_data, target_col=target_col)

                # Evaluate on validation set
                horizon = min(30, len(val_data))
                pred = model.predict(horizon=horizon)
                forecast = pred.get('forecast', [])[:horizon]
                actuals = val_data[target_col].values[:horizon]

                # Calculate MAPE
                mape = np.mean(np.abs((actuals - forecast) / (actuals + 1e-8))) * 100

                return mape

            except Exception as e:
                logger.error(f"Objective failed: {e}")
                return 100.0  # Return worst value

        # Optimize
        result = self.optimize(objective, search_space, direction='minimize')

        # Add model type to results
        result['model_type'] = result['best_params'].get('model_type', 'TFT')

        return result

    def _get_forecasting_search_space(self) -> Dict[str, Any]:
        """Get search space for forecasting models"""
        return {
            'model_type': {
                'type': 'categorical',
                'choices': ['TFT', 'Prophet', 'LSTM']
            },
            'hidden_size': {
                'type': 'int',
                'low': 16,
                'high': 128
            },
            'num_attention_heads': {
                'type': 'int',
                'low': 1,
                'high': 8
            },
            'dropout': {
                'type': 'float',
                'low': 0.0,
                'high': 0.5
            },
            'learning_rate': {
                'type': 'float',
                'low': 0.0001,
                'high': 0.01,
                'log': True
            },
            'batch_size': {
                'type': 'categorical',
                'choices': [16, 32, 64, 128]
            }
        }

    def _create_model(self, params: Dict[str, Any]):
        """Create model with given parameters"""
        model_type = params.get('model_type', 'TFT')

        # Import models
        try:
            from ..upgrade.tft_model import TFTForecaster, ProphetForecaster, LSTMForecaster

            if model_type == 'TFT':
                return TFTForecaster(
                    hidden_size=params.get('hidden_size', 64),
                    attention_head_size=params.get('num_attention_heads', 4),
                    dropout=params.get('dropout', 0.1)
                )
            elif model_type == 'Prophet':
                return ProphetForecaster()
            elif model_type == 'LSTM':
                return LSTMForecaster(
                    hidden_size=params.get('hidden_size', 64),
                    dropout=params.get('dropout', 0.1)
                )

        except Exception as e:
            logger.error(f"Model creation failed: {e}")

        # Fallback
        return None


# Common search spaces for different model types
def get_tft_search_space() -> Dict[str, Any]:
    """Get hyperparameter search space for TFT"""
    return {
        'hidden_size': {
            'type': 'int',
            'low': 32,
            'high': 256
        },
        'num_attention_heads': {
            'type': 'int',
            'low': 1,
            'high': 8
        },
        'dropout': {
            'type': 'float',
            'low': 0.0,
            'high': 0.5
        },
        'learning_rate': {
            'type': 'float',
            'low': 0.0001,
            'high': 0.01,
            'log': True
        },
        'batch_size': {
            'type': 'categorical',
            'choices': [16, 32, 64, 128]
        },
        'context_length': {
            'type': 'categorical',
            'choices': [30, 60, 90, 120]
        }
    }


def get_prophet_search_space() -> Dict[str, Any]:
    """Get hyperparameter search space for Prophet"""
    return {
        'changepoint_prior_scale': {
            'type': 'float',
            'low': 0.001,
            'high': 0.5,
            'log': True
        },
        'seasonality_prior_scale': {
            'type': 'float',
            'low': 0.01,
            'high': 10,
            'log': True
        },
        'holidays_prior_scale': {
            'type': 'float',
            'low': 0.01,
            'high': 10,
            'log': True
        },
        'seasonality_mode': {
            'type': 'categorical',
            'choices': ['additive', 'multiplicative']
        },
        'yearly_seasonality': {
            'type': 'categorical',
            'choices': [True, False]
        },
        'weekly_seasonality': {
            'type': 'categorical',
            'choices': [True, False]
        },
        'daily_seasonality': {
            'type': 'categorical',
            'choices': [True, False]
        }
    }


def get_lstm_search_space() -> Dict[str, Any]:
    """Get hyperparameter search space for LSTM"""
    return {
        'hidden_size': {
            'type': 'int',
            'low': 32,
            'high': 256
        },
        'num_layers': {
            'type': 'int',
            'low': 1,
            'high': 4
        },
        'dropout': {
            'type': 'float',
            'low': 0.0,
            'high': 0.5
        },
        'learning_rate': {
            'type': 'float',
            'low': 0.0001,
            'high': 0.01,
            'log': True
        },
        'batch_size': {
            'type': 'categorical',
            'choices': [16, 32, 64, 128]
        }
    }


# Utility functions
def get_available_hpo_tools() -> Dict[str, bool]:
    """Get availability of HPO tools"""
    return {
        'optuna': OPTUNA_AVAILABLE,
        'ray_tune': RAY_TUNE_AVAILABLE
    }


def install_optuna() -> str:
    """Return pip install command for Optuna"""
    return "pip install optuna"


def install_ray_tune() -> str:
    """Return pip install command for Ray Tune"""
    return "pip install ray[tune]"
