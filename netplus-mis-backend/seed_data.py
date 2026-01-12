"""
샘플 데이터 생성 스크립트
유한산업 NetPlus MIS AI Dashboard
"""
import os
import sys
import django
from decimal import Decimal
from datetime import date, datetime, timedelta
import random

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

# 모델 임포트
from accounting.models import (
    BudgetActual, DepartmentProfitability, KPIPerformance,
    FinancialRatioAnalysis, BudgetAllocation, InvestmentROI
)
from manufacturing.models import (
    WorkshopStatus, CycleTime, OEEMetric,
    ManpowerAllocation, WorkStandard, EquipmentDowntime
)
from productivity.models import (
    HourlyProduction, LineUtilization, WorkerProductivity,
    OEEComponent, ProductionEfficiency, DailyProductionSummary
)
from development.models import (
    RDProject, InnovationMetric, Patent,
    RDPersonnel, TechnologyRoadmap, RDBudget
)
from reports.models import (
    ExecutiveSummary, DepartmentComparison, KeyMetricSummary,
    RiskOpportunity, Recommendation, MonthlyReport
)

def create_accounting_data():
    print("Creating accounting data...")

    # 예산 vs 실적
    categories = ['매출', '매출원가', '판관비', '영업이익', '당기순이익']
    for month in range(1, 13):
        for cat in categories:
            budget = Decimal(random.randint(50, 200))
            actual = budget * Decimal(random.uniform(0.85, 1.15))
            BudgetActual.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                category=cat,
                budget=budget,
                actual=actual,
                variance=actual - budget,
                variance_rate=(actual - budget) / budget * 100
            )

    # 부서별 수익성
    departments = ['생산1팀', '생산2팀', '영업팀', '개발팀', '품질팀', '관리팀']
    for month in range(1, 13):
        for dept in departments:
            revenue = Decimal(random.randint(30, 100))
            cost = revenue * Decimal(random.uniform(0.6, 0.85))
            profit = revenue - cost
            DepartmentProfitability.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                department=dept,
                revenue=revenue,
                cost=cost,
                profit=profit,
                margin=profit / revenue * 100
            )

    # KPI 성과
    kpis = [
        ('매출 목표', '억원'), ('영업이익률', '%'), ('고객만족도', '점'),
        ('납기준수율', '%'), ('불량률', '%'), ('재고회전율', '회')
    ]
    for month in range(1, 13):
        for kpi_name, unit in kpis:
            target = Decimal(random.randint(80, 100))
            actual = target * Decimal(random.uniform(0.85, 1.1))
            achievement = actual / target * 100
            status = 'achieved' if achievement >= 100 else ('on-track' if achievement >= 90 else 'at-risk')
            KPIPerformance.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                kpi_name=kpi_name,
                target=target,
                actual=actual,
                achievement_rate=achievement,
                status=status,
                unit=unit
            )

    # 재무비율 분석
    ratios = [
        ('매출총이익률', 'profitability'), ('영업이익률', 'profitability'),
        ('부채비율', 'stability'), ('유동비율', 'stability'),
        ('총자산회전율', 'activity'), ('재고자산회전율', 'activity'),
        ('매출성장률', 'growth'), ('영업이익성장률', 'growth')
    ]
    for month in range(1, 13):
        for ratio_name, category in ratios:
            FinancialRatioAnalysis.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                ratio_name=ratio_name,
                category=category,
                value=Decimal(random.uniform(10, 50)),
                industry_avg=Decimal(random.uniform(15, 40)),
                target=Decimal(random.uniform(20, 45))
            )

    # 예산 배분
    for dept in departments:
        allocated = Decimal(random.randint(50, 150))
        used = allocated * Decimal(random.uniform(0.5, 0.9))
        BudgetAllocation.objects.create(
            fiscal_year=2024,
            department=dept,
            allocated_budget=allocated,
            used_budget=used,
            remaining_budget=allocated - used,
            usage_rate=used / allocated * 100
        )

    # 투자 ROI
    projects = ['스마트팩토리 구축', '신제품 개발', 'ERP 시스템 업그레이드', '생산설비 자동화']
    statuses = ['planned', 'in-progress', 'completed']
    for proj in projects:
        investment = Decimal(random.randint(10, 50))
        expected = investment * Decimal(random.uniform(1.2, 2.0))
        actual_return = expected * Decimal(random.uniform(0.8, 1.2)) if random.choice([True, False]) else Decimal(0)
        InvestmentROI.objects.create(
            project_name=proj,
            investment_amount=investment,
            expected_return=expected,
            actual_return=actual_return,
            roi=(actual_return - investment) / investment * 100 if actual_return > 0 else Decimal(0),
            payback_period=Decimal(random.uniform(12, 36)),
            status=random.choice(statuses),
            start_date=date(2024, random.randint(1, 6), 1)
        )

