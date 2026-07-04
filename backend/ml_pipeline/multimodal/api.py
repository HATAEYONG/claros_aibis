"""
Multimodal Prediction API

REST API endpoints for multimodal forecasting
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import HttpResponse
import os
import tempfile

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import json
import base64

from .multimodal_forecaster import (
    MultimodalForecaster,
    MultimodalFusion,
    CrossModalAttention,
    get_available_multimodal_libraries
)

from .encoders import (
    TextEncoder,
    ImageEncoder,
    AudioEncoder,
    VideoEncoder,
    get_encoder_info
)

logger = logging.getLogger(__name__)

# Global multimodal models
_multimodal_models: Dict[str, MultimodalForecaster] = {}
_encoders: Dict[str, Any] = {}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """Multimodal module health check"""
    available_libs = get_available_multimodal_libraries()
    encoder_info = get_encoder_info()

    return Response({
        'status': 'healthy',
        'module': 'Multimodal Prediction',
        'version': '1.0.0',
        'available_libraries': available_libs,
        'encoders': encoder_info,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def multimodal_train(request):
    """
    Train multimodal forecaster

    POST /api/ml-pipeline/multimodal/train/

    Body:
    {
        "model_id": "multimodal_v1",
        "numerical_data": [
            {"date": "2024-01-01", "value": 100},
            ...
        ],
        "text_data": ["뉴스 1", "뉴스 2", ...],  // optional
        "target_col": "value",
        "fusion_method": "attention",
        "text_encoder": "bert",
        "image_encoder": "resnet"
    }
    """
    try:
        data = request.data
        model_id = data.get('model_id')

        if not model_id:
            return Response({
                'error': 'model_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse numerical data
        numerical_data = pd.DataFrame(data.get('numerical_data', []))
        target_col = data.get('target_col', 'value')

        # Get optional multimodal data
        text_data = data.get('text_data')
        image_paths = data.get('image_paths')
        audio_paths = data.get('audio_paths')
        video_paths = data.get('video_paths')

        # Create multimodal forecaster
        forecaster = MultimodalForecaster(
            base_model=data.get('base_model', 'tft'),
            fusion_method=data.get('fusion_method', 'attention'),
            text_encoder=data.get('text_encoder', 'bert'),
            image_encoder=data.get('image_encoder', 'resnet'),
            audio_encoder=data.get('audio_encoder', 'whisper')
        )

        # Train
        result = forecaster.fit(
            numerical_data=numerical_data,
            target_col=target_col,
            text_data=text_data,
            image_paths=image_paths,
            audio_paths=audio_paths,
            video_paths=video_paths
        )

        # Store model
        _multimodal_models[model_id] = forecaster

        return Response({
            'success': True,
            'model_id': model_id,
            'training_result': result,
            'trained_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Multimodal training error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def multimodal_predict(request):
    """
    Generate multimodal forecast

    POST /api/ml-pipeline/multimodal/predict/

    Body:
    {
        "model_id": "multimodal_v1",
        "numerical_data": [...],
        "horizon": 30,
        "text": "경제 뉴스: 경기 회복세",
        "image": "data:image/jpeg;base64,...",  // base64 encoded
        "audio": null,
        "video": null
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
        forecaster = _multimodal_models.get(model_id)
        if not forecaster:
            return Response({
                'error': f'Model {model_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Parse numerical data
        numerical_data = pd.DataFrame(data.get('numerical_data', []))

        # Process optional multimodal inputs
        text = data.get('text')
        image = data.get('image')
        audio = data.get('audio')
        video = data.get('video')

        # Handle base64 encoded images
        if image and isinstance(image, str) and image.startswith('data:image'):
            image = _save_base64_image(image)

        # Generate prediction
        horizon = data.get('horizon', 30)
        result = forecaster.predict(
            numerical_data=numerical_data,
            horizon=horizon,
            text=text,
            image=image,
            audio=audio,
            video=video
        )

        return Response({
            'success': True,
            'model_id': model_id,
            'forecast': result['forecast'],
            'horizon': result['horizon'],
            'modality_contributions': result['modality_contributions'],
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Multimodal prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def encode_text(request):
    """
    Encode text to embedding

    POST /api/ml-pipeline/multimodal/encode/text/

    Body:
    {
        "texts": ["text 1", "text 2", ...],
        "model_name": "bert-base-uncased"
    }
    """
    try:
        data = request.data
        texts = data.get('texts', [])

        if not texts:
            return Response({
                'error': 'texts is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        model_name = data.get('model_name', 'bert-base-uncased')

        # Get or create encoder
        encoder_key = f"text_{model_name}"
        if encoder_key not in _encoders:
            _encoders[encoder_key] = TextEncoder(model_name=model_name)

        encoder = _encoders[encoder_key]

        # Encode
        if len(texts) == 1:
            embeddings = encoder.encode(texts[0])
            embeddings = np.expand_dims(embeddings, 0)
        else:
            embeddings = encoder.encode_batch(texts)

        return Response({
            'success': True,
            'model_name': model_name,
            'embeddings': embeddings.tolist(),
            'embedding_dim': encoder.get_embedding_dim(),
            'num_texts': len(texts)
        })

    except Exception as e:
        logger.error(f"Text encoding error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def encode_image(request):
    """
    Encode image to embedding

    POST /api/ml-pipeline/multimodal/encode/image/

    Body (multipart/form-data):
    - image: Image file
    - model_name: resnet50 (optional)
    """
    try:
        image_file = request.FILES.get('image')
        model_name = request.data.get('model_name', 'resnet50')

        if not image_file:
            return Response({
                'error': 'image file is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            for chunk in image_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        try:
            # Get or create encoder
            encoder_key = f"image_{model_name}"
            if encoder_key not in _encoders:
                _encoders[encoder_key] = ImageEncoder(model_name=model_name)

            encoder = _encoders[encoder_key]

            # Encode
            embedding = encoder.encode(temp_path)

            return Response({
                'success': True,
                'model_name': model_name,
                'embedding': embedding.tolist(),
                'embedding_dim': encoder.get_embedding_dim()
            })

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Image encoding error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def encode_audio(request):
    """
    Encode audio to embedding

    POST /api/ml-pipeline/multimodal/encode/audio/

    Body (multipart/form-data):
    - audio: Audio file
    - model_name: whisper-base (optional)
    """
    try:
        audio_file = request.FILES.get('audio')
        model_name = request.data.get('model_name', 'whisper-base')

        if not audio_file:
            return Response({
                'error': 'audio file is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        try:
            # Get or create encoder
            encoder_key = f"audio_{model_name}"
            if encoder_key not in _encoders:
                _encoders[encoder_key] = AudioEncoder(model_name=model_name)

            encoder = _encoders[encoder_key]

            # Encode
            embedding = encoder.encode(temp_path)

            return Response({
                'success': True,
                'model_name': model_name,
                'embedding': embedding.tolist(),
                'embedding_dim': encoder.get_embedding_dim()
            })

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Audio encoding error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def encode_video(request):
    """
    Encode video to embedding

    POST /api/ml-pipeline/multimodal/encode/video/

    Body (multipart/form-data):
    - video: Video file
    - num_frames: 8 (optional)
    """
    try:
        video_file = request.FILES.get('video')
        num_frames = int(request.data.get('num_frames', 8))

        if not video_file:
            return Response({
                'error': 'video file is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            for chunk in video_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        try:
            # Get or create video encoder
            encoder_key = f"video_{num_frames}"
            if encoder_key not in _encoders:
                image_enc = ImageEncoder()
                _encoders[encoder_key] = VideoEncoder(
                    image_encoder=image_enc,
                    num_frames=num_frames
                )

            encoder = _encoders[encoder_key]

            # Encode
            embedding = encoder.encode(temp_path)

            return Response({
                'success': True,
                'embedding': embedding.tolist(),
                'embedding_dim': encoder.get_embedding_dim(),
                'num_frames': num_frames
            })

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Video encoding error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fusion_features(request):
    """
    Fuse multimodal features

    POST /api/ml-pipeline/multimodal/fusion/

    Body:
    {
        "features": {
            "numerical": [[...]],  // 2D array
            "text": [[...]],       // 2D array
            "image": [[...]]       // 2D array
        },
        "method": "attention",  // attention, concat, weighted
        "fusion_dim": 256
    }
    """
    try:
        data = request.data
        features = data.get('features', {})
        method = data.get('method', 'attention')
        fusion_dim = data.get('fusion_dim', 256)

        # Get input dimensions
        input_dims = {}
        for modality, feat in features.items():
            if isinstance(feat, list) and len(feat) > 0:
                input_dims[modality] = len(feat[0]) if isinstance(feat[0], list) else len(feat)

        if not input_dims:
            return Response({
                'error': 'No valid features provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create fusion model
        fusion = MultimodalFusion(
            input_dims=input_dims,
            fusion_dim=fusion_dim
        )

        # Convert to numpy arrays
        numpy_features = {}
        for modality, feat in features.items():
            numpy_features[modality] = np.array(feat)

        # Fuse
        fused = fusion.fuse(numpy_features, method=method)

        return Response({
            'success': True,
            'fusion_method': method,
            'fused_embedding': fused.tolist(),
            'fusion_dim': fused.shape[-1] if len(fused.shape) > 1 else len(fused),
            'input_modalities': list(features.keys()),
            'attention_weights': fusion.get_attention_weights()
        })

    except Exception as e:
        logger.error(f"Feature fusion error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def multimodal_info(request):
    """
    Get multimodal module information

    GET /api/ml-pipeline/multimodal/info/
    """
    available_libs = get_available_multimodal_libraries()
    encoder_info = get_encoder_info()

    supported_modalities = {
        'text': {
            'description': 'Text documents, news, reports',
            'supported_formats': ['txt', 'pdf', 'json'],
            'encoders': ['bert', 'roberta', 'distilbert'],
            'available': encoder_info['text']['available']
        },
        'image': {
            'description': 'Images, satellite photos, product images',
            'supported_formats': ['jpg', 'jpeg', 'png', 'bmp'],
            'encoders': ['resnet50', 'vit-base-patch16-224'],
            'available': encoder_info['image']['available']
        },
        'audio': {
            'description': 'Audio recordings, voice, calls',
            'supported_formats': ['wav', 'mp3', 'flac'],
            'encoders': ['whisper-base', 'wav2vec2-base'],
            'available': encoder_info['audio']['available']
        },
        'video': {
            'description': 'Video footage, production line',
            'supported_formats': ['mp4', 'avi', 'mov'],
            'encoders': ['frame-sampling'],
            'available': encoder_info['video']['available']
        }
    }

    fusion_methods = {
        'attention': {
            'description': 'Cross-modal attention fusion',
            'best_for': 'When modalities have complex interactions'
        },
        'concat': {
            'description': 'Simple concatenation',
            'best_for': 'Quick prototyping'
        },
        'weighted': {
            'description': 'Learned weighted combination',
            'best_for': 'When some modalities are more important'
        }
    }

    return Response({
        'success': True,
        'supported_modalities': supported_modalities,
        'fusion_methods': fusion_methods,
        'available_libraries': available_libs,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_models(request):
    """
    List all multimodal models

    GET /api/ml-pipeline/multimodal/models/
    """
    models = []

    for model_id, model in _multimodal_models.items():
        models.append({
            'model_id': model_id,
            'base_model': model.base_model,
            'fusion_method': model.fusion_method,
            'is_fitted': model.is_fitted,
            'encoders': {
                'text': model.text_encoder,
                'image': model.image_encoder,
                'audio': model.audio_encoder
            }
        })

    return Response({
        'success': True,
        'models': models,
        'total_count': len(models),
        'timestamp': datetime.now().isoformat()
    })


# Helper function
def _save_base64_image(base64_data: str) -> Optional[str]:
    """Save base64 encoded image to temp file"""
    try:
        # Extract base64 data
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]

        # Decode
        image_data = base64.b64decode(base64_data)

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_data)
            return temp_file.name

    except Exception as e:
        logger.error(f"Failed to save base64 image: {e}")
        return None
