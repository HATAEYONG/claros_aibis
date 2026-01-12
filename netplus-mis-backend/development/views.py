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


class RDProjectViewSet(viewsets.ModelViewSet):
    queryset = RDProject.objects.all()
    serializer_class = RDProjectSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['project_id', 'title', 'team_lead']
    ordering_fields = ['created_at', 'progress', 'budget', 'target_date']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

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
        active_statuses = ['planning', 'research', 'development', 'testing']
        active = self.get_queryset().filter(status__in=active_statuses)
        return Response(self.get_serializer(active, many=True).data)


class InnovationMetricViewSet(viewsets.ModelViewSet):
    queryset = InnovationMetric.objects.all()
    serializer_class = InnovationMetricSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['metric_name']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'achievement_rate']

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

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

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()

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

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        departments = self.get_queryset().values('department').annotate(
            count=Count('id'),
            avg_experience=Avg('years_of_experience'),
            total_publications=Sum('publications'),
            total_patents=Sum('patents')
        ).order_by('-count')

        return Response(list(departments))

    @action(detail=False, methods=['get'])
    def experts(self, request):
        experts = self.get_queryset().filter(
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

    @action(detail=False, methods=['get'])
    def by_phase(self, request):
        result = {}
        for phase_code, phase_name in TechnologyRoadmap.PHASE_CHOICES:
            items = self.get_queryset().filter(phase=phase_code)
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

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)

        summary = queryset.aggregate(
            total_allocated=Sum('allocated_budget'),
            total_spent=Sum('spent_budget'),
            total_remaining=Sum('remaining_budget'),
            avg_execution_rate=Avg('execution_rate')
        )
        return Response(summary)
