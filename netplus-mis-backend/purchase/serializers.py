from rest_framework import serializers
from .models import (
    MonthlyPurchase, Inventory, PurchaseOrder,
    Supplier, MaterialPrice, InventoryTurnover
)


class MonthlyPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyPurchase
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    stock_rate = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = '__all__'

    def get_stock_rate(self, obj):
        if obj.safety_stock and obj.safety_stock > 0:
            return round(obj.current_stock / obj.safety_stock * 100, 1)
        return 0


class InventoryListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'item_code', 'item_name', 'category', 'category_display',
                  'current_stock', 'safety_stock', 'status', 'status_display']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_number', 'supplier_name', 'item_name', 'total_amount',
                  'order_date', 'delivery_date', 'status', 'status_display', 'is_urgent']


class SupplierSerializer(serializers.ModelSerializer):
    grade_display = serializers.CharField(source='get_grade_display', read_only=True)
    trend_display = serializers.CharField(source='get_trend_display', read_only=True)

    class Meta:
        model = Supplier
        fields = '__all__'


class SupplierListSerializer(serializers.ModelSerializer):
    grade_display = serializers.CharField(source='get_grade_display', read_only=True)

    class Meta:
        model = Supplier
        fields = ['id', 'supplier_code', 'supplier_name', 'total_score',
                  'grade', 'grade_display', 'trend', 'purchase_share']


class MaterialPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialPrice
        fields = '__all__'


class InventoryTurnoverSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = InventoryTurnover
        fields = '__all__'
