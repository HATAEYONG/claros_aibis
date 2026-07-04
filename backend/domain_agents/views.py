# 도메인 에이전트 분석 앱
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import random
from django.db.models import Avg, Sum, Count, F
from django.utils import timezone
from django.db.models.functions import TruncDate, TruncMonth

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def cost_analysis_view(request, analysis_type='cost-structure'):
    """
    원가 분석 API
    - cost-structure: 원가 구조 분석
    - cost-breakdown: 4M2E 코스 분석
    - cost-driver: 코스 드라이버 분석
    - cost-comparison: 원가 비교 분석
    - cost-trends: 원가 추이 분석
    - savings-opportunities: 절감 기회 분석
    """
    period_type = request.GET.get('period_type', 'monthly')

    try:
        if analysis_type == 'cost-structure':
            return get_cost_structure(period_type)
        elif analysis_type == 'cost-breakdown':
            return get_cost_breakdown_4m2e(period_type)
        elif analysis_type == 'cost-driver':
            return get_cost_driver_analysis(period_type)
        elif analysis_type == 'cost-comparison':
            return get_cost_comparison(period_type)
        elif analysis_type == 'cost-trends':
            return get_cost_trends(period_type)
        elif analysis_type == 'savings-opportunities':
            return get_savings_opportunities(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_cost_structure(period_type):
    """원가 구조 분석"""
    # 모의 데이터 (실제로는 DB에서 조회)
    data = {
        'period': '2026년 3월',
        'summary': {
            'total_cost': 500000000,
            'man_cost': 125000000,
            'machine_cost': 95000000,
            'material_cost': 225000000,
            'method_cost': 35000000,
            'environment_cost': 20000000
        },
        'structure': [
            {'category': 'Man', 'amount': 125000000, 'rate': 25.0, 'change': 8.5},
            {'category': 'Machine', 'amount': 95000000, 'rate': 19.0, 'change': -3.2},
            {'category': 'Material', 'amount': 225000000, 'rate': 45.0, 'change': 15.2},
            {'category': 'Method', 'amount': 35000000, 'rate': 7.0, 'change': -2.1},
            {'category': 'Environment', 'amount': 20000000, 'rate': 4.0, 'change': 5.4}
        ],
        'findings': [
            '재료비가 전월 대비 15.2% 상승하여 원가 상승의 주요 원인임',
            '인건비는 8.5% 상승하였으나 원가 비중은 안정적',
            '설비비는 3.2% 감소하여 효율화 성과'
        ],
        'recommendations': [
            {'action': '대체 자재 검토', 'expected_saving': '8-12%', 'priority': 'high'},
            {'action': '생산 효율화 방안 모색', 'expected_saving': '3-5%', 'priority': 'medium'},
            {'action': '에너지 절감 활동 전개', 'expected_saving': '2-3%', 'priority': 'low'}
        ],
        'confidence': 0.89,
        'data_sources': ['ERP 원가 데이터', 'MES 공정 데이터', '구매 관리 시스템'],
        'analysis_type': 'cost_structure'
    }
    return Response(data)


def get_cost_breakdown_4m2e(period_type):
    """4M2E 코스 분석"""
    data = {
        'period': '2026년 3월',
        '4m2e_analysis': {
            'man': {
                'total_cost': 125000000,
                'breakdown': [
                    {'item': '직접 인건비', 'amount': 95000000, 'rate': 76.0},
                    {'item': '간접 인건비', 'amount': 30000000, 'rate': 24.0}
                ],
                'trend': 'increasing',
                'change_rate': 8.5
            },
            'machine': {
                'total_cost': 95000000,
                'breakdown': [
                    {'item': '감가상각비', 'amount': 45000000, 'rate': 47.4},
                    {'item': '수리비', 'amount': 28000000, 'rate': 29.5},
                    {'item': '유지비', 'amount': 22000000, 'rate': 23.1}
                ],
                'trend': 'decreasing',
                'change_rate': -3.2
            },
            'material': {
                'total_cost': 225000000,
                'breakdown': [
                    {'item': '주요 자재', 'amount': 168750000, 'rate': 75.0},
                    {'item': '보조 자재', 'amount': 45000000, 'rate': 20.0},
                    {'item': '소모품', 'amount': 11250000, 'rate': 5.0}
                ],
                'trend': 'increasing',
                'change_rate': 15.2
            },
            'method': {
                'total_cost': 35000000,
                'breakdown': [
                    {'item': '공법 개발비', 'amount': 15000000, 'rate': 42.9},
                    {'item': '공정 최적화비', 'amount': 12000000, 'rate': 34.3},
                    {'item': '기술 지원비', 'amount': 8000000, 'rate': 22.8}
                ],
                'trend': 'decreasing',
                'change_rate': -2.1
            },
            'environment': {
                'total_cost': 20000000,
                'breakdown': [
                    {'item': '전력비', 'amount': 12000000, 'rate': 60.0},
                    {'item': '연료비', 'amount': 5000000, 'rate': 25.0},
                    {'item': '수도비', 'amount': 3000000, 'rate': 15.0}
                ],
                'trend': 'increasing',
                'change_rate': 5.4
            }
        },
        'cost_drivers': [
            {'driver': '생산량', 'impact': 0.35, 'description': '생산량 1% 증가 시 원가 0.35% 감소'},
            {'driver': '자재 단가', 'impact': 0.45, 'description': '자재 단가 1% 상승 시 원가 0.45% 증가'},
            {'driver': '가동률', 'impact': -0.25, 'description': '가동률 1% 증가 시 원가 0.25% 감소'}
        ],
        'confidence': 0.87,
        'data_sources': ['ERP 원가 데이터', 'MES 공정 데이터', '구매 관리 시스템'],
        'analysis_type': 'cost_breakdown'
    }
    return Response(data)


def get_cost_driver_analysis(period_type):
    """코스 드라이버 분석"""
    data = {
        'period': '2026년 1분기',
        'cost_drivers': [
            {
                'driver': '생산량',
                'cost_amount': 175000000,
                'rate': 0.35,
                'trend': 'stable',
                'impact_level': 'high'
            },
            {
                'driver': '작업 시간',
                'cost_amount': 125000000,
                'rate': 0.25,
                'trend': 'increasing',
                'impact_level': 'high'
            },
            {
                'driver': '설비 가동률',
                'cost_amount': 95000000,
                'rate': 0.19,
                'trend': 'decreasing',
                'impact_level': 'medium'
            },
            {
                'driver': '자재 소비율',
                'cost_amount': 75000000,
                'rate': 0.15,
                'trend': 'increasing',
                'impact_level': 'medium'
            },
            {
                'driver': '에너지 소비',
                'cost_amount': 30000000,
                'rate': 0.06,
                'trend': 'stable',
                'impact_level': 'low'
            }
        ],
        'optimization_opportunities': [
            {'driver': '생산량', 'potential': '5-7% 절감', 'action': '생산 일정 최적화'},
            {'driver': '작업 시간', 'potential': '3-5% 절감', 'action': '작업 표준화'},
            {'driver': '설비 가동률', 'potential': '2-3% 절감', 'action': '예방 정비 강화'}
        ],
        'confidence': 0.85,
        'data_sources': ['ERP 원가 데이터', 'MES 공정 데이터'],
        'analysis_type': 'cost_driver'
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def quality_analysis_view(request, analysis_type='defect-rate'):
    """
    품질 분석 API
    - defect-rate: 불량률 분석
    - defect-trends: 불량 추이 분석
    - root-cause: 원인 분석
    - pareto-analysis: 파레토 분석
    - process-capability: 공정 능력 분석
    - quality-cost: 품질 코스트 분석
    """
    period_type = request.GET.get('period_type', 'monthly')

    try:
        if analysis_type == 'defect-rate':
            return get_defect_rate_analysis(period_type)
        elif analysis_type == 'defect-trends':
            return get_defect_trends(period_type)
        elif analysis_type == 'root-cause':
            return get_root_cause_analysis(period_type)
        elif analysis_type == 'pareto-analysis':
            return get_pareto_analysis(period_type)
        elif analysis_type == 'process-capability':
            return get_process_capability(period_type)
        elif analysis_type == 'quality-cost':
            return get_quality_cost(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_defect_rate_analysis(period_type):
    """불량률 분석"""
    data = {
        'period': '2026년 1분기',
        'summary': {
            'total_inspection': 125000,
            'total_defect': 2875,
            'defect_rate': 2.3,
            'target_rate': 2.5,
            'quality_index': 87.5
        },
        'defect_by_type': [
            {'type': '치수 불량', 'count': 1207, 'rate': 42.0, 'trend': 'decreasing', 'change': -0.8},
            {'type': '외관 불량', 'count': 805, 'rate': 28.0, 'trend': 'stable', 'change': 0},
            {'type': '기능 불량', 'count': 863, 'rate': 30.0, 'trend': 'increasing', 'change': 0.5}
        ],
        'defect_by_product': [
            {'product': '제품 A', 'defect_rate': 1.8, 'trend': 'improving'},
            {'product': '제품 B', 'defect_rate': 2.5, 'trend': 'stable'},
            {'product': '제품 C', 'defect_rate': 3.1, 'trend': 'deteriorating'}
        ],
        'root_causes': [
            {'defect': '치수 불량', 'cause': '공구 마모로 인한 정밀도 저하', 'frequency': 42},
            {'defect': '외관 불량', 'cause': '취급 과정에서의 흠집 발생', 'frequency': 28},
            {'defect': '기능 불량', 'cause': '부품 조립 오차 및 토르크 불량', 'frequency': 30}
        ],
        'improvements': [
            {'action': '공구 교체 주기 단축', 'from': '8시간', 'to': '6시간', 'effect': '불량률 0.5%p 감소'},
            {'action': '취급 작업 SOP 개정', 'priority': 'medium', 'effect': '외관 불량 30% 감소'},
            {'action': '조립 공정 자동화', 'investment': '5억원', 'effect': '기능 불량 50% 감소'}
        ],
        'confidence': 0.91,
        'data_sources': ['QMS 품질 데이터', '검사 리포트', '불량 원인 분석 DB'],
        'analysis_type': 'defect_rate'
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def production_analysis_view(request, analysis_type='production-plan'):
    """
    생산 분석 API
    - production-plan: 생산 계획 분석
    - utilization-rate: 가동률 분석
    - oee-analysis: OEE 분석
    - production-capacity: 생산 능력 분석
    - lead-time: 리드타임 분석
    - bottleneck: 병목 공정 분석
    """
    period_type = request.GET.get('period_type', 'monthly')

    try:
        if analysis_type == 'production-plan':
            return get_production_plan_analysis(period_type)
        elif analysis_type == 'utilization-rate':
            return get_utilization_rate(period_type)
        elif analysis_type == 'oee-analysis':
            return get_oee_analysis(period_type)
        elif analysis_type == 'production-capacity':
            return get_production_capacity(period_type)
        elif analysis_type == 'lead-time':
            return get_lead_time(period_type)
        elif analysis_type == 'bottleneck':
            return get_bottleneck_analysis(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_oee_analysis(period_type):
    """OEE 분석"""
    data = {
        'period': '2026년 3월',
        'summary': {
            'oee': 78.5,
            'target_oee': 75.0,
            'achievement': 104.7
        },
        'components': {
            'availability': {
                'current': 82.5,
                'target': 85.0,
                'gap': -2.5,
                'downtime': 17.5,
                'breakdown': [
                    {'cause': '설비 고장', 'time': 8.5, 'rate': 48.6},
                    {'cause': '정비', 'time': 5.0, 'rate': 28.6},
                    {'cause': '자재 부족', 'time': 2.5, 'rate': 14.3},
                    {'cause': '기타', 'time': 1.5, 'rate': 8.5}
                ]
            },
            'performance': {
                'current': 88.3,
                'target': 85.0,
                'gap': 3.3,
                'ideal_cycle_time': 45,
                'actual_cycle_time': 51,
                'speed_loss': 13.3
            },
            'quality': {
                'current': 97.2,
                'target': 96.0,
                'gap': 1.2,
                'defect_rate': 2.8,
                'rework_rate': 1.5
            }
        },
        'trend': [
            {'month': '1월', 'oee': 75.2},
            {'month': '2월', 'oee': 76.8},
            {'month': '3월', 'oee': 78.5}
        ],
        'bottlenecks': [
            {'process': '조립 공정', 'rate': 72.0, 'reason': '설비 노후화', 'impact': 'high'},
            {'process': '검사 공정', 'rate': 68.0, 'reason': '대기 시간 과다', 'impact': 'medium'}
        ],
        'recommendations': [
            {'action': '조립 설비 교체', 'investment': '15억원', 'effect': 'OEE +5%p', 'priority': 'high'},
            {'action': '검사 공정 자동화', 'investment': '5억원', 'effect': '리드타임 -20%', 'priority': 'medium'},
            {'action': '예방 정비 강화', 'cost': '월 2천만원', 'effect': '가동률 +3%p', 'priority': 'low'}
        ],
        'confidence': 0.88,
        'data_sources': ['MES 생산 데이터', '설비 관리 시스템', '생산 계획 시스템'],
        'analysis_type': 'oee_analysis'
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def inventory_analysis_view(request, analysis_type='inventory-level'):
    """
    재고 분석 API
    - inventory-level: 재고 수준 분석
    - turnover-rate: 회전율 분석
    - safety-stock: 안전재고 분석
    - inventory-forecast: 재고 예측
    - abc-analysis: ABC 분석
    """
    period_type = request.GET.get('period_type', 'monthly')

    try:
        if analysis_type == 'inventory-level':
            return get_inventory_level(period_type)
        elif analysis_type == 'turnover-rate':
            return get_turnover_rate(period_type)
        elif analysis_type == 'safety-stock':
            return get_safety_stock(period_type)
        elif analysis_type == 'inventory-forecast':
            return get_inventory_forecast(period_type)
        elif analysis_type == 'abc-analysis':
            return get_abc_analysis(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_abc_analysis(period_type):
    """ABC 분석"""
    data = {
        'period': '2026년 1분기',
        'summary': {
            'total_items': 1813,
            'total_value': 850000000,
            'total_turnover': 4.2
        },
        'abc_categories': [
            {
                'category': 'A',
                'item_count': 156,
                'item_rate': 8.6,
                'total_value': 612000000,
                'value_rate': 72.0,
                'turnover': 6.8,
                'characteristics': '고가치 품목, 집중 관리 필요'
            },
            {
                'category': 'B',
                'item_count': 412,
                'item_rate': 22.7,
                'total_value': 178500000,
                'value_rate': 21.0,
                'turnover': 4.5,
                'characteristics': '중가치 품목, 정기 관리'
            },
            {
                'category': 'C',
                'item_count': 1245,
                'item_rate': 68.7,
                'total_value': 59500000,
                'value_rate': 7.0,
                'turnover': 2.1,
                'characteristics': '저가치 품목, 간소화된 관리'
            }
        ],
        'recommendations': [
            {'category': 'A', 'action': '일일 재고 모니터링', 'effect': '재고 비용 10% 절감'},
            {'category': 'B', 'action': '주간 재고 모니터링', 'effect': '재고 비용 5% 절감'},
            {'category': 'C', 'action': '월간 재고 모니터링', 'effect': '관리 업무 40% 감축'}
        ],
        'confidence': 0.86,
        'data_sources': ['WMS 창고 관리 시스템', '재고 관리 시스템'],
        'analysis_type': 'abc_analysis'
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def finance_analysis_view(request, analysis_type='financial-statements'):
    """
    재무 분석 API
    - financial-statements: 재무 제표 분석
    - budget-management: 예산 관리
    - cash-flow: 현금 흐름 분석
    - profitability: 수익성 분석
    - profit-loss: 손익 분석
    """
    period_type = request.GET.get('period_type', 'quarterly')

    try:
        if analysis_type == 'financial-statements':
            return get_financial_statements(period_type)
        elif analysis_type == 'budget-management':
            return get_budget_management(period_type)
        elif analysis_type == 'cash-flow':
            return get_cash_flow(period_type)
        elif analysis_type == 'profitability':
            return get_profitability(period_type)
        elif analysis_type == 'profit-loss':
            return get_profit_loss(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_profitability(period_type):
    """수익성 분석"""
    data = {
        'period': '2026년 1분기',
        'summary': {
            'revenue': 15800000000,
            'cost_of_sales': 9480000000,
            'gross_profit': 6320000000,
            'gross_margin': 40.0,
            'operating_profit': 1850000000,
            'operating_margin': 11.7,
            'net_profit': 1420000000,
            'net_margin': 9.0
        },
        'profitability_ratios': [
            {'ratio': 'ROE', 'value': 12.5, 'target': 15.0, 'trend': 'improving'},
            {'ratio': 'ROA', 'value': 8.3, 'target': 10.0, 'trend': 'stable'},
            {'ratio': 'ROIC', 'value': 10.2, 'target': 12.0, 'trend': 'improving'}
        ],
        'recommendations': [
            {'action': '영업이익률 개선', 'target': '13% → 15%', 'priority': 'high'},
            {'action': '비재무비용 절감', 'target': '10% 감축', 'priority': 'medium'},
            {'action': 'R&D 투자 확대', 'target': '매출액의 5%', 'priority': 'low'}
        ],
        'confidence': 0.90,
        'data_sources': ['ERP 재무 데이터', '총계정 원장', '결산 재무 제표'],
        'analysis_type': 'profitability'
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def logistics_analysis_view(request, analysis_type='route-optimization'):
    """
    물류 분석 API
    - route-optimization: 배송 경로 최적화
    - logistics-cost: 물류 비용 분석
    - delivery-forecast: 배송 시간 예측
    - warehouse-optimization: 창고 최적화
    """
    period_type = request.GET.get('period_type', 'monthly')

    try:
        if analysis_type == 'route-optimization':
            return get_route_optimization(period_type)
        elif analysis_type == 'logistics-cost':
            return get_logistics_cost(period_type)
        elif analysis_type == 'delivery-forecast':
            return get_delivery_forecast(period_type)
        elif analysis_type == 'warehouse-optimization':
            return get_warehouse_optimization(period_type)
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_logistics_cost(period_type):
    """물류 비용 분석"""
    data = {
        'period': '2026년 3월',
        'summary': {
            'total_logistics_cost': 485000000,
            'logistics_cost_rate': 3.1,
            'target_rate': 3.0,
            'on_time_delivery': 94.5,
            'target_delivery': 95.0
        },
        'cost_breakdown': [
            {'category': '운송비', 'amount': 265000000, 'rate': 54.6},
            {'category': '창고비', 'amount': 125000000, 'rate': 25.8},
            {'category': '관리비', 'amount': 60000000, 'rate': 12.4},
            {'category': '기타', 'amount': 35000000, 'rate': 7.2}
        ],
        'performance_metrics': [
            {'metric': '정시 배송률', 'current': 94.5, 'target': 95.0, 'gap': -0.5},
            {'metric': '평균 배송 시간', 'current': 2.3, 'target': 2.5, 'gap': -0.2, 'unit': '일'},
            {'metric': '차량 가동률', 'current': 68.5, 'target': 75.0, 'gap': -6.5},
            {'metric': '창고 활용률', 'current': 72.0, 'target': 80.0, 'gap': -8.0}
        ],
        'recommendations': [
            {'action': '배송 경로 최적화', 'effect': '물류 비용 8% 절감', 'investment': '3천만원'},
            {'action': '차량 가용률 개선', 'effect': '투입 차량 15% 감축', 'investment': '5천만원'},
            {'action': '창고 레이아웃 개선', 'effect': '작업 효율 20% 향상', 'investment': '1억원'}
        ],
        'confidence': 0.87,
        'data_sources': ['TMS 운송 관리 시스템', 'WMS 창고 관리 시스템', 'GPS 차량 추적'],
        'analysis_type': 'logistics_cost'
    }
    return Response(data)
