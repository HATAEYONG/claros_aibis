"""
SQL 덤프 import 관리 명령
로컬 백업 DB를 구축하기 위한 SQL 덤프 import 기능
"""

import os
import time
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.conf import settings
from django.utils import timezone
from erp_sync.models import ERPConnectionConfigModel
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'SQL 덤프 파일을 import하여 로컬 백업 DB를 구축합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dump-file',
            type=str,
            help='SQL 덤프 파일 경로 (필수)',
        )
        parser.add_argument(
            '--source-code',
            type=str,
            default='LOCAL_BACKUP',
            help='생성할 백업 소스 코드 (기본값: LOCAL_BACKUP)',
        )
        parser.add_argument(
            '--source-name',
            type=str,
            default='로컬 백업 DB',
            help='생성할 백업 소스명 (기본값: 로컬 백업 DB)',
        )
        parser.add_argument(
            '--chunk-size',
            type=int,
            default=1000,
            help='배치 처리 크기 (기본값: 1000)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 import 없이 파일만 검증',
        )

    def handle(self, *args, **options):
        dump_file = options.get('dump_file')
        source_code = options.get('source_code')
        source_name = options.get('source_name')
        chunk_size = options.get('chunk_size')
        dry_run = options.get('dry_run')

        # 덤프 파일 경로 확인
        if not dump_file:
            raise CommandError('--dump-file 인자가 필요합니다.')

        if not os.path.exists(dump_file):
            raise CommandError(f'덤프 파일을 찾을 수 없습니다: {dump_file}')

        self.stdout.write(f'=== SQL 덤프 import 시작 ===')
        self.stdout.write(f'덤프 파일: {dump_file}')
        self.stdout.write(f'소스 코드: {source_code}')
        self.stdout.write(f'소스명: {source_name}')
        self.stdout.write(f'청크 크기: {chunk_size}')
        self.stdout.write(f'Dry Run: {dry_run}')

        # 파일 크기 확인
        file_size = os.path.getsize(dump_file)
        self.stdout.write(f'파일 크기: {file_size / (1024*1024):.2f} MB')

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry Run 모드 - 실제 import하지 않습니다'))
            self._validate_dump_file(dump_file)
            return

        # 덤프 파일 파싱 및 import
        start_time = time.time()

        try:
            # DB 타입 확인
            db_vendor = connection.vendor
            self.stdout.write(f'DB 타입: {db_vendor}')

            if db_vendor == 'postgresql':
                self._import_postgresql_dump(dump_file, chunk_size)
            elif db_vendor == 'sqlite':
                self._import_sqlite_dump(dump_file, chunk_size)
            else:
                raise CommandError(f'지원하지 않는 DB 타입: {db_vendor}')

            # 백업 소스 설정 생성
            self._create_backup_source_config(source_code, source_name)

            elapsed_time = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f'=== import 완료 (소요 시간: {elapsed_time:.2f}초) ==='))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'import 실패: {str(e)}'))
            logger.error(f'SQL dump import failed: {str(e)}', exc_info=True)
            raise

    def _validate_dump_file(self, dump_file):
        """덤프 파일 검증"""
        self.stdout.write('덤프 파일 검증 중...')

        try:
            with open(dump_file, 'r', encoding='utf-8') as f:
                # 첫 100줄만 확인
                lines = []
                for i, line in enumerate(f):
                    if i >= 100:
                        break
                    lines.append(line)

                # 기본 SQL 문장 확인
                sql_keywords = ['CREATE', 'INSERT', 'UPDATE', 'DELETE', 'ALTER']
                found_keywords = []
                for line in lines:
                    for keyword in sql_keywords:
                        if keyword in line.upper():
                            found_keywords.append(keyword)
                            break

                self.stdout.write(f'발견된 SQL 키워드: {", ".join(set(found_keywords))}')

            self.stdout.write(self.style.SUCCESS('덤프 파일 검증 완료'))

        except Exception as e:
            raise CommandError(f'덤프 파일 검증 실패: {str(e)}')

    def _import_postgresql_dump(self, dump_file, chunk_size):
        """PostgreSQL 덤프 import"""
        self.stdout.write('PostgreSQL 덤프 import 시작...')

        # pg_restore 사용 가능한지 확인
        import subprocess

        try:
            # 환경 변수에서 DB 연결 정보 가져오기
            db_name = settings.DATABASES['default']['NAME']
            db_user = settings.DATABASES['default']['USER']
            db_host = settings.DATABASES['default']['HOST']
            db_port = settings.DATABASES['default'].get('PORT', '5432')

            self.stdout.write(f'타겟 DB: {db_name}@{db_host}:{db_port}')

            # 방법 1: psql 사용 (권장)
            if self._check_command(['psql', '--version']):
                self.stdout.write('psql 사용하여 import...')

                psql_cmd = [
                    'psql',
                    f'-h{db_host}',
                    f'-p{db_port}',
                    f'-U{db_user}',
                    f'-d{db_name}',
                    '-f', dump_file
                ]

                env = os.environ.copy()
                env['PGPASSWORD'] = settings.DATABASES['default'].get('PASSWORD', '')

                result = subprocess.run(
                    psql_cmd,
                    env=env,
                    capture_output=True,
                    text=True
                )

                if result.returncode != 0:
                    self.stdout.write(self.style.WARNING(f'psql 실행 중 경고/오류 발생'))
                    self.stdout.write(result.stderr)

                self.stdout.write(self.style.SUCCESS('psql import 완료'))

            # 방법 2: Python으로 직접 실행 (대안)
            else:
                self.stdout.write('psql을 찾을 수 없어 Python으로 직접 import...')
                self._execute_sql_file(dump_file, chunk_size)

        except Exception as e:
            raise CommandError(f'PostgreSQL import 실패: {str(e)}')

    def _import_sqlite_dump(self, dump_file, chunk_size):
        """SQLite 덤프 import"""
        self.stdout.write('SQLite 덤프 import 시작...')

        try:
            self._execute_sql_file(dump_file, chunk_size)
            self.stdout.write(self.style.SUCCESS('SQLite import 완료'))

        except Exception as e:
            raise CommandError(f'SQLite import 실패: {str(e)}')

    def _execute_sql_file(self, dump_file, chunk_size):
        """SQL 파일 직접 실행"""
        self.stdout.write('SQL 파일 직접 실행...')

        total_statements = 0
        executed_statements = 0
        current_statement = []
        statement_count = 0

        with open(dump_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()

                # 주석 및 빈 줄 무시
                if not line or line.startswith('--'):
                    continue

                current_statement.append(line)

                # 문장 끝 확인 (;)
                if line.endswith(';'):
                    full_statement = ' '.join(current_statement)

                    # 실행
                    try:
                        with connection.cursor() as cursor:
                            cursor.execute(full_statement)
                            executed_statements += 1

                        statement_count += 1

                        # 진행률 표시
                        if statement_count % chunk_size == 0:
                            self.stdout.write(f'진행률: {executed_statements} 문장 실행 완료')

                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'문장 실행 실패 (무시): {str(e)[:100]}'))
                        logger.warning(f'Failed to execute SQL statement: {str(e)}')

                    total_statements += 1
                    current_statement = []

        self.stdout.write(f'총 {total_statements}개 문장 중 {executed_statements}개 실행 완료')

    def _create_backup_source_config(self, source_code, source_name):
        """백업 소스 설정 생성"""
        self.stdout.write('백업 소스 설정 생성...')

        try:
            # 기존 설정 확인
            existing = ERPConnectionConfigModel.objects.filter(
                source_code=source_code
            ).first()

            if existing:
                self.stdout.write(f'기존 설정 존재: {existing.source_name}')
                existing.source_name = source_name
                existing.is_enabled = True  # 백업은 항상 활성화
                existing.save()
                self.stdout.write(self.style.SUCCESS('기존 설정 업데이트 완료'))
            else:
                # 새 설정 생성
                config = ERPConnectionConfigModel.objects.create(
                    source_code=source_code,
                    source_name=source_name,
                    source_type='postgresql',  # 또는 현재 DB 타입
                    is_enabled=True,
                    use_fallback=False,  # 백업 자체는 폴백 필요 없음
                    description='로컬 백업 DB (SQL 덤프 import로 생성)'
                )
                self.stdout.write(self.style.SUCCESS(f'새 설정 생성: {config.source_name}'))

        except Exception as e:
            raise CommandError(f'백업 소스 설정 생성 실패: {str(e)}')

    def _check_command(self, command):
        """명령어 존재 확인"""
        import subprocess
        try:
            subprocess.run(command, capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
