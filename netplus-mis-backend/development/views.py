from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg, Count

from .models import (
    RDProject, InnovationMetric, Patent,
    RDPersonnel, TechnologyRoadmap, RDBudget
)
from .serializers import (
    RDProjectSerializer, InnovationMetricSerializer, PatentSerializer,
    RDPersonnelSerializer, TechnologyRoadmapSerializer, RDBudgetSerializer
)


# 더미 데이터 헬퍼 함수
def get_dummy_rd_projects():
    """R&D 프로젝트 더미 데이터"""
    return [
        {'id': 1, 'project_id': 'RD-2024-001', 'title': '신경향제제 개발', 'status': 'development', 'priority': 'high', 'team_lead': '김연구', 'progress': 65, 'budget': 350, 'spent': 220, 'target_date': '2025-06-30'},
        {'id': 2, 'project_id': 'RD-2024-002', 'title': '나노마이크로캡슐 기술', 'status': 'research', 'priority': 'high', 'team_lead': '이연구', 'progress': 40, 'budget': 280, 'spent': 95, 'target_date': '2025-09-30'},
        {'id': 3, 'project_id': 'RD-2024-003', 'title': '천연물추출 신소재', 'status': 'testing', 'priority': 'medium', 'team_lead': '박연구', 'progress': 85, 'budget': 180, 'spent': 150, 'target_date': '2025-03-31'},
        {'id': 4, 'project_id': 'RD-2024-004', 'title': '의약디바이스 융합', 'status': 'planning', 'priority': 'medium', 'team_lead': '최연구', 'progress': 15, 'budget': 420, 'spent': 35, 'target_date': '2025-12-31'},
    ]


def get_dummy_innovation_metrics():
    """혁신 지표 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'patent', 'metric_name': '특허출원 수', 'target': 12, 'actual': 15, 'achievement_rate': 125},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'rd_investment', 'metric_name': 'R&D 투자액', 'target': 500, 'actual': 520, 'achievement_rate': 104},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'new_product', 'metric_name': '신제품 출시', 'target': 5, 'actual': 4, 'achievement_rate': 80},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'technology', 'metric_name': '기술이전 건수', 'target': 3, 'actual': 3, 'achievement_rate': 100},
    ]


def get_dummy_patents():
    """특허 더미 데이터"""
    return [
        {'id': 1, 'application_number': '10-2024-001234', 'registration_number': '10-2567890', 'title': '경과제제 조성물 및 그 제조방법', 'status': 'registered', 'ip_type': 'patent', 'inventor': '김연구, 이연구', 'application_date': '2024-01-15', 'registration_date': '2024-08-20'},
        {'id': 2, 'application_number': '10-2024-005678', 'registration_number': None, 'title': '나노캡슐 함유 약제학적 조성물', 'status': 'pending', 'ip_type': 'patent', 'inventor': '박연구', 'application_date': '2024-03-22', 'registration_date': None},
        {'id': 3, 'application_number': '10-2024-009012', 'registration_number': None, 'title': '천연물추출 신소재 및 그 용도', 'status': 'examining', 'ip_type': 'patent', 'inventor': '최연구', 'application_date': '2024-06-10', 'registration_date': None},
    ]


def get_dummy_rd_personnel():
    """R&D 인원 더미 데이터"""
    return [
        {'id': 1, 'employee_id': 'EMP-001', 'name': '김연구', 'department': '제제연구소', 'level': 'director', 'specialty': '약제학', 'years_of_experience': 20, 'publications': 45, 'patents': 12},
        {'id': 2, 'employee_id': 'EMP-002', 'name': '이연구', 'department': '나노연구소', 'level': 'manager', 'specialty': '나노기술', 'years_of_experience': 15, 'publications': 32, 'patents': 8},
        {'id': 3, 'employee_id': 'EMP-003', 'name': '박연구', 'department': '천연물연구소', 'level': 'lead', 'specialty': '천연물화학', 'years_of_experience': 12, 'publications': 28, 'patents': 6},
        {'id': 4, 'employee_id': 'EMP-004', 'name': '최연구', 'department': '제제연구소', 'level': 'researcher', 'specialty': '제제공학', 'years_of_experience': 5, 'publications': 8, 'patents': 2},
    ]


def get_dummy_technology_roadmap():
    """기술 로드맵 더미 데이터"""
    return [
        {'id': 1, 'technology_name': '신경향제제 기술', 'description': '약물 방출 제어 기술', 'phase': 'development', 'status': 'on_track', 'target_year': 2025, 'progress': 60, 'required_investment': 350},
        {'id': 2, 'technology_name': '나노마이크로캡슐', 'description': '나노 기반 약물 전달 시스템', 'phase': 'research', 'status': 'on_track', 'target_year': 2026, 'progress': 35, 'required_investment': 420},
        {'id': 3, 'technology_name': '천연물추출 플랫폼', 'description': '천연물 표준화 추출 기술', 'phase': 'development', 'status': 'delayed', 'target_year': 2025, 'progress': 45, 'required_investment': 280},
    ]


def get_dummy_rd_budget():
    """R&D 예산 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'category': '인건비', 'allocated_budget': 280, 'spent_budget': 250, 'remaining_budget': 30, 'execution_rate': 89.3},
        {'id': 2, 'fiscal_year': 2024, 'category': '연구장비', 'allocated_budget': 180, 'spent_budget': 165, 'remaining_budget': 15, 'execution_rate': 91.7},
        {'id': 3, 'fiscal_year': 2024, 'category': '시약재료', 'allocated_budget': 120, 'spent_budget': 110, 'remaining_budget': 10, 'execution_rate': 91.7},
        {'id': 4, 'fiscal_year': 2024, 'category': '기술료', 'allocated_budget': 80, 'spent_budget': 72, 'remaining_budget': 8, 'execution_rate': 90.0},
    ]


