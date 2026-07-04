"""
Business Process API Views
O2C (Order to Cash), P2P (Procure to Pay) 프로세스 관리 API
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
from .models import (
    O2CStage, O2CIssue, O2COrder,
    P2PStage, P2PIssue, P2POrder,
    ProcessKPI
)


# Stage display mapping for O2C
O2C_STAGE_DISPLAY = {
    'order_entry': {'name': '주문 접수', 'nameEn': 'Order Entry', 'icon': 'shopping-cart'},
    'production': {'name': '생산', 'nameEn': 'Production', 'icon': 'factory'},
    'delivery': {'name': '배송', 'nameEn': 'Delivery', 'icon': 'truck'},
    'billing': {'name': '청구', 'nameEn': 'Billing', 'icon': 'file-text'},
    'payment': {'name': '입금', 'nameEn': 'Payment Collection', 'icon': 'dollar-sign'},
}

# Stage display mapping for P2P
P2P_STAGE_DISPLAY = {
    'requisition': {'name': '구매 요청', 'nameEn': 'Requisition', 'icon': 'file-text'},
    'quotation': {'name': '견적', 'nameEn': 'Quotation', 'icon': 'file-text'},
    'po_creation': {'name': '발주', 'nameEn': 'Purchase Order', 'icon': 'shopping-cart'},
    'receiving': {'name': '입고', 'nameEn': 'Receiving', 'icon': 'package'},
    'invoice': {'name': '송장', 'nameEn': 'Invoice Processing', 'icon': 'file-text'},
    'payment': {'name': '지급', 'nameEn': 'Payment', 'icon': 'dollar-sign'},
}


@api_view(['GET'])
@permission_classes([AllowAny])
def o2c_stages(request):
    """O2C 프로세스 스테이지 데이터"""
    period_type = request.query_params.get('period_type', 'monthly')

    # 데이터베이스에서 스테이지 조회
    stages_db = O2CStage.objects.filter(period_type=period_type).order_by('order')

    if not stages_db.exists():
        # 데이터가 없으면 모의 데이터 반환
        return _get_o2c_stages_mock(period_type)

    stages = []
    for stage_db in stages_db:
        # 이슈 조회
        issues_db = O2CIssue.objects.filter(stage=stage_db, resolved=False)
        issues = [
            {
                'id': issue.issue_id,
                'type': issue.issue_type,
                'severity': issue.severity,
                'description': issue.description,
                'affectedOrders': issue.affected_orders
            }
            for issue in issues_db
        ]

        # KPI 조회
        kpis_db = ProcessKPI.objects.filter(
            process_type='o2c',
            stage_id=stage_db.stage_id,
            period_value=f'{datetime.now().year}-{datetime.now().month:02d}'
        )
        kpis = [
            {
                'name': kpi.kpi_name,
                'value': kpi.current_value,
                'target': kpi.target_value,
                'unit': kpi.unit,
                'trend': kpi.trend
            }
            for kpi in kpis_db
        ]

        stage_display = O2C_STAGE_DISPLAY.get(stage_db.stage_id, {})

        stages.append({
            'id': stage_db.stage_id,
            'name': stage_display.get('name', stage_db.stage_id),
            'nameEn': stage_display.get('nameEn', stage_db.stage_id),
            'icon': stage_display.get('icon', 'circle'),
            'status': stage_db.status,
            'order': stage_db.order,
            'duration': stage_db.duration,
            'estimatedDuration': stage_db.estimated_duration,
            'volume': stage_db.volume,
            'value': stage_db.value,
            'issues': issues,
            'kpis': kpis
        })

    total_cycle_time = sum(s['duration'] for s in stages)
    total_value = sum(s['value'] for s in stages)
    total_issues = sum(len(s['issues']) for s in stages)

    return Response({
        'period': period_type,
        'stages': stages,
        'summary': {
            'totalCycleTime': total_cycle_time,
            'totalEstimatedTime': sum(s['estimatedDuration'] for s in stages),
            'totalValue': total_value,
            'totalIssues': total_issues,
            'completionRate': len([s for s in stages if s['status'] == 'completed']) / len(stages) * 100 if stages else 0
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def o2c_orders(request):
    """O2C 주문 데이터"""
    stage = request.query_params.get('stage', 'all')
    status = request.query_params.get('status', 'all')

    orders_db = O2COrder.objects.all()

    if stage != 'all':
        orders_db = orders_db.filter(stage=stage)
    if status != 'all':
        orders_db = orders_db.filter(status=status)

    orders = [
        {
            'id': order.order_id,
            'customer': order.customer,
            'product': order.product,
            'quantity': order.quantity,
            'amount': order.amount,
            'stage': order.stage,
            'status': order.status,
            'orderDate': order.order_date.strftime('%Y-%m-%d') if order.order_date else None,
            'promisedDate': order.promised_date.strftime('%Y-%m-%d') if order.promised_date else None,
            'actualDate': order.actual_date.strftime('%Y-%m-%d') if order.actual_date else None,
        }
        for order in orders_db
    ]

    return Response({
        'orders': orders,
        'total': len(orders),
        'totalAmount': sum(o['amount'] for o in orders)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def p2p_stages(request):
    """P2P 프로세스 스테이지 데이터"""
    period_type = request.query_params.get('period_type', 'monthly')

    # 데이터베이스에서 스테이지 조회
    stages_db = P2PStage.objects.filter(period_type=period_type).order_by('order')

    if not stages_db.exists():
        # 데이터가 없으면 모의 데이터 반환
        return _get_p2p_stages_mock(period_type)

    stages = []
    for stage_db in stages_db:
        # 이슈 조회
        issues_db = P2PIssue.objects.filter(stage=stage_db, resolved=False)
        issues = [
            {
                'id': issue.issue_id,
                'type': issue.issue_type,
                'severity': issue.severity,
                'description': issue.description,
                'affectedOrders': issue.affected_orders
            }
            for issue in issues_db
        ]

        # KPI 조회
        kpis_db = ProcessKPI.objects.filter(
            process_type='p2p',
            stage_id=stage_db.stage_id,
            period_value=f'{datetime.now().year}-{datetime.now().month:02d}'
        )
        kpis = [
            {
                'name': kpi.kpi_name,
                'value': kpi.current_value,
                'target': kpi.target_value,
                'unit': kpi.unit,
                'trend': kpi.trend
            }
            for kpi in kpis_db
        ]

        stage_display = P2P_STAGE_DISPLAY.get(stage_db.stage_id, {})

        stages.append({
            'id': stage_db.stage_id,
            'name': stage_display.get('name', stage_db.stage_id),
            'nameEn': stage_display.get('nameEn', stage_db.stage_id),
            'icon': stage_display.get('icon', 'circle'),
            'status': stage_db.status,
            'order': stage_db.order,
            'duration': stage_db.duration,
            'estimatedDuration': stage_db.estimated_duration,
            'volume': stage_db.volume,
            'value': stage_db.value,
            'issues': issues,
            'kpis': kpis
        })

    total_cycle_time = sum(s['duration'] for s in stages)
    total_value = sum(s['value'] for s in stages)
    total_issues = sum(len(s['issues']) for s in stages)

    return Response({
        'period': period_type,
        'stages': stages,
        'summary': {
            'totalCycleTime': total_cycle_time,
            'totalEstimatedTime': sum(s['estimatedDuration'] for s in stages),
            'totalValue': total_value,
            'totalIssues': total_issues,
            'completionRate': len([s for s in stages if s['status'] == 'completed']) / len(stages) * 100 if stages else 0
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def p2p_orders(request):
    """P2P 발주 데이터"""
    stage = request.query_params.get('stage', 'all')
    status = request.query_params.get('status', 'all')

    orders_db = P2POrder.objects.all()

    if stage != 'all':
        orders_db = orders_db.filter(stage=stage)
    if status != 'all':
        orders_db = orders_db.filter(status=status)

    orders = [
        {
            'id': order.order_id,
            'supplier': order.supplier,
            'material': order.material,
            'quantity': order.quantity,
            'amount': order.amount,
            'stage': order.stage,
            'status': order.status,
            'orderDate': order.order_date.strftime('%Y-%m-%d') if order.order_date else None,
            'promisedDate': order.promised_date.strftime('%Y-%m-%d') if order.promised_date else None,
            'actualDate': order.actual_date.strftime('%Y-%m-%d') if order.actual_date else None,
        }
        for order in orders_db
    ]

    return Response({
        'orders': orders,
        'total': len(orders),
        'totalAmount': sum(o['amount'] for o in orders)
    })


# Fallback mock data functions
def _get_o2c_stages_mock(period_type):
    """O2C 모의 데이터 (폴백)"""
    stages = [
        {
            'id': 'order_entry',
            'name': '주문 접수',
            'nameEn': 'Order Entry',
            'icon': 'shopping-cart',
            'status': 'completed',
            'order': 1,
            'duration': 2,
            'estimatedDuration': 4,
            'volume': 245,
            'value': 1250000000,
            'issues': [],
            'kpis': [
                {'name': '주문 처리 시간', 'value': 2, 'target': 4, 'unit': '시간', 'trend': 'down'},
                {'name': '주문 정확률', 'value': 99.2, 'target': 99, 'unit': '%', 'trend': 'up'},
                {'name': '일일 주문량', 'value': 245, 'target': 200, 'unit': '건', 'trend': 'up'}
            ]
        },
        {
            'id': 'production',
            'name': '생산',
            'nameEn': 'Production',
            'icon': 'factory',
            'status': 'in_progress',
            'order': 2,
            'duration': 72,
            'estimatedDuration': 96,
            'volume': 189,
            'value': 980000000,
            'issues': [
                {
                    'id': 'PROD-001',
                    'type': 'delay',
                    'severity': 'medium',
                    'description': '원자재 지연으로 인한 생산 지연',
                    'affectedOrders': 12
                }
            ],
            'kpis': [
                {'name': '생산 리드타임', 'value': 72, 'target': 96, 'unit': '시간', 'trend': 'down'},
                {'name': '설비 가동률', 'value': 87, 'target': 85, 'unit': '%', 'trend': 'up'},
                {'name': '생산 불량률', 'value': 1.8, 'target': 2.5, 'unit': '%', 'trend': 'down'}
            ]
        },
        {
            'id': 'delivery',
            'name': '배송',
            'nameEn': 'Delivery',
            'icon': 'truck',
            'status': 'in_progress',
            'order': 3,
            'duration': 24,
            'estimatedDuration': 48,
            'volume': 156,
            'value': 820000000,
            'issues': [
                {
                    'id': 'DEL-001',
                    'type': 'delay',
                    'severity': 'high',
                    'description': '특정 지역 배송 지연',
                    'affectedOrders': 23
                }
            ],
            'kpis': [
                {'name': '배송 시간', 'value': 24, 'target': 48, 'unit': '시간', 'trend': 'down'},
                {'name': '배송 정확률', 'value': 98.5, 'target': 99, 'unit': '%', 'trend': 'up'},
                {'name': '배송 완료율', 'value': 82, 'target': 90, 'unit': '%', 'trend': 'stable'}
            ]
        },
        {
            'id': 'billing',
            'name': '청구',
            'nameEn': 'Billing',
            'icon': 'file-text',
            'status': 'pending',
            'order': 4,
            'duration': 0,
            'estimatedDuration': 24,
            'volume': 134,
            'value': 710000000,
            'issues': [],
            'kpis': [
                {'name': '청구 처리 시간', 'value': 4, 'target': 24, 'unit': '시간', 'trend': 'down'},
                {'name': '청구 정확률', 'value': 99.8, 'target': 99.5, 'unit': '%', 'trend': 'up'}
            ]
        },
        {
            'id': 'payment',
            'name': '입금',
            'nameEn': 'Payment Collection',
            'icon': 'dollar-sign',
            'status': 'pending',
            'order': 5,
            'duration': 0,
            'estimatedDuration': 168,
            'volume': 98,
            'value': 520000000,
            'issues': [
                {
                    'id': 'PAY-001',
                    'type': 'delay',
                    'severity': 'medium',
                    'description': '장기 연체 고객 증가',
                    'affectedOrders': 15
                }
            ],
            'kpis': [
                {'name': '평균 수금 기간', 'value': 28, 'target': 30, 'unit': '일', 'trend': 'down'},
                {'name': '회수율', 'value': 94.5, 'target': 95, 'unit': '%', 'trend': 'up'}
            ]
        }
    ]

    total_cycle_time = sum(s['duration'] for s in stages)
    total_value = sum(s['value'] for s in stages)
    total_issues = sum(len(s['issues']) for s in stages)

    return Response({
        'period': period_type,
        'stages': stages,
        'summary': {
            'totalCycleTime': total_cycle_time,
            'totalEstimatedTime': sum(s['estimatedDuration'] for s in stages),
            'totalValue': total_value,
            'totalIssues': total_issues,
            'completionRate': len([s for s in stages if s['status'] == 'completed']) / len(stages) * 100
        }
    })


def _get_p2p_stages_mock(period_type):
    """P2P 모의 데이터 (폴백)"""
    stages = [
        {
            'id': 'requisition',
            'name': '구매 요청',
            'nameEn': 'Requisition',
            'icon': 'file-text',
            'status': 'completed',
            'order': 1,
            'duration': 4,
            'estimatedDuration': 8,
            'volume': 189,
            'value': 450000000,
            'issues': [],
            'kpis': [
                {'name': '요청 처리 시간', 'value': 4, 'target': 8, 'unit': '시간', 'trend': 'down'},
                {'name': '요청 승인율', 'value': 95.8, 'target': 95, 'unit': '%', 'trend': 'up'}
            ]
        },
        {
            'id': 'quotation',
            'name': '견적',
            'nameEn': 'Quotation',
            'icon': 'file-text',
            'status': 'completed',
            'order': 2,
            'duration': 24,
            'estimatedDuration': 48,
            'volume': 178,
            'value': 435000000,
            'issues': [
                {
                    'id': 'QUOT-001',
                    'type': 'delay',
                    'severity': 'medium',
                    'description': '일부 공급업체 견적 지연',
                    'affectedOrders': 8
                }
            ],
            'kpis': [
                {'name': '견적 응답 시간', 'value': 24, 'target': 48, 'unit': '시간', 'trend': 'down'},
                {'name': '견적 경쟁률', 'value': 3.2, 'target': 3, 'unit': '개사', 'trend': 'up'}
            ]
        },
        {
            'id': 'po_creation',
            'name': '발주',
            'nameEn': 'Purchase Order',
            'icon': 'shopping-cart',
            'status': 'completed',
            'order': 3,
            'duration': 8,
            'estimatedDuration': 16,
            'volume': 167,
            'value': 420000000,
            'issues': [],
            'kpis': [
                {'name': 'PO 발행 시간', 'value': 8, 'target': 16, 'unit': '시간', 'trend': 'down'},
                {'name': '전자 PO 율', 'value': 92, 'target': 90, 'unit': '%', 'trend': 'up'}
            ]
        },
        {
            'id': 'receiving',
            'name': '입고',
            'nameEn': 'Receiving',
            'icon': 'package',
            'status': 'in_progress',
            'order': 4,
            'duration': 48,
            'estimatedDuration': 72,
            'volume': 134,
            'value': 355000000,
            'issues': [
                {
                    'id': 'REC-001',
                    'type': 'quality',
                    'severity': 'high',
                    'description': '품질 검사 불합격 증가',
                    'affectedOrders': 15
                }
            ],
            'kpis': [
                {'name': '입고 리드타임', 'value': 48, 'target': 72, 'unit': '시간', 'trend': 'down'},
                {'name': '입고 정확률', 'value': 96.8, 'target': 98, 'unit': '%', 'trend': 'down'}
            ]
        },
        {
            'id': 'invoice',
            'name': '송장',
            'nameEn': 'Invoice Processing',
            'icon': 'file-text',
            'status': 'in_progress',
            'order': 5,
            'duration': 16,
            'estimatedDuration': 24,
            'volume': 112,
            'value': 298000000,
            'issues': [],
            'kpis': [
                {'name': '송장 처리 시간', 'value': 16, 'target': 24, 'unit': '시간', 'trend': 'down'},
                {'name': '3-way 매칭율', 'value': 94.5, 'target': 95, 'unit': '%', 'trend': 'up'}
            ]
        },
        {
            'id': 'payment',
            'name': '지급',
            'nameEn': 'Payment',
            'icon': 'dollar-sign',
            'status': 'pending',
            'order': 6,
            'duration': 0,
            'estimatedDuration': 120,
            'volume': 89,
            'value': 237000000,
            'issues': [
                {
                    'id': 'PAY-001',
                    'type': 'delay',
                    'severity': 'medium',
                    'description': '약속 지급일 미준수',
                    'affectedOrders': 18
                }
            ],
            'kpis': [
                {'name': '평균 지급 기간', 'value': 45, 'target': 30, 'unit': '일', 'trend': 'up'},
                {'name': '현금 할인 활용률', 'value': 15, 'target': 20, 'unit': '%', 'trend': 'down'}
            ]
        }
    ]

    total_cycle_time = sum(s['duration'] for s in stages)
    total_value = sum(s['value'] for s in stages)
    total_issues = sum(len(s['issues']) for s in stages)

    return Response({
        'period': period_type,
        'stages': stages,
        'summary': {
            'totalCycleTime': total_cycle_time,
            'totalEstimatedTime': sum(s['estimatedDuration'] for s in stages),
            'totalValue': total_value,
            'totalIssues': total_issues,
            'completionRate': len([s for s in stages if s['status'] == 'completed']) / len(stages) * 100
        }
    })
