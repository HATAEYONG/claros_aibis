"""
연결 설정 테스트 관리 명령
DB 모델 기반 연결 on/off 테스트
"""

from django.core.management.base import BaseCommand
from erp_sync.models import ERPConnectionConfigModel
from erp_sync.services.erp_connection_service import ERPConnectionService


class Command(BaseCommand):
    help = '연결 설정 on/off 테스트'

    def handle(self, *args, **options):
        service = ERPConnectionService()

        # 현재 설정 상태
        self.stdout.write('=== 현재 연결 설정 상태 ===')
        for config in ERPConnectionConfigModel.objects.all():
            status = "활성" if config.is_enabled else "비활성"
            self.stdout.write(f'{config.source_code}: {config.source_name} ({status})')

        # YH 연결 상태
        self.stdout.write('\n=== YH 연결 테스트 ===')
        yh_enabled = service.is_connection_enabled('YH')
        self.stdout.write(f'YH 연결 활성화?: {yh_enabled}')

        if yh_enabled:
            result = service.test_connection('YH')
            status_result = result.get('status')
            msg_result = result.get('message')
            self.stdout.write(f'연결 테스트 결과: {status_result}')
            self.stdout.write(f'메시지: {msg_result}')
        else:
            self.stdout.write(self.style.WARNING('YH 연결이 비활성화되어 있어 테스트를 건너뜁니다'))

        # LOCAL_BACKUP 연결 상태
        self.stdout.write('\n=== LOCAL_BACKUP 연결 테스트 ===')
        local_enabled = service.is_connection_enabled('LOCAL_BACKUP')
        self.stdout.write(f'LOCAL_BACKUP 연결 활성화?: {local_enabled}')

        # 토글 테스트
        self.stdout.write('\n=== 연결 토글 테스트 ===')
        yh_config = ERPConnectionConfigModel.objects.get(source_code='YH')
        original_state = yh_config.is_enabled

        yh_config.is_enabled = not original_state
        yh_config.save()

        toggle_msg = "비활성화" if yh_config.is_enabled else "활성화"
        self.stdout.write(f'YH 연결을 {toggle_msg}했습니다')
        yh_check = service.is_connection_enabled("YH")
        self.stdout.write(f'is_connection_enabled("YH"): {yh_check}')

        # 원상 복구
        yh_config.is_enabled = original_state
        yh_config.save()
        self.stdout.write(f'원상 복구 완료: is_enabled = {yh_config.is_enabled}')

        self.stdout.write(self.style.SUCCESS('\n=== 테스트 완료 ==='))
