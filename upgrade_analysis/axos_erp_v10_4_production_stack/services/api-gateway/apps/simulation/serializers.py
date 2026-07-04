from rest_framework import serializers
class ReleaseProductionOrderSerializer(serializers.Serializer):
    production_order_no = serializers.CharField(max_length=50)
    sales_order_no = serializers.CharField(max_length=50)
class EquipmentDowntimeSerializer(serializers.Serializer):
    equipment_code = serializers.CharField(max_length=50)
    order_no = serializers.CharField(max_length=50)
    lot_no = serializers.CharField(max_length=50)
    duration_min = serializers.IntegerField(default=30)
