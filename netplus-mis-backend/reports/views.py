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


# 더미 데이터 헬퍼 함수
def get_dummy_executive_summary():
    """경영진 요약 더미 데이터"""
    return {
        'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12,
        'revenue': 15200, 'revenue_growth': 8.5,
        'operating_profit': 1200, 'operating_margin': 8.0,
        'net_profit': 950, 'net_margin': 6.3,
        'total_assets': 18500, 'total_liabilities': 7500,
        'total_equity': 11000, 'employee_count': 850,
        'production_volume': 12500000, 'quality_rate': 98.5,
        'summary': '2024년 12월 호실적 달성. 매출 8.5% 성장, 영업이익율 8.0% 유지.',
    }


def get_dummy_department_comparison():
    """부문별 비교 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '의약품', 'revenue': 8500, 'cost': 5200, 'profit': 3300, 'margin': 38.82, 'target_achievement': 105.5},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '화장품', 'revenue': 4200, 'cost': 2800, 'profit': 1400, 'margin': 33.33, 'target_achievement': 102.1},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'department': '건강기능식품', 'revenue': 2300, 'cost': 1500, 'profit': 800, 'margin': 34.78, 'target_achievement': 98.5},
    ]


def get_dummy_key_metrics():
    """핵심 지표 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'metric_name': '매출달성율', 'category': '재무', 'current_value': 105.5, 'target': 100, 'change_rate': 5.5, 'status': 'normal', 'trend': 'up'},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'metric_name': '영업이익율', 'category': '재무', 'current_value': 8.5, 'target': 8.0, 'change_rate': 0.5, 'status': 'normal', 'trend': 'up'},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'metric_name': '생산능력가동률', 'category': '생산', 'current_value': 92.5, 'target': 90, 'change_rate': 2.5, 'status': 'normal', 'trend': 'up'},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'metric_name': '품질수율', 'category': '품질', 'current_value': 98.2, 'target': 98, 'change_rate': 0.2, 'status': 'normal', 'trend': 'stable'},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'metric_name': '재고회전율', 'category': '물류', 'current_value': 5.5, 'target': 6.0, 'change_rate': -0.5, 'status': 'warning', 'trend': 'down'},
    ]


def get_dummy_risks_opportunities():
    """리스크/기회 더미 데이터"""
    return [
        {'id': 1, 'item_type': 'risk', 'title': '원자재 가격 상승', 'description': '주요 원료가격 5% 상승으로 인한 원가 압박', 'priority': 'high', 'status': 'open', 'category': '원가', 'impact': 80, 'probability': 70, 'owner': '구매팀'},
        {'id': 2, 'item_type': 'opportunity', 'title': '신규 시장 진입', 'description': '동남아 시장 진출로 매출 10% 증대 가능', 'priority': 'medium', 'status': 'open', 'category': '매출', 'impact': 90, 'probability': 60, 'owner': '영업팀'},
        {'id': 3, 'item_type': 'risk', 'title': '환율 변동성', 'description': '달러/원 환율 변동으로 인한 수출 리스크', 'priority': 'medium', 'status': 'monitoring', 'category': '재무', 'impact': 60, 'probability': 50, 'owner': '재무팀'},
    ]


def get_dummy_recommendations():
    """개선과제 더미 데이터"""
    return [
        {'id': 1, 'title': '자재비 절감 방안', 'description': '대체 원료 개발 및 다중 공급처 확보', 'category': '원가', 'priority': 'high', 'status': 'pending', 'expected_benefit': 500, 'roi_estimate': 150, 'proposed_by': '구매팀'},
        {'id': 2, 'title': '자동화 라인 확대', 'description': '포장 공정 자동화로 인건비 절감', 'category': '생산', 'priority': 'medium', 'status': 'in_progress', 'expected_benefit': 300, 'roi_estimate': 200, 'proposed_by': '생산팀'},
        {'id': 3, 'title': '온라인 채널 강화', 'description': '이커머스 플랫폼 입점으로 신규 고객 확보', 'category': '영업', 'priority': 'high', 'status': 'pending', 'expected_benefit': 800, 'roi_estimate': 180, 'proposed_by': '마케팅팀'},
    ]


def get_dummy_monthly_report():
    """월간 보고서 더미 데이터"""
    return {
        'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'status': 'published',
        'title': '2024년 12월 경영보고서', 'author': '경영기획팀',
        'summary': '2024년 12월 호실적으로 마감. 전 사업부문 목표 달성.',
        'key_highlights': '매출 8.5% 성장, 영업이익 1.2조원 달성',
        'content': '상세 내용...',
    }


