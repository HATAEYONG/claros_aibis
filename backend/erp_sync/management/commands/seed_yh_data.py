"""
ERP 매핑 관리 시스템 초기 데이터 시딩 커맨드
유한 DB(YH ERP) 기본 설정 및 테이블 정의 가져오기
"""

import os
import csv
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings

from erp_sync.models import ERPSource, ERPTableDefinition, ERPFieldDefinition
from erp_sync.models import ERPTargetModel, ERPTargetField
from erp_sync.models import ERPTableMapping


class Command(BaseCommand):
    help = 'ERP 매핑 관리 시스템 초기 데이터 시딩'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-yh-source',
            action='store_true',
            help='유한 DB 소스 생성 건너뛰기',
        )
        parser.add_argument(
            '--skip-target-models',
            action='store_true',
            help='타겟 모델 생성 건너뛰기',
        )
        parser.add_argument(
            '--import-from-csv',
            type=str,
            help='CSV 파일 경로 (테이블 정의서)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('ERP 매핑 관리 시스템 초기 데이터 시딩 시작...'))

        # 1. 유한 DB 소스 생성
        if not options.get('skip_yh_source'):
            self.create_yh_source()

        # 2. MIS 타겟 모델 생성
        if not options.get('skip_target_models'):
            self.create_target_models()

        # 3. CSV 테이블 정의서 가져오기
        csv_path = options.get('import_from_csv')
        if csv_path:
            self.import_from_csv(csv_path)
        else:
            # 기본 CSV 파일 경로 확인
            default_csv = os.path.join(settings.BASE_DIR, '../../SAP_table_yuhan.csv')
            if os.path.exists(default_csv):
                self.import_from_csv(default_csv)

        self.stdout.write(self.style.SUCCESS('초기 데이터 시딩 완료!'))

    def create_yh_source(self):
        """유한 DB(YH ERP) 소스 생성"""
        self.stdout.write('유한 DB 소스 생성 중...')

        source, created = ERPSource.objects.get_or_create(
            source_code='YH',
            defaults={
                'source_name': '유한 DB (PostgreSQL)',
                'source_type': 'postgresql',
                'description': '유한킴벌리 SAP ERP 시스템',
                'host': '133.186.214.219',
                'port': 27455,
                'database_name': 'sap',
                'schema_name': 'public',
                'username': 'yh',
                'password': 'db!@yh#$1!',
                'is_default': True,
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ 유한 DB 소스 생성 완료 (ID: {source.erp_source_id})'))
        else:
            # 기존 소스가 있는 경우 자격증 Mind 업데이트
            source.username = 'yh'
            source.password = 'db!@yh#$1!'
            source.save()
            self.stdout.write(self.style.WARNING(f'  × 유한 DB 소스 이미 존재 (ID: {source.erp_source_id}), 자격증 Mind 업데이트 완료'))

    def create_target_models(self):
        """MIS 타겟 모델 생성"""
        self.stdout.write('MIS 타겟 모델 생성 중...')

        models = [
            # 영업 모듈
            {
                'model_name': 'MonthlySales',
                'model_label': '월별 매출',
                'app_label': 'sales',
                'model_type': 'fact',
                'db_table_name': 'sales_monthlysales',
                'description': '월별 판매 실적 데이터',
                'fields': [
                    {'field_name': 'company_code', 'field_type': 'CharField', 'field_label': '회사 코드', 'is_required': True, 'max_length': 10},
                    {'field_name': 'fiscal_year', 'field_type': 'IntegerField', 'field_label': '회계 연도', 'is_required': True},
                    {'field_name': 'fiscal_month', 'field_type': 'IntegerField', 'field_label': '회계 월', 'is_required': True},
                    {'field_name': 'customer_code', 'field_type': 'CharField', 'field_label': '고객 코드', 'is_required': True, 'max_length': 20},
                    {'field_name': 'customer_name', 'field_type': 'CharField', 'field_label': '고객명', 'is_required': False, 'max_length': 100},
                    {'field_name': 'product_code', 'field_type': 'CharField', 'field_label': '품목 코드', 'is_required': True, 'max_length': 50},
                    {'field_name': 'product_name', 'field_type': 'CharField', 'field_label': '품목명', 'is_required': False, 'max_length': 200},
                    {'field_name': 'plan_quantity', 'field_type': 'DecimalField', 'field_label': '계획 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'plan_amount', 'field_type': 'DecimalField', 'field_label': '계획 금액', 'is_required': False, 'decimal_places': 2},
                    {'field_name': 'actual_quantity', 'field_type': 'DecimalField', 'field_label': '실적 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'actual_amount', 'field_type': 'DecimalField', 'field_label': '실적 금액', 'is_required': False, 'decimal_places': 2},
                ]
            },
            # 생산 모듈
            {
                'model_name': 'WorkOrder',
                'model_label': '작업 지시',
                'app_label': 'production',
                'model_type': 'fact',
                'db_table_name': 'production_workorder',
                'description': '생산 작업 지시 데이터',
                'fields': [
                    {'field_name': 'plan_no', 'field_type': 'CharField', 'field_label': '계획 번호', 'is_required': True, 'max_length': 20, 'is_unique': True},
                    {'field_name': 'plan_date', 'field_type': 'DateField', 'field_label': '계획 일자', 'is_required': True},
                    {'field_name': 'factory_code', 'field_type': 'CharField', 'field_label': '공장 코드', 'is_required': True, 'max_length': 10},
                    {'field_name': 'line_code', 'field_type': 'CharField', 'field_label': '라인 코드', 'is_required': False, 'max_length': 20},
                    {'field_name': 'product_code', 'field_type': 'CharField', 'field_label': '품목 코드', 'is_required': True, 'max_length': 50},
                    {'field_name': 'product_name', 'field_type': 'CharField', 'field_label': '품목명', 'is_required': False, 'max_length': 200},
                    {'field_name': 'plan_quantity', 'field_type': 'DecimalField', 'field_label': '계획 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'actual_quantity', 'field_type': 'DecimalField', 'field_label': '실적 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'good_quantity', 'field_type': 'DecimalField', 'field_label': '양품 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'defect_quantity', 'field_type': 'DecimalField', 'field_label': '불량 수량', 'is_required': False, 'decimal_places': 4},
                ]
            },
            # 품질 모듈
            {
                'model_name': 'QualityInspection',
                'model_label': '품질 검사',
                'app_label': 'quality',
                'model_type': 'fact',
                'db_table_name': 'quality_qualityinspection',
                'description': '품질 검사 데이터',
                'fields': [
                    {'field_name': 'inspection_no', 'field_type': 'CharField', 'field_label': '검사 번호', 'is_required': True, 'max_length': 20, 'is_unique': True},
                    {'field_name': 'inspection_date', 'field_type': 'DateField', 'field_label': '검사 일자', 'is_required': True},
                    {'field_name': 'factory_code', 'field_type': 'CharField', 'field_label': '공장 코드', 'is_required': True, 'max_length': 10},
                    {'field_name': 'customer_code', 'field_type': 'CharField', 'field_label': '고객 코드', 'is_required': False, 'max_length': 20},
                    {'field_name': 'product_code', 'field_type': 'CharField', 'field_label': '품목 코드', 'is_required': True, 'max_length': 50},
                    {'field_name': 'product_name', 'field_type': 'CharField', 'field_label': '품목명', 'is_required': False, 'max_length': 200},
                    {'field_name': 'lot_no', 'field_type': 'CharField', 'field_label': 'LOT 번호', 'is_required': False, 'max_length': 50},
                    {'field_name': 'inspection_quantity', 'field_type': 'IntegerField', 'field_label': '검사 수량', 'is_required': False},
                    {'field_name': 'pass_quantity', 'field_type': 'IntegerField', 'field_label': '합격 수량', 'is_required': False},
                    {'field_name': 'fail_quantity', 'field_type': 'IntegerField', 'field_label': '불합격 수량', 'is_required': False},
                    {'field_name': 'pass_rate', 'field_type': 'DecimalField', 'field_label': '합격률', 'is_required': False, 'decimal_places': 4},
                ]
            },
            # 구매 모듈
            {
                'model_name': 'PurchaseOrder',
                'model_label': '구매 오더',
                'app_label': 'purchase',
                'model_type': 'fact',
                'db_table_name': 'purchase_purchaseorder',
                'description': '구매 오더 데이터',
                'fields': [
                    {'field_name': 'order_no', 'field_type': 'CharField', 'field_label': '오더 번호', 'is_required': True, 'max_length': 20, 'is_unique': True},
                    {'field_name': 'order_date', 'field_type': 'DateField', 'field_label': '오더 일자', 'is_required': True},
                    {'field_name': 'supplier_code', 'field_type': 'CharField', 'field_label': '공급업체 코드', 'is_required': True, 'max_length': 20},
                    {'field_name': 'supplier_name', 'field_type': 'CharField', 'field_label': '공급업체명', 'is_required': False, 'max_length': 100},
                    {'field_name': 'product_code', 'field_type': 'CharField', 'field_label': '품목 코드', 'is_required': True, 'max_length': 50},
                    {'field_name': 'product_name', 'field_type': 'CharField', 'field_label': '품목명', 'is_required': False, 'max_length': 200},
                    {'field_name': 'order_quantity', 'field_type': 'DecimalField', 'field_label': '오더 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'received_quantity', 'field_type': 'DecimalField', 'field_label': '입고 수량', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'unit_price', 'field_type': 'DecimalField', 'field_label': '단가', 'is_required': False, 'decimal_places': 4},
                    {'field_name': 'order_amount', 'field_type': 'DecimalField', 'field_label': '오더 금액', 'is_required': False, 'decimal_places': 2},
                ]
            },
        ]

        for model_data in models:
            fields_data = model_data.pop('fields')
            model, created = ERPTargetModel.objects.get_or_create(
                model_name=model_data['model_name'],
                defaults=model_data
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ 모델 생성: {model.app_label}.{model.model_name}'))

                # 필드 생성
                for field_data in fields_data:
                    ERPTargetField.objects.create(
                        target_model=model,
                        **field_data
                    )
            else:
                self.stdout.write(self.style.WARNING(f'  × 모델 이미 존재: {model.app_label}.{model.model_name}'))

    def import_from_csv(self, csv_path):
        """CSV 테이블 정의서 가져오기"""
        self.stdout.write(f'CSV 테이블 정의서 가져오기: {csv_path}')

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'  × CSV 파일 not found: {csv_path}'))
            return

        try:
            # YH 소스 가져오기
            yh_source = ERPSource.objects.get(source_code='YH')

            # CSV 파싱
            df = pd.read_csv(csv_path, encoding='utf-8')

            # 그룹화: 테이블명별로 컬럼 그룹화
            grouped = df.groupby('테이블명')

            imported_tables = 0
            imported_fields = 0

            for table_name, group in grouped:
                # 테이블 정의 생성 또는 업데이트
                first_row = group.iloc[0]
                module_code = self.extract_module_code(table_name)

                table_def, created = ERPTableDefinition.objects.get_or_create(
                    erp_source=yh_source,
                    source_table_name=table_name,
                    defaults={
                        'source_table_comment': first_row.get('테이블 설명', ''),
                        'module_code': module_code,
                        'module_name': first_row.get('모듈구분', ''),
                    }
                )

                if created:
                    imported_tables += 1

                # 필드 정의 생성
                for _, row in group.iterrows():
                    ERPFieldDefinition.objects.get_or_create(
                        table_definition=table_def,
                        source_field_name=row['컬럼명'],
                        defaults={
                            'source_field_type': row['데이터 타입'],
                            'source_field_comment': row.get('컬럼설명', ''),
                            'is_primary_key': str(row.get('PK 여부', '')).upper() == 'Y',
                            'is_nullable': str(row.get('NOT NULL', '')).upper() != 'Y',
                            'is_foreign_key': str(row.get('FK 여부', '')).upper() == 'Y',
                            'referenced_table': row.get('참조 테이블', ''),
                            'referenced_field': row.get('참조 컬럼', ''),
                        }
                    )
                    imported_fields += 1

            self.stdout.write(self.style.SUCCESS(
                f'  ✓ {imported_tables}개 테이블, {imported_fields}개 필드 가져오기 완료'
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  × CSV 가져오기 실패: {str(e)}'))

    def extract_module_code(self, table_name):
        """테이블명에서 모듈 코드 추출"""
        if table_name.startswith('SD') or table_name.startswith('SA'):
            return 'SALES'
        elif table_name.startswith('DM') or table_name.startswith('PP'):
            return 'PRODUCTION'
        elif table_name.startswith('QM') or table_name.startswith('Q'):
            return 'QUALITY'
        elif table_name.startswith('MM') or table_name.startswith('LC'):
            return 'PURCHASE'
        elif table_name.startswith('CA') or table_name.startswith('FI'):
            return 'FINANCIAL'
        return 'ETC'
