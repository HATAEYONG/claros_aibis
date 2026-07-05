"""
연결 설정 테스트 관리 명령
DB 모델 기반 연결 on/off 테스트 (수정판)
"""

from django.core.management.base import BaseCommand
from erp_sync.models import ERPConnectionConfigModel


class Command(BaseCommand):
    help = '연결 설정 on/off 테스트 (수정판)'

    def handle(self, *args, **options):
        # DB 모델 직접 사용 (서비스 레이어 우회)
        self.stdout.write('=== 현재 연결 설정 상태 ===')
        for config in ERPConnectionConfigModel.objects.all():
            status = "활성" if config.is_enabled else "비활성"
            self.stdout.write(f'{config.source_code}: {config.source_name} ({status})')
            can_attempt = config.can_attempt_connection()
            self.stdout.write(f'  - 연결 시도 가능: {can_attempt}')

        # YH 설정 토글 테스트
        self.stdout.write('\n=== 연결 토글 테스트 ===')
        yh_config = ERPConnectionConfigModel.objects.get(source_code='YH')
        original_state = yh_config.is_enabled

        # 비활성화
        yh_config.is_enabled = False
        yh_config.save()
        can_attempt = yh_config.can_attempt_connection()
        self.stdout.write(f'YH 비활성화 후: is_enabled={yh_config.is_enabled}, can_attempt={can_attempt}')

        # 활성화
        yh_config.is_enabled = True
        yh_config.save()
        can_attempt = yh_config.can_attempt_connection()
        self.stdout.write(f'YH 활성화 후: is_enabled={yh_config.is_enabled}, can_attempt={can_attempt}')

        # 원상 복구
        yh_config.is_enabled = original_state
        yh_config.save()

        self.stdout.write(f'\n원상 복구 완료: is_enabled={yh_config.is_enabled}')
        self.stdout.write(self.style.SUCCESS('=== 테스트 완료 ==='))
