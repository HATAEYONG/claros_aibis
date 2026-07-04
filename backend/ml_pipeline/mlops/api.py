# ML Pipeline MLOps - API
# MLOps API 엔드포인트

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

import logging

logger = logging.getLogger(__name__)

# MLOps 모듈
try:
    from ml_pipeline.mlops.model_registry import (
        ModelRegistry,
        ModelMetadata,
        ExperimentTracker
    )
    from ml_pipeline.mlops.ab_testing import (
        ABTestFramework,
        ABTestConfig,
        ABTestStatus
    )
    from ml_pipeline.mlops.model_monitor import (
        ModelMonitor,
        MonitorConfig,
        AlertSeverity,
        PrometheusExporter,
        DashboardMetrics
    )
    from ml_pipeline.mlops.ci_pipeline import (
        CIPipeline,
        StageConfig,
        StageType,
        PipelineStatus
    )
    MLOPS_AVAILABLE = True
except ImportError:
    MLOPS_AVAILABLE = False
    logger.warning("MLOps 모듈을 찾을 수 없음")


# 전역 인스턴스
_model_registry: 'ModelRegistry' = None
_ab_test_framework: 'ABTestFramework' = None
_model_monitor: 'ModelMonitor' = None
_ci_pipeline: 'CIPipeline' = None


def get_model_registry():
    """모델 레지스트리 인스턴스 반환"""
    global _model_registry
    if _model_registry is None:
        _model_registry = ModelRegistry(use_mlflow=True)
    return _model_registry


def get_ab_test_framework():
    """A/B 테스트 프레임워크 인스턴스 반환"""
    global _ab_test_framework
    if _ab_test_framework is None:
        _ab_test_framework = ABTestFramework()
    return _ab_test_framework


def get_model_monitor(model_name: str = 'default'):
    """모델 모니터 인스턴스 반환"""
    global _model_monitor
    if _model_monitor is None:
        config = MonitorConfig(model_name=model_name)
        _model_monitor = ModelMonitor(config)
    return _model_monitor


def get_ci_pipeline(pipeline_name: str = 'ml_pipeline'):
    """CI/CD 파이프라인 인스턴스 반환"""
    global _ci_pipeline
    if _ci_pipeline is None:
        _ci_pipeline = CIPipeline(pipeline_name)
    return _ci_pipeline


