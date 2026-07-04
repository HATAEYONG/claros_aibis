# -*- coding: utf-8 -*-
"""
Local Data Analysis Service
로컬 SQLite 데이터베이스의 데이터를 분석하는 서비스

사용법:
    from ai.local_analysis import LocalAnalyzer

    analyzer = LocalAnalyzer()

    # 매출 분석
    sales_analysis = analyzer.analyze_sales(months=3)

    # 품질 분석
    quality_analysis = analyzer.analyze_quality(days=90)

    # 생산 분석
    production_analysis = analyzer.analyze_production(days=90)
"""

import sys
import io
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

# UTF-8 출력 설정 (Windows에서는 stdout 재설정 생략 - 이미 UTF-8 처리됨)
# Django에서는 이미 UTF-8 처리가 되므로 stdout wrapper를 사용하지 않음

# 안전한 print 함수 (이모지 인코딩 오류 방지)
def safe_print(msg: str):
    """이모지 등을 포함한 메시지를 안전하게 출력"""
    try:
        print(msg)
    except (UnicodeEncodeError, UnicodeError):
        # 인코딩 오류 발생 시 이모지 제거 후 출력
        print(msg.encode('ascii', 'ignore').decode('ascii'))

# Django 설정
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connection
from decimal import Decimal


class LocalAnalyzer:
    """로컬 데이터 분석 클래스"""

    def __init__(self):
        self.analysis_cache = {}
        self.cache_ttl = 300  # 5분 캐시

    def analyze_sales(self, months: int = 3) -> Dict[str, Any]:
        """매출 분석

        Args:
            months: 분석할 개월 수

        Returns:
            분석 결과 딕셔너리
        """
        safe_print(f"📊 최근 {months}개월 매출 분석 중...")

        with connection.cursor() as cursor:
            # 기본 통계 (PostgreSQL: ORDER BY without GROUP BY requires all columns in SELECT)
            # 서브쿼리를 사용하여 최근 N개월 데이터만 집계
            cursor.execute("""
                SELECT
                    COUNT(*) as total_records,
                    COALESCE(SUM(target_amount), 0) as total_target,
                    COALESCE(SUM(actual_amount), 0) as total_actual,
                    COALESCE(AVG(actual_amount), 0) as avg_actual,
                    COALESCE(AVG(achievement_rate), 0) as avg_achievement_rate,
                    COALESCE(SUM(new_customers), 0) as total_new_customers
                FROM (
                    SELECT *
                    FROM sales_monthly
                    ORDER BY fiscal_year DESC, fiscal_month DESC
                    LIMIT %s
                ) AS recent_months
            """, [months])

            row = cursor.fetchone()
            stats = {
                'total_records': row[0] or 0,
                'total_target': float(row[1] or 0),
                'total_actual': float(row[2] or 0),
                'avg_actual': float(row[3] or 0),
                'avg_achievement_rate': float(row[4] or 0),
                'total_new_customers': row[5] or 0
            }

            # 달성률 계산
            if stats['total_target'] > 0:
                stats['overall_achievement_rate'] = round(stats['total_actual'] / stats['total_target'] * 100, 2)
            else:
                stats['overall_achievement_rate'] = 0

            # 월별 추세
            cursor.execute("""
                SELECT
                    fiscal_year,
                    fiscal_month,
                    target_amount,
                    actual_amount,
                    achievement_rate,
                    new_customers,
                    contract_rate,
                    pipeline_value
                FROM sales_monthly
                ORDER BY fiscal_year DESC, fiscal_month DESC
                LIMIT %s
            """, [months])

            monthly_data = []
            for row in cursor.fetchall():
                monthly_data.append({
                    'year': row[0],
                    'month': row[1],
                    'target_amount': float(row[2]),
                    'actual_amount': float(row[3]),
                    'achievement_rate': float(row[4]),
                    'new_customers': row[5],
                    'contract_rate': float(row[6]),
                    'pipeline_value': float(row[7])
                })

            # 전월 대비 증감율 계산
            if len(monthly_data) >= 2:
                current = monthly_data[0]
                previous = monthly_data[1]

                sales_change = ((current['actual_amount'] - previous['actual_amount']) / previous['actual_amount'] * 100) if previous['actual_amount'] > 0 else 0

                stats['sales_change_rate'] = round(sales_change, 2)
            else:
                stats['sales_change_rate'] = 0

        result = {
            'period': f'최근 {months}개월',
            'statistics': stats,
            'monthly_data': monthly_data,
            'insights': self._generate_sales_insights(stats, monthly_data)
        }

        safe_print(f"   ✅ 분석 완료: {stats['total_records']}개월 데이터")
        return result

    def analyze_quality(self, days: int = 90) -> Dict[str, Any]:
        """품질 분석

        Args:
            days: 분석할 일수

        Returns:
            분석 결과 딕셔너리
        """
        safe_print(f"📊 최근 {days}일 품질 분석 중...")

        cutoff_date = datetime.now() - timedelta(days=days)

        with connection.cursor() as cursor:
            # 기본 통계
            cursor.execute("""
                SELECT
                    COUNT(*) as total_inspections,
                    SUM(sample_size) as total_sampled,
                    SUM(defect_count) as total_defects,
                    AVG(defect_count * 100.0 / NULLIF(sample_size, 0)) as avg_defect_rate,
                    SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as pass_count,
                    SUM(CASE WHEN result = 'fail' THEN 1 ELSE 0 END) as fail_count,
                    SUM(CASE WHEN result = 'conditional' THEN 1 ELSE 0 END) as conditional_count
                FROM quality_inspections
                WHERE inspection_date >= %s
            """, [cutoff_date.date()])

            row = cursor.fetchone()
            stats = {
                'total_inspections': row[0] or 0,
                'total_sampled': row[1] or 0,
                'total_defects': row[2] or 0,
                'avg_defect_rate': float(row[3] or 0),
                'pass_count': row[4] or 0,
                'fail_count': row[5] or 0,
                'conditional_count': row[6] or 0
            }

            # 합격률 계산
            if stats['total_inspections'] > 0:
                stats['pass_rate'] = round(stats['pass_count'] / stats['total_inspections'] * 100, 2)
                stats['fail_rate'] = round(stats['fail_count'] / stats['total_inspections'] * 100, 2)
            else:
                stats['pass_rate'] = 0
                stats['fail_rate'] = 0

            # 제품별 불량률
            cursor.execute("""
                SELECT
                    product_name,
                    COUNT(*) as inspection_count,
                    SUM(sample_size) as total_sampled,
                    SUM(defect_count) as total_defects,
                    AVG(defect_count * 100.0 / NULLIF(sample_size, 0)) as avg_defect_rate
                FROM quality_inspections
                WHERE inspection_date >= %s
                GROUP BY product_name
                ORDER BY avg_defect_rate DESC
                LIMIT 10
            """, [cutoff_date.date()])

            product_quality = []
            for row in cursor.fetchall():
                product_quality.append({
                    'product_name': row[0],
                    'inspection_count': row[1],
                    'total_sampled': row[2],
                    'total_defects': row[3],
                    'avg_defect_rate': float(row[4] or 0)
                })

            # 일별 불량률 추세
            cursor.execute("""
                SELECT
                    inspection_date,
                    COUNT(*) as inspection_count,
                    AVG(defect_count * 100.0 / NULLIF(sample_size, 0)) as avg_defect_rate
                FROM quality_inspections
                WHERE inspection_date >= %s
                GROUP BY inspection_date
                ORDER BY inspection_date DESC
                LIMIT 30
            """, [cutoff_date.date()])

            daily_trend = []
            for row in cursor.fetchall():
                daily_trend.append({
                    'date': str(row[0]),
                    'inspection_count': row[1],
                    'avg_defect_rate': float(row[2] or 0)
                })

        result = {
            'period': f'최근 {days}일',
            'statistics': stats,
            'product_quality': product_quality,
            'daily_trend': daily_trend,
            'insights': self._generate_quality_insights(stats, product_quality)
        }

        safe_print(f"   ✅ 분석 완료: {stats['total_inspections']}건 검사 데이터")
        return result

    def analyze_production(self, days: int = 90) -> Dict[str, Any]:
        """생산 분석

        Args:
            days: 분석할 일수

        Returns:
            분석 결과 딕셔너리
        """
        safe_print(f"📊 최근 {days}일 생산 분석 중...")

        cutoff_date = datetime.now() - timedelta(days=days)

        with connection.cursor() as cursor:
            # 기본 통계
            cursor.execute("""
                SELECT
                    COUNT(*) as total_records,
                    SUM(target_quantity) as total_target,
                    SUM(actual_quantity) as total_produced,
                    SUM(defect_quantity) as total_defective,
                    AVG(efficiency) as avg_efficiency,
                    AVG(actual_quantity * 100.0 / NULLIF(target_quantity, 0)) as avg_achievement_rate
                FROM daily_productions
                WHERE production_date >= %s
            """, [cutoff_date.date()])

            row = cursor.fetchone()
            stats = {
                'total_records': row[0] or 0,
                'total_target': row[1] or 0,
                'total_produced': row[2] or 0,
                'total_defective': row[3] or 0,
                'avg_efficiency': float(row[4] or 0),
                'avg_achievement_rate': float(row[5] or 0)
            }

            # 불량률 계산
            if stats['total_produced'] > 0:
                stats['defect_rate'] = round(stats['total_defective'] / stats['total_produced'] * 100, 2)
            else:
                stats['defect_rate'] = 0

            # 전체 생산 목표 대비 달성률
            if stats['total_target'] > 0:
                stats['overall_achievement_rate'] = round(stats['total_produced'] / stats['total_target'] * 100, 2)
            else:
                stats['overall_achievement_rate'] = 0

            # 라인별 생산 현황
            cursor.execute("""
                SELECT
                    dp.production_line_id,
                    pl.name as line_name,
                    COUNT(*) as record_count,
                    SUM(dp.actual_quantity) as total_produced,
                    AVG(dp.efficiency) as avg_efficiency,
                    AVG(dp.actual_quantity * 100.0 / NULLIF(dp.target_quantity, 0)) as avg_achievement_rate
                FROM daily_productions dp
                LEFT JOIN production_lines pl ON dp.production_line_id = pl.id
                WHERE dp.production_date >= %s
                GROUP BY dp.production_line_id, pl.name
                ORDER BY total_produced DESC
            """, [cutoff_date.date()])

            line_performance = []
            for row in cursor.fetchall():
                line_performance.append({
                    'line_id': row[0],
                    'line_name': row[1] or f'Line {row[0]}',
                    'record_count': row[2],
                    'total_produced': row[3],
                    'avg_efficiency': float(row[4] or 0),
                    'avg_achievement_rate': float(row[5] or 0)
                })

            # 일별 생산 추세
            cursor.execute("""
                SELECT
                    production_date,
                    SUM(actual_quantity) as daily_produced,
                    SUM(defect_quantity) as daily_defective,
                    AVG(efficiency) as avg_efficiency
                FROM daily_productions
                WHERE production_date >= %s
                GROUP BY production_date
                ORDER BY production_date DESC
                LIMIT 30
            """, [cutoff_date.date()])

            daily_trend = []
            for row in cursor.fetchall():
                daily_trend.append({
                    'date': str(row[0]),
                    'actual_quantity': row[1],
                    'defect_quantity': row[2],
                    'efficiency': float(row[3] or 0)
                })

        result = {
            'period': f'최근 {days}일',
            'statistics': stats,
            'line_performance': line_performance,
            'daily_trend': daily_trend,
            'insights': self._generate_production_insights(stats, line_performance)
        }

        safe_print(f"   ✅ 분석 완료: {stats['total_records']}일 생산 데이터")
        return result

    def analyze_comprehensive(self, days: int = 90) -> Dict[str, Any]:
        """종합 분석

        Args:
            days: 분석할 일수

        Returns:
            전체 분석 결과
        """
        safe_print("=" * 60)
        safe_print("📊 종합 데이터 분석 시작")
        safe_print("=" * 60)
        safe_print(f"분석 기간: 최근 {days}일")
        safe_print("")

        months = (days + 29) // 30  # 일수를 개월수로 변환

        result = {
            'analysis_date': datetime.now().isoformat(),
            'period_days': days,
            'period_months': months,
            'sales': self.analyze_sales(months),
            'quality': self.analyze_quality(days),
            'production': self.analyze_production(days),
            'summary': {}  # 종합 요약은 나중에 추가
        }

        # 종합 요약 생성
        result['summary'] = self._generate_summary(result)

        safe_print("")
        safe_print("=" * 60)
        safe_print("✅ 종합 분석 완료")
        safe_print("=" * 60)

        return result

    def _generate_sales_insights(self, stats: Dict, monthly_data: List) -> List[str]:
        """매출 인사이트 생성"""
        insights = []

        if stats.get('sales_change_rate', 0) > 5:
            insights.append(f"📈 매출이 전월 대비 {stats['sales_change_rate']:.1f}% 증가했습니다.")
        elif stats.get('sales_change_rate', 0) < -5:
            insights.append(f"📉 매출이 전월 대비 {abs(stats['sales_change_rate']):.1f}% 감소했습니다.")

        if stats.get('avg_achievement_rate', 0) < 80:
            insights.append(f"⚠️ 평균 달성률이 {stats['avg_achievement_rate']:.1f}%입니다. 목표 달성을 위한 대책이 필요합니다.")
        elif stats.get('avg_achievement_rate', 0) >= 100:
            insights.append(f"✅ 평균 달성률이 {stats['avg_achievement_rate']:.1f}%로 우수합니다.")

        if stats.get('total_new_customers', 0) > 0:
            insights.append(f"👥 분석 기간 중 신규 고객 {stats['total_new_customers']}명을 확보했습니다.")

        return insights

        return insights

    def _generate_quality_insights(self, stats: Dict, product_quality: List) -> List[str]:
        """품질 인사이트 생성"""
        insights = []

        if stats.get('avg_defect_rate', 0) > 5:
            insights.append(f"⚠️ 평균 불량률이 {stats['avg_defect_rate']:.1f}%로 높습니다.")
        elif stats.get('avg_defect_rate', 0) < 2:
            insights.append(f"✅ 평균 불량률이 {stats['avg_defect_rate']:.1f}%로 양호합니다.")

        if stats.get('pass_rate', 0) > 95:
            insights.append(f"✅ 합격률이 {stats['pass_rate']:.1f}%로 우수합니다.")

        if product_quality and product_quality[0]['avg_defect_rate'] > 10:
            insights.append(f"⚠️ '{product_quality[0]['product_name']}' 제품의 불량률이 높습니다.")

        return insights

    def _generate_production_insights(self, stats: Dict, line_performance: List) -> List[str]:
        """생산 인사이트 생성"""
        insights = []

        if stats.get('defect_rate', 0) > 5:
            insights.append(f"⚠️ 생산 불량률이 {stats['defect_rate']:.1f}%로 높습니다.")

        if stats.get('avg_efficiency', 0) > 85:
            insights.append(f"✅ 평균 효율이 {stats['avg_efficiency']:.1f}%로 양호합니다.")
        elif stats.get('avg_efficiency', 0) < 70:
            insights.append(f"⚠️ 평균 효율이 {stats['avg_efficiency']:.1f}%로 낮습니다.")

        if stats.get('overall_achievement_rate', 0) < 90:
            insights.append(f"⚠️ 생산 목표 달성률이 {stats['overall_achievement_rate']:.1f}%입니다.")

        return insights

    def _generate_summary(self, result: Dict) -> Dict[str, Any]:
        """종합 요약 생성"""
        return {
            'overall_status': 'normal',
            'key_metrics': {
                'total_sales': result['sales']['statistics']['total_actual'],
                'sales_achievement_rate': result['sales']['statistics']['overall_achievement_rate'],
                'total_produced': result['production']['statistics']['total_produced'],
                'quality_pass_rate': result['quality']['statistics']['pass_rate'],
                'production_efficiency': result['production']['statistics']['avg_efficiency']
            },
            'recommendations': self._generate_recommendations(result)
        }

    def _generate_recommendations(self, result: Dict) -> List[str]:
        """개선 권장사항 생성"""
        recommendations = []

        # 매출 관련
        if result['sales']['statistics'].get('sales_change_rate', 0) < 0:
            recommendations.append("매출 감소 추세: 영업 전략 재검토가 필요합니다.")

        if result['sales']['statistics'].get('avg_achievement_rate', 0) < 80:
            recommendations.append("매출 목표 미달성: 영업 활동 강화가 필요합니다.")

        # 품질 관련
        if result['quality']['statistics'].get('avg_defect_rate', 0) > 5:
            recommendations.append("불량률 개선: 품질 관리 프로세스 강화가 필요합니다.")

        # 생산 관련
        if result['production']['statistics'].get('avg_efficiency', 0) < 75:
            recommendations.append("생산 효율 개선: 설비 가동률과 공정 최적화를 검토하세요.")

        if result['production']['statistics'].get('defect_rate', 0) > 5:
            recommendations.append("생산 불량률 개선: 공정 품질 관리를 강화하세요.")

        if not recommendations:
            recommendations.append("현재 모든 지표가 양호한 상태입니다.")

        return recommendations


# 메인 실행 함수
def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='로컬 데이터 분석')
    parser.add_argument('--type', choices=['sales', 'quality', 'production', 'all'],
                       default='all', help='분석 유형')
    parser.add_argument('--days', type=int, default=90, help='분석 일수')
    parser.add_argument('--output', help='결과 저장 파일')

    args = parser.parse_args()

    analyzer = LocalAnalyzer()

    if args.type == 'sales':
        result = analyzer.analyze_sales(months=(args.days + 29) // 30)
    elif args.type == 'quality':
        result = analyzer.analyze_quality(days=args.days)
    elif args.type == 'production':
        result = analyzer.analyze_production(days=args.days)
    else:  # all
        result = analyzer.analyze_comprehensive(days=args.days)

    # 결과 출력
    safe_print("")
    safe_print(json.dumps(result, ensure_ascii=False, indent=2, default=str))

    # 파일 저장
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2, default=str)
        safe_print(f"\n✅ 결과 저장 완료: {args.output}")


if __name__ == '__main__':
    main()
