from rest_framework import serializers
from .models import ProductionLine, WorkOrder, DailyProduction, Equipment


class ProductionLineSerializer(serializers.ModelSerializer):
    """생산 라인 시리얼라이저"""
    equipment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductionLine
        fields = [
            'id',
            'name',
            'code',
            'location',
            'capacity',
            'is_active',
            'equipment_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_equipment_count(self, obj):
        """설비 개수 반환"""
        return obj.equipment.count()


class WorkOrderSerializer(serializers.ModelSerializer):
    """작업 지시서 시리얼라이저"""
    production_line_name = serializers.CharField(source='production_line.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    achievement_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = WorkOrder
        fields = [
            'id',
            'order_number',
            'production_line',
            'production_line_name',
            'product_name',
            'product_code',
            'target_quantity',
            'actual_quantity',
            'defect_quantity',
            'achievement_rate',
            'status',
            'status_display',
            'planned_start',
            'planned_end',
            'actual_start',
            'actual_end',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'achievement_rate', 'created_at', 'updated_at']
    
    def validate(self, data):
        """데이터 검증"""
        # 계획 종료일이 시작일보다 빠른지 체크
        if data.get('planned_end') and data.get('planned_start'):
            if data['planned_end'] <= data['planned_start']:
                raise serializers.ValidationError(
                    "계획 종료일시는 시작일시보다 늦어야 합니다."
                )
        
        # 실제 생산량이 목표를 초과하지 않도록 체크 (선택사항)
        actual = data.get('actual_quantity', 0)
        target = data.get('target_quantity', 0)
        
        if actual < 0:
            raise serializers.ValidationError("실제 생산량은 음수일 수 없습니다.")
        
        return data


class WorkOrderListSerializer(serializers.ModelSerializer):
    """작업 지시서 목록용 간소화 시리얼라이저"""
    production_line_name = serializers.CharField(source='production_line.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    achievement_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = WorkOrder
        fields = [
            'id',
            'order_number',
            'production_line_name',
            'product_name',
            'target_quantity',
            'actual_quantity',
            'achievement_rate',
            'status',
            'status_display',
            'planned_start',
        ]


class DailyProductionSerializer(serializers.ModelSerializer):
    """일일 생산 실적 시리얼라이저"""
    production_line_name = serializers.CharField(source='production_line.name', read_only=True)
    defect_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = DailyProduction
        fields = [
            'id',
            'production_line',
            'production_line_name',
            'production_date',
            'target_quantity',
            'actual_quantity',
            'defect_quantity',
            'defect_rate',
            'operating_hours',
            'downtime_hours',
            'efficiency',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'defect_rate', 'created_at', 'updated_at']
    
    def validate(self, data):
        """데이터 검증"""
        if data.get('actual_quantity', 0) < 0:
            raise serializers.ValidationError("생산량은 음수일 수 없습니다.")
        
        if data.get('defect_quantity', 0) > data.get('actual_quantity', 0):
            raise serializers.ValidationError("불량 수량이 생산량을 초과할 수 없습니다.")
        
        return data


class EquipmentSerializer(serializers.ModelSerializer):
    """생산 설비 시리얼라이저"""
    production_line_name = serializers.CharField(source='production_line.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Equipment
        fields = [
            'id',
            'name',
            'code',
            'production_line',
            'production_line_name',
            'manufacturer',
            'model',
            'purchase_date',
            'status',
            'status_display',
            'last_maintenance',
            'next_maintenance',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EquipmentListSerializer(serializers.ModelSerializer):
    """생산 설비 목록용 간소화 시리얼라이저"""
    production_line_name = serializers.CharField(source='production_line.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Equipment
        fields = [
            'id',
            'name',
            'code',
            'production_line_name',
            'status',
            'status_display',
            'next_maintenance',
        ]