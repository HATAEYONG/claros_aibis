# -*- coding: utf-8 -*-
"""
시계열 데이터를 오늘(+버퍼)까지 자동 연장하는 관리 명령

사용법:
    python manage.py extend_timeseries
    python manage.py extend_timeseries --dry-run

Celery Beat에서도 이 명령을 그대로 호출한다 (django_celery_beat의
RunPythonCommand 방식 대신, call_command로 감싸는 shared_task를 사용).
"""
from django.core.management.base import BaseCommand

from utils.timeseries_augmentation import extend_all_timeseries, get_target_models


class Command(BaseCommand):
    help = "분석용 집계 시계열 테이블들을 오늘 날짜(+버퍼)까지 자동 연장 생성한다"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제로 저장하지 않고 몇 건이 생성될지만 확인",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        models = get_target_models()
        self.stdout.write(f"대상 모델 {len(models)}개 탐지됨")

        results = extend_all_timeseries(models, dry_run=dry_run)

        total_created = sum(r[1] for r in results)
        for model, count, msg in results:
            if count > 0:
                self.stdout.write(self.style.SUCCESS(f"  {msg}"))
            else:
                self.stdout.write(f"  {msg}")

        self.stdout.write(
            self.style.SUCCESS(
                f"완료: 총 {total_created}건 생성{'(dry-run, 실제 저장 안 함)' if dry_run else ''}"
            )
        )
