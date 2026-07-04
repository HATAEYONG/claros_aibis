"""
온톨로지 초기 데이터 생성 커맨드
python manage.py init_ontology
"""
from django.core.management.base import BaseCommand
from ontology.models import OntologyCategory, OntologyElement, ERPTableMapping, OntologyRelation


class Command(BaseCommand):
    help = '온톨로지 초기 데이터를 생성합니다.'

    def handle(self, *args, **options):
        self.stdout.write('온톨로지 초기 데이터 생성 시작...')

        # 1. 카테고리 생성
        categories_data = [
            {'code': '6M', 'name': '6M 변경관리', 'name_en': '6M Change Management', 'level': 1, 'sort_order': 1},
            {'code': '4M2E', 'name': '4M2E 제조관리', 'name_en': '4M2E Manufacturing', 'level': 2, 'sort_order': 2},
            {'code': 'COST', 'name': '원가관리', 'name_en': 'Cost Management', 'level': 3, 'sort_order': 3},
            {'code': 'FINANCE', 'name': '재무관리', 'name_en': 'Financial Management', 'level': 4, 'sort_order': 4},
            {'code': 'ESG', 'name': 'ESG 경영', 'name_en': 'ESG Management', 'level': 5, 'sort_order': 5},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = OntologyCategory.objects.update_or_create(
                code=cat_data['code'],
                defaults=cat_data
            )
            categories[cat_data['code']] = cat
            status = '생성' if created else '업데이트'
            self.stdout.write(f"  카테고리 {status}: {cat.name}")

        # 2. 6M 요소 생성
        elements_6m = [
            {'code': 'MAN', 'name_ko': '인력(Man)', 'name_en': 'Man', 'icon': 'UserIcon', 'color': '#3B82F6'},
            {'code': 'MACHINE', 'name_ko': '설비(Machine)', 'name_en': 'Machine', 'icon': 'SettingsIcon', 'color': '#10B981'},
            {'code': 'MATERIAL', 'name_ko': '자재(Material)', 'name_en': 'Material', 'icon': 'PackageIcon', 'color': '#F59E0B'},
            {'code': 'METHOD', 'name_ko': '공법(Method)', 'name_en': 'Method', 'icon': 'ZapIcon', 'color': '#8B5CF6'},
            {'code': 'MEASUREMENT', 'name_ko': '측정(Measurement)', 'name_en': 'Measurement', 'icon': 'ActivityIcon', 'color': '#EC4899'},
            {'code': 'NATURE', 'name_ko': '환경(Mother Nature)', 'name_en': 'Mother Nature', 'icon': 'AlertIcon', 'color': '#6366F1'},
        ]

        elements = {}
        for i, elem_data in enumerate(elements_6m):
            elem, created = OntologyElement.objects.update_or_create(
                category=categories['6M'],
                code=elem_data['code'],
                defaults={**elem_data, 'sort_order': i + 1}
            )
            elements[f"6M_{elem_data['code']}"] = elem

        self.stdout.write(f"  6M 요소 {len(elements_6m)}개 생성/업데이트")

        # 3. 4M2E 요소 생성
        elements_4m2e = [
            {'code': 'MAN', 'name_ko': '인력(Man)', 'name_en': 'Man', 'icon': 'UserIcon', 'color': '#3B82F6'},
            {'code': 'MACHINE', 'name_ko': '설비(Machine)', 'name_en': 'Machine', 'icon': 'SettingsIcon', 'color': '#10B981'},
            {'code': 'MATERIAL', 'name_ko': '자재(Material)', 'name_en': 'Material', 'icon': 'PackageIcon', 'color': '#F59E0B'},
            {'code': 'METHOD', 'name_ko': '공법(Method)', 'name_en': 'Method', 'icon': 'ZapIcon', 'color': '#8B5CF6'},
            {'code': 'ENVIRONMENT', 'name_ko': '환경(Environment)', 'name_en': 'Environment', 'icon': 'AlertIcon', 'color': '#22C55E'},
            {'code': 'ENERGY', 'name_ko': '에너지(Energy)', 'name_en': 'Energy', 'icon': 'BoltIcon', 'color': '#EAB308'},
        ]

        for i, elem_data in enumerate(elements_4m2e):
            elem, created = OntologyElement.objects.update_or_create(
                category=categories['4M2E'],
                code=elem_data['code'],
                defaults={**elem_data, 'sort_order': i + 1}
            )
            elements[f"4M2E_{elem_data['code']}"] = elem

        self.stdout.write(f"  4M2E 요소 {len(elements_4m2e)}개 생성/업데이트")

        # 4. 원가 요소 생성
        elements_cost = [
            {'code': 'MATERIAL_COST', 'name_ko': '재료비', 'name_en': 'Material Cost', 'icon': 'PackageIcon', 'color': '#F59E0B'},
            {'code': 'LABOR_COST', 'name_ko': '노무비', 'name_en': 'Labor Cost', 'icon': 'UserIcon', 'color': '#3B82F6'},
            {'code': 'OVERHEAD', 'name_ko': '제조경비', 'name_en': 'Manufacturing Overhead', 'icon': 'SettingsIcon', 'color': '#10B981'},
            {'code': 'OUTSOURCING', 'name_ko': '외주가공비', 'name_en': 'Outsourcing Cost', 'icon': 'TruckIcon', 'color': '#8B5CF6'},
            {'code': 'ALLOCATION', 'name_ko': '배부비용', 'name_en': 'Allocated Cost', 'icon': 'SplitIcon', 'color': '#EC4899'},
        ]

        for i, elem_data in enumerate(elements_cost):
            elem, created = OntologyElement.objects.update_or_create(
                category=categories['COST'],
                code=elem_data['code'],
                defaults={**elem_data, 'sort_order': i + 1}
            )
            elements[f"COST_{elem_data['code']}"] = elem

        self.stdout.write(f"  원가 요소 {len(elements_cost)}개 생성/업데이트")

        # 5. 재무 요소 생성
        elements_finance = [
            {'code': 'INCOME_STMT', 'name_ko': '손익계산서', 'name_en': 'Income Statement', 'icon': 'FileTextIcon', 'color': '#3B82F6'},
            {'code': 'BALANCE_SHEET', 'name_ko': '재무상태표', 'name_en': 'Balance Sheet', 'icon': 'LayoutIcon', 'color': '#10B981'},
            {'code': 'CASHFLOW', 'name_ko': '현금흐름표', 'name_en': 'Cash Flow Statement', 'icon': 'TrendingUpIcon', 'color': '#F59E0B'},
            {'code': 'MGMT_ACCT', 'name_ko': '관리회계', 'name_en': 'Management Accounting', 'icon': 'PieChartIcon', 'color': '#8B5CF6'},
        ]

        for i, elem_data in enumerate(elements_finance):
            elem, created = OntologyElement.objects.update_or_create(
                category=categories['FINANCE'],
                code=elem_data['code'],
                defaults={**elem_data, 'sort_order': i + 1}
            )
            elements[f"FINANCE_{elem_data['code']}"] = elem

        self.stdout.write(f"  재무 요소 {len(elements_finance)}개 생성/업데이트")

        # 6. ESG 요소 생성
        elements_esg = [
            {'code': 'ENV', 'name_ko': '환경(Environment)', 'name_en': 'Environment', 'icon': 'LeafIcon', 'color': '#22C55E'},
            {'code': 'SOCIAL', 'name_ko': '사회(Social)', 'name_en': 'Social', 'icon': 'UsersIcon', 'color': '#3B82F6'},
            {'code': 'GOVERNANCE', 'name_ko': '지배구조(Governance)', 'name_en': 'Governance', 'icon': 'ShieldIcon', 'color': '#8B5CF6'},
        ]

        for i, elem_data in enumerate(elements_esg):
            elem, created = OntologyElement.objects.update_or_create(
                category=categories['ESG'],
                code=elem_data['code'],
                defaults={**elem_data, 'sort_order': i + 1}
            )
            elements[f"ESG_{elem_data['code']}"] = elem

        self.stdout.write(f"  ESG 요소 {len(elements_esg)}개 생성/업데이트")

        # 7. ERP 테이블 맵핑 생성 (주요 테이블만)
        erp_mappings = [
            # 6M 변경관리
            ('6M_MAN', 'QMM200_YH', '6M변경신청관리-MASTER', '품질'),
            ('6M_MAN', 'HRA100', '사원기본정보', '인사'),
            ('6M_MACHINE', 'FMA100', '설비마스타', '설비'),
            ('6M_MACHINE', 'FMA130', '설비변경이력', '설비'),
            ('6M_MATERIAL', 'DMA100', '품목마스터', '자재'),
            ('6M_METHOD', 'DME100', 'ECO', '제품개발'),
            ('6M_MEASUREMENT', 'QMM100', '수입검사정보', '품질'),

            # 4M2E
            ('4M2E_MAN', 'HRA100', '사원기본정보', '인사'),
            ('4M2E_MAN', 'CAG100', '노무비집계', '회계'),
            ('4M2E_MACHINE', 'FMA100', '설비마스타', '설비'),
            ('4M2E_MACHINE', 'CAG700', '감가상각비집계', '회계'),
            ('4M2E_MATERIAL', 'DMA100', '품목마스터', '자재'),
            ('4M2E_MATERIAL', 'COS220_YH', '원자재 투입집계', '원가'),
            ('4M2E_METHOD', 'PPC100', '생산실적', '생산'),
            ('4M2E_METHOD', 'COS310_YH', '외주실적집계', '원가'),
            ('4M2E_ENVIRONMENT', 'GAW900_Yuhan', '환경비용마스타', '총무'),
            ('4M2E_ENVIRONMENT', 'GAW990_Yuhan', '환경비용처리', '총무'),
            ('4M2E_ENERGY', 'FMP200', '사무동전력배부율', '설비'),
            ('4M2E_ENERGY', 'FMP500', '월품목별전력비', '설비'),

            # 원가
            ('COST_MATERIAL_COST', 'COS400_YH', '원재료비 배부처리', '원가'),
            ('COST_LABOR_COST', 'CAG100', '노무비집계', '회계'),
            ('COST_OVERHEAD', 'COD100', '원가부문별배부결과', '원가'),
            ('COST_OUTSOURCING', 'COS410_YH', '외주가공비 배부처리', '원가'),
            ('COST_ALLOCATION', 'COM100', '품목원가상세', '원가'),

            # 재무
            ('FINANCE_INCOME_STMT', 'ESF100', '재무제표집계', '회계'),
            ('FINANCE_INCOME_STMT', 'ESG100', '사업부별제조원가', '회계'),
            ('FINANCE_BALANCE_SHEET', 'FAB800', '계정-월집계', '회계'),
            ('FINANCE_CASHFLOW', 'FAY800', '현금흐름표과목', '회계'),
            ('FINANCE_MGMT_ACCT', 'FAB100', '전표정보', '회계'),

            # ESG
            ('ESG_ENV', 'GAW990_Yuhan', '환경비용처리', '총무'),
            ('ESG_ENV', 'QMM650', '공급업체환경영향평가', '품질'),
            ('ESG_SOCIAL', 'HRA100', '사원기본정보', '인사'),
            ('ESG_SOCIAL', 'QME200', '교육시행정보', '품질'),
            ('ESG_GOVERNANCE', 'QMM600', '공급업체대장', '품질'),
            ('ESG_GOVERNANCE', 'QMM630', '공급업체평가', '품질'),
        ]

        mapping_count = 0
        for elem_key, table_name, table_desc, module in erp_mappings:
            if elem_key in elements:
                _, created = ERPTableMapping.objects.update_or_create(
                    element=elements[elem_key],
                    table_name=table_name,
                    defaults={
                        'table_description': table_desc,
                        'module': module,
                        'key_columns': [],
                        'link_columns': [],
                    }
                )
                mapping_count += 1

        self.stdout.write(f"  ERP 테이블 맵핑 {mapping_count}개 생성/업데이트")

        # 8. 온톨로지 관계 생성
        relations = [
            # 6M → 4M2E 변환
            ('6M_MAN', '4M2E_MAN', 'TRANSFORM'),
            ('6M_MACHINE', '4M2E_MACHINE', 'TRANSFORM'),
            ('6M_MATERIAL', '4M2E_MATERIAL', 'TRANSFORM'),
            ('6M_METHOD', '4M2E_METHOD', 'TRANSFORM'),
            ('6M_NATURE', '4M2E_ENVIRONMENT', 'TRANSFORM'),

            # 4M2E → 원가 집계
            ('4M2E_MAN', 'COST_LABOR_COST', 'AGGREGATE'),
            ('4M2E_MACHINE', 'COST_OVERHEAD', 'AGGREGATE'),
            ('4M2E_MATERIAL', 'COST_MATERIAL_COST', 'AGGREGATE'),
            ('4M2E_METHOD', 'COST_OUTSOURCING', 'AGGREGATE'),
            ('4M2E_ENVIRONMENT', 'COST_OVERHEAD', 'AGGREGATE'),
            ('4M2E_ENERGY', 'COST_OVERHEAD', 'AGGREGATE'),

            # 원가 → 재무 흐름
            ('COST_MATERIAL_COST', 'FINANCE_INCOME_STMT', 'FLOW'),
            ('COST_LABOR_COST', 'FINANCE_INCOME_STMT', 'FLOW'),
            ('COST_OVERHEAD', 'FINANCE_INCOME_STMT', 'FLOW'),
            ('COST_ALLOCATION', 'FINANCE_MGMT_ACCT', 'CALCULATE'),

            # 재무 → ESG 연계
            ('FINANCE_INCOME_STMT', 'ESG_GOVERNANCE', 'REFERENCE'),
            ('FINANCE_MGMT_ACCT', 'ESG_ENV', 'REFERENCE'),
            ('FINANCE_MGMT_ACCT', 'ESG_SOCIAL', 'REFERENCE'),
        ]

        relation_count = 0
        for source_key, target_key, rel_type in relations:
            if source_key in elements and target_key in elements:
                _, created = OntologyRelation.objects.update_or_create(
                    source_element=elements[source_key],
                    target_element=elements[target_key],
                    relation_type=rel_type,
                    defaults={'description': f'{source_key} → {target_key}'}
                )
                relation_count += 1

        self.stdout.write(f"  온톨로지 관계 {relation_count}개 생성/업데이트")

        self.stdout.write(self.style.SUCCESS('온톨로지 초기 데이터 생성 완료!'))
