"""
Meta-Learning Module

Learning to learn across domains and tasks
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class MetaLearner:
    """
    Meta-Learning System

    Learns how to learn across multiple tasks and domains
    """

    def __init__(
        self,
        meta_algorithm: str = 'maml',
        support_size: int = 50,
        query_size: int = 20,
        inner_lr: float = 0.01,
        meta_lr: float = 0.001
    ):
        """
        Initialize Meta Learner

        Args:
            meta_algorithm: Meta-learning algorithm ('maml', 'reptile', 'prototypical')
            support_size: Number of support samples per task
            query_size: Number of query samples per task
            inner_lr: Inner loop learning rate
            meta_lr: Meta learning rate
        """
        self.meta_algorithm = meta_algorithm
        self.support_size = support_size
        self.query_size = query_size
        self.inner_lr = inner_lr
        self.meta_lr = meta_lr

        self.task_history = []
        self.meta_parameters = {}
        self.adaptation_history = []

        logger.info(f"MetaLearner initialized with {meta_algorithm}")

    def meta_train(
        self,
        tasks: List[Dict[str, pd.DataFrame]],
        num_iterations: int = 100
    ) -> Dict[str, Any]:
        """
        Train meta-learner across tasks

        Args:
            tasks: List of tasks, each with support/query data
            num_iterations: Number of meta-training iterations

        Returns:
            Meta-training results
        """
        logger.info(f"Meta-training on {len(tasks)} tasks for {num_iterations} iterations")

        results = []

        for iteration in range(num_iterations):
            iteration_results = []

            # Sample batch of tasks
            task_batch = np.random.choice(tasks, size=min(5, len(tasks)), replace=False)

            for task in task_batch:
                # Extract support and query sets
                support_data = task.get('support', pd.DataFrame())
                query_data = task.get('query', pd.DataFrame())

                if len(support_data) == 0 or len(query_data) == 0:
                    continue

                # Inner loop adaptation
                adapted_params = self._inner_loop_adaptation(support_data)

                # Evaluate on query set
                query_loss = self._evaluate_on_query(query_data, adapted_params)

                iteration_results.append(query_loss)

            # Meta update
            if iteration_results:
                meta_loss = np.mean(iteration_results)
                self._meta_update(meta_loss)
                results.append(meta_loss)

        return {
            'status': 'success',
            'meta_loss_history': results,
            'final_meta_loss': float(results[-1]) if results else 0.0,
            'iterations': len(results)
        }

    def _inner_loop_adaptation(
        self,
        support_data: pd.DataFrame
    ) -> Dict[str, np.ndarray]:
        """Inner loop adaptation on support set"""
        # Simulated inner loop update
        # In production, would use gradient descent
        adapted_params = {}

        for key, value in self.meta_parameters.items():
            # Simulate gradient step
            gradient = np.random.randn(*value.shape) * 0.1
            adapted_params[key] = value - self.inner_lr * gradient

        return adapted_params

    def _evaluate_on_query(
        self,
        query_data: pd.DataFrame,
        adapted_params: Dict[str, np.ndarray]
    ) -> float:
        """Evaluate adapted parameters on query set"""
        # Simulated evaluation
        return float(np.random.randn() * 0.1 + 0.8)

    def _meta_update(self, meta_loss: float) -> None:
        """Meta parameter update"""
        # Update meta parameters based on meta-loss
        for key in self.meta_parameters:
            gradient = meta_loss * 0.01
            self.meta_parameters[key] -= self.meta_lr * gradient

    def adapt_to_task(
        self,
        support_data: pd.DataFrame,
        num_steps: int = 5
    ) -> Dict[str, Any]:
        """
        Adapt to new task with few examples

        Args:
            support_data: Support set for new task
            num_steps: Number of adaptation steps

        Returns:
            Adaptation result
        """
        logger.info(f"Adapting to new task with {len(support_data)} samples")

        adapted_params = self.meta_parameters.copy()
        adaptation_path = []

        for step in range(num_steps):
            # Simulate adaptation step
            for key in adapted_params:
                gradient = np.random.randn(*adapted_params[key].shape) * 0.05
                adapted_params[key] -= self.inner_lr * gradient

            adaptation_path.append({
                'step': step,
                'param_norm': float(np.linalg.norm(list(adapted_params.values())[0]))
            })

        self.adaptation_history.append({
            'timestamp': datetime.now(),
            'support_size': len(support_data),
            'adaptation_steps': num_steps,
            'final_params': adapted_params
        })

        return {
            'status': 'success',
            'adapted_parameters': adapted_params,
            'adaptation_path': adaptation_path
        }


class ModelZoo:
    """
    Model Zoo

    Repository of pre-trained models for transfer learning
    """

    def __init__(
        self,
        zoo_path: Optional[str] = None,
        auto_download: bool = True
    ):
        """
        Initialize Model Zoo

        Args:
            zoo_path: Path to model zoo storage
            auto_download: Auto-download missing models
        """
        self.zoo_path = zoo_path or '/tmp/model_zoo'
        self.auto_download = auto_download

        self.available_models = {}
        self.model_metadata = {}
        self.download_history = []

        # Initialize with default models
        self._initialize_default_models()

        logger.info(f"ModelZoo initialized with {len(self.available_models)} models")

    def _initialize_default_models(self) -> None:
        """Initialize default model zoo"""
        default_models = {
            'tft_pretrained': {
                'task_type': 'forecasting',
                'domains': ['retail', 'manufacturing', 'finance'],
                'accuracy': 0.92,
                'download_url': 'internal://models/tft_pretrained.pt'
            },
            'prophet_baseline': {
                'task_type': 'forecasting',
                'domains': ['general'],
                'accuracy': 0.85,
                'download_url': 'internal://models/prophet_baseline.pkl'
            },
            'lstm_universal': {
                'task_type': 'forecasting',
                'domains': ['retail', 'manufacturing'],
                'accuracy': 0.88,
                'download_url': 'internal://models/lstm_universal.h5'
            }
        }

        for model_id, metadata in default_models.items():
            self.model_metadata[model_id] = metadata
            self.available_models[model_id] = True  # Simulated availability

    def list_models(
        self,
        task_type: Optional[str] = None,
        domain: Optional[str] = None,
        min_accuracy: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        List available models

        Args:
            task_type: Filter by task type
            domain: Filter by domain
            min_accuracy: Minimum accuracy threshold

        Returns:
            List of model information
        """
        models = []

        for model_id, metadata in self.model_metadata.items():
            # Apply filters
            if task_type and metadata['task_type'] != task_type:
                continue
            if domain and domain not in metadata['domains']:
                continue
            if metadata['accuracy'] < min_accuracy:
                continue

            models.append({
                'model_id': model_id,
                'available': self.available_models.get(model_id, False),
                **metadata
            })

        return sorted(models, key=lambda x: x['accuracy'], reverse=True)

    def download_model(
        self,
        model_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Download model from zoo

        Args:
            model_id: Model identifier
            force: Force re-download

        Returns:
            Download result
        """
        if model_id not in self.model_metadata:
            return {
                'status': 'error',
                'message': f'Model {model_id} not found in zoo'
            }

        if self.available_models.get(model_id, False) and not force:
            return {
                'status': 'success',
                'message': f'Model {model_id} already available',
                'model_id': model_id
            }

        # Simulate download
        logger.info(f"Downloading model {model_id}")
        self.available_models[model_id] = True

        self.download_history.append({
            'timestamp': datetime.now(),
            'model_id': model_id,
            'forced': force
        })

        return {
            'status': 'success',
            'model_id': model_id,
            'downloaded_at': datetime.now().isoformat()
        }

    def load_model(
        self,
        model_id: str
    ) -> Optional[Any]:
        """
        Load model from zoo

        Args:
            model_id: Model identifier

        Returns:
            Loaded model instance
        """
        if not self.available_models.get(model_id, False):
            if self.auto_download:
                self.download_model(model_id)
            else:
                logger.error(f"Model {model_id} not available")
                return None

        # Simulate loading model
        logger.info(f"Loading model {model_id} from zoo")

        # In production, would actually load the model
        return {
            'model_id': model_id,
            'metadata': self.model_metadata[model_id]
        }


class TransferLearning:
    """
    Transfer Learning System

    Transfers knowledge from source to target domains
    """

    def __init__(
        self,
        transfer_method: str = 'fine_tuning',
        freeze_layers: int = 0,
        learning_rate: float = 0.001
    ):
        """
        Initialize Transfer Learning

        Args:
            transfer_method: Method for transfer ('fine_tuning', 'feature_extraction', 'adapter')
            freeze_layers: Number of layers to freeze
            learning_rate: Learning rate for fine-tuning
        """
        self.transfer_method = transfer_method
        self.freeze_layers = freeze_layers
        self.learning_rate = learning_rate

        self.transfer_history = []

    def transfer(
        self,
        source_model: Any,
        target_data: pd.DataFrame,
        target_col: str = 'value',
        epochs: int = 10
    ) -> Dict[str, Any]:
        """
        Transfer learning to target domain

        Args:
            source_model: Pre-trained source model
            target_data: Target domain data
            target_col: Target column name
            epochs: Training epochs

        Returns:
            Transfer result
        """
        logger.info(f"Transfer learning using {self.transfer_method}")

        # Split target data
        train_size = int(len(target_data) * 0.8)
        train_data = target_data[:train_size]
        val_data = target_data[train_size:]

        # Perform transfer
        if self.transfer_method == 'fine_tuning':
            result = self._fine_tune(source_model, train_data, val_data, target_col, epochs)
        elif self.transfer_method == 'feature_extraction':
            result = self._feature_extraction(source_model, train_data, val_data, target_col)
        elif self.transfer_method == 'adapter':
            result = self._adapter_transfer(source_model, train_data, val_data, target_col, epochs)
        else:
            result = self._fine_tune(source_model, train_data, val_data, target_col, epochs)

        self.transfer_history.append({
            'timestamp': datetime.now(),
            'method': self.transfer_method,
            'target_samples': len(target_data),
            'epochs': epochs,
            'result': result
        })

        return result

    def _fine_tune(
        self,
        source_model: Any,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str,
        epochs: int
    ) -> Dict[str, Any]:
        """Fine-tuning transfer"""
        # Simulated fine-tuning
        losses = []
        for epoch in range(epochs):
            loss = np.exp(-epoch / 5) + np.random.randn() * 0.1
            losses.append(loss)

        return {
            'method': 'fine_tuning',
            'final_loss': float(losses[-1]),
            'loss_reduction': float(losses[0] - losses[-1]),
            'epochs': epochs
        }

    def _feature_extraction(
        self,
        source_model: Any,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str
    ) -> Dict[str, Any]:
        """Feature extraction transfer"""
        # Extract features from source model
        features = self._extract_features(source_model, train_data)

        # Train new head on target data
        # Simulated training
        accuracy = 0.85 + np.random.randn() * 0.05

        return {
            'method': 'feature_extraction',
            'feature_dim': features.shape[1] if hasattr(features, 'shape') else 128,
            'accuracy': float(accuracy)
        }

    def _adapter_transfer(
        self,
        source_model: Any,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        target_col: str,
        epochs: int
    ) -> Dict[str, Any]:
        """Adapter-based transfer"""
        # Add adapter layers
        # Simulated adapter training
        adapter_losses = []
        for epoch in range(epochs):
            loss = np.exp(-epoch / 3) + np.random.randn() * 0.08
            adapter_losses.append(loss)

        return {
            'method': 'adapter',
            'final_loss': float(adapter_losses[-1]),
            'adapter_params': 64,
            'epochs': epochs
        }

    def _extract_features(
        self,
        model: Any,
        data: pd.DataFrame
    ) -> np.ndarray:
        """Extract features from model"""
        # Simulated feature extraction
        num_samples = len(data)
        feature_dim = 128
        return np.random.randn(num_samples, feature_dim)


class FewShotLearning:
    """
    Few-Shot Learning System

    Learn from very few examples
    """

    def __init__(
        self,
        shot: int = 5,
        way: int = 5,
        method: str = 'prototypical'
    ):
        """
        Initialize Few-Shot Learning

        Args:
            shot: Number of shots (examples per class)
            way: Number of ways (classes)
            method: Few-shot method ('prototypical', 'matching_networks', 'relation_network')
        """
        self.shot = shot
        self.way = way
        self.method = method

        self.prototypes = {}
        self.episode_history = []

    def train_episode(
        self,
        support_data: pd.DataFrame,
        support_labels: np.ndarray,
        query_data: pd.DataFrame,
        query_labels: np.ndarray
    ) -> Dict[str, Any]:
        """
        Train on one few-shot episode

        Args:
            support_data: Support set data
            support_labels: Support set labels
            query_data: Query set data
            query_labels: Query set labels

        Returns:
            Episode results
        """
        logger.info(f"Training few-shot episode: {self.way}-way, {self.shot}-shot")

        if self.method == 'prototypical':
            result = self._prototypical_network(
                support_data, support_labels,
                query_data, query_labels
            )
        else:
            result = self._prototypical_network(
                support_data, support_labels,
                query_data, query_labels
            )

        self.episode_history.append(result)

        return result

    def _prototypical_network(
        self,
        support_data: pd.DataFrame,
        support_labels: np.ndarray,
        query_data: pd.DataFrame,
        query_labels: np.ndarray
    ) -> Dict[str, Any]:
        """Prototypical network implementation"""
        # Calculate prototypes for each class
        unique_classes = np.unique(support_labels)
        prototypes = {}

        for cls in unique_classes:
            cls_mask = support_labels == cls
            cls_data = support_data[cls_mask]
            prototypes[cls] = cls_data.mean(axis=0)

        # Classify query samples
        predictions = []
        for _, query_sample in query_data.iterrows():
            distances = {
                cls: np.linalg.norm(query_sample.values - proto)
                for cls, proto in prototypes.items()
            }
            predicted_cls = min(distances, key=distances.get)
            predictions.append(predicted_cls)

        # Calculate accuracy
        accuracy = np.mean(predictions == query_labels)

        return {
            'method': 'prototypical',
            'accuracy': float(accuracy),
            'num_classes': len(unique_classes),
            'shot': self.shot
        }

    def predict(
        self,
        query_data: pd.DataFrame,
        support_data: Optional[pd.DataFrame] = None,
        support_labels: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Predict on query data

        Args:
            query_data: Query data
            support_data: Optional support data
            support_labels: Optional support labels

        Returns:
            Predictions
        """
        if support_data is not None and support_labels is not None:
            # Calculate new prototypes
            self.prototypes = {}
            for cls in np.unique(support_labels):
                cls_mask = support_labels == cls
                cls_data = support_data[cls_mask]
                self.prototypes[cls] = cls_data.mean(axis=0)

        # Use existing prototypes
        if not self.prototypes:
            return {
                'status': 'error',
                'message': 'No prototypes available'
            }

        predictions = []
        confidences = []

        for _, query_sample in query_data.iterrows():
            distances = {
                cls: np.linalg.norm(query_sample.values - proto)
                for cls, proto in self.prototypes.items()
            }

            # Convert to softmax probabilities
            exp_distances = {cls: np.exp(-d) for cls, d in distances.items()}
            total = sum(exp_distances.values())
            probs = {cls: exp_d / total for cls, exp_d in exp_distances.items()}

            predicted_cls = max(probs, key=probs.get)
            predictions.append(predicted_cls)
            confidences.append(probs[predicted_cls])

        return {
            'predictions': predictions,
            'confidences': [float(c) for c in confidences],
            'method': self.method
        }

    def get_prototypes(self) -> Dict[str, np.ndarray]:
        """Get current prototypes"""
        return self.prototypes.copy()


# Utility functions
def create_meta_learner(
    algorithm: str = 'maml',
    support_size: int = 50
) -> MetaLearner:
    """Create meta learner"""
    return MetaLearner(
        meta_algorithm=algorithm,
        support_size=support_size
    )


def create_model_zoo(
    zoo_path: Optional[str] = None
) -> ModelZoo:
    """Create model zoo"""
    return ModelZoo(zoo_path=zoo_path)


def create_transfer_learner(
    method: str = 'fine_tuning'
) -> TransferLearning:
    """Create transfer learner"""
    return TransferLearning(transfer_method=method)


def create_few_shot_learner(
    shot: int = 5,
    way: int = 5
) -> FewShotLearning:
    """Create few-shot learner"""
    return FewShotLearning(shot=shot, way=way)
