# -*- coding: utf-8 -*-
"""
마스터 데이터 시드
기준 데이터 초기화
"""
from django.db import transaction
from .models import (
    MasterAccount, MasterWarehouse, MasterProcess, MasterBank,
    MasterDepartment, MasterEmployee
)


def seed_accounts():
    """계정과목 시드 데이터"""
    accounts = [
        {
            'account_code': '1000',
            'account_name': '유동자산',
            'account_name_en': 'Current Assets',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '유동자산',
            'description': '1년 내에 현금화 가능한 자산',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '1100',
            'account_name': '현금 및 현금성자산',
            'account_name_en': 'Cash and Cash Equivalents',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '유동자산',
            'description': '현금 및 즉시 현금화 가능한 자산',
            'is_consolidated': False,
            'is_tax_related': True,
        },
        {
            'account_code': '1200',
            'account_name': '매출채권',
            'account_name_en': 'Accounts Receivable',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '유동자산',
            'description': '매출로 인한 채권',
            'is_consolidated': False,
            'is_tax_related': True,
        },
        {
            'account_code': '1500',
            'account_name': '재고자산',
            'account_name_en': 'Inventory',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '유동자산',
            'description': '상품, 원재료, 재공품 등 재고',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '2000',
            'account_name': '비유동자산',
            'account_name_en': 'Non-Current Assets',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '비유동자산',
            'description': '1년을 초과하여 보유하는 자산',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '2100',
            'account_name': '유형자산',
            'account_name_en': 'Property, Plant and Equipment',
            'account_type': 'asset',
            'category_l1': '자산',
            'category_l2': '비유동자산',
            'description': '토지, 건물, 기계장치 등',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '3000',
            'account_name': '유동부채',
            'account_name_en': 'Current Liabilities',
            'account_type': 'liability',
            'category_l1': '부채',
            'category_l2': '유동부채',
            'description': '1년 내에 상환해야 할 부채',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '3100',
            'account_name': '매입채무',
            'account_name_en': 'Accounts Payable',
            'account_type': 'liability',
            'category_l1': '부채',
            'category_l2': '유동부채',
            'description': '매입으로 인한 채무',
            'is_consolidated': False,
            'is_tax_related': True,
        },
        {
            'account_code': '4000',
            'account_name': '자본',
            'account_name_en': 'Equity',
            'account_type': 'equity',
            'category_l1': '자본',
            'category_l2': '자본',
            'description': '주주 지분',
            'is_consolidated': True,
            'is_tax_related': True,
        },
        {
            'account_code': '5000',
            'account_name': '매출',
            'account_name_en': 'Sales Revenue',
            'account_type': 'revenue',
            'category_l1': '수익',
            'category_l2': '매출',
            'description': '상품 매출액',
            'is_consolidated': False,
            'is_tax_related': True,
        },
    ]

    created_count = 0
    for account_data in accounts:
        account, created = MasterAccount.objects.get_or_create(
            account_code=account_data['account_code'],
            defaults=account_data
        )
        if created:
            created_count += 1

    return created_count


def seed_warehouses():
    """창고 시드 데이터"""
    warehouses = [
        {
            'warehouse_code': 'WH-RM-01',
            'warehouse_name': '원자재 창고 1',
            'warehouse_name_en': 'Raw Material Warehouse 1',
            'warehouse_type': 'raw_material',
            'plant': 'P1',
            'building': 'B1',
            'floor': '1F',
            'location': '공장 1구역',
            'capacity': 10000,
            'capacity_unit': 'KG',
            'temperature_controlled': False,
        },
        {
            'warehouse_code': 'WH-FG-01',
            'warehouse_name': '완제품 창고 1',
            'warehouse_name_en': 'Finished Goods Warehouse 1',
            'warehouse_type': 'finished_good',
            'plant': 'P1',
            'building': 'B2',
            'floor': '1F',
            'location': '공장 2구역',
            'capacity': 5000,
            'capacity_unit': 'EA',
            'temperature_controlled': False,
        },
        {
            'warehouse_code': 'WH-SF-01',
            'warehouse_name': '반제품 창고 1',
            'warehouse_name_en': 'Semi-Finished Warehouse 1',
            'warehouse_type': 'semi_finished',
            'plant': 'P1',
            'building': 'B1',
            'floor': '2F',
            'location': '공장 1구역',
            'capacity': 3000,
            'capacity_unit': 'EA',
            'temperature_controlled': False,
        },
        {
            'warehouse_code': 'WH-CM-01',
            'warehouse_name': '부품 창고 1',
            'warehouse_name_en': 'Component Warehouse 1',
            'warehouse_type': 'component',
            'plant': 'P1',
            'building': 'B3',
            'floor': '1F',
            'location': '공장 3구역',
            'capacity': 8000,
            'capacity_unit': 'EA',
            'temperature_controlled': True,
            'temperature_min': 18,
            'temperature_max': 25,
        },
        {
            'warehouse_code': 'WH-CP-01',
            'warehouse_name': '소모품 창고 1',
            'warehouse_name_en': 'Consumable Warehouse 1',
            'warehouse_type': 'consumable',
            'plant': 'P1',
            'building': 'B3',
            'floor': '2F',
            'location': '공장 3구역',
            'capacity': 2000,
            'capacity_unit': 'EA',
            'temperature_controlled': False,
        },
    ]

    created_count = 0
    for wh_data in warehouses:
        warehouse, created = MasterWarehouse.objects.get_or_create(
            warehouse_code=wh_data['warehouse_code'],
            defaults=wh_data
        )
        if created:
            created_count += 1

    return created_count


