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


# 더미 데이터 헬퍼 함수
def get_dummy_esg_scores():
    """ESG 점수 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'environment_score': 78.5, 'social_score': 82.3, 'governance_score': 85.7, 'total_score': 82.2},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'environment_score': 76.8, 'social_score': 81.5, 'governance_score': 84.2, 'total_score': 80.8},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 10, 'environment_score': 75.2, 'social_score': 80.1, 'governance_score': 83.5, 'total_score': 79.6},
    ]


def get_dummy_carbon_emissions():
    """탄소 배출량 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'actual_emission': 8500, 'target_emission': 9000, 'reduction_amount': 500, 'reduction_rate': 5.56},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 11, 'actual_emission': 8800, 'target_emission': 9200, 'reduction_amount': 400, 'reduction_rate': 4.35},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 10, 'actual_emission': 9100, 'target_emission': 9500, 'reduction_amount': 400, 'reduction_rate': 4.21},
    ]


def get_dummy_energy_consumption():
    """에너지 소비 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'energy_source': 'electricity', 'consumption': 450000, 'unit': 'kWh', 'cost': 54},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'energy_source': 'gas', 'consumption': 12000, 'unit': 'm3', 'cost': 18},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'energy_source': 'water', 'consumption': 8500, 'unit': 'ton', 'cost': 8500000},
    ]


def get_dummy_4m2e_metrics():
    """4M2E 지표 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'man', 'metric_name': '교육참가율', 'target': 95, 'actual': 92, 'status': 'good'},
        {'id': 2, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'machine', 'metric_name': '설비가동률', 'target': 90, 'actual': 88, 'status': 'good'},
        {'id': 3, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'material', 'metric_name': '자재수율', 'target': 98, 'actual': 96, 'status': 'good'},
        {'id': 4, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'method', 'metric_name': '공정준수율', 'target': 100, 'actual': 100, 'status': 'excellent'},
        {'id': 5, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'environment', 'metric_name': '환경준수율', 'target': 100, 'actual': 100, 'status': 'excellent'},
        {'id': 6, 'fiscal_year': 2024, 'fiscal_month': 12, 'category': 'energy', 'metric_name': '에너지효율', 'target': 85, 'actual': 83, 'status': 'good'},
    ]


def get_dummy_env_projects():
    """환경 개선 프로젝트 더미 데이터"""
    return [
        {'id': 1, 'project_id': 'ENV-001', 'title': '태양광 설치', 'category': 'energy', 'status': 'in-progress', 'progress': 75, 'investment': 50, 'saving': 8.5},
        {'id': 2, 'project_id': 'ENV-002', 'title': '폐열회수 시스템', 'category': 'energy', 'status': 'completed', 'progress': 100, 'investment': 35, 'saving': 7},
        {'id': 3, 'project_id': 'ENV-003', 'title': '물 재활용 시스템', 'category': 'water', 'status': 'in-progress', 'progress': 60, 'investment': 20, 'saving': 4.5},
    ]


