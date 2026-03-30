"""
매핑 검증 서비스
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class MappingValidationService:
    """매핑 검증 서비스"""

    def validate_table_mapping(self, table_mapping) -> Dict[str, Any]:
        """
        테이블 매핑 검증

        Args:
            table_mapping: ERPTableMapping 인스턴스

        Returns:
            검증 결과 딕셔너리
        """
        results = {
            'structure': {
                'status': 'passed',
                'checks': []
            },
            'fields': {
                'status': 'passed',
                'warnings': []
            },
            'data': {
                'status': 'passed',
                'checks': []
            }
        }

        # 구조 검증
        structure_errors = self._validate_structure(table_mapping)
        results['structure']['checks'] = structure_errors

        if any(not check['status'] for check in structure_errors):
            results['structure']['status'] = 'failed'

        # 필드 검증
        field_warnings = self._validate_fields(table_mapping)
        results['fields']['warnings'] = field_warnings

        if field_warnings:
            results['fields']['status'] = 'warning'

        # 검증 기록 저장
        self._save_validation_record(table_mapping, results)

        return {
            'status': 'passed' if results['structure']['status'] == 'passed' else 'failed',
            'results': results
        }

    def _validate_structure(self, table_mapping) -> List[Dict[str, Any]]:
        """구조 검증"""
        checks = []

        # 소스 테이블 존재 확인
        checks.append({
            'check': 'source_table_exists',
            'status': 'passed' if table_mapping.source_table else 'failed',
            'message': 'Source table exists' if table_mapping.source_table else 'Source table not found'
        })

        # 타겟 모델 존재 확인
        checks.append({
            'check': 'target_model_exists',
            'status': 'passed' if table_mapping.target_model else 'failed',
            'message': 'Target model exists' if table_mapping.target_model else 'Target model not found'
        })

        # 키 필드 매핑 확인
        key_fields_mapped = self._check_key_fields_mapped(table_mapping)
        checks.append({
            'check': 'key_fields_mapped',
            'status': 'passed' if key_fields_mapped else 'failed',
            'message': 'Key fields mapped' if key_fields_mapped else 'Key fields not mapped'
        })

        # 날짜 컬럼 확인 (증분 동기화인 경우)
        if table_mapping.sync_type == 'incremental':
            has_date_column = bool(table_mapping.date_column)
            checks.append({
                'check': 'date_column_exists',
                'status': 'passed' if has_date_column else 'failed',
                'message': f'Date column set: {table_mapping.date_column}' if has_date_column else 'Date column not set'
            })

        return checks

    def _validate_fields(self, table_mapping) -> List[Dict[str, Any]]:
        """필드 검증"""
        warnings = []

        for field_mapping in table_mapping.field_mappings.all():
            source_type = field_mapping.source_field.source_field_type.lower()
            target_type = field_mapping.target_field.field_type.lower()

            # 타입 호환성 체크
            if not self._are_types_compatible(source_type, target_type):
                warnings.append({
                    'source_field': field_mapping.source_field.source_field_name,
                    'target_field': field_mapping.target_field.field_name,
                    'warning': f'Type mismatch: {source_type} vs {target_type}'
                })

        return warnings

    def _check_key_fields_mapped(self, table_mapping) -> bool:
        """키 필드 매핑 확인"""
        key_fields = table_mapping.source_table.field_definitions.filter(is_primary_key=True)
        mapped_keys = table_mapping.field_mappings.filter(
            source_field__in=key_fields,
            is_key_field=True
        )
        return mapped_keys.count() >= key_fields.count()

    def _are_types_compatible(self, source_type: str, target_type: str) -> bool:
        """타입 호환성 확인"""
        source_base = source_type.split('(')[0].lower()
        target_base = target_type.lower()

        compatible: Dict[str, List[str]] = {
            'varchar': ['charfield', 'textfield'],
            'char': ['charfield', 'textfield'],
            'integer': ['integerfield'],
            'int': ['integerfield'],
            'decimal': ['decimalfield'],
            'numeric': ['decimalfield'],
            'float': ['floatfield'],
            'date': ['datefield'],
            'datetime': ['datetimefield'],
            'timestamp': ['datetimefield'],
            'boolean': ['booleanfield'],
            'bool': ['booleanfield'],
        }

        return compatible.get(source_base, []) == [target_base]

    def _save_validation_record(self, table_mapping, results):
        """검증 기록 저장"""
        from erp_sync.models.mapping import ERPMappingValidation

        overall_status = results['structure']['status']

        ERPMappingValidation.objects.create(
            table_mapping=table_mapping,
            validation_type='structure',
            status=overall_status,
            validation_details=results
        )
