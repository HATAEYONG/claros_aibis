# Request Middleware for Logging and Metrics
# Request ID generation and context tracking

import uuid
import time
import logging
import threading
from typing import Callable
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


# Thread-local storage for request context
_request_context = threading.local()


class RequestContext:
    """Request context for logging"""

    def __init__(self):
        self.request_id = None
        self.user_id = None
        self.session_id = None
        self.ip_address = None
        self.path = None
        self.method = None
        self.start_time = None

    def to_dict(self) -> dict:
        """Convert context to dictionary"""
        return {
            'request_id': self.request_id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'path': self.path,
            'method': self.method,
            'duration_ms': self.duration_ms()
        }

    def duration_ms(self) -> float:
        """Calculate request duration in milliseconds"""
        if self.start_time:
            return (time.time() - self.start_time) * 1000
        return None


def get_request_context() -> RequestContext:
    """Get current request context"""
    if not hasattr(_request_context, 'context'):
        _request_context.context = RequestContext()
    return _request_context.context


def set_request_context(**kwargs):
    """Set request context values"""
    context = get_request_context()
    for key, value in kwargs.items():
        if hasattr(context, key):
            setattr(context, key, value)


def clear_request_context():
    """Clear request context"""
    _request_context.context = RequestContext()


class RequestIDMiddleware(MiddlewareMixin):
    """
    Middleware to add unique request ID and track request context
    """

    def process_request(self, request: HttpRequest):
        """Generate request ID and set context"""
        # Generate unique request ID
        request_id = self._get_request_id(request)

        # Set request context
        set_request_context(
            request_id=request_id,
            user_id=self._get_user_id(request),
            session_id=self._get_session_id(request),
            ip_address=self._get_client_ip(request),
            path=request.path,
            method=request.method,
            start_time=time.time()
        )

        # Add request ID to request object for access in views
        request.request_id = request_id

        # Log request start
        logger.info(
            f'{request.method} {request.path}',
            extra={
                'event': 'request_start',
                'request_id': request_id,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': self._get_client_ip(request)
            }
        )

    def process_response(self, request: HttpRequest, response: HttpResponse):
        """Log request completion"""
        context = get_request_context()

        # Add request ID to response headers
        if context.request_id:
            response['X-Request-ID'] = context.request_id

        # Calculate duration
        duration_ms = context.duration_ms()
        if duration_ms:
            response['X-Response-Time'] = f'{duration_ms:.2f}ms'

        # Log request completion
        log_level = logging.INFO if response.status_code < 400 else logging.WARNING
        logger.log(
            log_level,
            f'{request.method} {request.path} - {response.status_code}',
            extra={
                'event': 'request_end',
                'request_id': context.request_id,
                'status_code': response.status_code,
                'duration_ms': duration_ms
            }
        )

        # Clear context after response
        clear_request_context()

        return response

    def process_exception(self, request: HttpRequest, exception: Exception):
        """Log request exception"""
        logger.error(
            f'Exception on {request.method} {request.path}: {str(exception)}',
            extra={
                'event': 'request_exception',
                'request_id': getattr(get_request_context(), 'request_id', 'unknown'),
                'exception_type': type(exception).__name__
            },
            exc_info=True
        )
        clear_request_context()

    def _get_request_id(self, request: HttpRequest) -> str:
        """Get or generate request ID"""
        # Check for existing request ID in header
        request_id = request.META.get('HTTP_X_REQUEST_ID')
        if request_id:
            return request_id

        # Generate new request ID
        return str(uuid.uuid4())

    def _get_user_id(self, request: HttpRequest) -> str:
        """Get user ID from request"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            return str(request.user.id)
        return None

    def _get_session_id(self, request: HttpRequest) -> str:
        """Get session ID from request"""
        if hasattr(request, 'session') and request.session.session_key:
            return request.session.session_key
        return None

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()

        x_real_ip = request.META.get('HTTP_X_REAL_IP')
        if x_real_ip:
            return x_real_ip

        return request.META.get('REMOTE_ADDR')


class MetricsCollectionMiddleware(MiddlewareMixin):
    """
    Middleware to collect metrics for each request
    Integrates with Prometheus metrics
    """

    def __init__(self, get_response: Callable):
        super().__init__(get_response)
        # Lazy import to avoid circular imports
        try:
            from .metrics import metrics_collector
            self.metrics = metrics_collector
        except ImportError:
            self.metrics = None
            logger.warning("Metrics collector not available")

    def process_request(self, request: HttpRequest):
        """Record request start time"""
        request.start_time = time.time()

    def process_response(self, request: HttpRequest, response: HttpResponse):
        """Collect request metrics"""
        if self.metrics:
            # Calculate duration
            duration = time.time() - getattr(request, 'start_time', time.time())

            # Record request metrics
            self.metrics.record_request(
                method=request.method,
                path=request.path,
                status=response.status_code,
                duration=duration
            )

        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers
    """

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add security headers to response"""
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'

        # XSS protection
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy (basic)
        if not response.get('Content-Security-Policy'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )

        return response


class CacheControlMiddleware(MiddlewareMixin):
    """
    Middleware to add cache control headers
    """

    # Paths that should not be cached
    NO_CACHE_PATHS = [
        '/api/',
        '/health/',
        '/metrics/',
    ]

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add cache control headers"""
        # Check if path should not be cached
        for path in self.NO_CACHE_PATHS:
            if request.path.startswith(path):
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                break

        return response
