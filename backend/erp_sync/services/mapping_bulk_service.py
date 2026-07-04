"""
매핑 일괄 처리 서비스
"""

import logging
from typing import Dict, List, Any
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class MappingBulkService:
    """매핑 일괄 처리 서비스"""

    def bulk_create_field_mappings(self, table_mapping_id: int, mappings_data: List[Dict],
                                   auto_match: bool = False) -> Dict[str, Any]:
        """
        필드 매핑 일괄 생성

        Args:
            table_mapping_id: 테이블 매핑 ID
            mappings_data: 매핑 데이터 리스트
            auto_match: 자동 매칭 여부

        Returns:
            생성 결과
        """
        from erp_sync.models import ERPTableMapping, ERPFieldMapping
        from erp_sync.models import ERPFieldDefinition
        from erp_sync.models import ERPTargetField

        table_mapping = ERPTableMapping.objects.get(mapping_id=table_mapping_id)

        created_count = 0
        skipped_count = 0
        errors = []

        if auto_match:
            # 자동 매칭: 필드명 유사도 기반 매칭
            source_fields = ERPFieldDefinition.objects.filter(
                table_definition=table_mapping.source_table
            )
            target_fields = ERPTargetField.objects.filter(
                target_model=table_mapping.target_model
            )

            for source_field in source_fields:
                best_match = None
                best_score = 0

                for target_field in target_fields:
                    score = self._calculate_similarity(
                        source_field.source_field_name,
                        target_field.field_name
                    )

                    if score > best_score and score > 0.6:  # 60% 이상 유사도
                        best_match = target_field
                        best_score = score

                if best_match:
                    try:
                        ERPFieldMapping.objects.get_or_create(
                            table_mapping=table_mapping,
                            source_field=source_field,
                            defaults={
                                'target_field': best_match,
                                'is_key_field': source_field.is_primary_key,
                                'is_required': best_match.is_required,
                                'transform_rule': self._guess_transform_rule(
                                    source_field.source_field_type,
                                    best_match.field_type
                                ),
                                'field_order': source_field.field_position,
                            }
                        )
                        created_count += 1
                    except Exception as e:
                        errors.append({
                            'source_field': source_field.source_field_name,
                            'error': str(e)
                        })
                else:
                    skipped_count += 1

        else:
            # 수동 매핑
            for mapping_data in mappings_data:
                try:
                    source_field = ERPFieldDefinition.objects.get(
                        field_id=mapping_data['source_field_id']
                    )
                    target_field = ERPTargetField.objects.get(
                        target_field_id=mapping_data['target_field_id']
                    )

                    mapping, created = ERPFieldMapping.objects.get_or_create(
                        table_mapping=table_mapping,
                        source_field=source_field,
                        defaults={
                            'target_field': target_field,
                            **mapping_data
                        }
                    )

                    if created:
                        created_count += 1
                    else:
                        skipped_count += 1

                except Exception as e:
                    errors.append({
                        'mapping': mapping_data,
                        'error': str(e)
                    })

        return {
            'status': 'success',
            'created_count': created_count,
            'skipped_count': skipped_count,
            'errors': errors
        }

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """문자열 유사도 계산 (Levenshtein 거리 기반)"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    def _guess_transform_rule(self, source_type: str, target_type: str) -> str:
        """변환 규칙 추측"""
        source_base = source_type.lower().split('(')[0]
        target_base = target_type.lower()

        if source_base == 'varchar' and target_base == 'integerfield':
            return 'decimal_cast'
        elif source_base == 'varchar' and target_base == 'datefield':
            return 'date_format'
        elif source_base == 'varchar' and target_base == 'decimalfield':
            return 'decimal_cast'
        else:
            return 'none'
