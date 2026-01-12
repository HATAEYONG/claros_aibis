"""
온톨로지 서비스 모듈
6M → 4M2E → 원가 → 재무 → ESG 데이터 흐름 분석
"""
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from .models import (
    OntologyCategory,
    OntologyElement,
    ERPTableMapping,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog
)


class OntologyService:
    """온톨로지 기반 데이터 분석 서비스"""

    # 온톨로지 카테고리 순서
    CATEGORY_ORDER = ['6M', '4M2E', 'COST', 'FINANCE', 'ESG']

    @staticmethod
    def get_data_flow_chain(start_category: str = '6M', end_category: str = 'ESG') -> Dict:
        """카테고리 간 데이터 흐름 체인 조회"""
        chain = []
        total_elements = 0
        total_tables = 0

        try:
            start_idx = OntologyService.CATEGORY_ORDER.index(start_category)
            end_idx = OntologyService.CATEGORY_ORDER.index(end_category)
        except ValueError:
            return {
                'start_category': start_category,
                'end_category': end_category,
                'flow_chain': [],
                'total_elements': 0,
                'total_tables': 0,
                'error': 'Invalid category code'
            }

        for i in range(start_idx, end_idx + 1):
            category_code = OntologyService.CATEGORY_ORDER[i]
            try:
                category = OntologyCategory.objects.get(code=category_code)
                elements = OntologyElement.objects.filter(
                    category=category,
                    is_active=True
                ).order_by('sort_order')

                element_list = []
                for elem in elements:
                    tables = ERPTableMapping.objects.filter(
                        element=elem,
                        is_active=True
                    ).values('table_name', 'table_description', 'module')

                    element_list.append({
                        'code': elem.code,
                        'name_ko': elem.name_ko,
                        'name_en': elem.name_en,
                        'icon': elem.icon,
                        'color': elem.color,
                        'table_count': len(tables),
                        'tables': list(tables)
                    })
                    total_tables += len(tables)

                chain.append({
                    'category_code': category.code,
                    'category_name': category.name,
                    'level': category.level,
                    'element_count': len(element_list),
                    'elements': element_list
                })
                total_elements += len(element_list)

            except OntologyCategory.DoesNotExist:
                chain.append({
                    'category_code': category_code,
                    'category_name': category_code,
                    'level': i + 1,
                    'element_count': 0,
                    'elements': []
                })

        return {
            'start_category': start_category,
            'end_category': end_category,
            'flow_chain': chain,
            'total_elements': total_elements,
            'total_tables': total_tables
        }

    @staticmethod
    def get_category_summary() -> List[Dict]:
        """모든 카테고리 요약 정보"""
        summaries = []

        for code in OntologyService.CATEGORY_ORDER:
            try:
                category = OntologyCategory.objects.get(code=code)
                elements = category.elements.filter(is_active=True)

                table_count = 0
                for elem in elements:
                    table_count += elem.erp_tables.filter(is_active=True).count()

                summaries.append({
                    'code': category.code,
                    'name': category.name,
                    'name_en': category.name_en,
                    'level': category.level,
                    'element_count': elements.count(),
                    'table_count': table_count,
                    'is_active': category.is_active
                })
            except OntologyCategory.DoesNotExist:
                summaries.append({
                    'code': code,
                    'name': code,
                    'name_en': code,
                    'level': OntologyService.CATEGORY_ORDER.index(code) + 1,
                    'element_count': 0,
                    'table_count': 0,
                    'is_active': False
                })

        return summaries

    @staticmethod
    def get_4m2e_impact_analysis(target_date: Optional[date] = None) -> Dict:
        """4M2E 요소별 원가 영향도 분석"""
        if target_date is None:
            target_date = date.today()

        # 기본 4M2E 구조
        result = {
            'target_date': target_date.isoformat(),
            'man': {
                'name': '인력(Man)',
                'labor_cost': Decimal('0'),
                'headcount': 0,
                'productivity': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['HRA100', 'CAG100', 'CAE100']
            },
            'machine': {
                'name': '설비(Machine)',
                'depreciation': Decimal('0'),
                'maintenance': Decimal('0'),
                'utilization': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['FMA100', 'CAG700', 'CAG750']
            },
            'material': {
                'name': '자재(Material)',
                'material_cost': Decimal('0'),
                'inventory_value': Decimal('0'),
                'waste_rate': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['DMA100', 'COS220_YH', 'COS400_YH']
            },
            'method': {
                'name': '공법(Method)',
                'outsourcing_cost': Decimal('0'),
                'process_efficiency': Decimal('0'),
                'defect_rate': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['PPC100', 'COS310_YH', 'COS410_YH']
            },
            'environment': {
                'name': '환경(Environment)',
                'env_cost': Decimal('0'),
                'waste_treatment': Decimal('0'),
                'compliance_rate': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['GAW900_Yuhan', 'GAW990_Yuhan', 'QMM650']
            },
            'energy': {
                'name': '에너지(Energy)',
                'power_cost': Decimal('0'),
                'consumption': Decimal('0'),
                'efficiency': Decimal('0'),
                'cost_ratio': Decimal('0'),
                'tables': ['FMP200', 'FMP500']
            },
            'total_cost': Decimal('0')
        }

        # 실제 데이터 조회는 ERP 연동 시 구현
        # 여기서는 시뮬레이션 데이터 생성
        import random

        total = Decimal('0')
        for key in ['man', 'machine', 'material', 'method', 'environment', 'energy']:
            cost = Decimal(str(random.randint(10000000, 100000000)))
            result[key]['cost_ratio'] = cost
            total += cost

        result['total_cost'] = total

        # 비율 계산
        for key in ['man', 'machine', 'material', 'method', 'environment', 'energy']:
            if total > 0:
                result[key]['cost_ratio'] = round(
                    (result[key]['cost_ratio'] / total) * 100, 2
                )

        return result

    @staticmethod
    def trace_cost_to_esg(cost_mon: str) -> Dict:
        """원가 데이터의 ESG 영향 추적"""
        result = {
            'cost_month': cost_mon,
            'environment': {
                'waste_cost': Decimal('0'),
                'energy_cost': Decimal('0'),
                'carbon_emission': Decimal('0'),
                'recycling_rate': Decimal('0'),
                'score': 0,
                'tables': ['GAW990_Yuhan', 'FMP500', 'QMM650']
            },
            'social': {
                'labor_cost': Decimal('0'),
                'training_cost': Decimal('0'),
                'safety_cost': Decimal('0'),
                'employee_count': 0,
                'score': 0,
                'tables': ['HRA100', 'CAG100', 'QME200']
            },
            'governance': {
                'supplier_count': 0,
                'eval_score_avg': Decimal('0'),
                'compliance_rate': Decimal('0'),
                'audit_count': 0,
                'score': 0,
                'tables': ['QMM600', 'QMM630', 'QMM640']
            },
            'esg_score': Decimal('0')
        }

        # 시뮬레이션 데이터
        import random

        result['environment']['score'] = random.randint(70, 95)
        result['social']['score'] = random.randint(70, 95)
        result['governance']['score'] = random.randint(70, 95)

        result['esg_score'] = Decimal(str(round(
            (result['environment']['score'] +
             result['social']['score'] +
             result['governance']['score']) / 3, 1
        )))

        return result

    @staticmethod
    def get_relations_graph() -> Dict:
        """온톨로지 관계 그래프 데이터"""
        nodes = []
        edges = []

        # 노드 생성 (카테고리 + 요소)
        for category in OntologyCategory.objects.filter(is_active=True):
            nodes.append({
                'id': f'cat_{category.code}',
                'label': category.name,
                'type': 'category',
                'level': category.level
            })

            for element in category.elements.filter(is_active=True):
                nodes.append({
                    'id': f'elem_{element.id}',
                    'label': element.name_ko,
                    'type': 'element',
                    'category': category.code,
                    'color': element.color
                })

                # 카테고리-요소 연결
                edges.append({
                    'source': f'cat_{category.code}',
                    'target': f'elem_{element.id}',
                    'type': 'contains'
                })

        # 관계 연결
        for relation in OntologyRelation.objects.filter(is_active=True):
            edges.append({
                'source': f'elem_{relation.source_element.id}',
                'target': f'elem_{relation.target_element.id}',
                'type': relation.relation_type,
                'label': relation.get_relation_type_display()
            })

        return {
            'nodes': nodes,
            'edges': edges,
            'node_count': len(nodes),
            'edge_count': len(edges)
        }

    @staticmethod
    def get_metrics_summary(category_code: Optional[str] = None) -> List[Dict]:
        """데이터 흐름 지표 요약"""
        queryset = DataFlowMetrics.objects.all()

        if category_code:
            queryset = queryset.filter(category__code=category_code)

        # 최근 30일 데이터
        from datetime import timedelta
        thirty_days_ago = date.today() - timedelta(days=30)
        queryset = queryset.filter(metric_date__gte=thirty_days_ago)

        return list(queryset.values(
            'category__code', 'category__name',
            'metric_name', 'metric_value', 'metric_unit',
            'change_rate', 'status', 'metric_date'
        ).order_by('-metric_date', 'category__code'))

    @staticmethod
    def create_analysis_log(
        analysis_type: str,
        start_category: str,
        end_category: str,
        analysis_date: date,
        parameters: Dict = None
    ) -> OntologyAnalysisLog:
        """분석 로그 생성"""
        return OntologyAnalysisLog.objects.create(
            analysis_type=analysis_type,
            start_category=start_category,
            end_category=end_category,
            analysis_date=analysis_date,
            parameters=parameters or {},
            status='PENDING'
        )

    @staticmethod
    def complete_analysis_log(
        log: OntologyAnalysisLog,
        result_summary: Dict,
        record_count: int,
        execution_time_ms: int,
        status: str = 'COMPLETED',
        error_message: str = ''
    ) -> OntologyAnalysisLog:
        """분석 로그 완료 처리"""
        log.result_summary = result_summary
        log.record_count = record_count
        log.execution_time_ms = execution_time_ms
        log.status = status
        log.error_message = error_message
        log.completed_at = timezone.now()
        log.save()
        return log