def get_dummy_social_responsibility():
    """사회적 책임 활동 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'activity_name': '지역사회 봉사', 'participants': 150, 'hours': 450, 'budget': 25},
        {'id': 2, 'fiscal_year': 2024, 'activity_name': '환경 캠페인', 'participants': 80, 'hours': 160, 'budget': 15},
        {'id': 3, 'fiscal_year': 2024, 'activity_name': '장학사업', 'participants': 20, 'hours': 200, 'budget': 50},
    ]


def get_dummy_governance_metrics():
    """지배구조 지표 더미 데이터"""
    return [
        {'id': 1, 'fiscal_year': 2024, 'metric_name': '이사회 독립성', 'target': 50, 'actual': 55, 'status': 'excellent'},
        {'id': 2, 'fiscal_year': 2024, 'metric_name': '감사위원회 구성', 'target': 100, 'actual': 100, 'status': 'excellent'},
        {'id': 3, 'fiscal_year': 2024, 'metric_name': '윤리준수율', 'target': 100, 'actual': 98, 'status': 'good'},
    ]


class ESGScoreViewSet(viewsets.ModelViewSet):
    """ESG 점수 ViewSet"""
    queryset = ESGScore.objects.all()
    serializer_class = ESGScoreSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_esg_scores())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """ESG 요약"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        latest = queryset.first()
        if not latest:
            # 더미 데이터 반환
            dummy = get_dummy_esg_scores()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if dummy:
                d = dummy[0]
                return Response({
                    'fiscal_year': d['fiscal_year'],
                    'fiscal_month': d['fiscal_month'],
                    'environment_score': d['environment_score'],
                    'social_score': d['social_score'],
                    'governance_score': d['governance_score'],
                    'total_score': d['total_score'],
                })
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

        if not queryset.exists():
            dummy = [d for d in get_dummy_esg_scores() if not year or d['fiscal_year'] == int(year)]
            return Response(dummy)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_carbon_emissions())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """탄소 배출량 트렌드"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = [d for d in get_dummy_carbon_emissions() if not year or d['fiscal_year'] == int(year)]
            return Response(dummy)

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

        if not emissions.exists():
            dummy = [d for d in get_dummy_carbon_emissions() if d['fiscal_year'] == int(year)]
            if dummy:
                return Response({
                    'fiscal_year': year,
                    'start_emission': dummy[0]['actual_emission'],
                    'end_emission': dummy[-1]['actual_emission'],
                    'total_reduction': dummy[0]['actual_emission'] - dummy[-1]['actual_emission'],
                    'reduction_rate': round((1 - dummy[-1]['actual_emission'] / dummy[0]['actual_emission']) * 100, 1),
                })
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_energy_consumption())
        return super().list(request, *args, **kwargs)

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

        if not queryset.exists():
            dummy = get_dummy_energy_consumption()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            return Response(dummy)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_4m2e_metrics())
        return super().list(request, *args, **kwargs)

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

        if not queryset.exists():
            dummy = get_dummy_4m2e_metrics()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            if month:
                dummy = [d for d in dummy if d['fiscal_month'] == int(month)]
            if category:
                dummy = [d for d in dummy if d['category'] == category]
            return Response(dummy)

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

        if not queryset.exists():
            dummy = get_dummy_4m2e_metrics()
            categories = ['man', 'machine', 'material', 'method', 'environment', 'energy']
            summary = {}
            for cat in categories:
                cat_metrics = [d for d in dummy if d['category'] == cat]
                achieved = len([d for d in cat_metrics if d['status'] in ['excellent', 'good']])
                total = len(cat_metrics)
                summary[cat] = {
                    'total_metrics': total,
                    'achieved': achieved,
                    'achievement_rate': round(achieved / total * 100, 1) if total else 0
                }
            return Response(summary)

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_env_projects())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """진행 중인 프로젝트"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = [d for d in get_dummy_env_projects() if d['status'] == 'in-progress']
            return Response(dummy)

        projects = queryset.filter(status='in-progress')
        serializer = EnvironmentalProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def investment_summary(self, request):
        """투자/절감 요약"""
        queryset = self.queryset

        if not queryset.exists():
            dummy = get_dummy_env_projects()
            return Response({
                'total_investment': sum(d['investment'] for d in dummy),
                'total_saving': sum(d['saving'] for d in dummy),
                'average_roi': round(sum(d['saving'] for d in dummy) / sum(d['investment'] for d in dummy) * 100, 1),
                'project_count': len(dummy),
            })

        total_investment = sum([p.investment for p in queryset])
        total_saving = sum([p.saving for p in queryset])
        avg_roi = (total_saving / total_investment * 100) if total_investment else 0

        return Response({
            'total_investment': total_investment,
            'total_saving': total_saving,
            'average_roi': round(avg_roi, 1),
            'project_count': queryset.count(),
        })


class SocialResponsibilityViewSet(viewsets.ModelViewSet):
    """사회적 책임 활동 ViewSet"""
    queryset = SocialResponsibility.objects.all()
    serializer_class = SocialResponsibilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fiscal_year']
    search_fields = ['activity_name']
    ordering = ['-fiscal_year', '-budget']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_social_responsibility())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """사회공헌 요약"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = get_dummy_social_responsibility()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response({
                'total_activities': len(dummy),
                'total_participants': sum(d['participants'] for d in dummy),
                'total_hours': sum(d['hours'] for d in dummy),
                'total_budget': sum(d['budget'] for d in dummy),
            })

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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            return Response(get_dummy_governance_metrics())
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def evaluation(self, request):
        """지배구조 평가"""
        year = request.query_params.get('year')

        queryset = self.queryset
        if year:
            queryset = queryset.filter(fiscal_year=year)

        if not queryset.exists():
            dummy = get_dummy_governance_metrics()
            if year:
                dummy = [d for d in dummy if d['fiscal_year'] == int(year)]
            return Response(dummy)

        serializer = GovernanceMetricSerializer(queryset, many=True)
        return Response(serializer.data)
