# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Load sample data for the Claros MIS Dashboard'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write('샘플 데이터 로딩 시작...')
        self.stdout.write('=' * 60)

        with transaction.atomic():
            self.load_sales_data()
            self.load_quality_data()
            self.load_production_data()
            self.load_financial_data()
            self.load_purchase_data()
            self.load_manufacturing_data()
            self.load_cost_data()
            self.load_esg_data()
            self.load_accounting_data()
            self.load_productivity_data()
            self.load_development_data()
            self.load_reports_data()

        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS('[완료] 샘플 데이터 로딩 완료!'))
        self.stdout.write('=' * 60)

    def load_sales_data(self):
        """매출 데이터 로드"""
        self.stdout.write('[매출] 매출 데이터 로딩 중...')

        from sales.models import (
            MonthlySales, ProductSales, CustomerTier, SalesPipeline,
            SalesTeamPerformance, TopCustomer
        )

        # 월별 매출 (최근 12개월)
        today = datetime.now()
        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            target = Decimal(f'{random.uniform(80, 120):.2f}')
            actual = target * Decimal(str(random.uniform(0.85, 1.15)))
            actual = actual.quantize(Decimal('0.01'))
            achievement = (actual / target * 100) if target > 0 else 0

            MonthlySales.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                target_amount=target,
                actual_amount=actual,
                achievement_rate=Decimal(str(achievement)),
                new_customers=random.randint(5, 25),
                contract_rate=Decimal(f'{random.uniform(20, 40):.2f}'),
                pipeline_value=Decimal(f'{random.uniform(100, 300):.2f}')
            )

        # 제품별 매출
        products = [
            ('P001', '스마트 센서 모듈', '전자부품'),
            ('P002', '자동차 제어 유닛', '전자제어'),
            ('P003', '산업용 로봇 arm', '로봇'),
            ('P004', 'IoT 게이트웨이', '통신'),
            ('P005', '전력 변환 장치', '전력'),
        ]

        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for code, name, category in products:
                amount = Decimal(f'{random.uniform(10, 50):.2f}')
                ProductSales.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    product_code=code,
                    product_name=name,
                    sales_amount=amount,
                    sales_quantity=random.randint(100, 1000),
                    share_rate=Decimal(f'{random.uniform(5, 25):.2f}')
                )

        # 고객 등급별 매출
        tiers = ['VIP', 'Gold', 'Silver', 'Bronze']
        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for tier in tiers:
                customers = random.randint(5, 50) if tier != 'VIP' else random.randint(1, 10)
                amount = Decimal(f'{customers * random.uniform(1, 10):.2f}')
                CustomerTier.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    tier=tier,
                    customer_count=customers,
                    sales_amount=amount,
                    share_rate=Decimal(f'{random.uniform(5, 30):.2f}')
                )

        # 영업 파이프라인
        stages = ['lead', 'contact', 'proposal', 'negotiation', 'closing']
        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for stage in stages:
                SalesPipeline.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    stage=stage,
                    opportunity_count=random.randint(5, 30),
                    total_value=Decimal(f'{random.uniform(50, 200):.2f}'),
                    conversion_rate=Decimal(f'{random.uniform(10, 40):.2f}')
                )

        # 영업팀 성과
        salespeople = ['김영업', '이영업', '박영업', '최영업', '정영업']
        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for name in salespeople:
                target = Decimal(f'{random.uniform(10, 20):.2f}')
                actual = target * Decimal(str(random.uniform(0.8, 1.2)))
                actual = actual.quantize(Decimal('0.01'))
                SalesTeamPerformance.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    salesperson_name=name,
                    target_amount=target,
                    actual_amount=actual,
                    deal_count=random.randint(3, 15),
                    conversion_rate=Decimal(f'{random.uniform(15, 35):.2f}')
                )

        # 주요 거래처
        customers = [
            ('C001', '삼성전자', 'active'),
            ('C002', 'LG전자', 'active'),
            ('C003', '현대자동차', 'active'),
            ('C004', '기아', 'warning'),
            ('C005', 'POSCO', 'active'),
        ]

        for i in range(12):
            year = today.year - (1 if today.month - i <= 0 else 0)
            month = (today.month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for code, name, status in customers:
                TopCustomer.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    customer_code=code,
                    customer_name=name,
                    revenue=Decimal(f'{random.uniform(20, 100):.2f}'),
                    growth_rate=Decimal(f'{random.uniform(-10, 20):.2f}'),
                    status=status
                )

        self.stdout.write('   [완료] 매출 데이터 완료')

    def load_quality_data(self):
        """품질 데이터 로드"""
        self.stdout.write('[진행] 품질 데이터 로딩 중...')

        from quality.models import (
            QualityInspection, DefectType, DefectRecord,
            CustomerComplaint, ProcessCapability, FactQuality
        )

        # 불량 유형
        defect_types = [
            ('D001', '치수 불량', 'critical', '제품 치수가 규격에서 벗어남'),
            ('D002', '납불 불량', 'major', '제품 표면에 납불 발생'),
            ('D003', '조립 불량', 'major', '부품 조립 불량'),
            ('D004', '기능 불량', 'critical', '제품 기능 작동 불량'),
            ('D005', '포장 불량', 'minor', '포장 상태 불량'),
        ]

        for code, name, severity, desc in defect_types:
            DefectType.objects.create(
                code=code,
                name=name,
                severity=severity,
                description=desc
            )

        # 품질 검사 데이터
        inspection_types = ['incoming', 'in_process', 'final', 'outgoing']
        results = ['pass', 'pass', 'pass', 'pass', 'fail']  # 80% pass rate

        for i in range(90):  # 최근 90일
            date = datetime.now() - timedelta(days=i)

            for j in range(random.randint(3, 8)):  # 하루 3-8건 검사
                insp_num = f'QI{date.strftime("%Y%m%d")}{j:03d}'
                sample_size = random.randint(50, 200)
                defect_count = random.randint(0, 10)

                inspection = QualityInspection.objects.create(
                    inspection_number=insp_num,
                    inspection_type=random.choice(inspection_types),
                    product_name=f'제품-{random.choice(["A", "B", "C", "D"])}',
                    product_code=f'P{random.choice(["001", "002", "003", "004"])}',
                    lot_number=f'LOT{date.strftime("%Y%m%d")}{j:02d}',
                    inspection_date=date.date(),
                    inspector=f'검사원{random.randint(1, 5)}',
                    sample_size=sample_size,
                    defect_count=defect_count,
                    result=random.choice(results),
                    notes=f'정상 검사 완료' if defect_count == 0 else '불량 발생'
                )

                # 불량 기록
                if defect_count > 0 and random.random() > 0.5:
                    DefectRecord.objects.create(
                        inspection=inspection,
                        defect_type=DefectType.objects.order_by('?').first(),
                        quantity=random.randint(1, defect_count),
                        location=f'공정-{random.randint(1, 5)}',
                        corrective_action='공정 개선 필요'
                    )

        # 고객 클레임
        for i in range(10):
            complaint_date = datetime.now() - timedelta(days=random.randint(1, 90))
            CustomerComplaint.objects.create(
                complaint_number=f'CC{complaint_date.strftime("%Y%m%d")}{i:02d}',
                customer_name=random.choice(['삼성전자', 'LG전자', '현대차', '기아']),
                product_name=f'제품-{random.choice(["A", "B", "C"])}',
                product_code=f'P{random.choice(["001", "002", "003"])}',
                complaint_date=complaint_date.date(),
                description=f'품질 이슈로 인한 클레임 접수',
                severity=random.choice(['high', 'medium', 'low']),
                status=random.choice(['received', 'investigating', 'resolving', 'resolved']),
                assigned_to=f'담당자{random.randint(1, 3)}',
                root_cause=f'공정-{random.randint(1, 5)}에서 발생',
                corrective_action='공정 개선 및 재교육 실시'
            )

        # 공정 능력 (CPK)
        for i in range(20):
            ProcessCapability.objects.create(
                product_name=f'제품-{random.choice(["A", "B", "C", "D"])}',
                product_code=f'P{random.choice(["001", "002", "003", "004"])}',
                process_name=f'공정-{random.choice(["SMT", "조립", "검사", "포장"])}',
                measurement_date=datetime.now() - timedelta(days=random.randint(1, 30)),
                usl=Decimal('10.05'),
                lsl=Decimal('9.95'),
                target=Decimal('10.00'),
                mean=Decimal(f'{9.95 + random.uniform(0, 0.1):.3f}'),
                std_dev=Decimal(f'{random.uniform(0.01, 0.05):.3f}'),
                cp=Decimal(f'{random.uniform(0.8, 2.0):.2f}'),
                cpk=Decimal(f'{random.uniform(0.6, 1.8):.2f}'),
                ppk=Decimal(f'{random.uniform(0.5, 1.6):.2f}'),
                sample_size=random.randint(50, 200)
            )

        # Fact 품질 데이터
        for i in range(100):
            date = datetime.now() - timedelta(days=i // 2)
            insp_type = random.choice(['입고', '공정', '출하'])
            product_id = f'P{random.choice(["001", "002", "003", "004"])}'
            FactQuality.objects.create(
                inspection_date=date.date(),
                inspection_type=insp_type,
                product_id=product_id,
                product_name=f'제품-{random.choice(["A", "B", "C", "D"])}',
                lot_no=f'LOT{date.strftime("%Y%m%d")}',
                qty_inspected=random.randint(100, 500),
                qty_passed=random.randint(90, 500),
                qty_failed=random.randint(0, 20),
                qty_rework=random.randint(0, 10),
                defect_type=random.choice([None, '치수', '납불', '기능', '외관']),
                defect_cause=random.choice([None, '설비', '자재', '작업자', '공정']),
                defect_rate=Decimal(f'{random.uniform(0, 5):.2f}') if random.random() > 0.3 else None,
                inspector=f'검사원{random.randint(1, 5)}',
                source_id=f'QUAL_{date.strftime("%Y%m%d")}_{insp_type}_{product_id}_{i}'
            )

        self.stdout.write('   [완료] 품질 데이터 완료')

    def load_production_data(self):
        """생산 데이터 로드"""
        self.stdout.write('[진행] 생산 데이터 로딩 중...')

        from production.models import (
            ProductionLine, WorkOrder, DailyProduction, Equipment,
            FactProduction, DimProduct, DimEquipment, DimBOM
        )

        # 생산 라인
        for i in range(1, 6):
            ProductionLine.objects.create(
                name=f'LINE-{i:02d}',
                code=f'L{i:02d}',
                location=f'공장1-{i}층',
                capacity=random.randint(500, 1500),
                is_active=True
            )

        # 제품 마스터
        products = [
            ('P001', '스마트 센서 모듈', '전자부품', '개', 50000, 85000),
            ('P002', '자동차 제어 유닛', '전자제어', '개', 80000, 120000),
            ('P003', '산업용 로봇 arm', '로봇', '대', 200000, 350000),
            ('P004', 'IoT 게이트웨이', '통신', '대', 150000, 250000),
            ('P005', '전력 변환 장치', '전력', '대', 100000, 180000),
        ]

        for code, name, category, unit, cost, price in products:
            DimProduct.objects.create(
                product_id=code,
                product_name=name,
                product_name_en=name,
                category=category,
                product_type='완제품',
                product_group='그룹A',
                specification=f'{name} 규격서',
                unit=unit,
                standard_cost=Decimal(str(cost)),
                selling_price=Decimal(str(price))
            )

        # 설비 마스터
        for i in range(1, 11):
            DimEquipment.objects.create(
                equipment_id=f'EQUIP{i:03d}',
                equipment_name=f'설비-{i:02d}',
                plant='PLANT01',
                line=f'LINE-{((i-1)//2 + 1):02d}',
                location=f'위치-{i}',
                manufacturer='한국기계',
                model=f'KM-{i}000',
                capacity=Decimal(f'{random.randint(50, 200):.2f}'),
                install_date=datetime.now() - timedelta(days=random.randint(100, 1000)),
                status='ACTIVE'
            )

        # BOM
        DimBOM.objects.create(
            parent_product='P001',
            child_product='M001',
            quantity=Decimal('2.0'),
            unit='개',
            level=1,
            sequence=1,
            valid_from=datetime.now().date(),
            is_active=True,
            source_id='BOM_P001_M001'
        )

        # 작업 지시서
        lines = list(ProductionLine.objects.all())
        for i in range(30):
            work_date = datetime.now() - timedelta(days=i)
            production_line = random.choice(lines)
            product_code = random.choice(['P001', 'P002', 'P003', 'P004', 'P005'])
            WorkOrder.objects.create(
                order_number=f'WO{work_date.strftime("%Y%m%d")}{i:03d}',
                production_line=production_line,
                product_code=product_code,
                product_name=f'제품-{random.choice(["A", "B", "C"])}',
                target_quantity=random.randint(500, 1000),
                planned_start=work_date.replace(hour=8, minute=0),
                planned_end=work_date.replace(hour=17, minute=0),
                status='completed',
                actual_quantity=random.randint(450, 1000)
            )

        # 일일 생산 실적
        for i in range(90):
            prod_date = datetime.now() - timedelta(days=i)

            for line_id in range(1, 6):
                target = random.randint(500, 800)
                actual = random.randint(450, target)
                DailyProduction.objects.create(
                    production_line_id=line_id,
                    production_date=prod_date.date(),
                    target_quantity=target,
                    actual_quantity=actual,
                    defect_quantity=random.randint(0, 30),
                    operating_hours=Decimal('8.0'),
                    downtime_hours=Decimal(f'{random.uniform(0, 1):.2f}'),
                    efficiency=Decimal(f'{(actual/target * 100) if target > 0 else 0:.2f}')
                )

        # Fact 생산 데이터
        for i in range(90):
            work_date = datetime.now() - timedelta(days=i)
            for line_id in range(1, 6):
                target = random.randint(500, 800)
                actual = random.randint(450, target)
                FactProduction.objects.create(
                    work_date=work_date.date(),
                    plant='PLANT01',
                    line=f'LINE-{line_id:02d}',
                    product_id=random.choice(['P001', 'P002', 'P003', 'P004', 'P005']),
                    product_name=f'제품-{random.choice(["A", "B", "C"])}',
                    qty_plan=target,
                    qty_actual=actual,
                    qty_bad=random.randint(0, 30),
                    qty_good=actual - random.randint(0, 30),
                    work_hours=Decimal('8.0'),
                    setup_time=Decimal('0.5'),
                    downtime=Decimal(f'{random.uniform(0, 1):.2f}'),
                    efficiency=Decimal(f'{(actual/target * 100) if target > 0 else 0:.2f}'),
                    uph=Decimal(f'{actual/8:.2f}'),
                    source_id=f'PROD_{work_date.strftime("%Y%m%d")}_{line_id}'
                )

        self.stdout.write('   [완료] 생산 데이터 완료')

    def load_financial_data(self):
        """재무 데이터 로드"""
        self.stdout.write('[진행] 재무 데이터 로딩 중...')

        from financial.models import FinancialStatement, FinancialRatio

        # 재무제표 (최근 12개월)
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            revenue = Decimal(f'{random.uniform(80, 120):.2f}')
            cogs = revenue * Decimal('0.65')
            gross_profit = revenue - cogs
            sg_expense = Decimal(f'{random.uniform(15, 25):.2f}')
            operating_profit = gross_profit - sg_expense
            other_income = Decimal(f'{random.uniform(-2, 5):.2f}')
            net_profit = operating_profit + other_income

            # 자산/부채/자본
            assets = Decimal(f'{random.uniform(150, 200):.2f}')
            liabilities = Decimal(f'{random.uniform(80, 120):.2f}')
            equity = assets - liabilities

            FinancialStatement.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                statement_type='income',
                revenue=revenue,
                cost_of_sales=cogs,
                gross_profit=gross_profit,
                operating_income=operating_profit,
                net_income=net_profit
            )

            FinancialStatement.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                statement_type='balance',
                total_assets=assets,
                total_liabilities=liabilities,
                total_equity=equity,
                current_assets=assets * Decimal('0.6'),
                current_liabilities=liabilities * Decimal('0.5')
            )

        # 재무비율
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            FinancialRatio.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                roe=Decimal(f'{random.uniform(5, 20):.2f}'),
                roa=Decimal(f'{random.uniform(3, 12):.2f}'),
                operating_margin=Decimal(f'{random.uniform(8, 18):.2f}'),
                net_margin=Decimal(f'{random.uniform(5, 15):.2f}'),
                debt_ratio=Decimal(f'{random.uniform(40, 70):.2f}'),
                current_ratio=Decimal(f'{random.uniform(100, 180):.2f}'),
                quick_ratio=Decimal(f'{random.uniform(80, 150):.2f}'),
                asset_turnover=Decimal(f'{random.uniform(0.5, 1.5):.2f}'),
                inventory_turnover=Decimal(f'{random.uniform(3, 8):.2f}')
            )

        self.stdout.write('   [완료] 재무 데이터 완료')

    def load_purchase_data(self):
        """구매 데이터 로드"""
        self.stdout.write('[진행] 구매 데이터 로딩 중...')

        from purchase.models import (
            MonthlyPurchase, Inventory, PurchaseOrder, Supplier,
            MaterialPrice, InventoryTurnover, FactInventory
        )

        # 월별 구매
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            amount = Decimal(f'{random.uniform(30, 50):.2f}')
            prev_change = Decimal(f'{random.uniform(-10, 10):.2f}')

            MonthlyPurchase.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                purchase_amount=amount,
                previous_month_change=prev_change,
                order_count=random.randint(20, 50),
                pending_orders=random.randint(2, 10)
            )

        # 재고 현황
        items = [
            ('M001', '칩셋 리지스터', 'A', 'adequate'),
            ('M002', '캐패시터', 'A', 'adequate'),
            ('M003', '저항기', 'B', 'low'),
            ('M004', '커넥터', 'B', 'adequate'),
            ('M005', 'PCB 기판', 'C', 'high'),
        ]

        for code, name, category, status in items:
            stock = random.randint(500, 5000)
            Inventory.objects.create(
                item_code=code,
                item_name=name,
                category=category,
                current_stock=stock,
                safety_stock=int(stock * 0.2),
                stock_value=Decimal(f'{stock * random.uniform(100, 1000):.2f}'),
                turnover_rate=Decimal(f'{random.uniform(2, 8):.2f}'),
                status=status
            )

        # 발주 현황
        for i in range(20):
            order_date = datetime.now() - timedelta(days=random.randint(1, 30))
            delivery_date = order_date + timedelta(days=random.randint(7, 30))

            PurchaseOrder.objects.create(
                po_number=f'PO{order_date.strftime("%Y%m%d")}{i:03d}',
                supplier_name=f'공급사{random.randint(1, 5)}',
                item_name=random.choice(['칩셋', '캐패시터', '저항기', '커넥터']),
                quantity=random.randint(100, 1000),
                unit_price=Decimal(f'{random.uniform(100, 5000):.2f}'),
                total_amount=Decimal(f'{random.uniform(10, 100):.2f}'),
                order_date=order_date.date(),
                delivery_date=delivery_date.date(),
                status=random.choice(['ordered', 'in-transit', 'received', 'delayed']),
                is_urgent=random.random() > 0.8
            )

        # 공급업체
        for i in range(1, 6):
            Supplier.objects.create(
                supplier_code=f'S{i:03d}',
                supplier_name=f'공급사{i}',
                quality_score=Decimal(f'{random.uniform(70, 95):.2f}'),
                delivery_score=Decimal(f'{random.uniform(75, 98):.2f}'),
                price_score=Decimal(f'{random.uniform(65, 90):.2f}'),
                service_score=Decimal(f'{random.uniform(70, 95):.2f}'),
                total_score=Decimal(f'{random.uniform(70, 92):.2f}'),
                grade=random.choice(['A', 'A', 'B', 'B', 'C']),
                trend=random.choice(['up', 'stable', 'down', 'stable']),
                purchase_share=Decimal(f'{random.uniform(10, 30):.2f}')
            )

        # 재고 팩트 데이터
        counter = 0
        for i in range(90):
            inv_date = datetime.now() - timedelta(days=i // 3)
            for warehouse in ['WH01', 'WH02']:
                for j in range(3):
                    qty = random.randint(100, 2000)
                    FactInventory.objects.create(
                        inventory_date=inv_date.date(),
                        warehouse=warehouse,
                        location=f'LOC-{j+1:02d}',
                        product_id=random.choice(['P001', 'P002', 'P003', 'P004', 'P005']),
                        product_name=f'제품-{random.choice(["A", "B", "C"])}',
                        lot_no=f'LOT{inv_date.strftime("%Y%m%d")}',
                        qty_on_hand=qty,
                        qty_available=int(qty * random.uniform(0.8, 0.95)),
                        qty_reserved=int(qty * random.uniform(0, 0.2)),
                        qty_in_transit=random.randint(0, 100),
                        unit_cost=Decimal(f'{random.uniform(1000, 10000):.2f}'),
                        total_value=Decimal(f'{qty * random.uniform(1000, 10000):.2f}'),
                        safety_stock=int(qty * 0.2),
                        reorder_point=int(qty * 0.25),
                        lead_time_days=random.randint(7, 30),
                        source_id=f'INV_{inv_date.strftime("%Y%m%d")}_{warehouse}_{j}_{counter}'
                    )
                    counter += 1

        self.stdout.write('   [완료] 구매 데이터 완료')

    def load_manufacturing_data(self):
        """제조 데이터 로드"""
        self.stdout.write('[진행] 제조 데이터 로딩 중...')

        from manufacturing.models import (
            WorkshopStatus, CycleTime, OEEMetric,
            ManpowerAllocation, WorkStandard, EquipmentDowntime
        )

        # 작업장 현황
        for i in range(1, 6):
            WorkshopStatus.objects.create(
                workshop_id=f'WS{i:02d}',
                workshop_name=f'작업장-{i}',
                status=random.choice(['running', 'running', 'running', 'idle', 'maintenance']),
                current_product=f'제품-{random.choice(["A", "B", "C"])}',
                operator_count=random.randint(5, 10),
                target_output=random.randint(500, 800),
                actual_output=random.randint(400, 800),
                efficiency=Decimal(f'{random.uniform(75, 95):.2f}')
            )

        # 사이클 타임
        processes = ['SMT mounting', '조립', '테스트', '포장']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for process in processes:
                standard = Decimal(f'{random.uniform(30, 120):.2f}')
                actual = standard * Decimal(random.uniform(0.9, 1.15))
                CycleTime.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    process_name=process,
                    standard_time=standard,
                    actual_time=actual,
                    variance=actual - standard,
                    variance_rate=Decimal(f'{((actual - standard) / standard * 100):.2f}')
                )

        # OEE 지표
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for j in range(1, 6):
                availability = Decimal(f'{random.uniform(85, 95):.2f}')
                performance = Decimal(f'{random.uniform(80, 95):.2f}')
                quality_rate = Decimal(f'{random.uniform(95, 99):.2f}')
                oee_value = (availability * performance * quality_rate) / 10000

                OEEMetric.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    equipment_id=f'EQUIP{j:02d}',
                    equipment_name=f'설비-{j:02d}',
                    availability=availability,
                    performance=performance,
                    quality=quality_rate,
                    oee=Decimal(f'{oee_value:.2f}'),
                    target_oee=Decimal('85.00')
                )

        # 인력 배치
        for i in range(7):
            work_date = datetime.now() - timedelta(days=i)
            for workshop in ['작업장-1', '작업장-2', '작업장-3']:
                for shift in ['day', 'night']:
                    allocated = random.randint(8, 12)
                    present = random.randint(7, allocated)
                    ManpowerAllocation.objects.create(
                        workshop=workshop,
                        shift=shift,
                        allocated_workers=allocated,
                        present_workers=present,
                        absent_workers=allocated - present,
                        overtime_workers=random.randint(0, 3),
                        attendance_rate=Decimal(f'{(present / allocated * 100):.2f}'),
                        date=work_date.date()
                    )

        # 작업 표준
        for i in range(10):
            WorkStandard.objects.create(
                standard_id=f'ST{i:03d}',
                title=f'{random.choice(["SMT", "조립", "테스트", "포장"])} 작업표준',
                process=random.choice(['SMT', '조립', '테스트', '포장']),
                version='1.0',
                status='active',
                standard_time=Decimal(f'{random.uniform(30, 120):.2f}'),
                required_skill_level=f'Level-{random.randint(1, 3)}',
                description='표준 작업 절차',
                effective_date=datetime.now().date()
            )

        # 설비 다운타임
        for i in range(30):
            start_time = datetime.now() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 8))
            duration = random.randint(10, 120)

            EquipmentDowntime.objects.create(
                equipment_id=f'EQUIP{random.randint(1, 5):02d}',
                equipment_name=f'설비-{random.randint(1, 5)}',
                reason=random.choice(['breakdown', 'maintenance', 'changeover', 'material', 'quality']),
                downtime_minutes=duration,
                description='설비 비가동',
                start_time=start_time,
                end_time=start_time + timedelta(minutes=duration)
            )

        self.stdout.write('   [완료] 제조 데이터 완료')

    def load_cost_data(self):
        """원가 데이터 로드"""
        self.stdout.write('[진행] 원가 데이터 로딩 중...')

        from cost.models import (
            MonthlyCost, ProductCost, CostReductionProject, CostDriver,
            BreakEvenAnalysis, CostStructure, FactCost
        )

        # 월별 원가
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            total = Decimal(f'{random.uniform(50, 80):.2f}')
            material = total * Decimal('0.55')
            labor = total * Decimal('0.25')
            overhead = total * Decimal('0.15')
            selling_admin = total * Decimal('0.05')

            MonthlyCost.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                total_cost=total,
                unit_cost=Decimal(f'{random.uniform(50000, 100000):.2f}'),
                material_cost=material,
                labor_cost=labor,
                overhead_cost=overhead,
                selling_admin_cost=selling_admin
            )

        # 제품별 원가
        products = ['P001', 'P002', 'P003', 'P004', 'P005']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for product in products:
                volume = random.randint(1000, 5000)
                material_cost = Decimal(f'{random.uniform(20000, 50000):.2f}')
                labor_cost = Decimal(f'{random.uniform(10000, 30000):.2f}')
                overhead_cost = Decimal(f'{random.uniform(5000, 15000):.2f}')
                total = material_cost + labor_cost + overhead_cost
                selling_price = total * Decimal('1.2')

                ProductCost.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    product_code=product,
                    product_name=f'제품-{product[-1]}',
                    production_volume=volume,
                    material_cost=material_cost,
                    labor_cost=labor_cost,
                    overhead_cost=overhead_cost,
                    total_cost=total,
                    selling_price=selling_price,
                    margin=selling_price - total,
                    margin_rate=Decimal(f'{((selling_price - total) / selling_price * 100):.2f}')
                )

        # 원가 절감 프로젝트
        for i in range(5):
            CostReductionProject.objects.create(
                project_id=f'CR{datetime.now().year}{i:03d}',
                title=f'원가 절감 프로젝트-{i+1}',
                category=random.choice(['material', 'labor', 'overhead']),
                target_saving=Decimal(f'{random.uniform(5, 20):.2f}'),
                actual_saving=Decimal(f'{random.uniform(3, 15):.2f}'),
                progress=Decimal(f'{random.uniform(50, 100):.2f}'),
                status=random.choice(['planned', 'in-progress', 'completed', 'delayed']),
                responsible_person=f'담당자{random.randint(1, 3)}',
                due_date=datetime.now() + timedelta(days=random.randint(30, 180))
            )

        # 손익분기점 분석
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            fixed_cost = Decimal(f'{random.uniform(30, 50):.2f}')
            variable_ratio = Decimal('0.65')
            sales = Decimal(f'{random.uniform(80, 150):.2f}')

            # 손익분기점 및 안전마진율 계산
            break_even_point = fixed_cost / (Decimal('1') - variable_ratio)
            margin_of_safety_val = ((sales - break_even_point) / sales * 100)

            BreakEvenAnalysis.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                fixed_cost=fixed_cost,
                variable_cost_ratio=variable_ratio,
                break_even_point=break_even_point,
                actual_sales=sales,
                margin_of_safety=Decimal(f'{margin_of_safety_val:.2f}')
            )

        # 원가 구조
        cost_types = [
            ('direct_material', '직접재료비', 0.55),
            ('direct_labor', '직접노무비', 0.25),
            ('manufacturing_overhead', '제조경비', 0.15),
            ('selling_admin', '판매관리비', 0.05),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            total = Decimal('100')
            for cost_type, name, ratio in cost_types:
                CostStructure.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    cost_type=cost_type,
                    amount=Decimal(f'{random.uniform(40, 60):.2f}'),
                    ratio=Decimal(str(ratio * 100))
                )

        # 원가 팩트 데이터
        counter = 0
        for i in range(90):
            cost_month = datetime.now() - timedelta(days=i // 3)
            for product in products:
                material_cost = Decimal(f'{random.uniform(20000, 50000):.2f}')
                labor_cost = Decimal(f'{random.uniform(10000, 30000):.2f}')
                overhead_cost = Decimal(f'{random.uniform(5000, 15000):.2f}')
                total = material_cost + labor_cost + overhead_cost

                FactCost.objects.create(
                    cost_month=cost_month.date(),
                    product_id=product,
                    product_name=f'제품-{product[-1]}',
                    cost_center=f'CC{random.randint(1, 3)}',
                    material_cost=material_cost,
                    labor_cost=labor_cost,
                    overhead_cost=overhead_cost,
                    unit_cost=Decimal(str(total / random.randint(100, 500))),
                    standard_cost=total * Decimal(str(random.uniform(0.95, 1.05))),
                    variance=Decimal(f'{random.uniform(-5, 5):.2f}'),
                    variance_rate=Decimal(f'{random.uniform(-2, 2):.2f}'),
                    output_qty=random.randint(100, 500),
                    total_cost=total,
                    source_id=f'COST_{cost_month.strftime("%Y%m%d")}_{product}_{counter}'
                )
                counter += 1

        self.stdout.write('   [완료] 원가 데이터 완료')

    def load_esg_data(self):
        """ESG 데이터 로드"""
        self.stdout.write('[진행] ESG 데이터 로딩 중...')

        from esg.models import (
            ESGScore, CarbonEmission, EnergyConsumption, FourM2EMetric,
            EnvironmentalProject, SocialResponsibility, GovernanceMetric
        )

        # ESG 점수
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            env = Decimal(f'{random.uniform(70, 90):.2f}')
            social = Decimal(f'{random.uniform(65, 85):.2f}')
            gov = Decimal(f'{random.uniform(75, 90):.2f}')

            ESGScore.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                environment_score=env,
                social_score=social,
                governance_score=gov,
                total_score=(env + social + gov) / 3
            )

        # 탄소 배출량
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            target = Decimal(f'{random.uniform(450, 500):.2f}')
            actual = target * Decimal(str(random.uniform(0.9, 1.1)))
            actual = actual.quantize(Decimal('0.01'))

            CarbonEmission.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                target_emission=target,
                actual_emission=actual,
                reduction_rate=Decimal(f'{((target - actual) / target * 100):.2f}')
            )

        # 에너지 소비
        sources = [
            ('electricity', '전기', 5000, 800),
            ('gas', '가스', 3000, 400),
            ('steam', '증기', 2000, 300),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for source, name, cons, cost in sources:
                EnergyConsumption.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    energy_source=source,
                    consumption=Decimal(f'{cons * random.uniform(0.9, 1.1):.2f}'),
                    cost=Decimal(f'{cost * random.uniform(0.9, 1.1):.2f}')
                )

        # 4M2E 지표
        categories = [
            ('man', 'Man', '작업자 만족도', 85, 90),
            ('machine', 'Machine', '설비 가동률', 80, 85),
            ('material', 'Material', '자재 수율', 90, 95),
            ('method', 'Method', '공정 준수율', 95, 98),
            ('environment', 'Environment', '온도/습도 유지율', 90, 95),
            ('energy', 'Energy', '에너지 효율', 85, 90),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for cat, cat_en, name, target_min, target_max in categories:
                actual = Decimal(f'{random.uniform(target_min - 5, target_max):.2f}')
                FourM2EMetric.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    category=cat,
                    metric_name=name,
                    target_value=Decimal(str(target_max)),
                    actual_value=actual,
                    unit='%',
                    status='good' if actual >= target_min else 'warning'
                )

        # 환경 개선 프로젝트
        for i in range(5):
            EnvironmentalProject.objects.create(
                project_id=f'ENV{datetime.now().year}{i:03d}',
                title=f'에너지 절감 프로젝트-{i+1}',
                category=random.choice(['energy', 'environment', 'material', 'waste']),
                impact='연간 전력 절감 및 탄소 배출 감축',
                investment=Decimal(f'{random.uniform(5, 20):.2f}'),
                saving=Decimal(f'{random.uniform(3, 15):.2f}'),
                progress=Decimal(f'{random.uniform(50, 100):.2f}'),
                status=random.choice(['planned', 'in-progress', 'completed']),
                start_date=datetime.now().date(),
                end_date=datetime.now().date() + timedelta(days=180)
            )

        # 사회적 책임 활동
        activities = [
            '지역 사회 봉사활동',
            '청소년 인턴십 프로그램',
            '기술 교육 지원',
            '재난 구호 기부',
        ]

        for activity in activities:
            SocialResponsibility.objects.create(
                fiscal_year=datetime.now().year,
                activity_name=activity,
                participants=random.randint(20, 100),
                hours=random.randint(8, 40),
                budget=Decimal(f'{random.uniform(1, 10):.2f}')
            )

        # 지배구조 지표
        governance_metrics = [
            ('이사회 독립성', 80, 100),
            ('감사위원회 독립성', 85, 100),
            ('주주 권리 보호', 90, 100),
            ('정보 공개 투명성', 85, 100),
        ]

        for name, actual, target in governance_metrics:
            GovernanceMetric.objects.create(
                fiscal_year=datetime.now().year,
                metric_name=name,
                actual_value=Decimal(str(actual)),
                benchmark=Decimal(str(target)),
                status='good' if actual >= 80 else 'warning'
            )

        self.stdout.write('   [완료] ESG 데이터 완료')

    def load_accounting_data(self):
        """관리회계 데이터 로드"""
        self.stdout.write('[진행] 관리회계 데이터 로딩 중...')

        from accounting.models import (
            BudgetActual, DepartmentProfitability, KPIPerformance,
            FinancialRatioAnalysis, BudgetAllocation, InvestmentROI
        )

        # 예산 vs 실적
        categories = ['매출', '매출원가', '판매비', '관리비', '연구개발비']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for category in categories:
                budget = Decimal(f'{random.uniform(10, 100):.2f}')
                actual = budget * Decimal(random.uniform(0.9, 1.1))

                BudgetActual.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    category=category,
                    budget=budget,
                    actual=actual,
                    variance=actual - budget,
                    variance_rate=Decimal(f'{((actual - budget) / budget * 100):.2f}')
                )

        # 부서별 수익성
        departments = ['영업1팀', '영업2팀', '생산팀', '연구소', '관리부서']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for dept in departments:
                revenue = Decimal(f'{random.uniform(20, 100):.2f}')
                cost = revenue * Decimal(random.uniform(0.7, 0.9))

                DepartmentProfitability.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    department=dept,
                    revenue=revenue,
                    cost=cost,
                    profit=revenue - cost,
                    margin=Decimal(f'{((revenue - cost) / revenue * 100):.2f}')
                )

        # KPI 성과
        kpis = [
            ('매출액', 100000000, random.randint(80000000, 120000000)),
            ('영업이익률', 15, random.randint(12, 18)),
            ('재고회전율', 8, random.randint(6, 10)),
            ('불량률', 2, random.randint(1, 4)),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for kpi_name, target, actual in kpis:
                achievement = (actual / target * 100) if target > 0 else 0
                KPIPerformance.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    kpi_name=kpi_name,
                    target=Decimal(str(target)),
                    actual=Decimal(str(actual)),
                    achievement_rate=Decimal(f'{achievement:.2f}'),
                    status='achieved' if achievement >= 100 else 'on-track' if achievement >= 90 else 'at-risk'
                )

        # 재무비율 분석
        ratios = ['유동비율', '부채비율', '자기자본비율', '매출액영업이익률']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for ratio in ratios:
                value = Decimal(f'{random.uniform(50, 150):.2f}')
                FinancialRatioAnalysis.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    ratio_name=ratio,
                    category='stability' if '비율' in ratio else 'profitability',
                    value=value,
                    industry_avg=value * Decimal(random.uniform(0.95, 1.05)),
                    target=value * Decimal('1.05')
                )

        # 예산 배분
        for dept in departments:
            allocated = Decimal(f'{random.uniform(10, 50):.2f}')
            used = allocated * Decimal(random.uniform(0.7, 1.0))

            BudgetAllocation.objects.create(
                fiscal_year=datetime.now().year,
                department=dept,
                allocated_budget=allocated,
                used_budget=used,
                remaining_budget=allocated - used,
                usage_rate=Decimal(f'{(used / allocated * 100):.2f}')
            )

        # 투자 ROI
        for i in range(5):
            investment = Decimal(f'{random.uniform(10, 50):.2f}')
            actual_return = investment * Decimal(random.uniform(0.8, 1.5))

            InvestmentROI.objects.create(
                project_name=f'신규 설비 도입-{i+1}',
                investment_amount=investment,
                expected_return=investment * Decimal('1.3'),
                actual_return=actual_return,
                roi=Decimal(f'{((actual_return - investment) / investment * 100):.2f}'),
                payback_period=Decimal(f'{random.uniform(12, 36):.2f}'),
                status='completed' if actual_return > investment else 'in-progress'
            )

        self.stdout.write('   [완료] 관리회계 데이터 완료')

    def load_productivity_data(self):
        """생산성 데이터 로드"""
        self.stdout.write('[진행] 생산성 데이터 로딩 중...')

        from productivity.models import (
            HourlyProduction, LineUtilization, WorkerProductivity,
            OEEComponent, ProductionEfficiency, DailyProductionSummary
        )

        # 시간당 생산량 (최근 7일, 24시간)
        for i in range(7):
            prod_date = datetime.now() - timedelta(days=i)

            for hour in range(8, 18):  # 8시부터 18시까지
                for line_id in range(1, 6):
                    target = random.randint(50, 80)
                    actual = random.randint(40, target)

                    HourlyProduction.objects.create(
                        production_date=prod_date.date(),
                        hour=hour,
                        line_id=f'LINE-{line_id:02d}',
                        line_name=f'라인-{line_id}',
                        target_output=target,
                        actual_output=actual,
                        achievement_rate=Decimal(f'{(actual / target * 100):.2f}')
                    )

        # 라인 가동률
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for line_id in range(1, 6):
                planned = Decimal('720')  # 30일 * 24시간
                actual = planned * Decimal(random.uniform(0.85, 0.95))

                LineUtilization.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    line_id=f'LINE-{line_id:02d}',
                    line_name=f'라인-{line_id}',
                    planned_time=planned,
                    actual_time=actual,
                    downtime=planned - actual,
                    utilization_rate=Decimal(f'{(actual / planned * 100):.2f}'),
                    target_rate=Decimal('90.00')
                )

        # 작업자 생산성
        workers = ['홍길동', '김철수', '이영희', '박민수', '최수진']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for worker in workers:
                work_hours = Decimal(f'{random.uniform(160, 180):.2f}')
                output = random.randint(800, 1200)

                WorkerProductivity.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    worker_id=f'W{workers.index(worker) + 1:03d}',
                    worker_name=worker,
                    department='생산팀',
                    work_hours=work_hours,
                    output_quantity=output,
                    productivity=Decimal(f'{output / 8:.2f}'),
                    target_productivity=Decimal('100.00'),
                    achievement_rate=Decimal(f'{(output / 1000 * 100):.2f}')
                )

        # OEE 구성요소
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for line_id in range(1, 6):
                availability = Decimal(f'{random.uniform(85, 95):.2f}')
                performance = Decimal(f'{random.uniform(80, 95):.2f}')
                quality_rate = Decimal(f'{random.uniform(95, 99):.2f}')
                oee_value = (availability * performance * quality_rate) / 10000

                OEEComponent.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    line_id=f'LINE-{line_id:02d}',
                    line_name=f'라인-{line_id}',
                    availability=availability,
                    availability_target=Decimal('90.00'),
                    performance=performance,
                    performance_target=Decimal('95.00'),
                    quality_rate=quality_rate,
                    quality_target=Decimal('99.00'),
                    oee=Decimal(f'{oee_value:.2f}'),
                    oee_target=Decimal('85.00')
                )

        # 생산 효율
        efficiency_items = ['생산량', '품질수율', '설비가동률', '자재수율']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for item in efficiency_items:
                target = Decimal('100.0')
                actual = target * Decimal(random.uniform(0.9, 1.05))

                ProductionEfficiency.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    category=item,
                    target_value=target,
                    actual_value=actual,
                    efficiency=Decimal(f'{(actual / target * 100):.2f}'),
                    unit='%'
                )

        # 일일 생산 요약
        for i in range(90):
            prod_date = datetime.now() - timedelta(days=i)

            total_target = 5 * random.randint(500, 800)
            total_actual = random.randint(int(total_target * 0.85), total_target)
            total_defects = random.randint(50, 200)

            DailyProductionSummary.objects.create(
                production_date=prod_date.date(),
                total_target=total_target,
                total_actual=total_actual,
                total_defects=total_defects,
                overall_efficiency=Decimal(f'{(total_actual / total_target * 100):.2f}'),
                defect_rate=Decimal(f'{(total_defects / total_actual * 100):.2f}'),
                active_lines=5,
                total_workers=45
            )

        self.stdout.write('   [완료] 생산성 데이터 완료')

    def load_development_data(self):
        """개발 데이터 로드"""
        self.stdout.write('[진행] 개발 데이터 로딩 중...')

        from development.models import (
            RDProject, InnovationMetric, Patent, RDPersonnel,
            TechnologyRoadmap, RDBudget
        )

        # R&D 프로젝트
        for i in range(10):
            start_date = datetime.now() - timedelta(days=random.randint(30, 365))
            target_date = start_date + timedelta(days=random.randint(180, 365))

            RDProject.objects.create(
                project_id=f'RD{datetime.now().year}{i:03d}',
                title=f'신기술 개발 프로젝트-{i+1}',
                description=f'차세기 기술 개발',
                status=random.choice(['research', 'development', 'testing', 'completed']),
                priority=random.choice(['high', 'medium', 'medium', 'low']),
                progress=Decimal(f'{random.uniform(30, 100):.2f}'),
                budget=Decimal(f'{random.uniform(10, 50):.2f}'),
                spent=Decimal(f'{random.uniform(5, 40):.2f}'),
                team_lead=f'연구원{random.randint(1, 3)}',
                team_size=random.randint(3, 8),
                start_date=start_date.date(),
                target_date=target_date.date(),
                actual_end_date=target_date.date() if random.random() > 0.5 else None
            )

        # 혁신 지표
        innovation_metrics = [
            ('product', '신제품 출시 수', random.randint(2, 8)),
            ('process', '공정 개선 건수', random.randint(10, 30)),
            ('service', '서비스 개선 건수', random.randint(5, 15)),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for category, name, target in innovation_metrics:
                actual = target + random.randint(-2, 5)
                InnovationMetric.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    category=category,
                    metric_name=name,
                    target_value=Decimal(str(target)),
                    actual_value=Decimal(str(max(0, actual))),
                    achievement_rate=Decimal(f'{(actual / target * 100):.2f}'),
                    unit='건'
                )

        # 특허/지식재산권
        for i in range(10):
            filing_date = datetime.now() - timedelta(days=random.randint(30, 365))

            Patent.objects.create(
                registration_number=f'KR{random.randint(10, 20)}-{random.randint(1000000, 9999999)}',
                application_number=f'KR{random.randint(10, 20)}-{random.randint(2020000001, 2020999999)}',
                title=f'기술-{i+1} 관련 발명',
                ip_type=random.choice(['patent', 'patent', 'utility', 'design']),
                status=random.choice(['filed', 'pending', 'granted']),
                inventor=f'연구원{random.randint(1, 5)}',
                applicant='Claros',
                application_date=filing_date.date(),
                registration_date=filing_date.date() + timedelta(days=random.randint(180, 730)) if random.random() > 0.3 else None,
                related_project=f'RD{datetime.now().year}{i:03d}'
            )

        # R&D 인력
        for i in range(10):
            join_date = datetime.now() - timedelta(days=random.randint(100, 2000))

            RDPersonnel.objects.create(
                employee_id=f'RD{i:03d}',
                name=f'연구원{i}',
                department='연구소',
                position=random.choice(['선임연구원', '책임연구원', '수석연구원']),
                level=random.choice(['senior', 'lead', 'lead', 'manager']),
                specialty=f'{random.choice(["AI", "로봇", "IoT", "자동화"])} 기술',
                years_of_experience=random.randint(3, 15),
                current_project=f'신기술 프로젝트-{random.randint(1, 5)}',
                publications=random.randint(0, 10),
                patents=random.randint(0, 5),
                join_date=join_date.date()
            )

        # 기술 로드맵
        technologies = ['AI 분석', '로봇 자동화', 'IoT 플랫폼', '클라우드 연동']
        for tech in technologies:
            TechnologyRoadmap.objects.create(
                technology_name=tech,
                description=f'{tech} 관련 기술 개발',
                phase=random.choice(['short-term', 'mid-term', 'long-term']),
                status=random.choice(['planned', 'in-progress', 'completed']),
                progress=Decimal(f'{random.uniform(20, 100):.2f}'),
                target_year=datetime.now().year + random.randint(1, 5),
                expected_impact='생산 효율 향상 및 비용 절감',
                required_investment=Decimal(f'{random.uniform(10, 50):.2f}')
            )

        # R&D 예산
        categories = ['인건비', '연구장비', '시설비', '재료비']
        for category in categories:
            allocated = Decimal(f'{random.uniform(10, 30):.2f}')
            RDBudget.objects.create(
                fiscal_year=datetime.now().year,
                category=category,
                allocated_budget=allocated,
                spent_budget=allocated * Decimal(random.uniform(0.5, 0.9)),
                remaining_budget=allocated * Decimal(random.uniform(0.1, 0.5)),
                execution_rate=Decimal(f'{random.uniform(40, 90):.2f}')
            )

        self.stdout.write('   [완료] 개발 데이터 완료')

    def load_reports_data(self):
        """리포트 데이터 로드"""
        self.stdout.write('[진행] 리포트 데이터 로딩 중...')

        from reports.models import (
            ExecutiveSummary, DepartmentComparison, KeyMetricSummary,
            RiskOpportunity, Recommendation, MonthlyReport
        )

        # 경영진 요약
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            revenue = Decimal(f'{random.uniform(80, 120):.2f}')
            growth = Decimal(f'{random.uniform(-5, 15):.2f}')

            ExecutiveSummary.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                revenue=revenue,
                revenue_growth=growth,
                operating_profit=revenue * Decimal('0.15'),
                operating_margin=Decimal('15.0'),
                net_profit=revenue * Decimal('0.12'),
                net_margin=Decimal('12.0'),
                production_volume=random.randint(15000, 20000),
                quality_rate=Decimal(f'{random.uniform(95, 99):.2f}'),
                employee_count=150
            )

        # 부서별 비교
        departments = ['영업', '생산', '연구', '관리']
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for dept in departments:
                revenue = Decimal(f'{random.uniform(20, 100):.2f}')
                cost = revenue * Decimal(random.uniform(0.7, 0.9))

                DepartmentComparison.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    department=dept,
                    revenue=revenue,
                    cost=cost,
                    profit=revenue - cost,
                    headcount=random.randint(20, 50),
                    productivity=Decimal(f'{random.uniform(80, 120):.2f}'),
                    target_achievement=Decimal(f'{random.uniform(85, 110):.2f}')
                )

        # 주요 지표 요약
        metrics = [
            ('매출액', '재무', Decimal('100000000'), Decimal('110000000'), Decimal('10.0'), 'up', 'good'),
            ('영업이익률', '재무', Decimal('15.0'), Decimal('16.5'), Decimal('10.0'), 'up', 'good'),
            ('생산 효율', '생산', Decimal('85.0'), Decimal('87.0'), Decimal('2.4'), 'up', 'good'),
            ('불량률', '품질', Decimal('2.5'), Decimal('2.0'), Decimal('-20.0'), 'down', 'good'),
        ]

        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            for name, cat, prev, curr, change, trend, status in metrics:
                KeyMetricSummary.objects.create(
                    fiscal_year=year,
                    fiscal_month=month,
                    metric_name=name,
                    category=cat,
                    current_value=curr,
                    target_value=curr * Decimal('1.05'),
                    previous_value=prev,
                    change_rate=change,
                    trend=trend,
                    status=status,
                    unit='원' if '액' in name or '률' in name else '%'
                )

        # 리스크/기회
        for i in range(5):
            RiskOpportunity.objects.create(
                item_type='risk',
                title=f'공급망 불안 리스크-{i+1}',
                description=f'주요 자재의 공급망 불안정 가능성',
                category='구매',
                priority='high',
                status='analyzing',
                impact=Decimal(f'{random.uniform(10, 30):.2f}'),
                probability=Decimal(f'{random.uniform(20, 50):.2f}'),
                response_plan='대체 공급업체 확보 및 안전재고 증대',
                owner='구매팀장',
                due_date=datetime.now().date() + timedelta(days=30)
            )

        for i in range(3):
            RiskOpportunity.objects.create(
                item_type='opportunity',
                title=f'신시장 진출 기회-{i+1}',
                description=f'동남아 시장 진출 확대',
                category='영업',
                priority='medium',
                status='identified',
                impact=Decimal(f'{random.uniform(20, 50):.2f}'),
                probability=Decimal(f'{random.uniform(40, 60):.2f}'),
                response_plan='현지 파트너십 및 현지 법인 설립',
                owner='영업팀장',
                due_date=datetime.now().date() + timedelta(days=90)
            )

        # 권고 사항
        recommendations = [
            ('설비 자동화 투자', 'operational', 'medium', Decimal('30'), Decimal('10'), Decimal('120')),
            ('공급망 다변화', 'strategic', 'high', Decimal('20'), Decimal('5'), Decimal('200')),
        ]

        for title, category, priority, benefit, investment, roi in recommendations:
            Recommendation.objects.create(
                title=title,
                description=f'{title}를 통한 경쟁력 강화',
                category=category,
                priority=priority,
                status='in-progress',
                expected_benefit=benefit,
                required_investment=investment,
                roi_estimate=roi,
                proposed_by='경영기획팀',
                target_date=datetime.now().date() + timedelta(days=180)
            )

        # 월간 보고서
        for i in range(12):
            year = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
            month = (datetime.now().month - i - 1) % 12 + 1
            if month == 12:
                year -= 1

            MonthlyReport.objects.create(
                fiscal_year=year,
                fiscal_month=month,
                title=f'{year}년 {month}월 경영 보고서',
                summary=f'{year}년 {month}월 매출이 전월 대비 {random.randint(-5, 15)}% 성장',
                highlights=f'• 신제품 출시 성공\n• 생산 효율 {random.randint(3, 10)}% 개선\n• 불량률 {random.randint(5, 15)}% 감소',
                concerns=f'• 원자재 가격 상승\n• 인건비 증가',
                next_month_plan=f'• 생산 계획 {random.randint(100, 150)}% 달성\n• 원가 절감 프로젝트 가속',
                status='published',
                author='경영기획팀',
                approved_by='대표이사'
            )

        self.stdout.write('   [완료] 리포트 데이터 완료')
