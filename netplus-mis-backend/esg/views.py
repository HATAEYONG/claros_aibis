from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    ESGScore, CarbonEmission, EnergyConsumption,
    FourM2EMetric, EnvironmentalProject, SocialResponsibility, GovernanceMetric
)
from .serializers import (
    ESGScoreSerializer, CarbonEmissionSerializer, EnergyConsumptionSerializer,
    FourM2EMetricSerializer, EnvironmentalProjectSerializer,
    EnvironmentalProjectListSerializer, SocialResponsibilitySerializer,
    GovernanceMetricSerializer
)


class ESGScoreViewSet(viewsets.ModelViewSet):
    """ESG 점수 ViewSet"""
    queryset = ESGScore.objects.all()
    serializer_class = ESGScoreSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """ESG 요약"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        latest = queryset.first()
        if not latest:
            return Response({'error': '데이터가 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'fiscal_year': latest.fiscal_year,
            'fiscal_month': latest.fiscal_month,
            'environment_score': latest.environment_score,
            'social_score': latest.social_score,
            'governance_score': latest.governance_score,
            'total_score': latest.total_score,
        })

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """ESG 점수 트렌드"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        scores = queryset.order_by('fiscal_month')
        serializer = ESGScoreSerializer(scores, many=True)
        return Response(serializer.data)


class CarbonEmissionViewSet(viewsets.ModelViewSet):
    """탄소 배출량 ViewSet"""
    queryset = CarbonEmission.objects.all()
    serializer_class = CarbonEmissionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """탄소 배출량 트렌드"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        emissions = queryset.order_by('fiscal_month')
        serializer = CarbonEmissionSerializer(emissions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def reduction_summary(self, request):
        """탄소 감축 요약"""
        year = request.query_params.get('year')

        if not year:
            return Response(
                {'error': '연도(year) 파라미터가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        emissions = self.queryset.filter(fiscal_year=year).order_by('fiscal_month')
        if not emissions:
            return Response({'error': '데이터가 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

        first = emissions.first()
        last = emissions.last()

        return Response({
            'fiscal_year': year,
            'start_emission': first.actual_emission,
            'end_emission': last.actual_emission,
            'total_reduction': float(first.actual_emission - last.actual_emission),
            'reduction_rate': round((1 - float(last.actual_emission / first.actual_emission)) * 100, 1),
        })


class EnergyConsumptionViewSet(viewsets.ModelViewSet):
    """에너지 소비 ViewSet"""
    queryset = EnergyConsumption.objects.all()
    serializer_class = EnergyConsumptionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'energy_source']
    ordering = ['-fiscal_year', '-fiscal_month']

    @action(detail=False, methods=['get'])
    def by_source(self, request):
        """에너지원별 소비"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        serializer = EnergyConsumptionSerializer(queryset, many=True)
        return Response(serializer.data)


class FourM2EMetricViewSet(viewsets.ModelViewSet):
    """4M2E 지표 ViewSet"""
    queryset = FourM2EMetric.objects.all()
    serializer_class = FourM2EMetricSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month', 'category', 'status']
    search_fields = ['metric_name']
    ordering = ['-fiscal_year', '-fiscal_month', 'category']

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """분류별 지표"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        category = request.query_params.get('category')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)
        if category:
            queryset = queryset.filter(category=category)

        serializer = FourM2EMetricSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """4M2E 요약"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)
        if month:
            queryset = queryset.filter(fiscal_month=month)

        categories = ['man', 'machine', 'material', 'method', 'environment', 'energy']
        summary = {}

        for cat in categories:
            metrics = queryset.filter(category=cat)
            if metrics:
                achieved = metrics.filter(status__in=['excellent', 'good']).count()
                total = metrics.count()
                summary[cat] = {
                    'total_metrics': total,
                    'achieved': achieved,
                    'achievement_rate': round(achieved / total * 100, 1) if total else 0
                }

        return Response(summary)


class EnvironmentalProjectViewSet(viewsets.ModelViewSet):
    """환경 개선 프로젝트 ViewSet"""
    queryset = EnvironmentalProject.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['project_id', 'title']
    ordering_fields = ['progress', 'investment', 'saving']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EnvironmentalProjectListSerializer
        return EnvironmentalProjectSerializer

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """진행 중인 프로젝트"""
        projects = self.queryset.filter(status='in-progress')
        serializer = EnvironmentalProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def investment_summary(self, request):
        """투자/절감 요약"""
        projects = self.queryset.all()

        total_investment = sum([p.investment for p in projects])
        total_saving = sum([p.saving for p in projects])
        avg_roi = (total_saving / total_investment * 100) if total_investment else 0

        return Response({
            'total_investment': total_investment,
            'total_saving': total_saving,
            'average_roi': round(avg_roi, 1),
            'project_count': projects.count(),
        })


class SocialResponsibilityViewSet(viewsets.ModelViewSet):
    """사회적 책임 활동 ViewSet"""
    queryset = SocialResponsibility.objects.all()
    serializer_class = SocialResponsibilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year']
    search_fields = ['activity_name']
    ordering = ['-fiscal_year', '-budget']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """사회공헌 요약"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        return Response({
            'total_activities': queryset.count(),
            'total_participants': sum([a.participants for a in queryset]),
            'total_hours': sum([a.hours for a in queryset]),
            'total_budget': sum([a.budget for a in queryset]),
        })


class GovernanceMetricViewSet(viewsets.ModelViewSet):
    """지배구조 지표 ViewSet"""
    queryset = GovernanceMetric.objects.all()
    serializer_class = GovernanceMetricSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'status']
    search_fields = ['metric_name']
    ordering = ['-fiscal_year']

    @action(detail=False, methods=['get'])
    def evaluation(self, request):
        """지배구조 평가"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        serializer = GovernanceMetricSerializer(queryset, many=True)
        return Response(serializer.data)
