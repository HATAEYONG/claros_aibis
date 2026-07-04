# -*- coding: utf-8 -*-
"""
Monitoring Service
모니터링 서비스
"""
import logging
import time
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db import connection
from django.core.cache import cache
from django.conf import settings

from ..models import SystemMetric, APILog, ErrorLog, PerformanceLog, HealthCheck

logger = logging.getLogger(__name__)


class MonitoringService:
    """모니터링 서비스"""

    def __init__(self):
        self.start_time = timezone.now()

    def record_metric(self, metric_name: str, value: float,
                     metric_type: str = 'gauge', unit: str = '',
                     tags: Optional[Dict] = None) -> SystemMetric:
        """메트릭 기록"""
        try:
            metric = SystemMetric.objects.create(
                metric_name=metric_name,
                metric_type=metric_type,
                value=value,
                unit=unit,
                tags=tags or {},
                timestamp=timezone.now()
            )
            return metric
        except Exception as e:
            logger.error(f"Failed to record metric: {e}")
            return None

    def log_api_call(self, method: str, path: str, status_code: int,
                    response_time_ms: float, user=None, ip_address: str = '',
                    user_agent: str = '', query_params: Dict = None,
                    request_body: str = '', response_body: str = '',
                    error_message: str = '') -> APILog:
        """API 호출 로그 기록"""
        try:
            log = APILog.objects.create(
                method=method,
                path=path,
                query_params=query_params or {},
                request_body=request_body[:1000],  # Limit request body size
                user=user,
                ip_address=ip_address,
                user_agent=user_agent[:500],  # Limit user agent size
                status_code=status_code,
                response_time_ms=response_time_ms,
                response_body=response_body[:1000],  # Limit response body size
                error_message=error_message
            )
            return log
        except Exception as e:
            logger.error(f"Failed to log API call: {e}")
            return None

    def log_error(self, error_type: str, error_message: str, stack_trace: str,
                 request_path: str = '', request_method: str = '',
                 user=None, ip_address: str = '', user_agent: str = '') -> ErrorLog:
        """에러 로그 기록"""
        try:
            error_log = ErrorLog.objects.create(
                error_type=error_type,
                error_message=error_message,
                stack_trace=stack_trace,
                request_path=request_path,
                request_method=request_method,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent
            )
            return error_log
        except Exception as e:
            logger.error(f"Failed to log error: {e}")
            return None

    def log_performance(self, operation_name: str, duration_ms: float,
                       operation_type: str = 'api_call',
                       metadata: Dict = None) -> PerformanceLog:
        """성능 로그 기록"""
        try:
            perf_log = PerformanceLog.objects.create(
                operation_name=operation_name,
                operation_type=operation_type,
                duration_ms=duration_ms,
                metadata=metadata or {}
            )
            return perf_log
        except Exception as e:
            logger.error(f"Failed to log performance: {e}")
            return None

    def get_system_health(self) -> Dict[str, Any]:
        """시스템 헬스 체크"""
        health_status = {
            'status': 'healthy',
            'services': [],
            'uptime_seconds': (timezone.now() - self.start_time).total_seconds(),
            'timestamp': timezone.now().isoformat()
        }

        # 데이터베이스 체크
        db_status = self._check_database()
        health_status['services'].append(db_status)

        # 캐시 체크
        cache_status = self._check_cache()
        health_status['services'].append(cache_status)

        # 디스크 공간 체크
        disk_status = self._check_disk_space()
        health_status['services'].append(disk_status)

        # 메모리 체크
        memory_status = self._check_memory()
        health_status['services'].append(memory_status)

        # 전체 상태 결정
        degraded_count = sum(1 for s in health_status['services'] if s['status'] == 'degraded')
        unhealthy_count = sum(1 for s in health_status['services'] if s['status'] == 'unhealthy')

        if unhealthy_count > 0:
            health_status['status'] = 'unhealthy'
        elif degraded_count > 0:
            health_status['status'] = 'degraded'

        return health_status

    def _check_database(self) -> Dict[str, Any]:
        """데이터베이스 체크"""
        start_time = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            response_time = (time.time() - start_time) * 1000

            status = 'healthy' if response_time < 100 else 'degraded'
            return {
                'service_name': 'database',
                'status': status,
                'response_time_ms': response_time,
                'details': {
                    'connection': 'ok',
                    'query_time': f"{response_time:.2f}ms"
                }
            }
        except Exception as e:
            return {
                'service_name': 'database',
                'status': 'unhealthy',
                'response_time_ms': None,
                'details': {
                    'error': str(e)
                }
            }

    def _check_cache(self) -> Dict[str, Any]:
        """캐시 체크"""
        start_time = time.time()
        try:
            test_key = 'health_check_test'
            cache.set(test_key, 'test', 10)
            result = cache.get(test_key)
            cache.delete(test_key)

            response_time = (time.time() - start_time) * 1000

            status = 'healthy' if result == 'test' and response_time < 50 else 'degraded'
            return {
                'service_name': 'cache',
                'status': status,
                'response_time_ms': response_time,
                'details': {
                    'backend': getattr(settings, 'CACHES', {}).get('default', {}).get('BACKEND', 'unknown'),
                    'operation': 'set/get/delete'
                }
            }
        except Exception as e:
            return {
                'service_name': 'cache',
                'status': 'unhealthy',
                'response_time_ms': None,
                'details': {
                    'error': str(e)
                }
            }

    def _check_disk_space(self) -> Dict[str, Any]:
        """디스크 공간 체크"""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            used_percent = (used / total) * 100

            status = 'healthy' if used_percent < 80 else 'degraded' if used_percent < 90 else 'unhealthy'

            return {
                'service_name': 'disk_space',
                'status': status,
                'response_time_ms': None,
                'details': {
                    'total_gb': round(total / (1024**3), 2),
                    'used_gb': round(used / (1024**3), 2),
                    'free_gb': round(free / (1024**3), 2),
                    'used_percent': round(used_percent, 2)
                }
            }
        except Exception as e:
            return {
                'service_name': 'disk_space',
                'status': 'unhealthy',
                'response_time_ms': None,
                'details': {
                    'error': str(e)
                }
            }

    def _check_memory(self) -> Dict[str, Any]:
        """메모리 체크"""
        try:
            import psutil
            memory = psutil.virtual_memory()
            used_percent = memory.percent

            status = 'healthy' if used_percent < 70 else 'degraded' if used_percent < 90 else 'unhealthy'

            return {
                'service_name': 'memory',
                'status': status,
                'response_time_ms': None,
                'details': {
                    'total_gb': round(memory.total / (1024**3), 2),
                    'available_gb': round(memory.available / (1024**3), 2),
                    'used_percent': used_percent
                }
            }
        except ImportError:
            # psutil not installed, return degraded status
            return {
                'service_name': 'memory',
                'status': 'degraded',
                'response_time_ms': None,
                'details': {
                    'error': 'psutil not installed'
                }
            }
        except Exception as e:
            return {
                'service_name': 'memory',
                'status': 'unhealthy',
                'response_time_ms': None,
                'details': {
                    'error': str(e)
                }
            }

    def get_recent_errors(self, limit: int = 50) -> List[Dict]:
        """최근 에러 조회"""
        try:
            errors = ErrorLog.objects.filter(
                is_resolved=False
            ).order_by('-occurred_at')[:limit]

            return [
                {
                    'id': str(error.id),
                    'error_type': error.error_type,
                    'error_message': error.error_message,
                    'request_path': error.request_path,
                    'occurred_at': error.occurred_at.isoformat(),
                }
                for error in errors
            ]
        except Exception as e:
            logger.error(f"Failed to get recent errors: {e}")
            return []

    def get_performance_metrics(self, operation_name: str = None,
                                hours: int = 24) -> Dict[str, Any]:
        """성능 메트릭 조회"""
        try:
            since = timezone.now() - timedelta(hours=hours)

            queryset = PerformanceLog.objects.filter(
                timestamp__gte=since
            )

            if operation_name:
                queryset = queryset.filter(operation_name=operation_name)

            logs = list(queryset)

            if not logs:
                return {
                    'count': 0,
                    'avg_duration_ms': 0,
                    'max_duration_ms': 0,
                    'min_duration_ms': 0,
                    'p95_duration_ms': 0,
                    'p99_duration_ms': 0,
                }

            durations = [log.duration_ms for log in logs]
            durations.sort()

            count = len(durations)
            avg_duration = sum(durations) / count
            max_duration = max(durations)
            min_duration = min(durations)

            p95_index = int(count * 0.95)
            p99_index = int(count * 0.99)

            return {
                'count': count,
                'avg_duration_ms': round(avg_duration, 2),
                'max_duration_ms': round(max_duration, 2),
                'min_duration_ms': round(min_duration, 2),
                'p95_duration_ms': round(durations[p95_index], 2) if p95_index < count else 0,
                'p99_duration_ms': round(durations[p99_index], 2) if p99_index < count else 0,
            }
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {e}")
            return {}


class ErrorTrackingService:
    """에러 추적 서비스"""

    def __init__(self):
        self.monitoring_service = MonitoringService()

    def track_exception(self, exc: Exception, request=None):
        """예외 추적"""
        error_type = exc.__class__.__name__
        error_message = str(exc)
        stack_trace = traceback.format_exc()

        user = getattr(request, 'user', None) if request else None
        ip_address = self._get_client_ip(request) if request else ''
        user_agent = self._get_user_agent(request) if request else ''
        request_path = getattr(request, 'path', '') if request else ''
        request_method = getattr(request, 'method', '') if request else ''

        self.monitoring_service.log_error(
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            request_path=request_path,
            request_method=request_method,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def _get_client_ip(self, request):
        """클라이언트 IP 추출"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def _get_user_agent(self, request):
        """User Agent 추출"""
        return request.META.get('HTTP_USER_AGENT', '')
