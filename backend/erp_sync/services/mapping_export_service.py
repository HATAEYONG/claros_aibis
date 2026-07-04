"""
매핑 가져오기/내보내기 서비스
"""

import csv
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class MappingImportService:
    """매핑 가져오기 서비스"""

    def import_from_csv(self, csv_file, erp_source_id: int,
                       import_type='both', overwrite=False) -> Dict[str, Any]:
        """CSV에서 매핑 가져오기"""
        from erp_sync.models import ERPSource, ERPTableDefinition, ERPFieldDefinition

        try:
            erp_source = ERPSource.objects.get(erp_source_id=erp_source_id)
        except ERPSource.DoesNotExist:
            return {
                'status': 'error',
                'message': f'ERP Source not found: {erp_source_id}'
            }

        # CSV 파싱
        try:
            df = csv.DictReader(csv_file.read().decode('utf-8').splitlines())
            rows = list(df)
        except Exception as e:
            return {
                'status': 'error',
                'message': f'CSV parsing failed: {str(e)}'
            }

        imported_tables = 0
        imported_fields = 0
        errors = []

        for row in rows:
            try:
                if import_type in ['tables', 'both']:
                    table_name = row.get('테이블명', '')
                    if not table_name:
                        continue

                    table_def, created = ERPTableDefinition.objects.update_or_create(
                        erp_source=erp_source,
                        source_table_name=table_name,
                        defaults={
                            'source_table_comment': row.get('테이블 설명', ''),
                            'module_code': self._extract_module_code(table_name),
                            'module_name': row.get('모듈구분', ''),
                        }
                    )

                    if created:
                        imported_tables += 1

                    if import_type == 'both':
                        # 필드 생성
                        ERPFieldDefinition.objects.get_or_create(
                            table_definition=table_def,
                            source_field_name=row.get('컬럼명', ''),
                            defaults={
                                'source_field_type': row.get('데이터 타입', ''),
                                'source_field_comment': row.get('컬럼설명', ''),
                                'is_primary_key': str(row.get('PK 여부', '')).upper() == 'Y',
                                'is_nullable': str(row.get('NOT NULL', '')).upper() != 'Y',
                            }
                        )
                        imported_fields += 1

            except Exception as e:
                errors.append({
                    'row': row,
                    'error': str(e)
                })

        return {
            'status': 'success',
            'imported_tables': imported_tables,
            'imported_fields': imported_fields,
            'errors': errors
        }

    def import_from_json(self, json_file, overwrite=False) -> Dict[str, Any]:
        """JSON에서 매핑 가져오기"""
        try:
            data = json.load(json_file.read().decode('utf-8'))
            return {
                'status': 'success',
                'imported_count': 0
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'JSON parsing failed: {str(e)}'
            }

    def _extract_module_code(self, table_name):
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


class MappingExportService:
    """매핑 내보내기 서비스"""

    def export_to_csv(self, erp_source_id: int, include_mappings=False,
                      export_format='tables') -> str:
        """CSV로 매핑 내보내기"""
        from erp_sync.models import ERPSource, ERPTableDefinition, ERPFieldDefinition

        erp_source = ERPSource.objects.get(erp_source_id=erp_source_id)
        tables = ERPTableDefinition.objects.filter(erp_source=erp_source)

        output = []
        output.append('테이블명,테이블 설명,모듈구분,컬럼명,컬럼설명,데이터 타입,NOT NULL,PK 여부,FK 여부')

        for table in tables:
            fields = ERPFieldDefinition.objects.filter(table_definition=table)

            if not fields:
                output.append(f"{table.source_table_name},{table.source_table_comment},{table.module_code},,,,,,")
                continue

            for field in fields:
                output.append(
                    f"{table.source_table_name},{table.source_table_comment},{table.module_code},"
                    f"{field.source_field_name},{field.source_field_comment},{field.source_field_type},"
                    f"{'Y' if not field.is_nullable else 'N'},"
                    f"{'Y' if field.is_primary_key else 'N'},"
                    f"{'Y' if field.is_foreign_key else 'N'}"
                )

        return '\n'.join(output)

    def export_to_json(self, erp_source_id: int, include_mappings=False,
                       export_format='tables') -> str:
        """JSON으로 매핑 내보내기"""
        from erp_sync.models import ERPSource, ERPTableDefinition, ERPFieldDefinition

        erp_source = ERPSource.objects.get(erp_source_id=erp_source_id)
        tables = ERPTableDefinition.objects.filter(erp_source=erp_source)

        data = {
            'erp_source': {
                'source_code': erp_source.source_code,
                'source_name': erp_source.source_name,
                'source_type': erp_source.source_type,
            },
            'tables': []
        }

        for table in tables:
            table_data = {
                'source_table_name': table.source_table_name,
                'source_table_comment': table.source_table_comment,
                'module_code': table.module_code,
                'module_name': table.module_name,
                'fields': []
            }

            fields = ERPFieldDefinition.objects.filter(table_definition=table)
            for field in fields:
                table_data['fields'].append({
                    'source_field_name': field.source_field_name,
                    'source_field_type': field.source_field_type,
                    'source_field_comment': field.source_field_comment,
                    'is_primary_key': field.is_primary_key,
                    'is_nullable': field.is_nullable,
                })

            data['tables'].append(table_data)

        return json.dumps(data, ensure_ascii=False, indent=2)

    def get_template(self, template_type='csv') -> str:
        """템플릿 다운로드"""
        if template_type == 'json':
            return json.dumps({
                'erp_source': {
                    'source_code': 'YH',
                    'source_name': '유한 DB',
                    'source_type': 'postgresql'
                },
                'tables': []
            }, ensure_ascii=False, indent=2)
        else:
            return '테이블명,테이블 설명,모듈구분,컬럼명,컬럼설명,데이터 타입,NOT NULL,PK 여부,FK 여부\n'