class RDProjectViewSet(viewsets.ModelViewSet):
    queryset = RDProject.objects.all()
    serializer_class = RDProjectSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['project_id', 'title', 'team_lead']
    ordering_fields = ['created_at', 'progress', 'budget', 'target_date']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_rd_projects())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_rd_projects()
            return Response({
                'total_projects': len(dummy),
                'total_budget': sum(d['budget'] for d in dummy),
                'total_spent': sum(d['spent'] for d in dummy),
                'avg_progress': round(sum(d['progress'] for d in dummy) / len(dummy), 2),
                'by_status': {'planning': 1, 'research': 1, 'development': 1, 'testing': 1, 'completed': 0, 'cancelled': 0},
                'by_priority': {'high': 2, 'medium': 2, 'low': 0}
            })

        summary = {
            'total_projects': queryset.count(),
            'total_budget': queryset.aggregate(total=Sum('budget'))['total'] or 0,
            'total_spent': queryset.aggregate(total=Sum('spent'))['total'] or 0,
            'avg_progress': queryset.aggregate(avg=Avg('progress'))['avg'] or 0,
            'by_status': {},
            'by_priority': {}
        }

        for status_code, _ in RDProject.STATUS_CHOICES:
            summary['by_status'][status_code] = queryset.filter(status=status_code).count()

        for priority_code, _ in RDProject.PRIORITY_CHOICES:
            summary['by_priority'][priority_code] = queryset.filter(priority=priority_code).count()

        return Response(summary)

    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_rd_projects() if d['status'] in ['planning', 'research', 'development', 'testing']])
        active_statuses = ['planning', 'research', 'development', 'testing']
        active = queryset.filter(status__in=active_statuses)
        return Response(self.get_serializer(active, many=True).data)


class InnovationMetricViewSet(viewsets.ModelViewSet):
    queryset = InnovationMetric.objects.all()
    serializer_class = InnovationMetricSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['metric_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'achievement_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_innovation_metrics())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            dummy = get_dummy_innovation_metrics()
            result = {'patent': [d for d in dummy if d['category'] == 'patent'],
                      'rd_investment': [d for d in dummy if d['category'] == 'rd_investment'],
                      'new_product': [d for d in dummy if d['category'] == 'new_product'],
                      'technology': [d for d in dummy if d['category'] == 'technology']}
            return Response(result)

        result = {}
        for cat_code, cat_name in InnovationMetric.CATEGORY_CHOICES:
            result[cat_code] = self.get_serializer(
                queryset.filter(category=cat_code), many=True
            ).data

        return Response(result)


