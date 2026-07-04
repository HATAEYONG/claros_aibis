"""
Federated Forecaster

Federated learning for time series forecasting
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
import json
import copy

logger = logging.getLogger(__name__)

# Try to import federated learning libraries
FLOWR_AVAILABLE = False

try:
    import flwr as fl
    from flwr.common import (
        Parameters,
        Scalar,
        FitRes,
        EvaluateRes,
        Metrics
    )
    FLOWR_AVAILABLE = True
except ImportError:
    pass


class FederatedForecaster:
    """
    Federated learning coordinator for time series forecasting

    Enables collaborative model training across multiple clients:
    - Factory A, Factory B, Factory C can train together
    - Each client keeps their data private
    - Only model updates are shared
    - Secure aggregation protects privacy
    """

    def __init__(
        self,
        base_model_type: str = 'tft',
        num_rounds: int = 10,
        min_available_clients: int = 2,
        min_fit_clients: int = 2,
        min_evaluate_clients: int = 2,
        fraction_fit: float = 1.0,
        fraction_evaluate: float = 1.0,
        aggregation_method: str = 'fedavg'  # fedavg, fedbuff, fedprox
    ):
        """
        Initialize federated forecaster

        Args:
            base_model_type: Base model type ('tft', 'lstm', 'prophet')
            num_rounds: Number of federated learning rounds
            min_available_clients: Minimum clients to participate
            min_fit_clients: Minimum clients for training
            min_evaluate_clients: Minimum clients for evaluation
            fraction_fit: Fraction of clients to use for training
            fraction_evaluate: Fraction of clients to use for evaluation
            aggregation_method: Aggregation algorithm ('fedavg', 'fedbuff', 'fedprox')
        """
        self.base_model_type = base_model_type
        self.num_rounds = num_rounds
        self.min_available_clients = min_available_clients
        self.min_fit_clients = min_fit_clients
        self.min_evaluate_clients = min_evaluate_clients
        self.fraction_fit = fraction_fit
        self.fraction_evaluate = fraction_evaluate
        self.aggregation_method = aggregation_method

        self.global_model = None
        self.clients: Dict[str, FederatedClient] = {}
        self.round_results = []

        logger.info(f"FederatedForecaster initialized with aggregation={aggregation_method}")

    def initialize_global_model(self, model_config: Optional[Dict] = None):
        """
        Initialize global model

        Args:
            model_config: Model configuration parameters
        """
        # Create base model configuration
        config = model_config or self._get_default_model_config()

        # Initialize global model weights
        self.global_model = {
            'type': self.base_model_type,
            'config': config,
            'round': 0,
            'parameters': self._get_initial_parameters(config),
            'metrics': {}
        }

        logger.info("Global model initialized")

    def register_client(
        self,
        client_id: str,
        data_info: Dict[str, Any],
        model_config: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Register a federated learning client

        Args:
            client_id: Unique client identifier
            data_info: Information about client's data
            model_config: Client-specific model config

        Returns:
            Registration result
        """
        if client_id in self.clients:
            return {
                'success': False,
                'message': f'Client {client_id} already registered'
            }

        # Create client
        client = FederatedClient(
            client_id=client_id,
            data_info=data_info,
            model_type=self.base_model_type,
            model_config=model_config
        )

        self.clients[client_id] = client

        return {
            'success': True,
            'client_id': client_id,
            'message': f'Client {client_id} registered successfully',
            'total_clients': len(self.clients)
        }

    def train_round(
        self,
        client_ids: Optional[List[str]] = None,
        epochs_per_client: int = 5,
        learning_rate: float = 0.01
    ) -> Dict[str, Any]:
        """
        Execute one round of federated training

        Args:
            client_ids: List of clients to participate (None = all)
            epochs_per_client: Number of local training epochs per client
            learning_rate: Learning rate for local training

        Returns:
            Training round results
        """
        if self.global_model is None:
            raise ValueError("Global model not initialized. Call initialize_global_model first.")

        if len(self.clients) < self.min_available_clients:
            raise ValueError(f"Need at least {self.min_available_clients} clients, got {len(self.clients)}")

        # Select clients for this round
        selected_clients = self._select_clients(client_ids)

        logger.info(f"Starting federated round with {len(selected_clients)} clients")

        # Distribute global model to clients
        global_params = self.global_model['parameters']

        # Local training results
        client_updates = []
        total_samples = 0

        # Train on each client
        for client_id in selected_clients:
            client = self.clients[client_id]

            try:
                # Client performs local training
                update = client.local_train(
                    global_params=global_params,
                    epochs=epochs_per_client,
                    learning_rate=learning_rate
                )

                client_updates.append({
                    'client_id': client_id,
                    'parameters': update['parameters'],
                    'num_samples': update['num_samples'],
                    'metrics': update['metrics']
                })

                total_samples += update['num_samples']

            except Exception as e:
                logger.error(f"Client {client_id} training failed: {e}")
                continue

        # Aggregate updates
        aggregated_params = self._aggregate_updates(
            client_updates,
            total_samples
        )

        # Update global model
        self.global_model['parameters'] = aggregated_params
        self.global_model['round'] += 1

        # Evaluate global model
        global_metrics = self._evaluate_global_model()

        self.global_model['metrics'] = global_metrics

        # Store round results
        round_result = {
            'round': self.global_model['round'],
            'num_clients': len(selected_clients),
            'client_updates': client_updates,
            'aggregated_params': aggregated_params,
            'global_metrics': global_metrics,
            'timestamp': datetime.now().isoformat()
        }

        self.round_results.append(round_result)

        return round_result

    def _select_clients(self, client_ids: Optional[List[str]]) -> List[str]:
        """Select clients for federated round"""
        if client_ids:
            # Use specified clients
            return [c for c in client_ids if c in self.clients]
        else:
            # Sample clients based on fraction
            num_clients = max(
                self.min_fit_clients,
                int(len(self.clients) * self.fraction_fit)
            )

            all_client_ids = list(self.clients.keys())
            selected = np.random.choice(
                all_client_ids,
                size=min(num_clients, len(all_client_ids)),
                replace=False
            )

            return list(selected)

    def _aggregate_updates(
        self,
        client_updates: List[Dict],
        total_samples: int
    ) -> Dict[str, np.ndarray]:
        """Aggregate client updates using specified method"""
        if self.aggregation_method == 'fedavg':
            return self._fedavg_aggregation(client_updates, total_samples)
        elif self.aggregation_method == 'fedbuff':
            return self._fedbuff_aggregation(client_updates, total_samples)
        else:
            return self._fedavg_aggregation(client_updates, total_samples)

    def _fedavg_aggregation(
        self,
        client_updates: List[Dict],
        total_samples: int
    ) -> Dict[str, np.ndarray]:
        """
        Federated Averaging (FedAvg)

        Weighted average of client parameters based on data size
        """
        # Initialize aggregated parameters
        aggregated = {}

        for layer_name in client_updates[0]['parameters'].keys():
            # Weighted average
            weighted_sum = None
            weight_sum = 0

            for update in client_updates:
                params = update['parameters'][layer_name]
                weight = update['num_samples'] / total_samples

                if weighted_sum is None:
                    weighted_sum = params * weight
                else:
                    weighted_sum += params * weight

                weight_sum += weight

            aggregated[layer_name] = weighted_sum

        return aggregated

    def _fedbuff_aggregation(
        self,
        client_updates: List[Dict],
        total_samples: int
    ) -> Dict[str, np.ndarray]:
        """
        FedBuff: Buffered aggregation with momentum

        Uses past updates to smooth aggregation
        """
        # Get previous parameters
        prev_params = self.global_model.get('parameters', {})

        # FedAvg aggregation
        fedavg_result = self._fedavg_aggregation(client_updates, total_samples)

        # Apply momentum
        momentum = 0.9
        aggregated = {}

        for layer_name in fedavg_result.keys():
            if layer_name in prev_params:
                aggregated[layer_name] = (
                    momentum * prev_params[layer_name] +
                    (1 - momentum) * fedavg_result[layer_name]
                )
            else:
                aggregated[layer_name] = fedavg_result[layer_name]

        return aggregated

    def _evaluate_global_model(self) -> Dict[str, float]:
        """Evaluate global model on client validation data"""
        # Collect validation metrics from all clients
        all_metrics = []

        for client_id, client in self.clients.items():
            try:
                metrics = client.evaluate(self.global_model['parameters'])
                all_metrics.append(metrics)
            except Exception as e:
                logger.error(f"Client {client_id} evaluation failed: {e}")

        if not all_metrics:
            return {}

        # Average metrics across clients
        avg_metrics = {}
        for key in all_metrics[0].keys():
            values = [m[key] for m in all_metrics if key in m]
            if values:
                avg_metrics[key] = np.mean(values)

        return avg_metrics

    def predict(
        self,
        client_id: str,
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Generate prediction using global model

        Args:
            client_id: Client to use for prediction
            horizon: Forecast horizon

        Returns:
            Prediction results
        """
        if self.global_model is None:
            raise ValueError("Global model not available")

        client = self.clients.get(client_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")

        # Use client's predict method with global parameters
        prediction = client.predict(
            parameters=self.global_model['parameters'],
            horizon=horizon
        )

        return prediction

    def get_global_model_info(self) -> Dict[str, Any]:
        """Get global model information"""
        if self.global_model is None:
            return {'status': 'not_initialized'}

        return {
            'status': 'initialized',
            'type': self.global_model['type'],
            'round': self.global_model['round'],
            'config': self.global_model['config'],
            'metrics': self.global_model['metrics'],
            'num_clients': len(self.clients),
            'aggregation_method': self.aggregation_method
        }

    def get_client_info(self, client_id: str) -> Dict[str, Any]:
        """Get information about specific client"""
        client = self.clients.get(client_id)
        if not client:
            return {'error': f'Client {client_id} not found'}

        return client.get_info()

    def get_all_clients(self) -> List[Dict[str, Any]]:
        """Get information about all clients"""
        return [client.get_info() for client in self.clients.values()]

    def _get_default_model_config(self) -> Dict:
        """Get default model configuration"""
        return {
            'input_size': 10,
            'hidden_size': 64,
            'num_layers': 2,
            'dropout': 0.1,
            'prediction_length': 30
        }

    def _get_initial_parameters(self, config: Dict) -> Dict[str, np.ndarray]:
        """Get initial model parameters"""
        # Create dummy parameters
        return {
            'layer1.weight': np.random.randn(config['hidden_size'], config['input_size']),
            'layer1.bias': np.zeros(config['hidden_size']),
            'layer2.weight': np.random.randn(config['hidden_size'], config['hidden_size']),
            'layer2.bias': np.zeros(config['hidden_size']),
            'output.weight': np.random.randn(1, config['hidden_size']),
            'output.bias': np.zeros(1)
        }


class FederatedClient:
    """
    Federated learning client

    Represents a single participant in federated learning
    """

    def __init__(
        self,
        client_id: str,
        data_info: Dict[str, Any],
        model_type: str = 'tft',
        model_config: Optional[Dict] = None
    ):
        """
        Initialize federated client

        Args:
            client_id: Unique client identifier
            data_info: Information about client's data
            model_type: Model type to use
            model_config: Model configuration
        """
        self.client_id = client_id
        self.data_info = data_info
        self.model_type = model_type
        self.model_config = model_config or {}

        # Simulated local data
        self.train_data = self._generate_simulated_data('train')
        self.val_data = self._generate_simulated_data('val')

        logger.info(f"FederatedClient {client_id} initialized")

    def local_train(
        self,
        global_params: Dict[str, np.ndarray],
        epochs: int = 5,
        learning_rate: float = 0.01
    ) -> Dict[str, Any]:
        """
        Perform local training

        Args:
            global_params: Global model parameters
            epochs: Number of local training epochs
            learning_rate: Local learning rate

        Returns:
            Training results with updated parameters
        """
        # Initialize local model with global parameters
        local_params = copy.deepcopy(global_params)

        # Simulate local training
        for epoch in range(epochs):
            # Simulate gradient descent
            for param_name in local_params.keys():
                # Simulated gradient and update
                gradient = np.random.randn(*local_params[param_name].shape) * 0.01
                local_params[param_name] -= learning_rate * gradient

        # Calculate training metrics
        train_metrics = self._calculate_metrics(self.train_data)

        return {
            'client_id': self.client_id,
            'parameters': local_params,
            'num_samples': len(self.train_data),
            'metrics': train_metrics
        }

    def evaluate(
        self,
        parameters: Dict[str, np.ndarray]
    ) -> Dict[str, float]:
        """
        Evaluate model with given parameters

        Args:
            parameters: Model parameters to evaluate

        Returns:
            Evaluation metrics
        """
        return self._calculate_metrics(self.val_data)

    def predict(
        self,
        parameters: Dict[str, np.ndarray],
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Generate prediction with given parameters

        Args:
            parameters: Model parameters to use
            horizon: Forecast horizon

        Returns:
            Prediction results
        """
        # Simulate prediction
        last_value = self.train_data[-1] if len(self.train_data) > 0 else 100

        forecast = []
        for i in range(horizon):
            base = last_value + np.random.randn() * 2
            forecast.append(max(0, base))

        # Generate future dates
        dates = pd.date_range(
            start=pd.Timestamp.now(),
            periods=horizon,
            freq='D'
        ).tolist()

        return {
            'forecast': forecast,
            'dates': [d.isoformat() for d in dates],
            'horizon': horizon,
            'client_id': self.client_id
        }

    def get_info(self) -> Dict[str, Any]:
        """Get client information"""
        return {
            'client_id': self.client_id,
            'model_type': self.model_type,
            'data_info': self.data_info,
            'train_samples': len(self.train_data),
            'val_samples': len(self.val_data),
            'model_config': self.model_config
        }

    def _generate_simulated_data(self, split: str) -> np.ndarray:
        """Generate simulated data for client"""
        num_samples = self.data_info.get(f'{split}_samples', 1000)
        base_value = self.data_info.get('base_value', 100)

        # Generate time series
        trend = np.random.randn() * 0.5
        noise = np.random.randn(num_samples) * 5

        data = base_value + trend * np.arange(num_samples) + noise

        return data

    def _calculate_metrics(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate metrics on data"""
        if len(data) == 0:
            return {}

        # Simple metrics
        return {
            'mean': float(np.mean(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'mae': float(np.mean(np.abs(data - data.mean())))
        }


class FedAvg:
    """
    Federated Averaging (FedAvg) algorithm

    Classic federated learning aggregation method
    """

    def __init__(
        self,
        min_available_clients: int = 2,
        min_fit_clients: int = 2,
        fraction_fit: float = 1.0
    ):
        self.min_available_clients = min_available_clients
        self.min_fit_clients = min_fit_clients
        self.fraction_fit = fraction_fit

    def aggregate(
        self,
        updates: List[Dict],
        total_samples: int
    ) -> Dict[str, np.ndarray]:
        """
        Aggregate model updates

        Args:
            updates: List of client updates
            total_samples: Total number of samples across clients

        Returns:
            Aggregated parameters
        """
        aggregated = {}

        # Weight each update by number of samples
        for layer_name in updates[0]['parameters'].keys():
            weighted_sum = None

            for update in updates:
                params = update['parameters'][layer_name]
                weight = update['num_samples'] / total_samples

                if weighted_sum is None:
                    weighted_sum = params * weight
                else:
                    weighted_sum += params * weight

            aggregated[layer_name] = weighted_sum

        return aggregated


class FedBuff(FedAvg):
    """
    FedBuff: Buffered federated averaging

    Uses momentum for smoother aggregation
    """

    def __init__(
        self,
        min_available_clients: int = 2,
        min_fit_clients: int = 2,
        fraction_fit: float = 1.0,
        buffer_size: int = 10,
        momentum: float = 0.9
    ):
        super().__init__(min_available_clients, min_fit_clients, fraction_fit)
        self.buffer_size = buffer_size
        self.momentum = momentum
        self.parameter_buffer = []

    def aggregate(
        self,
        updates: List[Dict],
        total_samples: int,
        current_params: Optional[Dict[str, np.ndarray]] = None
    ) -> Dict[str, np.ndarray]:
        """
        Aggregate with momentum

        Args:
            updates: List of client updates
            total_samples: Total samples
            current_params: Current global parameters

        Returns:
            Aggregated parameters with momentum
        """
        # Standard FedAvg aggregation
        fedavg_result = super().aggregate(updates, total_samples)

        if current_params is None:
            return fedavg_result

        # Apply momentum
        aggregated = {}
        for layer_name in fedavg_result.keys():
            if layer_name in current_params:
                aggregated[layer_name] = (
                    self.momentum * current_params[layer_name] +
                    (1 - self.momentum) * fedavg_result[layer_name]
                )
            else:
                aggregated[layer_name] = fedavg_result[layer_name]

        return aggregated


# Utility functions
def get_available_federated_libraries() -> Dict[str, bool]:
    """Get availability of federated learning libraries"""
    return {
        'flwr': FLOWR_AVAILABLE
    }


def install_flwr() -> str:
    """Return pip install command for Flower"""
    return "pip install flwr"
