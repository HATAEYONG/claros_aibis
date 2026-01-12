"""
Cost Management Seed Data
"""
import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal
import random

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from cost.models import (
    MonthlyCost, ProductCost, CostReductionProject,
    CostDriver, BreakEvenAnalysis, CostStructure
)


def seed_monthly_cost():
    """월별 원가 데이터"""
    MonthlyCost.objects.all().delete()

    base_cost = 85.0  # 기본 총원가 (억원)

    for month in range(1, 13):
        seasonal_factor = 1 + 0.1 * (month % 4) / 4  # 계절성
        variation = random.uniform(-0.05, 0.05)

        total = round(base_cost * seasonal_factor * (1 + variation), 2)
        unit = round(random.uniform(12000, 15000), 0)

        material = round(total * random.uniform(0.38, 0.42), 2)
        labor = round(total * random.uniform(0.22, 0.26), 2)
        overhead = round(total * random.uniform(0.18, 0.22), 2)
        selling = round(total - material - labor - overhead, 2)

        MonthlyCost.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            total_cost=Decimal(str(total)),
            unit_cost=Decimal(str(unit)),
            material_cost=Decimal(str(material)),
            labor_cost=Decimal(str(labor)),
            overhead_cost=Decimal(str(overhead)),
            selling_admin_cost=Decimal(str(selling))
        )

    print(f"Created 12 MonthlyCost records")


def seed_product_cost():
    """제품별 원가 데이터"""
    ProductCost.objects.all().delete()

    products = [
        ('PROD-001', '스마트 센서 A', 8500),
        ('PROD-002', '스마트 센서 B', 6200),
        ('PROD-003', '제어 모듈 X', 4800),
        ('PROD-004', '전력변환기 Y', 3500),
        ('PROD-005', '통신 모듈 Z', 5100),
        ('PROD-006', '디스플레이 유닛', 2800),
    ]

    for month in [11, 12]:  # 최근 2개월
        for code, name, base_vol in products:
            volume = base_vol + random.randint(-500, 500)

            material = round(random.uniform(3500, 5500), 0)
            labor = round(random.uniform(1500, 2500), 0)
            overhead = round(random.uniform(800, 1500), 0)
            total = material + labor + overhead
            selling = round(total * random.uniform(1.15, 1.35), 0)
            margin = selling - total
            margin_rate = round((margin / selling) * 100, 2)

            ProductCost.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                product_code=code,
                product_name=name,
                production_volume=volume,
                material_cost=Decimal(str(material)),
                labor_cost=Decimal(str(labor)),
                overhead_cost=Decimal(str(overhead)),
                total_cost=Decimal(str(total)),
                selling_price=Decimal(str(selling)),
                margin=Decimal(str(margin)),
                margin_rate=Decimal(str(margin_rate))
            )

    print(f"Created {len(products) * 2} ProductCost records")


def seed_reduction_projects():
    """원가 절감 프로젝트 데이터"""
    CostReductionProject.objects.all().delete()

    projects = [
        ('CRP-2024-001', '원자재 공급망 최적화', 'material', 3.5, 2.8, 80, 'in-progress', '김재료', 30),
        ('CRP-2024-002', '자동화 설비 도입', 'labor', 5.0, 4.2, 90, 'in-progress', '박노무', 60),
        ('CRP-2024-003', '에너지 효율화', 'overhead', 2.0, 2.1, 105, 'completed', '이경비', -30),
        ('CRP-2024-004', '폐기물 재활용', 'material', 1.5, 0.8, 55, 'in-progress', '최환경', 45),
        ('CRP-2024-005', '공정 개선 TF', 'labor', 3.0, 1.5, 50, 'in-progress', '정개선', 90),
        ('CRP-2024-006', '외주비 절감', 'overhead', 2.5, 0.5, 20, 'delayed', '강외주', 15),
        ('CRP-2024-007', '포장재 원가 절감', 'material', 1.0, 1.0, 100, 'completed', '윤포장', -60),
        ('CRP-2024-008', '물류비 최적화', 'overhead', 2.2, 1.8, 82, 'in-progress', '송물류', 120),
    ]

    today = date.today()

    for proj_id, title, category, target, actual, progress, status, person, days in projects:
        CostReductionProject.objects.create(
            project_id=proj_id,
            title=title,
            category=category,
            target_saving=Decimal(str(target)),
            actual_saving=Decimal(str(actual)),
            progress=Decimal(str(min(progress, 100))),
            status=status,
            responsible_person=person,
            due_date=today + timedelta(days=days)
        )

    print(f"Created {len(projects)} CostReductionProject records")


def seed_cost_drivers():
    """원가 동인 데이터"""
    CostDriver.objects.all().delete()

    drivers = [
        ('원자재 가격', 25.0, 8.5, 'up'),
        ('인건비', 22.0, 3.2, 'up'),
        ('에너지 비용', 15.0, 12.0, 'up'),
        ('물류비', 12.0, -2.5, 'down'),
        ('환율', 10.0, 5.0, 'up'),
        ('설비 감가', 8.0, 0.0, 'stable'),
        ('외주가공비', 5.0, -1.5, 'down'),
        ('소모품비', 3.0, 2.0, 'stable'),
    ]

    for month in [11, 12]:
        for name, impact, change, trend in drivers:
            impact_adj = impact + random.uniform(-1, 1)
            change_adj = change + random.uniform(-0.5, 0.5)

            CostDriver.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                driver_name=name,
                impact_rate=Decimal(str(round(impact_adj, 2))),
                change_rate=Decimal(str(round(change_adj, 2))),
                trend=trend
            )

    print(f"Created {len(drivers) * 2} CostDriver records")


def seed_break_even():
    """손익분기점 분석 데이터"""
    BreakEvenAnalysis.objects.all().delete()

    for month in range(1, 13):
        fixed = round(random.uniform(35, 42), 2)
        var_ratio = round(random.uniform(55, 62), 2)
        bep = round(fixed / (1 - var_ratio / 100), 2)
        actual = round(bep * random.uniform(1.1, 1.4), 2)
        safety = round((1 - bep / actual) * 100, 2)

        BreakEvenAnalysis.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            fixed_cost=Decimal(str(fixed)),
            variable_cost_ratio=Decimal(str(var_ratio)),
            break_even_point=Decimal(str(bep)),
            actual_sales=Decimal(str(actual)),
            margin_of_safety=Decimal(str(safety))
        )

    print("Created 12 BreakEvenAnalysis records")


def seed_cost_structure():
    """원가 구조 데이터"""
    CostStructure.objects.all().delete()

    cost_types = [
        ('direct_material', 40),
        ('direct_labor', 25),
        ('manufacturing_overhead', 18),
        ('selling_admin', 12),
        ('profit', 5),
    ]

    for month in [11, 12]:
        base_total = random.uniform(90, 110)

        for cost_type, base_ratio in cost_types:
            ratio = base_ratio + random.uniform(-2, 2)
            amount = round(base_total * ratio / 100, 2)

            CostStructure.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                cost_type=cost_type,
                amount=Decimal(str(amount)),
                ratio=Decimal(str(round(ratio, 2)))
            )

    print(f"Created {len(cost_types) * 2} CostStructure records")


def run_all():
    """모든 시드 데이터 실행"""
    print("Seeding Cost data...")
    seed_monthly_cost()
    seed_product_cost()
    seed_reduction_projects()
    seed_cost_drivers()
    seed_break_even()
    seed_cost_structure()
    print("Cost seeding complete!")


if __name__ == '__main__':
    run_all()