def create_manufacturing_data():
    print("Creating manufacturing data...")

    # 작업장 현황
    workshops = [
        ('WS-001', '프레스 공장'), ('WS-002', '용접 공장'), ('WS-003', '도장 공장'),
        ('WS-004', '조립 공장'), ('WS-005', '검사장')
    ]
    products = ['A제품', 'B제품', 'C제품', 'D제품']
    for ws_id, ws_name in workshops:
        target = random.randint(500, 1000)
        actual = int(target * random.uniform(0.85, 1.05))
        WorkshopStatus.objects.create(
            workshop_id=ws_id,
            workshop_name=ws_name,
            status=random.choice(['running', 'running', 'running', 'idle', 'maintenance']),
            current_product=random.choice(products),
            operator_count=random.randint(5, 20),
            target_output=target,
            actual_output=actual,
            efficiency=Decimal(actual / target * 100)
        )

    # 사이클 타임
    processes = ['프레스', '용접', '도장', '조립', '검사', '포장']
    for month in range(1, 13):
        for proc in processes:
            standard = Decimal(random.uniform(30, 120))
            actual = standard * Decimal(random.uniform(0.9, 1.2))
            CycleTime.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                process_name=proc,
                standard_time=standard,
                actual_time=actual,
                variance=actual - standard,
                variance_rate=(actual - standard) / standard * 100
            )

    # OEE 지표
    equipment = [
        ('EQ-001', '프레스기 1호'), ('EQ-002', '프레스기 2호'),
        ('EQ-003', '용접로봇 1호'), ('EQ-004', '도장라인')
    ]
    for month in range(1, 13):
        for eq_id, eq_name in equipment:
            avail = Decimal(random.uniform(85, 98))
            perf = Decimal(random.uniform(88, 99))
            qual = Decimal(random.uniform(95, 99.5))
            OEEMetric.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                equipment_id=eq_id,
                equipment_name=eq_name,
                availability=avail,
                performance=perf,
                quality=qual,
                oee=avail * perf * qual / 10000
            )

    # 인력 배치
    today = date.today()
    for i in range(30):
        work_date = today - timedelta(days=i)
        for ws_id, ws_name in workshops[:3]:
            for shift in ['day', 'night']:
                allocated = random.randint(10, 20)
                present = int(allocated * random.uniform(0.85, 1.0))
                ManpowerAllocation.objects.create(
                    workshop=ws_name,
                    shift=shift,
                    allocated_workers=allocated,
                    present_workers=present,
                    absent_workers=allocated - present,
                    overtime_workers=random.randint(0, 5),
                    attendance_rate=Decimal(present / allocated * 100),
                    date=work_date
                )

    # 작업 표준
    for i, proc in enumerate(processes):
        WorkStandard.objects.create(
            standard_id=f'STD-{i+1:03d}',
            title=f'{proc} 작업 표준',
            process=proc,
            version='1.0',
            status='active',
            standard_time=Decimal(random.uniform(30, 120)),
            required_skill_level='중급',
            effective_date=date(2024, 1, 1)
        )

