from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg, Count

from .models import (
    ExecutiveSummary, DepartmentComparison, KeyMetricSummary,
    RiskOpportunity, Recommendation, MonthlyReport
)
from .serializers import (
    ExecutiveSummarySerializer, DepartmentComparisonSerializer,
    KeyMetricSummarySerializer, RiskOpportunitySerializer,
    RecommendationSerializer, MonthlyReportSerializer
)


class ExecutiveSummaryViewSet(viewsets.ModelViewSet):
    queryset = ExecutiveSummary.objects.all()
    serializer_class = ExecutiveSummarySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'operating_profit']

    @action(detail=False, methods=['get'])
    def latest(self, request):
        latest = self.get_queryset().order_by('-fiscal_year', '-fiscal_month').first()
        if latest:
            return Response(self.get_serializer(latest).data)
        return Response({})

    @action(detail=False, methods=['get'])
    def trend(self, request):
        months = int(request.query_params.get('months', 12))
        data = self.get_queryset().order_by('-fiscal_year', '-fiscal_month')[:months]
        return Response(self.get_serializer(data, many=True).data)


class DepartmentComparisonViewSet(viewsets.ModelViewSet):
    queryset = DepartmentComparison.objects.all()
    serializer_class = DepartmentComparisonSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['department']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'profit', 'target_achievement']

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        return Response(self.get_serializer(queryset.order_by('-profit'), many=True).data)


class KeyMetricSummaryViewSet(viewsets.ModelViewSet):
    queryset = KeyMetricSummary.objects.all()
    serializer_class = KeyMetricSummarySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category', 'status', 'trend']
    search_fields = ['metric_name', 'category']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'change_rate']

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        result = {}
        for status_code, status_name in KeyMetricSummary.STATUS_CHOICES:
            result[status_code] = self.get_serializer(
                queryset.filter(status=status_code), many=True
            ).data

        return Response(result)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        # 주의/위험 상태인 지표만
        alerts = self.get_queryset().filter(status__in=['warning', 'critical'])
        return Response(self.get_serializer(alerts, many=True).data)


class RiskOpportunityViewSet(viewsets.ModelViewSet):
    queryset = RiskOpportunity.objects.all()
    serializer_class = RiskOpportunitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['item_type', 'priority', 'status', 'category']
    search_fields = ['title', 'description', 'owner']
    ordering_fields = ['priority', 'impact', 'probability', 'created_at']

    @action(detail=False, methods=['get'])
    def risks(self, request):
        risks = self.get_queryset().filter(item_type='risk')
        return Response(self.get_serializer(risks, many=True).data)

    @action(detail=False, methods=['get'])
    def opportunities(self, request):
        opportunities = self.get_queryset().filter(item_type='opportunity')
        return Response(self.get_serializer(opportunities, many=True).data)

    @action(detail=False, methods=['get'])
    def high_priority(self, request):
        high = self.get_queryset().filter(priority='high')
        return Response(self.get_serializer(high, many=True).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

        summary = {
            'total_risks': queryset.filter(item_type='risk').count(),
            'total_opportunities': queryset.filter(item_type='opportunity').count(),
            'high_priority_count': queryset.filter(priority='high').count(),
            'total_impact': queryset.aggregate(total=Sum('impact'))['total'] or 0,
            'by_status': {}
        }

        for status_code, _ in RiskOpportunity.STATUS_CHOICES:
            summary['by_status'][status_code] = queryset.filter(status=status_code).count()

        return Response(summary)


class RecommendationViewSet(viewsets.ModelViewSet):
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'priority', 'status']
    search_fields = ['title', 'description', 'proposed_by']
    ordering_fields = ['priority', 'expected_benefit', 'roi_estimate', 'created_at']

    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending = self.get_queryset().filter(status='pending')
        return Response(self.get_serializer(pending, many=True).data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        result = {}
        for cat_code, cat_name in Recommendation.CATEGORY_CHOICES:
            items = self.get_queryset().filter(category=cat_code)
            result[cat_code] = {
                'name': cat_name,
                'count': items.count(),
                'total_benefit': items.aggregate(total=Sum('expected_benefit'))['total'] or 0,
                'items': self.get_serializer(items, many=True).data
            }

        return Response(result)


class MonthlyReportViewSet(viewsets.ModelViewSet):
    queryset = MonthlyReport.objects.all()
    serializer_class = MonthlyReportSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'status']
    search_fields = ['title', 'summary', 'author']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'created_at']

    @action(detail=False, methods=['get'])
    def latest(self, request):
        latest = self.get_queryset().filter(status='published').order_by('-fiscal_year', '-fiscal_month').first()
        if latest:
            return Response(self.get_serializer(latest).data)
        return Response({})

    @action(detail=False, methods=['get'])
    def drafts(self, request):
        drafts = self.get_queryset().filter(status__in=['draft', 'review'])
        return Response(self.get_serializer(drafts, many=True).data)
