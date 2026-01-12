"""
Quality 앱 시드 데이터 생성 스크립트
실행: python manage.py shell < quality/seed_data.py
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
import random
from quality.models import (
    QualityInspection,
    DefectType,
    DefectRecord,
    CustomerComplaint,
    ProcessCapability
)

random.seed(42)
print("Quality 시드 데이터 생성 시작...")

# 기존 데이터 삭제
DefectRecord.objects.all().delete()
QualityInspection.objects.all().delete()
CustomerComplaint.objects.all().delete()
ProcessCapability.objects.all().delete()
DefectType.objects.all().delete()

# 불량 유형 데이터
defect_types_data = [
    {'name': '치수 불량', 'code': 'DIM', 'description': '규격 치수 미달 또는 초과', 'severity': 'major'},
    {'name': '외관 불량', 'code': 'APP', 'description': '표면 스크래치, 찍힘, 변색 등', 'severity': 'minor'},
    {'name': '기능 불량', 'code': 'FUN', 'description': '제품 기능 이상', 'severity': 'critical'},
    {'name': '조립 불량', 'code': 'ASM', 'description': '조립 불량, 부품 미체결', 'severity': 'major'},
    {'name': '재료 불량', 'code': 'MAT', 'description': '재료 결함, 이물질 혼입', 'severity': 'critical'},
    {'name': '포장 불량', 'code': 'PKG', 'description': '포장 손상, 라벨 오류', 'severity': 'minor'},
]

defect_types = []
for data in defect_types_data:
    dt = DefectType.objects.create(**data)
    defect_types.append(dt)
    print(f"  불량 유형 생성: {dt.name}")

# 품질 검사 데이터 (최근 60일)
today = date.today()
inspection_types = ['incoming', 'in_process', 'final', 'outgoing']
products = [
    ('제품 A', 'PRD-A001'),
    ('제품 B', 'PRD-B001'),
    ('제품 C', 'PRD-C001'),
    ('제품 D', 'PRD-D001'),
    ('제품 E', 'PRD-E001'),
]
inspectors = ['김검사', '이품질', '박관리', '최검사', '정품질']

inspection_count = 0
for days_ago in range(60, 0, -1):
    insp_date = today - timedelta(days=days_ago)

    # 하루에 4-8건의 검사
    num_inspections = random.randint(4, 8)
    for i in range(num_inspections):
        insp_type = random.choice(inspection_types)
        product_name, product_code = random.choice(products)
        sample_size = random.randint(50, 200)

        # 검사 유형별 불량률 다르게 설정
        if insp_type == 'incoming':
            defect_rate = random.uniform(0.01, 0.04)
        elif insp_type == 'in_process':
            defect_rate = random.uniform(0.005, 0.02)
        elif insp_type == 'final':
            defect_rate = random.uniform(0.003, 0.015)
        else:  # outgoing
            defect_rate = random.uniform(0.001, 0.01)

        defect_count = int(sample_size * defect_rate)

        if defect_count == 0:
            result = 'pass'
        elif defect_count <= 2:
            result = random.choice(['pass', 'conditional'])
        else:
            result = random.choice(['conditional', 'fail'])

        inspection = QualityInspection.objects.create(
            inspection_number=f"INS-{insp_date.strftime('%y%m')}-{inspection_count+1:04d}",
            inspection_type=insp_type,
            product_name=product_name,
            product_code=product_code,
            lot_number=f"LOT-{insp_date.strftime('%Y%m%d')}-{random.randint(1,99):02d}",
            inspection_date=insp_date,
            inspector=random.choice(inspectors),
            sample_size=sample_size,
            defect_count=defect_count,
            result=result
        )
        inspection_count += 1

        # 불량이 있으면 불량 기록 생성
        if defect_count > 0:
            remaining_defects = defect_count
            num_defect_types = random.randint(1, min(3, len(defect_types)))
            selected_types = random.sample(defect_types, num_defect_types)

            for j, dt in enumerate(selected_types):
                if j == num_defect_types - 1:
                    qty = remaining_defects
                else:
                    qty = random.randint(1, max(1, remaining_defects - (num_defect_types - j - 1)))
                    remaining_defects -= qty

                if qty > 0:
                    DefectRecord.objects.create(
                        inspection=inspection,
                        defect_type=dt,
                        quantity=qty,
                        location=random.choice(['전면', '후면', '측면', '상단', '하단']),
                        description=f'{dt.name} 발생'
                    )

print(f"  품질 검사 생성: {inspection_count}건")
print(f"  불량 기록 생성: {DefectRecord.objects.count()}건")

# 고객 클레임 데이터
complaints_data = [
    {'complaint_number': 'CLM-2412-001', 'customer_name': 'A전자', 'product_name': '제품 A', 'product_code': 'PRD-A001', 'complaint_date': today - timedelta(days=5), 'description': '치수 규격 미달로 조립 불가', 'severity': 'high', 'status': 'investigating', 'assigned_to': '김품질'},
    {'complaint_number': 'CLM-2412-002', 'customer_name': 'B자동차', 'product_name': '제품 B', 'product_code': 'PRD-B001', 'complaint_date': today - timedelta(days=10), 'description': '표면 스크래치 다수 발생', 'severity': 'medium', 'status': 'resolving', 'assigned_to': '이관리'},
    {'complaint_number': 'CLM-2412-003', 'customer_name': 'C건설', 'product_name': '제품 C', 'product_code': 'PRD-C001', 'complaint_date': today - timedelta(days=15), 'description': '기능 테스트 실패', 'severity': 'high', 'status': 'resolving', 'assigned_to': '박엔지니어'},
    {'complaint_number': 'CLM-2411-015', 'customer_name': 'D유통', 'product_name': '제품 A', 'product_code': 'PRD-A001', 'complaint_date': today - timedelta(days=25), 'description': '포장 손상으로 제품 파손', 'severity': 'low', 'status': 'resolved', 'assigned_to': '최매니저', 'resolution_date': today - timedelta(days=20)},
    {'complaint_number': 'CLM-2411-012', 'customer_name': 'A전자', 'product_name': '제품 D', 'product_code': 'PRD-D001', 'complaint_date': today - timedelta(days=30), 'description': '조립 부품 누락', 'severity': 'medium', 'status': 'closed', 'assigned_to': '김품질', 'resolution_date': today - timedelta(days=22)},
    {'complaint_number': 'CLM-2411-008', 'customer_name': 'E물산', 'product_name': '제품 E', 'product_code': 'PRD-E001', 'complaint_date': today - timedelta(days=40), 'description': '색상 불균일', 'severity': 'low', 'status': 'closed', 'assigned_to': '이관리', 'resolution_date': today - timedelta(days=35)},
]

for data in complaints_data:
    cc = CustomerComplaint.objects.create(**data)
    print(f"  고객 클레임 생성: {cc.complaint_number}")

# 공정 능력 데이터
process_capability_data = [
    {'product_name': '제품 A', 'product_code': 'PRD-A001', 'process_name': '사출', 'measurement_date': today - timedelta(days=5), 'usl': Decimal('105.0'), 'lsl': Decimal('95.0'), 'target': Decimal('100.0'), 'mean': Decimal('100.2'), 'std_dev': Decimal('1.2'), 'cp': Decimal('1.67'), 'cpk': Decimal('1.67'), 'ppk': Decimal('1.58'), 'sample_size': 50},
    {'product_name': '제품 B', 'product_code': 'PRD-B001', 'process_name': '가공', 'measurement_date': today - timedelta(days=5), 'usl': Decimal('53.0'), 'lsl': Decimal('47.0'), 'target': Decimal('50.0'), 'mean': Decimal('50.5'), 'std_dev': Decimal('0.9'), 'cp': Decimal('1.45'), 'cpk': Decimal('1.45'), 'ppk': Decimal('1.38'), 'sample_size': 50},
    {'product_name': '제품 C', 'product_code': 'PRD-C001', 'process_name': '조립', 'measurement_date': today - timedelta(days=5), 'usl': Decimal('210.0'), 'lsl': Decimal('190.0'), 'target': Decimal('200.0'), 'mean': Decimal('202.5'), 'std_dev': Decimal('3.2'), 'cp': Decimal('1.12'), 'cpk': Decimal('1.12'), 'ppk': Decimal('1.08'), 'sample_size': 50},
    {'product_name': '제품 D', 'product_code': 'PRD-D001', 'process_name': '검사', 'measurement_date': today - timedelta(days=5), 'usl': Decimal('79.0'), 'lsl': Decimal('71.0'), 'target': Decimal('75.0'), 'mean': Decimal('75.1'), 'std_dev': Decimal('0.85'), 'cp': Decimal('1.88'), 'cpk': Decimal('1.88'), 'ppk': Decimal('1.82'), 'sample_size': 50},
    {'product_name': '제품 E', 'product_code': 'PRD-E001', 'process_name': '도장', 'measurement_date': today - timedelta(days=5), 'usl': Decimal('158.0'), 'lsl': Decimal('142.0'), 'target': Decimal('150.0'), 'mean': Decimal('152.8'), 'std_dev': Decimal('2.8'), 'cp': Decimal('0.95'), 'cpk': Decimal('0.95'), 'ppk': Decimal('0.92'), 'sample_size': 50},
]

for data in process_capability_data:
    pc = ProcessCapability.objects.create(**data)
    print(f"  공정 능력 생성: {pc.product_name} - {pc.process_name}")

print("\nQuality 시드 데이터 생성 완료!")
print(f"  - 불량 유형: {DefectType.objects.count()}건")
print(f"  - 품질 검사: {QualityInspection.objects.count()}건")
print(f"  - 불량 기록: {DefectRecord.objects.count()}건")
print(f"  - 고객 클레임: {CustomerComplaint.objects.count()}건")
print(f"  - 공정 능력: {ProcessCapability.objects.count()}건")
