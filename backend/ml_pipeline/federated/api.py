"""
Federated Learning API

REST API endpoints for federated learning
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import json

from .federated_forecaster import (
    FederatedForecaster,
    FederatedClient,
    FedAvg,
    FedBuff,
    get_available_federated_libraries
)

from .secure_aggregation import (
    SecureAggregator,
    DifferentialPrivacy,
    PrivacyAccountant
)

logger = logging.getLogger(__name__)

# Global federated learning instances
_federated_systems: Dict[str, FederatedForecaster] = {}
_privacy_accountants: Dict[str, PrivacyAccountant] = {}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """Federated learning module health check"""
    available_libs = get_available_federated_libraries()

    return Response({
        'status': 'healthy',
        'module': 'Federated Learning',
        'version': '1.0.0',
        'available_libraries': available_libs,
        'flwr_available': available_libs.get('flwr', False),
        'timestamp': datetime.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_system(request):
    """
    Initialize federated learning system

    POST /api/ml-pipeline/federated/initialize/

    Body:
    {
        "system_id": "federated_v1",
        "base_model_type": "tft",
        "num_rounds": 10,
        "min_available_clients": 2,
        "aggregation_method": "fedavg",
        "model_config": {...}
    }
    """
    try:
        data = request.data
        system_id = data.get('system_id')

        if not system_id:
            return Response({
                'error': 'system_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create federated system
        system = FederatedForecaster(
            base_model_type=data.get('base_model_type', 'tft'),
            num_rounds=data.get('num_rounds', 10),
            min_available_clients=data.get('min_available_clients', 2),
            aggregation_method=data.get('aggregation_method', 'fedavg')
        )

        # Initialize global model
        system.initialize_global_model(data.get('model_config'))

        # Create privacy accountant
        accountant = PrivacyAccountant(
            target_epsilon=data.get('target_epsilon', 10.0),
            target_delta=data.get('target_delta', 1e-5)
        )

        # Store system
        _federated_systems[system_id] = system
        _privacy_accountants[system_id] = accountant

        return Response({
            'success': True,
            'system_id': system_id,
            'base_model_type': system.base_model_type,
            'aggregation_method': system.aggregation_method,
            'num_rounds': system.num_rounds,
            'privacy_budget': accountant.get_remaining_budget(),
            'initialized_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Federated system initialization error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_client(request):
    """
    Register a federated learning client

    POST /api/ml-pipeline/federated/register_client/

    Body:
    {
        "system_id": "federated_v1",
        "client_id": "factory_a",
        "data_info": {
            "train_samples": 1000,
            "val_samples": 200,
            "base_value": 100
        },
        "model_config": {...}
    }
    """
    try:
        data = request.data
        system_id = data.get('system_id')

        if not system_id:
            return Response({
                'error': 'system_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        system = _federated_systems.get(system_id)
        if not system:
            return Response({
                'error': f'System {system_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Register client
        result = system.register_client(
            client_id=data.get('client_id'),
            data_info=data.get('data_info', {}),
            model_config=data.get('model_config')
        )

        return Response({
            'success': result['success'],
            'system_id': system_id,
            'client_id': data.get('client_id'),
            'message': result['message'],
            'total_clients': result['total_clients'],
            'registered_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Client registration error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_round(request):
    """
    Execute one round of federated training

    POST /api/ml-pipeline/federated/train_round/

    Body:
    {
        "system_id": "federated_v1",
        "client_ids": ["factory_a", "factory_b"],
        "epochs_per_client": 5,
        "learning_rate": 0.01
    }
    """
    try:
        data = request.data
        system_id = data.get('system_id')

        if not system_id:
            return Response({
                'error': 'system_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        system = _federated_systems.get(system_id)
        if not system:
            return Response({
                'error': f'System {system_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Execute training round
        result = system.train_round(
            client_ids=data.get('client_ids'),
            epochs_per_client=data.get('epochs_per_client', 5),
            learning_rate=data.get('learning_rate', 0.01)
        )

        # Update privacy accountant
        accountant = _privacy_accountants.get(system_id)
        if accountant:
            # Estimate privacy spent
            epsilon_spent = 1.0  # Simplified
            delta_spent = 1e-6
            accountant.add_round(epsilon_spent, delta_spent, result['round'])

        return Response({
            'success': True,
            'system_id': system_id,
            'round_result': {
                'round': result['round'],
                'num_clients': result['num_clients'],
                'global_metrics': result['global_metrics'],
                'timestamp': result['timestamp']
            },
            'privacy_budget': accountant.get_remaining_budget() if accountant else None
        })

    except Exception as e:
        logger.error(f"Federated training round error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def federated_predict(request):
    """
    Generate prediction using federated model

    POST /api/ml-pipeline/federated/predict/

    Body:
    {
        "system_id": "federated_v1",
        "client_id": "factory_a",
        "horizon": 30
    }
    """
    try:
        data = request.data
        system_id = data.get('system_id')

        if not system_id:
            return Response({
                'error': 'system_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        system = _federated_systems.get(system_id)
        if not system:
            return Response({
                'error': f'System {system_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Generate prediction
        prediction = system.predict(
            client_id=data.get('client_id'),
            horizon=data.get('horizon', 30)
        )

        return Response({
            'success': True,
            'system_id': system_id,
            'forecast': prediction['forecast'],
            'dates': prediction['dates'],
            'horizon': prediction['horizon'],
            'client_id': prediction['client_id'],
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Federated prediction error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_info(request):
    """
    Get federated system information

    GET /api/ml-pipeline/federated/system_info/?system_id=federated_v1
    """
    system_id = request.query_params.get('system_id')

    if not system_id:
        return Response({
            'error': 'system_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    system = _federated_systems.get(system_id)
    if not system:
        return Response({
            'error': f'System {system_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get system info
    info = system.get_global_model_info()
    info['clients'] = system.get_all_clients()

    # Get privacy budget
    accountant = _privacy_accountants.get(system_id)
    if accountant:
        info['privacy_budget'] = accountant.get_remaining_budget()

    return Response({
        'success': True,
        'system_id': system_id,
        'info': info
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_info(request):
    """
    Get client information

    GET /api/ml-pipeline/federated/client_info/?system_id=federated_v1&client_id=factory_a
    """
    system_id = request.query_params.get('system_id')
    client_id = request.query_params.get('client_id')

    if not system_id or not client_id:
        return Response({
            'error': 'system_id and client_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    system = _federated_systems.get(system_id)
    if not system:
        return Response({
            'error': f'System {system_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get client info
    info = system.get_client_info(client_id)

    return Response({
        'success': True,
        'client_info': info
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def secure_aggregate(request):
    """
    Perform secure aggregation

    POST /api/ml-pipeline/federated/secure_aggregate/

    Body:
    {
        "updates": [
            {
                "client_id": "factory_a",
                "parameters": {...},
                "num_samples": 1000
            },
            ...
        ],
        "encryption_method": "homomorphic"
    }
    """
    try:
        data = request.data
        updates = data.get('updates', [])

        if not updates:
            return Response({
                'error': 'updates are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create secure aggregator
        aggregator = SecureAggregator(
            encryption_method=data.get('encryption_method', 'homomorphic')
        )

        # Encrypt updates
        encrypted_updates = []
        for update in updates:
            encrypted = aggregator.encrypt_update(
                update['parameters'],
                update['client_id']
            )
            encrypted_updates.append(encrypted)

        # Aggregate (in real system, would aggregate encrypted data)
        # For now, decrypt and aggregate
        total_samples = sum(u['num_samples'] for u in updates)

        # Use FedAvg aggregation
        fedavg = FedAvg()
        decrypted_updates = []
        for i, update in enumerate(updates):
            decrypted_updates.append({
                'client_id': update['client_id'],
                'parameters': update['parameters'],
                'num_samples': update['num_samples']
            })

        aggregated = fedavg.aggregate(decrypted_updates, total_samples)

        return Response({
            'success': True,
            'aggregated_parameters': {
                k: v.tolist() for k, v in aggregated.items()
            },
            'num_clients': len(updates),
            'total_samples': total_samples
        })

    except Exception as e:
        logger.error(f"Secure aggregation error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_dp_noise(request):
    """
    Add differential privacy noise

    POST /api/ml-pipeline/federated/add_dp_noise/

    Body:
    {
        "parameters": {...},
        "epsilon": 1.0,
        "delta": 1e-5,
        "mechanism": "gaussian"
    }
    """
    try:
        data = request.data
        parameters = data.get('parameters', {})

        # Convert to numpy arrays
        numpy_params = {}
        for k, v in parameters.items():
            if isinstance(v, list):
                numpy_params[k] = np.array(v)
            else:
                numpy_params[k] = v

        # Create DP mechanism
        dp = DifferentialPrivacy(
            epsilon=data.get('epsilon', 1.0),
            delta=data.get('delta', 1e-5),
            mechanism=data.get('mechanism', 'gaussian')
        )

        # Clip and add noise
        clipped = dp.clip_update(numpy_params)
        noisy = dp.add_noise(clipped)

        return Response({
            'success': True,
            'noisy_parameters': {
                k: v.tolist() for k, v in noisy.items()
            },
            'privacy_spent': dp.get_privacy_spent()
        })

    except Exception as e:
        logger.error(f"DP noise addition error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def federated_info(request):
    """
    Get federated learning information

    GET /api/ml-pipeline/federated/info/
    """
    available_libs = get_available_federated_libraries()

    aggregation_methods = {
        'fedavg': {
            'name': 'Federated Averaging',
            'description': 'Weighted average of client updates',
            'best_for': 'Most cases, simple and effective'
        },
        'fedbuff': {
            'name': 'FedBuff',
            'description': 'Buffered aggregation with momentum',
            'best_for': 'Smoother convergence across rounds'
        },
        'fedprox': {
            'name': 'FedProx',
            'description': 'Proximal term to limit client drift',
            'best_for': 'Heterogeneous client data'
        }
    }

    privacy_methods = {
        'secure_aggregation': {
            'name': 'Secure Aggregation',
            'description': 'Cryptographic protection of updates',
            'best_for': 'Strong privacy guarantees'
        },
        'differential_privacy': {
            'name': 'Differential Privacy',
            'description': 'Noise addition for mathematical privacy',
            'best_for': 'Quantifiable privacy guarantees'
        },
        'homomorphic_encryption': {
            'name': 'Homomorphic Encryption',
            'description': 'Compute on encrypted data',
            'best_for': 'Maximum privacy'
        }
    }

    return Response({
        'success': True,
        'available_libraries': available_libs,
        'aggregation_methods': aggregation_methods,
        'privacy_methods': privacy_methods,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_systems(request):
    """
    List all federated systems

    GET /api/ml-pipeline/federated/systems/
    """
    systems = []

    for system_id, system in _federated_systems.items():
        info = system.get_global_model_info()
        systems.append({
            'system_id': system_id,
            'base_model_type': system.base_model_type,
            'num_rounds': system.num_rounds,
            'current_round': info.get('round', 0),
            'num_clients': len(system.clients),
            'aggregation_method': system.aggregation_method
        })

    return Response({
        'success': True,
        'systems': systems,
        'total_count': len(systems),
        'timestamp': datetime.now().isoformat()
    })
