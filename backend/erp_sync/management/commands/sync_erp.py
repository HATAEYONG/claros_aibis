"""
ERP 데이터 동기화 명령어
사용법: python manage.py sync_erp [--table TABLE_NAME] [--type full|incremental]
"""

from django.core.management.base import BaseCommand
from erp_sync.services import ERPSyncService


class Command(BaseCommand):
    help = 'SAP ERP에서 MIS Dashboard로 데이터를 동기화합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--table',
            type=str,
            help='동기화할 테이블명 (예: SDY100_YH). 미지정시 전체 테이블.',
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['full', 'incremental'],
            default='incremental',
            help='동기화 유형 (full: 전체, incremental: 증분)',
        )
        parser.add_argument(
            '--priority',
            type=int,
            choices=[1, 2, 3],
            help='우선순위별 동기화 (1: 필수, 2: 중요, 3: 확장)',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='동기화 가능한 테이블 목록 표시',
        )

    def handle(self, *args, **options):
        service = ERPSyncService()

        # 테이블 목록 표시
        if options.get('list'):
            self.stdout.write(self.style.NOTICE('=' * 60))
            self.stdout.write(self.style.NOTICE('동기화 가능한 ERP 테이블 목록'))
            self.stdout.write(self.style.NOTICE('=' * 60))

            for table, config in service.TABLE_MAPPING.items():
                self.stdout.write(f'  {table} -> {config["mis_model"]}')
            return

        sync_type = options.get('type', 'incremental')

        self.stdout.write(self.style.NOTICE('=' * 60))
        self.stdout.write(self.style.NOTICE(f'ERP 데이터 동기화 시작 ({sync_type})'))
        self.stdout.write(self.style.NOTICE('=' * 60))

        try:
            # 특정 테이블 동기화
            if options.get('table'):
                table_name = options['table']
                self.stdout.write(f'\n테이블 동기화: {table_name}')

                log = service.sync_table(table_name, sync_type)
                self._print_sync_result(log)

            # 우선순위별 동기화
            elif options.get('priority'):
                priority = options['priority']
                self.stdout.write(f'\n우선순위 {priority} 동기화')

                logs = service.sync_by_priority(priority)
                for log in logs:
                    self._print_sync_result(log)

            # 전체 동기화
            else:
                self.stdout.write('\n전체 테이블 동기화')

                logs = service.sync_all(sync_type)
                for log in logs:
                    self._print_sync_result(log)

            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('동기화 완료!'))
            self.stdout.write('=' * 60)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n동기화 실패: {e}'))

    def _print_sync_result(self, log):
        """동기화 결과 출력"""
        status_style = {
            'success': self.style.SUCCESS,
            'partial': self.style.WARNING,
            'failed': self.style.ERROR,
            'running': self.style.NOTICE,
        }

        style = status_style.get(log.status, self.style.NOTICE)
        duration = ''
        if log.finished_at and log.started_at:
            delta = log.finished_at - log.started_at
            duration = f' ({delta.seconds}초)'

        self.stdout.write(
            f'  {log.target_table}: '
            f'{style(log.get_status_display())} '
            f'- {log.success_count}/{log.total_count}건 성공'
            f'{duration}'
        )

        if log.error_count > 0:
            self.stdout.write(self.style.WARNING(f'    오류 {log.error_count}건'))
