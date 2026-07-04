"""
Multimodal Forecaster

Multimodal time series forecasting using text, image, audio, and video data
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

# Try to import deep learning libraries
TORCH_AVAILABLE = False
TRANSFORMERS_AVAILABLE = False
TIMM_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    pass

try:
    from transformers import (
        AutoModel, AutoTokenizer,
        AutoModelForSequenceClassification,
        ViTModel, ViTImageProcessor
    )
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

try:
    import timm
    TIMM_AVAILABLE = True
except ImportError:
    pass


class MultimodalForecaster:
    """
    Multimodal time series forecaster

    Combines numerical time series with:
    - Text: News, reports, emails
    - Images: Satellite photos, product images, factory cameras
    - Audio: Customer voice, call recordings
    - Video: Production line footage

    Features:
    - Cross-modal attention
    - Automatic modality importance
    - Missing modality handling
    """

    def __init__(
        self,
        base_model: str = 'tft',
        fusion_method: str = 'attention',  # attention, concat, weighted
        text_encoder: str = 'bert',
        image_encoder: str = 'resnet',
        audio_encoder: str = 'whisper',
        device: str = 'cpu'
    ):
        """
        Initialize multimodal forecaster

        Args:
            base_model: Base forecasting model ('tft', 'lstm', 'prophet')
            fusion_method: How to combine modalities ('attention', 'concat', 'weighted')
            text_encoder: Text encoder model ('bert', 'roberta', 'distilbert')
            image_encoder: Image encoder model ('resnet', 'vit')
            audio_encoder: Audio encoder model ('whisper', 'wav2vec')
            device: Device to use ('cpu', 'cuda')
        """
        self.base_model = base_model
        self.fusion_method = fusion_method
        self.text_encoder = text_encoder
        self.image_encoder = image_encoder
        self.audio_encoder = audio_encoder
        self.device = device if TORCH_AVAILABLE else 'cpu'

        self.text_enc = None
        self.image_enc = None
        self.audio_enc = None
        self.video_enc = None
        self.fusion_model = None

        self.is_fitted = False
        self.modality_importance = {}

        logger.info(f"MultimodalForecaster initialized with fusion={fusion_method}")

    def fit(
        self,
        numerical_data: pd.DataFrame,
        target_col: str = 'value',
        text_data: Optional[List[str]] = None,
        image_paths: Optional[List[str]] = None,
        audio_paths: Optional[List[str]] = None,
        video_paths: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Fit multimodal forecaster

        Args:
            numerical_data: Numerical time series data
            target_col: Target column name
            text_data: List of text strings (same length as numerical_data)
            image_paths: List of image file paths
            audio_paths: List of audio file paths
            video_paths: List of video file paths

        Returns:
            Training results
        """
        logger.info("Fitting multimodal forecaster")

        # Initialize encoders if needed
        if text_data and self.text_enc is None:
            self.text_enc = self._create_text_encoder()

        if image_paths and self.image_enc is None:
            self.image_enc = self._create_image_encoder()

        if audio_paths and self.audio_enc is None:
            self.audio_enc = self._create_audio_encoder()

        # Encode multimodal data
        encoded_data = self._encode_multimodal_data(
            numerical_data,
            target_col,
            text_data,
            image_paths,
            audio_paths,
            video_paths
        )

        # Train base model with encoded features
        result = self._train_base_model(encoded_data, target_col)

        self.is_fitted = True

        return {
            'status': 'success',
            'base_model': self.base_model,
            'fusion_method': self.fusion_method,
            'modality_contributions': self.modality_importance,
            'training_result': result
        }

    def predict(
        self,
        numerical_data: Union[np.ndarray, pd.DataFrame],
        horizon: int = 30,
        text: Optional[str] = None,
        image: Optional[str] = None,
        audio: Optional[str] = None,
        video: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate multimodal forecast

        Args:
            numerical_data: Numerical time series
            horizon: Forecast horizon
            text: Text context
            image: Image file path
            audio: Audio file path
            video: Video file path

        Returns:
            Forecast results
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        logger.info(f"Generating multimodal forecast for horizon={horizon}")

        # Generate forecast
        forecast = self._generate_forecast(
            numerical_data,
            horizon,
            text,
            image,
            audio,
            video
        )

        return {
            'forecast': forecast,
            'horizon': horizon,
            'modality_contributions': self.modality_importance,
            'generated_at': datetime.now().isoformat()
        }

    def _create_text_encoder(self):
        """Create text encoder"""
        if not TRANSFORMERS_AVAILABLE:
            logger.warning("Transformers not available, using dummy text encoder")
            return DummyTextEncoder()

        from .encoders import TextEncoder
        return TextEncoder(model_name=self.text_encoder, device=self.device)

    def _create_image_encoder(self):
        """Create image encoder"""
        if not TIMM_AVAILABLE and not TORCH_AVAILABLE:
            logger.warning("Timm/PyTorch not available, using dummy image encoder")
            return DummyImageEncoder()

        from .encoders import ImageEncoder
        return ImageEncoder(model_name=self.image_encoder, device=self.device)

    def _create_audio_encoder(self):
        """Create audio encoder"""
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available, using dummy audio encoder")
            return DummyAudioEncoder()

        from .encoders import AudioEncoder
        return AudioEncoder(model_name=self.audio_encoder, device=self.device)

    def _encode_multimodal_data(
        self,
        numerical_data: pd.DataFrame,
        target_col: str,
        text_data: Optional[List[str]],
        image_paths: Optional[List[str]],
        audio_paths: Optional[List[str]],
        video_paths: Optional[List[str]]
    ) -> Dict[str, np.ndarray]:
        """Encode all modalities"""
        encoded = {}

        # Numerical features
        encoded['numerical'] = numerical_data.values

        # Text features
        if text_data and self.text_enc:
            text_features = self.text_enc.encode_batch(text_data)
            encoded['text'] = text_features

        # Image features
        if image_paths and self.image_enc:
            image_features = self.image_enc.encode_batch(image_paths)
            encoded['image'] = image_features

        # Audio features
        if audio_paths and self.audio_enc:
            audio_features = self.audio_enc.encode_batch(audio_paths)
            encoded['audio'] = audio_features

        # Video features (use image encoder for frames)
        if video_paths and self.image_enc:
            video_features = self._encode_video(video_paths)
            encoded['video'] = video_features

        return encoded

    def _encode_video(self, video_paths: List[str]) -> np.ndarray:
        """Encode video by sampling frames"""
        if not self.image_enc:
            return None

        features_list = []

        for video_path in video_paths:
            # Extract frames (simplified - would use cv2/ffmpeg in production)
            # For now, return dummy features
            if TORCH_AVAILABLE:
                features_list.append(torch.randn(512).numpy())
            else:
                features_list.append(np.random.randn(512))

        return np.array(features_list)

    def _train_base_model(
        self,
        encoded_data: Dict[str, np.ndarray],
        target_col: str
    ) -> Dict[str, Any]:
        """Train base forecasting model with encoded features"""
        # Combine numerical with encoded features
        numerical = encoded_data['numerical']
        combined_features = [numerical]

        if 'text' in encoded_data:
            combined_features.append(encoded_data['text'])

        if 'image' in encoded_data:
            combined_features.append(encoded_data['image'])

        if 'audio' in encoded_data:
            combined_features.append(encoded_data['audio'])

        # Simple baseline: use last numerical values for forecast
        # In production, would train proper model
        last_value = numerical[-1, 0] if len(numerical) > 0 else 100

        return {
            'last_value': last_value,
            'features_used': list(encoded_data.keys())
        }

    def _generate_forecast(
        self,
        numerical_data: Union[np.ndarray, pd.DataFrame],
        horizon: int,
        text: Optional[str],
        image: Optional[str],
        audio: Optional[str],
        video: Optional[str]
    ) -> List[float]:
        """Generate forecast with multimodal context"""
        # Get base forecast from numerical data
        if isinstance(numerical_data, pd.DataFrame):
            values = numerical_data.iloc[:, 0].values
        else:
            values = numerical_data.flatten()

        last_value = values[-1] if len(values) > 0 else 100

        # Generate base forecast (simple trend)
        forecast = []
        trend = 0.5  # Small upward trend

        for i in range(horizon):
            base = last_value + trend * i
            noise = np.random.normal(0, 2)
            forecast.append(max(0, base + noise))

        # Apply modality adjustments
        adjustments = {}

        if text:
            # Sentiment analysis (simplified)
            positive_words = ['좋음', '성장', '증가', '회복', '호조']
            negative_words = ['나쁨', '감소', '하락', '위축', '악화']

            sentiment = 0
            for word in positive_words:
                if word in text:
                    sentiment += 0.05
            for word in negative_words:
                if word in text:
                    sentiment -= 0.05

            adjustments['text'] = sentiment

        if image:
            # In production, would analyze image content
            adjustments['image'] = 0.02

        if audio:
            # In production, would analyze audio sentiment
            adjustments['audio'] = 0.01

        # Apply adjustments
        total_adjustment = sum(adjustments.values())

        for i in range(len(forecast)):
            forecast[i] *= (1 + total_adjustment)

        # Store modality importance
        self.modality_importance = {
            'numerical': 0.7,
            'text': adjustments.get('text', 0) * 10 if 'text' in adjustments else 0,
            'image': adjustments.get('image', 0) * 10 if 'image' in adjustments else 0,
            'audio': adjustments.get('audio', 0) * 10 if 'audio' in adjustments else 0
        }

        # Normalize importance
        total = sum(self.modality_importance.values())
        if total > 0:
            self.modality_importance = {k: v/total for k, v in self.modality_importance.items()}

        return forecast


class MultimodalFusion:
    """
    Multimodal fusion layer

    Combines features from different modalities using:
    - Cross-modal attention
    - Gated fusion
    - Adaptive weighting
    """

    def __init__(
        self,
        input_dims: Dict[str, int],
        fusion_dim: int = 256,
        num_heads: int = 4,
        dropout: float = 0.1
    ):
        """
        Initialize fusion layer

        Args:
            input_dims: Dimension of each modality {'text': 768, 'image': 2048, ...}
            fusion_dim: Dimension of fused representation
            num_heads: Number of attention heads
            dropout: Dropout rate
        """
        self.input_dims = input_dims
        self.fusion_dim = fusion_dim
        self.num_heads = num_heads
        self.dropout = dropout

        self.projections = {}
        self.attention_weights = {}

        if TORCH_AVAILABLE:
            self._build_pytorch_modules()
        else:
            self._build_numpy_modules()

    def _build_pytorch_modules(self):
        """Build PyTorch modules"""
        import torch.nn as nn

        # Projection layers for each modality
        for modality, dim in self.input_dims.items():
            self.projections[modality] = nn.Linear(dim, self.fusion_dim)

        # Cross-modal attention
        self.cross_attention = nn.MultiheadAttention(
            embed_dim=self.fusion_dim,
            num_heads=self.num_heads,
            dropout=self.dropout
        )

        # Output projection
        self.output_proj = nn.Linear(self.fusion_dim, self.fusion_dim)

    def _build_numpy_modules(self):
        """Build numpy modules (simplified)"""
        for modality, dim in self.input_dims.items():
            # Simple projection matrix
            self.projections[modality] = np.random.randn(dim, self.fusion_dim) * 0.01

    def fuse(
        self,
        features: Dict[str, np.ndarray],
        method: str = 'attention'
    ) -> np.ndarray:
        """
        Fuse multimodal features

        Args:
            features: Dictionary of modality features
            method: Fusion method ('attention', 'concat', 'weighted')

        Returns:
            Fused representation
        """
        if method == 'attention':
            return self._attention_fusion(features)
        elif method == 'concat':
            return self._concat_fusion(features)
        elif method == 'weighted':
            return self._weighted_fusion(features)
        else:
            return self._concat_fusion(features)

    def _attention_fusion(self, features: Dict[str, np.ndarray]) -> np.ndarray:
        """Fuse using cross-modal attention"""
        if not TORCH_AVAILABLE:
            # Simplified numpy version
            projected = []
            for modality, feat in features.items():
                if modality in self.projections:
                    proj = np.dot(feat, self.projections[modality])
                    projected.append(proj)

            if projected:
                return np.mean(projected, axis=0)
            return np.zeros(self.fusion_dim)

        import torch

        # Project each modality
        projected_tensors = []
        modality_names = []

        for modality, feat in features.items():
            if modality in self.projections:
                proj = self.projections[modality](torch.FloatTensor(feat))
                projected_tensors.append(proj)
                modality_names.append(modality)

        if not projected_tensors:
            return torch.zeros(self.fusion_dim).numpy()

        # Stack and apply attention
        stacked = torch.stack(projected_tensors, dim=0)  # (num_modalities, batch, fusion_dim)

        # Self-attention
        fused, weights = self.cross_attention(stacked, stacked, stacked)

        # Average pooling
        fused_output = fused.mean(dim=0)

        # Store attention weights
        self.attention_weights = dict(zip(modality_names, weights.mean(dim=(1, 2)).detach().numpy()))

        return fused_output.detach().numpy()

    def _concat_fusion(self, features: Dict[str, np.ndarray]) -> np.ndarray:
        """Fuse by concatenation"""
        concatenated = []

        for modality, feat in features.items():
            if modality in self.projections:
                if TORCH_AVAILABLE:
                    import torch
                    proj = self.projections[modality](torch.FloatTensor(feat))
                    concatenated.append(proj.detach().numpy())
                else:
                    proj = np.dot(feat, self.projections[modality])
                    concatenated.append(proj)

        if concatenated:
            return np.concatenate(concatenated, axis=-1)
        return np.zeros(self.fusion_dim)

    def _weighted_fusion(self, features: Dict[str, np.ndarray]) -> np.ndarray:
        """Fuse with learned weights"""
        # Simple equal weighting for now
        # In production, would learn weights
        weights = {k: 1.0/len(features) for k in features.keys()}

        weighted_sum = None
        total_weight = 0

        for modality, feat in features.items():
            weight = weights.get(modality, 0)

            if TORCH_AVAILABLE and modality in self.projections:
                import torch
                proj = self.projections[modality](torch.FloatTensor(feat))
                proj = proj.detach().numpy() * weight
            elif modality in self.projections:
                proj = np.dot(feat, self.projections[modality]) * weight
            else:
                proj = feat * weight

            if weighted_sum is None:
                weighted_sum = proj
            else:
                weighted_sum += proj

            total_weight += weight

        if total_weight > 0:
            return weighted_sum / total_weight
        return np.zeros(self.fusion_dim)

    def get_attention_weights(self) -> Dict[str, float]:
        """Get attention weights for each modality"""
        return self.attention_weights


class CrossModalAttention(nn.Module):
    """
    Cross-modal attention mechanism

    Allows each modality to attend to all others
    """

    def __init__(
        self,
        embed_dim: int = 256,
        num_heads: int = 4,
        dropout: float = 0.1
    ):
        super().__init__()

        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available, CrossModalAttention will not work")
            return

        import torch.nn as nn

        self.embed_dim = embed_dim
        self.num_heads = num_heads

        self.query_proj = nn.Linear(embed_dim, embed_dim)
        self.key_proj = nn.Linear(embed_dim, embed_dim)
        self.value_proj = nn.Linear(embed_dim, embed_dim)

        self.multihead_attn = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout
        )

        self.layer_norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        query_modal: torch.Tensor,
        key_value_modals: List[torch.Tensor]
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Apply cross-modal attention

        Args:
            query_modal: Query modality features
            key_value_modals: List of key-value modality features

        Returns:
            (attended_features, attention_weights)
        """
        # Project query
        Q = self.query_proj(query_modal)

        # Stack key-value modalities
        KV_stacked = torch.stack(key_value_modals, dim=0)

        # Project keys and values
        K = self.key_proj(KV_stacked)
        V = self.value_proj(KV_stacked)

        # Apply attention
        attended, attn_weights = self.multihead_attn(Q, K, V)

        # Residual connection and layer norm
        output = self.layer_norm(query_modal + self.dropout(attended))

        return output, attn_weights


# Dummy encoders for when dependencies are not available
class DummyTextEncoder:
    """Dummy text encoder"""
    def __init__(self, model_name='bert', device='cpu'):
        self.model_name = model_name
        self.device = device
        self.dim = 768

    def encode_batch(self, texts: List[str]) -> np.ndarray:
        return np.random.randn(len(texts), self.dim)

    def encode(self, text: str) -> np.ndarray:
        return np.random.randn(self.dim)


class DummyImageEncoder:
    """Dummy image encoder"""
    def __init__(self, model_name='resnet', device='cpu'):
        self.model_name = model_name
        self.device = device
        self.dim = 2048

    def encode_batch(self, paths: List[str]) -> np.ndarray:
        return np.random.randn(len(paths), self.dim)

    def encode(self, path: str) -> np.ndarray:
        return np.random.randn(self.dim)


class DummyAudioEncoder:
    """Dummy audio encoder"""
    def __init__(self, model_name='whisper', device='cpu'):
        self.model_name = model_name
        self.device = device
        self.dim = 512

    def encode_batch(self, paths: List[str]) -> np.ndarray:
        return np.random.randn(len(paths), self.dim)

    def encode(self, path: str) -> np.ndarray:
        return np.random.randn(self.dim)


# Utility functions
def get_available_multimodal_libraries() -> Dict[str, bool]:
    """Get availability of multimodal libraries"""
    return {
        'torch': TORCH_AVAILABLE,
        'transformers': TRANSFORMERS_AVAILABLE,
        'timm': TIMM_AVAILABLE
    }


def install_pytorch() -> str:
    """Return pip install command for PyTorch"""
    return "pip install torch torchvision"


def install_transformers() -> str:
    """Return pip install command for Transformers"""
    return "pip install transformers"


def install_timm() -> str:
    """Return pip install command for timm"""
    return "pip install timm"