def seed_processes():
    """공정 시드 데이터"""
    processes = [
        {
            'process_code': 'PR-CAST-01',
            'process_name': '주조 공정',
            'process_name_en': 'Casting Process',
            'process_type': 'casting',
            'process_category': '성형',
            'plant': 'P1',
            'line': 'L1',
            'work_center': 'WC-01',
            'standard_cycle_time': 120,
            'standard_setup_time': 30,
            'standard_capacity': 30,
            'quality_standard': '품명-주조-품질표준-001',
            'acceptance_criteria': '규격 내 99% 이상',
        },
        {
            'process_code': 'PR-MAC-01',
            'process_name': '기계 가공 공정',
            'process_name_en': 'Machining Process',
            'process_type': 'machining',
            'process_category': '가공',
            'plant': 'P1',
            'line': 'L1',
            'work_center': 'WC-02',
            'standard_cycle_time': 60,
            'standard_setup_time': 15,
            'standard_capacity': 60,
            'quality_standard': '품명-가공-품질표준-001',
            'acceptance_criteria': '규격 내 98% 이상',
        },
        {
            'process_code': 'PR-FORM-01',
            'process_name': '성형 공정',
            'process_name_en': 'Forming Process',
            'process_type': 'forming',
            'process_category': '성형',
            'plant': 'P1',
            'line': 'L2',
            'work_center': 'WC-03',
            'standard_cycle_time': 45,
            'standard_setup_time': 20,
            'standard_capacity': 80,
            'quality_standard': '품명-성형-품질표준-001',
            'acceptance_criteria': '규격 내 99% 이상',
        },
        {
            'process_code': 'PR-ASM-01',
            'process_name': '조립 공정',
            'process_name_en': 'Assembly Process',
            'process_type': 'assembly',
            'process_category': '조립',
            'plant': 'P1',
            'line': 'L2',
            'work_center': 'WC-04',
            'standard_cycle_time': 90,
            'standard_setup_time': 25,
            'standard_capacity': 40,
            'quality_standard': '품명-조립-품질표준-001',
            'acceptance_criteria': '규격 내 97% 이상',
        },
        {
            'process_code': 'PR-INSP-01',
            'process_name': '검사 공정',
            'process_name_en': 'Inspection Process',
            'process_type': 'inspection',
            'process_category': '검사',
            'plant': 'P1',
            'line': 'L3',
            'work_center': 'WC-05',
            'standard_cycle_time': 15,
            'standard_setup_time': 10,
            'standard_capacity': 200,
            'quality_standard': '품명-검사-품질표준-001',
            'acceptance_criteria': '100% 검사',
        },
        {
            'process_code': 'PR-PACK-01',
            'process_name': '포장 공정',
            'process_name_en': 'Packing Process',
            'process_type': 'packing',
            'process_category': '포장',
            'plant': 'P1',
            'line': 'L3',
            'work_center': 'WC-06',
            'standard_cycle_time': 20,
            'standard_setup_time': 10,
            'standard_capacity': 180,
            'quality_standard': '품명-포장-품질표준-001',
            'acceptance_criteria': '규격 내 99% 이상',
        },
        {
            'process_code': 'PR-HT-01',
            'process_name': '열처리 공정',
            'process_name_en': 'Heat Treatment Process',
            'process_type': 'heat_treatment',
            'process_category': '열처리',
            'plant': 'P1',
            'line': 'L1',
            'work_center': 'WC-07',
            'standard_cycle_time': 180,
            'standard_setup_time': 45,
            'standard_capacity': 20,
            'quality_standard': '품명-열처리-품질표준-001',
            'acceptance_criteria': '경도 기준 충족',
        },
        {
            'process_code': 'PR-ST-01',
            'process_name': '표면처리 공정',
            'process_name_en': 'Surface Treatment Process',
            'process_type': 'surface_treatment',
            'process_category': '표면처리',
            'plant': 'P1',
            'line': 'L1',
            'work_center': 'WC-08',
            'standard_cycle_time': 30,
            'standard_setup_time': 15,
            'standard_capacity': 120,
            'quality_standard': '품명-표면처리-품질표준-001',
            'acceptance_criteria': '규격 내 98% 이상',
        },
    ]

    created_count = 0
    for process_data in processes:
        process, created = MasterProcess.objects.get_or_create(
            process_code=process_data['process_code'],
            defaults=process_data
        )
        if created:
            created_count += 1

    return created_count


