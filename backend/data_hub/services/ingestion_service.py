# -*- coding: utf-8 -*-
"""
Ingestion Service - 데이터 수집 서비스
데이터 소스에서 데이터를 수집하여 데이터베이스에 저장
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction

from data_hub.models import DataSource, DataSyncLog
from data_hub.connectors.mssql_connector import MSSQLConnector
from data_hub.connectors.postgresql_connector import PostgreSQLConnector

logger = logging.getLogger(__name__)


class IngestionService:
    """
    데이터 수집 서비스

    데이터 소스에서 데이터를 수집하고 동기화 로그를 관리합니다.
    """

    CONNECTOR_MAP = {
        'mssql': MSSQLConnector,
        'postgresql': PostgreSQLConnector,
    }

    def __init__(self):
        self.connectors = {}

    def sync_data_source(
        self,
        source_id: str,
        sync_type: str = 'full',
        tables: List[str] = None
    ) -> DataSyncLog:
        """
        데이터 소스 동기화

        Args:
            source_id: 데이터 소스 ID
            sync_type: 동기화 타입 (full, incremental, realtime)
            tables: 동기화할 테이블 목록 (None이면 전체)

        Returns:
            DataSyncLog: 동기화 로그
        """
        source = DataSource.objects.get(id=source_id)

        # 동기화 로그 생성
        sync_log = DataSyncLog.objects.create(
            data_source=source,
            status='running',
            sync_type=sync_type
        )

        logger.info(f"[IngestionService] Starting sync for {source.name} (type: {sync_type})")

        try:
            # 커넥터 가져오기
            connector = self._get_connector(source)

            # 연결 테스트
            if not connector.test_connection():
                raise Exception("Connection test failed")

            # 데이터 수집
            tables_to_sync = tables or self._get_tables_to_sync(connector, source)
            tables_synced = []

            total_processed = 0
            total_succeeded = 0
            total_failed = 0

            for table in tables_to_sync:
                try:
                    table_stats = self._sync_table(
                        connector=connector,
                        source=source,
                        table_name=table,
                        sync_type=sync_type
                    )

                    tables_synced.append({
                        'table': table,
                        'processed': table_stats['processed'],
                        'succeeded': table_stats['succeeded'],
                        'failed': table_stats['failed'],
                    })

                    total_processed += table_stats['processed']
                    total_succeeded += table_stats['succeeded']
                    total_failed += table_stats['failed']

                except Exception as e:
                    logger.error(f"Error syncing table {table}: {e}")
                    tables_synced.append({
                        'table': table,
                        'error': str(e),
                    })
                    total_failed += 1

            # 동기화 완료
            sync_log.status = 'success' if total_failed == 0 else 'partial'
            sync_log.completed_at = timezone.now()
            sync_log.records_processed = total_processed
            sync_log.records_succeeded = total_succeeded
            sync_log.records_failed = total_failed
            sync_log.tables_synced = tables_synced
            sync_log.save()

            # 데이터 소스 업데이트
            source.last_sync_at = timezone.now()
            source.last_sync_status = sync_log.status
            source.save()

            logger.info(
                f"[IngestionService] Sync completed for {source.name}: "
                f"{total_succeeded}/{total_processed} succeeded"
            )

        except Exception as e:
            logger.error(f"[IngestionService] Sync failed for {source.name}: {e}")
            sync_log.status = 'failed'
            sync_log.completed_at = timezone.now()
            sync_log.error_message = str(e)
            sync_log.save()

            source.last_sync_status = 'failed'
            source.save()

        return sync_log

    def sync_all_active_sources(self, sync_type: str = 'full') -> List[DataSyncLog]:
        """
        모든 활성 데이터 소스 동기화

        Args:
            sync_type: 동기화 타입

        Returns:
            List[DataSyncLog]: 동기화 로그 목록
        """
        active_sources = DataSource.objects.filter(is_active=True, status='active')
        logs = []

        for source in active_sources:
            try:
                log = self.sync_data_source(str(source.id), sync_type=sync_type)
                logs.append(log)
            except Exception as e:
                logger.error(f"Failed to sync {source.name}: {e}")

        return logs

    def _get_connector(self, source: DataSource):
        """커넥터 인스턴스 가져오기 (캐싱)"""
        connector_key = f"{source.id}"

        if connector_key not in self.connectors:
            connector_class = self.CONNECTOR_MAP.get(source.source_type)
            if not connector_class:
                raise ValueError(f"Unsupported source type: {source.source_type}")

            self.connectors[connector_key] = connector_class(source.connection_params)

        return self.connectors[connector_key]

    def _get_tables_to_sync(self, connector, source: DataSource) -> List[str]:
        """동기화할 테이블 목록 가져오기"""
        try:
            return connector.get_tables()
        except Exception as e:
            logger.error(f"Failed to get tables: {e}")
            return []

    def _sync_table(
        self,
        connector,
        source: DataSource,
        table_name: str,
        sync_type: str
    ) -> Dict[str, int]:
        """
        테이블 동기화

        Args:
            connector: 데이터 소스 커넥터
            source: 데이터 소스
            table_name: 테이블명
            sync_type: 동기화 타입

        Returns:
            Dict: 동기화 통계
        """
        logger.info(f"[IngestionService] Syncing table {table_name}")

        # 테이블 스키마 가져오기
        schema = connector.get_table_schema(table_name)

        # 데이터 가져오기
        batch_size = source.batch_size
        offset = 0
        total_processed = 0
        total_succeeded = 0
        total_failed = 0

        while True:
            # 배치로 데이터 가져오기
            try:
                data = connector.fetch_data(
                    table=table_name,
                    limit=batch_size,
                    order_by='id' if 'id' in schema else None
                )

                if not data:
                    break

                # 데이터 저장
                for record in data:
                    try:
                        self._save_record(source, table_name, record, schema)
                        total_succeeded += 1
                    except Exception as e:
                        logger.error(f"Error saving record: {e}")
                        total_failed += 1

                    total_processed += 1

                offset += batch_size

                # 가져온 데이터가 배치 사이즈보다 적으면 마지막 배치
                if len(data) < batch_size:
                    break

            except Exception as e:
                logger.error(f"Error fetching batch: {e}")
                total_failed += batch_size
                break

        logger.info(
            f"[IngestionService] Table {table_name} sync completed: "
            f"{total_succeeded}/{total_processed} succeeded"
        )

        return {
            'processed': total_processed,
            'succeeded': total_succeeded,
            'failed': total_failed,
        }

    def _save_record(
        self,
        source: DataSource,
        table_name: str,
        record: Dict[str, Any],
        schema: Dict[str, Any]
    ):
        """
        레코드 저장

        Args:
            source: 데이터 소스
            table_name: 테이블명
            record: 레코드 데이터
            schema: 테이블 스키마
        """
        # TODO: 실제 데이터 저장 로직 구현
        # 대상 테이블에 레코드 저장
        # 기존 erp_sync 로직 활용 가능
        pass

    def get_sync_status(self, source_id: str) -> Dict[str, Any]:
        """
        동기화 상태 조회

        Args:
            source_id: 데이터 소스 ID

        Returns:
            Dict: 동기화 상태
        """
        try:
            source = DataSource.objects.get(id=source_id)

            # 최근 동기화 로그
            recent_logs = DataSyncLog.objects.filter(
                data_source=source
            ).order_by('-started_at')[:10]

            return {
                'source_id': str(source.id),
                'source_name': source.name,
                'source_type': source.source_type,
                'is_active': source.is_active,
                'last_sync_at': source.last_sync_at.isoformat() if source.last_sync_at else None,
                'last_sync_status': source.last_sync_status,
                'recent_logs': [
                    {
                        'id': str(log.id),
                        'status': log.status,
                        'started_at': log.started_at.isoformat(),
                        'completed_at': log.completed_at.isoformat() if log.completed_at else None,
                        'records_processed': log.records_processed,
                        'records_succeeded': log.records_succeeded,
                        'records_failed': log.records_failed,
                    }
                    for log in recent_logs
                ],
            }

        except DataSource.DoesNotExist:
            return {'error': 'Data source not found'}


class NormalizationService:
    """
    데이터 정규화 서비스

    수집된 데이터를 정규화합니다.
    """

    def normalize_and_store(
        self,
        source: DataSource,
        data: List[Dict[str, Any]]
    ) -> int:
        """
        데이터 정규화 및 저장

        Args:
            source: 데이터 소스
            data: 원본 데이터

        Returns:
            int: 정규화된 레코드 수
        """
        normalized_count = 0

        for record in data:
            try:
                # 데이터 정규화
                normalized = self._normalize_record(record, source)

                # 저장
                self._store_normalized_record(normalized, source)
                normalized_count += 1

            except Exception as e:
                logger.error(f"Error normalizing record: {e}")

        return normalized_count

    def _normalize_record(
        self,
        record: Dict[str, Any],
        source: DataSource
    ) -> Dict[str, Any]:
        """
        레코드 정규화

        Args:
            record: 원본 레코드
            source: 데이터 소스

        Returns:
            Dict: 정규화된 레코드
        """
        # TODO: 데이터 정규화 로직 구현
        # - 날짜 포맷 통일
        # - 숫자 포맷 통일
        # - NULL 값 처리
        # - 문자열 인코딩 처리
        return record

    def _store_normalized_record(
        self,
        record: Dict[str, Any],
        source: DataSource
    ):
        """
        정규화된 레코드 저장

        Args:
            record: 정규화된 레코드
            source: 데이터 소스
        """
        # TODO: 정규화된 데이터 저장 로직 구현
        pass


class MartService:
    """
    데이터 마트 서비스

    데이터 마트를 관리합니다.
    """

    def build_mart(self, mart_id: str) -> bool:
        """
        데이터 마트 빌드

        Args:
            mart_id: 마트 ID

        Returns:
            bool: 빌드 성공 여부
        """
        try:
            from data_hub.models import DataMart

            mart = DataMart.objects.get(id=mart_id)

            # 의존 마트 먼저 빌드
            for dependency in mart.depends_on.filter(is_active=True):
                if not self.build_mart(str(dependency.id)):
                    logger.warning(f"Failed to build dependency {dependency.name}")

            # 마트 빌드
            logger.info(f"Building mart: {mart.name}")

            # TODO: 실제 마트 빌드 로직 구현
            # - 소스 쿼리 실행
            # - 결과를 대상 테이블에 저장
            # - 갱신 시간 업데이트

            mart.last_refresh_at = timezone.now()
            mart.last_refresh_status = 'success'
            mart.status = 'active'
            mart.save()

            return True

        except DataMart.DoesNotExist:
            logger.error(f"Mart not found: {mart_id}")
            return False
        except Exception as e:
            logger.error(f"Error building mart: {e}")
            return False

    def refresh_all_marts(self, schedule: str = None) -> Dict[str, int]:
        """
        모든 마트 갱신

        Args:
            schedule: 갱신 스케줄 (필터링용)

        Returns:
            Dict: 갱신 결과
        """
        from data_hub.models import DataMart

        marts = DataMart.objects.filter(is_active=True)
        if schedule:
            marts = marts.filter(refresh_schedule=schedule)

        results = {
            'total': marts.count(),
            'succeeded': 0,
            'failed': 0,
        }

        for mart in marts:
            if self.build_mart(str(mart.id)):
                results['succeeded'] += 1
            else:
                results['failed'] += 1

        return results
