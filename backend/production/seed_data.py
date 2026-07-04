"""
Production 앱 시드 데이터 생성 스크립트
실행: python manage.py shell < production/seed_data.py
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import datetime, timedelta, date
from decimal import Decimal
from production.models import ProductionLine, WorkOrder, DailyProduction, Equipment

print("Production 시드 데이터 생성 시작...")

# 기존 데이터 삭제
DailyProduction.objects.all().delete()
WorkOrder.objects.all().delete()
Equipment.objects.all().delete()
ProductionLine.objects.all().delete()

# 생산 라인 데이터
lines_data = [
    {'name': '라인 A', 'code': 'LINE-A', 'location': '제1공장 1층', 'capacity': 500, 'is_active': True},
    {'name': '라인 B', 'code': 'LINE-B', 'location': '제1공장 1층', 'capacity': 450, 'is_active': True},
    {'name': '라인 C', 'code': 'LINE-C', 'location': '제1공장 2층', 'capacity': 500, 'is_active': True},
    {'name': '라인 D', 'code': 'LINE-D', 'location': '제2공장 1층', 'capacity': 400, 'is_active': True},
    {'name': '라인 E', 'code': 'LINE-E', 'location': '제2공장 1층', 'capacity': 350, 'is_active': True},
]

lines = []
for data in lines_data:
    line = ProductionLine.objects.create(**data)
    lines.append(line)
    print(f"  생산 라인 생성: {line.name}")

# 설비 데이터
equipment_data = [
    # 라인 A 설비
    {'name': '사출기 #1', 'code': 'INJ-001', 'production_line': lines[0], 'manufacturer': '현대중공업', 'model': 'HIM-5000', 'purchase_date': date(2021, 3, 15), 'status': 'running', 'last_maintenance': date(2024, 10, 10), 'next_maintenance': date(2024, 11, 10)},
    {'name': '사출기 #2', 'code': 'INJ-002', 'production_line': lines[0], 'manufacturer': '현대중공업', 'model': 'HIM-5000', 'purchase_date': date(2021, 3, 15), 'status': 'running', 'last_maintenance': date(2024, 10, 8), 'next_maintenance': date(2024, 11, 8)},
    {'name': '조립기 #1', 'code': 'ASM-001', 'production_line': lines[0], 'manufacturer': '두산로봇', 'model': 'DR-2000', 'purchase_date': date(2022, 5, 20), 'status': 'idle', 'last_maintenance': date(2024, 9, 25), 'next_maintenance': date(2024, 10, 25)},
    # 라인 B 설비
    {'name': '사출기 #3', 'code': 'INJ-003', 'production_line': lines[1], 'manufacturer': '현대중공업', 'model': 'HIM-4500', 'purchase_date': date(2020, 7, 10), 'status': 'running', 'last_maintenance': date(2024, 10, 5), 'next_maintenance': date(2024, 11, 5)},
    {'name': '조립기 #2', 'code': 'ASM-002', 'production_line': lines[1], 'manufacturer': '두산로봇', 'model': 'DR-2000', 'purchase_date': date(2022, 5, 20), 'status': 'running', 'last_maintenance': date(2024, 10, 12), 'next_maintenance': date(2024, 11, 12)},
    # 라인 C 설비
    {'name': '사출기 #4', 'code': 'INJ-004', 'production_line': lines[2], 'manufacturer': 'LG화학', 'model': 'LGI-6000', 'purchase_date': date(2023, 1, 15), 'status': 'running', 'last_maintenance': date(2024, 9, 20), 'next_maintenance': date(2024, 10, 20)},
    {'name': '포장기 #1', 'code': 'PKG-001', 'production_line': lines[2], 'manufacturer': '한화솔루션', 'model': 'HP-300', 'purchase_date': date(2023, 3, 10), 'status': 'maintenance', 'last_maintenance': date(2024, 10, 15), 'next_maintenance': date(2024, 11, 15)},
    # 라인 D 설비
    {'name': '사출기 #5', 'code': 'INJ-005', 'production_line': lines[3], 'manufacturer': '현대중공업', 'model': 'HIM-4000', 'purchase_date': date(2019, 11, 20), 'status': 'running', 'last_maintenance': date(2024, 10, 1), 'next_maintenance': date(2024, 11, 1)},
    {'name': '검사기 #1', 'code': 'QC-001', 'production_line': lines[3], 'manufacturer': '삼성정밀', 'model': 'SQC-100', 'purchase_date': date(2022, 8, 5), 'status': 'running', 'last_maintenance': date(2024, 9, 15), 'next_maintenance': date(2024, 10, 15)},
    # 라인 E 설비
    {'name': '사출기 #6', 'code': 'INJ-006', 'production_line': lines[4], 'manufacturer': 'LG화학', 'model': 'LGI-5500', 'purchase_date': date(2022, 2, 28), 'status': 'idle', 'last_maintenance': date(2024, 10, 3), 'next_maintenance': date(2024, 11, 3)},
    {'name': '포장기 #2', 'code': 'PKG-002', 'production_line': lines[4], 'manufacturer': '한화솔루션', 'model': 'HP-300', 'purchase_date': date(2023, 3, 10), 'status': 'running', 'last_maintenance': date(2024, 9, 28), 'next_maintenance': date(2024, 10, 28)},
]

for data in equipment_data:
    equip = Equipment.objects.create(**data)
    print(f"  설비 생성: {equip.name}")

# 작업 지시서 데이터
today = date.today()
work_orders_data = [
    {'order_number': 'WO-2412-001', 'production_line': lines[0], 'product_name': '제품 A', 'product_code': 'PRD-A001', 'target_quantity': 1000, 'actual_quantity': 850, 'defect_quantity': 12, 'status': 'in_progress', 'planned_start': datetime.now() - timedelta(days=2), 'planned_end': datetime.now() + timedelta(days=1)},
    {'order_number': 'WO-2412-002', 'production_line': lines[1], 'product_name': '제품 B', 'product_code': 'PRD-B001', 'target_quantity': 800, 'actual_quantity': 640, 'defect_quantity': 8, 'status': 'in_progress', 'planned_start': datetime.now() - timedelta(days=1), 'planned_end': datetime.now() + timedelta(days=2)},
    {'order_number': 'WO-2412-003', 'production_line': lines[2], 'product_name': '제품 C', 'product_code': 'PRD-C001', 'target_quantity': 600, 'actual_quantity': 420, 'defect_quantity': 10, 'status': 'in_progress', 'planned_start': datetime.now(), 'planned_end': datetime.now() + timedelta(days=3)},
    {'order_number': 'WO-2412-004', 'production_line': lines[3], 'product_name': '제품 D', 'product_code': 'PRD-D001', 'target_quantity': 500, 'actual_quantity': 280, 'defect_quantity': 4, 'status': 'in_progress', 'planned_start': datetime.now(), 'planned_end': datetime.now() + timedelta(days=4)},
    {'order_number': 'WO-2412-005', 'production_line': lines[0], 'product_name': '제품 A', 'product_code': 'PRD-A001', 'target_quantity': 1200, 'actual_quantity': 360, 'defect_quantity': 5, 'status': 'in_progress', 'planned_start': datetime.now() + timedelta(days=1), 'planned_end': datetime.now() + timedelta(days=5)},
    {'order_number': 'WO-2412-006', 'production_line': lines[4], 'product_name': '제품 E', 'product_code': 'PRD-E001', 'target_quantity': 400, 'actual_quantity': 400, 'defect_quantity': 6, 'status': 'completed', 'planned_start': datetime.now() - timedelta(days=5), 'planned_end': datetime.now() - timedelta(days=1), 'actual_start': datetime.now() - timedelta(days=5), 'actual_end': datetime.now() - timedelta(days=1)},
]

for data in work_orders_data:
    wo = WorkOrder.objects.create(**data)
    print(f"  작업지시서 생성: {wo.order_number}")

# 일일 생산 실적 데이터 (최근 30일)
import random
random.seed(42)

for line in lines:
    for days_ago in range(30, 0, -1):
        prod_date = today - timedelta(days=days_ago)
        target = random.randint(350, 500)
        # 라인별 특성 반영
        if line.code == 'LINE-D':
            efficiency_base = 96
        elif line.code == 'LINE-C':
            efficiency_base = 88
        else:
            efficiency_base = 92

        efficiency = efficiency_base + random.uniform(-3, 3)
        actual = int(target * (efficiency / 100))
        defect = int(actual * random.uniform(0.008, 0.025))
        operating_hours = Decimal(str(round(random.uniform(7.5, 8.5), 2)))
        downtime_hours = Decimal(str(round(8.5 - float(operating_hours), 2)))

        DailyProduction.objects.create(
            production_line=line,
            production_date=prod_date,
            target_quantity=target,
            actual_quantity=actual,
            defect_quantity=defect,
            operating_hours=operating_hours,
            downtime_hours=downtime_hours,
            efficiency=Decimal(str(round(efficiency, 2)))
        )

print(f"  일일 생산 실적 생성: {DailyProduction.objects.count()}건")

print("\nProduction 시드 데이터 생성 완료!")
print(f"  - 생산 라인: {ProductionLine.objects.count()}건")
print(f"  - 설비: {Equipment.objects.count()}건")
print(f"  - 작업 지시서: {WorkOrder.objects.count()}건")
print(f"  - 일일 생산 실적: {DailyProduction.objects.count()}건")
