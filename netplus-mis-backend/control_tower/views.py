"""
컨트롤 타워 API 뷰
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ControlTowerConfig, DashboardLayout
from .serializers import (
    ControlTowerConfigSerializer,
    DashboardLayoutSerializer,
    TowerWidgetSerializer,
    ExecutiveTowerRequestSerializer,
    FunctionalTowerRequestSerializer,
    ProcessTowerRequestSerializer,
)
from .services import ExecutiveTowerService, FunctionalTowerService, ProcessTowerService


class ControlTowerConfigViewSet(viewsets.ModelViewSet):
    """컨트롤 타워 설정 ViewSet"""

    serializer_class = ControlTowerConfigSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'config_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = ControlTowerConfig.objects.all()

        # 타입 필터
        tower_type = self.request.query_params.get('tower_type')
        if tower_type:
            queryset = queryset.filter(tower_type=tower_type)

        # 활성 상태 필터
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # 검색
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )

        return queryset.order_by('tower_type', 'code')

    @action(detail=False, methods=['get'])
    def types(self, request):
        """타워 유형 목록"""
        types = [choice[0] for choice in ControlTowerConfig._meta.get_field('tower_type').choices]
        return Response({'types': types})

    @action(detail=True, methods=['post'])
    def set_default(self, request, config_id=None):
        """기본 설정으로 지정"""
        config = self.get_object()
        DashboardLayout.objects.filter(
            tower_config=config
        ).update(is_default=False)

        # 첫 번째 레이아웃을 기본으로
        first_layout = config.layouts.first()
        if first_layout:
            first_layout.is_default = True
            first_layout.save()

        return Response({
            'message': '기본 설정이 변경되었습니다.',
            'config_id': str(config.config_id),
        })


class DashboardLayoutViewSet(viewsets.ModelViewSet):
    """대시보드 레이아웃 ViewSet"""

    serializer_class = DashboardLayoutSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'layout_id'

    def get_queryset(self):
        """쿼리셋 필터링"""
        queryset = DashboardLayout.objects.select_related('tower_config').all()

        # 타워 필터
        tower_config = self.request.query_params.get('tower_config')
        if tower_config:
            queryset = queryset.filter(tower_config__config_id=tower_config)

        # 타워 유형 필터
        tower_type = self.request.query_params.get('tower_type')
        if tower_type:
            queryset = queryset.filter(tower_config__tower_type=tower_type)

        # 기본 여부 필터
        is_default = self.request.query_params.get('is_default')
        if is_default is not None:
            queryset = queryset.filter(is_default=is_default.lower() == 'true')

        return queryset.order_by('-is_default', 'tower_config__code', 'name')

    @action(detail=False, methods=['get'])
    def default(self, request):
        """기본 레이아웃 조회"""
        tower_type = request.query_params.get('tower_type', 'executive')

        layout = DashboardLayout.objects.filter(
            tower_config__tower_type=tower_type,
            is_default=True
        ).first()

        if not layout:
            # 해당 타입의 첫 번째 레이아웃 반환
            layout = DashboardLayout.objects.filter(
                tower_config__tower_type=tower_type
            ).first()

        if layout:
            serializer = self.get_serializer(layout)
            return Response(serializer.data)

        return Response({
            'message': f'{tower_type} 타입의 레이아웃이 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)


class ExecutiveTowerViewSet(viewsets.ViewSet):
    """경영진 타워 ViewSet"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """경영진 타워 데이터 조회"""
        serializer = ExecutiveTowerRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        service = ExecutiveTowerService()
        data = service.get_executive_overview(serializer.validated_data)

        return Response(data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """경영진 요약 조회"""
        service = ExecutiveTowerService()
        data = service.get_executive_overview({
            'time_range': request.query_params.get('time_range', 'month'),
            'domains': request.query_params.getlist('domains', ['financial', 'production', 'quality', 'sales']),
        })

        return Response({
            'period': data['period'],
            'financial_summary': data['financial_summary'],
            'risk_overview': data['risk_overview'],
            'key_alerts_count': len(data.get('key_alerts', [])),
            'recommendations_count': len(data.get('recommendations', [])),
        })

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """주요 알림 조회"""
        limit = int(request.query_params.get('limit', 10))

        service = ExecutiveTowerService()
        data = service.get_executive_overview({
            'time_range': request.query_params.get('time_range', 'month'),
            'domains': [],
        })

        return Response({
            'alerts': data.get('key_alerts', [])[:limit],
            'total_count': len(data.get('key_alerts', [])),
        })

    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """경영진 추천사항 조회"""
        limit = int(request.query_params.get('limit', 5))

        service = ExecutiveTowerService()
        data = service.get_executive_overview({
            'time_range': request.query_params.get('time_range', 'month'),
            'domains': [],
        })

        return Response({
            'recommendations': data.get('recommendations', [])[:limit],
            'total_count': len(data.get('recommendations', [])),
        })


class FunctionalTowerViewSet(viewsets.ViewSet):
    """기능별 타워 ViewSet"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """기능별 타워 목록 조회"""
        service = FunctionalTowerService()

        # 도메인 파라미터가 있는 경우 해당 도메인 타워 조회
        domain = request.query_params.get('domain')
        if domain:
            serializer = FunctionalTowerRequestSerializer(data=request.query_params)
            serializer.is_valid(raise_exception=True)

            data = service.get_functional_tower(
                serializer.validated_data['domain'],
                serializer.validated_data
            )
            return Response(data)

        # 도메인 파라미터가 없는 경우 전체 도메인 요약 반환
        time_range = request.query_params.get('time_range', 'month')

        summary = {
            'tower_type': 'functional',
            'time_range': time_range,
            'domains': []
        }

        # 각 도메인별 요약 조회
        for domain in ['cost', 'financial', 'purchase', 'production', 'quality']:
            try:
                data = service.get_functional_tower(domain, {'time_range': time_range, 'filters': {}})
                summary['domains'].append({
                    'domain': domain,
                    'summary': data.get('summary', {}),
                    'kpis': data.get('kpis', {}),
                    'status': data.get('kpis', {}).get('status', 'unknown'),
                })
            except Exception as e:
                summary['domains'].append({
                    'domain': domain,
                    'error': str(e),
                    'status': 'error',
                })

        return Response(summary)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """기능별 타워 개요 조회"""
        domain = request.query_params.get('domain')

        if not domain:
            return Response({
                'error': 'domain 파라미터가 필요합니다.',
                'available_domains': ['cost', 'financial', 'purchase', 'production', 'quality'],
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = FunctionalTowerRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        service = FunctionalTowerService()
        data = service.get_functional_tower(
            serializer.validated_data['domain'],
            serializer.validated_data
        )

        return Response(data)


class ProcessTowerViewSet(viewsets.ViewSet):
    """프로세스 타워 ViewSet"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """프로세스 타워 데이터 조회"""
        serializer = ProcessTowerRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        service = ProcessTowerService()
        data = service.get_process_tower(serializer.validated_data)

        return Response(data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """프로세스 요약 조회"""
        serializer = ProcessTowerRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        service = ProcessTowerService()
        data = service.get_process_tower(serializer.validated_data)

        return Response({
            'summary': data.get('summary', {}),
            'bottlenecks_count': len(data.get('bottlenecks', [])),
            'total_delays': len(data.get('process_delays', [])),
        })

    @action(detail=False, methods=['get'])
    def approvals(self, request):
        """승인 프로세스 현황 조회"""
        days = int(request.query_params.get('days', 7))
        department = request.query_params.get('department', '')

        service = ProcessTowerService()
        data = service.get_process_tower({
            'process_type': 'approval',
            'time_range_days': days,
            'department': department,
        })

        return Response({
            'approval_processes': data.get('approval_processes', {}),
            'summary': data.get('summary', {}),
        })

    @action(detail=False, methods=['get'])
    def sop_compliance(self, request):
        """SOP 준수 현황 조회"""
        days = int(request.query_params.get('days', 7))
        department = request.query_params.get('department', '')

        service = ProcessTowerService()
        data = service.get_process_tower({
            'process_type': 'sop',
            'time_range_days': days,
            'department': department,
        })

        return Response({
            'sop_compliance': data.get('sop_compliance', {}),
            'summary': data.get('summary', {}),
        })

    @action(detail=False, methods=['get'])
    def delays(self, request):
        """프로세스 지연 조회"""
        days = int(request.query_params.get('days', 7))
        department = request.query_params.get('department', '')

        service = ProcessTowerService()
        data = service.get_process_tower({
            'process_type': 'delay',
            'time_range_days': days,
            'department': department,
        })

        return Response({
            'process_delays': data.get('process_delays', []),
            'total_count': len(data.get('process_delays', [])),
        })

    @action(detail=False, methods=['get'])
    def bottlenecks(self, request):
        """병목 현황 조회"""
        process_type = request.query_params.get('process_type', 'all')

        service = ProcessTowerService()
        data = service.get_process_tower({
            'process_type': process_type,
            'time_range_days': 7,
            'department': '',
        })

        return Response({
            'bottlenecks': data.get('bottlenecks', []),
            'total_count': len(data.get('bottlenecks', [])),
        })
