# -*- coding: utf-8 -*-
"""
YH Database Data Import Script
내보낸 YH 데이터를 로컬 SQLite 데이터베이스로 가져오기

사용법:
    python import_yh_data.py --file yh_export_data_20240222.json

또는 CSV 파일에서:
    python import_yh_data.py --csv-dir yh_data_export
"""

import sys
import io
import json
import csv
import os
from pathlib import Path
from datetime import datetime

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connection
from django.apps import apps


class YHDataImporter:
    """YH 데이터 가져오기 클래스"""

    def __init__(self, data_dir='yh_data_import'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.import_log = []

        # 테이블 모델 매핑
        self.model_mapping = {
            'sales_monthly': 'sales.SalesMonthly',
            'quality_inspections': 'quality.QualityInspection',
            'daily_productions': 'production.DailyProduction',
            'financial_statements': 'financial.FinancialStatement',
            'purchase_monthly': 'purchase.PurchaseMonthly',
            'defect_records': 'quality.DefectRecord',
            'equipment': 'production.Equipment',
            'cost_monthly': 'cost.CostMonthly',
            'customer_complaints': 'sales.CustomerComplaint',
            'work_orders': 'production.WorkOrder'
        }

    def import_from_json(self, json_file):
        """JSON 파일에서 데이터 가져오기

        Args:
            json_file: JSON 파일 경로
        """
        print("=" * 60)
        print("YH 데이터 가져오기 (JSON)")
        print("=" * 60)
        print(f"파일: {json_file}")
        print()

        json_path = Path(json_file)
        if not json_path.exists():
            print(f"❌ 파일을 찾을 수 없습니다: {json_file}")
            return False

        # JSON 파일 로드
        with open(json_path, 'r', encoding='utf-8') as f:
            all_data = json.load(f)

        # 각 테이블 데이터 가져오기
        total_imported = 0
        for table_name, data in all_data.items():
            count = self.import_table_data(table_name, data)
            total_imported += count

        self.print_summary(total_imported)
        return True

    def import_from_csv(self, csv_dir):
        """CSV 파일들에서 데이터 가져오기

        Args:
            csv_dir: CSV 파일들이 있는 디렉토리
        """
        print("=" * 60)
        print("YH 데이터 가져오기 (CSV)")
        print("=" * 60)
        print(f"디렉토리: {csv_dir}")
        print()

        csv_path = Path(csv_dir)
        if not csv_path.exists():
            print(f"❌ 디렉토리를 찾을 수 없습니다: {csv_dir}")
            return False

        # CSV 파일들 찾기
        csv_files = list(csv_path.glob('yh_export_*.csv'))
        if not csv_files:
            print(f"❌ CSV 파일을 찾을 수 없습니다")
            return False

        total_imported = 0
        for csv_file in csv_files:
            # 테이블명 추출 (yh_export_{table_name}_{timestamp}.csv)
            parts = csv_file.stem.split('_')
            if len(parts) >= 3:
                table_name = '_'.join(parts[2:-1])  # timestamp 제외

                # CSV 파일 읽기
                with open(csv_file, 'r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    data = list(reader)

                count = self.import_table_data(table_name, data)
                total_imported += count

        self.print_summary(total_imported)
        return True

    def import_table_data(self, table_name, data):
        """테이블 데이터 가져오기

        Args:
            table_name: 테이블명
            data: 데이터 리스트

        Returns:
            가져온 레코드 수
        """
        if not data:
            print(f"⚠️ [{table_name}] 데이터가 없습니다")
            return 0

        print(f"📊 [{table_name}] 데이터 가져오기 중... ({len(data)}건)")

        try:
            # 기존 데이터 삭제 옵션
            clear_first = self.ask_clear_data(table_name)

            if clear_first:
                self.clear_table(table_name)

            # 데이터 삽입
            inserted = self.insert_data(table_name, data)

            self.import_log.append({
                'table': table_name,
                'records': len(data),
                'inserted': inserted
            })

            print(f"   ✅ {inserted}건 가져오기 완료")
            return inserted

        except Exception as e:
            print(f"   ❌ 오류: {e}")
            self.import_log.append({
                'table': table_name,
                'error': str(e)
            })
            return 0

    def clear_table(self, table_name):
        """테이블 데이터 삭제

        Args:
            table_name: 테이블명
        """
        with connection.cursor() as cursor:
            cursor.execute(f"DELETE FROM {table_name}")
            connection.commit()

    def insert_data(self, table_name, data):
        """데이터 삽입

        Args:
            table_name: 테이블명
            data: 데이터 리스트

        Returns:
            삽입된 레코드 수
        """
        if not data:
            return 0

        # 컬럼명 추출
        columns = list(data[0].keys())

        # SQL 생성
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join(columns)
        sql = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders})"

        # 데이터 변환 및 삽입
        inserted = 0
        with connection.cursor() as cursor:
            for record in data:
                try:
                    # 값 변환
                    values = []
                    for col in columns:
                        val = record.get(col)
                        if val is None or val == '':
                            values.append(None)
                        elif isinstance(val, str):
                            # 날짜/시간 처리
                            if 'date' in col.lower() or 'time' in col.lower():
                                try:
                                    values.append(datetime.fromisoformat(val))
                                except:
                                    values.append(val)
                            else:
                                values.append(val)
                        else:
                            values.append(val)

                    cursor.execute(sql, values)
                    inserted += 1

                except Exception as e:
                    # 중복 키 등 무시하고 계속
                    continue

            connection.commit()

        return inserted

    def ask_clear_data(self, table_name):
        """기존 데이터 삭제 여부 확인

        Args:
            table_name: 테이블명
        """
        # 자동 모드 - 항상 삭제 후 가져오기
        return True

    def print_summary(self, total_imported):
        """가져오기 요약 출력

        Args:
            total_imported: 전체 가져온 레코드 수
        """
        print()
        print("=" * 60)
        print("데이터 가져오기 요약")
        print("=" * 60)

        for log in self.import_log:
            if 'error' in log:
                print(f"❌ {log['table']}: {log['error']}")
            else:
                print(f"✅ {log['table']:30s} {log['inserted']:6,}건 / {log['records']:6,}건")

        print("-" * 60)
        print(f"{'TOTAL':30s} {total_imported:6,}건")
        print()

        # 로그 파일 저장
        self.save_import_log(total_imported)

    def save_import_log(self, total_imported):
        """가져오기 로그 저장

        Args:
            total_imported: 전체 가져온 레코드 수
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = self.data_dir / f'import_log_{timestamp}.txt'

        with open(log_file, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("YH 데이터 가져오기 로그\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"가져오기 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"전체 가져온 레코드: {total_imported:,}건\n\n")

            f.write("테이블별 현황:\n")
            f.write("-" * 40 + "\n")
            for log in self.import_log:
                if 'error' in log:
                    f.write(f"❌ {log['table']}: {log['error']}\n")
                else:
                    f.write(f"✅ {log['table']:30s} {log['inserted']:6,}건\n")

        print(f"📝 로그 저장 완료: {log_file}")


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='YH 데이터베이스 데이터 가져오기')
    parser.add_argument('--file', help='JSON 데이터 파일 경로')
    parser.add_argument('--csv-dir', help='CSV 파일 디렉토리 경로')
    parser.add_argument('--data-dir', default='yh_data_import',
                       help='데이터/로그 디렉토리 (기본 yh_data_import)')

    args = parser.parse_args()

    importer = YHDataImporter(data_dir=args.data_dir)

    if args.file:
        # JSON 파일에서 가져오기
        success = importer.import_from_json(args.file)
    elif args.csv_dir:
        # CSV 파일들에서 가져오기
        success = importer.import_from_csv(args.csv_dir)
    else:
        print("사용법:")
        print("  python import_yh_data.py --file yh_export_data_YYYYMMDD_HHMMSS.json")
        print("  python import_yh_data.py --csv-dir yh_data_export")
        return

    if success:
        print("\n" + "=" * 60)
        print("✅ 데이터 가져오기 완료!")
        print("=" * 60)
        print("\n로컬 SQLite 데이터베이스에 데이터가 저장되었습니다.")
        print("분석 기능을 사용할 수 있습니다:")
        print("  - http://localhost:8000/api/sales/monthly/")
        print("  - http://localhost:8000/api/quality/inspections/")
        print("  - http://localhost:8000/api/production/daily-productions/")


if __name__ == '__main__':
    main()
