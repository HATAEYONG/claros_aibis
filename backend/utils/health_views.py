# Health Check API Views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .health_check import get_system_health


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check endpoint"""
    health = get_system_health()

    # Determine HTTP status based on health status
    status_code = 200
    if health['overall_status'] == 'critical':
        status_code = 503
    elif health['overall_status'] == 'warning':
        status_code = 200  # Still return 200 for warnings

    return Response(health, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """Readiness check for Kubernetes/deployment"""
    from django.db import connection

    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()

        if row and row[0] == 1:
            return Response({'status': 'ready'}, status=200)
        else:
            return Response({'status': 'not ready'}, status=503)

    except Exception as e:
        return Response({
            'status': 'not ready',
            'error': str(e)
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """Liveness check for Kubernetes/deployment"""
    return Response({'status': 'alive'}, status=200)