def seed_banks():
    """은행 시드 데이터"""
    banks = [
        {
            'bank_code': '004',
            'bank_name': 'KB국민은행',
            'bank_name_en': 'KB Kookmin Bank',
            'bank_type': 'commercial',
            'bank_category': '시중은행',
            'swift_code': 'KOKRSEHT',
            'contact_phone': '1588-9999',
        },
        {
            'bank_code': '020',
            'bank_name': '우리은행',
            'bank_name_en': 'Woori Bank',
            'bank_type': 'commercial',
            'bank_category': '시중은행',
            'swift_code': 'WOFIKRSE',
            'contact_phone': '1588-2100',
        },
        {
            'bank_code': '011',
            'bank_name': 'NH농협은행',
            'bank_name_en': 'NH NongHyup Bank',
            'bank_type': 'specialized',
            'bank_category': '특수은행',
            'swift_code': 'NACFKRSE',
            'contact_phone': '1588-2100',
        },
        {
            'bank_code': '088',
            'bank_name': '신한은행',
            'bank_name_en': 'Shinhan Bank',
            'bank_type': 'commercial',
            'bank_category': '시중은행',
            'swift_code': 'SHBAKRSE',
            'contact_phone': '1588-5000',
        },
        {
            'bank_code': '003',
            'bank_name': '기업은행',
            'bank_name_en': 'Industrial Bank of Korea',
            'bank_type': 'specialized',
            'bank_category': '특수은행',
            'swift_code': 'IBKOKRSE',
            'contact_phone': '1588-8888',
        },
        {
            'bank_code': '090',
            'bank_name': '카카오뱅크',
            'bank_name_en': 'Kakao Bank',
            'bank_type': 'internet',
            'bank_category': '인터넷은행',
            'swift_code': 'KPBOKRSE',
            'contact_phone': '1599-3333',
        },
        {
            'bank_code': '092',
            'bank_name': '토스뱅크',
            'bank_name_en': 'Toss Bank',
            'bank_type': 'internet',
            'bank_category': '인터넷은행',
            'swift_code': 'TSBOKRSE',
            'contact_phone': '1599-9999',
        },
    ]

    created_count = 0
    for bank_data in banks:
        bank, created = MasterBank.objects.get_or_create(
            bank_code=bank_data['bank_code'],
            defaults=bank_data
        )
        if created:
            created_count += 1

    return created_count


@transaction.atomic
def seed_all_master_data():
    """모든 마스터 데이터 시딩"""
    print("마스터 데이터 시딩 시작...")

    accounts_count = seed_accounts()
    print(f"계정과목: {accounts_count}개 생성")

    warehouses_count = seed_warehouses()
    print(f"창고: {warehouses_count}개 생성")

    processes_count = seed_processes()
    print(f"공정: {processes_count}개 생성")

    banks_count = seed_banks()
    print(f"은행: {banks_count}개 생성")

    total = accounts_count + warehouses_count + processes_count + banks_count
    print(f"마스터 데이터 시딩 완료: 총 {total}개 생성")

    return total


if __name__ == '__main__':
    import django
    import os

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    seed_all_master_data()