def create_productivity_data():
    print("Creating productivity data...")

    # 라인별 데이터
    lines = [
        ('LINE-A', 'A라인'), ('LINE-B', 'B라인'), ('LINE-C', 'C라인')
    ]

    # 시간당 생산량
    today = date.today()
    for i in range(7):
        prod_date = today - timedelta(days=i)
        for line_id, line_name in lines:
            for hour in range(8, 18):
                target = random.randint(50, 100)
                actual = int(target * random.uniform(0.8, 1.1))
                HourlyProduction.objects.create(
                    production_date=prod_date,
                    hour=hour,
                    line_id=line_id,
                    line_name=line_name,
                    target_output=target,
                    actual_output=actual,
                    achievement_rate=Decimal(actual / target * 100)
                )

    # 라인 가동률
    for month in range(1, 13):
        for line_id, line_name in lines:
            planned = Decimal(random.uniform(160, 200))
            actual = planned * Decimal(random.uniform(0.85, 0.98))
            LineUtilization.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                line_id=line_id,
                line_name=line_name,
                planned_time=planned,
                actual_time=actual,
                downtime=planned - actual,
                utilization_rate=actual / planned * 100
            )

    # 작업자 생산성
    workers = [
        ('W001', '김철수'), ('W002', '이영희'), ('W003', '박민수'),
        ('W004', '최지은'), ('W005', '정대현')
    ]
    departments = ['생산1팀', '생산2팀', '조립팀']
    for month in range(1, 13):
        for w_id, w_name in workers:
            hours = Decimal(random.uniform(160, 180))
            output = random.randint(800, 1200)
            productivity = output / float(hours)
            target_prod = Decimal(random.uniform(5, 7))
            WorkerProductivity.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                worker_id=w_id,
                worker_name=w_name,
                department=random.choice(departments),
                work_hours=hours,
                output_quantity=output,
                productivity=Decimal(str(productivity)),
                target_productivity=target_prod,
                achievement_rate=Decimal(productivity) / target_prod * 100
            )

    # OEE 구성요소
    for month in range(1, 13):
        for line_id, line_name in lines:
            avail = Decimal(random.uniform(88, 98))
            perf = Decimal(random.uniform(90, 99))
            qual = Decimal(random.uniform(96, 99.5))
            OEEComponent.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                line_id=line_id,
                line_name=line_name,
                availability=avail,
                performance=perf,
                quality_rate=qual,
                oee=avail * perf * qual / 10000
            )

    # 일일 생산 요약
    for i in range(30):
        prod_date = today - timedelta(days=i)
        target = random.randint(2000, 3000)
        actual = int(target * random.uniform(0.85, 1.05))
        defects = int(actual * random.uniform(0.005, 0.02))
        DailyProductionSummary.objects.get_or_create(
            production_date=prod_date,
            defaults={
                'total_target': target,
                'total_actual': actual,
                'total_defects': defects,
                'overall_efficiency': Decimal(actual / target * 100),
                'defect_rate': Decimal(defects / actual * 100),
                'active_lines': random.randint(2, 3),
                'total_workers': random.randint(30, 50)
            }
        )

