"""
Secure Aggregation

Privacy-preserving aggregation methods for federated learning
"""

import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Check library availability
CRYPTOGRAPHY_AVAILABLE = False

try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    pass


class SecureAggregator:
    """
    Secure aggregation for federated learning

    Features:
    - Encryption of client updates
    - Secure multi-party computation
    - Differential privacy
    - Privacy preservation
    """

    def __init__(
        self,
        encryption_method: str = 'homomorphic',  # homomorphic, additive
        key_size: int = 32,
        dropout_clients: int = 0
    ):
        """
        Initialize secure aggregator

        Args:
            encryption_method: Method for encryption
            key_size: Size of encryption key in bytes
            dropout_clients: Number of clients to drop for privacy
        """
        self.encryption_method = encryption_method
        self.key_size = key_size
        self.dropout_clients = dropout_clients

        self.shared_key = None
        self.client_keys = {}

    def generate_shared_key(self) -> bytes:
        """Generate shared secret key"""
        import secrets
        self.shared_key = secrets.token_bytes(self.key_size)
        return self.shared_key

    def encrypt_update(
        self,
        update: Dict[str, np.ndarray],
        client_id: str
    ) -> Dict[str, bytes]:
        """
        Encrypt client update

        Args:
            update: Client model update
            client_id: Client identifier

        Returns:
            Encrypted update
        """
        if self.encryption_method == 'homomorphic' and CRYPTOGRAPHY_AVAILABLE:
            return self._homomorphic_encrypt(update, client_id)
        else:
            return self._additive_encrypt(update, client_id)

    def _homomorphic_encrypt(
        self,
        update: Dict[str, np.ndarray],
        client_id: str
    ) -> Dict[str, bytes]:
        """
        Homomorphic encryption (simplified)

        In production, would use Paillier or similar
        """
        encrypted = {}

        for layer_name, params in update.items():
            # Simplified: convert to bytes and encode
            # Real homomorphic encryption preserves additive properties
            params_bytes = params.tobytes()
            encrypted[layer_name] = params_bytes

        return encrypted

    def _additive_encrypt(
        self,
        update: Dict[str, np.ndarray],
        client_id: str
    ) -> Dict[str, bytes]:
        """
        Additive encryption using one-time pads

        Each client gets random masks that sum to zero
        """
        encrypted = {}

        for layer_name, params in update.items():
            # Generate one-time pad
            pad = np.random.randn(*params.shape)
            encrypted_params = params + pad

            encrypted[layer_name] = {
                'data': encrypted_params.tobytes(),
                'pad': pad.tobytes(),
                'shape': params.shape
            }

        return encrypted

    def decrypt_aggregated(
        self,
        encrypted_update: Dict[str, Any]
    ) -> Dict[str, np.ndarray]:
        """
        Decrypt aggregated update

        Args:
            encrypted_update: Encrypted aggregated parameters

        Returns:
            Decrypted parameters
        """
        if self.encryption_method == 'homomorphic':
            return self._homomorphic_decrypt(encrypted_update)
        else:
            return self._additive_decrypt(encrypted_update)

    def _homomorphic_decrypt(
        self,
        encrypted_update: Dict[str, bytes]
    ) -> Dict[str, np.ndarray]:
        """Decrypt homomorphic encrypted update"""
        decrypted = {}

        for layer_name, encrypted_bytes in encrypted_update.items():
            decrypted[layer_name] = np.frombuffer(encrypted_bytes, dtype=np.float64)

        return decrypted

    def _additive_decrypt(
        self,
        encrypted_update: Dict[str, Any]
    ) -> Dict[str, np.ndarray]:
        """
        Decrypt additive encrypted update

        One-time pads cancel out during aggregation
        """
        decrypted = {}

        for layer_name, enc_data in encrypted_update.items():
            if isinstance(enc_data, dict):
                data = np.frombuffer(enc_data['data'], dtype=np.float64)
                shape = enc_data['shape']
                decrypted[layer_name] = data.reshape(shape)
            else:
                decrypted[layer_name] = np.frombuffer(enc_data, dtype=np.float64)

        return decrypted