class PatentViewSet(viewsets.ModelViewSet):
    queryset = Patent.objects.all()
    serializer_class = PatentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'ip_type']
    search_fields = ['application_number', 'registration_number', 'title', 'inventor']
    ordering_fields = ['application_date', 'registration_date']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_patents())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_patents()
            return Response({
                'total': len(dummy),
                'by_status': {'registered': 1, 'pending': 1, 'examining': 1, 'granted': 0, 'rejected': 0, 'expired': 0},
                'by_type': {'patent': 3, 'trademark': 0, 'copyright': 0}
            })

        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_type': {}
        }

        for status_code, _ in Patent.STATUS_CHOICES:
            stats['by_status'][status_code] = queryset.filter(status=status_code).count()

        for type_code, _ in Patent.TYPE_CHOICES:
            stats['by_type'][type_code] = queryset.filter(ip_type=type_code).count()

        return Response(stats)


class RDPersonnelViewSet(viewsets.ModelViewSet):
    queryset = RDPersonnel.objects.all()
    serializer_class = RDPersonnelSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'level']
    search_fields = ['employee_id', 'name', 'specialty']
    ordering_fields = ['years_of_experience', 'publications', 'patents', 'join_date']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_rd_personnel())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_rd_personnel()
            dept_map = {}
            for d in dummy:
                if d['department'] not in dept_map:
                    dept_map[d['department']] = {'count': 0, 'total_experience': 0, 'total_publications': 0, 'total_patents': 0}
                dept_map[d['department']]['count'] += 1
                dept_map[d['department']]['total_experience'] += d['years_of_experience']
                dept_map[d['department']]['total_publications'] += d['publications']
                dept_map[d['department']]['total_patents'] += d['patents']

            result = [{'department': k, 'count': v['count'], 'avg_experience': round(v['total_experience'] / v['count'], 1),
                       'total_publications': v['total_publications'], 'total_patents': v['total_patents']} for k, v in dept_map.items()]
            return Response(sorted(result, key=lambda x: x['count'], reverse=True))

        departments = queryset.values('department').annotate(
            count=Count('id'),
            avg_experience=Avg('years_of_experience'),
            total_publications=Sum('publications'),
            total_patents=Sum('patents')
        ).order_by('-count')

        return Response(list(departments))

    @action(detail=False, methods=['get'])
    def experts(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_rd_personnel() if d['level'] in ['lead', 'manager', 'director']])
        experts = queryset.filter(
            level__in=['lead', 'manager', 'director']
        ).order_by('-years_of_experience')
        return Response(self.get_serializer(experts, many=True).data)


class TechnologyRoadmapViewSet(viewsets.ModelViewSet):
    queryset = TechnologyRoadmap.objects.all()
    serializer_class = TechnologyRoadmapSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['phase', 'status', 'target_year']
    search_fields = ['technology_name', 'description']
    ordering_fields = ['target_year', 'progress', 'required_investment']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_technology_roadmap())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_phase(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_technology_roadmap()
            return Response({
                'research': {'name': '연구', 'items': [d for d in dummy if d['phase'] == 'research'], 'total_investment': sum(d['required_investment'] for d in dummy if d['phase'] == 'research')},
                'development': {'name': '개발', 'items': [d for d in dummy if d['phase'] == 'development'], 'total_investment': sum(d['required_investment'] for d in dummy if d['phase'] == 'development')},
                'commercialization': {'name': '사업화', 'items': [d for d in dummy if d['phase'] == 'commercialization'], 'total_investment': sum(d['required_investment'] for d in dummy if d['phase'] == 'commercialization'])},
            })

        result = {}
        for phase_code, phase_name in TechnologyRoadmap.PHASE_CHOICES:
            items = queryset.filter(phase=phase_code)
            result[phase_code] = {
                'name': phase_name,
                'items': self.get_serializer(items, many=True).data,
                'total_investment': items.aggregate(total=Sum('required_investment'))['total'] or 0
            }

        return Response(result)


class RDBudgetViewSet(viewsets.ModelViewSet):
    queryset = RDBudget.objects.all()
    serializer_class = RDBudgetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'category']
    search_fields = ['category']
    ordering_fields = ['fiscal_year', 'allocated_budget', 'execution_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_rd_budget())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = get_dummy_rd_budget()
            return Response({
                'total_allocated': sum(d['allocated_budget'] for d in dummy),
                'total_spent': sum(d['spent_budget'] for d in dummy),
                'total_remaining': sum(d['remaining_budget'] for d in dummy),
                'avg_execution_rate': round(sum(d['execution_rate'] for d in dummy) / len(dummy), 2),
            })

        summary = queryset.aggregate(
            total_allocated=Sum('allocated_budget'),
            total_spent=Sum('spent_budget'),
            total_remaining=Sum('remaining_budget'),
            avg_execution_rate=Avg('execution_rate')
        )
        return Response(summary)
