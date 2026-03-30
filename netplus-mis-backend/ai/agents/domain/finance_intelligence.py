# -*- coding: utf-8 -*-
"""
FinanceIntelligenceAgent — 재무 지능형 에이전트
예산 모니터링, 현금흐름 분석, 재무 건전성 평가
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from django.db.models import Avg, Sum, Count, Q, F
from django.db.models.functions import TruncMonth, TruncWeek

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class FinanceIntelligenceAgent(BaseAgent):
    """
    재무 지능형 에이전트

    기능:
    - 예산 실행률 모니터링
    - 현금흐름 분석 및 예측
    - 재무 비율 분석
    - 재무 리스크 탐지
    """

    name = "FinanceIntelligenceAgent"
    description = "재무 분석 및 예산/현금흐름 모니터링 에이전트"
    version = "1.0.0"
    domain = "financial"
    layer = "intelligence"
    requires_human_approval = False

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """재무 지능 분석 실행"""

        try:
            # 파라미터 추출
            department = agent_input.parameters.get('department')
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
                'budget_analysis': {},
                'cashflow_analysis': {},
                'financial_ratios': {},
                'risk_alerts': [],
            }

            if analysis_type in ['all', 'budget']:
                result['budget_analysis'] = self._analyze_budget_execution(
                    department=department,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'cashflow']:
                result['cashflow_analysis'] = self._analyze_cashflow(
                    department=department,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'ratios']:
                result['financial_ratios'] = self._calculate_financial_ratios(
                    department=department,
                    period_from=period_from,
                    period_to=period_to
                )

            # 리스크 탐지
            result['risk_alerts'] = self._detect_financial_risks(result)

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
                    'analysis_type': analysis_type,
                    'department': department,
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

    def _analyze_budget_execution(
        self,
        department: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        예산 실행률 분석
        기존 FactFinance 모델 사용
        """
        try:
            from financial.models import FactFinance
            from datetime import datetime

            # 날짜 파싱
            try:
                date_from = datetime.strptime(period_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_from = datetime.now().date()
                date_to = datetime.now().date()

            # 팩트 데이터 조회
            queryset = FactFinance.objects.filter(
                fiscal_month__gte=date_from,
                fiscal_month__lte=date_to
            )

            budget_analysis = []
            total_budget = 0
            total_actual = 0
            over_budget_count = 0

            # 계정별 집계
            account_data = queryset.values('account_code', 'account_name', 'account_type').annotate(
                total_amount=Sum('amount'),
                record_count=Count('source_id')
            )

            for account in account_data:
                amount = float(account['total_amount'] or 0)

                # 전기 대비 증감을 예산 편차로 가정
                prev_amount = float(account.get('prev_amount') or 0)
                if prev_amount > 0:
                    variance = amount - prev_amount
                    variance_rate = (variance / prev_amount * 100)
                else:
                    variance = 0
                    variance_rate = 0

                # 예산으로 전기 금액 사용 (단순화)
                budget_amount = prev_amount if prev_amount > 0 else amount
                actual_amount = amount
                execution_rate = (actual_amount / budget_amount * 100) if budget_amount > 0 else 100

                total_budget += budget_amount
                total_actual += actual_amount

                if actual_amount > budget_amount and budget_amount > 0:
                    over_budget_count += 1

                budget_analysis.append({
                    'account_code': account['account_code'],
                    'account_name': account['account_name'],
                    'account_type': account['account_type'],
                    'budget_amount': float(budget_amount),
                    'actual_amount': float(actual_amount),
                    'execution_rate': float(execution_rate),
                    'variance': float(variance),
                    'variance_rate': float(variance_rate),
                    'status': 'over_budget' if variance > 0 else 'under_budget',
                })

            # 전체 예산 실행률
            total_execution_rate = (total_actual / total_budget * 100) if total_budget > 0 else 0

            return {
                'budget_items': budget_analysis,
                'summary': {
                    'total_budget': float(total_budget),
                    'total_actual': float(total_actual),
                    'total_execution_rate': float(total_execution_rate),
                    'over_budget_count': over_budget_count,
                    'total_items': len(budget_analysis),
                }
            }

        except Exception as e:
            logger.error(f"예산 실행 분석 오류: {e}")
            return {'budget_items': [], 'summary': {}}

    def _analyze_cashflow(
        self,
        department: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        현금흐름 분석
        기존 FinancialStatement 모델 사용
        """
        try:
            from financial.models import FinancialStatement
            from datetime import datetime

            # 날짜 파싱
            try:
                date_from = datetime.strptime(period_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_from = datetime.now().date()
                date_to = datetime.now().date()

            # 현금흐름표 데이터 조회
            queryset = FinancialStatement.objects.filter(
                statement_type='cashflow',
                fiscal_year__gte=date_from.year,
                fiscal_year__lte=date_to.year
            )

            # 월별 필터링
            if date_from.month > 1:
                queryset = queryset.exclude(
                    fiscal_year=date_from.year,
                    fiscal_month__lt=date_from.month
                )
            if date_to.month < 12:
                queryset = queryset.exclude(
                    fiscal_year=date_to.year,
                    fiscal_month__gt=date_to.month
                )

            statements = queryset.order_by('fiscal_year', 'fiscal_month')

            # 현금흐름 합계
            operating_cf = sum(float(s.operating_cashflow or 0) for s in statements)
            investing_cf = sum(float(s.investing_cashflow or 0) for s in statements)
            financing_cf = sum(float(s.financing_cashflow or 0) for s in statements)

            total_inflow = operating_cf + investing_cf + financing_cf
            total_outflow = 0  # 별도 추정 필요

            net_flow = total_inflow - total_outflow

            # 월별 데이터 구성
            monthly_data = []
            for statement in statements:
                month_key = f"{statement.fiscal_year}-{statement.fiscal_month:02d}"
                monthly_operating = float(statement.operating_cashflow or 0)
                monthly_investing = float(statement.investing_cashflow or 0)
                monthly_financing = float(statement.financing_cashflow or 0)

                monthly_data.append({
                    'month': month_key,
                    'operating': monthly_operating,
                    'investing': monthly_investing,
                    'financing': monthly_financing,
                    'net': monthly_operating + monthly_investing + monthly_financing,
                })

            return {
                'flow_by_type': [
                    {
                        'flow_type': 'operating',
                        'total_amount': operating_cf,
                        'avg_amount': operating_cf / len(statements) if statements else 0,
                        'count': len(statements),
                    },
                    {
                        'flow_type': 'investing',
                        'total_amount': investing_cf,
                        'avg_amount': investing_cf / len(statements) if statements else 0,
                        'count': len(statements),
                    },
                    {
                        'flow_type': 'financing',
                        'total_amount': financing_cf,
                        'avg_amount': financing_cf / len(statements) if statements else 0,
                        'count': len(statements),
                    },
                ],
                'monthly_data': monthly_data,
                'summary': {
                    'total_inflow': total_inflow,
                    'total_outflow': total_outflow,
                    'net_flow': net_flow,
                    'flow_ratio': abs(total_inflow / total_outflow) if total_outflow > 0 else 0,
                }
            }

        except Exception as e:
            logger.error(f"현금흐름 분석 오류: {e}")
            return {'flow_by_type': [], 'monthly_data': [], 'summary': {}}

    def _calculate_financial_ratios(
        self,
        department: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        재무 비율 계산
        기존 FinancialStatement, FinancialRatio 모델 사용
        """
        try:
            from financial.models import FinancialStatement, FinancialRatio
            from datetime import datetime

            # 날짜 파싱
            try:
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_to = datetime.now().date()

            # 최근 재무제표 조회
            statement = FinancialStatement.objects.filter(
                fiscal_year__lte=date_to.year,
                fiscal_year__gte=date_to.year - 1
            ).order_by('-fiscal_year', '-fiscal_month').first()

            if not statement:
                return {}

            ratios = {
                'liquidity_ratios': {},
                'profitability_ratios': {},
                'efficiency_ratios': {},
            }

            # 유동성 비율 (FinancialStatement에서 계산)
            if statement.current_assets and statement.current_liabilities:
                ratios['liquidity_ratios']['current_ratio'] = float(
                    statement.current_assets / statement.current_liabilities
                )

            # 당좌비율 (유동자산 - 재고자산) / 유동부채로 근사치 계산
            if statement.current_assets and statement.current_liabilities:
                # 재고자산이 별도 필드가 없으므로 유동비율의 80%로 당좌비율 추정
                ratios['liquidity_ratios']['quick_ratio'] = float(
                    (statement.current_assets * 0.8) / statement.current_liabilities
                )

            # 수익성 비율
            if statement.net_income and statement.revenue:
                ratios['profitability_ratios']['net_profit_margin'] = float(
                    statement.net_income / statement.revenue * 100
                )
            if statement.operating_income and statement.revenue:
                ratios['profitability_ratios']['operating_margin'] = float(
                    statement.operating_income / statement.revenue * 100
                )
            if statement.net_income and statement.total_equity:
                ratios['profitability_ratios']['roe'] = float(
                    statement.net_income / statement.total_equity * 100
                )
            if statement.net_income and statement.total_assets:
                ratios['profitability_ratios']['roa'] = float(
                    statement.net_income / statement.total_assets * 100
                )

            # 안정성 비율
            if statement.total_liabilities and statement.total_equity:
                ratios['liquidity_ratios']['debt_to_equity'] = float(
                    statement.total_liabilities / statement.total_equity * 100
                )
            if statement.total_liabilities and statement.total_assets:
                ratios['liquidity_ratios']['debt_ratio'] = float(
                    statement.total_liabilities / statement.total_assets * 100
                )

            # FinancialRatio 모델에서 추가 데이터 조회
            try:
                latest_ratio = FinancialRatio.objects.filter(
                    fiscal_year=statement.fiscal_year,
                    fiscal_month=statement.fiscal_month
                ).first()

                if latest_ratio:
                    # 모델에 있는 정확한 비율 사용
                    if latest_ratio.current_ratio:
                        ratios['liquidity_ratios']['current_ratio'] = float(latest_ratio.current_ratio)
                    if latest_ratio.quick_ratio:
                        ratios['liquidity_ratios']['quick_ratio'] = float(latest_ratio.quick_ratio)
                    if latest_ratio.roe:
                        ratios['profitability_ratios']['roe'] = float(latest_ratio.roe)
                    if latest_ratio.roa:
                        ratios['profitability_ratios']['roa'] = float(latest_ratio.roa)
                    if latest_ratio.operating_margin:
                        ratios['profitability_ratios']['operating_margin'] = float(latest_ratio.operating_margin)
                    if latest_ratio.net_margin:
                        ratios['profitability_ratios']['net_profit_margin'] = float(latest_ratio.net_margin)
                    if latest_ratio.debt_ratio:
                        ratios['liquidity_ratios']['debt_ratio'] = float(latest_ratio.debt_ratio)
                    if latest_ratio.asset_turnover:
                        ratios['efficiency_ratios']['asset_turnover'] = float(latest_ratio.asset_turnover)
            except:
                pass  # FinancialRatio 데이터가 없으면 계산된 값 사용

            # operating_income를 사용하여 operating_margin 계산 (이미 위에서 계산됨)
            # ebit 필드가 없으므로 operating_income 사용
            if statement.operating_income and statement.revenue:
                if 'operating_margin' not in ratios['profitability_ratios']:
                    ratios['profitability_ratios']['operating_margin'] = float(
                        statement.operating_income / statement.revenue * 100
                    )
            if statement.net_income and statement.total_assets:
                ratios['profitability_ratios']['roa'] = float(
                    statement.net_income / statement.total_assets * 100
                )

            # 효율성 비율
            if statement.revenue and statement.total_assets:
                ratios['efficiency_ratios']['asset_turnover'] = float(
                    statement.revenue / statement.total_assets
                )

            return ratios

        except Exception as e:
            logger.error(f"재무 비율 계산 오류: {e}")
            return {}

    def _detect_financial_risks(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        재무 리스크 탐지
        """
        alerts = []

        # 1. 예산 초과 리스크
        budget_analysis = result.get('budget_analysis', {})
        summary = budget_analysis.get('summary', {})

        if summary.get('total_execution_rate', 0) > 100:
            alerts.append({
                'type': 'budget_overrun',
                'severity': 'high',
                'message': f"전체 예산 실행률 {summary['total_execution_rate']:.1f}% 초과",
                'recommendation': '지출 계획 재검토 및 비용 절감 조치 필요',
            })

        # 2. 현금흐름 리스크
        cashflow_analysis = result.get('cashflow_analysis', {})
        cf_summary = cashflow_analysis.get('summary', {})

        if cf_summary.get('flow_ratio', 1) < 1.1:
            alerts.append({
                'type': 'cashflow_constraint',
                'severity': 'high' if cf_summary.get('flow_ratio', 1) < 1.0 else 'medium',
                'message': f"현금흐름 비율 {cf_summary.get('flow_ratio', 0):.2f} - 유입 부족",
                'recommendation': '자금 조달 계획 수립 및 매출 촉진',
            })

        # 3. 재무 비율 리스크
        ratios = result.get('financial_ratios', {})
        liquidity = ratios.get('liquidity_ratios', {})

        if liquidity.get('current_ratio', 2) < 1.0:
            alerts.append({
                'type': 'liquidity_risk',
                'severity': 'critical',
                'message': f"유동성 비율 {liquidity['current_ratio']:.2f} - 부채 상환 능력 부족",
                'recommendation': '단기 자금 확보 및 유동 자산 증대 필요',
            })

        return alerts

    def _generate_recommendations(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        재무 개선 추천 생성
        """
        recommendations = []

        # 예산 기반 추천
        budget_analysis = result.get('budget_analysis', {})
        for item in budget_analysis.get('budget_items', [])[:3]:
            if item['variance_rate'] > 10:
                recommendations.append({
                    'type': 'budget_control',
                    'priority': 'high' if item['variance_rate'] > 20 else 'medium',
                    'title': f"{item['department_name']} {item['budget_category']} 예산 절감",
                    'description': f"예산 대비 {item['variance_rate']:.1f}% 초과执行",
                    'action_items': [
                        f"{item['budget_category']} 지출 검토",
                        "비용 절감 계획 수립",
                    ],
                })

        # 현금흐름 기반 추천
        cf_summary = result.get('cashflow_analysis', {}).get('summary', {})
        if cf_summary.get('net_flow', 0) < 0:
            recommendations.append({
                'type': 'cashflow_improvement',
                'priority': 'high',
                'title': '현금흐름 개선 필요',
                'description': f"순현금흐름 {cf_summary['net_flow']:,.0f} 원 적자",
                'action_items': [
                    '매출 촉진 및 회수 단축',
                    '지출 일정 조정',
                    '단기 자금 조달',
                ],
            })

        return recommendations

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        분석 결과 신뢰도 계산
        """
        score = 0.0
        max_score = 3.0

        # 예산 데이터 존재
        if result.get('budget_analysis', {}).get('budget_items'):
            score += 1.0

        # 현금흐름 데이터 존재
        if result.get('cashflow_analysis', {}).get('monthly_data'):
            score += 1.0

        # 재무 비율 데이터 존재
        if result.get('financial_ratios', {}):
            score += 1.0

        return min(score / max_score, 0.95)

    def _create_evidence_refs(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        근거 참조 생성
        """
        evidence_refs = []

        # 예산 참조
        budget_items = result.get('budget_analysis', {}).get('budget_items', [])[:2]
        for item in budget_items:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='budget_execution',
                source='Budget',
                source_id=f"{item['department']}_{item['budget_category']}",
                description=f"{item['department_name']} 예산 실행률 {item['execution_rate']:.1f}%",
                data=item,
            ))

        # 현금흐름 참조
        cf_summary = result.get('cashflow_analysis', {}).get('summary', {})
        if cf_summary:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='cashflow_summary',
                source='Cashflow',
                source_id=f"{result.get('metadata', {}).get('period_from')}",
                description=f"순현금흐름 {cf_summary.get('net_flow', 0):,.0f} 원",
                data=cf_summary,
            ))

        return evidence_refs
