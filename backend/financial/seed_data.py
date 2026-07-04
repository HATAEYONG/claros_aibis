"""
Financial Statement Seed Data
재무제표 샘플 데이터 생성
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financial.models import FinancialStatement


def create_financial_statements():
    """손익계산서, 재무상태표, 현금흐름표, 자본변동표 데이터 생성"""
    print("Creating FinancialStatement data...")

    # Get current year for data generation
    current_year = datetime.now().year

    # 2024년 12개월 데이터 생성
    # 단위: 억원 (hundred million KRW)
    # 연간 목표: 매출 12,000억원 (1.2조), 영업이익 1,800억, 당기순이익 1,200억
    monthly_revenues = [
        950,    # 1월
        980,    # 2월
        1020,   # 3월
        1050,   # 4월
        1080,   # 5월
        1100,   # 6월 (H1 정점)
        1120,   # 7월
        1150,   # 8월
        1180,   # 9월
        1200,   # 10월
        1050,   # 11월
        1100    # 12월 (연말 성과)
    ]
    # 연간 합계: 약 12,980억원

    # Generate data for both 2024 and current year
    for year in [2024, current_year]:
        print(f"\n  Generating data for {year}...")

        cumulative_assets = Decimal('550000')  # 기초 자산 (억원)
        cumulative_equity = Decimal('300000')  # 기초 자본 (억원)
        cumulative_liabilities = Decimal('250000')  # 기초 부채 (억원)
        beginning_equity = Decimal('300000')  # 기초 자본 (억원)

        for month, revenue in enumerate(monthly_revenues, 1):
            revenue = Decimal(str(revenue))

            # 손익계산서 계산
            # 매출원가: 매출의 65-68%
            cost_of_sales = revenue * Decimal('0.66')
            gross_profit = revenue - cost_of_sales

            # 판매관리비: 매출의 18-20%
            operating_expenses = revenue * Decimal('0.19')
            operating_income = gross_profit - operating_expenses

            # 당기순이익: 영업이익의 75-80% (법인차감전)
            net_income = operating_income * Decimal('0.78')

            # 재무상태표 계산
            # 유동자산: 월 매출의 40-50%
            current_assets = revenue * Decimal('0.45')
            # 비유동자산은 고정
            non_current_assets = Decimal('300000')
            total_assets = current_assets + non_current_assets

            # 유동부채: 매출의 25-30%
            current_liabilities = revenue * Decimal('0.28')
            # 비유동부채는 고정
            non_current_liabilities = Decimal('100000')
            total_liabilities = current_liabilities + non_current_liabilities

            # 총자본 = 총자산 - 총부채
            total_equity = total_assets - total_liabilities

            # 현금흐름 계산 (단위: 억원)
            # 영업현금흐름: 당기순이익 + 감가상각(임의) ± 운전자본변동
            operating_cashflow = net_income * Decimal('1.1')  # 감가상각 등 가감

            # 투자현금흐름: 설비투자 (음수)
            investing_cashflow = Decimal('-50') if month in [3, 6, 9, 12] else Decimal('-20')

            # 재무현금흐름: 배당금 + 차입상환
            financing_cashflow = Decimal('-30') if month == 12 else Decimal('0')

            # 자본변동표 계산
            dividend_paid = Decimal('0') if month != 12 else net_income * Decimal('0.3')
            treasury_stock = Decimal('0')
            other_comprehensive_income = net_income * Decimal('0.02')

            # 기말자본 = 기초자본 + 당기순이익 - 배당금 + 기타포괄손익
            ending_equity = beginning_equity + net_income - dividend_paid + other_comprehensive_income

            # 각 재무제표 유형별로 레코드 생성
            statement_types = [
                {
                    'type': 'income',
                    'revenue': revenue,
                    'cost_of_sales': cost_of_sales,
                    'gross_profit': gross_profit,
                    'operating_expenses': operating_expenses,
                    'operating_income': operating_income,
                    'net_income': net_income,
                },
                {
                    'type': 'balance',
                    'total_assets': total_assets,
                    'current_assets': current_assets,
                    'non_current_assets': non_current_assets,
                    'current_liabilities': current_liabilities,
                    'total_liabilities': total_liabilities,
                    'total_equity': total_equity,
                },
                {
                    'type': 'cashflow',
                    'operating_cashflow': operating_cashflow,
                    'investing_cashflow': investing_cashflow,
                    'financing_cashflow': financing_cashflow,
                },
                {
                    'type': 'equity',
                    'beginning_equity': beginning_equity,
                    'net_income': net_income,
                    'dividend_paid': dividend_paid,
                    'treasury_stock': treasury_stock,
                    'other_comprehensive_income': other_comprehensive_income,
                    'ending_equity': ending_equity,
                }
            ]

            for stmt_data in statement_types:
                stmt_type = stmt_data.pop('type')

                FinancialStatement.objects.update_or_create(
                    statement_type=stmt_type,
                    fiscal_year=year,
                    fiscal_month=month,
                    defaults=stmt_data
                )

            # 다음 달을 위해 기초자본 업데이트
            beginning_equity = ending_equity

            print(f"  Created {year}-{month:02d}: Revenue={revenue:,.0f}M, OpInc={operating_income:,.0f}M, NetInc={net_income:,.0f}M")

    print("FinancialStatement data creation completed!")


def main():
    print("="*50)
    print("Financial Statement Seed Data Generation")
    print("="*50)

    # 기존 데이터 삭제 옵션
    delete_existing = input("Delete existing FinancialStatement data? (y/n): ").lower() == 'y'
    if delete_existing:
        count = FinancialStatement.objects.count()
        FinancialStatement.objects.all().delete()
        print(f"Deleted {count} existing records")

    create_financial_statements()

    print("="*50)
    print(f"Total FinancialStatement records: {FinancialStatement.objects.count()}")
    print("="*50)


if __name__ == '__main__':
    main()
