"""
재무 지능형 에이전트 (Finance Intelligence Agent)
예산 모니터링 및 현금흐름 분석
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services.event_detection import EventDetectionService
from financial.models import FinancialStatement, FinancialRatio


class FinanceIntelligenceAgent(BaseAgent):
    """
    재무 지능형 에이전트
    - 예산 관리 및 초과 경보
    - 현금흐름 분석
    - 재무비율 모니터링
    - 재무 위험 탐지
    """

    # 에이전트 메타데이터
    agent_type = "finance_intelligence"
    agent_name = "FinanceIntelligenceAgent"
    agent_description = "재무 관리 및 현금흐름 분석을 위한 지능형 에이전트"
    agent_domain = "financial"
    agent_layer = "intelligence"  # L3: Domain Intelligence

    # 재무비율 기준값 (산업 평균 기준)
    RATIO_THRESHOLDS = {
        'current_ratio': {'min': 100.0, 'warning': 80.0, 'critical': 50.0},  # 유동비율 (%)
        'quick_ratio': {'min': 100.0, 'warning': 70.0, 'critical': 40.0},    # 당좌비율 (%)
        'debt_ratio': {'max': 200.0, 'warning': 300.0, 'critical': 400.0},    # 부채비율 (%)
        'roe': {'min': 10.0, 'warning': 5.0, 'critical': 0.0},                # ROE (%)
        'roa': {'min': 5.0, 'warning': 2.0, 'critical': 0.0},                 # ROA (%)
        'operating_margin': {'min': 10.0, 'warning': 5.0, 'critical': 0.0},   # 영업이익률 (%)
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.context.get('fiscal_year'):
            raise ValueError("fiscal_year is required in context")
        if not input_data.context.get('fiscal_month'):
            raise ValueError("fiscal_month is required in context")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        재무 지능 분석 실행

        Args:
            input_data: {
                'context': {
                    'fiscal_year': int,
                    'fiscal_month': int,
                    'analysis_type': str,  # 'budget', 'cashflow', 'ratio', 'all'
                    'threshold_pct': float,  # optional, default 10.0
                },
                'parameters': {
                    'ratio_type': str,  # optional
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters or {}

        fiscal_year = context['fiscal_year']
        fiscal_month = context['fiscal_month']
        analysis_type = context.get('analysis_type', 'all')
        threshold_pct = context.get('threshold_pct', 10.0)

        results = {
            'fiscal_year': fiscal_year,
            'fiscal_month': fiscal_month,
            'analysis_type': analysis_type,
            'findings': [],
            'recommendations': [],
            'detected_events': [],
        }

        # 1. 예산/실적 분석 (Budget Analysis)
        if analysis_type in ['budget', 'all']:
            budget_findings = self._analyze_budget_variance(
                fiscal_year, fiscal_month, threshold_pct
            )
            results['findings'].extend(budget_findings)

            # 이벤트 생성
            for finding in budget_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_budget_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 2. 현금흐름 분석 (Cashflow Analysis)
        if analysis_type in ['cashflow', 'all']:
            cashflow_findings = self._analyze_cashflow(fiscal_year, fiscal_month)
            results['findings'].extend(cashflow_findings)

            # 이벤트 생성
            for finding in cashflow_findings:
                if finding.get('severity') in ['HIGH', 'CRITICAL']:
                    event = self._create_cashflow_event(finding, fiscal_year, fiscal_month)
                    if event:
                        results['detected_events'].append({
                            'event_id': str(event.event_id),
                            'event_type': event.event_type,
                            'severity': event.severity,
                            'title': event.title,
                        })

        # 3. 재무비율 분석 (Ratio Analysis)
        if analysis_type in ['ratio', 'all']:
            ratio_findings = self._analyze_financial_ratios(
                fiscal_year, fiscal_month, parameters.get('ratio_type')
            )
            results['findings'].extend(ratio_findings)

        # 4. 추천사항 생성
        results['recommendations'] = self._generate_recommendations(
            results['findings'], fiscal_year, fiscal_month
        )

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='FinancialStatement',
                source_id=f"{fiscal_year}-{fiscal_month}",
                description=f"{fiscal_year}년 {fiscal_month}월 재무제표"
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"재무 지능 분석 완료: {len(results['findings'])}개의 발견사항",
            evidence_refs=evidence_refs,
        )

    def _analyze_budget_variance(
        self,
        fiscal_year: int,
        fiscal_month: int,
        threshold_pct: float
    ) -> List[Dict[str, Any]]:
        """
        예산/실적 차이 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            threshold_pct: 임계값 백분율

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 현재월 재무제표 조회
            current_statement = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=fiscal_year,
                fiscal_month=fiscal_month
            ).first()

            if not current_statement:
                return [{'type': 'error', 'message': f'{fiscal_year}년 {fiscal_month}월 손익계산서 데이터가 없습니다.'}]

            # 전월 데이터 조회 (예산 대신 전월 실적 사용)
            prev_month = fiscal_month - 1 if fiscal_month > 1 else 12
            prev_year = fiscal_year if fiscal_month > 1 else fiscal_year - 1

            previous_statement = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=prev_year,
                fiscal_month=prev_month
            ).first()

            # 분석 항목: 매출액, 매출원가, 영업이익, 당기순이익
            analysis_items = [
                ('revenue', '매출액'),
                ('cost_of_sales', '매출원가'),
                ('operating_income', '영업이익'),
                ('net_income', '당기순이익'),
            ]

            for item_field, item_name in analysis_items:
                current_value = getattr(current_statement, item_field, Decimal('0'))
                previous_value = getattr(previous_statement, item_field, Decimal('0')) if previous_statement else Decimal('0')

                if previous_value == 0:
                    continue

                # 차이율 계산
                variance = current_value - previous_value
                variance_pct = (variance / abs(previous_value)) * 100

                # 임계값 초과 시 발견사항 생성
                if abs(variance_pct) >= threshold_pct:
                    severity = self._determine_variance_severity(abs(variance_pct), threshold_pct)

                    # 매출액 감소는 부정, 비용 증가는 부정
                    is_negative = (item_field == 'revenue' and variance < 0) or \
                                  (item_field in ['cost_of_sales', 'operating_expenses'] and variance > 0)

                    finding = {
                        'type': 'budget_variance',
                        'item': item_field,
                        'item_name': item_name,
                        'current_value': float(current_value),
                        'previous_value': float(previous_value),
                        'variance': float(variance),
                        'variance_pct': float(variance_pct),
                        'threshold_pct': threshold_pct,
                        'severity': 'HIGH' if is_negative else 'MEDIUM',
                        'direction': 'positive' if variance > 0 else 'negative',
                        'is_negative': is_negative,
                    }

                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'예산 차이 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_cashflow(
        self,
        fiscal_year: int,
        fiscal_month: int
    ) -> List[Dict[str, Any]]:
        """
        현금흐름 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 현금흐름표 조회
            cashflow_statement = FinancialStatement.objects.filter(
                statement_type='cashflow',
                fiscal_year=fiscal_year,
                fiscal_month=fiscal_month
            ).first()

            if not cashflow_statement:
                return findings  # 현금흐름 데이터가 없으면 분석 스킵

            operating_cf = cashflow_statement.operating_cashflow
            investing_cf = cashflow_statement.investing_cashflow
            financing_cf = cashflow_statement.financing_cashflow
            total_cf = operating_cf + investing_cf + financing_cf

            # 영업활동 현금흐름이 음수인 경우
            if operating_cf < 0:
                findings.append({
                    'type': 'cashflow',
                    'issue': 'negative_operating_cf',
                    'description': '영업활동 현금흐름이 음수입니다.',
                    'operating_cf': float(operating_cf),
                    'severity': 'HIGH',
                })

            # 총 현금흐름이 음수이고 영업활동 현금흐름도 음수인 경우
            if total_cf < 0 and operating_cf < 0:
                findings.append({
                    'type': 'cashflow',
                    'issue': 'cashflow_stress',
                    'description': '총 현금흐름과 영업활동 현금흐름이 모두 음수입니다. 현금흐름 압박 우려.',
                    'operating_cf': float(operating_cf),
                    'investing_cf': float(investing_cf),
                    'financing_cf': float(financing_cf),
                    'total_cf': float(total_cf),
                    'severity': 'CRITICAL',
                })

            # 현금흐름 추이 분석 (최근 3개월)
            recent_cashflows = FinancialStatement.objects.filter(
                statement_type='cashflow',
                fiscal_year__gte=fiscal_year,
                fiscal_year__lte=fiscal_year + 1
            ).order_by('-fiscal_year', '-fiscal_month')[:3]

            if len(recent_cashflows) >= 2:
                cashflow_list = list(reversed([cf.operating_cashflow for cf in recent_cashflows]))

                # 현금흐름 지속적 감소
                if all(cashflow_list[i] > cashflow_list[i+1] for i in range(len(cashflow_list)-1)):
                    findings.append({
                        'type': 'cashflow',
                        'issue': 'declining_trend',
                        'description': '영업활동 현금흐름이 지속적으로 감소하고 있습니다.',
                        'trend': 'declining',
                        'severity': 'HIGH',
                    })

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'현금흐름 분석 중 오류 발생: {str(e)}'
            })

        return findings

    def _analyze_financial_ratios(
        self,
        fiscal_year: int,
        fiscal_month: int,
        ratio_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        재무비율 분석

        Args:
            fiscal_year: 회계연도
            fiscal_month: 회계월
            ratio_type: 분석할 비율 유형 (optional)

        Returns:
            발견사항 목록
        """
        findings = []

        try:
            # 재무비율 조회
            financial_ratio = FinancialRatio.objects.filter(
                fiscal_year=fiscal_year,
                fiscal_month=fiscal_month
            ).first()

            if not financial_ratio:
                return [{'type': 'error', 'message': f'{fiscal_year}년 {fiscal_month}월 재무비율 데이터가 없습니다.'}]

            # 분석할 비율 결정
            ratios_to_check = []
            if ratio_type:
                ratios_to_check = [(ratio_type, self.RATIO_THRESHOLDS.get(ratio_type, {}))]
            else:
                for ratio_name, thresholds in self.RATIO_THRESHOLDS.items():
                    ratios_to_check.append((ratio_name, thresholds))

            # 비율별 검사
            for ratio_name, thresholds in ratios_to_check:
                ratio_value = getattr(financial_ratio, ratio_name, None)

                if ratio_value is None:
                    continue

                ratio_name_ko = self._get_ratio_name_korean(ratio_name)

                # 최소값 검사
                if 'min' in thresholds and ratio_value < thresholds['min']:
                    severity = self._determine_ratio_severity(ratio_value, thresholds)

                    finding = {
                        'type': 'financial_ratio',
                        'ratio': ratio_name,
                        'ratio_name': ratio_name_ko,
                        'current_value': float(ratio_value),
                        'threshold_min': thresholds['min'],
                        'issue': 'below_minimum',
                        'description': f'{ratio_name_ko}이(가) 기준값 {thresholds["min"]}% 미달입니다.',
                        'severity': severity,
                    }
                    findings.append(finding)

                # 최대값 검사 (주로 부채비율)
                elif 'max' in thresholds and ratio_value > thresholds['max']:
                    severity = self._determine_ratio_severity(ratio_value, thresholds)

                    finding = {
                        'type': 'financial_ratio',
                        'ratio': ratio_name,
                        'ratio_name': ratio_name_ko,
                        'current_value': float(ratio_value),
                        'threshold_max': thresholds['max'],
                        'issue': 'above_maximum',
                        'description': f'{ratio_name_ko}이(가) 기준값 {thresholds["max"]}% 초과입니다.',
                        'severity': severity,
                    }
                    findings.append(finding)

        except Exception as e:
            findings.append({
                'type': 'error',
                'message': f'재무비율 분석 중 오류 발생: {str(e)}'
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
            if finding.get('type') == 'budget_variance':
                if finding['is_negative'] and finding['severity'] in ['HIGH', 'CRITICAL']:
                    if finding['item'] == 'revenue':
                        action_items = [
                            '매출 감소 원인 분석 (시장 상황, 경쟁사 동향)',
                            '판매 채널 다변화',
                            '신제품/서비스 개발 가속화',
                        ]
                    elif finding['item'] == 'cost_of_sales':
                        action_items = [
                            '매출원가 구조 분석',
                            '자재비/노무비 절감 방안 검토',
                            '생산 효율화 방안 모색',
                        ]
                    else:
                        action_items = [
                            f'{finding["item_name"]} 상세 분석',
                            '비용 절감 대책 수립',
                        ]

                    recommendation = {
                        'title': f"{finding['item_name']} 개선 필요",
                        'description': f"{finding['item_name']}이(가) 전월 대비 {abs(finding['variance_pct']):.1f}% {'감소' if finding['direction'] == 'negative' else '증가'}했습니다.",
                        'category': 'budget_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'financial',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'cashflow':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    if finding['issue'] == 'cashflow_stress':
                        action_items = [
                            '단기 자금 조달 계획 수립',
                            '매출채권 회수 가속화',
                            '비용 지출 연장 검토',
                            '유동성 확보 방안 강구',
                        ]
                    else:
                        action_items = [
                            '현금흐름 개선 계획 수립',
                            '영업활동 현금흐름 양제 방안',
                        ]

                    recommendation = {
                        'title': finding['description'],
                        'description': finding['description'],
                        'category': 'cashflow_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'financial',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

            elif finding.get('type') == 'financial_ratio':
                if finding['severity'] in ['HIGH', 'CRITICAL']:
                    action_items = self._get_ratio_recommendations(finding['ratio'])

                    recommendation = {
                        'title': f"{finding['ratio_name']} 개선 필요",
                        'description': finding['description'],
                        'category': 'ratio_improvement',
                        'priority': 'high' if finding['severity'] == 'CRITICAL' else 'medium',
                        'domain': 'financial',
                        'action_items': action_items,
                        'evidence': finding,
                    }
                    recommendations.append(recommendation)

        return recommendations

    def _get_ratio_name_korean(self, ratio_name: str) -> str:
        """비율명 한글 변환"""
        ratio_names = {
            'current_ratio': '유동비율',
            'quick_ratio': '당좌비율',
            'debt_ratio': '부채비율',
            'roe': '자기자본이익률(ROE)',
            'roa': '총자산이익률(ROA)',
            'operating_margin': '영업이익률',
            'net_margin': '순이익률',
        }
        return ratio_names.get(ratio_name, ratio_name)

    def _get_ratio_recommendations(self, ratio_name: str) -> List[str]:
        """비율별 추천사항"""
        recommendations = {
            'current_ratio': [
                '유동자산 현황 분석',
                '단기 부채 상환 계획 수립',
                '운전자본 확보 방안 검토',
            ],
            'quick_ratio': [
                '당좌자산(현금+예금+유가증권) 확보',
                '재고자산 회전율 개선',
            ],
            'debt_ratio': [
                '차입금 상환 계획 수립',
                '부채 구조 최적화',
                '자기자본 증대 방안 검토',
            ],
            'roe': [
                '수익성 구조 분석',
                '자기자본 회전율 개선',
                '영업이익률 향상',
            ],
            'roa': [
                '총자산 효율화',
                '비효율 자산 처분 검토',
                '자산 회전율 개선',
            ],
            'operating_margin': [
                '원가 구조 분석',
                '고부가가치 제품 비중 확대',
                ' 판매관리비 절감',
            ],
        }
        return recommendations.get(ratio_name, ['재무 개선 계획 수립'])

    def _determine_variance_severity(self, variance_pct: float, threshold_pct: float) -> str:
        """차이율 기반 심각도 결정"""
        if variance_pct >= threshold_pct * 3:
            return 'CRITICAL'
        elif variance_pct >= threshold_pct * 2:
            return 'HIGH'
        elif variance_pct >= threshold_pct:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _determine_ratio_severity(self, value: float, thresholds: Dict[str, float]) -> str:
        """비율 기반 심각도 결정"""
        if 'critical' in thresholds:
            if value < thresholds.get('critical', float('inf')):
                return 'CRITICAL'
        if 'warning' in thresholds:
            if value < thresholds.get('warning', float('inf')):
                return 'HIGH'
        return 'MEDIUM'

    def _create_budget_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """예산 초과 이벤트 생성"""
        try:
            from events.models import Event

            # 이벤트 생성 로직
            if finding['item'] == 'revenue' and finding['direction'] == 'negative':
                # 매출 감소 이벤트
                event = EventDetectionService.detect_kpi_deviation(
                    scope_type='financial_statement',
                    scope_id=f"{fiscal_year}-{fiscal_month}",
                    kpi_code='revenue',
                    kpi_name='매출액',
                    observed_value=finding['current_value'],
                    threshold_value=finding['previous_value'],
                    deviation_pct=abs(finding['variance_pct']),
                )
                return event

            elif finding['item'] in ['cost_of_sales', 'operating_expenses'] and finding['direction'] == 'positive':
                # 비용 증가 이벤트
                event = EventDetectionService.detect_cost_variance_breach(
                    scope_type='financial_statement',
                    scope_id=f"{fiscal_year}-{fiscal_month}",
                    cost_category=finding['item'],
                    actual_cost=finding['current_value'],
                    target_cost=finding['previous_value'],
                    variance_threshold=finding['threshold_pct'],
                )
                return event

        except Exception as e:
            print(f"이벤트 생성 중 오류: {str(e)}")
            return None

    def _create_cashflow_event(
        self,
        finding: Dict[str, Any],
        fiscal_year: int,
        fiscal_month: int
    ) -> Optional[Any]:
        """현금흐름 이벤트 생성"""
        try:
            from events.models import Event

            if finding['issue'] == 'cashflow_stress':
                event = EventDetectionService.detect_cashflow_stress(
                    scope_type='financial_statement',
                    scope_id=f"{fiscal_year}-{fiscal_month}",
                    operating_cashflow=finding.get('operating_cf', 0),
                    total_cashflow=finding.get('total_cf', 0),
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