def create_development_data():
    print("Creating development data...")

    # R&D 프로젝트
    projects = [
        ('PRJ-001', '차세대 센서 개발', '연구'),
        ('PRJ-002', '친환경 소재 적용', '개발'),
        ('PRJ-003', '스마트 제조 시스템', '기획'),
        ('PRJ-004', 'AI 품질검사 시스템', '시험'),
        ('PRJ-005', '경량화 기술 연구', '연구')
    ]
    leads = ['김연구', '이개발', '박기술', '최혁신']
    for proj_id, title, status_kr in projects:
        status_map = {'기획': 'planning', '연구': 'research', '개발': 'development', '시험': 'testing'}
        budget = Decimal(random.randint(5, 30))
        RDProject.objects.create(
            project_id=proj_id,
            title=title,
            description=f'{title} 프로젝트 설명',
            status=status_map.get(status_kr, 'planning'),
            priority=random.choice(['high', 'medium', 'low']),
            progress=Decimal(random.uniform(10, 90)),
            budget=budget,
            spent=budget * Decimal(random.uniform(0.3, 0.8)),
            team_lead=random.choice(leads),
            team_size=random.randint(3, 10),
            start_date=date(2024, random.randint(1, 6), 1),
            target_date=date(2024, random.randint(9, 12), 30)
        )

    # 혁신 지표
    metrics = [
        ('신제품 매출 비율', 'product'), ('공정 개선 건수', 'process'),
        ('서비스 혁신 지수', 'service'), ('신규 사업 발굴', 'business')
    ]
    for month in range(1, 13):
        for metric_name, category in metrics:
            target = Decimal(random.randint(10, 50))
            actual = target * Decimal(random.uniform(0.7, 1.2))
            InnovationMetric.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                category=category,
                metric_name=metric_name,
                target_value=target,
                actual_value=actual,
                achievement_rate=actual / target * 100,
                unit='건' if '건수' in metric_name else '%'
            )

    # 특허
    patents = [
        ('10-2024-0001', '고효율 센서 장치'),
        ('10-2024-0002', '친환경 코팅 조성물'),
        ('10-2024-0003', '자동화 검사 시스템'),
        ('10-2024-0004', '경량 구조체')
    ]
    for app_no, title in patents:
        Patent.objects.create(
            application_number=app_no,
            title=title,
            ip_type='patent',
            status=random.choice(['filed', 'pending', 'granted']),
            inventor=random.choice(leads),
            applicant='유한산업(주)',
            application_date=date(2024, random.randint(1, 12), random.randint(1, 28))
        )

    # R&D 인력
    rd_staff = [
        ('RD001', '김연구', '연구소', '선임연구원'),
        ('RD002', '이개발', '연구소', '책임연구원'),
        ('RD003', '박기술', '기술팀', '수석연구원'),
        ('RD004', '최혁신', '개발팀', '연구원'),
        ('RD005', '정과학', '연구소', '선임연구원')
    ]
    specialties = ['소재공학', '기계공학', 'AI/ML', '전자공학', '화학공학']
    for emp_id, name, dept, position in rd_staff:
        RDPersonnel.objects.create(
            employee_id=emp_id,
            name=name,
            department=dept,
            position=position,
            level=random.choice(['junior', 'senior', 'lead']),
            specialty=random.choice(specialties),
            years_of_experience=random.randint(3, 15),
            publications=random.randint(0, 10),
            patents=random.randint(0, 5),
            join_date=date(2024 - random.randint(1, 10), random.randint(1, 12), 1)
        )

    # 기술 로드맵
    technologies = [
        ('AI 품질검사', 'short-term', 2024),
        ('스마트팩토리 2.0', 'mid-term', 2025),
        ('탄소중립 생산', 'long-term', 2027)
    ]
    for tech_name, phase, target_year in technologies:
        TechnologyRoadmap.objects.create(
            technology_name=tech_name,
            phase=phase,
            status='in-progress' if phase == 'short-term' else 'planned',
            progress=Decimal(random.uniform(10, 80)) if phase == 'short-term' else Decimal(0),
            target_year=target_year,
            expected_impact=f'{tech_name} 도입으로 생산성 향상 기대',
            required_investment=Decimal(random.randint(10, 50))
        )

    # R&D 예산
    rd_categories = ['기초연구', '응용연구', '개발', '시험평가']
    for cat in rd_categories:
        allocated = Decimal(random.randint(10, 50))
        spent = allocated * Decimal(random.uniform(0.4, 0.8))
        RDBudget.objects.create(
            fiscal_year=2024,
            category=cat,
            allocated_budget=allocated,
            spent_budget=spent,
            remaining_budget=allocated - spent,
            execution_rate=spent / allocated * 100
        )

