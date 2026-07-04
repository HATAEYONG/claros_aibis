# -*- coding: utf-8 -*-
"""
Time Replay Celery Tasks
apps/time_replay/tasks.py

[태스크 목록]
  replay_tick         : 5분마다 실행 → 현재 재생 시점의 과거 데이터 BI 주입
  start_demo_replay   : 데모 원클릭 시작 (세션 생성 + Beat 스케줄 등록)
  stop_demo_replay    : 데모 종료 (세션 상태 변경 + Beat 스케줄 제거)

[실행 방법]
  # 데모 시작 (1년치 → 약 12분 시연)
  from apps.time_replay.tasks import start_demo_replay
  session_id = start_demo_replay.delay(
      source_from       = '2023-01-01T00:00:00',
      source_to         = '2023-12-31T23:59:59',
      speed_factor      = 1440,
      source_date_col   = 'cdt',
      table_mapping_ids = [1, 2, 3],
  ).get()
"""

import json
import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    name='time_replay.tick',
    queue='medium',
    max_retries=3,
    acks_late=True,
    default_retry_delay=60,
)
def replay_tick(self, session_id: int):
    """
    5분마다 실행: 해당 시간대 과거 데이터를 BI에 주입

    [처리 흐름]
      1. 세션 상태 확인 (RUNNING 아니면 스킵)
      2. 재생 종료 조건 확인 (source_date_to 초과)
      3. 각 테이블별 next_chunk 추출 → BI 주입
      4. 세션 진행 상태 갱신
    """
    from .models import ReplaySession
    from .engine import TimeReplayEngine

    try:
        session = ReplaySession.objects.get(id=session_id)
    except ReplaySession.DoesNotExist:
        logger.warning(f"[Replay #{session_id}] 세션 없음 - 스킵")
        return

    if session.status != ReplaySession.Status.RUNNING:
        logger.info(f"[Replay #{session_id}] 상태={session.status} - 스킵")
        return

    # 재생 종료 체크
    current_source = session.get_current_replay_source_time()
    if current_source >= session.source_date_to:
        session.status = ReplaySession.Status.FINISHED
        session.save(update_fields=['status'])
        _cleanup_beat_task(session_id)
        logger.info(f"[Replay #{session_id}] ✅ 재생 완료! 총 {session.total_injected}건 주입")
        return

    engine        = TimeReplayEngine(session)
    total_injected = 0

    for table_config in session.table_configs.select_related('table_mapping').all():
        try:
            records = engine.get_next_chunk(table_config)
            if records:
                count          = engine.inject_to_bi(table_config, records)
                total_injected += count
                logger.info(
                    f"[Replay #{session_id}] "
                    f"{table_config.table_mapping.mapping_code} "
                    f"+{count}건 주입 | "
                    f"과거시점: {table_config.last_replayed_source_time:%Y-%m-%d %H:%M}"
                )
        except Exception as exc:
            logger.error(
                f"[Replay #{session_id}] 테이블 재생 오류 "
                f"({table_config.table_mapping.mapping_code}): {exc}",
                exc_info=True,
            )

    # 세션 진행 상태 갱신
    session.current_source_time = current_source
    session.total_injected     += total_injected
    session.save(update_fields=['current_source_time', 'total_injected'])

    logger.info(
        f"[Replay #{session_id}] Tick 완료 "
        f"| 이번 주입: {total_injected}건 "
        f"| 진행률: {session.progress_pct:.1f}% "
        f"| 남은시간: 약 {session.estimated_finish_minutes:.1f}분"
    )


