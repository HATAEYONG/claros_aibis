# -*- coding: utf-8 -*-
"""
PurchasingIntelligenceAgent — 구매 지능형 에이전트
공급자 리스크 평가, 가격 모니터링, 구매 최적화 추천
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from django.db.models import Avg, Sum, Count, Q, F, Max, Min
from django.db.models.functions import TruncMonth

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class PurchasingIntelligenceAgent(BaseAgent):
    """
    구매 지능형 에이전트

    기능:
    - 공급자 리스크 평가
    - 재료 가격 모니터링
    - 구매 성과 분석
    - 공급자 추천
    """

    name = "PurchasingIntelligenceAgent"
    description = "구매 분석 및 공급자 리스크 평가 에이전트"
    version = "1.0.0"
    domain = "purchase"
    layer = "intelligence"
    requires_human_approval = False

    # 리스크 수준 임계값
    RISK_THRESHOLDS = {
        'low': 30,
        'medium': 60,
        'high': 80,
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """구매 지능 분석 실행"""

        try:
            # 파라미터 추출
            vendor_id = agent_input.parameters.get('vendor_id')
            material_id = agent_input.parameters.get('material_id')
            plant = agent_input.parameters.get('plant')
            period_from = agent_input.parameters.get('period_from')
            period_to = agent_input.parameters.get('period_to')
            analysis_type = agent_input.parameters.get('analysis_type', 'all')

            # 기간 설정
            if not period_from:
                period_from = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
            if not period_to:
                period_to = datetime.now().strftime('%Y-%m-%d')

            # 분석 수행
            result = {
                'supplier_risk_analysis': {},
                'price_monitoring': {},
                'purchasing_performance': {},
                'high_risk_suppliers': [],
            }

            if analysis_type in ['all', 'risk']:
                result['supplier_risk_analysis'] = self._analyze_supplier_risks(
                    vendor_id=vendor_id,
                    plant=plant,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'price']:
                result['price_monitoring'] = self._monitor_prices(
                    material_id=material_id,
                    vendor_id=vendor_id,
                    plant=plant,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'performance']:
                result['purchasing_performance'] = self._analyze_purchasing_performance(
                    vendor_id=vendor_id,
                    plant=plant,
                    period_from=period_from,
                    period_to=period_to
                )

            # 고위험 공급자 목록
            result['high_risk_suppliers'] = self._identify_high_risk_suppliers(result)

            # 추천 생성
            recommendations = self._generate_recommendations(result)

            # 신뢰도 계산
            confidence = self._calculate_confidence(result)

            # 근거 참조
            evidence_refs = self._create_evidence_refs(result)

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result=result,
                evidence_refs=evidence_refs,
                confidence=confidence,
                recommendations=recommendations,
                metadata={
                    'vendor_id': vendor_id,
                    'material_id': material_id,
                    'plant': plant,
                    'period_from': period_from,
                    'period_to': period_to,
                }
            )

        except Exception as e:
            logger.exception(f"[{self.name}] 실행 오류: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[str(e)],
            )

    def _analyze_supplier_risks(
        self,
        vendor_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        공급자 리스크 분석
        """
        try:
            from purchase.models import Supplier, SupplierEvaluation, PurchaseOrder

            # 공급자 조회
            supplier_qs = Supplier.objects.filter(is_active=True)
            if vendor_id:
                supplier_qs = supplier_qs.filter(vendor_id=vendor_id)

            suppliers = supplier_qs.all()

            risk_analysis = []

            for supplier in suppliers:
                # 평가 데이터 조회
                evaluations = SupplierEvaluation.objects.filter(
                    supplier=supplier,
                    evaluation_date__gte=period_from,
                    evaluation_date__lte=period_to
                ).aggregate(
                    avg_score=Avg('evaluation_score'),
                    latest_date=Max('evaluation_date'),
                    evaluation_count=Count('evaluation_id')
                )

                # 납품 성과
                orders = PurchaseOrder.objects.filter(
                    supplier=supplier,
                    order_date__gte=period_from,
                    order_date__lte=period_to
                ).aggregate(
                    total_orders=Count('order_id'),
                    delayed_orders=Count('order_id', filter=Q(delivery_date__gt=F('required_date')))
                )

                total_orders = orders['total_orders'] or 0
                delayed_orders = orders['delayed_orders'] or 0
                on_time_delivery_rate = (
                    (total_orders - delayed_orders) / total_orders * 100
                    if total_orders > 0 else 0
                )

                # 리스크 점수 계산 (0-100)
                risk_score = self._calculate_risk_score(
                    quality_score=evaluations['avg_score'] or 80,
                    delivery_rate=on_time_delivery_rate,
                    evaluation_count=evaluations['evaluation_count'] or 0
                )

                # 리스크 등급 판정
                if risk_score >= self.RISK_THRESHOLDS['high']:
                    risk_level = 'high'
                elif risk_score >= self.RISK_THRESHOLDS['medium']:
                    risk_level = 'medium'
                elif risk_score >= self.RISK_THRESHOLDS['low']:
                    risk_level = 'low'
                else:
                    risk_level = 'very_low'

                risk_analysis.append({
                    'vendor_id': supplier.vendor_id,
                    'vendor_code': supplier.vendor_code,
                    'vendor_name': supplier.vendor_name,
                    'vendor_type': supplier.vendor_type,
                    'quality_score': float(evaluations['avg_score'] or 0),
                    'on_time_delivery_rate': float(on_time_delivery_rate),
                    'total_orders': total_orders,
                    'delayed_orders': delayed_orders,
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'evaluation_count': evaluations['evaluation_count'] or 0,
                })

            return {
                'suppliers': risk_analysis,
                'summary': self._create_risk_summary(risk_analysis),
            }

        except Exception as e:
            logger.error(f"공급자 리스크 분석 오류: {e}")
            return {'suppliers': [], 'summary': {}}

    def _calculate_risk_score(
        self,
        quality_score: float,
        delivery_rate: float,
        evaluation_count: int
    ) -> float:
        """
        리스크 점수 계산 (0-100, 높을수록 높은 리스크)
        """
        # 품질 리스크 (품질 점수가 낮을수록 높은 리스크)
        quality_risk = max(0, 100 - quality_score) * 0.4

        # 납품 리스크 (납기 준수율이 낮을수록 높은 리스크)
        delivery_risk = max(0, 100 - delivery_rate) * 0.4

        # 데이터 부족 리스크
        data_risk = 0 if evaluation_count >= 3 else 20

        return min(quality_risk + delivery_risk + data_risk, 100)

    def _create_risk_summary(self, risk_analysis: List[Dict]) -> Dict[str, Any]:
        """
        리스크 분석 요약
        """
        if not risk_analysis:
            return {}

        total = len(risk_analysis)
        high_risk = len([s for s in risk_analysis if s['risk_level'] == 'high'])
        medium_risk = len([s for s in risk_analysis if s['risk_level'] == 'medium'])
        low_risk = len([s for s in risk_analysis if s['risk_level'] in ['low', 'very_low']])

        avg_risk_score = sum(s['risk_score'] for s in risk_analysis) / total if total > 0 else 0

        return {
            'total_suppliers': total,
            'high_risk_count': high_risk,
            'medium_risk_count': medium_risk,
            'low_risk_count': low_risk,
            'avg_risk_score': float(avg_risk_score),
        }

    def _monitor_prices(
        self,
        material_id: str = None,
        vendor_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        재료 가격 모니터링
        """
        try:
            from purchase.models import PurchaseOrderItem, MaterialPrice

            # 구매가격 데이터 조회
            queryset = PurchaseOrderItem.objects.filter(
                order__order_date__gte=period_from,
                order__order_date__lte=period_to
            )

            if material_id:
                queryset = queryset.filter(material_id=material_id)
            if vendor_id:
                queryset = queryset.filter(order__supplier_id=vendor_id)
            if plant:
                queryset = queryset.filter(order__plant=plant)

            # 월별 가격 추이
            monthly_prices = queryset.annotate(
                month=TruncMonth('order__order_date')
            ).values('month', 'material_id', 'material_name').annotate(
                avg_price=Avg('unit_price'),
                min_price=Min('unit_price'),
                max_price=Max('unit_price'),
                quantity=Sum('quantity')
            ).order_by('month', 'material_id')

            # 가격 급등 탐지
            price_alerts = self._detect_price_spikes(monthly_prices)

            # 재료별 현재 가격
            current_prices = queryset.annotate(
                month=TruncMonth('order__order_date')
            ).values('material_id', 'material_name').annotate(
                latest_price=Max('unit_price'),
                avg_price=Avg('unit_price')
            )

            return {
                'monthly_trends': [
                    {
                        'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                        'material_id': item['material_id'],
                        'material_name': item['material_name'],
                        'avg_price': float(item['avg_price']),
                        'min_price': float(item['min_price']),
                        'max_price': float(item['max_price']),
                        'quantity': float(item['quantity']),
                    }
                    for item in monthly_prices
                ],
                'current_prices': [
                    {
                        'material_id': item['material_id'],
                        'material_name': item['material_name'],
                        'latest_price': float(item['latest_price']),
                        'avg_price': float(item['avg_price']),
                    }
                    for item in current_prices
                ],
                'price_alerts': price_alerts,
            }

        except Exception as e:
            logger.error(f"가격 모니터링 오류: {e}")
            return {'monthly_trends': [], 'current_prices': [], 'price_alerts': []}

    def _detect_price_spikes(self, monthly_prices: List[Dict]) -> List[Dict]:
        """
        가격 급등 탐지
        """
        alerts = []

        # 재료별 월 가격 그룹화
        material_prices = {}
        for item in monthly_prices:
            material_id = item['material_id']
            if material_id not in material_prices:
                material_prices[material_id] = []
            material_prices[material_id].append(item)

        # 각 재료별 가격 변동 감지
        for material_id, prices in material_prices.items():
            if len(prices) < 2:
                continue

            sorted_prices = sorted(prices, key=lambda x: x['month'])

            for i in range(1, len(sorted_prices)):
                prev_price = sorted_prices[i - 1]['avg_price']
                curr_price = sorted_prices[i]['avg_price']

                if prev_price > 0:
                    price_change_pct = ((curr_price - prev_price) / prev_price) * 100

                    # 20% 이상 급등 시 알림
                    if price_change_pct > 20:
                        alerts.append({
                            'material_id': material_id,
                            'material_name': sorted_prices[i]['material_name'],
                            'from_month': sorted_prices[i - 1]['month'].strftime('%Y-%m'),
                            'to_month': sorted_prices[i]['month'].strftime('%Y-%m'),
                            'price_change_pct': float(price_change_pct),
                            'prev_price': float(prev_price),
                            'curr_price': float(curr_price),
                        })

        return alerts

    def _analyze_purchasing_performance(
        self,
        vendor_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        구매 성과 분석
        """
        try:
            from purchase.models import PurchaseOrder, Supplier

            queryset = PurchaseOrder.objects.filter(
                order_date__gte=period_from,
                order_date__lte=period_to
            )

            if vendor_id:
                queryset = queryset.filter(supplier_id=vendor_id)
            if plant:
                queryset = queryset.filter(plant=plant)

            # 공급자별 성과 집계
            performance = queryset.values('supplier_id', 'supplier__vendor_name').annotate(
                total_orders=Count('order_id'),
                total_amount=Sum('total_amount'),
                delayed_orders=Count('order_id', filter=Q(delivery_date__gt=F('required_date'))),
                avg_delivery_days=Avg(F('delivery_date') - F('required_date'), filter=Q(delivery_date__gt=F('required_date')))
            ).order_by('-total_amount')

            performance_data = []
            for item in performance:
                total_orders = item['total_orders']
                delayed_orders = item['delayed_orders']
                on_time_rate = ((total_orders - delayed_orders) / total_orders * 100) if total_orders > 0 else 0

                performance_data.append({
                    'supplier_id': item['supplier_id'],
                    'supplier_name': item['supplier__vendor_name'],
                    'total_orders': total_orders,
                    'total_amount': float(item['total_amount'] or 0),
                    'delayed_orders': delayed_orders,
                    'on_time_delivery_rate': float(on_time_rate),
                    'avg_delay_days': float(item['avg_delivery_days'].days) if item['avg_delivery_days'] else 0,
                })

            return {
                'performance_by_supplier': performance_data,
                'top_suppliers_by_amount': sorted(performance_data, key=lambda x: x['total_amount'], reverse=True)[:5],
            }

        except Exception as e:
            logger.error(f"구매 성과 분석 오류: {e}")
            return {'performance_by_supplier': [], 'top_suppliers_by_amount': []}

    def _identify_high_risk_suppliers(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        고위험 공급자 식별
        """
        risk_analysis = result.get('supplier_risk_analysis', {}).get('suppliers', [])

        return [
            supplier for supplier in risk_analysis
            if supplier['risk_level'] in ['high', 'medium']
        ]

    def _generate_recommendations(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        구매 개선 추천
        """
        recommendations = []

        # 고위험 공급자 대응
        high_risk_suppliers = result.get('high_risk_suppliers', [])
        for supplier in high_risk_suppliers[:3]:
            recommendations.append({
                'type': 'supplier_risk_mitigation',
                'priority': 'high' if supplier['risk_level'] == 'high' else 'medium',
                'title': f"{supplier['vendor_name']} 리스크 완화",
                'description': f"리스크 점수 {supplier['risk_score']:.0f} ({supplier['risk_level']})",
                'action_items': [
                    '대체 공급자 검토',
                    '재고 안전량 확보',
                    '성과 개선 계획 요청',
                ],
                'vendor_id': supplier['vendor_id'],
            })

        # 가격 급등 대응
        price_alerts = result.get('price_monitoring', {}).get('price_alerts', [])
        for alert in price_alerts[:3]:
            recommendations.append({
                'type': 'price_spike_response',
                'priority': 'high',
                'title': f"{alert['material_name']} 가격 급등 대응",
                'description': f"{alert['from_month']}~{alert['to_month']} {alert['price_change_pct']:.1f}% 급등",
                'action_items': [
                    '대체 자재 검토',
                    '단기 구매 계약 체결',
                    '가격 안정화 협의',
                ],
                'material_id': alert['material_id'],
            })

        # 납품 성과 개선
        performance = result.get('purchasing_performance', {}).get('performance_by_supplier', [])
        low_performance = [p for p in performance if p['on_time_delivery_rate'] < 80]
        for supplier in low_performance[:3]:
            recommendations.append({
                'type': 'delivery_performance_improvement',
                'priority': 'medium',
                'title': f"{supplier['supplier_name']} 납품 성과 개선",
                'description': f"납기 준수율 {supplier['on_time_delivery_rate']:.1f}%",
                'action_items': [
                    '납품 리드타임 검토',
                    '발주 일정 조정',
                    '물류 파트너 검토',
                ],
                'supplier_id': supplier['supplier_id'],
            })

        return recommendations

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        신뢰도 계산
        """
        score = 0.0

        # 공급자 리스크 데이터
        if result.get('supplier_risk_analysis', {}).get('suppliers'):
            score += 0.4

        # 가격 모니터링 데이터
        if result.get('price_monitoring', {}).get('monthly_trends'):
            score += 0.3

        # 구매 성과 데이터
        if result.get('purchasing_performance', {}).get('performance_by_supplier'):
            score += 0.3

        return min(score, 0.95)

    def _create_evidence_refs(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        근거 참조 생성
        """
        evidence_refs = []

        # 공급자 리스크 참조
        high_risk = result.get('high_risk_suppliers', [])[:2]
        for supplier in high_risk:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='supplier_risk',
                source='SupplierEvaluation',
                source_id=supplier['vendor_id'],
                description=f"{supplier['vendor_name']} 리스크 점수 {supplier['risk_score']:.0f}",
                data=supplier,
            ))

        # 가격 알림 참조
        price_alerts = result.get('price_monitoring', {}).get('price_alerts', [])[:2]
        for alert in price_alerts:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='price_spike',
                source='PurchaseOrderItem',
                source_id=alert['material_id'],
                description=f"{alert['material_name']} {alert['price_change_pct']:.1f}% 급등",
                data=alert,
            ))

        return evidence_refs
