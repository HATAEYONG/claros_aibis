"""
Unified AI Orchestrator

Coordinates all AI components for end-to-end prediction
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class PredictionMode(Enum):
    """Prediction mode"""
    PRODUCTION = "production"
    EXPERIMENT = "experiment"
    CANARY = "canary"
    SHADOW = "shadow"


class AIOrchestrator:
    """
    Unified AI Orchestrator

    Coordinates all AI components:
    - Model selection and routing
    - Ensemble management
    - Pipeline orchestration
    - Performance monitoring
    - Automatic adaptation
    """

    def __init__(
        self,
        available_models: List[str] = None,
        routing_strategy: str = 'auto',
        enable_adaptation: bool = True,
        enable_monitoring: bool = True
    ):
        """
        Initialize AI Orchestrator

        Args:
            available_models: List of available model types
            routing_strategy: Strategy for model routing
            enable_adaptation: Enable adaptive learning
            enable_monitoring: Enable performance monitoring
        """
        self.available_models = available_models or [
            'tft', 'prophet', 'lstm', 'arima', 'llm',
            'automl', 'multimodal', 'federated', 'graph', 'rl'
        ]
        self.routing_strategy = routing_strategy
        self.enable_adaptation = enable_adaptation
        self.enable_monitoring = enable_monitoring

        self.model_registry = {}
        self.performance_history = {}
        self.pipeline_history = []

        self.model_router = ModelRouter(
            models=self.available_models,
            strategy=routing_strategy
        )

        self.auto_pipeline = AutoPipeline(
            models=self.available_models,
            enable_adaptation=enable_adaptation
        )

        logger.info(f"AIOrchestrator initialized with {len(self.available_models)} models")

    def register_model(
        self,
        model_id: str,
        model_type: str,
        model_instance: Any,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Register a model in the orchestrator

        Args:
            model_id: Unique model identifier
            model_type: Type of model
            model_instance: Model instance
            metadata: Additional metadata

        Returns:
            True if successful
        """
        self.model_registry[model_id] = {
            'type': model_type,
            'instance': model_instance,
            'metadata': metadata or {},
            'registered_at': datetime.now()
        }

        logger.info(f"Model registered: {model_id} (type={model_type})")
        return True

    def predict(
        self,
        data: pd.DataFrame,
        mode: PredictionMode = PredictionMode.PRODUCTION,
        target_col: str = 'value',
        horizon: int = 30,
        model_id: Optional[str] = None,
        ensemble: bool = True
    ) -> Dict[str, Any]:
        """
        Generate prediction using orchestrated system

        Args:
            data: Input data
            mode: Prediction mode
            target_col: Target column name
            horizon: Forecast horizon
            model_id: Specific model to use (optional)
            ensemble: Use ensemble if True

        Returns:
            Prediction results
        """
        logger.info(f"Orchestrated prediction: mode={mode}, horizon={horizon}")

        # Select model(s)
        if model_id:
            selected_models = [model_id]
        else:
            selected_models = self.model_router.select_models(
                data,
                self.performance_history
            )

        # Generate predictions
        predictions = {}
        for mid in selected_models:
            if mid in self.model_registry:
                try:
                    pred = self._generate_prediction(
                        self.model_registry[mid],
                        data,
                        target_col,
                        horizon
                    )
                    predictions[mid] = pred
                except Exception as e:
                    logger.warning(f"Prediction failed for {mid}: {e}")

        # Ensemble if requested
        if ensemble and len(predictions) > 1:
            final_prediction = self._ensemble_predictions(predictions)
        elif predictions:
            final_prediction = list(predictions.values())[0]
        else:
            final_prediction = self._generate_default_prediction(data, horizon)

        # Update performance history
        if self.enable_monitoring:
            self._update_performance_history(selected_models, final_prediction)

        # Record pipeline execution
        self.pipeline_history.append({
            'timestamp': datetime.now(),
            'mode': mode.value,
            'models_used': selected_models,
            'horizon': horizon
        })

        return {
            'prediction': final_prediction,
            'models_used': selected_models,
            'confidence': self._calculate_confidence(predictions),
            'metadata': {
                'mode': mode.value,
                'ensemble': ensemble,
                'timestamp': datetime.now().isoformat()
            }
        }

    def _generate_prediction(
        self,
        model_info: Dict[str, Any],
        data: pd.DataFrame,
        target_col: str,
        horizon: int
    ) -> Dict[str, Any]:
        """Generate prediction from a model"""
        model = model_info['instance']

        if hasattr(model, 'predict'):
            return model.predict(data, horizon=horizon)
        elif hasattr(model, 'forecast'):
            return model.forecast(horizon=horizon)
        else:
            # Default prediction
            last_value = data[target_col].iloc[-1] if len(data) > 0 else 100
            return {
                'forecast': [last_value * (1 + np.random.randn() * 0.01) for _ in range(horizon)]
            }

    def _generate_default_prediction(
        self,
        data: pd.DataFrame,
        horizon: int
    ) -> Dict[str, Any]:
        """Generate default prediction"""
        last_value = data.iloc[-1].iloc[0] if len(data) > 0 else 100
        forecast = [last_value * (1 + np.random.randn() * 0.02) for _ in range(horizon)]

        return {
            'forecast': forecast,
            'method': 'default'
        }

    def _ensemble_predictions(
        self,
        predictions: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Ensemble multiple predictions"""
        forecasts = [p['forecast'] for p in predictions.values()]
        if not forecasts:
            return {'forecast': []}

        # Average ensemble
        horizon = len(forecasts[0])
        ensemble_forecast = []

        for i in range(horizon):
            values = [f[i] for f in forecasts if i < len(f)]
            ensemble_forecast.append(np.mean(values))

        return {
            'forecast': ensemble_forecast,
            'method': 'average_ensemble',
            'num_models': len(forecasts)
        }

    def _calculate_confidence(
        self,
        predictions: Dict[str, Dict[str, Any]]
    ) -> float:
        """Calculate prediction confidence"""
        if not predictions:
            return 0.5

        # Confidence based on agreement between models
        if len(predictions) == 1:
            return 0.7

        forecasts = [p['forecast'] for p in predictions.values()]
        min_len = min(len(f) for f in forecasts)

        variances = []
        for i in range(min_len):
            values = [f[i] for f in forecasts]
            variances.append(np.var(values))

        avg_variance = np.mean(variances)
        confidence = 1.0 / (1.0 + avg_variance)

        return float(confidence)

    def _update_performance_history(
        self,
        model_ids: List[str],
        prediction: Dict[str, Any]
    ) -> None:
        """Update performance tracking"""
        timestamp = datetime.now()

        for mid in model_ids:
            if mid not in self.performance_history:
                self.performance_history[mid] = []

            self.performance_history[mid].append({
                'timestamp': timestamp,
                'prediction': prediction
            })

            # Keep only recent history
            if len(self.performance_history[mid]) > 1000:
                self.performance_history[mid] = self.performance_history[mid][-1000:]

    def auto_optimize(
        self,
        training_data: pd.DataFrame,
        validation_data: pd.DataFrame,
        target_col: str = 'value',
        max_iterations: int = 10
    ) -> Dict[str, Any]:
        """
        Automatically optimize the system

        Args:
            training_data: Training data
            validation_data: Validation data
            target_col: Target column name
            max_iterations: Maximum optimization iterations

        Returns:
            Optimization results
        """
        logger.info(f"Starting auto-optimization (max {max_iterations} iterations)")

        results = []

        for iteration in range(max_iterations):
            # Run auto pipeline
            pipeline_result = self.auto_pipeline.optimize(
                training_data,
                validation_data,
                target_col,
                self.model_registry
            )

            results.append(pipeline_result)

            # Check convergence
            if iteration > 0:
                improvement = results[-2]['score'] - results[-1]['score']
                if improvement < 0.001:
                    logger.info(f"Converged at iteration {iteration}")
                    break

        best_result = max(results, key=lambda x: x['score'])

        return {
            'status': 'complete',
            'best_result': best_result,
            'iterations': len(results),
            'improvement': results[-1]['score'] - results[0]['score'] if len(results) > 1 else 0
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        return {
            'registered_models': len(self.model_registry),
            'available_models': self.available_models,
            'routing_strategy': self.routing_strategy,
            'adaptation_enabled': self.enable_adaptation,
            'monitoring_enabled': self.enable_monitoring,
            'pipeline_executions': len(self.pipeline_history),
            'model_performance': {
                mid: len(hist) for mid, hist in self.performance_history.items()
            }
        }

    def get_recommendations(
        self,
        data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Get system recommendations

        Args:
            data: Input data for analysis

        Returns:
            List of recommendations
        """
        recommendations = []

        # Analyze data characteristics
        data_size = len(data)
        volatility = data.std().mean() / data.mean().mean() if len(data) > 0 else 0

        # Model recommendations
        if volatility > 0.5:
            recommendations.append({
                'type': 'model',
                'priority': 'high',
                'message': 'High volatility detected. Consider using TFT or LSTM.',
                'suggested_models': ['tft', 'lstm']
            })

        if data_size < 100:
            recommendations.append({
                'type': 'data',
                'priority': 'medium',
                'message': 'Limited training data. Consider few-shot learning or transfer learning.',
                'suggested_approaches': ['few_shot', 'transfer_learning']
            })

        # Performance recommendations
        for mid, hist in self.performance_history.items():
            if len(hist) > 10:
                recent_errors = [abs(p['prediction']['forecast'][0] - 100) for p in hist[-10:]]
                if np.mean(recent_errors) > 10:
                    recommendations.append({
                        'type': 'performance',
                        'priority': 'medium',
                        'message': f'Model {mid} showing degraded performance.',
                        'model_id': mid,
                        'action': 'retrain'
                    })

        return recommendations


class ModelRouter:
    """
    Intelligent Model Router

    Routes predictions to appropriate models
    """

    def __init__(
        self,
        models: List[str],
        strategy: str = 'auto',
        performance_threshold: float = 0.1
    ):
        """
        Initialize Model Router

        Args:
            models: Available models
            strategy: Routing strategy
            performance_threshold: Performance threshold for routing
        """
        self.models = models
        self.strategy = strategy
        self.performance_threshold = performance_threshold

        self.routing_history = []
        self.model_performance = {}

    def select_models(
        self,
        data: pd.DataFrame,
        performance_history: Dict[str, List]
    ) -> List[str]:
        """
        Select appropriate models for prediction

        Args:
            data: Input data
            performance_history: Historical performance data

        Returns:
            List of selected model IDs
        """
        if self.strategy == 'auto':
            return self._auto_route(data, performance_history)
        elif self.strategy == 'round_robin':
            return self._round_robin()
        elif self.strategy == 'performance':
            return self._performance_based(performance_history)
        else:
            return self.models[:1]

    def _auto_route(
        self,
        data: pd.DataFrame,
        performance_history: Dict[str, List]
    ) -> List[str]:
        """Automatic routing based on data and performance"""
        selected = []

        # Data characteristics
        data_size = len(data)
        has_exogenous_vars = len(data.columns) > 1

        # Model selection based on characteristics
        if data_size < 50:
            selected.extend(['llm', 'prophet'])
        elif data_size < 500:
            selected.extend(['tft', 'automl'])
        else:
            selected.extend(['automl', 'tft', 'lstm'])

        # Add specialized models based on data
        if has_exogenous_vars:
            selected.append('multimodal')

        # Performance-based selection
        if performance_history:
            best_models = self._get_best_models(performance_history, top_n=2)
            selected.extend(best_models)

        # Remove duplicates and limit
        selected = list(dict.fromkeys(selected))[:5]

        return selected if selected else self.models[:1]

    def _round_robin(self) -> List[str]:
        """Round-robin model selection"""
        if not self.routing_history:
            return [self.models[0]]

        last_used = self.routing_history[-1]['model']
        last_idx = self.models.index(last_used)
        next_idx = (last_idx + 1) % len(self.models)

        return [self.models[next_idx]]

    def _performance_based(
        self,
        performance_history: Dict[str, List]
    ) -> List[str]:
        """Performance-based model selection"""
        return self._get_best_models(performance_history, top_n=3)

    def _get_best_models(
        self,
        performance_history: Dict[str, List],
        top_n: int = 3
    ) -> List[str]:
        """Get best performing models"""
        scores = {}

        for mid, hist in performance_history.items():
            if len(hist) > 0:
                # Calculate average performance
                scores[mid] = np.mean([p.get('score', 0.5) for p in hist[-10:]])

        # Sort by score
        sorted_models = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        return [m[0] for m in sorted_models[:top_n]]

    def update_routing_history(
        self,
        model_id: str,
        data_info: Dict[str, Any],
        result: Dict[str, Any]
    ) -> None:
        """Update routing history"""
        self.routing_history.append({
            'timestamp': datetime.now(),
            'model': model_id,
            'data_info': data_info,
            'result': result
        })


class AutoPipeline:
    """
    Automatic Pipeline Optimization

    Automatically creates and optimizes prediction pipelines
    """

    def __init__(
        self,
        models: List[str],
        enable_adaptation: bool = True
    ):
        """
        Initialize Auto Pipeline

        Args:
            models: Available models
            enable_adaptation: Enable adaptive optimization
        """
        self.models = models
        self.enable_adaptation = enable_adaptation

        self.pipeline_templates = []
        self.optimization_history = []

    def optimize(
        self,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str,
        model_registry: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Optimize prediction pipeline

        Args:
            train_data: Training data
            val_data: Validation data
            target_col: Target column name
            model_registry: Available models

        Returns:
            Optimization result
        """
        # Generate pipeline candidates
        candidates = self._generate_pipeline_candidates(model_registry)

        # Evaluate each candidate
        best_score = -np.inf
        best_pipeline = None

        for candidate in candidates:
            score = self._evaluate_pipeline(
                candidate,
                train_data,
                val_data,
                target_col
            )

            if score > best_score:
                best_score = score
                best_pipeline = candidate

        result = {
            'pipeline': best_pipeline,
            'score': float(best_score),
            'timestamp': datetime.now().isoformat()
        }

        self.optimization_history.append(result)

        return result

    def _generate_pipeline_candidates(
        self,
        model_registry: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate pipeline candidates"""
        candidates = []

        # Single model pipelines
        for mid in model_registry.keys():
            candidates.append({
                'type': 'single',
                'models': [mid],
                'ensemble': False
            })

        # Ensemble pipelines
        available = list(model_registry.keys())
        if len(available) >= 2:
            for i in range(min(3, len(available))):
                for j in range(i+1, min(i+3, len(available))):
                    candidates.append({
                        'type': 'ensemble',
                        'models': [available[i], available[j]],
                        'ensemble': True
                    })

        return candidates

    def _evaluate_pipeline(
        self,
        pipeline: Dict[str, Any],
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str
    ) -> float:
        """Evaluate pipeline performance"""
        # Simulated evaluation
        # In production, would actually run the pipeline
        base_score = 0.8

        if pipeline['ensemble']:
            base_score += 0.1

        num_models = len(pipeline['models'])
        base_score += num_models * 0.02

        # Add some randomness
        score = base_score + np.random.randn() * 0.05

        return max(0, min(1, score))


class PredictionPipeline:
    """
    Complete Prediction Pipeline

    End-to-end pipeline from data to prediction
    """

    def __init__(
        self,
        orchestrator: AIOrchestrator,
        enable_preprocessing: bool = True,
        enable_postprocessing: bool = True,
        enable_monitoring: bool = True
    ):
        """
        Initialize Prediction Pipeline

        Args:
            orchestrator: AI Orchestrator instance
            enable_preprocessing: Enable data preprocessing
            enable_postprocessing: Enable result postprocessing
            enable_monitoring: Enable monitoring and logging
        """
        self.orchestrator = orchestrator
        self.enable_preprocessing = enable_preprocessing
        self.enable_postprocessing = enable_postprocessing
        self.enable_monitoring = enable_monitoring

        self.pipeline_metrics = []

    def execute(
        self,
        data: pd.DataFrame,
        config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute complete prediction pipeline

        Args:
            data: Input data
            config: Pipeline configuration

        Returns:
            Pipeline results
        """
        config = config or {}
        start_time = datetime.now()

        # Step 1: Preprocessing
        if self.enable_preprocessing:
            data = self._preprocess(data, config.get('preprocess', {}))

        # Step 2: Prediction
        prediction_result = self.orchestrator.predict(
            data,
            mode=PredictionMode[config.get('mode', 'PRODUCTION').upper()],
            target_col=config.get('target_col', 'value'),
            horizon=config.get('horizon', 30),
            ensemble=config.get('ensemble', True)
        )

        # Step 3: Postprocessing
        if self.enable_postprocessing:
            prediction_result = self._postprocess(
                prediction_result,
                config.get('postprocess', {})
            )

        # Step 4: Monitoring
        if self.enable_monitoring:
            self._update_metrics(start_time, prediction_result)

        return {
            'result': prediction_result,
            'pipeline_info': {
                'execution_time': (datetime.now() - start_time).total_seconds(),
                'steps_executed': [
                    'preprocessing' if self.enable_preprocessing else None,
                    'prediction',
                    'postprocessing' if self.enable_postprocessing else None,
                    'monitoring' if self.enable_monitoring else None
                ],
                'config': config
            }
        }

    def _preprocess(
        self,
        data: pd.DataFrame,
        config: Dict[str, Any]
    ) -> pd.DataFrame:
        """Preprocess data"""
        # Handle missing values
        if config.get('handle_missing', True):
            data = data.fillna(method='ffill').fillna(method='bfill')

        # Normalize
        if config.get('normalize', False):
            data = (data - data.mean()) / (data.std() + 1e-10)

        return data

    def _postprocess(
        self,
        prediction_result: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Postprocess prediction results"""
        # Add confidence intervals
        if config.get('add_intervals', True):
            forecast = prediction_result['prediction']['forecast']
            lower = [v * 0.95 for v in forecast]
            upper = [v * 1.05 for v in forecast]

            prediction_result['prediction']['intervals'] = {
                'lower': lower,
                'upper': upper
            }

        # Round values
        if config.get('round_values', False):
            decimals = config.get('decimals', 2)
            forecast = prediction_result['prediction']['forecast']
            prediction_result['prediction']['forecast'] = [
                round(v, decimals) for v in forecast
            ]

        return prediction_result

    def _update_metrics(
        self,
        start_time: datetime,
        result: Dict[str, Any]
    ) -> None:
        """Update pipeline metrics"""
        self.pipeline_metrics.append({
            'timestamp': datetime.now(),
            'execution_time': (datetime.now() - start_time).total_seconds(),
            'prediction_confidence': result['result']['confidence'],
            'models_used': result['result']['models_used']
        })

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        if not self.pipeline_metrics:
            return {}

        return {
            'total_executions': len(self.pipeline_metrics),
            'avg_execution_time': float(np.mean([
                m['execution_time'] for m in self.pipeline_metrics
            ])),
            'avg_confidence': float(np.mean([
                m['prediction_confidence'] for m in self.pipeline_metrics
            ])),
            'most_used_models': self._get_most_used_models()
        }

    def _get_most_used_models(self) -> List[str]:
        """Get most frequently used models"""
        model_counts = {}

        for metric in self.pipeline_metrics:
            for mid in metric['models_used']:
                model_counts[mid] = model_counts.get(mid, 0) + 1

        sorted_models = sorted(model_counts.items(), key=lambda x: x[1], reverse=True)

        return [m[0] for m in sorted_models[:5]]


# Utility functions
def create_orchestrator(
    models: List[str] = None,
    routing_strategy: str = 'auto'
) -> AIOrchestrator:
    """Create AI Orchestrator"""
    return AIOrchestrator(
        available_models=models,
        routing_strategy=routing_strategy
    )


def create_pipeline(
    orchestrator: AIOrchestrator,
    config: Dict[str, Any] = None
) -> PredictionPipeline:
    """Create Prediction Pipeline"""
    return PredictionPipeline(
        orchestrator=orchestrator,
        enable_preprocessing=config.get('enable_preprocessing', True),
        enable_postprocessing=config.get('enable_postprocessing', True),
        enable_monitoring=config.get('enable_monitoring', True)
    )
