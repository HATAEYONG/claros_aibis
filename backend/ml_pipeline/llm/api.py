"""
LLM Forecasting API

REST API endpoints for LLM-based forecasting
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

from .llm_forecaster import (
    LLMForecaster,
    TimeGPTForecaster,
    PromptEngineer,
    MultimodalLLMForecaster
)

logger = logging.getLogger(__name__)


# Global LLM forecaster instances
_llm_forecasters: Dict[str, LLMForecaster] = {}


def get_llm_forecaster(model_type: str = 'timegpt') -> LLMForecaster:
    """Get or create LLM forecaster instance"""
    if model_type not in _llm_forecasters:
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        _llm_forecasters[model_type] = LLMForecaster(
            model_type=model_type,
            api_key=api_key
        )
    return _llm_forecasters[model_type]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """LLM module health check"""
    available_models = ['timegpt', 'chronos', 'gpt-4t', 'local']

    return Response({
        'status': 'healthy',
        'module': 'LLM Forecasting',
        'version': '1.0.0',
        'available_models': available_models,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_predict(request):
    """
    Generate LLM-based forecast

    POST /api/ml-pipeline/llm/predict/

    Body:
    {
        "model_type": "timegpt",  // timegpt, chronos, gpt-4t, local
        "historical_data": [
            {"date": "2024-01-01", "value": 100},
            ...
        ],
        "horizon": 30,
        "target_col": "value",
        "external_context": "경기 회복세 예상",  // optional
        "use_api": true  // false for simulation mode
    }
    """
    try:
        data = request.data
        model_type = data.get('model_type', 'timegpt')
        horizon = int(data.get('horizon', 30))
        target_col = data.get('target_col', 'value')
        external_context = data.get('external_context')
        use_api = data.get('use_api', True)

        # Parse historical data
        historical_data = data.get('historical_data', [])
        if not historical_data:
            return Response({
                'error': 'historical_data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Get forecaster
        forecaster = get_llm_forecaster(model_type)

        # Generate prediction
        result = forecaster.predict(
            context_data=df,
            horizon=horizon,
            target_col=target_col,
            use_api=use_api,
            external_context=external_context
        )

        return Response({
            'success': True,
            'model_type': model_type,
            'prediction': result['prediction'],
            'explanation': result.get('explanation'),
            'confidence': result.get('confidence'),
            'reasoning': result.get('reasoning'),
            'prompt_used': result.get('prompt'),
            'horizon': horizon,
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"LLM prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_predict_batch(request):
    """
    Generate LLM-based batch forecasts for multiple series

    POST /api/ml-pipeline/llm/predict_batch/

    Body:
    {
        "model_type": "timegpt",
        "series": [
            {
                "series_id": "product_1",
                "historical_data": [...],
                "horizon": 30
            },
            ...
        ]
    }
    """
    try:
        data = request.data
        model_type = data.get('model_type', 'timegpt')
        series_list = data.get('series', [])

        if not series_list:
            return Response({
                'error': 'series list is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        forecaster = get_llm_forecaster(model_type)
        results = []

        for series_config in series_list:
            series_id = series_config.get('series_id')
            historical_data = series_config.get('historical_data')
            horizon = series_config.get('horizon', 30)
            external_context = series_config.get('external_context')

            try:
                df = pd.DataFrame(historical_data)
                df['date'] = pd.to_datetime(df['date'])
                df = df.sort_values('date')

                result = forecaster.predict(
                    context_data=df,
                    horizon=horizon,
                    use_api=series_config.get('use_api', True),
                    external_context=external_context
                )

                results.append({
                    'series_id': series_id,
                    'success': True,
                    'prediction': result['prediction'],
                    'explanation': result.get('explanation'),
                    'confidence': result.get('confidence')
                })

            except Exception as e:
                logger.error(f"Error predicting series {series_id}: {str(e)}")
                results.append({
                    'series_id': series_id,
                    'success': False,
                    'error': str(e)
                })

        return Response({
            'success': True,
            'model_type': model_type,
            'results': results,
            'total_series': len(series_list),
            'successful': sum(1 for r in results if r['success']),
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"LLM batch prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_compare_models(request):
    """
    Compare multiple LLM models for forecasting

    POST /api/ml-pipeline/llm/compare/

    Body:
    {
        "models": ["timegpt", "chronos", "gpt-4t"],
        "historical_data": [...],
        "horizon": 30,
        "test_period": 30  // days for backtesting
    }
    """
    try:
        data = request.data
        models = data.get('models', ['timegpt', 'chronos'])
        horizon = data.get('horizon', 30)
        test_period = data.get('test_period', 30)

        historical_data = data.get('historical_data', [])
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Split data for backtesting
        train_df = df.iloc[:-test_period]
        test_df = df.iloc[-test_period:]

        comparisons = []

        for model_type in models:
            try:
                forecaster = get_llm_forecaster(model_type)

                # Generate prediction
                result = forecaster.predict(
                    context_data=train_df,
                    horizon=test_period,
                    use_api=data.get('use_api', True)
                )

                # Calculate metrics
                predictions = result['prediction'].get('forecast', [])
                actuals = test_df['value'].values

                if len(predictions) == len(actuals):
                    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
                    mae = np.mean(np.abs(actuals - predictions))
                    rmse = np.sqrt(np.mean((actuals - predictions) ** 2))
                else:
                    mape = mae = rmse = None

                comparisons.append({
                    'model_type': model_type,
                    'mape': mape,
                    'mae': mae,
                    'rmse': rmse,
                    'explanation': result.get('explanation'),
                    'confidence': result.get('confidence')
                })

            except Exception as e:
                logger.error(f"Error comparing model {model_type}: {str(e)}")
                comparisons.append({
                    'model_type': model_type,
                    'error': str(e)
                })

        # Rank by MAPE
        valid_comparisons = [c for c in comparisons if c.get('mape') is not None]
        valid_comparisons.sort(key=lambda x: x['mape'])

        return Response({
            'success': True,
            'horizon': horizon,
            'test_period': test_period,
            'comparisons': comparisons,
            'best_model': valid_comparisons[0]['model_type'] if valid_comparisons else None,
            'rankings': [
                {'model': c['model_type'], 'mape': c['mape']}
                for c in valid_comparisons
            ],
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"LLM model comparison error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_multimodal_predict(request):
    """
    Generate multimodal LLM forecast (numerical + text + image + audio)

    POST /api/ml-pipeline/llm/multimodal_predict/

    Body:
    {
        "numerical_data": [...],
        "text_context": "경제 뉴스...",
        "image_url": "...",  // optional
        "audio_url": "...",  // optional
        "horizon": 30
    }
    """
    try:
        data = request.data
        numerical_data = data.get('numerical_data', [])
        text_context = data.get('text_context')
        image_url = data.get('image_url')
        audio_url = data.get('audio_url')
        horizon = data.get('horizon', 30)

        if not numerical_data:
            return Response({
                'error': 'numerical_data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        df = pd.DataFrame(numerical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Create multimodal forecaster
        forecaster = MultimodalLLMForecaster(model_type='gpt-4t')

        result = forecaster.predict(
            numerical_data=df['value'].values,
            text=text_context,
            image=image_url,
            audio=audio_url,
            horizon=horizon
        )

        return Response({
            'success': True,
            'prediction': result['prediction'],
            'modality_contributions': result.get('modality_contributions'),
            'explanation': result.get('explanation'),
            'confidence': result.get('confidence'),
            'horizon': horizon,
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Multimodal prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_generate_prompt(request):
    """
    Generate optimized prompt for time series forecasting

    POST /api/ml-pipeline/llm/generate_prompt/

    Body:
    {
        "domain": "manufacturing",
        "historical_data": [...],
        "horizon": 30,
        "include_explanations": true,
        "custom_instructions": "주말 데이터는 제외"
    }
    """
    try:
        data = request.data
        domain = data.get('domain', 'general')
        horizon = data.get('horizon', 30)
        include_explanations = data.get('include_explanations', True)
        custom_instructions = data.get('custom_instructions')

        historical_data = data.get('historical_data', [])
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Create prompt engineer
        engineer = PromptEngineer(domain=domain)

        # Generate prompt
        prompt = engineer.generate_forecast_prompt(
            context_data=df,
            horizon=horizon,
            include_explanations=include_explanations,
            custom_instructions=custom_instructions
        )

        # Get domain-specific system prompt
        system_prompt = engineer.get_system_prompt()

        return Response({
            'success': True,
            'domain': domain,
            'system_prompt': system_prompt,
            'user_prompt': prompt,
            'prompt_length': len(prompt),
            'token_estimate': len(prompt.split()) * 1.3,  # Rough estimate
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Prompt generation error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def llm_model_info(request):
    """
    Get information about available LLM models

    GET /api/ml-pipeline/llm/models/info/
    """
    model_info = {
        'timegpt': {
            'name': 'TimeGPT',
            'provider': 'Nixtla',
            'description': 'Foundation model for time series forecasting',
            'api_required': True,
            'api_url': 'https://dashboard.nixtla.io/',
            'strengths': [
                'Specialized for time series',
                'Few-shot learning',
                'Automatic uncertainty quantification'
            ],
            'limitations': [
                'Requires API key',
                'Rate limited',
                'Cost per prediction'
            ]
        },
        'chronos': {
            'name': 'Chronos',
            'provider': 'Amazon',
            'description': 'Pre-trained time series models',
            'api_required': False,
            'strengths': [
                'Open source',
                'No API costs',
                'Can run locally'
            ],
            'limitations': [
                'Requires GPU for best performance',
                'Limited model sizes'
            ]
        },
        'gpt-4t': {
            'name': 'GPT-4 Turbo',
            'provider': 'OpenAI',
            'description': 'Multi-modal large language model',
            'api_required': True,
            'api_url': 'https://platform.openai.com/',
            'strengths': [
                'Multi-modal (text + image)',
                'Excellent reasoning',
                'Wide context window'
            ],
            'limitations': [
                'Expensive',
                'Rate limited',
                'Not specialized for time series'
            ]
        },
        'local': {
            'name': 'Local LLM',
            'provider': 'Various',
            'description': 'Run LLM locally (Llama, Mistral, etc.)',
            'api_required': False,
            'strengths': [
                'No API costs',
                'Privacy-preserving',
                'Customizable'
            ],
            'limitations': [
                'Requires powerful hardware',
                'Manual setup required',
                'Performance varies by model'
            ]
        }
    }

    return Response({
        'success': True,
        'models': model_info,
        'default_model': 'timegpt',
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def llm_fine_tune(request):
    """
    Submit fine-tuning request for LLM model

    POST /api/ml-pipeline/llm/fine_tune/

    Body:
    {
        "model_type": "timegpt",
        "training_data": [...],
        "epochs": 10,
        "hyperparameters": {...}
    }
    """
    # This is a placeholder for future implementation
    return Response({
        'success': False,
        'message': 'Fine-tuning not yet implemented',
        'status': 'planned'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)
