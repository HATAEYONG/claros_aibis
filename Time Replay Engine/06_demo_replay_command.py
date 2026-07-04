# -*- coding: utf-8 -*-
"""
데모 시연 관리 커맨드
management/commands/demo_replay.py

[사용법]
  # 데모 시작 (1년치 → 12분 시연)
  python manage.py demo_replay start \
      --from 2023-01-01 --to 2023-12-31 \
      --speed 1440 --mappings 1 2 3

  # 데모 상태 확인
  python manage.py demo_replay status --session 1

  # 데모 중지
  python manage.py demo_replay stop --session 1

  # 모든 세션 목록
  python manage.py demo_replay list
"""

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'ERP 백업 데이터 시간 재생 데모 관리'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['start', 'status', 'stop', 'list'],
            help='실행할 액션'
        )
        parser.add_argument('--from',   dest='date_from', help='과거 데이터 시작일 (YYYY-MM-DD)')
        parser.add_argument('--to',     dest='date_to',   help='과거 데이터 종료일 (YYYY-MM-DD)')
        parser.add_argument('--speed',  type=int, default=60,  help='재생 속도 배수 (기본 60)')
        parser.add_argument('--col',    default='cdt',         help='날짜 기준 컬럼명 (기본 cdt)')
        parser.add_argument('--mappings', nargs='+', type=int, default=[], help='TableMapping ID 목록')
        parser.add_argument('--session', type=int,             help='세션 ID')

    def handle(self, *args, **options):
        action = options['action']

        if action == 'start':
            self._start(options)
        elif action == 'status':
            self._status(options)
        elif action == 'stop':
            self._stop(options)
        elif action == 'list':
            self._list()

    def _start(self, options):
        """데모 시작"""
        from apps.time_replay.tasks import start_demo_replay

        date_from = options.get('date_from')
        date_to   = options.get('date_to')

        if not date_from or not date_to:
            self.stderr.write('❌ --from 과 --to 옵션이 필요합니다.')
            return

        speed    = options['speed']
        mappings = options['mappings']
        col      = options['col']

        self.stdout.write(f'\n🚀 데모 시작 준비 중...')
        self.stdout.write(f'   기간: {date_from} ~ {date_to}')
        self.stdout.write(f'   속도: {speed}x배속')
        self.stdout.write(f'   테이블: {mappings}')

        result = start_demo_replay.delay(
            source_from       = f'{date_from}T00:00:00',
            source_to         = f'{date_to}T23:59:59',
            speed_factor      = speed,
            source_date_col   = col,
            table_mapping_ids = mappings,
        ).get(timeout=30)

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ {result["message"]}\n'
            f'   세션 ID: #{result["session_id"]}\n'
            f'   예상 완료: 약 {result["estimated_minutes"]:.1f}분\n'
            f'\n상태 확인: python manage.py demo_replay status --session {result["session_id"]}'
        ))

    def _status(self, options):
        """세션 상태 확인"""
        from apps.time_replay.models import ReplaySession

        session_id = options.get('session')
        if not session_id:
            self.stderr.write('❌ --session 옵션이 필요합니다.')
            return

        try:
            s = ReplaySession.objects.get(id=session_id)
        except ReplaySession.DoesNotExist:
            self.stderr.write(f'❌ 세션 #{session_id} 없음')
            return

        bar_len = 30
        filled  = int(s.progress_pct / 100 * bar_len)
        bar     = '█' * filled + '░' * (bar_len - filled)

        self.stdout.write(f'\n📊 세션 #{s.id} - {s.name}')
        self.stdout.write(f'   상태    : {s.get_status_display()}')
        self.stdout.write(f'   진행률  : [{bar}] {s.progress_pct:.1f}%')
        self.stdout.write(f'   주입 건수: {s.total_injected:,}건')
        if s.current_source_time:
            self.stdout.write(f'   현재 재생 시점: {s.current_source_time:%Y-%m-%d %H:%M}')
        if s.status == ReplaySession.Status.RUNNING:
            self.stdout.write(f'   남은 시간: 약 {s.estimated_finish_minutes:.1f}분')

    def _stop(self, options):
        """데모 중지"""
        from apps.time_replay.tasks import stop_demo_replay

        session_id = options.get('session')
        if not session_id:
            self.stderr.write('❌ --session 옵션이 필요합니다.')
            return

        result = stop_demo_replay.delay(session_id).get(timeout=10)
        self.stdout.write(self.style.WARNING(f'⏸  세션 #{session_id} 중지됨'))

    def _list(self):
        """모든 세션 목록"""
        from apps.time_replay.models import ReplaySession

        sessions = ReplaySession.objects.order_by('-created_at')[:20]
        if not sessions:
            self.stdout.write('세션 없음')
            return

        self.stdout.write('\n{:<5} {:<25} {:<10} {:<8} {:<12}'.format(
            'ID', '세션명', '상태', '진행률', '주입건수'
        ))
        self.stdout.write('-' * 65)
        for s in sessions:
            self.stdout.write('{:<5} {:<25} {:<10} {:>7.1f}% {:>10,}'.format(
                s.id,
                s.name[:24],
                s.get_status_display(),
                s.progress_pct,
                s.total_injected,
            ))
