# -*- coding: utf-8 -*-
"""
분석 레이어 시드 데이터
KPI 정의 초기화
"""
from django.db import transaction
from .models import KPIDefinition, KRIDefinition
from .kpi_engine import KPIRegistry


def seed_kpi_definitions():
    """KPI 정의 시드 데이터"""
    registry = KPIRegistry.get_all_kpi_definitions()

    created_count = 0
    updated_count = 0
    errors = []

    for kpi_code, kpi_def in registry.items():
        try:
            kpi_obj, created = KPIDefinition.objects.update_or_create(
                kpi_code=kpi_def['code'],
                defaults={
                    'kpi_name': kpi_def['name'],
                    'kpi_name_en': kpi_def['name_en'],
                    'kpi_type': kpi_def['type'],
                    'domain': kpi_def['category'],
                    'description': kpi_def['description'],
                    'aggregation_method': kpi_def['aggregation_method'],
                    'unit': kpi_def['unit'],
                    'target_direction': kpi_def['target_direction'],
                    'calculation_logic': kpi_def['formula'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        except Exception as e:
            errors.append({'kpi_code': kpi_code, 'error': str(e)})

    print(f"KPI 정의 시딩 완료: {created_count}개 생성, {updated_count}개 업데이트")
    if errors:
        print(f"에러: {len(errors)}개")
        for error in errors:
            print(f"  - {error}")

    return created_count, updated_count, errors


def seed_kri_definitions():
    """KRI 정의 시드 데이터"""
    kri_definitions = [
        {
            'kri_code': 'R001',
            'kri_name': '공급처 리스크 지수',
            'kri_name_en': 'Supplier Risk Index',
            'kri_type': 'supply_chain',
            'domain': 'purchase',
            'description': '공급처별 리스크 종합 지수',
            'aggregation_method': 'avg',
            'unit': '점',
            'risk_level_low': 30,
            'risk_level_medium': 60,
            'risk_level_high': 80,
        },
        {
            'kri_code': 'R002',
            'kri_name': '품질 리스크 지수',
            'kri_name_en': 'Quality Risk Index',
            'kri_type': 'quality',
            'domain': 'quality',
            'description': '품질 관련 리스크 지수',
            'aggregation_method': 'avg',
            'unit': '점',
            'risk_level_low': 30,
            'risk_level_medium': 60,
            'risk_level_high': 80,
        },
        {
            'kri_code': 'R003',
            'kri_name': '설비 가용성 리스크',
            'kri_name_en': 'Equipment Availability Risk',
            'kri_type': 'operational',
            'domain': 'production',
            'description': '설비 가용성 관련 리스크',
            'aggregation_method': 'avg',
            'unit': '%',
            'risk_level_low': 90,
            'risk_level_medium': 80,
            'risk_level_high': 70,
        },
        {
            'kri_code': 'R004',
            'kri_name': '재고 부족 리스크',
            'kri_name_en': 'Stockout Risk',
            'kri_type': 'supply_chain',
            'domain': 'purchase',
            'description': '재고 부족 발생 리스크',
            'aggregation_method': 'avg',
            'unit': '%',
            'risk_level_low': 5,
            'risk_level_medium': 10,
            'risk_level_high': 20,
        },
        {
            'kri_code': 'R005',
            'kri_name': '안전사고 리스크',
            'kri_name_en': 'Safety Incident Risk',
            'kri_type': 'safety',
            'domain': 'production',
            'description': '안전사고 발생 리스크',
            'aggregation_method': 'count',
            'unit': '건',
            'risk_level_low': 0,
            'risk_level_medium': 1,
            'risk_level_high': 3,
        },
    ]

    created_count = 0
    updated_count = 0
    errors = []

    for kri_def in kri_definitions:
        try:
            kri_obj, created = KRIDefinition.objects.update_or_create(
                kri_code=kri_def['kri_code'],
                defaults=kri_def
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        except Exception as e:
            errors.append({'kri_code': kri_def['kri_code'], 'error': str(e)})

    print(f"KRI 정의 시딩 완료: {created_count}개 생성, {updated_count}개 업데이트")
    if errors:
        print(f"에러: {len(errors)}개")
        for error in errors:
            print(f"  - {error}")

    return created_count, updated_count, errors


@transaction.atomic
def seed_all_analytics_data():
    """모든 분석 레이어 데이터 시딩"""
    print("분석 레이어 데이터 시딩 시작...")

    kpi_created, kpi_updated, kpi_errors = seed_kpi_definitions()
    kri_created, kri_updated, kri_errors = seed_kri_definitions()

    total = kpi_created + kri_created
    print(f"분석 레이어 데이터 시딩 완료: 총 {total}개 생성")

    return total


if __name__ == '__main__':
    import django
    import os

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    seed_all_analytics_data()
