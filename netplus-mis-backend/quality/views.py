from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Sum
from .models import (
    QualityInspection,
    DefectType,
    DefectRecord,
    CustomerComplaint,
    ProcessCapability,
)
from .serializers import (
    QualityInspectionSerializer,
    QualityInspectionListSerializer,
    DefectTypeSerializer,
    DefectRecordSerializer,
    CustomerComplaintSerializer,
    CustomerComplaintListSerializer,
    ProcessCapabilitySerializer,
    ProcessCapabilityListSerializer,
)


class QualityInspectionViewSet(viewsets.ModelViewSet):
    """품질 검사 ViewSet"""
    queryset = QualityInspection.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['inspection_type', 'result', 'inspection_date']
    search_fields = ['inspection_number', 'product_name', 'product_code', 'lot_number']
    ordering_fields = ['inspection_date']
    ordering = ['-inspection_date']
    
    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return QualityInspectionListSerializer
        return QualityInspectionSerializer
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """검사 통계"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        queryset = self.queryset
        
        if year:
            queryset = queryset.filter(inspection_date__year=year)
        if month:
            queryset = queryset.filter(inspection_date__month=month)
        
        total = queryset.count()
        passed = queryset.filter(result='pass').count()
        failed = queryset.filter(result='fail').count()
        
        # 평균 불량률
        total_samples = sum([i.sample_size for i in queryset])
        total_defects = sum([i.defect_count for i in queryset])
        avg_defect_rate = round((total_defects / total_samples * 100), 2) if total_samples > 0 else 0
        
        return Response({
            'total_inspections': total,
            'passed': passed,
            'failed': failed,
            'pass_rate': round((passed / total * 100), 2) if total > 0 else 0,
            'average_defect_rate': avg_defect_rate,
        })
    
    @action(detail=False, methods=['get'])
    def defect_analysis(self, request):
        """불량 분석"""
        from datetime import datetime, timedelta
        
        days = int(request.query_params.get('days', 30))
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        inspections = self.queryset.filter(
            inspection_date__gte=start_date,
            inspection_date__lte=end_date
        )
        
        # 불량 유형별 집계
        defect_records = DefectRecord.objects.filter(
            inspection__in=inspections
        ).values('defect_type__name').annotate(
            total=Sum('quantity')
        ).order_by('-total')[:10]
        
        return Response({
            'period': f'{start_date} ~ {end_date}',
            'defect_by_type': list(defect_records),
        })


class DefectTypeViewSet(viewsets.ModelViewSet):
    """불량 유형 ViewSet"""
    queryset = DefectType.objects.all()
    serializer_class = DefectTypeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'description']


class DefectRecordViewSet(viewsets.ModelViewSet):
    """불량 기록 ViewSet"""
    queryset = DefectRecord.objects.all()
    serializer_class = DefectRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'defect_type']


class CustomerComplaintViewSet(viewsets.ModelViewSet):
    """고객 클레임 ViewSet"""
    queryset = CustomerComplaint.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'severity', 'complaint_date']
    search_fields = ['complaint_number', 'customer_name', 'product_name']
    ordering_fields = ['complaint_date', 'severity']
    ordering = ['-complaint_date']
    
    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return CustomerComplaintListSerializer
        return CustomerComplaintSerializer
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """담당자 할당"""
        complaint = self.get_object()
        assigned_to = request.data.get('assigned_to')
        
        if not assigned_to:
            return Response(
                {'error': '담당자(assigned_to)가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        complaint.assigned_to = assigned_to
        complaint.status = 'investigating'
        complaint.save()
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """클레임 해결"""
        complaint = self.get_object()
        
        from django.utils import timezone
        complaint.status = 'resolved'
        complaint.resolution_date = timezone.now().date()
        complaint.save()
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """클레임 요약"""
        total = self.queryset.count()
        by_status = self.queryset.values('status').annotate(count=Count('id'))
        by_severity = self.queryset.values('severity').annotate(count=Count('id'))
        
        return Response({
            'total_complaints': total,
            'by_status': list(by_status),
            'by_severity': list(by_severity),
        })


class ProcessCapabilityViewSet(viewsets.ModelViewSet):
    """공정 능력 ViewSet"""
    queryset = ProcessCapability.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product_code', 'measurement_date']
    search_fields = ['product_name', 'product_code', 'process_name']
    
    def get_serializer_class(self):
        """액션에 따라 다른 시리얼라이저 사용"""
        if self.action == 'list':
            return ProcessCapabilityListSerializer
        return ProcessCapabilitySerializer
    
    @action(detail=False, methods=['get'])
    def below_threshold(self, request):
        """CPK 1.33 미만 공정"""
        threshold = float(request.query_params.get('threshold', 1.33))
        
        processes = self.queryset.filter(cpk__lt=threshold).order_by('cpk')
        serializer = self.get_serializer(processes, many=True)
        
        return Response({
            'threshold': threshold,
            'count': processes.count(),
            'processes': serializer.data,
        })