def create_reports_data():
    print("Creating reports data...")

    # 경영진 요약
    for month in range(1, 13):
        revenue = Decimal(random.randint(150, 250))
        op_profit = revenue * Decimal(random.uniform(0.08, 0.15))
        net_profit = op_profit * Decimal(random.uniform(0.7, 0.85))
        ExecutiveSummary.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            revenue=revenue,
            revenue_growth=Decimal(random.uniform(-5, 15)),
            operating_profit=op_profit,
            operating_margin=op_profit / revenue * 100,
            net_profit=net_profit,
            net_margin=net_profit / revenue * 100,
            production_volume=random.randint(50000, 80000),
            quality_rate=Decimal(random.uniform(97, 99.5)),
            employee_count=random.randint(280, 320)
        )

    # 부서별 비교
    departments = ['생산부', '영업부', '개발부', '품질부', '관리부']
    for month in range(1, 13):
        for dept in departments:
            revenue = Decimal(random.randint(20, 80))
            cost = revenue * Decimal(random.uniform(0.6, 0.85))
            DepartmentComparison.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                department=dept,
                revenue=revenue,
                cost=cost,
                profit=revenue - cost,
                headcount=random.randint(20, 80),
                productivity=Decimal(random.uniform(50, 150)),
                target_achievement=Decimal(random.uniform(85, 110))
            )

    # 주요 지표 요약
    key_metrics = [
        ('매출액', '재무'), ('영업이익률', '재무'),
        ('생산량', '생산'), ('불량률', '품질'),
        ('납기준수율', '물류'), ('고객만족도', '고객')
    ]
    for month in range(1, 13):
        for metric_name, category in key_metrics:
            current = Decimal(random.uniform(80, 120))
            target = Decimal(100)
            previous = current * Decimal(random.uniform(0.9, 1.1))
            change = (current - previous) / previous * 100
            KeyMetricSummary.objects.create(
                fiscal_year=2024,
                fiscal_month=month,
                metric_name=metric_name,
                category=category,
                current_value=current,
                target_value=target,
                previous_value=previous,
                change_rate=change,
                trend='up' if change > 0 else 'down',
                status='good' if current >= target * Decimal(0.95) else 'warning'
            )

    # 리스크/기회
    risks = [
        ('원자재 가격 상승', 'risk', '공급망'),
        ('환율 변동', 'risk', '재무'),
        ('신시장 진출 기회', 'opportunity', '전략'),
        ('친환경 규제 대응', 'risk', '환경'),
        ('디지털 전환 기회', 'opportunity', 'IT')
    ]
    for title, item_type, category in risks:
        RiskOpportunity.objects.create(
            item_type=item_type,
            title=title,
            description=f'{title}에 대한 상세 분석',
            category=category,
            priority=random.choice(['high', 'medium', 'low']),
            status=random.choice(['identified', 'analyzing', 'mitigating']),
            impact=Decimal(random.randint(5, 30)),
            probability=Decimal(random.uniform(20, 80)),
            owner='경영기획팀'
        )

    # 권고사항
    recommendations = [
        ('생산설비 자동화 투자', 'operational'),
        ('디지털 마케팅 강화', 'strategic'),
        ('인재 육성 프로그램', 'hr'),
        ('원가절감 활동', 'financial'),
        ('IT 인프라 개선', 'technology')
    ]
    for title, category in recommendations:
        Recommendation.objects.create(
            title=title,
            description=f'{title}에 대한 상세 권고',
            category=category,
            priority=random.choice(['high', 'medium']),
            status='pending',
            expected_benefit=Decimal(random.randint(5, 20)),
            required_investment=Decimal(random.randint(2, 10)),
            roi_estimate=Decimal(random.uniform(15, 50)),
            proposed_by='경영기획팀'
        )

    # 월간 리포트
    for month in range(1, 13):
        MonthlyReport.objects.create(
            fiscal_year=2024,
            fiscal_month=month,
            title=f'2024년 {month}월 경영 리포트',
            summary=f'2024년 {month}월 주요 경영 성과 요약',
            highlights='매출 목표 달성, 품질 향상',
            concerns='원자재 가격 상승, 인력 부족',
            next_month_plan='생산성 향상 활동, 신규 고객 확보',
            status='published' if month < 12 else 'draft',
            author='경영기획팀'
        )

def main():
    print("="*50)
    print("유한산업 NetPlus MIS 샘플 데이터 생성")
    print("="*50)

    create_accounting_data()
    create_manufacturing_data()
    create_productivity_data()
    create_development_data()
    create_reports_data()

    print("="*50)
    print("샘플 데이터 생성 완료!")
    print("="*50)

if __name__ == '__main__':
    main()
