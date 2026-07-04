from rest_framework import serializers
from .models import (
    QualityInspection, 
    DefectType, 
    DefectRecord, 
    CustomerComplaint, 
    ProcessCapability
)


class DefectTypeSerializer(serializers.ModelSerializer):
    """불량 유형 시리얼라이저"""
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = DefectType
        fields = [
            'id',
            'name',
            'code',
            'description',
            'severity',
            'severity_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DefectRecordSerializer(serializers.ModelSerializer):
    """불량 기록 시리얼라이저"""
    defect_type_name = serializers.CharField(source='defect_type.name', read_only=True)
    
    class Meta:
        model = DefectRecord
        fields = [
            'id',
            'inspection',
            'defect_type',
            'defect_type_name',
            'quantity',
            'location',
            'description',
            'corrective_action',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QualityInspectionSerializer(serializers.ModelSerializer):
    """품질 검사 시리얼라이저"""
    inspection_type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    defect_rate = serializers.ReadOnlyField()
    defect_records = DefectRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = QualityInspection
        fields = [
            'id',
            'inspection_number',
            'inspection_type',
            'inspection_type_display',
            'product_name',
            'product_code',
            'lot_number',
            'inspection_date',
            'inspector',
            'sample_size',
            'defect_count',
            'defect_rate',
            'result',
            'result_display',
            'notes',
            'defect_records',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'defect_rate', 'created_at', 'updated_at']
    
    def validate(self, data):
        """데이터 검증"""
        if data.get('defect_count', 0) > data.get('sample_size', 0):
            raise serializers.ValidationError("불량 수량이 샘플 수량을 초과할 수 없습니다.")
        
        if data.get('sample_size', 0) < 1:
            raise serializers.ValidationError("샘플 수량은 최소 1개 이상이어야 합니다.")
        
        return data


class QualityInspectionListSerializer(serializers.ModelSerializer):
    """품질 검사 목록용 간소화 시리얼라이저"""
    inspection_type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    defect_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = QualityInspection
        fields = [
            'id',
            'inspection_number',
            'inspection_type_display',
            'product_name',
            'inspection_date',
            'defect_rate',
            'result',
            'result_display',
        ]


class CustomerComplaintSerializer(serializers.ModelSerializer):
    """고객 클레임 시리얼라이저"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = CustomerComplaint
        fields = [
            'id',
            'complaint_number',
            'customer_name',
            'product_name',
            'product_code',
            'complaint_date',
            'description',
            'severity',
            'severity_display',
            'status',
            'status_display',
            'assigned_to',
            'root_cause',
            'corrective_action',
            'preventive_action',
            'resolution_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerComplaintListSerializer(serializers.ModelSerializer):
    """고객 클레임 목록용 간소화 시리얼라이저"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = CustomerComplaint
        fields = [
            'id',
            'complaint_number',
            'customer_name',
            'product_name',
            'complaint_date',
            'severity',
            'severity_display',
            'status',
            'status_display',
        ]


class ProcessCapabilitySerializer(serializers.ModelSerializer):
    """공정 능력 시리얼라이저"""
    
    class Meta:
        model = ProcessCapability
        fields = [
            'id',
            'product_name',
            'product_code',
            'process_name',
            'measurement_date',
            'usl',
            'lsl',
            'target',
            'mean',
            'std_dev',
            'cp',
            'cpk',
            'ppk',
            'sample_size',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """데이터 검증"""
        usl = data.get('usl')
        lsl = data.get('lsl')
        
        if usl and lsl and usl <= lsl:
            raise serializers.ValidationError("상한 규격(USL)은 하한 규격(LSL)보다 커야 합니다.")
        
        if data.get('sample_size', 0) < 30:
            raise serializers.ValidationError("샘플 크기는 최소 30개 이상이어야 합니다.")
        
        return data


class ProcessCapabilityListSerializer(serializers.ModelSerializer):
    """공정 능력 목록용 간소화 시리얼라이저"""
    
    class Meta:
        model = ProcessCapability
        fields = [
            'id',
            'product_name',
            'process_name',
            'measurement_date',
            'cpk',
            'ppk',
        ]