@shared_task(
    name='time_replay.start_demo',
    queue='high',
)
def start_demo_replay(
    source_from: str,
    source_to: str,
    speed_factor: int = 60,
    source_date_col: str = 'cdt',
    table_mapping_ids: list = None,
) -> dict:
    """
    데모 원클릭 시작

    [권장 speed_factor 설정]
      1개월 데이터 → speed_factor=60   → 약 12분 시연
      3개월 데이터 → speed_factor=360  → 약 12분 시연
      1년  데이터 → speed_factor=1440 → 약 12분 시연 (발표 적합)
      1년  데이터 → speed_factor=240  → 약 1.5시간 시연 (심층 데모)

    Returns:
      {'session_id': int, 'estimated_minutes': float, 'message': str}
    """
    from datetime import datetime
    from erp_sync.models.mapping import ERPTableMapping
    from .models import ReplaySession, ReplayTableConfig

    source_from_dt = datetime.fromisoformat(source_from)
    source_to_dt   = datetime.fromisoformat(source_to)

    # 세션 생성
    session = ReplaySession.objects.create(
        name             = f"데모_{timezone.now():%Y%m%d_%H%M%S}",
        source_date_from = source_from_dt,
        source_date_to   = source_to_dt,
        source_date_col  = source_date_col,
        replay_start_at  = timezone.now(),
        speed_factor     = speed_factor,
        status           = ReplaySession.Status.RUNNING,
    )

    # 대상 테이블 등록
    mappings = ERPTableMapping.objects.filter(
        id__in=table_mapping_ids or [],
        is_active=True,
    )
    for mapping in mappings:
        ReplayTableConfig.objects.create(
            session       = session,
            table_mapping = mapping,
        )

    # Celery Beat에 5분 주기 태스크 동적 등록
    _register_beat_task(session.id)

    total_source_min = (source_to_dt - source_from_dt).total_seconds() / 60
    estimated_min    = total_source_min / speed_factor

    logger.info(
        f"✅ 데모 세션 #{session.id} 시작 "
        f"| {source_from} ~ {source_to} "
        f"| 속도 {speed_factor}x "
        f"| 예상 완료: 약 {estimated_min:.1f}분"
    )

    return {
        'session_id'         : session.id,
        'estimated_minutes'  : round(estimated_min, 1),
        'speed_factor'       : speed_factor,
        'table_count'        : mappings.count(),
        'message'            : (
            f"데모 세션 #{session.id} 시작됨. "
            f"약 {estimated_min:.0f}분 후 완료 예정."
        ),
    }


@shared_task(name='time_replay.stop_demo')
def stop_demo_replay(session_id: int) -> dict:
    """데모 세션 강제 중지"""
    from .models import ReplaySession
    try:
        session        = ReplaySession.objects.get(id=session_id)
        session.status = ReplaySession.Status.PAUSED
        session.save(update_fields=['status'])
        _cleanup_beat_task(session_id)
        return {'session_id': session_id, 'status': 'paused'}
    except ReplaySession.DoesNotExist:
        return {'error': f'세션 #{session_id} 없음'}


# ─────────────────────────────────────────────────────────────
# Beat 스케줄 동적 등록/제거
# ─────────────────────────────────────────────────────────────

def _register_beat_task(session_id: int):
    """Celery Beat에 5분 주기 replay_tick 등록"""
    try:
        from django_celery_beat.models import PeriodicTask, IntervalSchedule

        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=5, period=IntervalSchedule.MINUTES
        )
        PeriodicTask.objects.update_or_create(
            name     = f'replay-session-{session_id}',
            defaults = {
                'interval' : schedule,
                'task'     : 'time_replay.tick',
                'kwargs'   : json.dumps({'session_id': session_id}),
                'enabled'  : True,
            },
        )
        logger.info(f"Beat 태스크 등록 완료: replay-session-{session_id}")
    except Exception as exc:
        logger.error(f"Beat 태스크 등록 실패: {exc}")


def _cleanup_beat_task(session_id: int):
    """재생 완료/중지 후 Beat 태스크 제거"""
    try:
        from django_celery_beat.models import PeriodicTask
        PeriodicTask.objects.filter(
            name=f'replay-session-{session_id}'
        ).delete()
        logger.info(f"Beat 태스크 제거 완료: replay-session-{session_id}")
    except Exception as exc:
        logger.error(f"Beat 태스크 제거 실패: {exc}")
