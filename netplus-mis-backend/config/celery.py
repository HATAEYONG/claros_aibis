# Celery Configuration for Netplus MIS-AI Dashboard
# Priority queues: high, medium, low
# Worker autoscaling and parallel processing

import os
from celery import Celery
from celery.schedules import crontab

# Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery app
app = Celery('netplus_mis')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ==========================================
# Celery Configuration
# ==========================================
app.conf.update(
    # Broker settings (Redis)
    broker_url=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),

    # Task serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,

    # Task result expiration (24 hours)
    result_expires=86400,

    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    worker_concurrency=int(os.getenv('CELERY_WORKER_CONCURRENCY', '4')),

    # Autoscaling (min/max workers)
    worker_autoscaler='celery.worker.autoscale:Autoscaler',
    worker_autoscale_min=int(os.getenv('CELERY_WORKER_AUTOSCALE_MIN', '2')),
    worker_autoscale_max=int(os.getenv('CELERY_WORKER_AUTOSCALE_MAX', '8')),

    # Task routing by priority
    task_routes={
        # High priority tasks (urgent, real-time)
        'netplus_mis.ai.tasks.high_priority_*': {'queue': 'high'},
        'netplus_mis.erp_sync.tasks.urgent_sync': {'queue': 'high'},
        'netplus_mis.utils.health_*': {'queue': 'high'},

        # Medium priority tasks (standard operations)
        'netplus_mis.ai.tasks.*': {'queue': 'medium'},
        'netplus_mis.erp_sync.tasks.*': {'queue': 'medium'},
        'netplus_mis.reports.tasks.*': {'queue': 'medium'},

        # Low priority tasks (batch, background)
        'netplus_mis.ai.tasks.low_priority_*': {'queue': 'low'},
        'netplus_mis.erp_sync.tasks.batch_sync': {'queue': 'low'},
        'netplus_mis.utils.cleanup_*': {'queue': 'low'},
    },

    # Task priority settings
    task_default_priority=5,
    task_queue_max_priority=10,

    # Rate limiting (per task type)
    task_annotations={
        'netplus_mis.ai.tasks.predict_*': {'rate_limit': '10/m'},
        'netplus_mis.erp_sync.tasks.sync_*': {'rate_limit': '20/m'},
    },

    # Task time limits
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes

    # Beat scheduler configuration
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
)

# ==========================================
# Celery Beat Schedule (Periodic Tasks)
# ==========================================
app.conf.beat_schedule = {
    # AI Prediction Tasks
    'calculate-kpi-every-15-min': {
        'task': 'netplus_mis.ai.tasks.calculate_kpi_task',
        'schedule': crontab(minute='*/15'),
        'options': {'queue': 'medium'},
    },
    'run-ai-predictions-hourly': {
        'task': 'netplus_mis.ai.tasks.run_predictions_task',
        'schedule': crontab(minute=0),
        'options': {'queue': 'medium'},
    },

    # ERP Sync Tasks
    'sync-realtime-data-every-15-min': {
        'task': 'netplus_mis.erp_sync.tasks.sync_realtime_task',
        'schedule': crontab(minute='*/15'),
        'options': {'queue': 'medium'},
    },
    'sync-hourly-data': {
        'task': 'netplus_mis.erp_sync.tasks.sync_hourly_task',
        'schedule': crontab(minute=0, hour='*'),
        'options': {'queue': 'low'},
    },

    # Maintenance Tasks
    'cleanup-old-data-daily': {
        'task': 'netplus_mis.ai.tasks.cleanup_old_data_task',
        'schedule': crontab(hour=0, minute=0),
        'options': {'queue': 'low'},
    },
    'health-check-every-5-min': {
        'task': 'netplus_mis.utils.tasks.health_check_task',
        'schedule': crontab(minute='*/5'),
        'options': {'queue': 'high'},
    },
}


@app.task(bind=True, name='netplus_mis.debug.task')
def debug_task(self):
    """Debug task to verify Celery is working"""
    print(f'Request: {self.request!r}')


# Worker startup hook
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks after configuration"""
    sender.add_periodic_task(
        crontab(minute='*/5'),
        debug_task.s(),
        name='Debug task every 5 minutes',
    )
