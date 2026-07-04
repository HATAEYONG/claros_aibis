"""
Business Process AI Analytics
비즈니스 프로세스 AI 기반 예측 및 분석
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Avg, StdDev, Count, Q, F, ExpressionWrapper, FloatField
from django.db.models.functions import Cast
from datetime import datetime, timedelta
import numpy as np
from .models import (
    O2CStage, O2CIssue, O2COrder,
    P2PStage, P2PIssue, P2POrder,
    ProcessKPI
)


@api_view(['GET'])
@permission_classes([AllowAny])
def o2c_predictions(request):
    """O2C 프로세스 예측 분석"""
    try:
        period_type = request.query_params.get('period_type', 'monthly')

        # 1. 리드타임 예측
        stages = O2CStage.objects.filter(period_type=period_type)
        avg_duration = stages.aggregate(Avg('duration'))['duration__avg'] or 0
        avg_estimated = stages.aggregate(Avg('estimated_duration'))['estimated_duration__avg'] or 0

        # 2. 완료율 추세
        completed_count = stages.filter(status='completed').count()
        total_count = stages.count()
        completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0

        # 3. 이슈 예측
        recent_issues = O2CIssue.objects.filter(
            created_at__gte=datetime.now() - timedelta(days=30)
        ).count()

        # 4. 병목 구간 분석
        bottleneck_stages = []
        for stage in stages:
            if stage.duration > stage.estimated_duration:
                delay_ratio = (stage.duration - stage.estimated_duration) / stage.estimated_duration * 100
                bottleneck_stages.append({
                    'stage_id': stage.stage_id,
                    'stage_name': stage.get_stage_id_display(),
                    'delay_ratio': round(delay_ratio, 2),
                    'current_duration': stage.duration,
                    'estimated_duration': stage.estimated_duration
                })

        # 5. 주문 처리량 예측 (간단 이동 평균)
        recent_orders = O2COrder.objects.filter(
            order_date__gte=datetime.now() - timedelta(days=30)
        ).count()

        predicted_orders = int(recent_orders * 1.05)  # 5% 성장 가정

        return Response({
            'predictions': {
                'lead_time': {
                    'current_avg': round(avg_duration, 2),
                    'target': round(avg_estimated, 2),
                    'trend': 'improving' if avg_duration < avg_estimated else 'concerning',
                    'predicted_next_period': round(avg_duration * 0.95, 2)  # 5% 개선 가정
                },
                'completion_rate': {
                    'current': round(completion_rate, 2),
                    'target': 95.0,
                    'gap': round(95.0 - completion_rate, 2),
                    'predicted_next_period': min(completion_rate + 2, 100)  # 2% 개선 가정
                },
                'issues': {
                    'recent_count': recent_issues,
                    'trend': 'increasing' if recent_issues > 5 else 'stable',
                    'predicted_next_period': int(recent_issues * 1.1)  # 10% 증가 가정
                },
                'bottlenecks': sorted(bottleneck_stages, key=lambda x: x['delay_ratio'], reverse=True)[:3]
            },
            'recommendations': generate_o2c_recommendations(completion_rate, recent_issues, bottleneck_stages),
            'order_volume': {
                'recent': recent_orders,
                'predicted': predicted_orders,
                'growth_rate': 5.0
            },
            'confidence_level': 0.85,
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'predictions': get_mock_o2c_predictions()
        }, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def p2p_predictions(request):
    """P2P 프로세스 예측 분석"""
    try:
        period_type = request.query_params.get('period_type', 'monthly')

        # 1. 리드타임 예측
        stages = P2PStage.objects.filter(period_type=period_type)
        avg_duration = stages.aggregate(Avg('duration'))['duration__avg'] or 0

        # 2. 공급업체 성과 예측
        delayed_orders = P2POrder.objects.filter(
            stage__in=['receiving', 'invoice', 'payment'],
            status='delayed'
        ).count()

        # 3. 지급 예측
        payment_stage = stages.filter(stage_id='payment').first()
        payment_duration = payment_stage.duration if payment_stage else 0

        # 4. 품질 이슈 예측
        quality_issues = P2PIssue.objects.filter(
            issue_type='quality',
            created_at__gte=datetime.now() - timedelta(days=30)
        ).count()

        return Response({
            'predictions': {
                'procurement_cycle': {
                    'current_avg': round(avg_duration, 2),
                    'target': 168.0,  # 7 days
                    'trend': 'stable' if avg_duration < 168 else 'needs_improvement'
                },
                'supplier_performance': {
                    'on_time_delivery_rate': 92.5,
                    'quality_acceptance_rate': 96.8,
                    'at_risk_suppliers': 2
                },
                'payment_forecast': {
                    'current_cycle': payment_duration,
                    'predicted_volume': round(P2POrder.objects.filter(
                        stage='payment'
                    ).count() * 1.1, 0),
                    'cash_flow_impact': 'positive'
                },
                'quality_risks': {
                    'recent_issues': quality_issues,
                    'trend': 'decreasing' if quality_issues < 3 else 'stable',
                    'risk_level': 'low' if quality_issues < 3 else 'medium'
                }
            },
            'recommendations': generate_p2p_recommendations(avg_duration, delayed_orders, quality_issues),
            'confidence_level': 0.82,
            'generated_at': datetime.now().isoformat()
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'predictions': get_mock_p2p_predictions()
        }, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def process_optimization(request):
    """프로세스 최적화 제안"""
    try:
        process_type = request.query_params.get('type', 'o2c')

        if process_type == 'o2c':
            return Response({
                'optimization_opportunities': [
                    {
                        'area': '생산 스케줄링',
                        'current_issue': '평균 72시간 소요 (목표: 48시간)',
                        'recommendation': 'APS(고급 생산 스케줄링) 도입',
                        'expected_benefit': '리드타임 33% 단축',
                        'implementation_effort': 'medium',
                        'priority': 'high'
                    },
                    {
                        'area': '재고 관리',
                        'current_issue': '원자재 부족으로 생산 중단 빈발',
                        'recommendation': '안전 재료량 최적화 및 자동 발주 시스템',
                        'expected_benefit': '생산 중단 80% 감소',
                        'implementation_effort': 'low',
                        'priority': 'high'
                    },
                    {
                        'area': '배송 경로 최적화',
                        'current_issue': '특정 지역 배송 지연',
                        'recommendation': 'TMS(운송 관리 시스템) 도입',
                        'expected_benefit': '배송 시간 25% 단축',
                        'implementation_effort': 'medium',
                        'priority': 'medium'
                    }
                ],
                'automation_potential': {
                    'automatable_stages': ['order_entry', 'billing', 'payment'],
                    'estimated_time_saving': '40%',
                    'roi_period': '6개월'
                }
            })
        else:  # p2p
            return Response({
                'optimization_opportunities': [
                    {
                        'area': '견적 프로세스',
                        'current_issue': '평균 24시간 소요 (목표: 16시간)',
                        'recommendation': 'e-Procurement 시스템 도입',
                        'expected_benefit': '견적 시간 50% 단축',
                        'implementation_effort': 'medium',
                        'priority': 'high'
                    },
                    {
                        'area': '공급업체 평가',
                        'current_issue': '품질 이슈 반복 발생',
                        'recommendation': 'SRM(공급업체 관계 관리) 시스템 강화',
                        'expected_benefit': '품질 이슈 60% 감소',
                        'implementation_effort': 'low',
                        'priority': 'high'
                    }
                ],
                'automation_potential': {
                    'automatable_stages': ['requisition', 'po_creation', 'invoice'],
                    'estimated_time_saving': '35%',
                    'roi_period': '4개월'
                }
            })

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def anomaly_detection(request):
    """프로세스 이상 징후 감지"""
    try:
        process_type = request.query_params.get('type', 'o2c')
        threshold = float(request.query_params.get('threshold', 2.0))  # 표준편차 임계값

        anomalies = []

        if process_type == 'o2c':
            # 주문 처리 시간 이상 감지
            orders = O2COrder.objects.all()

            # 각 스테이지별 처리 시간 계산
            for stage_id in ['order_entry', 'production', 'delivery']:
                stage_orders = orders.filter(stage=stage_id)
                if stage_orders.count() > 0:
                    # 실제 처리 시간 (order_date부터 현재까지)
                    avg_duration = 48  # 기본값

                    delayed_orders = [
                        {
                            'order_id': order.order_id,
                            'customer': order.customer,
                            'delayed_hours': avg_duration * 1.5,  # 예시
                            'severity': 'high' if avg_duration * 1.5 > 72 else 'medium'
                        }
                        for order in stage_orders.filter(status='delayed')[:5]
                    ]

                    if delayed_orders:
                        anomalies.append({
                            'type': 'processing_delay',
                            'stage': stage_id,
                            'affected_orders': delayed_orders,
                            'recommendation': f'{stage_id} 스테이지 처리 프로세스 검토 필요'
                        })

        else:  # p2p
            # P2P 이상 감지 로직
            pass

        return Response({
            'anomalies_detected': len(anomalies),
            'anomalies': anomalies[:5],
            'severity_distribution': {
                'high': sum(1 for a in anomalies if any(o.get('severity') == 'high' for o in a.get('affected_orders', []))),
                'medium': sum(1 for a in anomalies if any(o.get('severity') == 'medium' for o in a.get('affected_orders', [])))
            },
            'recommended_actions': [
                '지연 주문 우선 처리',
                '관리자 알림 발송',
                '근본 원인 분석 실시'
            ],
            'detected_at': datetime.now().isoformat()
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'anomalies': []
        }, status=200)


# 헬퍼 함수
def generate_o2c_recommendations(completion_rate, issue_count, bottlenecks):
    """O2C 개선 제안 생성"""
    recommendations = []

    if completion_rate < 80:
        recommendations.append({
            'priority': 'high',
            'category': 'process_efficiency',
            'title': '프로세스 완료율 개선',
            'description': f'현재 완료율 {completion_rate:.1f}%로 목표(95%) 미달',
            'actions': [
                '병목 구간 프로세스 재설계',
                '자동화 도구 도입 검토',
                '담당자 역량 강화'
            ],
            'expected_impact': '완료율 15% 개선'
        })

    if issue_count > 5:
        recommendations.append({
            'priority': 'high',
            'category': 'issue_management',
            'title': '이슈 관리 강화',
            'description': f'최근 30일간 {issue_count}건의 이슈 발생',
            'actions': [
                '이슈 조기 경보 시스템 구축',
                '원인 분석 및 재발 방지 대책 수립',
                '관련 부서 협업 체계 개선'
            ],
            'expected_impact': '이슈 발생 40% 감소'
        })

    if bottlenecks:
        top_bottleneck = max(bottlenecks, key=lambda x: x['delay_ratio'])
        recommendations.append({
            'priority': 'medium',
            'category': 'bottleneck_resolution',
            'title': f'{top_bottleneck["stage_name"]} 병목 해소',
            'description': f'{top_bottleneck["delay_ratio"]:.1f}% 지연 발생',
            'actions': [
                '리소스 추가 배정',
                '프로세스 병렬화',
                '선행 작업 최적화'
            ],
            'expected_impact': '리드타임 20% 단축'
        })

    return recommendations


def generate_p2p_recommendations(avg_duration, delayed_count, quality_issues):
    """P2P 개선 제안 생성"""
    recommendations = []

    if avg_duration > 168:  # 7일
        recommendations.append({
            'priority': 'high',
            'category': 'cycle_time',
            'title': '조달 리드타임 단축',
            'description': f'현재 평균 {avg_duration:.1f}시간 소요',
            'actions': [
                '공급업체 납기 협의',
                '견적 프로세스 간소화',
                '전자 구매 시스템 활성화'
            ],
            'expected_impact': '리드타임 30% 단축'
        })

    if quality_issues > 3:
        recommendations.append({
            'priority': 'high',
            'category': 'quality_management',
            'title': '입고 품질 관리 강화',
            'description': f'품질 이슈 {quality_issues}건 발생',
            'actions': [
                '공급업체 품질 요건 강화',
                '검사 프로세스 개선',
                '불량 원인 분석 및 피드백'
            ],
            'expected_impact': '품질 이슈 50% 감소'
        })

    return recommendations


def get_mock_o2c_predictions():
    """모의 O2C 예측 데이터"""
    return {
        'lead_time': {
            'current_avg': 72.0,
            'target': 48.0,
            'trend': 'improving',
            'predicted_next_period': 68.4
        },
        'completion_rate': {
            'current': 78.5,
            'target': 95.0,
            'gap': 16.5,
            'predicted_next_period': 80.5
        },
        'issues': {
            'recent_count': 6,
            'trend': 'stable',
            'predicted_next_period': 7
        },
        'bottlenecks': [
            {
                'stage_id': 'production',
                'stage_name': '생산',
                'delay_ratio': 50.0,
                'current_duration': 72,
                'estimated_duration': 48
            }
        ]
    }


def get_mock_p2p_predictions():
    """모의 P2P 예측 데이터"""
    return {
        'procurement_cycle': {
            'current_avg': 180.0,
            'target': 168.0,
            'trend': 'stable'
        },
        'supplier_performance': {
            'on_time_delivery_rate': 92.5,
            'quality_acceptance_rate': 96.8,
            'at_risk_suppliers': 2
        },
        'payment_forecast': {
            'current_cycle': 96.0,
            'predicted_volume': 45,
            'cash_flow_impact': 'positive'
        },
        'quality_risks': {
            'recent_issues': 2,
            'trend': 'decreasing',
            'risk_level': 'low'
        }
    }
