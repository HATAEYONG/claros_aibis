"""
Multimodal Encoders

Encoders for text, image, audio, and video modalities
"""

import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Check library availability
TORCH_AVAILABLE = False
TRANSFORMERS_AVAILABLE = False
PIL_AVAILABLE = False
LIBROSA_AVAILABLE = False
CV2_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    pass

try:
    from transformers import AutoModel, AutoTokenizer, AutoImageProcessor
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    pass

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    pass

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    pass


class TextEncoder:
    """
    Text encoder using transformer models

    Supports:
    - BERT (bert-base-uncased, bert-multilingual)
    - RoBERTa (roberta-base)
    - DistilBERT (distilbert-base)
    """

    def __init__(
        self,
        model_name: str = 'bert-base-uncased',
        device: str = 'cpu',
        max_length: int = 512
    ):
        """
        Initialize text encoder

        Args:
            model_name: Hugging Face model name
            device: Device to use ('cpu', 'cuda')
            max_length: Maximum sequence length
        """
        self.model_name = model_name
        self.device = device
        self.max_length = max_length

        self.model = None
        self.tokenizer = None
        self.dim = 768  # Default BERT dimension

        if TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE:
            self._load_model()
        else:
            logger.warning(f"Transformers/PyTorch not available, using dummy text encoder")

    def _load_model(self):
        """Load transformer model"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()

            # Get output dimension
            self.dim = self.model.config.hidden_size

            logger.info(f"Loaded text encoder: {self.model_name} (dim={self.dim})")

        except Exception as e:
            logger.error(f"Failed to load text encoder: {e}")
            self.model = None
            self.tokenizer = None

    def encode(
        self,
        text: str,
        return_tensor: bool = False
    ) -> np.ndarray:
        """
        Encode single text

        Args:
            text: Input text
            return_tensor: Return PyTorch tensor if True

        Returns:
            Text embedding vector
        """
        if not self.model or not self.tokenizer:
            # Return dummy embedding
            return np.random.randn(self.dim)

        try:
            # Tokenize
            inputs = self.tokenizer(
                text,
                max_length=self.max_length,
                truncation=True,
                padding=True,
                return_tensors='pt'
            )

            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Encode
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Use [CLS] token embedding
            embedding = outputs.last_hidden_state[:, 0, :].squeeze(0)

            if return_tensor:
                return embedding
            else:
                return embedding.cpu().numpy()

        except Exception as e:
            logger.error(f"Text encoding failed: {e}")
            return np.random.randn(self.dim)

    def encode_batch(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> np.ndarray:
        """
        Encode batch of texts

        Args:
            texts: List of input texts
            batch_size: Batch size for encoding

        Returns:
            Batch of embeddings (shape: [len(texts), dim])
        """
        embeddings = []

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]

            if self.model and self.tokenizer:
                # Tokenize batch
                inputs = self.tokenizer(
                    batch_texts,
                    max_length=self.max_length,
                    truncation=True,
                    padding=True,
                    return_tensors='pt'
                )

                inputs = {k: v.to(self.device) for k, v in inputs.items()}

                # Encode batch
                with torch.no_grad():
                    outputs = self.model(**inputs)

                # Use [CLS] token embeddings
                batch_embeddings = outputs.last_hidden_state[:, 0, :]
                embeddings.append(batch_embeddings.cpu().numpy())
            else:
                # Dummy embeddings
                embeddings.append(np.random.randn(len(batch_texts), self.dim))

        return np.vstack(embeddings)

    def get_embedding_dim(self) -> int:
        """Get embedding dimension"""
        return self.dim


class ImageEncoder:
    """
    Image encoder using CNN/Vision Transformer

    Supports:
    - ResNet (resnet50, resnet101)
    - ViT (vit-base-patch16-224)
    - ConvNeXt
    """

    def __init__(
        self,
        model_name: str = 'resnet50',
        device: str = 'cpu',
        image_size: int = 224
    ):
        """
        Initialize image encoder

        Args:
            model_name: Model name ('resnet50', 'vit-base-patch16-224')
            device: Device to use ('cpu', 'cuda')
            image_size: Input image size
        """
        self.model_name = model_name
        self.device = device
        self.image_size = image_size

        self.model = None
        self.preprocessor = None
        self.dim = 2048  # Default ResNet50 dimension

        if TORCH_AVAILABLE:
            self._load_model()
        else:
            logger.warning("PyTorch not available, using dummy image encoder")

    def _load_model(self):
        """Load image model"""
        try:
            if 'vit' in self.model_name.lower():
                # Use transformers for ViT
                if TRANSFORMERS_AVAILABLE:
                    from transformers import ViTModel, ViTImageProcessor

                    self.model = ViTModel.from_pretrained(self.model_name)
                    self.model.to(self.device)
                    self.model.eval()

                    self.preprocessor = ViTImageProcessor.from_pretrained(self.model_name)
                    self.dim = self.model.config.hidden_size
            else:
                # Use timm for ResNet and other CNNs
                import timm

                self.model = timm.create_model(self.model_name, pretrained=True)
                self.model.to(self.device)
                self.model.eval()

                # Get feature dimension
                self.dim = self.model.num_features  # Global pool output dimension

            logger.info(f"Loaded image encoder: {self.model_name} (dim={self.dim})")

        except Exception as e:
            logger.error(f"Failed to load image encoder: {e}")
            self.model = None
            self.preprocessor = None

    def _load_and_preprocess_image(self, image_path: str) -> Optional[np.ndarray]:
        """Load and preprocess image"""
        if not PIL_AVAILABLE:
            logger.warning("PIL not available, returning dummy image")
            return np.random.randint(0, 255, (self.image_size, self.image_size, 3), dtype=np.uint8)

        try:
            image = Image.open(image_path).convert('RGB')
            image = image.resize((self.image_size, self.image_size))
            return np.array(image)
        except Exception as e:
            logger.error(f"Failed to load image {image_path}: {e}")
            return np.random.randint(0, 255, (self.image_size, self.image_size, 3), dtype=np.uint8)

    def encode(
        self,
        image_path: str,
        return_tensor: bool = False
    ) -> np.ndarray:
        """
        Encode single image

        Args:
            image_path: Path to image file
            return_tensor: Return PyTorch tensor if True

        Returns:
            Image embedding vector
        """
        if not self.model:
            return np.random.randn(self.dim)

        try:
            # Load image
            image = self._load_and_preprocess_image(image_path)

            if self.preprocessor:
                # Use ViT preprocessor
                from PIL import Image as PILImage
                pil_image = PILImage.fromarray(image)

                inputs = self.preprocessor(pil_image, return_tensors='pt')
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

                with torch.no_grad():
                    outputs = self.model(**inputs)
                    embedding = outputs.last_hidden_state[:, 0, :].squeeze(0)
            else:
                # Manual preprocessing for timm models
                import torchvision.transforms as transforms

                transform = transforms.Compose([
                    transforms.ToPILImage(),
                    transforms.Resize((self.image_size, self.image_size)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
                ])

                from PIL import Image as PILImage
                pil_image = PILImage.fromarray(image)
                input_tensor = transform(pil_image).unsqueeze(0).to(self.device)

                with torch.no_grad():
                    features = self.model(input_tensor)
                    embedding = features.squeeze(0)

            if return_tensor:
                return embedding
            else:
                return embedding.cpu().numpy()

        except Exception as e:
            logger.error(f"Image encoding failed: {e}")
            return np.random.randn(self.dim)

    def encode_batch(
        self,
        image_paths: List[str],
        batch_size: int = 4
    ) -> np.ndarray:
        """
        Encode batch of images

        Args:
            image_paths: List of image file paths
            batch_size: Batch size for encoding

        Returns:
            Batch of embeddings (shape: [len(paths), dim])
        """
        embeddings = []

        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i+batch_size]

            if self.model:
                batch_embeddings = []

                for path in batch_paths:
                    emb = self.encode(path, return_tensor=True)
                    batch_embeddings.append(emb)

                if batch_embeddings:
                    stacked = torch.stack(batch_embeddings)
                    embeddings.append(stacked.cpu().numpy())
                else:
                    embeddings.append(np.random.randn(len(batch_paths), self.dim))
            else:
                embeddings.append(np.random.randn(len(batch_paths), self.dim))

        return np.vstack(embeddings)

    def get_embedding_dim(self) -> int:
        """Get embedding dimension"""
        return self.dim


class AudioEncoder:
    """
    Audio encoder using speech/audio models

    Supports:
    - Whisper (whisper-base, whisper-small)
    - Wav2Vec2 (wav2vec2-base)
    """

    def __init__(
        self,
        model_name: str = 'whisper-base',
        device: str = 'cpu',
        sample_rate: int = 16000
    ):
        """
        Initialize audio encoder

        Args:
            model_name: Model name ('whisper-base', 'wav2vec2-base')
            device: Device to use ('cpu', 'cuda')
            sample_rate: Audio sample rate
        """
        self.model_name = model_name
        self.device = device
        self.sample_rate = sample_rate

        self.model = None
        self.processor = None
        self.dim = 512  # Default Whisper dimension

        if TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE:
            self._load_model()
        else:
            logger.warning("Transformers/PyTorch not available, using dummy audio encoder")

    def _load_model(self):
        """Load audio model"""
        try:
            if 'whisper' in self.model_name.lower():
                from transformers import WhisperModel, WhisperProcessor

                self.model = WhisperModel.from_pretrained(self.model_name)
                self.model.to(self.device)
                self.model.eval()

                self.processor = WhisperProcessor.from_pretrained(self.model_name)
                self.dim = self.model.config.d_model
            elif 'wav2vec' in self.model_name.lower():
                from transformers import Wav2Vec2Model, Wav2Vec2Processor

                self.model = Wav2Vec2Model.from_pretrained(self.model_name)
                self.model.to(self.device)
                self.model.eval()

                self.processor = Wav2Vec2Processor.from_pretrained(self.model_name)
                self.dim = self.model.config.hidden_size

            logger.info(f"Loaded audio encoder: {self.model_name} (dim={self.dim})")

        except Exception as e:
            logger.error(f"Failed to load audio encoder: {e}")
            self.model = None
            self.processor = None

    def _load_audio(self, audio_path: str) -> Optional[np.ndarray]:
        """Load audio file"""
        if LIBROSA_AVAILABLE:
            try:
                audio, sr = librosa.load(audio_path, sr=self.sample_rate)
                return audio
            except Exception as e:
                logger.error(f"Failed to load audio {audio_path}: {e}")

        # Return dummy audio
        return np.random.randn(self.sample_rate * 5)  # 5 seconds of dummy audio

    def encode(
        self,
        audio_path: str,
        return_tensor: bool = False
    ) -> np.ndarray:
        """
        Encode single audio

        Args:
            audio_path: Path to audio file
            return_tensor: Return PyTorch tensor if True

        Returns:
            Audio embedding vector
        """
        if not self.model:
            return np.random.randn(self.dim)

        try:
            # Load audio
            audio = self._load_audio(audio_path)

            if self.processor is None:
                return np.random.randn(self.dim)

            # Process audio
            inputs = self.processor(audio, return_tensors='pt', sampling_rate=self.sample_rate)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Encode
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Use mean pooled features
            if 'last_hidden_state' in outputs:
                embedding = outputs.last_hidden_state.mean(dim=1).squeeze(0)
            else:
                embedding = torch.randn(self.dim).to(self.device)

            if return_tensor:
                return embedding
            else:
                return embedding.cpu().numpy()

        except Exception as e:
            logger.error(f"Audio encoding failed: {e}")
            return np.random.randn(self.dim)

    def encode_batch(
        self,
        audio_paths: List[str],
        batch_size: int = 2
    ) -> np.ndarray:
        """
        Encode batch of audio files

        Args:
            audio_paths: List of audio file paths
            batch_size: Batch size for encoding

        Returns:
            Batch of embeddings (shape: [len(paths), dim])
        """
        embeddings = []

        for i in range(0, len(audio_paths), batch_size):
            batch_paths = audio_paths[i:i+batch_size]

            batch_embeddings = []
            for path in batch_paths:
                emb = self.encode(path, return_tensor=True)
                batch_embeddings.append(emb)

            if batch_embeddings:
                stacked = torch.stack(batch_embeddings)
                embeddings.append(stacked.cpu().numpy())
            else:
                embeddings.append(np.random.randn(len(batch_paths), self.dim))

        return np.vstack(embeddings)

    def get_embedding_dim(self) -> int:
        """Get embedding dimension"""
        return self.dim


class VideoEncoder:
    """
    Video encoder using frame sampling and image encoder

    Samples frames from video and encodes them using image encoder
    """

    def __init__(
        self,
        image_encoder: Optional[ImageEncoder] = None,
        num_frames: int = 8,
        frame_sampling: str = 'uniform'  # uniform, random, key
    ):
        """
        Initialize video encoder

        Args:
            image_encoder: Image encoder to use for frames
            num_frames: Number of frames to sample
            frame_sampling: How to sample frames ('uniform', 'random', 'key')
        """
        self.image_encoder = image_encoder or ImageEncoder()
        self.num_frames = num_frames
        self.frame_sampling = frame_sampling

        self.dim = self.image_encoder.get_embedding_dim()

    def _sample_frames(
        self,
        video_path: str
    ) -> List[np.ndarray]:
        """Sample frames from video"""
        frames = []

        if CV2_AVAILABLE:
            try:
                cap = cv2.VideoCapture(video_path)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

                if total_frames == 0:
                    cap.release()
                    return self._get_dummy_frames()

                # Calculate frame indices
                if self.frame_sampling == 'uniform':
                    indices = np.linspace(0, total_frames - 1, self.num_frames, dtype=int)
                elif self.frame_sampling == 'random':
                    indices = np.random.choice(total_frames, self.num_frames, replace=False)
                    indices = sorted(indices)
                else:  # key frames - every nth frame
                    indices = np.arange(0, total_frames, max(1, total_frames // self.num_frames))[:self.num_frames]

                # Extract frames
                for idx in indices:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                    ret, frame = cap.read()
                    if ret:
                        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        frames.append(frame)

                cap.release()

            except Exception as e:
                logger.error(f"Failed to sample frames from {video_path}: {e}")
                frames = self._get_dummy_frames()
        else:
            frames = self._get_dummy_frames()

        # Pad with dummy frames if needed
        while len(frames) < self.num_frames:
            frames.append(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))

        return frames[:self.num_frames]

    def _get_dummy_frames(self) -> List[np.ndarray]:
        """Get dummy frames"""
        return [
            np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            for _ in range(self.num_frames)
        ]

    def encode(
        self,
        video_path: str,
        return_tensor: bool = False
    ) -> np.ndarray:
        """
        Encode single video

        Args:
            video_path: Path to video file
            return_tensor: Return PyTorch tensor if True

        Returns:
            Video embedding vector (aggregated from frames)
        """
        try:
            # Sample frames
            frames = self._sample_frames(video_path)

            # Encode each frame
            frame_embeddings = []

            for i, frame in enumerate(frames):
                # Save frame temporarily
                temp_path = f'/tmp/frame_{i}.jpg'

                if PIL_AVAILABLE:
                    from PIL import Image as PILImage
                    PILImage.fromarray(frame).save(temp_path)

                    # Encode frame
                    emb = self.image_encoder.encode(temp_path, return_tensor=True)
                    frame_embeddings.append(emb)

            # Aggregate frame embeddings
            if frame_embeddings:
                stacked = torch.stack(frame_embeddings)
                aggregated = stacked.mean(dim=0)  # Average pooling

                if return_tensor:
                    return aggregated
                else:
                    return aggregated.cpu().numpy()
            else:
                return np.random.randn(self.dim)

        except Exception as e:
            logger.error(f"Video encoding failed: {e}")
            return np.random.randn(self.dim)

    def encode_batch(
        self,
        video_paths: List[str]
    ) -> np.ndarray:
        """
        Encode batch of videos

        Args:
            video_paths: List of video file paths

        Returns:
            Batch of embeddings (shape: [len(paths), dim])
        """
        embeddings = []

        for path in video_paths:
            emb = self.encode(path, return_tensor=True)
            embeddings.append(emb.cpu().numpy())

        return np.vstack(embeddings)

    def get_embedding_dim(self) -> int:
        """Get embedding dimension"""
        return self.dim


# Utility functions
def get_encoder_info() -> Dict[str, Dict]:
    """Get information about available encoders"""
    return {
        'text': {
            'available': TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE,
            'models': ['bert-base-uncased', 'roberta-base', 'distilbert-base'],
            'install': 'pip install transformers torch'
        },
        'image': {
            'available': TORCH_AVAILABLE and (TRANSFORMERS_AVAILABLE or True),
            'models': ['resnet50', 'vit-base-patch16-224'],
            'install': 'pip install torch torchvision transformers timm'
        },
        'audio': {
            'available': TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE,
            'models': ['whisper-base', 'wav2vec2-base'],
            'install': 'pip install transformers torch librosa'
        },
        'video': {
            'available': CV2_AVAILABLE and PIL_AVAILABLE,
            'models': ['frame-sampling'],
            'install': 'pip install opencv-python pillow'
        }
    }
