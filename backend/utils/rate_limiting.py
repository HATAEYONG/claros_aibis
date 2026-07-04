# -*- coding: utf-8 -*-
"""
Rate limiting configuration and utilities for Claros MIS

API rate limiting using Django Ratelimit
"""
from django.core.cache import cache
from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.permissions import BasePermission
import hashlib
import time


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    인증된 사용자는 모든 요청 가능, 익명 사용자는 읽기만 가능
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user and request.user.is_authenticated


class AnonymousRateThrottle(SimpleRateThrottle):
    """
    익명 사용자 레이트 리미팅
    """
    scope = 'anonymous'
    rate = getattr(settings, 'RATELIMIT_VIEW_RATE_LIMITS', {}).get('anonymous', '100/hour')

    def get_cache_key(self, request, view):
        # IP 기반 캐시 키 생성
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': hashlib.md5(ident.encode('utf-8')).hexdigest()
        }


class UserRateThrottle(SimpleRateThrottle):
    """
    인증된 사용자 레이트 리미팅
    """
    scope = 'user'
    rate = getattr(settings, 'RATELIMIT_VIEW_RATE_LIMITS', {}).get('user', '1000/hour')

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': str(ident)
        }


class StaffRateThrottle(SimpleRateThrottle):
    """
    스태프 사용자 레이트 리미팅
    """
    scope = 'staff'
    rate = getattr(settings, 'RATELIMIT_VIEW_RATE_LIMITS', {}).get('staff', '5000/hour')

    def get_cache_key(self, request, view):
        if request.user and request.user.is_staff:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': str(ident)
        }


class BurstRateThrottle(SimpleRateThrottle):
    """
    짧은 시간 동안의 버스트 요청 제한 (스파이크 방지)
    """
    scope = 'burst'
    rate = '10/second'  # 초당 10개 요청

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': hashlib.md5(ident.encode('utf-8')).hexdigest()
        }


def get_client_ip(request):
    """
    클라이언트 IP 주소 가져오기 (프록시 지원)
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def check_rate_limit(request, limit=100, window=3600):
    """
    레이트 리밋 확인 (슬라이딩 윈도우)

    Args:
        request: Django request object
        limit: 요청 제한 수
        window: 시간 윈도우 (초)

    Returns:
        tuple: (is_allowed, remaining_requests, reset_time)
    """
    if not getattr(settings, 'RATELIMIT_ENABLE', True):
        return True, limit, int(time.time()) + window

    client_ip = get_client_ip(request)
    cache_key = f'ratelimit:{client_ip}'

    # 현재 카운터 가져오기
    current_data = cache.get(cache_key, {'count': 0, 'reset_at': int(time.time()) + window})
    current_count = current_data['count']
    reset_at = current_data['reset_at']

    # 윈도우가 만료되었으면 리셋
    if int(time.time()) > reset_at:
        current_count = 0
        reset_at = int(time.time()) + window

    # 카운터 증가
    current_count += 1
    remaining = max(0, limit - current_count)

    # 캐시에 저장 (윈도우 시간 동안)
    cache.set(cache_key, {'count': current_count, 'reset_at': reset_at}, window)

    is_allowed = current_count <= limit

    return is_allowed, remaining, reset_at


class RateLimitMiddleware:
    """
    레이트 리미팅 미들웨어
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # API 요청에 대해서만 레이트 리밋 체크
        if request.path.startswith('/api/'):
            is_allowed, remaining, reset_at = check_rate_limit(request)

            if not is_allowed:
                from django.http import JsonResponse
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'message': f'너무 많은 요청을 보내셨습니다. {reset_at - int(time.time())}초 후 다시 시도해주세요.',
                    'reset_at': reset_at
                }, status=429)

            # 헤더에 레이트 리밋 정보 추가
            request.remaining_requests = remaining

        response = self.get_response(request)

        # 응답 헤더에 레이트 리밋 정보 추가
        if hasattr(request, 'remaining_requests'):
            response['X-RateLimit-Remaining'] = str(request.remaining_requests)
            response['X-RateLimit-Reset'] = str(getattr(settings, 'RATELIMIT_RESET_TIME', int(time.time()) + 3600))

        return response


# 각 엔드포인트별 레이트 리미팅 설정
ENDPOINT_RATE_LIMITS = {
    # 공개 엔드포인트
    '/api/': {'limit': 1000, 'window': 3600},
    '/api/docs/': {'limit': 100, 'window': 3600},
    '/api/health/': {'limit': 1000, 'window': 3600},

    # 인증 필요 엔드포인트
    '/api/dashboard/': {'limit': 500, 'window': 3600},
    '/api/kpi/': {'limit': 300, 'window': 3600},
    '/api/ai/chat/': {'limit': 50, 'window': 3600},  # AI 챗봇은 낮은 제한

    # 대량 데이터 엔드포인트
    '/api/export/': {'limit': 20, 'window': 3600},
    '/api/import/': {'limit': 10, 'window': 3600},

    # 배치 작업
    '/api/batch-': {'limit': 30, 'window': 3600},
}


def get_endpoint_rate_limit(path):
    """
    엔드포인트 경로에 따른 레이트 리미팅 설정 가져오기
    """
    for endpoint, config in ENDPOINT_RATE_LIMITS.items():
        if path.startswith(endpoint):
            return config
    # 기본값
    return {'limit': 100, 'window': 3600}
