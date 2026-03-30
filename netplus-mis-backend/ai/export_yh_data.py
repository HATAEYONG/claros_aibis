# -*- coding: utf-8 -*-
"""
YH Database Data Export Script
프로덕션 환경에서 YH 데이터베이스 데이터를 내보내기 위한 스크립트

사용법:
    python export_yh_data.py

출력:
    - yh_export_data.json (전체 데이터)
    - yh_export_{table_name}.csv (각 테이블별 CSV)
"""

import sys
import io
import json
import csv
import os
from datetime import datetime, timedelta
from pathlib import Path

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from ai.database_connection import YHDatabaseConnection
    YH_AVAILABLE = True
except ImportError:
    YH_AVAILABLE = False
    print("⚠️ YH 데이터베이스 모듈을 찾을 수 없습니다.")


class YHDataExporter:
    """YH 데이터베이스 데이터 내보내기 클래스"""

    def __init__(self, output_dir='yh_data_export'):
        self.db = YHDatabaseConnection() if YH_AVAILABLE else None
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.export_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # 내보낼 주요 테이블 목록
        self.tables_to_export = [
            'sales_monthly',
            'quality_inspections',
            'daily_productions',
            'financial_statements',
            'purchase_monthly',
            'defect_records',
            'equipment',
            'cost_monthly',
            'customer_complaints',
            'work_orders'
        ]

    def export_all_data(self, days=90):
        """최근 N일간의 데이터를 모두 내보내기

        Args:
            days: 내보낼 일수 (기본 90일 = 3개월)
        """
        if not self.db:
            print("❌ 데이터베이스 연결 실패")
            return False

        print("=" * 60)
        print("YH 데이터베이스 데이터 내보내기")
        print("=" * 60)
        print(f"내보내기 기간: 최근 {days}일")
        print(f"출력 디렉토리: {self.output_dir.absolute()}")
        print()

        # 데이터베이스 연결
        if not self.db.connect():
            print("❌ YH 데이터베이스 연결 실패")
            print("네트워크 연결과 방화벽 설정을 확인하세요.")
            return False

        try:
            all_data = {}

            # 각 테이블에서 데이터 내보내기
            for table_name in self.tables_to_export:
                print(f"📊 [{table_name}] 데이터 내보내기 중...")
                data = self.export_table(table_name, days)
                if data:
                    all_data[table_name] = data
                    print(f"   ✅ {len(data)}건 내보내기 완료")
                else:
                    print(f"   ⚠️ 데이터 없음 또는 오류")

            # 전체 데이터 JSON으로 저장
            json_file = self.output_dir / f'yh_export_data_{self.export_timestamp}.json'
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2, default=str)
            print()
            print(f"✅ 전체 데이터 저장 완료: {json_file}")

            # 요약 정보 생성
            self.create_summary(all_data, days)

            return True

        except Exception as e:
            print(f"❌ 내보내기 오류: {e}")
            return False
        finally:
            self.db.disconnect()

    def export_table(self, table_name, days=90):
        """특정 테이블 데이터 내보내기

        Args:
            table_name: 테이블명
            days: 내보낼 일수

        Returns:
            데이터 리스트
        """
        try:
            # 먼저 테이블 스키마 확인
            columns_info = self.db.get_table_columns(table_name)
            if not columns_info:
                print(f"   ⚠️ 테이블 스키마를 찾을 수 없음: {table_name}")
                return []

            column_names = [col['column_name'] for col in columns_info]

            # 날짜 컬럼 찾기
            date_columns = [col['column_name'] for col in columns_info
                           if 'date' in col['column_name'].lower() or
                              'at' in col['column_name'].lower() or
                              'time' in col['column_name'].lower()]

            # 쿼리 생성
            if date_columns:
                date_col = date_columns[0]
                cutoff_date = datetime.now() - timedelta(days=days)

                if table_name in ['sales_monthly', 'purchase_monthly', 'cost_monthly']:
                    # 월별 테이블 - 월 기준 필터링
                    query = f"""
                        SELECT * FROM {table_name}
                        WHERE fiscal_year >= EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '{days} days')
                        ORDER BY fiscal_year DESC, fiscal_month DESC
                    """
                else:
                    # 일별 테이블 - 날짜 기준 필터링
                    query = f"""
                        SELECT * FROM {table_name}
                        WHERE {date_col} >= CURRENT_DATE - INTERVAL '{days} days'
                        ORDER BY {date_col} DESC
                    """
            else:
                # 날짜 컬럼이 없는 테이블 - 전체 데이터
                query = f"SELECT * FROM {table_name} LIMIT 1000"

            # 쿼리 실행
            data = self.db.execute_query(query)

            # CSV로도 저장
            if data:
                self.save_to_csv(table_name, data, column_names)

            return data

        except Exception as e:
            print(f"   ❌ 오류: {e}")
            return []

    def save_to_csv(self, table_name, data, column_names):
        """데이터를 CSV 파일로 저장

        Args:
            table_name: 테이블명
            data: 데이터 리스트
            column_names: 컬럼명 리스트
        """
        csv_file = self.output_dir / f'yh_export_{table_name}_{self.export_timestamp}.csv'

        with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=column_names, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(data)

    def create_summary(self, all_data, days):
        """데이터 내보내기 요약 생성

        Args:
            all_data: 전체 데이터 딕셔너리
            days: 내보낼 일수
        """
        summary_file = self.output_dir / f'yh_export_summary_{self.export_timestamp}.txt'

        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("YH 데이터베이스 내보내기 요약\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"내보내기 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"데이터 기간: 최근 {days}일\n\n")

            f.write("테이블별 내보내기 현황:\n")
            f.write("-" * 40 + "\n")

            total_records = 0
            for table_name, data in all_data.items():
                count = len(data)
                total_records += count
                f.write(f"  {table_name:30s} {count:6,}건\n")

            f.write("-" * 40 + "\n")
            f.write(f"  {'TOTAL':30s} {total_records:6,}건\n")
            f.write("\n")

        print(f"✅ 요약 정보 저장 완료: {summary_file}")


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='YH 데이터베이스 데이터 내보내기')
    parser.add_argument('--days', type=int, default=90,
                       help='내보낼 데이터 기간 (일수, 기본 90일)')
    parser.add_argument('--output-dir', default='yh_data_export',
                       help='출력 디렉토리 (기본 yh_data_export)')

    args = parser.parse_args()

    if not YH_AVAILABLE:
        print("❌ YH 데이터베이스 모듈을 사용할 수 없습니다.")
        print("프로덕션 환경에서 YH 데이터베이스에 접근 가능한지 확인하세요.")
        return

    exporter = YHDataExporter(output_dir=args.output_dir)
    success = exporter.export_all_data(days=args.days)

    if success:
        print("\n" + "=" * 60)
        print("✅ 데이터 내보내기 완료!")
        print("=" * 60)
        print("\n다음 단계:")
        print("1. 내보낸 데이터 파일을 로컬 개발 환경으로 복사")
        print("2. python import_yh_data.py 실행으로 데이터 가져오기")
        print("3. 로컬에서 데이터 분석 기능 사용")
    else:
        print("\n❌ 데이터 내보내기 실패")


if __name__ == '__main__':
    main()
