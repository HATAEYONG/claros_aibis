# -*- coding: utf-8 -*-
"""
데이터 시딩 관리 명령
python manage.py seed_data
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = '마스터 데이터 및 KPI 정의 시딩'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-master',
            action='store_true',
            help='마스터 데이터 시딩 건너뛰기',
        )
        parser.add_argument(
            '--skip-kpi',
            action='store_true',
            help='KPI 정의 시딩 건너뛰기',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='기존 데이터 삭제 후 시딩',
        )

    def handle(self, *args, **options):
        from erp_sync.data_hub.master.seeds import seed_all_master_data
        from erp_sync.data_hub.analytics.seeds import seed_all_analytics_data

        self.stdout.write(self.style.SUCCESS('데이터 시딩 시작...'))

        # 리셋 옵션
        if options.get('reset'):
            self.stdout.write(self.style.WARNING('기존 데이터 삭제...'))
            self.reset_data()

        # 마스터 데이터 시딩
        if not options.get('skip_master'):
            self.stdout.write('마스터 데이터 시딩...')
            try:
                master_count = seed_all_master_data()
                self.stdout.write(
                    self.style.SUCCESS(f'마스터 데이터 시딩 완료: {master_count}개')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'마스터 데이터 시딩 실패: {e}')
                )
        else:
            self.stdout.write('마스터 데이터 시딩 건너뜀')

        # KPI 정의 시딩
        if not options.get('skip_kpi'):
            self.stdout.write('KPI 정의 시딩...')
            try:
                kpi_count = seed_all_analytics_data()
                self.stdout.write(
                    self.style.SUCCESS(f'KPI 정의 시딩 완료: {kpi_count}개')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'KPI 정의 시딩 실패: {e}')
                )
        else:
            self.stdout.write('KPI 정의 시딩 건너뜀')

        self.stdout.write(self.style.SUCCESS('데이터 시딩 완료'))

    def reset_data(self):
        """기존 데이터 삭제"""
        from erp_sync.data_hub.master.models import (
            MasterAccount, MasterWarehouse, MasterProcess, MasterBank
        )
        from erp_sync.data_hub.analytics.models import KPIDefinition, KRIDefinition

        KPIFact = self.get_model('erp_sync', 'KPIFact')
        if KPIFact:
            KPIFact.objects.all().delete()

        KRIFact = self.get_model('erp_sync', 'KRIFact')
        if KRIFact:
            KRIFact.objects.all().delete()

        KPIDefinition.objects.all().delete()
        KRIDefinition.objects.all().delete()

        MasterAccount.objects.all().delete()
        MasterWarehouse.objects.all().delete()
        MasterProcess.objects.all().delete()
        MasterBank.objects.all().delete()

        self.stdout.write(self.style.WARNING('기존 데이터 삭제 완료'))

    @staticmethod
    def get_model(app_label, model_name):
        """모델 동적 가져오기"""
        try:
            from django.apps import apps
            return apps.get_model(app_label, model_name)
        except LookupError:
            return None