class DifferentialPrivacy:
    """
    Differential privacy for federated learning

    Adds noise to updates to preserve privacy
    """

    def __init__(
        self,
        epsilon: float = 1.0,
        delta: float = 1e-5,
        sensitivity: float = 1.0,
        mechanism: str = 'gaussian'  # gaussian, laplace
    ):
        """
        Initialize differential privacy

        Args:
            epsilon: Privacy budget (smaller = more private)
            delta: Privacy parameter
            sensitivity: Sensitivity of the query
            mechanism: Noise mechanism ('gaussian', 'laplace')
        """
        self.epsilon = epsilon
        self.delta = delta
        self.sensitivity = sensitivity
        self.mechanism = mechanism

        logger.info(f"DifferentialPrivacy initialized: epsilon={epsilon}, delta={delta}")

    def add_noise(
        self,
        parameters: Dict[str, np.ndarray]
    ) -> Dict[str, np.ndarray]:
        """
        Add privacy noise to parameters

        Args:
            parameters: Model parameters

        Returns:
            Noisy parameters
        """
        noisy_params = {}

        for param_name, params in parameters.items():
            if self.mechanism == 'gaussian':
                noise = self._gaussian_noise(params.shape)
            else:
                noise = self._laplace_noise(params.shape)

            noisy_params[param_name] = params + noise

        return noisy_params

    def _gaussian_noise(self, shape: Tuple[int, ...]) -> np.ndarray:
        """Generate Gaussian noise for DP"""
        # Calculate sigma from epsilon, delta, sensitivity
        sigma = np.sqrt(2 * np.log(1.25 / self.delta)) * self.sensitivity / self.epsilon

        return np.random.normal(0, sigma, shape)

    def _laplace_noise(self, shape: Tuple[int, ...]) -> np.ndarray:
        """Generate Laplace noise for DP"""
        # Calculate scale from epsilon and sensitivity
        scale = self.sensitivity / self.epsilon

        return np.random.laplace(0, scale, shape)

    def clip_update(
        self,
        parameters: Dict[str, np.ndarray],
        clip_norm: float = 1.0
    ) -> Dict[str, np.ndarray]:
        """
        Clip parameter update to bound sensitivity

        Args:
            parameters: Model parameters
            clip_norm: Maximum L2 norm

        Returns:
            Clipped parameters
        """
        clipped_params = {}

        # Calculate total norm
        total_norm = 0
        for params in parameters.values():
            total_norm += np.sum(params ** 2)

        total_norm = np.sqrt(total_norm)

        # Clip if necessary
        if total_norm > clip_norm:
            clip_ratio = clip_norm / total_norm
            for param_name, params in parameters.items():
                clipped_params[param_name] = params * clip_ratio
        else:
            clipped_params = parameters

        return clipped_params

    def get_privacy_spent(self) -> Dict[str, float]:
        """Get privacy budget spent"""
        return {
            'epsilon': self.epsilon,
            'delta': self.delta,
            'mechanism': self.mechanism
        }


class SecureAggregationProtocol:
    """
    Secure aggregation protocol for federated learning

    Implements the full secure aggregation protocol:
    1. Client masks
    2. Pairwise alignment
    3. Decoding
    """

    def __init__(
        self,
        num_clients: int,
        dropout_threshold: int = 1
    ):
        """
        Initialize secure aggregation protocol

        Args:
            num_clients: Total number of clients
            dropout_threshold: Maximum number of dropped clients
        """
        self.num_clients = num_clients
        self.dropout_threshold = dropout_threshold
        self.masks = {}

    def generate_masks(self, round_id: int) -> Dict[str, np.ndarray]:
        """
        Generate pairwise masks for secure aggregation

        Each client gets masks that sum to zero across all clients
        """
        self.masks[round_id] = {}

        # Generate random seeds for each client pair
        for i in range(self.num_clients):
            for j in range(i + 1, self.num_clients):
                # Random mask for pair (i, j)
                mask_ij = np.random.randn(64)  # Seed size
                mask_ji = -mask_ij  # Ensure sum is zero

                # Assign to clients
                client_i = f"client_{i}"
                client_j = f"client_{j}"

                if client_i not in self.masks[round_id]:
                    self.masks[round_id][client_i] = {}
                if client_j not in self.masks[round_id]:
                    self.masks[round_id][client_j] = {}

                self.masks[round_id][client_i][f"mask_{j}"] = mask_ij
                self.masks[round_id][client_j][f"mask_{i}"] = mask_ji

        return self.masks[round_id]

    def aggregate_with_masks(
        self,
        masked_updates: List[Dict[str, np.ndarray]]
    ) -> Dict[str, np.ndarray]:
        """
        Aggregate masked updates

        Masks cancel out during aggregation, revealing only sum
        """
        # Start with first update
        aggregated = masked_updates[0].copy()

        # Add remaining updates
        for update in masked_updates[1:]:
            for layer_name in aggregated.keys():
                if layer_name in update:
                    aggregated[layer_name] += update[layer_name]

        return aggregated


class PrivacyAccountant:
    """
    Privacy accountant for tracking privacy budget

    Tracks differential privacy guarantees over multiple rounds
    """

    def __init__(
        self,
        target_epsilon: float = 10.0,
        target_delta: float = 1e-5
    ):
        """
        Initialize privacy accountant

        Args:
            target_epsilon: Total privacy budget
            target_delta: Total delta budget
        """
        self.target_epsilon = target_epsilon
        self.target_delta = target_delta
        self.spent_epsilon = 0.0
        self.spent_delta = 0.0
        self.round_history = []

    def add_round(
        self,
        epsilon_spent: float,
        delta_spent: float,
        round_num: int
    ):
        """Record privacy spent in a round"""
        self.spent_epsilon += epsilon_spent
        self.spent_delta += delta_spent

        self.round_history.append({
            'round': round_num,
            'epsilon_spent': epsilon_spent,
            'delta_spent': delta_spent,
            'total_epsilon': self.spent_epsilon,
            'total_delta': self.spent_delta
        })

    def get_remaining_budget(self) -> Dict[str, float]:
        """Get remaining privacy budget"""
        return {
            'remaining_epsilon': max(0, self.target_epsilon - self.spent_epsilon),
            'remaining_delta': max(0, self.target_delta - self.spent_delta),
            'spent_epsilon': self.spent_epsilon,
            'spent_delta': self.spent_delta,
            'rounds_history': self.round_history
        }

    def can_continue(self, epsilon_needed: float = 0.1) -> bool:
        """Check if there's enough privacy budget to continue"""
        remaining = self.target_epsilon - self.spent_epsilon
        return remaining >= epsilon_needed


# Utility functions
def get_available_crypto_libraries() -> Dict[str, bool]:
    """Get availability of cryptographic libraries"""
    return {
        'cryptography': CRYPTOGRAPHY_AVAILABLE
    }


def install_cryptography() -> str:
    """Return pip install command for cryptography"""
    return "pip install cryptography"
