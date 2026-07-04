# -*- coding: utf-8 -*-
"""
Visualization API Views
데이터 시각화 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Dashboard, DashboardWidget, ChartTemplate, DataStream, VisualizationSettings
from .serializers import (
    DashboardSerializer, DashboardWidgetSerializer,
    ChartTemplateSerializer, DataStreamSerializer,
    VisualizationSettingsSerializer
)


class DashboardViewSet(viewsets.ModelViewSet):
    """대시보드 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = Dashboard.objects.all()

    def get_queryset(self):
        return Dashboard.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return DashboardSerializer

    @action(detail=True, methods=['post'])
    def add_widget(self, request, pk=None):
        """위젯 추가"""
        dashboard = self.get_object()

        widget_data = request.data.copy()
        widget_data['dashboard'] = dashboard.id

        serializer = DashboardWidgetSerializer(data=widget_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_layout(self, request, pk=None):
        """레이아웃 업데이트"""
        dashboard = self.get_object()
        layout = request.data.get('layout', {})

        dashboard.layout = layout
        dashboard.save()

        serializer = self.get_serializer(dashboard)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """대시보드 복제"""
        dashboard = self.get_object()

        new_dashboard = Dashboard.objects.create(
            name=f"{dashboard.name} (복제)",
            code=f"{dashboard.code}_copy",
            description=dashboard.description,
            layout=dashboard.layout,
            theme=dashboard.theme,
            refresh_interval=dashboard.refresh_interval,
            created_by=request.data.get('created_by', request.user.username if request.user.is_authenticated else 'system')
        )

        # 위젯 복제
        for widget in dashboard.widgets.all():
            DashboardWidget.objects.create(
                dashboard=new_dashboard,
                widget_type=widget.widget_type,
                title=widget.title,
                description=widget.description,
                position=widget.position,
                size=widget.size,
                data_config=widget.data_config,
                chart_config=widget.chart_config,
                refresh_interval=widget.refresh_interval,
                data_source=widget.data_source,
                query=widget.query,
                order=widget.order
            )

        serializer = self.get_serializer(new_dashboard)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """대시보드 데이터 조회"""
        dashboard = self.get_object()
        # 실제 구현에서는 각 위젯의 데이터를 조회하여 반환
        return Response({
            'dashboard_id': str(dashboard.id),
            'widgets': [
                {
                    'widget_id': str(widget.id),
                    'widget_type': widget.widget_type,
                    'title': widget.title,
                    # 실제 데이터는 widget.data_config를 기반으로 조회
                    'data': self._get_widget_data(widget)
                }
                for widget in dashboard.widgets.filter(is_active=True)
            ]
        })

    def _get_widget_data(self, widget):
        """위젯 데이터 조회 (시뮬레이션)"""
        # 실제 구현에서는 widget.data_source, widget.query를 사용하여 데이터 조회
        return {
            'labels': ['1월', '2월', '3월', '4월', '5월', '6월'],
            'datasets': [{
                'label': '매출',
                'data': [120, 190, 150, 220, 180, 250],
                'backgroundColor': 'rgba(54, 162, 235, 0.2)',
                'borderColor': 'rgba(54, 162, 235, 1)',
            }]
        }


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """대시보드 위젯 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = DashboardWidget.objects.all()

    def get_queryset(self):
        return DashboardWidget.objects.all().order_by('order', '-created_at')

    def get_serializer_class(self):
        return DashboardWidgetSerializer

    @action(detail=True, methods=['post'])
    def resize(self, request, pk=None):
        """위젯 크기 변경"""
        widget = self.get_object()
        size = request.data.get('size', {})

        widget.size = size
        widget.save()

        serializer = self.get_serializer(widget)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """위젯 이동"""
        widget = self.get_object()
        position = request.data.get('position', {})

        widget.position = position
        widget.save()

        serializer = self.get_serializer(widget)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """위젯 데이터 조회"""
        widget = self.get_object()
        data = self._get_widget_data(widget)

        return Response({
            'widget_id': str(widget.id),
            'widget_type': widget.widget_type,
            'title': widget.title,
            'data': data
        })

    def _get_widget_data(self, widget):
        """위젯 데이터 조회 (시뮬레이션)"""
        # 위젯 유형에 따라 다른 데이터 반환
        if widget.widget_type == 'line':
            return {
                'labels': ['1월', '2월', '3월', '4월', '5월', '6월'],
                'datasets': [{
                    'label': '매출',
                    'data': [120, 190, 150, 220, 180, 250],
                    'borderColor': 'rgb(75, 192, 192)',
                    'tension': 0.1
                }]
            }
        elif widget.widget_type == 'bar':
            return {
                'labels': ['제품A', '제품B', '제품C', '제품D', '제품E'],
                'datasets': [{
                    'label': '판매량',
                    'data': [120, 190, 150, 220, 180],
                    'backgroundColor': [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            }
        elif widget.widget_type == 'pie':
            return {
                'labels': ['완료', '진행중', '대기', '취소'],
                'datasets': [{
                    'data': [30, 20, 15, 5],
                    'backgroundColor': [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(255, 99, 132, 0.5)'
                    ]
                }]
            }
        elif widget.widget_type == 'kpi':
            return {
                'value': 1500000000,
                'label': '매출',
                'previous_value': 1380000000,
                'change': 8.7,
                'unit': '원'
            }
        else:
            return {}


class ChartTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """차트 템플릿 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = ChartTemplate.objects.all()

    def get_queryset(self):
        return ChartTemplate.objects.filter(is_active=True).order_by('-created_at')

    def get_serializer_class(self):
        return ChartTemplateSerializer

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """카테고리별 템플릿 조회"""
        category = request.query_params.get('category')

        queryset = self.get_queryset()
        if category:
            queryset = queryset.filter(category=category)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'templates': serializer.data,
            'count': len(serializer.data)
        })


