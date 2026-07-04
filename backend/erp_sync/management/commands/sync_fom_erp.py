"""
FOM ERP 데이터 동기화 명령어
사용법: python manage.py sync_fom_erp [--table TABLE_NAME] [--days-back N]
"""

from django.core.management.base import BaseCommand
from erp_sync.services import FOMERPSyncService


class Command(BaseCommand):
    help = 'FOM ERP에서 MIS Dashboard로 데이터를 동기화합니다 (MS-SQL -> PostgreSQL)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--table',
            type=str,
            help='동기화할 테이블명 (예: PPC100, INV100). 미지정시 전체 테이블.',
        )
        parser.add_argument(
            '--days-back',
            type=int,
            default=30,
            help='동기화 기간 (일단위, 기본값: 30)',
        )
        parser.add_argument(
            '--priority',
            type=int,
            choices=[1, 2, 3, 4],
            help='우선순위별 동기화 (1: 필수/실시간, 2: 중요/일일, 3: 일반, 4: 확장)',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='동기화 가능한 테이블 목록 표시',
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='동기화 상태 표시',
        )

    def handle(self, *args, **options):
        service = FOMERPSyncService()

        # 테이블 목록 표시
        if options.get('list'):
            self.stdout.write(self.style.NOTICE('=' * 70))
            self.stdout.write(self.style.NOTICE('FOM ERP 동기화 가능한 테이블 목록'))
            self.stdout.write(self.style.NOTICE('=' * 70))

            for table, config in service.TABLE_MAPPINGS.items():
                priority = config['sync_priority']
                priority_label = {1: '실시간', 2: '일일', 3: '주간', 4: '월간'}.get(priority, '')
                self.stdout.write(
                    f'  {table:<10} -> {config["model"]:<25} [우선순위: {priority} ({priority_label})]'
                )
            return

        # 동기화 상태 표시
        if options.get('status'):
            self.stdout.write(self.style.NOTICE('=' * 70))
            self.stdout.write(self.style.NOTICE('FOM ERP 동기화 상태'))
            self.stdout.write(self.style.NOTICE('=' * 70))

            status = service.get_sync_status()
            for table, info in status.items():
                last_sync = info.get('last_sync')
                last_sync_str = last_sync.strftime('%Y-%m-%d %H:%M:%S') if last_sync else '미동기화'
                self.stdout.write(f'  {table:<10} : {last_sync_str}')

                if 'error' in info:
                    self.stdout.write(self.style.WARNING(f'    Error: {info["error"]}'))
            return

        days_back = options.get('days_back', 30)

        self.stdout.write(self.style.NOTICE('=' * 70))
        self.stdout.write(self.style.NOTICE(f'FOM ERP 데이터 동기화 시작 (최근 {days_back}일)'))
        self.stdout.write(self.style.NOTICE('=' * 70))

        try:
            # 특정 테이블 동기화
            if options.get('table'):
                table_name = options['table']
                self.stdout.write(f'\n테이블 동기화: {table_name}')

                result = service.sync_table(table_name, days_back)
                self._print_sync_result(table_name, result)

            # 우선순위별 동기화
            elif options.get('priority'):
                priority = options['priority']
                priority_label = {1: '필수(실시간)', 2: '중요(일일)', 3: '일반', 4: '확장'}.get(priority, '')
                self.stdout.write(f'\n우선순위 {priority} ({priority_label}) 동기화')

                results = service.sync_by_priority(priority, days_back)
                for table, result in results.items():
                    self._print_sync_result(table, result)

            # 전체 동기화
            else:
                self.stdout.write('\n전체 테이블 동기화 (우선순위순)')

                results = service.sync_all(days_back)
                for table, result in results.items():
                    self._print_sync_result(table, result)

            self.stdout.write('\n' + '=' * 70)
            self.stdout.write(self.style.SUCCESS('동기화 완료!'))
            self.stdout.write('=' * 70)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n동기화 실패: {e}'))
            raise

    def _print_sync_result(self, table_name: str, result: dict):
        """동기화 결과 출력"""
        inserted = result.get('inserted', 0)
        updated = result.get('updated', 0)
        failed = result.get('failed', 0)

        if failed > 0:
            style = self.style.ERROR
        elif inserted > 0 or updated > 0:
            style = self.style.SUCCESS
        else:
            style = self.style.NOTICE

        self.stdout.write(
            f'  {table_name:<10}: '
            f'{style(f"+{inserted:>6}, ~{updated:>6}, fail:{failed:>3}")}'
        )
