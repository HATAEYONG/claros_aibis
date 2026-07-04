"""
평가 에이전트
에이전트 실행 결과를 평가하고 성능 측정
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from django.db.models import Avg, Max, Min, Count
from django.utils import timezone

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.models import AgentRunLog, AgentMemory

logger = logging.getLogger(__name__)


class EvaluationAgent(BaseAgent):
    """
    평가 에이전트
    에이전트 실행 결과를 평가하고 성능 측정

    Attributes:
        agent_type: 에이전트 유형
        agent_name: 에이전트명
        agent_description: 에이전트 설명
        agent_domain: 도메인 (모든 도메인 지원)
        agent_layer: 학습 레이어
    """

    # 에이전트 메타데이터
    agent_type = "evaluation"
    agent_name = "EvaluationAgent"
    agent_description = "에이전트 실행 평가 및 성능 측정"
    agent_domain = "general"
    agent_layer = "learning"  # L6: Learning

    # 평가 기준값
    EVALUATION_THRESHOLDS = {
        'execution_time_ms': {
            'excellent': 1000,   # 1초 이하
            'good': 2000,        # 2초 이하
            'acceptable': 5000,  # 5초 이하
        },
        'confidence_score': {
            'excellent': 0.9,
            'good': 0.8,
            'acceptable': 0.6,
        },
        'success_rate': {
            'excellent': 0.95,
            'good': 0.85,
            'acceptable': 0.7,
        },
    }

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.parameters.get('run_id') and not input_data.parameters.get('agent_name'):
            raise ValueError("run_id 또는 agent_name 파라미터가 필요합니다")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        평가 실행

        Args:
            input_data: {
                'context': {
                    'evaluation_type': str,  # 'single', 'aggregate', 'trend'
                },
                'parameters': {
                    'run_id': str,  # 단일 실행 평가
                    'agent_name': str,  # 에이전트 집계 평가
                    'time_range_days': int,  # 기간별 집계 (default: 7)
                    'evaluation_criteria': Dict,  # 추가 평가 기준
                }
            }
        """
        params = input_data.parameters
        context = input_data.context
        evaluation_type = context.get('evaluation_type', 'single')

        try:
            if evaluation_type == 'single':
                # 단일 실행 평가
                run_id = params.get('run_id')
                if not run_id:
                    return AgentOutput(
                        status='error',
                        data={},
                        confidence_score=0.0,
                        message='run_id 파라미터가 필요합니다',
                        evidence_refs=[],
                    )

                result = self._evaluate_single_run(
                    run_id=run_id,
                    criteria=params.get('evaluation_criteria', {})
                )

            elif evaluation_type == 'aggregate':
                # 에이전트 집계 평가
                agent_name = params.get('agent_name')
                if not agent_name:
                    return AgentOutput(
                        status='error',
                        data={},
                        confidence_score=0.0,
                        message='agent_name 파라미터가 필요합니다',
                        evidence_refs=[],
                    )

                time_range_days = params.get('time_range_days', 7)
                result = self._evaluate_agent_aggregate(
                    agent_name=agent_name,
                    time_range_days=time_range_days
                )

            elif evaluation_type == 'trend':
                # 추세 평가
                agent_name = params.get('agent_name')
                if not agent_name:
                    return AgentOutput(
                        status='error',
                        data={},
                        confidence_score=0.0,
                        message='agent_name 파라미터가 필요합니다',
                        evidence_refs=[],
                    )

                time_range_days = params.get('time_range_days', 30)
                result = self._evaluate_agent_trend(
                    agent_name=agent_name,
                    time_range_days=time_range_days
                )
            else:
                return AgentOutput(
                    status='error',
                    data={},
                    confidence_score=0.0,
                    message=f'지원하지 않는 평가 유형: {evaluation_type}',
                    evidence_refs=[],
                )

            # 증거 생성
            evidence_refs = [
                self.create_evidence_ref(
                    source_type='agent_evaluation',
                    source_id=result.get('run_id', result.get('agent_name', '')),
                    description=f"에이전트 평가: {evaluation_type}"
                )
            ]

            return AgentOutput(
                status='success',
                data=result,
                confidence_score=result.get('overall_score', 0.8),
                message=f"평가 완료: {evaluation_type}",
                evidence_refs=evidence_refs,
            )

        except Exception as e:
            logger.exception(f"평가 실패: {e}")
            return AgentOutput(
                status='error',
                data={},
                confidence_score=0.0,
                message=f"평가 실패: {str(e)}",
                evidence_refs=[],
            )

    def _evaluate_single_run(
        self,
        run_id: str,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """단일 실행 평가"""
        try:
            run_log = AgentRunLog.objects.get(request_id=run_id)
        except AgentRunLog.DoesNotExist:
            return {
                'error': f"실행 로그를 찾을 수 없음: {run_id}",
                'run_id': run_id,
            }

        # 기본 평가 지표
        metrics = self._calculate_run_metrics(run_log, criteria)

        # 종합 점수 계산
        weights = criteria.get('weights', {
            "success": 0.3,
            "execution_time": 0.2,
            "confidence": 0.2,
            "evidence": 0.15,
            "output_quality": 0.15,
        })

        overall_score = self._calculate_overall_score(metrics, weights)

        # 등급 결정
        grade = self._determine_grade(overall_score)

        # 평가 노트 생성
        evaluation_notes = self._generate_evaluation_notes(metrics, run_log)

        # 평가 결과 저장
        self._save_evaluation(run_log, overall_score, evaluation_notes)

        return {
            'run_id': str(run_log.request_id),
            'agent_name': run_log.agent_name,
            'agent_layer': run_log.agent_layer,
            'agent_domain': run_log.agent_domain,
            'metrics': metrics,
            'overall_score': round(overall_score, 3),
            'grade': grade,
            'evaluation_notes': evaluation_notes,
            'evaluated_at': timezone.now().isoformat(),
        }

    def _evaluate_agent_aggregate(
        self,
        agent_name: str,
        time_range_days: int
    ) -> Dict[str, Any]:
        """에이전트 집계 평가"""
        cutoff_date = timezone.now() - timedelta(days=time_range_days)

        # 집계 쿼리
        runs = AgentRunLog.objects.filter(
            agent_name=agent_name,
            created_at__gte=cutoff_date
        )

        total_count = runs.count()
        if total_count == 0:
            return {
                'agent_name': agent_name,
                'error': f"{time_range_days}일간 실행 이력 없음",
                'time_range_days': time_range_days,
            }

        # 집계 통계
        stats = runs.aggregate(
            avg_execution_time=Avg('execution_time_ms'),
            max_execution_time=Max('execution_time_ms'),
            min_execution_time=Min('execution_time_ms'),
            avg_confidence=Avg('confidence'),
        )

        success_count = runs.filter(status='completed').count()
        error_count = runs.filter(status='failed').count()
        evidence_count = runs.filter(has_evidence=True).count()
        evaluated_count = runs.filter(evaluated=True).count()

        # 집계 지표
        metrics = {
            'total_executions': total_count,
            'success_count': success_count,
            'error_count': error_count,
            'success_rate': round(success_count / total_count, 3) if total_count > 0 else 0,
            'avg_execution_time_ms': round(stats['avg_execution_time'] or 0, 2),
            'max_execution_time_ms': stats['max_execution_time'] or 0,
            'min_execution_time_ms': stats['min_execution_time'] or 0,
            'avg_confidence': round(stats['avg_confidence'] or 0, 3),
            'evidence_rate': round(evidence_count / total_count, 3) if total_count > 0 else 0,
            'evaluation_coverage': round(evaluated_count / total_count, 3) if total_count > 0 else 0,
        }

        # 등급 결정
        grade = self._determine_aggregate_grade(metrics)

        # 추천사항
        recommendations = self._generate_aggregate_recommendations(metrics)

        return {
            'agent_name': agent_name,
            'time_range_days': time_range_days,
            'metrics': metrics,
            'grade': grade,
            'recommendations': recommendations,
            'evaluated_at': timezone.now().isoformat(),
        }

    def _evaluate_agent_trend(
        self,
        agent_name: str,
        time_range_days: int
    ) -> Dict[str, Any]:
        """에이전트 추세 평가"""
        cutoff_date = timezone.now() - timedelta(days=time_range_days)

        runs = AgentRunLog.objects.filter(
            agent_name=agent_name,
            created_at__gte=cutoff_date
        ).order_by('created_at')

        if runs.count() < 2:
            return {
                'agent_name': agent_name,
                'error': '추세 분석을 위한 데이터 부족 (최소 2건 필요)',
                'time_range_days': time_range_days,
            }

        # 시간별 그룹핑
        daily_stats = {}
        for run in runs:
            date_key = run.created_at.date()
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    'count': 0,
                    'success_count': 0,
                    'total_time': 0,
                    'total_confidence': 0,
                }
            daily_stats[date_key]['count'] += 1
            if run.status == 'completed':
                daily_stats[date_key]['success_count'] += 1
            daily_stats[date_key]['total_time'] += run.execution_time_ms or 0
            daily_stats[date_key]['total_confidence'] += float(run.confidence or 0)

        # 일별 평균 계산
        daily_metrics = []
        for date, stats in sorted(daily_stats.items()):
            daily_metrics.append({
                'date': date.isoformat(),
                'count': stats['count'],
                'success_rate': round(stats['success_count'] / stats['count'], 3),
                'avg_execution_time': round(stats['total_time'] / stats['count'], 2),
                'avg_confidence': round(stats['total_confidence'] / stats['count'], 3),
            })

        # 추세 분석
        trend_analysis = self._analyze_trends(daily_metrics)

        return {
            'agent_name': agent_name,
            'time_range_days': time_range_days,
            'daily_metrics': daily_metrics,
            'trend_analysis': trend_analysis,
            'evaluated_at': timezone.now().isoformat(),
        }

    def _calculate_run_metrics(
        self,
        run_log: AgentRunLog,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """실행 지표 계산"""
        metrics = {}

        # 1. 성공 여부
        metrics['success'] = run_log.status == 'completed'

        # 2. 실행 시간 점수
        metrics['execution_time_ms'] = run_log.execution_time_ms or 0
        metrics['execution_time_score'] = self._evaluate_execution_time(
            run_log.execution_time_ms or 0,
            run_log.agent_name
        )

        # 3. 신뢰도 점수
        confidence = float(run_log.confidence) if run_log.confidence else 0.0
        metrics['confidence_score'] = confidence

        # 4. 근거 존재 여부
        metrics['has_evidence'] = run_log.has_evidence
        metrics['evidence_score'] = 1.0 if run_log.has_evidence else 0.0

        # 5. 출력 품질 점수
        metrics['output_quality_score'] = self._evaluate_output_quality(
            run_log.output_data,
            run_log.agent_name
        )

        return metrics

    def _evaluate_execution_time(
        self,
        execution_time_ms: int,
        agent_name: str
    ) -> float:
        """실행 시간 평가"""
        # 에이전트 유형별 목표 시간
        target_times = {
            'KPIAgent': 1000,
            'RiskAgent': 1000,
            'EventDetectionAgent': 1000,
            'ProcessMonitoringAgent': 1500,
            'ForecastAgent': 5000,
            'VarianceAgent': 3000,
            'RootCauseAgent': 3000,
            'ScenarioAgent': 5000,
            'RecommendationAgent': 2000,
            'ApprovalAdvisorAgent': 1500,
            'AlertAgent': 1000,
            'EvaluationAgent': 2000,
            'ReflectionAgent': 1000,
        }

        target = target_times.get(agent_name, 2000)

        if execution_time_ms <= target:
            return 1.0
        elif execution_time_ms <= target * 2:
            return 0.7
        elif execution_time_ms <= target * 5:
            return 0.4
        else:
            return 0.1

    def _evaluate_output_quality(
        self,
        output_data: Dict[str, Any],
        agent_name: str
    ) -> float:
        """출력 품질 평가"""
        if not output_data:
            return 0.0

        score = 0.0

        # 결과 존재
        if output_data.get('data') or output_data.get('result'):
            score += 0.3

        # 증거 존재
        evidence_refs = output_data.get('evidence_refs', [])
        if evidence_refs:
            score += min(len(evidence_refs) * 0.1, 0.4)

        # 추천사항 존재
        if output_data.get('recommendations') or output_data.get('data', {}).get('recommendations'):
            score += 0.2

        # 에러 없음
        if not output_data.get('errors'):
            score += 0.1

        return min(score, 1.0)

    def _calculate_overall_score(
        self,
        metrics: Dict[str, Any],
        weights: Dict[str, float]
    ) -> float:
        """종합 점수 계산"""
        overall = (
            (1.0 if metrics['success'] else 0.0) * weights['success'] +
            metrics['execution_time_score'] * weights['execution_time'] +
            metrics['confidence_score'] * weights['confidence'] +
            metrics['evidence_score'] * weights['evidence'] +
            metrics['output_quality_score'] * weights['output_quality']
        )
        return round(overall, 3)

    def _determine_grade(self, score: float) -> str:
        """등급 결정"""
        if score >= 0.9:
            return 'A'
        elif score >= 0.8:
            return 'B'
        elif score >= 0.7:
            return 'C'
        elif score >= 0.6:
            return 'D'
        else:
            return 'F'

    def _determine_aggregate_grade(self, metrics: Dict[str, Any]) -> str:
        """집계 등급 결정"""
        score = 0.0
        score += metrics['success_rate'] * 0.4
        score += (1.0 - min(metrics['avg_execution_time_ms'] / 5000, 1.0)) * 0.2
        score += metrics['avg_confidence'] * 0.2
        score += metrics['evidence_rate'] * 0.2

        return self._determine_grade(score)

    def _generate_evaluation_notes(
        self,
        metrics: Dict[str, Any],
        run_log: AgentRunLog
    ) -> List[str]:
        """평가 노트 생성"""
        notes = []

        if not metrics['success']:
            notes.append('에이전트 실행 실패')
        else:
            notes.append('에이전트 실행 성공')

        if metrics['execution_time_score'] < 0.5:
            notes.append('실행 시간이 목표를 초과함')

        if metrics['confidence_score'] < 0.7:
            notes.append('신뢰도가 낮음')

        if not metrics['has_evidence']:
            notes.append('근거 참조가 없음')

        if metrics['output_quality_score'] < 0.5:
            notes.append('출력 품질 개선 필요')

        if len(notes) == 1:
            notes.append('우수한 실행 결과')

        return notes

    def _generate_aggregate_recommendations(
        self,
        metrics: Dict[str, Any]
    ) -> List[str]:
        """집계 추천사항 생성"""
        recommendations = []

        if metrics['success_rate'] < 0.8:
            recommendations.append('에이전트 안정성 개선 필요')

        if metrics['avg_execution_time_ms'] > 3000:
            recommendations.append('실행 시간 최적화 권장')

        if metrics['avg_confidence'] < 0.7:
            recommendations.append('신뢰도 향상 방안 모색 필요')

        if metrics['evidence_rate'] < 0.5:
            recommendations.append('증거 기반 결과 생성 강화')

        if not recommendations:
            recommendations.append('현재 성능 유지')

        return recommendations

    def _analyze_trends(self, daily_metrics: List[Dict[str, Any]]) -> Dict[str, str]:
        """추세 분석"""
        if len(daily_metrics) < 3:
            return {'insufficient_data': '추세 분석을 위한 데이터 부족'}

        # 최근 3일과 이전 3일 비교
        recent = daily_metrics[-3:] if len(daily_metrics) >= 3 else daily_metrics
        previous = daily_metrics[-6:-3] if len(daily_metrics) >= 6 else daily_metrics[:-len(recent)]

        if not previous:
            return {'insufficient_data': '이전 데이터 부족'}

        recent_success_rate = sum(d['success_rate'] for d in recent) / len(recent)
        previous_success_rate = sum(d['success_rate'] for d in previous) / len(previous)

        recent_time = sum(d['avg_execution_time'] for d in recent) / len(recent)
        previous_time = sum(d['avg_execution_time'] for d in previous) / len(previous)

        trends = {}

        # 성공률 추세
        if recent_success_rate > previous_success_rate + 0.05:
            trends['success_rate'] = 'improving'
        elif recent_success_rate < previous_success_rate - 0.05:
            trends['success_rate'] = 'declining'
        else:
            trends['success_rate'] = 'stable'

        # 실행 시간 추세
        if recent_time < previous_time * 0.9:
            trends['execution_time'] = 'improving'
        elif recent_time > previous_time * 1.1:
            trends['execution_time'] = 'declining'
        else:
            trends['execution_time'] = 'stable'

        return trends

    def _save_evaluation(
        self,
        run_log: AgentRunLog,
        overall_score: float,
        evaluation_notes: List[str]
    ) -> None:
        """평가 결과 저장"""
        run_log.evaluated = True
        run_log.evaluation_score = overall_score
        run_log.evaluation_note = '; '.join(evaluation_notes)
        run_log.save(update_fields=['evaluated', 'evaluation_score', 'evaluation_note'])


# 헬퍼 함수
def evaluate_agent_run(run_id: str) -> Dict[str, Any]:
    """에이전트 실행 평가 헬퍼 함수"""
    from ai.agents.learning.evaluation_agent import EvaluationAgent
    from ai.agents.base.agent import AgentInput

    agent = EvaluationAgent()
    input_data = AgentInput(
        context={'evaluation_type': 'single'},
        parameters={'run_id': run_id}
    )
    output = agent.run(input_data)
    return output.data


def get_agent_performance(agent_name: str, days: int = 7) -> Dict[str, Any]:
    """에이전트 성능 조회 헬퍼 함수"""
    from ai.agents.learning.evaluation_agent import EvaluationAgent
    from ai.agents.base.agent import AgentInput

    agent = EvaluationAgent()
    input_data = AgentInput(
        context={'evaluation_type': 'aggregate'},
        parameters={'agent_name': agent_name, 'time_range_days': days}
    )
    output = agent.run(input_data)
    return output.data
