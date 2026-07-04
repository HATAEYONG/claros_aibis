"""
Integrated AI API

REST API endpoints for complete AI system integration
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging
from datetime import datetime

from .orchestrator import (
    AIOrchestrator,
    ModelRouter,
    AutoPipeline,
    PredictionPipeline,
    PredictionMode,
    create_orchestrator
)
from .meta_learning import (
    MetaLearner,
    ModelZoo,
    TransferLearning,
    FewShotLearning
)
from .deployment import (
    ModelDeployer,
    CanaryDeployer,
    BlueGreenDeployer,
    RollbackManager,
    DeploymentStrategy
)
from .observability import (
    SystemMonitor,
    AlertManager,
    DashboardGenerator,
    TelemetryCollector
)
from .governance import (
    AIGovernance,
    ModelAuditor,
    ComplianceChecker,
    EthicsMonitor,
    ComplianceStandard
)

logger = logging.getLogger(__name__)


# Global instances
_orchestrator = None
_meta_learner = None
_model_zoo = None
_deployer = None
_rollback_manager = None
_system_monitor = None
_alert_manager = None
_governance = None
_ethics_monitor = None


def get_orchestrator():
    """Get or create global orchestrator"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = create_orchestrator()
    return _orchestrator


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'module': 'integrated_ai',
        'timestamp': datetime.now().isoformat(),
        'components': {
            'orchestrator': _orchestrator is not None,
            'meta_learner': _meta_learner is not None,
            'deployment': _deployer is not None,
            'monitoring': _system_monitor is not None,
            'governance': _governance is not None
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def orchestrate_prediction(request):
    """
    Orchestrate prediction using AI system

    Body:
    {
        "data": {...},
        "mode": "production",
        "target_col": "value",
        "horizon": 30,
        "model_id": null,
        "ensemble": true
    }
    """
    try:
        body = json.loads(request.body)

        data = body.get('data', {})
        mode = body.get('mode', 'production')
        target_col = body.get('target_col', 'value')
        horizon = body.get('horizon', 30)
        model_id = body.get('model_id')
        ensemble = body.get('ensemble', True)

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(data)

        # Get orchestrator
        orchestrator = get_orchestrator()

        # Generate prediction
        result = orchestrator.predict(
            data=df,
            mode=PredictionMode[mode.upper()],
            target_col=target_col,
            horizon=horizon,
            model_id=model_id,
            ensemble=ensemble
        )

        return JsonResponse({
            'success': True,
            'result': result
        })

    except Exception as e:
        logger.error(f"Prediction orchestration failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def auto_optimize(request):
    """
    Auto-optimize AI system

    Body:
    {
        "training_data": {...},
        "validation_data": {...},
        "target_col": "value",
        "max_iterations": 10
    }
    """
    try:
        body = json.loads(request.body)

        training_data = body.get('training_data', {})
        validation_data = body.get('validation_data', {})
        target_col = body.get('target_col', 'value')
        max_iterations = body.get('max_iterations', 10)

        # Convert to DataFrames
        import pandas as pd
        train_df = pd.DataFrame(training_data)
        val_df = pd.DataFrame(validation_data)

        # Get orchestrator
        orchestrator = get_orchestrator()

        # Optimize
        result = orchestrator.auto_optimize(
            train_df,
            val_df,
            target_col,
            max_iterations
        )

        return JsonResponse({
            'success': True,
            'optimization_result': result
        })

    except Exception as e:
        logger.error(f"Auto-optimization failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_system_status(request):
    """Get AI system status"""
    orchestrator = get_orchestrator()
    status = orchestrator.get_system_status()

    return JsonResponse({
        'success': True,
        'system_status': status
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_recommendations(request):
    """Get system recommendations"""
    try:
        # Get data parameter
        data_str = request.GET.get('data', '{}')

        # Convert to DataFrame
        import pandas as pd
        df = pd.DataFrame(json.loads(data_str)) if data_str else pd.DataFrame()

        # Get orchestrator
        orchestrator = get_orchestrator()

        # Get recommendations
        recommendations = orchestrator.get_recommendations(df)

        return JsonResponse({
            'success': True,
            'recommendations': recommendations
        })

    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def meta_train(request):
    """
    Train meta-learner

    Body:
    {
        "tasks": [...],
        "num_iterations": 100
    }
    """
    try:
        body = json.loads(request.body)

        tasks = body.get('tasks', [])
        num_iterations = body.get('num_iterations', 100)

        # Get or create meta learner
        global _meta_learner
        if _meta_learner is None:
            _meta_learner = MetaLearner()

        # Meta train
        result = _meta_learner.meta_train(tasks, num_iterations)

        return JsonResponse({
            'success': True,
            'meta_training_result': result
        })

    except Exception as e:
        logger.error(f"Meta-training failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def few_shot_adapt(request):
    """
    Adapt to new task with few examples

    Body:
    {
        "support_data": {...},
        "support_labels": [...],
        "query_data": {...}
    }
    """
    try:
        body = json.loads(request.body)

        support_data = body.get('support_data', {})
        support_labels = body.get('support_labels', [])
        query_data = body.get('query_data', {})

        # Convert to DataFrames
        import pandas as pd
        support_df = pd.DataFrame(support_data)
        support_labels_array = np.array(support_labels)
        query_df = pd.DataFrame(query_data)

        # Get or create few-shot learner
        global _meta_learner
        if _meta_learner is None:
            _meta_learner = MetaLearner()

        # Train episode
        result = _meta_learner.adapt_to_task(support_df, num_steps=5)

        return JsonResponse({
            'success': True,
            'adaptation_result': result
        })

    except Exception as e:
        logger.error(f"Few-shot adaptation failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def list_models(request):
    """List models in model zoo"""
    try:
        # Get query parameters
        task_type = request.GET.get('task_type')
        domain = request.GET.get('domain')
        min_accuracy = float(request.GET.get('min_accuracy', 0.0))

        # Get or create model zoo
        global _model_zoo
        if _model_zoo is None:
            _model_zoo = ModelZoo()

        # List models
        models = _model_zoo.list_models(task_type, domain, min_accuracy)

        return JsonResponse({
            'success': True,
            'models': models
        })

    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def deploy_model(request):
    """
    Deploy model to production

    Body:
    {
        "model_id": "tft_v1",
        "model_version": "1.0.0",
        "environment": "production",
        "strategy": "blue_green",
        "config": {}
    }
    """
    try:
        body = json.loads(request.body)

        model_id = body.get('model_id')
        model_version = body.get('model_version')
        environment = body.get('environment', 'production')
        strategy_str = body.get('strategy', 'blue_green')
        config = body.get('config', {})

        # Get deployer
        global _deployer
        if _deployer is None:
            strategy = DeploymentStrategy[strategy_str.upper()]
            _deployer = ModelDeployer(deployment_strategy=strategy)
        else:
            strategy = DeploymentStrategy[strategy_str.upper()]

        # Deploy
        result = _deployer.deploy(
            model_id,
            model_version,
            environment,
            strategy,
            config
        )

        return JsonResponse({
            'success': True,
            'deployment_result': result
        })

    except Exception as e:
        logger.error(f"Model deployment failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def rollback_deployment(request):
    """
    Rollback deployment

    Body:
    {
        "deployment_id": "deployment_123",
        "reason": "High error rate"
    }
    """
    try:
        body = json.loads(request.body)

        deployment_id = body.get('deployment_id')
        reason = body.get('reason', 'Manual rollback')

        # Get deployer
        global _deployer
        if _deployer is None:
            return JsonResponse({
                'success': False,
                'error': 'No active deployment'
            }, status=400)

        # Rollback
        result = _deployer.rollback(deployment_id)

        # Get rollback manager
        global _rollback_manager
        if _rollback_manager is None:
            _rollback_manager = RollbackManager()

        _rollback_manager.execute_rollback(deployment_id, reason, automatic=False)

        return JsonResponse({
            'success': True,
            'rollback_result': result
        })

    except Exception as e:
        logger.error(f"Rollback failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def record_metric(request):
    """
    Record system metric

    Body:
    {
        "metric_name": "prediction_latency",
        "value": 150.5,
        "labels": {"model": "tft"}
    }
    """
    try:
        body = json.loads(request.body)

        metric_name = body.get('metric_name')
        value = body.get('value')
        labels = body.get('labels', {})

        # Get system monitor
        global _system_monitor
        if _system_monitor is None:
            _system_monitor = SystemMonitor()

        # Record metric
        _system_monitor.record_metric(metric_name, value, labels)

        return JsonResponse({
            'success': True,
            'metric_recorded': {
                'name': metric_name,
                'value': value,
                'labels': labels
            }
        })

    except Exception as e:
        logger.error(f"Failed to record metric: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_system_health(request):
    """Get system health"""
    global _system_monitor

    if _system_monitor is None:
        _system_monitor = SystemMonitor()

    health = _system_monitor.get_system_health()

    return JsonResponse({
        'success': True,
        'system_health': health
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_metrics_summary(request):
    """Get metrics summary"""
    try:
        metric_name = request.GET.get('metric_name')
        window_minutes = int(request.GET.get('window_minutes', 60))

        global _system_monitor
        if _system_monitor is None:
            _system_monitor = SystemMonitor()

        if not metric_name:
            return JsonResponse({
                'success': False,
                'error': 'metric_name parameter required'
            }, status=400)

        summary = _system_monitor.get_metric_summary(metric_name, window_minutes)

        return JsonResponse({
            'success': True,
            'metric_summary': summary
        })

    except Exception as e:
        logger.error(f"Failed to get metrics summary: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def check_compliance(request):
    """
    Check model compliance

    Body:
    {
        "model_id": "tft_v1",
        "model_info": {...}
    }
    """
    try:
        body = json.loads(request.body)

        model_id = body.get('model_id')
        model_info = body.get('model_info', {})

        # Get governance
        global _governance
        if _governance is None:
            _governance = AIGovernance()

        # Check compliance
        result = _governance.check_compliance(model_id, model_info)

        return JsonResponse({
            'success': True,
            'compliance_result': result
        })

    except Exception as e:
        logger.error(f"Compliance check failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def audit_model(request):
    """
    Audit model

    Body:
    {
        "model_id": "tft_v1",
        "model_info": {...},
        "audit_type": "comprehensive"
    }
    """
    try:
        body = json.loads(request.body)

        model_id = body.get('model_id')
        model_info = body.get('model_info', {})
        audit_type = body.get('audit_type', 'comprehensive')

        # Get governance
        global _governance
        if _governance is None:
            _governance = AIGovernance()

        # Audit
        result = _governance.audit_model(model_id, model_info, audit_type)

        return JsonResponse({
            'success': True,
            'audit_result': result
        })

    except Exception as e:
        logger.error(f"Model audit failed: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_governance_report(request):
    """Get governance report"""
    try:
        model_id = request.GET.get('model_id')

        global _governance
        if _governance is None:
            _governance = AIGovernance()

        report = _governance.get_governance_report(model_id)

        return JsonResponse({
            'success': True,
            'governance_report': report
        })

    except Exception as e:
        logger.error(f"Failed to get governance report: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_integrated_ai_info(request):
    """Get integrated AI module information"""
    return JsonResponse({
        'success': True,
        'info': {
            'module': 'integrated_ai',
            'version': '1.0.0',
            'description': 'Complete AI system integration and production deployment',
            'features': {
                'orchestration': ['Auto-routing', 'Ensemble', 'Pipeline'],
                'meta_learning': ['MAML', 'Transfer learning', 'Few-shot'],
                'deployment': ['Canary', 'Blue-Green', 'Rolling', 'Shadow'],
                'observability': ['Monitoring', 'Alerting', 'Dashboards', 'Telemetry'],
                'governance': ['Compliance', 'Auditing', 'Ethics monitoring']
            },
            'deployment_strategies': ['canary', 'blue_green', 'rolling', 'shadow'],
            'compliance_standards': ['gdpr', 'hipaa', 'iso_27001', 'soc_2', 'ai_act'],
            'timestamp': datetime.now().isoformat()
        }
    })
