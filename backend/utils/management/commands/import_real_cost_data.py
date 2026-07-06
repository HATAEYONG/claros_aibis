# -*- coding: utf-8 -*-
"""
복원된 실제 YH ERP(MSSQL) 백업의 원가 테이블(COS520_YH)에서 진짜 원가 데이터를
가져와 reports.ExecutiveSummary의 손익(영업이익/순이익)을 실측 기반으로 갱신한다.

COS520_YH(품목별 원가계산내역)의 cost_mon은 매 분기 말(3/6/9/12월)에 회계연도
누적으로 집계되는 스냅샷이다(실측으로 확인: 2025-03=33.0억, 2025-06=65.3억,
2025-09=106.8억 → 각 분기 순증분 33.0/32.3/41.5억으로 실제 월매출과 같은
자릿수). 따라서 분기 스냅샷 간 차이를 그 분기의 원가로 보고, 3개월에 균등
배분해 월별 원가 근사치를 만든다.

이 원가를 기존에 import_real_yh_data로 반영한 실제 매출(reports.ExecutiveSummary
.revenue, sales.MonthlySales 기반)과 대조해 영업이익/영업이익률을 실측 기반으로
재계산한다. 순이익은 법인세(약 22%)를 반영한 근사치다 - 실제 세무/비영업손익
데이터는 이번 조사 범위 밖이라 완전한 순이익 실측은 아니다.

사용법:
    python manage.py import_real_cost_data
"""
from collections import defaultdict
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError

# 법인세 등 영업외 비용을 반영한 순이익 근사 비율(실측 아님, 통상적인 가정)
NET_PROFIT_RATIO = Decimal("0.78")  # 영업이익의 78%를 순이익으로 근사(법인세 등 22% 차감)

QUARTER_MONTHS = {3: (1, 2, 3), 6: (4, 5, 6), 9: (7, 8, 9), 12: (10, 11, 12)}


class Command(BaseCommand):
    help = "실제 YH 원가 테이블(COS520_YH)을 반영해 ExecutiveSummary 손익을 실측 기반으로 갱신한다"

    def handle(self, *args, **options):
        try:
            import pyodbc
        except ImportError:
            raise CommandError("pyodbc가 설치되어 있지 않습니다: pip install pyodbc")

        from erp_sync.models import ERPConnectionConfigModel

        try:
            config = ERPConnectionConfigModel.objects.get(source_code="LOCAL_BACKUP")
        except ERPConnectionConfigModel.DoesNotExist:
            raise CommandError("LOCAL_BACKUP 연결 설정이 없습니다.")

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

        quarter_totals = self._fetch_quarter_cumulative_cost(cursor)
        monthly_cost = self._quarters_to_monthly_cost(quarter_totals)
        self._update_executive_summary(monthly_cost)

    def _fetch_quarter_cumulative_cost(self, cursor):
        """cost_mon(분기말 누적 스냅샷)별 총원가(sum_amt) 합계 조회"""
        self.stdout.write("원가(COS520_YH) 분기 누적 스냅샷 가져오는 중...")
        cursor.execute(
            """
            SELECT cost_mon, SUM(sum_amt)
            FROM COS520_YH
            WHERE cost_mon LIKE '____-__'
            GROUP BY cost_mon
            """
        )
        totals = {}
        for cost_mon, amt in cursor.fetchall():
            try:
                year_s, month_s = cost_mon.split("-")
                year, month = int(year_s), int(month_s)
            except (ValueError, AttributeError):
                continue
            if month not in QUARTER_MONTHS:
                continue
            amt = Decimal(str(amt or 0))
            if amt <= 0:
                continue
            totals[(year, month)] = amt
        self.stdout.write(f"  분기 스냅샷 {len(totals)}개 확보")
        return totals

    def _quarters_to_monthly_cost(self, quarter_totals):
        """분기 누적값을 분기 순증분으로 바꾸고, 3개월에 균등 배분한다."""
        by_year = defaultdict(dict)
        for (year, month), amt in quarter_totals.items():
            by_year[year][month] = amt

        monthly_cost = {}
        for year, months in by_year.items():
            prev_cumulative = Decimal("0")
            for q_month in (3, 6, 9, 12):
                if q_month not in months:
                    prev_cumulative = None  # 스냅샷 누락 시 이후 분기 증분 신뢰 불가
                    continue
                cumulative = months[q_month]
                if prev_cumulative is None:
                    prev_cumulative = cumulative
                    continue
                quarter_cost = cumulative - prev_cumulative
                if quarter_cost > 0:
                    per_month = quarter_cost / Decimal("3")
                    for m in QUARTER_MONTHS[q_month]:
                        monthly_cost[(year, m)] = per_month
                prev_cumulative = cumulative
        self.stdout.write(f"  월별 원가 근사치 {len(monthly_cost)}개월 산출")
        return monthly_cost

    def _update_executive_summary(self, monthly_cost):
        from reports.models import ExecutiveSummary

        self.stdout.write("ExecutiveSummary 손익 실측 반영 중...")
        updated = 0
        skipped_no_cost = 0
        for summary in ExecutiveSummary.objects.all():
            cost_krw = monthly_cost.get((summary.fiscal_year, summary.fiscal_month))
            if cost_krw is None:
                skipped_no_cost += 1
                continue

            revenue_krw = Decimal(str(summary.revenue)) * Decimal("100000000")  # 억원 -> 원
            operating_profit_krw = revenue_krw - cost_krw
            operating_margin = (
                round(float(operating_profit_krw) / float(revenue_krw) * 100, 2)
                if revenue_krw else 0
            )
            net_profit_krw = operating_profit_krw * NET_PROFIT_RATIO
            net_margin = (
                round(float(net_profit_krw) / float(revenue_krw) * 100, 2)
                if revenue_krw else 0
            )

            summary.operating_profit = Decimal(str(round(float(operating_profit_krw) / 100_000_000, 2)))
            summary.operating_margin = Decimal(str(operating_margin))
            summary.net_profit = Decimal(str(round(float(net_profit_krw) / 100_000_000, 2)))
            summary.net_margin = Decimal(str(net_margin))
            summary.save(update_fields=["operating_profit", "operating_margin", "net_profit", "net_margin"])
            updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"  {updated}개월 실측 원가로 갱신, {skipped_no_cost}개월은 원가 스냅샷 없어 기존값 유지"
        ))