class ExecutiveSummaryViewSet(viewsets.ModelViewSet):
    queryset = ExecutiveSummary.objects.all()
    serializer_class = ExecutiveSummarySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'operating_profit']

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([get_dummy_executive_summary()])
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response(get_dummy_executive_summary())
        latest = queryset.order_by('-fiscal_year', '-fiscal_month').first()
        if latest:
            return Response(self.get_serializer(latest).data)
        return Response({})

    @action(detail=False, methods=['get'])
    def trend(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([get_dummy_executive_summary()])
        months = int(request.query_params.get('months', 12))
        data = queryset.order_by('-fiscal_year', '-fiscal_month')[:months]
        return Response(self.get_serializer(data, many=True).data)


class DepartmentComparisonViewSet(viewsets.ModelViewSet):
    queryset = DepartmentComparison.objects.all()
    serializer_class = DepartmentComparisonSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['department']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'revenue', 'profit', 'target_achievement']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_department_comparison())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            return Response(sorted(get_dummy_department_comparison(), key=lambda x: x['profit'], reverse=True))

        return Response(self.get_serializer(queryset.order_by('-profit'), many=True).data)


class KeyMetricSummaryViewSet(viewsets.ModelViewSet):
    queryset = KeyMetricSummary.objects.all()
    serializer_class = KeyMetricSummarySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category', 'status', 'trend']
    search_fields = ['metric_name', 'category']
    ordering_fields = ['fiscal_year', 'fiscal_month', 'change_rate']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_key_metrics())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        queryset = self.get_queryset()
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        if not queryset.exists():
            result = {'normal': get_dummy_key_metrics(), 'warning': [], 'critical': []}
            return Response(result)

        result = {}
        for status_code, status_name in KeyMetricSummary.STATUS_CHOICES:
            result[status_code] = self.get_serializer(
                queryset.filter(status=status_code), many=True
            ).data

        return Response(result)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response([d for d in get_dummy_key_metrics() if d['status'] in ['warning', 'critical']])

        alerts = queryset.filter(status__in=['warning', 'critical'])
        return Response(self.get_serializer(alerts, many=True).data)


class RiskOpportunityViewSet(viewsets.ModelViewSet):
    queryset = RiskOpportunity.objects.all()
    serializer_class = RiskOpportunitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['item_type', 'priority', 'status', 'category']
    search_fields = ['title', 'description', 'owner']
    ordering_fields = ['priority', 'impact', 'probability', 'created_at']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_risks_opportunities())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def risks(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_risks_opportunities() if d['item_type'] == 'risk'])
        risks = queryset.filter(item_type='risk')
        return Response(self.get_serializer(risks, many=True).data)

    @action(detail=False, methods=['get'])
    def opportunities(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_risks_opportunities() if d['item_type'] == 'opportunity'])
        opportunities = queryset.filter(item_type='opportunity')
        return Response(self.get_serializer(opportunities, many=True).data)

    @action(detail=False, methods=['get'])
    def high_priority(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_risks_opportunities() if d['priority'] == 'high'])
        high = queryset.filter(priority='high')
        return Response(self.get_serializer(high, many=True).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            dummy = get_dummy_risks_opportunities()
            return Response({
                'total_risks': len([d for d in dummy if d['item_type'] == 'risk']),
                'total_opportunities': len([d for d in dummy if d['item_type'] == 'opportunity']),
                'high_priority_count': len([d for d in dummy if d['priority'] == 'high']),
                'total_impact': sum(d['impact'] for d in dummy),
                'by_status': {'open': len([d for d in dummy if d['status'] == 'open']), 'monitoring': len([d for d in dummy if d['status'] == 'monitoring']), 'closed': 0},
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_recommendations())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([d for d in get_dummy_recommendations() if d['status'] == 'pending'])
        pending = queryset.filter(status='pending')
        return Response(self.get_serializer(pending, many=True).data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        queryset = self.get_queryset()

        if not queryset.exists():
            result = {'cost': {'name': '원가', 'count': 1, 'total_benefit': 500, 'items': [get_dummy_recommendations()[0]]},
                      'production': {'name': '생산', 'count': 1, 'total_benefit': 300, 'items': [get_dummy_recommendations()[1]]},
                      'sales': {'name': '영업', 'count': 1, 'total_benefit': 800, 'items': [get_dummy_recommendations()[2]]}}
            return Response(result)

        result = {}
        for cat_code, cat_name in Recommendation.CATEGORY_CHOICES:
            items = queryset.filter(category=cat_code)
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response([get_dummy_monthly_report()])
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response(get_dummy_monthly_report())
        latest = queryset.filter(status='published').order_by('-fiscal_year', '-fiscal_month').first()
        if latest:
            return Response(self.get_serializer(latest).data)
        return Response({})

    @action(detail=False, methods=['get'])
    def drafts(self, request):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response([])
        drafts = queryset.filter(status__in=['draft', 'review'])
        return Response(self.get_serializer(drafts, many=True).data)