# ========== Model Registry API ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def registry_health_check(request):
    """모델 레지스트리 헬스 체크"""
    if not MLOPS_AVAILABLE:
        return Response({
            'status': 'unavailable',
            'error': 'MLOps 모듈을 찾을 수 없음'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        registry = get_model_registry()
        return Response({
            'status': 'healthy',
            'use_mlflow': registry.use_mlflow,
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_models(request):
    """모델 목록 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        registry = get_model_registry()
        model_name = request.query_params.get('model_name')
        stage = request.query_params.get('stage')

        models = registry.list_models(model_name=model_name, stage=stage)

        return Response({
            'status': 'success',
            'models': [m.to_dict() for m in models],
            'count': len(models)
        })
    except Exception as e:
        logger.error(f"모델 목록 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_model_detail(request, model_name: str):
    """모델 상세 정보 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        registry = get_model_registry()
        version = request.query_params.get('version')

        info = registry.get_model_info(model_name, version)

        return Response({
            'status': 'success',
            'info': info
        })
    except Exception as e:
        logger.error(f"모델 상세 정보 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transition_model_stage(request):
    """모델 스테이지 전환"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        registry = get_model_registry()
        model_name = request.data.get('model_name')
        version = request.data.get('version')
        new_stage = request.data.get('new_stage')

        if not all([model_name, version, new_stage]):
            return Response({
                'status': 'error',
                'error': '필수 파라미터 누락: model_name, version, new_stage'
            }, status=status.HTTP_400_BAD_REQUEST)

        success = registry.transition_model_stage(model_name, version, new_stage)

        return Response({
            'status': 'success' if success else 'error',
            'message': f'{model_name}:{version} → {new_stage}'
        })
    except Exception as e:
        logger.error(f"모델 스테이지 전환 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compare_models(request):
    """모델 버전 비교"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        registry = get_model_registry()
        model_name = request.query_params.get('model_name')
        version_a = request.query_params.get('version_a')
        version_b = request.query_params.get('version_b')

        if not all([model_name, version_a, version_b]):
            return Response({
                'status': 'error',
                'error': '필수 파라미터 누락: model_name, version_a, version_b'
            }, status=status.HTTP_400_BAD_REQUEST)

        comparison = registry.compare_models(model_name, version_a, version_b)

        return Response({
            'status': 'success',
            'comparison': comparison
        })
    except Exception as e:
        logger.error(f"모델 비교 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== A/B Testing API ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_ab_test(request):
    """A/B 테스트 생성"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        framework = get_ab_test_framework()

        config = ABTestConfig(
            test_name=request.data.get('test_name'),
            model_a=request.data.get('model_a'),
            model_b=request.data.get('model_b'),
            test_period_days=request.data.get('test_period_days', 30),
            traffic_split=request.data.get('traffic_split', 0.5),
            min_sample_size=request.data.get('min_sample_size', 1000),
            significance_level=request.data.get('significance_level', 0.05),
            metric=request.data.get('metric', 'mape'),
            description=request.data.get('description', '')
        )

        test_id = framework.create_test(config)

        return Response({
            'status': 'success',
            'test_id': test_id,
            'config': {
                'test_name': config.test_name,
                'model_a': config.model_a,
                'model_b': config.model_b,
                'traffic_split': config.traffic_split,
                'test_period_days': config.test_period_days
            }
        })
    except Exception as e:
        logger.error(f"A/B 테스트 생성 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_ab_test(request, test_id: str):
    """A/B 테스트 시작"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        framework = get_ab_test_framework()
        success = framework.start_test(test_id)

        return Response({
            'status': 'success' if success else 'error',
            'test_id': test_id
        })
    except Exception as e:
        logger.error(f"A/B 테스트 시작 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ab_test_result(request, test_id: str):
    """A/B 테스트 결과 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        framework = get_ab_test_framework()
        result = framework.get_test_result(test_id)

        if result is None:
            return Response({
                'status': 'error',
                'error': f'테스트 없음: {test_id}'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'status': 'success',
            'result': {
                'test_name': result.test_name,
                'status': result.status.value,
                'start_date': result.start_date,
                'end_date': result.end_date,
                'sample_size_a': result.sample_size_a,
                'sample_size_b': result.sample_size_b,
                'metric_a': result.metric_a,
                'metric_b': result.metric_b,
                'metric_diff': result.metric_diff,
                'relative_improvement': result.relative_improvement,
                'p_value': result.p_value,
                'is_significant': result.is_significant,
                'winner': result.winner,
                'confidence': result.confidence
            }
        })
    except Exception as e:
        logger.error(f"A/B 테스트 결과 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_ab_tests(request):
    """A/B 테스트 목록 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        framework = get_ab_test_framework()
        status_filter = request.query_params.get('status')

        status_enum = None
        if status_filter:
            try:
                status_enum = ABTestStatus(status_filter)
            except ValueError:
                pass

        tests = framework.list_tests(status=status_enum)

        return Response({
            'status': 'success',
            'tests': tests,
            'count': len(tests)
        })
    except Exception as e:
        logger.error(f"A/B 테스트 목록 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== Model Monitoring API ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_monitoring(request):
    """모델 모니터링 시작"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        monitor = get_model_monitor(model_name)
        monitor.start_monitoring()

        return Response({
            'status': 'success',
            'model_name': model_name
        })
    except Exception as e:
        logger.error(f"모니터링 시작 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_prediction(request):
    """예측 결과 기록"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.data.get('model_name', 'default')
        monitor = get_model_monitor(model_name)

        monitor.record_prediction(
            prediction=float(request.data.get('prediction')),
            actual=float(request.data.get('actual')) if 'actual' in request.data else None,
            latency_ms=float(request.data.get('latency_ms')) if 'latency_ms' in request.data else None
        )

        return Response({
            'status': 'success'
        })
    except Exception as e:
        logger.error(f"예측 기록 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_metrics_summary(request):
    """메트릭 요약 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.query_params.get('model_name', 'default')
        monitor = get_model_monitor(model_name)

        summary = monitor.get_metrics_summary()

        return Response({
            'status': 'success',
            'summary': summary
        })
    except Exception as e:
        logger.error(f"메트릭 요약 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alerts(request):
    """알림 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        model_name = request.query_params.get('model_name', 'default')
        monitor = get_model_monitor(model_name)

        severity = request.query_params.get('severity')
        severity_enum = None
        if severity:
            try:
                severity_enum = AlertSeverity(severity)
            except ValueError:
                pass

        limit = int(request.query_params.get('limit', 100))
        alerts = monitor.get_recent_alerts(severity=severity_enum, limit=limit)

        return Response({
            'status': 'success',
            'alerts': [
                {
                    'timestamp': a.timestamp,
                    'metric': a.metric.value,
                    'severity': a.severity.value,
                    'message': a.message,
                    'current_value': a.current_value,
                    'threshold': a.threshold
                }
                for a in alerts
            ],
            'count': len(alerts)
        })
    except Exception as e:
        logger.error(f"알림 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== CI/CD Pipeline API ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_pipeline(request):
    """CI/CD 파이프라인 트리거"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        pipeline_name = request.data.get('pipeline_name', 'ml_pipeline')
        pipeline = get_ci_pipeline(pipeline_name)

        parameters = request.data.get('parameters', {})
        run = pipeline.run_pipeline(parameters=parameters)

        return Response({
            'status': 'success',
            'run_id': run.run_id,
            'pipeline_name': pipeline_name,
            'status': run.status.value,
            'start_time': run.start_time
        })
    except Exception as e:
        logger.error(f"파이프라인 트리거 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pipeline_run(request, run_id: str):
    """파이프라인 실행 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        pipeline_name = request.query_params.get('pipeline_name', 'ml_pipeline')
        pipeline = get_ci_pipeline(pipeline_name)

        run = pipeline.get_run(run_id)

        if run is None:
            return Response({
                'status': 'error',
                'error': f'실행 없음: {run_id}'
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'status': 'success',
            'run': {
                'run_id': run.run_id,
                'pipeline_name': run.pipeline_name,
                'status': run.status.value,
                'start_time': run.start_time,
                'end_time': run.end_time,
                'stages': {
                    name: {
                        'status': result.status.value,
                        'start_time': result.start_time,
                        'end_time': result.end_time,
                        'duration_seconds': result.duration_seconds
                    }
                    for name, result in run.stages.items()
                }
            }
        })
    except Exception as e:
        logger.error(f"파이프라인 실행 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pipeline_runs(request):
    """파이프라인 실행 목록 조회"""
    if not MLOPS_AVAILABLE:
        return Response({'error': 'MLOps 모듈을 찾을 수 없음'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        pipeline_name = request.query_params.get('pipeline_name', 'ml_pipeline')
        pipeline = get_ci_pipeline(pipeline_name)

        status_filter = request.query_params.get('status')
        status_enum = None
        if status_filter:
            try:
                status_enum = PipelineStatus(status_filter)
            except ValueError:
                pass

        limit = int(request.query_params.get('limit', 100))
        runs = pipeline.list_runs(status=status_enum, limit=limit)

        return Response({
            'status': 'success',
            'runs': [
                {
                    'run_id': r.run_id,
                    'pipeline_name': r.pipeline_name,
                    'status': r.status.value,
                    'start_time': r.start_time,
                    'end_time': r.end_time
                }
                for r in runs
            ],
            'count': len(runs)
        })
    except Exception as e:
        logger.error(f"파이프라인 실행 목록 조회 오류: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
