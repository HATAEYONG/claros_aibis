"""
구매 지능형 에이전트 (Purchasing Intelligence Agent)
공급자 위험 평가 및 구매 최적화
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService
from purchase.models import MonthlyPurchase, Inventory, PurchaseOrder


class PurchasingIntelligenceAgent(BaseAgent):
    """
    구매 지능형 에이전트
    - 공급자 위험 평가
    - 재고 관리 최적화
    - 구매 발주 모니터링
    - 입고 지연 탐지
    """

    # 에이전트 메타데이터
    agent_type = "purchasing_intelligence"
    agent_name = "PurchasingIntelligenceAgent"
    agent_description = "구매 관리 및 공급자 위험 분석을 위한 지능형 에이전트"
    agent_domain = "purchase"
    agent_layer = "intelligence"  # L3: Domain Intelligence

    # 재고 상태 기준값
    INVENTORY_THRESHOLDS = {
        'critical_days': 3,      # 긴급: 3일 미만
        'low_days': 7,           # 부족: 7일 미만
        'high_days': 90,         # 과다: 90일 초과
    }

    # 발주 지연 기준
    DELAY_THRESHOLDS = {
        'warning_days': 3,       # 경고: 3일 이상 지연
        'critical_days': 7,      # 긴급: 7일 이상 지연
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.context.get('fiscal_year'):
            raise ValueError("fiscal_year is required in context")
        if not input_data.context.get('fiscal_month'):
            raise ValueError("fiscal_month is required in context")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        구매 지능 분석 실행

        Args:
            input_data: {
                'context': {
                    'fiscal_year': int,
                    'fiscal_month': int,
                    'analysis_type': str,  # 'inventory', 'supplier', 'order', 'all'
                },
                'parameters': {
                    'supplier_name': str,  # optional
                    'item_code': str,  # optional
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        fiscal_year = context['fiscal_year']
        fiscal_month = context['fiscal_month']
        analysis_type = context.get('analysis_type', 'all')

        results = {
            'fiscal_year': fiscal_year,
            'fiscal_month': fiscal_month,
            'analysis_type': analysis_type,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 재고 분석 (Inventory Analysis)
        if analysis_type in ['inventory', 'all']:
            inventory_findings = self._analyze_inventory(parameters.get('item_code'))
            results['findings'].extend(inventory_findings)

            # 이벤트 생성
            for finding in inventory_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_inventory_event(finding)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. 공급자 위험 분석 (Supplier Risk Analysis)
        if analysis_type in ['supplier', 'all']:
            supplier_findings = self._analyze_supplier_risk(
                fiscal_year, fiscal_month, parameters.get('supplier_name')
            )
            results['findings'].extend(supplier_findings)

            # 이벤트 생성
            for finding in supplier_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_supplier_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 3. 발주 모니터링 (Order Monitoring)
        if analysis_type in ['order', 'all']:
            order_findings = self._monitor_purchase_orders()
            results['findings'].extend(order_findings)

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(
            results['findings'], fiscal_year, fiscal_month
        )

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='MonthlyPurchase',
                source_id=f"{fiscal_year}-{fiscal_month}",
                description=f"{fiscal_year}년 {fiscal_month}월 구매 데이터"
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"구매 지능 분석 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _analyze_inventory(self, item_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        재고 분석

        Args:
            item_code: 분석할 품목코드 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 재고 데이터 조회
            inventories = Inventory.objects.all()

            if item_code:
                inventories = inventories.filter(item_code=item_code)

            for inventory in inventories:
                # 현재 재고량과 안전 재고량 비교
                if inventory.current_stock == 0:
                    finding = {
                        'type': 'inventory',
                        'issue': 'stockout',
                        'item_code': inventory.item_code,
                        'item_name': inventory.item_name,
                        'current_stock': inventory.current_stock,
                        'safety_stock': inventory.safety_stock,
                        'status': inventory.status,
                        'description': f'{inventory.item_name} 재고가 완전히 소진되었습니다.',
                        'severity': 'CRITICAL',
                    }
                    findings.append(finding)

                elif inventory.current_stock < inventory.safety_stock:
                    days_stock = self._estimate_days_stock(inventory)
                    severity = self._determine_inventory_severity(days_stock, inventory.status)

                    finding = {
                        'type': 'inventory',
                        'issue': 'low_stock',
                        'item_code': inventory.item_code,
                        'item_name': inventory.item_name,
                        'current_stock': inventory.current_stock,
                        'safety_stock': inventory.safety_stock,
                        'days_stock': days_stock,
                        'status': inventory.status,
                        'description': f'{inventory.item_name} 재고가 안전 재고량 미달입니다. (약 {days_stock}일분)',
                        'severity': severity,
                    }
                    findings.append(finding)

                elif inventory.status == 'high':
                    finding = {
                        'type': 'inventory',
                        'issue': 'overstock',
                        'item_code': inventory.item_code,
                        'item_name': inventory.item_name,
                        'current_stock': inventory.current_stock,
                        'safety_stock': inventory.safety_stock,
                        'stock_value': float(inventory.stock_value),
                        'description': f'{inventory.item_name} 재고가 과다합니다.',
                        'severity': 'MEDIUM',
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'재고 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_supplier_risk(
        self,
        fiscal_year: int,
        fiscal_month: int,
        supplier_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        공급자 위험 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            supplier_name: 분석할 공급사명 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 발주 데이터 조회
            orders = PurchaseOrder.objects.all()

            if supplier_name:
                orders = orders.filter(supplier_name__icontains=supplier_name)

            # 공급자별 지연 건수 집계
            supplier_delays = {}

            for order in orders:
                if order.status == 'delayed':
                    if order.supplier_name not in supplier_delays:
                        supplier_delays[order.supplier_name] = {
                            'total_orders': 0,
                            'delayed_orders': 0,
                            'delayed_items': [],
                        }

                    supplier_delays[order.supplier_name]['total_orders'] += 1
                    supplier_delays[order.supplier_name]['delayed_orders'] += 1
                    supplier_delays[order.supplier_name]['delayed_items'].append({
                        'po_number': order.po_number,
                        'item_name': order.item_name,
                        'quantity': order.quantity,
                    })

            # 지연률 계산 및 위험 평가
            for supplier, data in supplier_delays.items():
                # 전체 주문 수 (지연되지 않은 주문 포함)
                total_orders = orders.filter(supplier_name=supplier).count()

                if total_orders == 0:
                    continue

                delay_rate = (data['delayed_orders'] / total_orders) * 100

                # 지연율 기반 위험 등급
                if delay_rate >= 30:
                    risk_level = 'CRITICAL'
                elif delay_rate >= 20:
                    risk_level = 'HIGH'
                elif delay_rate >= 10:
                    risk_level = 'MEDIUM'
                else:
                    risk_level = 'LOW'

                finding = {
                    'type': 'supplier_risk',
                    'supplier_name': supplier,
                    'total_orders': total_orders,
                    'delayed_orders': data['delayed_orders'],
                    'delay_rate': delay_rate,
                    'risk_level': risk_level,
                    'description': f'{supplier} 지연율 {delay_rate:.1f}% ({data["delayed_orders"]}/{total_orders}건)',
                    'severity': 'HIGH' if risk_level in ['HIGH', 'CRITICAL'] else 'MEDIUM',
                }
                findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'공급자 위험 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _monitor_purchase_orders(self) -> List[Dict[str, Any]]:
        """
        발주 모니터링

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 지연된 발주 조회
            delayed_orders = PurchaseOrder.objects.filter(status='delayed')

            for order in delayed_orders:
                # 지연 일수 계산 (예상 납기일이 없으면 현재일 기준 7일 지연으로 가정)
                days_delayed = 7  # 기본값

                finding = {
                    'type': 'order_delay',
                    'po_number': order.po_number,
                    'supplier_name': order.supplier_name,
                    'item_name': order.item_name,
                    'quantity': order.quantity,
                    'status': order.status,
                    'description': f'{order.supplier_name}에서 발주한 {order.item_name}이 지연되고 있습니다.',
                    'severity': 'HIGH',
                }
                findings.append(finding)

            # 입고 대기 건수가 많은 공급자
            pending_orders = PurchaseOrder.objects.filter(status='ordered')

            # 공급자별 입고 대기 건수 집계
            supplier_pending = {}
            for order in pending_orders:
                if order.supplier_name not in supplier_pending:
                    supplier_pending[order.supplier_name] = 0
                supplier_pending[order.supplier_name] += 1

            # 입고 대기 10건 이상 공급자
            for supplier, count in supplier_pending.items():
                if count >= 10:
                    finding = {
                        'type': 'pending_orders',
                        'supplier_name': supplier,
                        'pending_count': count,
                        'description': f'{supplier}에서 {count}건의 입고를 대기 중입니다.',
                        'severity': 'MEDIUM',
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'발주 모니터링 중 오류 발생: {str(e)}'
            })

        return findings

    def _generate_recommendations(
        self,
        findings: List[Dict[str, Any]],
        fiscal_year: int,
        fiscal_month: int
    ) -> List[Dict[str, Any]]:
        """
        발견사항 기반 추천사항 생성

        Args:
            findings: 발견사항 목록
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            추천사항 목록
        """
        recommendations = []

        for finding in findings:
            if finding.get('type') == 'inventory':
                if finding['issue'] in ['stockout', 'low_stock']:
                    if finding['severity'] in ['HIGH', 'CRITICAL']:
                        action_items = [
                            f'긴급 발주 처리: {finding["item_name"]}',
                            '대체 공급사 확인',
                            '생산 일정 조정 검토',
                        ]

                        recommendation = {
                            'title': f"{finding['item_name']} 재고 부족",
                            'description': finding['description'],
                            'category': 'inventory_shortage',
                            'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                            'domain': 'purchase',
                            'action_items': action_items,
                            'evidence': finding,
                        }
                        recommendations.append(recommendation)

            elif finding.get('type') == 'supplier_risk':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = [
                        f'{finding["supplier_name"]}와의 협의 계획 수립',
                        '대체 공급사 선정',
                        '발주 분산 계획',
                    ]

                    recommendation = {
                        'title': f"{finding['supplier_name']} 지연 위험",
                        'description': finding['description'],
                        'category': 'supplier_risk',
                        'priority': 'high',
                        'domain': 'purchase',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

        return recommendations

    def _estimate_days_stock(self, inventory: Inventory) -> int:
        """
        재고로 소비 가능한 일수 추정

        Args:
            inventory: 재고 객체

        Returns:
            소비 가능 일수
        """
        # 회전율 기반 일수 추정
        if inventory.turnover_rate > 0:
            # 회전율 = 연간 사용량 / 평균재고
            # 일일 사용량 = 연간 사용량 / 365
            # 일수 = 현재재고 / 일일 사용량
            annual_usage = inventory.turnover_rate * inventory.current_stock
            daily_usage = annual_usage / 365
            if daily_usage > 0:
                return int(inventory.current_stock / daily_usage)

        # 회전율이 없으면 단순 추정
        return 30  # 기본 30일

    def _determine_inventory_severity(self, days_stock: int, status: str) -> str:
        """
        재고 심각도 결정

        Args:
            days_stock: 소비 가능 일수
            status: 재고 상태

        Returns:
            심각도
        """
        if status == 'critical':
            return 'CRITICAL'
        elif status == 'low' or days_stock < self.INVENTORY_THRESHOLDS['critical_days']:
            return 'HIGH'
        elif days_stock < self.INVENTORY_THRESHOLDS['low_days']:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _create_inventory_event(self, finding: Dict[str, Any]) -> Optional[Any]:
        """재고 부족 이벤트 생성"""
        try:
            from events.models import Event

            if finding['issue'] in ['stockout', 'low_stock']:
                event = EventDetectionService.detect_inventory_shortage(
                    scope_type='inventory',
                    scope_id=finding['item_code'],
                    item_code=finding['item_code'],
                    item_name=finding['item_name'],
                    current_stock=finding['current_stock'],
                    safety_stock=finding['safety_stock'],
                )
                return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _create_supplier_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """공급자 위험 이벤트 생성"""
        try:
            from events.models import Event

            event = EventDetectionService.detect_supplier_risk(
                scope_type='supplier',
                scope_id=finding['supplier_name'],
                supplier_name=finding['supplier_name'],
                risk_level=finding['risk_level'],
                delay_rate=finding['delay_rate'],
            )
            return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """결과 신뢰도 계산"""
        finding_count = len(results.get('findings', []))

        if finding_count == 0:
            return 0.5
        elif finding_count >= 3:
            return 0.9
        elif finding_count >= 2:
            return 0.8
        else:
            return 0.7

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        pass
