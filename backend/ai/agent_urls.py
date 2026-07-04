"""
에이전트 API URL 설정
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ai.agents.base.registry import registry

app_name = "agents"


# 에이전트 레지스트리 조회
@api_view(['GET'])
@permission_classes([AllowAny])
def agent_registry_view(request):
    """등록된 에이전트 목록 조회"""
    agents = registry.list_agents()
    return Response({
        'total': len(agents),
        'agents': agents
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def agent_stats_view(request):
    """에이전트 통계 조회"""
    from ai.models import AgentRunLog

    # 전체 실행 통계
    total_runs = AgentRunLog.objects.count()
    success_runs = AgentRunLog.objects.filter(status='completed').count()
    avg_execution_time = AgentRunLog.objects.aggregate(
        avg_time=models.Avg('execution_time_ms')
    )['avg_time'] or 0

    # 레이어별 실행 통계
    layer_stats = {}
    for layer in ['orchestration', 'monitoring', 'intelligence', 'analysis', 'decision', 'learning']:
        layer_runs = AgentRunLog.objects.filter(agent_layer=layer).count()
        layer_success = AgentRunLog.objects.filter(
            agent_layer=layer, status='completed'
        ).count()
        layer_stats[layer] = {
            'total': layer_runs,
            'success': layer_success,
            'success_rate': round(layer_success / layer_runs * 100, 1) if layer_runs > 0 else 0
        }

    return Response({
        'total_runs': total_runs,
        'success_runs': success_runs,
        'success_rate': round(success_runs / total_runs * 100, 1) if total_runs > 0 else 0,
        'avg_execution_time_ms': round(avg_execution_time, 1),
        'layer_stats': layer_stats
    })


from django.db import models

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('registry/', agent_registry_view, name='agent-registry'),
    path('stats/', agent_stats_view, name='agent-stats'),
]
