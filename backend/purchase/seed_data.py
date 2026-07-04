"""
Purchase 앱 시드 데이터 생성 스크립트
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import date, timedelta
from decimal import Decimal
import random
from purchase.models import (
    MonthlyPurchase, Inventory, PurchaseOrder,
    Supplier, MaterialPrice, InventoryTurnover
)

random.seed(42)
print("Purchase 시드 데이터 생성 시작...")

# 기존 데이터 삭제
MonthlyPurchase.objects.all().delete()
Inventory.objects.all().delete()
PurchaseOrder.objects.all().delete()
Supplier.objects.all().delete()
MaterialPrice.objects.all().delete()
InventoryTurnover.objects.all().delete()

# 월별 구매액 데이터 (2024년 12개월)
for month in range(1, 13):
    purchase_amount = Decimal(str(round(random.uniform(80, 120), 1)))  # 억원
    MonthlyPurchase.objects.create(
        fiscal_year=2024,
        fiscal_month=month,
        purchase_amount=purchase_amount,
        previous_month_change=Decimal(str(round(random.uniform(-10, 10), 1))),
        order_count=random.randint(120, 180),
        pending_orders=random.randint(5, 20)
    )
print(f"  월별 구매액 생성: {MonthlyPurchase.objects.count()}건")

# 재고 현황 데이터
inventory_items = [
    ('RAW-001', '알루미늄 판재', 'A', 1200, 500, Decimal('85.5'), Decimal('8.5'), 'adequate'),
    ('RAW-002', '스틸 봉재', 'A', 800, 400, Decimal('62.3'), Decimal('10.2'), 'adequate'),
    ('RAW-003', '구리선', 'A', 450, 300, Decimal('120.8'), Decimal('12.5'), 'low'),
    ('RAW-004', 'ABS 수지', 'B', 2500, 800, Decimal('45.2'), Decimal('6.8'), 'high'),
    ('RAW-005', 'PC 수지', 'B', 1800, 600, Decimal('38.5'), Decimal('7.2'), 'adequate'),
    ('RAW-006', '실리콘', 'B', 600, 400, Decimal('28.6'), Decimal('9.5'), 'low'),
    ('PAR-001', '볼트 M6', 'C', 15000, 5000, Decimal('3.2'), Decimal('15.5'), 'adequate'),
    ('PAR-002', '너트 M6', 'C', 12000, 4000, Decimal('2.8'), Decimal('14.2'), 'adequate'),
    ('PAR-003', '와셔', 'C', 8000, 3000, Decimal('1.5'), Decimal('18.5'), 'critical'),
    ('PAR-004', '스프링', 'C', 5000, 2000, Decimal('4.5'), Decimal('11.2'), 'adequate'),
]

for item in inventory_items:
    Inventory.objects.create(
        item_code=item[0],
        item_name=item[1],
        category=item[2],
        current_stock=item[3],
        safety_stock=item[4],
        stock_value=item[5],
        turnover_rate=item[6],
        status=item[7]
    )
print(f"  재고 현황 생성: {Inventory.objects.count()}건")

# 발주 현황 데이터
today = date.today()
suppliers = ['삼성물산', 'LG화학', '현대철강', 'SK케미칼', '롯데케미칼', '한화솔루션', '두산중공업']
items = ['알루미늄 판재', '스틸 봉재', 'ABS 수지', 'PC 수지', '볼트 세트', '전자부품', '포장재']
statuses = ['ordered', 'in-transit', 'received', 'delayed']

for i in range(20):
    order_date = today - timedelta(days=random.randint(1, 30))
    delivery_date = order_date + timedelta(days=random.randint(7, 21))
    quantity = random.randint(100, 1000)
    unit_price = Decimal(str(round(random.uniform(1000, 50000), 0)))
    total_amount = quantity * unit_price

    status = random.choices(statuses, weights=[30, 25, 35, 10])[0]
    is_urgent = random.random() < 0.15

    PurchaseOrder.objects.create(
        po_number=f"PO-2412-{i+1:04d}",
        supplier_name=random.choice(suppliers),
        item_name=random.choice(items),
        quantity=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        order_date=order_date,
        delivery_date=delivery_date,
        status=status,
        is_urgent=is_urgent
    )
print(f"  발주 현황 생성: {PurchaseOrder.objects.count()}건")

# 공급업체 데이터
supplier_data = [
    ('SUP-001', '삼성물산', 95, 92, 85, 90, 90.5, 'A', 'stable', 25),
    ('SUP-002', 'LG화학', 92, 88, 90, 88, 89.5, 'A', 'up', 22),
    ('SUP-003', '현대철강', 88, 90, 82, 85, 86.3, 'B', 'stable', 18),
    ('SUP-004', 'SK케미칼', 90, 85, 88, 82, 86.3, 'B', 'up', 15),
    ('SUP-005', '롯데케미칼', 85, 82, 85, 80, 83.0, 'B', 'down', 10),
    ('SUP-006', '한화솔루션', 82, 80, 90, 78, 82.5, 'C', 'stable', 5),
    ('SUP-007', '두산중공업', 78, 75, 85, 75, 78.3, 'C', 'down', 3),
    ('SUP-008', '포스코', 88, 86, 80, 88, 85.5, 'B', 'up', 2),
]

for s in supplier_data:
    Supplier.objects.create(
        supplier_code=s[0],
        supplier_name=s[1],
        quality_score=Decimal(str(s[2])),
        delivery_score=Decimal(str(s[3])),
        price_score=Decimal(str(s[4])),
        service_score=Decimal(str(s[5])),
        total_score=Decimal(str(s[6])),
        grade=s[7],
        trend=s[8],
        purchase_share=Decimal(str(s[9]))
    )
print(f"  공급업체 생성: {Supplier.objects.count()}건")

# 원자재 가격 동향 (최근 6개월)
materials = [
    ('MAT-001', '알루미늄'),
    ('MAT-002', '구리'),
    ('MAT-003', '철강'),
    ('MAT-004', 'ABS 수지'),
    ('MAT-005', 'PC 수지'),
]

for mat_code, mat_name in materials:
    base_price = random.randint(5000, 50000)
    for month in range(7, 13):
        prev_price = base_price * (1 + random.uniform(-0.05, 0.05))
        curr_price = prev_price * (1 + random.uniform(-0.03, 0.08))
        change_rate = ((curr_price - prev_price) / prev_price) * 100

        MaterialPrice.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            material_code=mat_code,
            material_name=mat_name,
            unit_price=Decimal(str(round(curr_price, 0))),
            previous_price=Decimal(str(round(prev_price, 0))),
            change_rate=Decimal(str(round(change_rate, 1)))
        )
        base_price = curr_price
print(f"  원자재 가격 동향 생성: {MaterialPrice.objects.count()}건")

# 재고 회전율 데이터
categories = ['raw', 'parts', 'finished', 'semi', 'consumable']
for month in range(7, 13):
    for cat in categories:
        turnover = random.uniform(4, 15)
        days = int(365 / turnover)
        InventoryTurnover.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            category=cat,
            turnover_rate=Decimal(str(round(turnover, 1))),
            days_in_inventory=days
        )
print(f"  재고 회전율 생성: {InventoryTurnover.objects.count()}건")

print("\nPurchase 시드 데이터 생성 완료!")
print(f"  - 월별 구매액: {MonthlyPurchase.objects.count()}건")
print(f"  - 재고 현황: {Inventory.objects.count()}건")
print(f"  - 발주 현황: {PurchaseOrder.objects.count()}건")
print(f"  - 공급업체: {Supplier.objects.count()}건")
print(f"  - 원자재 가격: {MaterialPrice.objects.count()}건")
print(f"  - 재고 회전율: {InventoryTurnover.objects.count()}건")
