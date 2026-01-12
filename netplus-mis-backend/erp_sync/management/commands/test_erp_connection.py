"""
ERP 데이터베이스 연결 테스트 명령어
사용법: python manage.py test_erp_connection
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'EMAX ERP 데이터베이스 연결을 테스트합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--server',
            type=str,
            help='ERP 서버 주소 (예: 192.168.1.100)',
        )
        parser.add_argument(
            '--database',
            type=str,
            help='ERP 데이터베이스명',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='ERP 사용자명',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='ERP 비밀번호',
        )
        parser.add_argument(
            '--port',
            type=str,
            default='1433',
            help='ERP 포트 (기본값: 1433)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('=' * 60))
        self.stdout.write(self.style.NOTICE('EMAX ERP 데이터베이스 연결 테스트'))
        self.stdout.write(self.style.NOTICE('=' * 60))

        # 1. pyodbc 확인
        self.stdout.write('\n[1] pyodbc 모듈 확인...')
        try:
            import pyodbc
            self.stdout.write(self.style.SUCCESS(f'    pyodbc 버전: {pyodbc.version}'))
        except ImportError:
            self.stdout.write(self.style.ERROR('    pyodbc가 설치되지 않았습니다.'))
            self.stdout.write('    설치: pip install pyodbc')
            return

        # 2. ODBC 드라이버 확인
        self.stdout.write('\n[2] ODBC 드라이버 확인...')
        drivers = pyodbc.drivers()
        sql_drivers = [d for d in drivers if 'SQL Server' in d]

        if sql_drivers:
            for driver in sql_drivers:
                self.stdout.write(self.style.SUCCESS(f'    {driver}'))
        else:
            self.stdout.write(self.style.ERROR('    SQL Server ODBC 드라이버가 없습니다.'))
            self.stdout.write('    다운로드: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server')
            return

        # 3. 연결 정보 수집
        self.stdout.write('\n[3] 연결 정보 확인...')

        server = options.get('server') or os.environ.get('ERP_DB_SERVER', '')
        database = options.get('database') or os.environ.get('ERP_DB_NAME', '')
        user = options.get('user') or os.environ.get('ERP_DB_USER', '')
        password = options.get('password') or os.environ.get('ERP_DB_PASSWORD', '')
        port = options.get('port') or os.environ.get('ERP_DB_PORT', '1433')
        driver = os.environ.get('ERP_DB_DRIVER', 'ODBC Driver 17 for SQL Server')

        self.stdout.write(f'    서버: {server}')
        self.stdout.write(f'    데이터베이스: {database}')
        self.stdout.write(f'    사용자: {user}')
        self.stdout.write(f'    포트: {port}')
        self.stdout.write(f'    드라이버: {driver}')

        if not all([server, database, user, password]):
            self.stdout.write(self.style.WARNING('\n    연결 정보가 불완전합니다.'))
            self.stdout.write('    환경변수를 설정하거나 명령줄 인자를 사용하세요.')
            self.stdout.write('\n    예시:')
            self.stdout.write('    python manage.py test_erp_connection --server=192.168.1.100 --database=EMAX --user=sa --password=xxx')
            return

        # 4. 연결 테스트
        self.stdout.write('\n[4] 데이터베이스 연결 테스트...')

        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            f"TrustServerCertificate=yes;"
        )

        try:
            conn = pyodbc.connect(connection_string, timeout=10)
            self.stdout.write(self.style.SUCCESS('    연결 성공!'))

            # 5. 테이블 확인
            self.stdout.write('\n[5] ERP 테이블 확인...')
            cursor = conn.cursor()

            # 주요 테이블 존재 여부 확인
            test_tables = [
                'SDY100_YH',      # 년제품판매계획
                'SDA500_YH',      # 일일출하계획
                'QMO100',         # 출하검사
                'LCB100',         # 로케이션재고
                'ppc100_counter', # 생산실적
            ]

            for table in test_tables:
                try:
                    cursor.execute(f"SELECT TOP 1 * FROM {table}")
                    row = cursor.fetchone()
                    if row:
                        self.stdout.write(self.style.SUCCESS(f'    {table}: 데이터 있음'))
                    else:
                        self.stdout.write(self.style.WARNING(f'    {table}: 테이블 존재 (데이터 없음)'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'    {table}: 접근 불가 - {str(e)[:50]}'))

            # 6. 전체 테이블 수 확인
            self.stdout.write('\n[6] 데이터베이스 통계...')
            cursor.execute("""
                SELECT COUNT(*) as table_count
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
            """)
            table_count = cursor.fetchone()[0]
            self.stdout.write(f'    전체 테이블 수: {table_count}')

            cursor.close()
            conn.close()

            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('ERP 연결 테스트 완료!'))
            self.stdout.write('=' * 60)

        except pyodbc.Error as e:
            self.stdout.write(self.style.ERROR(f'    연결 실패: {e}'))
            self.stdout.write('\n    확인 사항:')
            self.stdout.write('    - 서버 주소/포트가 올바른지 확인')
            self.stdout.write('    - 방화벽에서 1433 포트가 열려있는지 확인')
            self.stdout.write('    - SQL Server가 TCP/IP 연결을 허용하는지 확인')
            self.stdout.write('    - 사용자 계정에 접근 권한이 있는지 확인')
