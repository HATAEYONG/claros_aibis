# ML Pipeline XAI - API
# 설명 가능 AI API 엔드포인트

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from typing import Dict

import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

# XAI 모듈
try:
    from ml_pipeline.xai.shap_explainer import (
        SHAPExplainer,
        PermutationImportance
    )
    from ml_pipeline.xai.attention_visualizer import (
        AttentionVisualizer,
        VariableSelectionVisualizer
    )
    from ml_pipeline.xai.xai_report import (
        XAIReportGenerator,
        XAISummary
    )
    XAI_AVAILABLE = True
except ImportError:
    XAI_AVAILABLE = False
    logger.warning("XAI 모듈을 찾을 수 없음")


# 전역 인스턴스
_shap_explainers: Dict[str, SHAPExplainer] = {}
_attention_visualizers: Dict[str, AttentionVisualizer] = {}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def xai_health_check(request):
    """XAI 서비스 헬스 체크"""
    return Response({
        'status': 'healthy',
        'service': 'XAI Service',
        'shap_available': XAI_AVAILABLE,
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def explain_prediction(request):
    """
    단일 예측 설명 (SHAP)

    Request:
        model_name: 모델 이름
        instance: 설명할 인스턴스 데이터
        plot_type: 플롯 유형
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        instance = request.data.get('instance')
        plot_type = request.data.get('plot_type', 'waterfall')

        # Explainer 가져오기 또는 생성
        if model_name not in _shap_explainers:
            # 시뮬레이션: 더미 모델 생성
            from sklearn.ensemble import RandomForestRegressor
            dummy_model = RandomForestRegressor(n_estimators=10)
            # 더미 학습
            dummy_X = np.random.rand(100, len(instance))
            dummy_y = np.random.rand(100)
            dummy_model.fit(dummy_X, dummy_y)

            _shap_explainers[model_name] = SHAPExplainer(
                model=dummy_model,
                model_type='tree',
                feature_names=request.data.get('feature_names')
            )

        explainer = _shap_explainers[model_name]

        # 예측 설명
        explanation = explainer.explain_prediction(
            instance=np.array(instance),
            plot_type=plot_type
        )

        return Response({
            'status': 'success',
            'explanation': explanation
        })

    except Exception as e:
        logger.error(f"예측 설명 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def explain_batch(request):
    """
    배치 예측 설명 (전역 변수 중요도)

    Request:
        model_name: 모델 이름
        instances: 설명할 인스턴스들
        max_samples: 최대 샘플 수
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        instances = request.data.get('instances', [])
        max_samples = request.data.get('max_samples', 100)

        if model_name not in _shap_explainers:
            return Response({
                'error': f'모델 없음: {model_name}'
            }, status=status.HTTP_404_NOT_FOUND)

        explainer = _shap_explainers[model_name]

        # 배치 설명
        explanation = explainer.explain_batch(
            instances=np.array(instances),
            max_samples=max_samples
        )

        return Response({
            'status': 'success',
            'explanation': explanation
        })

    except Exception as e:
        logger.error(f"배치 설명 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_global_importance(request):
    """
    전역 변수 중요도 조회

    Query Params:
        model_name: 모델 이름
        plot_type: 플롯 유형
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.query_params.get('model_name', 'default')
        plot_type = request.query_params.get('plot_type', 'bar')

        if model_name not in _shap_explainers:
            return Response({
                'error': f'모델 없음: {model_name}'
            }, status=status.HTTP_404_NOT_FOUND)

        # 전역 중요도는 별도로 계산해야 함
        # 여기서는 시뮬레이션
        importance = {
            'feature_importance': [
                {'feature': f'feature_{i}', 'importance': np.random.rand()}
                for i in range(20)
            ]
        }

        return Response({
            'status': 'success',
            'importance': importance
        })

    except Exception as e:
        logger.error(f"전역 중요도 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compute_permutation_importance(request):
    """
    순열 중요도 계산

    Request:
        model_name: 모델 이름
        X: 입력 데이터
        y: 타겟 데이터
        n_repeats: 반복 횟수
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        X = np.array(request.data.get('X', []))
        y = np.array(request.data.get('y', []))
        n_repeats = request.data.get('n_repeats', 10)

        # 더피 모델 생성
        from sklearn.ensemble import RandomForestRegressor
        dummy_model = RandomForestRegressor(n_estimators=10)
        dummy_model.fit(X, y)

        # 순열 중요도 계산
        perm_importance = PermutationImportance(dummy_model)
        result = perm_importance.compute(X, y, n_repeats=n_repeats)

        return Response({
            'status': 'success',
            'importance': result
        })

    except Exception as e:
        logger.error(f"순열 중요도 계산 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def visualize_attention(request):
    """
    Attention 가중치 시각화

    Request:
        model_name: 모델 이름
        sample_idx: 샘플 인덱스
        head_idx: Attention 헤드 인덱스
        interactive: 인터랙티브 플롯 여부
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')

        if model_name not in _attention_visualizers:
            # Visualizer 생성
            _attention_visualizers[model_name] = AttentionVisualizer(
                attention_heads=4,
                context_length=90
            )

        visualizer = _attention_visualizers[model_name]

        # Attention 가중치 추출
        input_data = np.array(request.data.get('input_data', [[]]))
        visualizer.extract_attention_weights(input_data)

        sample_idx = request.data.get('sample_idx', 0)
        head_idx = request.data.get('head_idx', 0)

        # 시각화 경로
        import tempfile
        import os
        temp_dir = tempfile.gettempdir()
        save_path = os.path.join(temp_dir, f'attention_{model_name}_{sample_idx}.png')

        visualizer.plot_attention_heatmap(
            sample_idx=sample_idx,
            head_idx=head_idx,
            save_path=save_path
        )

        return Response({
            'status': 'success',
            'plot_path': save_path
        })

    except Exception as e:
        logger.error(f"Attention 시각화 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_xai_report(request):
    """
    XAI 리포트 생성

    Request:
        model_name: 모델 이름
        model_type: 모델 유형
        report_format: 리포트 형식 (html, markdown, json)
        include_visualizations: 시각화 포함 여부
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        model_type = request.data.get('model_type', 'ensemble')
        report_format = request.data.get('report_format', 'html')

        # 리포트 생성기 초기화
        generator = XAIReportGenerator(
            model_name=model_name,
            model_type=model_type
        )

        # 모델 요약 추가
        generator.add_model_summary(
            training_period=request.data.get('training_period', '2025-01-01 ~ 2025-12-31'),
            metrics=request.data.get('metrics', {
                'mape': 4.2,
                'mae': 85.3,
                'rmse': 120.5
            }),
            hyperparameters=request.data.get('hyperparameters', {})
        )

        # 변수 중요도 추가
        generator.add_feature_importance(
            importance=request.data.get('feature_importance', []),
            global_importance=request.data.get('global_importance', {})
        )

        # 예측 설명 추가
        predictions = request.data.get('predictions', [])
        for pred in predictions[:3]:
            generator.add_prediction_explanation(
                instance_id=pred.get('instance_id', ''),
                prediction=pred.get('prediction', 0),
                actual=pred.get('actual'),
                explanation=pred.get('explanation', {}),
                shap_values=pred.get('shap_values', [])
            )

        # 인사이트 추가
        generator.add_insights(
            insights=request.data.get('insights', [
                f'{model_name} 모델은 전반적으로 우수한 성능을 보입니다.',
                '계절성 피처가 예측에 큰 영향을 미칩니다.'
            ]),
            recommendations=request.data.get('recommendations', [
                '모델 재학습 주기를 1주일로 단축하여 권장',
                '이상치 탐지 기능 강화 권장'
            ])
        )

        # 리포트 생성
        import tempfile
        import os
        temp_dir = tempfile.gettempdir()
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        output_path = os.path.join(temp_dir, f'xai_report_{model_name}_{timestamp}.{report_format}')

        if report_format == 'html':
            generator.generate_html_report(output_path)
        elif report_format == 'markdown':
            generator.generate_markdown_report(output_path)
        else:
            generator.generate_json_report(output_path)

        return Response({
            'status': 'success',
            'report_path': output_path,
            'format': report_format
        })

    except Exception as e:
        logger.error(f"XAI 리포트 생성 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_variable_importance(request):
    """
    Variable Selection 중요도 조회

    Query Params:
        model_name: 모델 이름
        top_k: 상위 k개 변수
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.query_params.get('model_name', 'default')
        top_k = int(request.query_params.get('top_k', 10))

        # 시뮬레이션: 더미 중요도
        variable_names = [
            'lag_7d', 'moving_avg_7d', 'day_of_week', 'month',
            'is_weekend', 'holiday_flag', 'price_index', 'promotion',
            'inventory_level', 'sales_lag1', 'production_rate', 'quality_rate'
        ]

        # 랜덤 중요도
        import random
        weights = np.random.rand(len(variable_names))
        weights = weights / weights.sum()  # 정규화

        # 정렬
        sorted_idx = np.argsort(weights)[::-1]

        top_variables = [
            {
                'rank': i + 1,
                'variable': variable_names[idx],
                'weight': float(weights[idx])
            }
            for i, idx in enumerate(sorted_idx[:top_k])
        ]

        return Response({
            'status': 'success',
            'model_name': model_name,
            'top_variables': top_variables
        })

    except Exception as e:
        logger.error(f"변수 중요도 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_predictions(request):
    """
    두 예측의 SHAP 설명 비교

    Request:
        model_name: 모델 이름
        instance_a: 첫 번째 인스턴스
        instance_b: 두 번째 인스턴스
    """
    if not XAI_AVAILABLE:
        return Response({
            'error': 'XAI 서비스를 사용할 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        instance_a = request.data.get('instance_a', [])
        instance_b = request.data.get('instance_b', [])

        if model_name not in _shap_explainers:
            return Response({
                'error': f'모델 없음: {model_name}'
            }, status=status.HTTP_404_NOT_FOUND)

        explainer = _shap_explainers[model_name]

        # 비교
        comparison = explainer.compare_instances(
            instance_a=np.array(instance_a),
            instance_b=np.array(instance_b)
        )

        return Response({
            'status': 'success',
            'comparison': comparison
        })

    except Exception as e:
        logger.error(f"예측 비교 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
