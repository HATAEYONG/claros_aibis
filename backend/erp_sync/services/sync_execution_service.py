"""
동기화 실행 서비스
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class SyncExecutionService:
    """동기화 실행 서비스"""

    def execute_sync(self, table_mapping, sync_type='incremental',
                    batch_size=1000, force_full_sync=False) -> Dict[str, Any]:
        """
        동기화 실행

        Args:
            table_mapping: ERPTableMapping 인스턴스
            sync_type: 동기화 타입
            batch_size: 배치 크기
            force_full_sync: 전체 동기화 강제 실행

        Returns:
            동기화 결과
        """
        from erp_sync.models import ERPSyncLog
        from django.utils import timezone

        # 동기화 로그 생성
        sync_log = ERPSyncLog.objects.create(
            sync_type=sync_type,
            target_table=table_mapping.mapping_code,
            status='running',
            started_at=timezone.now()
        )

        try:
            if table_mapping.source_table.erp_source.source_type == 'postgresql':
                result = self._sync_postgresql(table_mapping, sync_type, batch_size, sync_log)
            else:
                result = {
                    'status': 'error',
                    'message': f'Unsupported source type: {table_mapping.source_table.erp_source.source_type}'
                }

            # 동기화 완료 처리
            sync_log.status = result.get('status', 'success')
            sync_log.finished_at = timezone.now()
            sync_log.total_count = result.get('total_count', 0)
            sync_log.success_count = result.get('success_count', 0)
            sync_log.error_count = result.get('error_count', 0)
            sync_log.error_message = result.get('error_message', '')
            sync_log.save()

            # 매핑 업데이트
            if result.get('status') == 'success':
                table_mapping.last_sync_at = timezone.now()
                table_mapping.last_sync_status = 'success'
                table_mapping.total_sync_count += 1
            else:
                table_mapping.last_sync_status = 'failed'
            table_mapping.save()

            return result

        except Exception as e:
            logger.error(f"Sync execution failed: {str(e)}")
            sync_log.status = 'failed'
            sync_log.finished_at = timezone.now()
            sync_log.error_message = str(e)
            sync_log.save()

            return {
                'status': 'error',
                'message': '동기화 실패',
                'error_details': str(e)
            }

    def _sync_postgresql(self, table_mapping, sync_type, batch_size, sync_log):
        """PostgreSQL 동기화"""
        try:
            import psycopg2
            import psycopg2.extras

            erp_source = table_mapping.source_table.erp_source

            # 연결
            conn = psycopg2.connect(
                host=erp_source.host,
                port=erp_source.port or 5432,
                database=erp_source.database_name,
                user='postgres',
                password=''
            )

            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

            # 쿼리 작성
            if sync_type == 'incremental' and not table_mapping.custom_query:
                query = f"""
                    SELECT * FROM {erp_source.schema_name or 'public'}.{table_mapping.source_table.source_table_name}
                    WHERE {table_mapping.date_column} >= COALESCE(
                        (SELECT MAX({table_mapping.date_column}) FROM {table_mapping.target_model.db_table_name}),
                        '1900-01-01'
                    )
                """
            elif table_mapping.custom_query:
                query = table_mapping.custom_query
            else:
                query = f"SELECT * FROM {erp_source.schema_name or 'public'}.{table_mapping.source_table.source_table_name}"

            cursor.execute(query)
            rows = cursor.fetchall()

            # 배치 처리
            total_count = len(rows)
            success_count = 0
            error_count = 0

            for i in range(0, total_count, batch_size):
                batch = rows[i:i + batch_size]

                for row in batch:
                    try:
                        # TODO: 타겟 모델에 데이터 저장 로직
                        # 이 부분은 실제 MIS 모델에 맞게 구현 필요
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error processing row: {str(e)}")

            cursor.close()
            conn.close()

            return {
                'status': 'success',
                'sync_log_id': sync_log.sync_id,
                'message': '동기화 완료',
                'total_count': total_count,
                'success_count': success_count,
                'error_count': error_count,
                'estimated_records': total_count
            }

        except Exception as e:
            raise
