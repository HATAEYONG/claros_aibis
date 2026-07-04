"""
ESG Seed Data
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

from esg.models import (
    ESGScore, CarbonEmission, EnergyConsumption,
    FourM2EMetric, EnvironmentalProject, SocialResponsibility, GovernanceMetric
)


def seed_esg_scores():
    """ESG 점수 데이터"""
    ESGScore.objects.all().delete()

    for month in range(1, 13):
        # 점진적으로 개선되는 트렌드
        base_env = 72 + month * 0.5 + random.uniform(-1, 1)
        base_social = 68 + month * 0.4 + random.uniform(-1, 1)
        base_gov = 75 + month * 0.3 + random.uniform(-0.5, 0.5)

        env = min(round(base_env, 2), 100)
        social = min(round(base_social, 2), 100)
        gov = min(round(base_gov, 2), 100)
        total = round((env * 0.4 + social * 0.3 + gov * 0.3), 2)

        ESGScore.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            environment_score=Decimal(str(env)),
            social_score=Decimal(str(social)),
            governance_score=Decimal(str(gov)),
            total_score=Decimal(str(total))
        )

    print("Created 12 ESGScore records")


def seed_carbon_emission():
    """탄소 배출량 데이터"""
    CarbonEmission.objects.all().delete()

    for month in range(1, 13):
        # 점진적 감축 트렌드
        target = round(1200 - month * 20, 2)
        actual = round(target * random.uniform(0.95, 1.05), 2)
        reduction = round((1200 - actual) / 1200 * 100, 2)

        CarbonEmission.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            target_emission=Decimal(str(target)),
            actual_emission=Decimal(str(actual)),
            reduction_rate=Decimal(str(reduction))
        )

    print("Created 12 CarbonEmission records")


def seed_energy_consumption():
    """에너지 소비 데이터"""
    EnergyConsumption.objects.all().delete()

    sources = [
        ('electricity', 800, 45),
        ('gas', 300, 15),
        ('oil', 150, 8),
        ('steam', 100, 6),
        ('solar', 50, 2),
    ]

    for month in [11, 12]:
        for source, base_consumption, base_cost in sources:
            consumption = round(base_consumption * random.uniform(0.9, 1.1), 2)
            cost = round(base_cost * random.uniform(0.95, 1.05), 2)

            EnergyConsumption.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                energy_source=source,
                consumption=Decimal(str(consumption)),
                cost=Decimal(str(cost))
            )

    print(f"Created {len(sources) * 2} EnergyConsumption records")


def seed_4m2e_metrics():
    """4M2E 지표 데이터"""
    FourM2EMetric.objects.all().delete()

    metrics = [
        ('man', '안전 교육 이수율', 100, '%'),
        ('man', '역량 평가 점수', 85, '점'),
        ('machine', '설비 가동률', 95, '%'),
        ('machine', '예방 정비율', 90, '%'),
        ('material', '자재 품질 적합률', 98, '%'),
        ('material', '재고 정확도', 99, '%'),
        ('method', '표준 작업 준수율', 95, '%'),
        ('method', '개선 제안 건수', 50, '건'),
        ('environment', '폐기물 재활용률', 85, '%'),
        ('environment', '오염물질 배출량', 50, 'kg'),
        ('energy', '에너지 효율', 90, '%'),
        ('energy', '재생에너지 비율', 15, '%'),
    ]

    for month in [11, 12]:
        for category, name, target, unit in metrics:
            if 'rate' in name.lower() or '률' in name:
                actual = round(target * random.uniform(0.92, 1.02), 2)
            else:
                actual = round(target * random.uniform(0.85, 1.15), 2)

            if actual >= target:
                status = 'excellent'
            elif actual >= target * 0.9:
                status = 'good'
            elif actual >= target * 0.8:
                status = 'warning'
            else:
                status = 'critical'

            FourM2EMetric.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                category=category,
                metric_name=name,
                target_value=Decimal(str(target)),
                actual_value=Decimal(str(actual)),
                unit=unit,
                status=status
            )

    print(f"Created {len(metrics) * 2} FourM2EMetric records")


def seed_environmental_projects():
    """환경 개선 프로젝트 데이터"""
    EnvironmentalProject.objects.all().delete()

    projects = [
        ('ENV-2024-001', '태양광 발전 설비 확장', 'energy', '연간 전력비 20% 절감', 15.0, 8.5, 75, 'in-progress'),
        ('ENV-2024-002', '폐수 재활용 시스템', 'environment', '용수 사용량 30% 절감', 8.0, 4.2, 90, 'in-progress'),
        ('ENV-2024-003', 'LED 조명 교체', 'energy', '조명 전력 50% 절감', 3.0, 2.8, 100, 'completed'),
        ('ENV-2024-004', '폐열 회수 시스템', 'energy', '난방비 25% 절감', 12.0, 0.0, 30, 'in-progress'),
        ('ENV-2024-005', '친환경 포장재 전환', 'material', '플라스틱 사용량 40% 감축', 5.0, 3.5, 85, 'in-progress'),
        ('ENV-2024-006', '폐기물 분리수거 고도화', 'waste', '재활용률 90% 달성', 2.0, 1.8, 100, 'completed'),
        ('ENV-2024-007', '전기차 충전 인프라', 'energy', '통근 차량 탄소 배출 감소', 6.0, 0.5, 15, 'planned'),
    ]

    today = date.today()

    for proj_id, title, category, impact, investment, saving, progress, status in projects:
        start = today - timedelta(days=random.randint(30, 180))
        end = start + timedelta(days=random.randint(90, 365))

        EnvironmentalProject.objects.create(
            project_id=proj_id,
            title=title,
            category=category,
            impact=impact,
            investment=Decimal(str(investment)),
            saving=Decimal(str(saving)),
            progress=Decimal(str(progress)),
            status=status,
            start_date=start,
            end_date=end
        )

    print(f"Created {len(projects)} EnvironmentalProject records")


def seed_social_responsibility():
    """사회적 책임 활동 데이터"""
    SocialResponsibility.objects.all().delete()

    activities = [
        ('지역사회 환경정화 활동', 250, 500, 15),
        ('취약계층 IT 교육 지원', 50, 200, 25),
        ('임직원 헌혈 캠페인', 180, 180, 5),
        ('청소년 멘토링 프로그램', 30, 300, 20),
        ('장학금 지원 사업', 0, 0, 100),
        ('중소기업 기술 지원', 20, 150, 30),
        ('저소득층 난방비 지원', 0, 0, 50),
        ('다문화 가정 지원', 15, 100, 18),
    ]

    for name, participants, hours, budget in activities:
        SocialResponsibility.objects.create(
            fiscal_year=2024,
            activity_name=name,
            participants=participants,
            hours=hours,
            budget=Decimal(str(budget))
        )

    print(f"Created {len(activities)} SocialResponsibility records")


def seed_governance_metrics():
    """지배구조 지표 데이터"""
    GovernanceMetric.objects.all().delete()

    metrics = [
        ('이사회 독립성', 60, 50, 'excellent'),
        ('여성 임원 비율', 25, 30, 'warning'),
        ('이사회 출석률', 95, 90, 'excellent'),
        ('감사위원회 운영', 100, 100, 'excellent'),
        ('윤리경영 교육 이수', 98, 95, 'excellent'),
        ('내부통제 점검', 92, 90, 'good'),
        ('리스크 관리 체계', 88, 85, 'good'),
        ('정보 공개 수준', 85, 80, 'good'),
    ]

    for name, actual, benchmark, status in metrics:
        GovernanceMetric.objects.create(
            fiscal_year=2024,
            metric_name=name,
            actual_value=Decimal(str(actual)),
            benchmark=Decimal(str(benchmark)),
            status=status
        )

    print(f"Created {len(metrics)} GovernanceMetric records")


def run_all():
    """모든 시드 데이터 실행"""
    print("Seeding ESG data...")
    seed_esg_scores()
    seed_carbon_emission()
    seed_energy_consumption()
    seed_4m2e_metrics()
    seed_environmental_projects()
    seed_social_responsibility()
    seed_governance_metrics()
    print("ESG seeding complete!")


if __name__ == '__main__':
    run_all()
