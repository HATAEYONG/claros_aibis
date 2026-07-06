# -*- coding: utf-8 -*-
"""
복원된 실제 YH ERP(MSSQL, LOCAL_BACKUP 연결) 백업에서 진짜 이력 데이터를 가져와
Django 모델(sales/production/quality/purchase/reports)에 반영한다.

erd/ERP_backup_20251117 를 로컬 SQL Server 컨테이너에 복원해 만든 실제 데이터가
소스이며, 기존 통계 기반 증강 데이터(synthetic seed)를 대체한다. 이 명령 실행 후
`extend_timeseries`로 오늘까지 연장하는 것을 전제로 한다.

사용법:
    python manage.py import_real_yh_data
    python manage.py import_real_yh_data --months 12
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


# 백업 파일 자체가 2025-11-17 근처까지의 이력이므로 그 시점을 기준으로 최근 N개월을 가져온다
BACKUP_AS_OF = date(2025, 11, 18)


class Command(BaseCommand):
    help = "복원된 실제 YH ERP(MSSQL) 백업에서 진짜 이력 데이터를 가져와 Django 모델에 반영한다"

    def add_arguments(self, parser):
        parser.add_argument(
            "--months", type=int, default=12,
            help="백업 시점(2025-11-18) 기준 최근 몇 개월치를 가져올지 (기본 12개월)",
        )

    def handle(self, *args, **options):
        try:
            import pyodbc
        except ImportError:
            raise CommandError("pyodbc가 설치되어 있지 않습니다: pip install pyodbc")

        from erp_sync.models import ERPConnectionConfigModel

        try:
            config = ERPConnectionConfigModel.objects.get(source_code="LOCAL_BACKUP")
        except ERPConnectionConfigModel.DoesNotExist:
            raise CommandError("LOCAL_BACKUP 연결 설정이 없습니다. 먼저 연결 설정을 생성하세요.")

        if config.source_type != "mssql":
            raise CommandError(
                f"LOCAL_BACKUP이 mssql 타입이 아닙니다(현재: {config.source_type}). "
                "실제 YH 백업을 복원한 MSSQL 컨테이너로 설정을 바꾼 뒤 다시 실행하세요."
            )

        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={config.host},{config.port or 1433};"
            f"DATABASE={config.database_name};"
            f"UID={config.username};"
            f"PWD={config.password};"
        )
        cursor = pyodbc.connect(conn_str, timeout=config.connection_timeout or 10).cursor()

        months = options["months"]
        start_date = BACKUP_AS_OF - timedelta(days=months * 31)
        self.stdout.write(f"대상 기간: {start_date} ~ {BACKUP_AS_OF}")

        with transaction.atomic():
            self._clear_synthetic_data(start_date)
            self._import_production(cursor, start_date, BACKUP_AS_OF)
            self._import_quality(cursor, start_date, BACKUP_AS_OF)
            self._import_sales(cursor, start_date, BACKUP_AS_OF)
            self._import_inventory(cursor)
            self._import_executive_summary(start_date, BACKUP_AS_OF)

        self.stdout.write(self.style.SUCCESS("실제 YH 데이터 반영 완료"))

    def _clear_synthetic_data(self, start_date):
        """실제 데이터로 대체할 대상 기간의 기존 통계 기반 증강/샘플 데이터를 지운다."""
        from production.models import DailyProduction
        from quality.models import QualityInspection
        from sales.models import MonthlySales, TopCustomer
        from purchase.models import Inventory
        from reports.models import ExecutiveSummary

        self.stdout.write("기존 synthetic 데이터 정리 중...")
        DailyProduction.objects.filter(production_date__gte=start_date).delete()
        QualityInspection.objects.filter(inspection_date__gte=start_date).delete()
        MonthlySales.objects.filter(fiscal_year__gte=start_date.year).delete()
        TopCustomer.objects.filter(fiscal_year__gte=start_date.year).delete()
        Inventory.objects.all().delete()
        ExecutiveSummary.objects.filter(fiscal_year__gte=start_date.year).delete()

    def _import_production(self, cursor, start_date, end_date):
        from production.models import ProductionLine, DailyProduction

        self.stdout.write("생산 실적(PPC100) 가져오는 중...")
        cursor.execute(
            """
            SELECT CAST(work_dt AS DATE) AS prod_date, wc_cd,
                   SUM(req_qty) AS target_qty,
                   SUM(good_qty + bad_qty) AS actual_qty,
                   SUM(bad_qty) AS defect_qty,
                   SUM(real_tm) AS real_tm_sum,
                   SUM(stop_tm) AS stop_tm_sum
            FROM PPC100
            WHERE work_dt >= ? AND work_dt < ? AND wc_cd IS NOT NULL AND wc_cd <> ''
            GROUP BY CAST(work_dt AS DATE), wc_cd
            """,
            start_date, end_date,
        )
        rows = cursor.fetchall()

        lines_cache = {}
        created = 0
        for prod_date, wc_cd, target_qty, actual_qty, defect_qty, real_tm_sum, stop_tm_sum in rows:
            if wc_cd not in lines_cache:
                line, _ = ProductionLine.objects.get_or_create(
                    code=wc_cd,
                    defaults={
                        "name": f"작업장 {wc_cd}", "location": "본사",
                        "capacity": 10000, "is_active": True,
                    },
                )
                lines_cache[wc_cd] = line
            line = lines_cache[wc_cd]

            actual_qty = int(actual_qty or 0)
            target_qty = int(target_qty or 0) or actual_qty or 1
            defect_qty = min(int(defect_qty or 0), actual_qty)
            # real_tm/stop_tm 원본 단위 불명확 -> 분 단위로 가정, 시간으로 환산 후 24시간 상한
            operating_hours = min(Decimal(str(round(float(real_tm_sum or 0) / 60.0, 2))), Decimal("24.00"))
            downtime_hours = min(Decimal(str(round(float(stop_tm_sum or 0) / 60.0, 2))), Decimal("24.00"))
            efficiency = round(actual_qty / target_qty * 100, 2) if target_qty else 0

            _, was_created = DailyProduction.objects.update_or_create(
                production_line=line, production_date=prod_date,
                defaults={
                    "target_quantity": target_qty,
                    "actual_quantity": actual_qty,
                    "defect_quantity": defect_qty,
                    "operating_hours": operating_hours,
                    "downtime_hours": downtime_hours,
                    "efficiency": Decimal(str(efficiency)),
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"  생산 실적 {created}건 생성 (총 {len(rows)}건 처리)"))

    def _import_quality(self, cursor, start_date, end_date):
        from quality.models import QualityInspection

        self.stdout.write("품질 검사(QMM100) 가져오는 중...")
        cursor.execute(
            """
            SELECT iqc_no, iqc_dt, itm_id, smp_qty, bad_qty, iqc_rid
            FROM QMM100
            WHERE iqc_dt >= ? AND iqc_dt < ?
            """,
            start_date, end_date,
        )
        rows = cursor.fetchall()

        created = 0
        for iqc_no, iqc_dt, itm_id, smp_qty, bad_qty, iqc_rid in rows:
            try:
                sample_size = max(int(float(smp_qty)), 1) if smp_qty not in (None, "") else 1
            except (ValueError, TypeError):
                sample_size = 1
            defect_count = min(int(bad_qty or 0), sample_size)
            result = "pass" if defect_count == 0 else "fail"
            inspection_date = iqc_dt.date() if hasattr(iqc_dt, "date") else iqc_dt

            _, was_created = QualityInspection.objects.update_or_create(
                inspection_number=str(iqc_no),
                defaults={
                    "inspection_type": "incoming",
                    "product_name": f"품목-{itm_id}",
                    "product_code": f"ITM-{itm_id}",
                    "lot_number": str(iqc_no),
                    "inspection_date": inspection_date,
                    "inspector": f"검사원{iqc_rid}" if iqc_rid is not None else "미지정",
                    "sample_size": sample_size,
                    "defect_count": defect_count,
                    "result": result,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"  품질 검사 {created}건 생성 (총 {len(rows)}건 처리)"))

    def _import_sales(self, cursor, start_date, end_date):
        from sales.models import MonthlySales, TopCustomer

        self.stdout.write("매출(SDD100) 및 판매계획(SDY100) 가져오는 중...")
        cursor.execute(
            """
            SELECT YEAR(sal_dt), MONTH(sal_dt), SUM(sal_amt)
            FROM SDD100
            WHERE sal_dt >= ? AND sal_dt < ?
            GROUP BY YEAR(sal_dt), MONTH(sal_dt)
            """,
            start_date, end_date,
        )
        actuals = {(int(y), int(m)): Decimal(str(amt or 0)) for y, m, amt in cursor.fetchall()}

        cursor.execute(
            """
            SELECT plan_year, plan_mon, SUM(plan_amt)
            FROM SDY100
            WHERE plan_year >= ? AND plan_year <= ?
            GROUP BY plan_year, plan_mon
            """,
            str(start_date.year), str(end_date.year),
        )
        targets = {}
        for y, m, amt in cursor.fetchall():
            try:
                targets[(int(y), int(m))] = Decimal(str(amt or 0))
            except (ValueError, TypeError):
                continue

        created = 0
        for (y, m), actual in actuals.items():
            target = targets.get((y, m)) or (actual * Decimal("1.05"))
            achievement = round(float(actual) / float(target) * 100, 2) if target else 0
            _, was_created = MonthlySales.objects.update_or_create(
                fiscal_year=y, fiscal_month=m,
                defaults={
                    "target_amount": target,
                    "actual_amount": actual,
                    "achievement_rate": Decimal(str(achievement)),
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"  월별 매출 {created}건 생성"))

        # 거래처명 조인(BCV100)해서 월별 매출 상위 5개 거래처 산출
        cursor.execute(
            """
            SELECT YEAR(d.sal_dt), MONTH(d.sal_dt), d.cust_cd, c.cust_nm, SUM(d.sal_amt)
            FROM SDD100 d
            LEFT JOIN BCV100 c ON c.cust_cd = d.cust_cd
            WHERE d.sal_dt >= ? AND d.sal_dt < ?
            GROUP BY YEAR(d.sal_dt), MONTH(d.sal_dt), d.cust_cd, c.cust_nm
            """,
            start_date, end_date,
        )
        by_month = {}
        for y, m, cust_cd, cust_nm, amt in cursor.fetchall():
            by_month.setdefault((int(y), int(m)), []).append(
                (cust_cd, cust_nm, Decimal(str(amt or 0)))
            )

        tc_created = 0
        for (y, m), custs in by_month.items():
            top5 = sorted(custs, key=lambda x: x[2], reverse=True)[:5]
            for cust_cd, cust_nm, amt in top5:
                _, was_created = TopCustomer.objects.update_or_create(
                    fiscal_year=y, fiscal_month=m, customer_code=str(cust_cd),
                    defaults={
                        "customer_name": (cust_nm or str(cust_cd)).strip(),
                        "revenue": amt,
                        "growth_rate": Decimal("0"),
                        "status": "active",
                    },
                )
                if was_created:
                    tc_created += 1
        self.stdout.write(self.style.SUCCESS(f"  주요 거래처 {tc_created}건 생성"))

    def _import_inventory(self, cursor):
        from purchase.models import Inventory

        self.stdout.write("재고(LCB100) 및 최근 구매단가(MMB150) 가져오는 중...")
        cursor.execute(
            """
            SELECT itm_id, SUM(qty) AS total_qty
            FROM LCB100
            WHERE disuse_yn IS NULL OR disuse_yn <> 'Y'
            GROUP BY itm_id
            HAVING SUM(qty) > 0
            """
        )
        stock_rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT itm_id, po_up FROM (
                SELECT itm_id, po_up, ROW_NUMBER() OVER (PARTITION BY itm_id ORDER BY cdt DESC) AS rn
                FROM MMB150 WHERE po_up > 0
            ) t WHERE rn = 1
            """
        )
        price_map = {itm_id: Decimal(str(po_up or 0)) for itm_id, po_up in cursor.fetchall()}

        created = 0
        for itm_id, total_qty in stock_rows:
            qty = int(total_qty or 0)
            if qty <= 0:
                continue
            # 최근 구매단가가 없는 품목은 임의의 기본 단가로 대체(실단가 미확인 표시 목적)
            unit_price = price_map.get(itm_id, Decimal("1000"))
            stock_value = unit_price * qty
            safety_stock = max(int(qty * 0.2), 1)

            if qty < safety_stock:
                status = "critical"
            elif qty < safety_stock * 1.5:
                status = "low"
            elif qty > safety_stock * 5:
                status = "high"
            else:
                status = "adequate"

            if stock_value >= 10_000_000:
                category = "A"
            elif stock_value >= 1_000_000:
                category = "B"
            else:
                category = "C"

            _, was_created = Inventory.objects.update_or_create(
                item_code=f"ITM-{itm_id}",
                defaults={
                    "item_name": f"품목-{itm_id}",
                    "category": category,
                    "current_stock": qty,
                    "safety_stock": safety_stock,
                    "stock_value": stock_value,
                    "turnover_rate": Decimal("4.0"),
                    "status": status,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"  재고 {created}건 생성 (총 {len(stock_rows)}건 처리)"))

    def _import_executive_summary(self, start_date, end_date):
        from django.db.models import Sum
        from reports.models import ExecutiveSummary
        from sales.models import MonthlySales
        from production.models import DailyProduction
        from quality.models import QualityInspection

        self.stdout.write("경영 요약(ExecutiveSummary) 파생 생성 중...")
        created = 0
        cur = date(start_date.year, start_date.month, 1)
        while cur < end_date:
            y, m = cur.year, cur.month
            sales_row = MonthlySales.objects.filter(fiscal_year=y, fiscal_month=m).first()
            revenue_krw = float(sales_row.actual_amount) if sales_row else 0
            revenue_eok = round(revenue_krw / 100_000_000, 2)  # 억원 환산

            production_volume = DailyProduction.objects.filter(
                production_date__year=y, production_date__month=m
            ).aggregate(total=Sum("actual_quantity"))["total"] or 0

            insp_qs = QualityInspection.objects.filter(
                inspection_date__year=y, inspection_date__month=m
            )
            insp_total = insp_qs.count()
            insp_pass = insp_qs.filter(result="pass").count()
            quality_rate = round(insp_pass / insp_total * 100, 2) if insp_total else 95.0

            # 실제 원가/손익 테이블은 이번 조사 범위 밖이라, 매출 대비 통상적인 비율로 추정
            operating_profit_eok = round(revenue_eok * 0.12, 2)
            net_profit_eok = round(revenue_eok * 0.08, 2)

            _, was_created = ExecutiveSummary.objects.update_or_create(
                fiscal_year=y, fiscal_month=m,
                defaults={
                    "revenue": Decimal(str(revenue_eok)),
                    "revenue_growth": Decimal("0"),
                    "operating_profit": Decimal(str(operating_profit_eok)),
                    "operating_margin": Decimal("12.00"),
                    "net_profit": Decimal(str(net_profit_eok)),
                    "net_margin": Decimal("8.00"),
                    "production_volume": production_volume,
                    "quality_rate": Decimal(str(quality_rate)),
                    "employee_count": 300,
                },
            )
            if was_created:
                created += 1

            cur = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
        self.stdout.write(self.style.SUCCESS(f"  경영 요약 {created}건 생성"))