class DataStreamViewSet(viewsets.ModelViewSet):
    """데이터 스트림 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = DataStream.objects.all()

    def get_queryset(self):
        return DataStream.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        return DataStreamSerializer

    @action(detail=True, methods=['post'])
    def subscribe(self, request, pk=None):
        """스트림 구독"""
        stream = self.get_object()
        stream.subscriber_count += 1
        stream.save()

        return Response({
            'message': 'Subscribed to stream',
            'subscriber_count': stream.subscriber_count
        })

    @action(detail=True, methods=['post'])
    def unsubscribe(self, request, pk=None):
        """스트림 구독 취소"""
        stream = self.get_object()
        if stream.subscriber_count > 0:
            stream.subscriber_count -= 1
            stream.save()

        return Response({
            'message': 'Unsubscribed from stream',
            'subscriber_count': stream.subscriber_count
        })

    @action(detail=True, methods=['get'])
    def latest(self, request, pk=None):
        """최신 데이터 조회"""
        stream = self.get_object()

        # 실제 구현에서는 Redis 등에서 실시간 데이터 조회
        return Response({
            'stream_id': str(stream.id),
            'topic': stream.topic,
            'data': self._get_stream_data(stream)
        })

    def _get_stream_data(self, stream):
        """스트림 데이터 조회 (시뮬레이션)"""
        return {
            'timestamp': timezone.now().isoformat(),
            'value': 100.5,
            'status': 'normal'
        }


class VisualizationViewSet(viewsets.ViewSet):
    """시각화 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_dashboard(self, request):
        """대시보드 생성"""
        name = request.data.get('name')
        code = request.data.get('code')
        description = request.data.get('description', '')
        theme = request.data.get('theme', 'default')
        layout = request.data.get('layout', {})
        refresh_interval = request.data.get('refresh_interval', 300)
        is_public = request.data.get('is_public', False)
        created_by = request.data.get('created_by', request.user.username if request.user.is_authenticated else 'system')

        try:
            dashboard = Dashboard.objects.create(
                name=name,
                code=code,
                description=description,
                theme=theme,
                layout=layout,
                refresh_interval=refresh_interval,
                is_public=is_public,
                created_by=created_by
            )

            serializer = DashboardSerializer(dashboard)

            return Response({
                'success': True,
                'dashboard': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def chart_types(self, request):
        """차트 유형 조회"""
        chart_types = [
            {'value': 'line', 'label': '선 그래프', 'icon': 'chart-line'},
            {'value': 'bar', 'label': '막대 그래프', 'icon': 'chart-bar'},
            {'value': 'pie', 'label': '원 그래프', 'icon': 'chart-pie'},
            {'value': 'area', 'label': '영역 그래프', 'icon': 'chart-area'},
            {'value': 'scatter', 'label': '산점도', 'icon': 'dots-horizontal'},
            {'value': 'heatmap', 'label': '히트맵', 'icon': 'grid'},
            {'value': 'treemap', 'label': '트리맵', 'icon': 'squares'},
            {'value': 'gauge', 'label': '게이지', 'icon': 'gauge'},
            {'value': 'table', 'label': '테이블', 'icon': 'table'},
            {'value': 'kpi', 'label': 'KPI 카드', 'icon': 'card'},
            {'value': 'funnel', 'label': '깔때기 차트', 'icon': 'funnel'},
            {'value': 'sankey', 'label': '산키 다이어그램', 'icon': 'workflow'},
            {'value': 'radar', 'label': '레이더 차트', 'icon': 'radar'},
        ]

        return Response({
            'chart_types': chart_types
        })

    @action(detail=False, methods=['get'])
    def widgets(self, request):
        """위젯 목록 조회"""
        dashboard_id = request.query_params.get('dashboard_id')

        if not dashboard_id:
            return Response({
                'error': 'dashboard_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            dashboard = Dashboard.objects.get(id=dashboard_id)
            widgets = dashboard.widgets.filter(is_active=True)
            serializer = DashboardWidgetSerializer(widgets, many=True)

            return Response({
                'widgets': serializer.data,
                'count': len(serializer.data)
            })

        except Dashboard.DoesNotExist:
            return Response({
                'error': 'Dashboard not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def create_widget(self, request):
        """위젯 생성"""
        dashboard_id = request.data.get('dashboard_id')
        widget_type = request.data.get('widget_type')
        title = request.data.get('title')
        description = request.data.get('description', '')
        position = request.data.get('position', {})
        size = request.data.get('size', {})
        data_config = request.data.get('data_config', {})
        chart_config = request.data.get('chart_config', {})
        data_source = request.data.get('data_source', '')
        query = request.data.get('query', '')
        refresh_interval = request.data.get('refresh_interval')

        try:
            dashboard = Dashboard.objects.get(id=dashboard_id)

            widget = DashboardWidget.objects.create(
                dashboard=dashboard,
                widget_type=widget_type,
                title=title,
                description=description,
                position=position,
                size=size,
                data_config=data_config,
                chart_config=chart_config,
                data_source=data_source,
                query=query,
                refresh_interval=refresh_interval
            )

            serializer = DashboardWidgetSerializer(widget)

            return Response({
                'success': True,
                'widget': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Dashboard.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Dashboard not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
