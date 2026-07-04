"""
Management command to seed business process data
O2C, P2P 프로세스 샘플 데이터 생성
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random
from business_process.models import (
    O2CStage, O2CIssue, O2COrder,
    P2PStage, P2PIssue, P2POrder,
    ProcessKPI
)


class Command(BaseCommand):
    help = 'Create sample business process data for O2C and P2P'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample business process data...')

        # Create O2C Stages
        self.create_o2c_stages()

        # Create P2P Stages
        self.create_p2p_stages()

        # Create O2C Orders
        self.create_o2c_orders()

        # Create P2P Orders
        self.create_p2p_orders()

        # Create Issues
        self.create_issues()

        # Create KPIs
        self.create_kpis()

        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

    def create_o2c_stages(self):
        """O2C 스테이지 생성"""
        o2c_stages = [
            {'stage_id': 'order_entry', 'order': 1, 'duration': 2, 'estimated_duration': 2},
            {'stage_id': 'production', 'order': 2, 'duration': 48, 'estimated_duration': 48},
            {'stage_id': 'delivery', 'order': 3, 'duration': 24, 'estimated_duration': 24},
            {'stage_id': 'billing', 'order': 4, 'duration': 4, 'estimated_duration': 4},
            {'stage_id': 'payment', 'order': 5, 'duration': 72, 'estimated_duration': 72},
        ]

        for stage_data in o2c_stages:
            O2CStage.objects.get_or_create(
                period_type='monthly',
                stage_id=stage_data['stage_id'],
                defaults={
                    'order': stage_data['order'],
                    'status': 'in_progress' if stage_data['order'] <= 2 else 'pending',
                    'duration': stage_data['duration'],
                    'estimated_duration': stage_data['estimated_duration'],
                    'volume': random.randint(50, 150),
                    'value': random.randint(50000000, 150000000),
                }
            )

        self.stdout.write('O2C stages created')

    def create_p2p_stages(self):
        """P2P 스테이지 생성"""
        p2p_stages = [
            {'stage_id': 'requisition', 'order': 1, 'duration': 4, 'estimated_duration': 4},
            {'stage_id': 'quotation', 'order': 2, 'duration': 24, 'estimated_duration': 24},
            {'stage_id': 'po_creation', 'order': 3, 'duration': 8, 'estimated_duration': 8},
            {'stage_id': 'receiving', 'order': 4, 'duration': 48, 'estimated_duration': 48},
            {'stage_id': 'invoice', 'order': 5, 'duration': 6, 'estimated_duration': 6},
            {'stage_id': 'payment', 'order': 6, 'duration': 96, 'estimated_duration': 96},
        ]

        for stage_data in p2p_stages:
            P2PStage.objects.get_or_create(
                period_type='monthly',
                stage_id=stage_data['stage_id'],
                defaults={
                    'order': stage_data['order'],
                    'status': 'in_progress' if stage_data['order'] <= 3 else 'pending',
                    'duration': stage_data['duration'],
                    'estimated_duration': stage_data['estimated_duration'],
                    'volume': random.randint(30, 80),
                    'value': random.randint(30000000, 100000000),
                }
            )

        self.stdout.write('P2P stages created')

    def create_o2c_orders(self):
        """O2C 주문 샘플 데이터 생성"""
        customers = ['삼성전자', 'LG전자', '현대자동차', 'SK하이닉스', '포스코']
        products = ['반도체부품', '정밀기계부품', '자동차부품', '디스플레이모듈', '전자회로기판']
        stages = ['order_entry', 'production', 'delivery', 'billing', 'payment']
        statuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled']

        for i in range(20):
            order_date = datetime.now() - timedelta(days=random.randint(1, 30))
            promised_date = order_date + timedelta(days=random.randint(7, 14))

            O2COrder.objects.get_or_create(
                order_id=f'O2C-{datetime.now().year}-{i+1:04d}',
                defaults={
                    'customer': random.choice(customers),
                    'product': random.choice(products),
                    'quantity': random.randint(100, 1000),
                    'amount': random.randint(1000000, 50000000),
                    'stage': random.choice(stages),
                    'status': random.choice(statuses),
                    'order_date': order_date.date(),
                    'promised_date': promised_date.date(),
                    'actual_date': promised_date.date() if random.choice([True, False]) else None,
                    'notes': f'주문 메모 {i+1}',
                }
            )

        self.stdout.write('O2C orders created')

    def create_p2p_orders(self):
        """P2P 발주 샘플 데이터 생성"""
        suppliers = ['미쓰비시', 'GE Healthcare', '시멘스', 'ABB', '쉬나이더일렉트릭']
        materials = ['센서모듈', '컨트롤러', '모터구동부', '전력변환장치', '유압시스템']
        stages = ['requisition', 'quotation', 'po_creation', 'receiving', 'invoice', 'payment']
        statuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled']

        for i in range(15):
            order_date = datetime.now() - timedelta(days=random.randint(1, 30))
            promised_date = order_date + timedelta(days=random.randint(10, 21))

            P2POrder.objects.get_or_create(
                order_id=f'P2P-{datetime.now().year}-{i+1:04d}',
                defaults={
                    'supplier': random.choice(suppliers),
                    'material': random.choice(materials),
                    'quantity': random.randint(50, 500),
                    'amount': random.randint(2000000, 80000000),
                    'stage': random.choice(stages),
                    'status': random.choice(statuses),
                    'order_date': order_date.date(),
                    'promised_date': promised_date.date(),
                    'actual_date': promised_date.date() if random.choice([True, False]) else None,
                    'notes': f'발주 메모 {i+1}',
                }
            )

        self.stdout.write('P2P orders created')

    def create_issues(self):
        """이슈 생성"""
        o2c_stages = O2CStage.objects.all()
        p2p_stages = P2PStage.objects.all()

        issue_types = ['delay', 'quality', 'cost', 'capacity', 'supplier']
        severities = ['low', 'medium', 'high']
        descriptions = [
            '자재 공급 지연으로 인한 생산 차질',
            '품질 기준 미달 사항 발생',
            '원자재 가격 상승으로 비용 증가',
            '설비 용량 부족으로 처리 지연',
            '공급업체 납기 지연',
            '인력 부족으로 처리 지연',
            '시스템 오류로 인한 데이터 처리 불가',
        ]

        # O2C Issues
        for i, stage in enumerate(o2c_stages):
            if random.choice([True, False]):
                O2CIssue.objects.get_or_create(
                    issue_id=f'O2C-ISSUE-{i+1:03d}',
                    defaults={
                        'stage': stage,
                        'issue_type': random.choice(issue_types),
                        'severity': random.choice(severities),
                        'description': random.choice(descriptions),
                        'affected_orders': random.randint(1, 10),
                        'resolved': random.choice([True, False]),
                        'resolved_at': timezone.now() - timedelta(days=random.randint(1, 10)) if random.choice([True, False]) else None,
                    }
                )

        # P2P Issues
        for i, stage in enumerate(p2p_stages):
            if random.choice([True, False]):
                P2PIssue.objects.get_or_create(
                    issue_id=f'P2P-ISSUE-{i+1:03d}',
                    defaults={
                        'stage': stage,
                        'issue_type': random.choice(issue_types),
                        'severity': random.choice(severities),
                        'description': random.choice(descriptions),
                        'affected_orders': random.randint(1, 8),
                        'resolved': random.choice([True, False]),
                        'resolved_at': timezone.now() - timedelta(days=random.randint(1, 10)) if random.choice([True, False]) else None,
                    }
                )

        self.stdout.write('Issues created')

    def create_kpis(self):
        """KPI 생성"""
        o2c_kpis = [
            {'kpi_code': 'O2C_001', 'kpi_name': '주문처리시간', 'unit': '시간', 'current_value': 72, 'target_value': 48},
            {'kpi_code': 'O2C_002', 'kpi_name': '주문정시완료율', 'unit': '%', 'current_value': 85, 'target_value': 95},
            {'kpi_code': 'O2C_003', 'kpi_name': '배송정시도착율', 'unit': '%', 'current_value': 92, 'target_value': 98},
            {'kpi_code': 'O2C_004', 'kpi_name': '청구정확도', 'unit': '%', 'current_value': 98, 'target_value': 99},
            {'kpi_code': 'O2C_005', 'kpi_name': '회수기간(DSO)', 'unit': '일', 'current_value': 35, 'target_value': 30},
        ]

        p2p_kpis = [
            {'kpi_code': 'P2P_001', 'kpi_name': '구매요청처리시간', 'unit': '시간', 'current_value': 24, 'target_value': 16},
            {'kpi_code': 'P2P_002', 'kpi_name': '발주정시처리율', 'unit': '%', 'current_value': 88, 'target_value': 95},
            {'kpi_code': 'P2P_003', 'kpi_name': '입고검수합격률', 'unit': '%', 'current_value': 96, 'target_value': 99},
            {'kpi_code': 'P2P_004', 'kpi_name': '송장처리기간', 'unit': '일', 'current_value': 5, 'target_value': 3},
            {'kpi_code': 'P2P_005', 'kpi_name': '지급기간준수율', 'unit': '%', 'current_value': 90, 'target_value': 95},
        ]

        trends = ['up', 'down', 'stable']

        # O2C KPIs
        for kpi_data in o2c_kpis:
            for stage in ['order_entry', 'production', 'delivery']:
                ProcessKPI.objects.get_or_create(
                    process_type='o2c',
                    stage_id=stage,
                    kpi_code=kpi_data['kpi_code'],
                    period_value=f'{datetime.now().year}-{datetime.now().month:02d}',
                    defaults={
                        'kpi_name': kpi_data['kpi_name'],
                        'current_value': kpi_data['current_value'] * random.uniform(0.9, 1.1),
                        'target_value': kpi_data['target_value'],
                        'unit': kpi_data['unit'],
                        'trend': random.choice(trends),
                        'period_type': 'monthly',
                    }
                )

        # P2P KPIs
        for kpi_data in p2p_kpis:
            for stage in ['requisition', 'quotation', 'po_creation']:
                ProcessKPI.objects.get_or_create(
                    process_type='p2p',
                    stage_id=stage,
                    kpi_code=kpi_data['kpi_code'],
                    period_value=f'{datetime.now().year}-{datetime.now().month:02d}',
                    defaults={
                        'kpi_name': kpi_data['kpi_name'],
                        'current_value': kpi_data['current_value'] * random.uniform(0.9, 1.1),
                        'target_value': kpi_data['target_value'],
                        'unit': kpi_data['unit'],
                        'trend': random.choice(trends),
                        'period_type': 'monthly',
                    }
                )

        self.stdout.write('KPIs created')
