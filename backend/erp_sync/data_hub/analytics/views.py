# -*- coding: utf-8 -*-
"""
분석 레이어 API 뷰
KPI 및 KRI 뷰셋
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from utils.export_import import ExportImportMixin
from utils.batch_operations import BatchOperationsMixin

from .models import KPIDefinition, KPIFact, KRIDefinition, KRIFact
from .serializers import (
    KPIDefinitionSerializer, KPIFactSerializer,
    KPIDefinitionDetailSerializer,
    KRIDefinitionSerializer, KRIFactSerializer
)
from .kpi_engine import KPIRegistry, UnifiedKPIEngine


class KPIDefinitionViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """KPI 정의 ViewSet"""

    serializer_class = KPIDefinitionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'kpi_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kpi_type', 'domain', 'is_active']
    search_fields = ['kpi_code', 'kpi_name', 'kpi_name_en', 'description']
    ordering_fields = ['kpi_code', 'kpi_name', 'created_at']
    ordering = ['domain', 'kpi_code']

    def get_queryset(self):
        return KPIDefinition.objects.select_related('owner_department').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return KPIDefinitionDetailSerializer
        return KPIDefinitionSerializer

    def get_export_field_names(self):
        return {
            'kpi_code': 'KPI 코드',
            'kpi_name': 'KPI명',
            'kpi_type': 'KPI 유형',
            'domain': '도메인',
            'unit': '단위',
            'target_direction': '목표 방향',
            'threshold_warning': '경고 기준',
            'threshold_critical': '위험 기준',
        }

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """KPI 카테고리 목록"""
        categories = KPIRegistry.get_categories()
        return Response({'categories': categories})

    @action(detail=False, methods=['get'])
    def registry(self, request):
        """KPI 레지스트리 전체 조회"""
        registry = KPIRegistry.get_all_kpi_definitions()
        return Response({'registry': registry})

    @action(detail=False, methods=['post'])
    def bulk_calculate(self, request):
        """
        대량 KPI 계산

        Request Body:
        {
            "kpi_codes": ["F001", "F002", ...],  // optional
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "plant": "P1",  // optional
            "line": "L1",  // optional
            "department": "D1"  // optional
        }
        """
        from datetime import datetime

        kpi_codes = request.data.get('kpi_codes')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {'error': 'start_date와 end_date가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        engine = UnifiedKPIEngine()
        dimensions = {
            'plant': request.data.get('plant'),
            'line': request.data.get('line'),
            'department': request.data.get('department'),
        }

        results = engine.calculate_kpis_for_period(
            start_date=start_date,
            end_date=end_date,
            kpi_codes=kpi_codes,
            **dimensions
        )

        # 팩트 저장
        saved_count = 0
        failed_count = 0
        for result in results:
            if engine.save_kpi_fact(result):
                saved_count += 1
            else:
                failed_count += 1

        return Response({
            'total': len(results),
            'saved': saved_count,
            'failed': failed_count,
            'message': f'{saved_count}개 KPI 팩트 저장 완료'
        })

    @action(detail=False, methods=['post'])
    def sync_registry(self, request):
        """
        KPI 레지스트리 동기화
        레지스트리에 정의된 KPI를 DB에 생성/업데이트
        """
        from django.db import transaction

        created_count = 0
        updated_count = 0
        errors = []

        registry = KPIRegistry.get_all_kpi_definitions()

        with transaction.atomic():
            for kpi_code, kpi_def in registry.items():
                try:
                    kpi_obj, created = KPIDefinition.objects.update_or_create(
                        kpi_code=kpi_def['code'],
                        defaults={
                            'kpi_name': kpi_def['name'],
                            'kpi_name_en': kpi_def['name_en'],
                            'kpi_type': kpi_def['type'],
                            'domain': kpi_def['category'],
                            'description': kpi_def['description'],
                            'aggregation_method': kpi_def['aggregation_method'],
                            'unit': kpi_def['unit'],
                            'target_direction': kpi_def['target_direction'],
                            'calculation_logic': kpi_def['formula'],
                            'is_active': True,
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                except Exception as e:
                    errors.append({'kpi_code': kpi_code, 'error': str(e)})

        return Response({
            'created': created_count,
            'updated': updated_count,
            'failed': len(errors),
            'errors': errors,
            'message': f'KPI 레지스트리 동기화 완료: {created_count}개 생성, {updated_count}개 업데이트'
        })


class KPIFactViewSet(ExportImportMixin, viewsets.ModelViewSet):
    """KPI 팩트 ViewSet"""

    serializer_class = KPIFactSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'fact_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kpi', 'date', 'year', 'quarter', 'month', 'plant', 'line', 'status']
    search_fields = ['kpi__kpi_code', 'kpi__kpi_name', 'plant', 'line']
    ordering_fields = ['date', 'actual_value', 'created_at']
    ordering = ['-date', 'kpi']

    def get_queryset(self):
        return KPIFact.objects.select_related(
            'kpi', 'product', 'vendor', 'customer'
        ).all()

    def get_export_field_names(self):
        return {
            'kpi_code': 'KPI 코드',
            'kpi_name': 'KPI명',
            'date': '날짜',
            'plant': '공장',
            'line': '라인',
            'actual_value': '실적값',
            'target_value': '목표값',
            'achievement_rate': '달성율(%)',
            'status': '상태',
        }

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        최근 KPI 실적 조회

        Query Parameters:
        - kpi_codes: 쉼표로 구분된 KPI 코드 (optional)
        - plant: 공장 코드 (optional)
        - limit: 반환 개수 (default: 100)
        """
        kpi_codes_param = request.query_params.get('kpi_codes')
        plant = request.query_params.get('plant')
        limit = int(request.query_params.get('limit', 100))

        queryset = self.get_queryset()

        if kpi_codes_param:
            kpi_codes = kpi_codes_param.split(',')
            queryset = queryset.filter(kpi__kpi_code__in=kpi_codes)

        if plant:
            queryset = queryset.filter(plant=plant)

        # 각 KPI별 최근 팩트 조회
        from django.db.models import Max

        latest_fact_ids = []
        for kpi in KPIDefinition.objects.all():
            kpi_facts = queryset.filter(kpi=kpi).order_by('-date')[:1]
            if kpi_facts:
                latest_fact_ids.append(kpi_facts[0].fact_id)

        results = KPIFact.objects.filter(fact_id__in=latest_fact_ids).order_by('-date')[:limit]

        serializer = self.get_serializer(results, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        KPI 요약 통계

        Query Parameters:
        - year: 연도 (default: 현재 연도)
        - quarter: 분기 (optional)
        - month: 월 (optional)
        """
        from django.db.models import Count, Avg

        year = int(request.query_params.get('year', timezone.now().year))
        quarter = request.query_params.get('quarter')
        month = request.query_params.get('month')

        queryset = self.get_queryset().filter(year=year)

        if quarter:
            queryset = queryset.filter(quarter=quarter)
        if month:
            queryset = queryset.filter(month=month)

        # 상태별 통계
        status_stats = {}
        for status_choice in ['good', 'warning', 'critical', 'neutral']:
            count = queryset.filter(status=status_choice).count()
            status_stats[status_choice] = count

        # KPI별 통계
        kpi_stats = queryset.values('kpi__kpi_code', 'kpi__kpi_name').annotate(
            count=Count('fact_id'),
            avg_value=Avg('actual_value')
        ).order_by('-avg_value')

        return Response({
            'period': {'year': year, 'quarter': quarter, 'month': month},
            'status_distribution': status_stats,
            'kpi_summary': list(kpi_stats),
            'total_facts': queryset.count()
        })


class KRIDefinitionViewSet(ExportImportMixin, BatchOperationsMixin, viewsets.ModelViewSet):
    """KRI 정의 ViewSet"""

    serializer_class = KRIDefinitionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'kri_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kri_type', 'domain', 'is_active']
    search_fields = ['kri_code', 'kri_name', 'kri_name_en', 'description']
    ordering_fields = ['kri_code', 'kri_name', 'created_at']
    ordering = ['domain', 'kri_code']

    def get_queryset(self):
        return KRIDefinition.objects.select_related('owner_department').all()

    def get_export_field_names(self):
        return {
            'kri_code': 'KRI 코드',
            'kri_name': 'KRI명',
            'kri_type': 'KRI 유형',
            'domain': '도메인',
            'unit': '단위',
            'risk_level_low': '낮은 리스크 기준',
            'risk_level_medium': '중간 리스크 기준',
            'risk_level_high': '높은 리스크 기준',
        }

    @action(detail=False, methods=['get'])
    def kri_types(self, request):
        """KRI 유형 목록"""
        types = [choice[0] for choice in KRIDefinition.KRI_TYPE_CHOICES]
        return Response({'kri_types': types})


class KRIFactViewSet(ExportImportMixin, viewsets.ModelViewSet):
    """KRI 팩트 ViewSet"""

    serializer_class = KRIFactSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'fact_id'

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kri', 'date', 'year', 'quarter', 'month', 'plant', 'risk_level']
    search_fields = ['kri__kri_code', 'kri__kri_name', 'plant']
    ordering_fields = ['date', 'risk_score', 'created_at']
    ordering = ['-date', 'kri']

    def get_queryset(self):
        return KRIFact.objects.select_related('kri', 'vendor').all()

    def get_export_field_names(self):
        return {
            'kri_code': 'KRI 코드',
            'kri_name': 'KRI명',
            'date': '날짜',
            'plant': '공장',
            'actual_value': '실제값',
            'risk_level': '리스크 수준',
            'risk_score': '리스크 점수',
        }

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        최근 KRI 실적 조회

        Query Parameters:
        - kri_codes: 쉼표로 구분된 KRI 코드 (optional)
        - plant: 공장 코드 (optional)
        - limit: 반환 개수 (default: 100)
        """
        kri_codes_param = request.query_params.get('kri_codes')
        plant = request.query_params.get('plant')
        limit = int(request.query_params.get('limit', 100))

        queryset = self.get_queryset()

        if kri_codes_param:
            kri_codes = kri_codes_param.split(',')
            queryset = queryset.filter(kri__kri_code__in=kri_codes)

        if plant:
            queryset = queryset.filter(plant=plant)

        results = queryset.order_by('-date')[:limit]

        serializer = self.get_serializer(results, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        KRI 요약 통계

        Query Parameters:
        - year: 연도 (default: 현재 연도)
        - quarter: 분기 (optional)
        - month: 월 (optional)
        """
        from django.db.models import Count

        year = int(request.query_params.get('year', timezone.now().year))
        quarter = request.query_params.get('quarter')
        month = request.query_params.get('month')

        queryset = self.get_queryset().filter(year=year)

        if quarter:
            queryset = queryset.filter(quarter=quarter)
        if month:
            queryset = queryset.filter(month=month)

        # 리스크 수준별 통계
        risk_stats = {}
        for risk_choice in ['low', 'medium', 'high', 'critical']:
            count = queryset.filter(risk_level=risk_choice).count()
            risk_stats[risk_choice] = count

        return Response({
            'period': {'year': year, 'quarter': quarter, 'month': month},
            'risk_distribution': risk_stats,
            'total_facts': queryset.count()
        })
