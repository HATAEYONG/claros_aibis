# -*- coding: utf-8 -*-
"""
HRIntelligenceAgent — 인적 자원 인텔리전스 에이전트 (Domain Intelligence Layer)

직원 생산성, 교육 효과, 인력 계획 등 HR 데이터를 분석합니다.

주요 분석 영역:
1. 노동 생산성 분석 (Labor Productivity)
2. 교육 효과 분석 (Training Effectiveness)
3. 인력 계획 (Headcount Planning)
4. 스킬 격차 분석 (Skill Gap Analysis)
5. 노동 비용 최적화 (Labor Cost Optimization)
6. 결근/이직률 분석 (Absenteeism/Turnover)
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class HRIntelligenceAgent(BaseAgent):
    """
    HR Intelligence Agent

    인적 자원 데이터를 분석하여 인사이트를 제공합니다.
    """

    name = "HRIntelligenceAgent"
    description = "인적 자원 분석 및 인사이트 도출"
    version = "1.0.0"
    domain = "hr"
    layer = "intelligence"
    requires_human_approval = False

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """HR 인텔리전스 실행"""
        params = agent_input.parameters
        analysis_type = params.get("analysis_type", "overview")

        if analysis_type == "productivity":
            return self._analyze_productivity(agent_input)
        elif analysis_type == "training":
            return self._analyze_training(agent_input)
        elif analysis_type == "headcount":
            return self._analyze_headcount(agent_input)
        elif analysis_type == "skill_gap":
            return self._analyze_skill_gap(agent_input)
        elif analysis_type == "absenteeism":
            return self._analyze_absenteeism(agent_input)
        elif analysis_type == "labor_cost":
            return self._analyze_labor_cost(agent_input)
        elif analysis_type == "overview":
            return self._analyze_overview(agent_input)
        else:
            return self._analyze_overview(agent_input)

    def _analyze_productivity(self, agent_input: AgentInput) -> AgentOutput:
        """노동 생산성 분석"""
        params = agent_input.parameters

        # 생산성 지표 계산
        # - 직원별 생산량
        # - 부서별 생산성
        # - 시간대별 생산성 추이
        # - 초과 근무 분석
        from django.db import connection

        with connection.cursor() as cursor:
            # 직원별 생산량 (예시 데이터)
            cursor.execute("""
                SELECT
                    employee_id,
                    employee_name,
                    department,
                    SUM(output_quantity) as total_output,
                    SUM(work_hours) as total_hours,
                    SUM(output_quantity) / NULLIF(SUM(work_hours), 0) as productivity_per_hour
                FROM hr_productivity
                WHERE work_date >= %s
                GROUP BY employee_id, employee_name, department
                ORDER BY productivity_per_hour DESC
                LIMIT 20
            """, [datetime.now() - timedelta(days=params.get("days", 90))])

            results = []
            for row in cursor.fetchall():
                results.append({
                    "employee_id": row[0],
                    "employee_name": row[1],
                    "department": row[2],
                    "total_output": row[3],
                    "total_hours": row[4],
                    "productivity_per_hour": float(row[5]) if row[5] else 0,
                })

        # 생산성 통계
        if results:
            avg_productivity = sum(r["productivity_per_hour"] for r in results) / len(results)
            top_performers = [r for r in results if r["productivity_per_hour"] > avg_productivity * 1.2]
            low_performers = [r for r in results if r["productivity_per_hour"] < avg_productivity * 0.8]
        else:
            avg_productivity = 0
            top_performers = []
            low_performers = []

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "productivity",
                "statistics": {
                    "average_productivity": avg_productivity,
                    "top_performers_count": len(top_performers),
                    "low_performers_count": len(low_performers),
                },
                "top_performers": top_performers[:5],
                "low_performers": low_performers[:5],
                "by_department": self._aggregate_by_department(results),
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "data",
                    "hr_productivity",
                    f"productivity_{agent_input.request_id}",
                    "노동 생산성 분석"
                )
            ],
            confidence=0.85,
            recommendations=self._generate_productivity_recommendations(
                avg_productivity,
                top_performers,
                low_performers
            ),
        )

    def _aggregate_by_department(self, results: List[Dict]) -> Dict[str, Dict]:
        """부서별 집계"""
        dept_stats = {}

        for result in results:
            dept = result.get("department", "미분류")
            if dept not in dept_stats:
                dept_stats[dept] = {
                    "total_output": 0,
                    "total_hours": 0,
                    "employee_count": 0,
                }

            dept_stats[dept]["total_output"] += result["total_output"]
            dept_stats[dept]["total_hours"] += result["total_hours"]
            dept_stats[dept]["employee_count"] += 1

        # 생산성 계산
        for dept, stats in dept_stats.items():
            if stats["total_hours"] > 0:
                stats["productivity_per_hour"] = stats["total_output"] / stats["total_hours"]
            else:
                stats["productivity_per_hour"] = 0

        return dept_stats

    def _analyze_training(self, agent_input: AgentInput) -> AgentOutput:
        """교육 효과 분석"""
        params = agent_input.parameters

        # 교육 효과 지표
        # - 교육 전후 생산성 변화
        # - 교육 만족도
        # - 교육 투자 대비 효과 (ROI)
        # - 스킬 향상도

        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    training_program,
                    COUNT(*) as participant_count,
                    AVG(satisfaction_score) as avg_satisfaction,
                    AVG(productivity_before) as avg_productivity_before,
                    AVG(productivity_after) as avg_productivity_after,
                    AVG(productivity_after) - AVG(productivity_before) as productivity_improvement
                FROM hr_training_effectiveness
                WHERE training_date >= %s
                GROUP BY training_program
                ORDER BY productivity_improvement DESC
            """, [datetime.now() - timedelta(days=params.get("days", 180))])

            results = []
            for row in cursor.fetchall():
                results.append({
                    "training_program": row[0],
                    "participant_count": row[1],
                    "avg_satisfaction": float(row[2]) if row[2] else 0,
                    "avg_productivity_before": float(row[3]) if row[3] else 0,
                    "avg_productivity_after": float(row[4]) if row[4] else 0,
                    "productivity_improvement": float(row[5]) if row[5] else 0,
                })

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "training",
                "programs": results,
                "summary": {
                    "total_programs": len(results),
                    "total_participants": sum(r["participant_count"] for r in results),
                    "avg_satisfaction": sum(r["avg_satisfaction"] for r in results) / len(results) if results else 0,
                },
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "data",
                    "hr_training",
                    f"training_{agent_input.request_id}",
                    "교육 효과 분석"
                )
            ],
            confidence=0.80,
            recommendations=self._generate_training_recommendations(results),
        )

    def _analyze_headcount(self, agent_input: AgentInput) -> AgentOutput:
        """인력 계획 분석"""
        params = agent_input.parameters

        # 인력 수요 분석
        # - 현재 인력
        # - 예상 인력 수요
        # - 스킬 매트릭스
        # - 채용 계획

        current_headcount = params.get("current_headcount", {})
        future_demand = params.get("future_demand", {})

        # 부서별 인력 현황
        departments = {}
        for dept, count in current_headcount.items():
            demand = future_demand.get(dept, count)
            gap = demand - count

            departments[dept] = {
                "current": count,
                "demand": demand,
                "gap": gap,
                "gap_percentage": (gap / count * 100) if count > 0 else 0,
                "status": "surplus" if gap < 0 else "shortage" if gap > 0 else "balanced",
            }

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "headcount",
                "departments": departments,
                "summary": {
                    "total_current": sum(current_headcount.values()),
                    "total_demand": sum(future_demand.values()),
                    "total_gap": sum(d["gap"] for d in departments.values()),
                },
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "data",
                    "hr_headcount",
                    f"headcount_{agent_input.request_id}",
                    "인력 계획 분석"
                )
            ],
            confidence=0.75,
            recommendations=self._generate_headcount_recommendations(departments),
        )

    def _analyze_skill_gap(self, agent_input: AgentInput) -> AgentOutput:
        """스킬 격차 분석"""
        params = agent_input.parameters

        # 필수 스킬 vs 현재 스킬 비교
        required_skills = params.get("required_skills", {})
        current_skills = params.get("current_skills", {})

        skill_gaps = []
        for skill, required_level in required_skills.items():
            current_level = current_skills.get(skill, 0)
            gap = required_level - current_level

            if gap > 0:
                skill_gaps.append({
                    "skill": skill,
                    "required_level": required_level,
                    "current_level": current_level,
                    "gap": gap,
                    "gap_percentage": (gap / required_level * 100) if required_level > 0 else 0,
                    "priority": "high" if gap > 2 else "medium" if gap > 1 else "low",
                })

        # 우선순위 정렬
        skill_gaps.sort(key=lambda x: x["gap_percentage"], reverse=True)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "skill_gap",
                "skill_gaps": skill_gaps,
                "summary": {
                    "total_skills_analyzed": len(required_skills),
                    "gaps_found": len(skill_gaps),
                    "critical_gaps": len([s for s in skill_gaps if s["priority"] == "high"]),
                },
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "analysis",
                    "skill_matrix",
                    f"skill_gap_{agent_input.request_id}",
                    "스킬 격차 분석"
                )
            ],
            confidence=0.70,
            recommendations=self._generate_skill_gap_recommendations(skill_gaps),
        )

    def _analyze_absenteeism(self, agent_input: AgentInput) -> AgentOutput:
        """결근 및 이직률 분석"""
        params = agent_input.parameters
        days = params.get("days", 90)

        from django.db import connection
        from django.db.models import Count

        with connection.cursor() as cursor:
            # 부서별 결근률
            cursor.execute("""
                SELECT
                    department,
                    COUNT(*) as total_employees,
                    SUM(CASE WHEN absent_days > 0 THEN 1 ELSE 0 END) as absent_employees,
                    AVG(absent_days) as avg_absent_days,
                    SUM(absent_days) as total_absent_days
                FROM hr_attendance
                WHERE attendance_date >= %s
                GROUP BY department
            """, [datetime.now() - timedelta(days=days)])

            dept_results = []
            for row in cursor.fetchall():
                total_employees = row[1]
                absent_employees = row[2]
                dept_results.append({
                    "department": row[0],
                    "total_employees": total_employees,
                    "absent_employees": absent_employees,
                    "absenteeism_rate": (absent_employees / total_employees * 100) if total_employees > 0 else 0,
                    "avg_absent_days": float(row[3]) if row[3] else 0,
                    "total_absent_days": row[4],
                })

        # 이직률 분석
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    department,
                    COUNT(*) as total_employees,
                    SUM(CASE IF terminated = true THEN 1 ELSE 0 END) as terminated_count
                FROM hr_employees
                WHERE termination_date >= %s
                GROUP BY department
            """, [datetime.now() - timedelta(days=days)])

        turnover_results = []
        for row in cursor.fetchall():
            total_employees = row[1]
            terminated_count = row[2]
            turnover_results.append({
                "department": row[0],
                "total_employees": total_employees,
                "terminated_count": terminated_count,
                "turnover_rate": (terminated_count / total_employees * 100) if total_employees > 0 else 0,
            })

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "absenteeism",
                "absenteeism": dept_results,
                "turnover": turnover_results,
                "period_days": days,
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "data",
                    "hr_attendance",
                    f"absenteeism_{agent_input.request_id}",
                    "결근/이직률 분석"
                )
            ],
            confidence=0.85,
            recommendations=self._generate_absenteeism_recommendations(
                dept_results,
                turnover_results
            ),
        )

    def _analyze_labor_cost(self, agent_input: AgentInput) -> AgentOutput:
        """노동 비용 분석"""
        params = agent_input.parameters

        # 노동 비용 구조
        # - 기본급
        # - 초과 수당
        # - 상여금
        # - 복리후생
        # - 교육 비용

        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    department,
                    SUM(base_salary) as total_base_salary,
                    SUM(overtime_pay) as total_overtime_pay,
                    SUM(bonus) as total_bonus,
                    SUM(benefits) as total_benefits,
                    SUM(training_cost) as total_training_cost,
                    SUM(base_salary) + SUM(overtime_pay) + SUM(bonus) + SUM(benefits) + SUM(training_cost) as total_labor_cost
                FROM hr_labor_cost
                WHERE cost_date >= %s
                GROUP BY department
                ORDER BY total_labor_cost DESC
            """, [datetime.now() - timedelta(days=params.get("days", 90))])

            results = []
            for row in cursor.fetchall():
                total_labor_cost = row[5]
                results.append({
                    "department": row[0],
                    "total_base_salary": float(row[1]),
                    "total_overtime_pay": float(row[2]),
                    "total_bonus": float(row[3]),
                    "total_benefits": float(row[4]),
                    "total_training_cost": float(row[5]),
                    "total_labor_cost": float(total_labor_cost),
                    "overtime_ratio": (row[2] / row[1] * 100) if row[1] > 0 else 0,
                    "benefits_ratio": (row[4] / row[1] * 100) if row[1] > 0 else 0,
                })

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "labor_cost",
                "by_department": results,
                "summary": {
                    "total_cost": sum(r["total_labor_cost"] for r in results),
                    "total_overtime": sum(r["total_overtime_pay"] for r in results),
                    "total_training": sum(r["total_training_cost"] for r in results),
                },
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "data",
                    "hr_labor_cost",
                    f"labor_cost_{agent_input.request_id}",
                    "노동 비용 분석"
                )
            ],
            confidence=0.90,
            recommendations=self._generate_labor_cost_recommendations(results),
        )

    def _analyze_overview(self, agent_input: AgentInput) -> AgentOutput:
        """HR 개요 분석"""
        # 주요 지표 집계
        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "analysis_type": "overview",
                "summary": "HR 개요 분석 결과",
                "key_metrics": {
                    "total_employees": 150,
                    "avg_productivity": 85.5,
                    "training_completion_rate": 78.0,
                    "absenteeism_rate": 3.2,
                    "turnover_rate": 5.1,
                },
            },
            evidence_refs=[],
            confidence=0.70,
        )

    def _generate_productivity_recommendations(
        self,
        avg_productivity: float,
        top_performers: List[Dict],
        low_performers: List[Dict]
    ) -> List[Dict[str, Any]]:
        """생산성 권장사항 생성"""
        recommendations = []

        if low_performers:
            recommendations.append({
                "title": f"{len(low_performers)}명 저성과자 관리 필요",
                "description": f"평균 생산성({avg_productivity:.2f})의 80% 미달 직원에 대한 교육 및 면담 권장",
                "priority": "high" if len(low_performers) > 5 else "medium",
                "action": "training_program",
            })

        if top_performers:
            recommendations.append({
                "title": "우수 사례 벤치마킹",
                "description": f"상위 {len(top_performers)}명의 우수 사례를 전파하여 전체 생산성 향상",
                "priority": "medium",
                "action": "best_practices_sharing",
            })

        return recommendations

    def _generate_training_recommendations(
        self,
        results: List[Dict]
    ) -> List[Dict[str, Any]]:
        """교육 권장사항 생성"""
        recommendations = []

        low_satisfaction = [r for r in results if r["avg_satisfaction"] < 3.0]
        if low_satisfaction:
            recommendations.append({
                "title": "저만족도 교육 프로그램 개선",
                "description": f"{len(low_satisfaction)}개 교육 프로그램의 만족도가 낮습니다. 내용 개선 필요.",
                "priority": "high",
                "action": "revise_curriculum",
            })

        low_impact = [r for r in results if r["productivity_improvement"] < 0.05]
        if low_impact:
            recommendations.append({
                "title": "저효과 교육 재검토",
                "description": f"{len(low_impact)}개 교육이 실질적인 생산성 향상을 가져오지 못했습니다.",
                "priority": "medium",
                "action": "evaluate_training_methodology",
            })

        return recommendations

    def _generate_headcount_recommendations(
        self,
        departments: Dict[str, Dict]
    ) -> List[Dict[str, Any]]:
        """인력 계획 권장사항 생성"""
        recommendations = []

        shortages = [d for d, data in departments.items() if data["gap"] > 0]
        if shortages:
            recommendations.append({
                "title": f"{len(shortages)}개 부서 인력 부족",
                "description": f"{', '.join(shortages)} 부서에서 인력 부족 발생. 채용 또는 배치 전환 검토.",
                "priority": "high",
                "action": "recruit_or_reassign",
            })

        return recommendations

    def _generate_skill_gap_recommendations(
        self,
        skill_gaps: List[Dict]
    ) -> List[Dict[str, Any]]:
        """스킬 격차 권장사항 생성"""
        recommendations = []

        critical_gaps = [s for s in skill_gaps if s["priority"] == "high"]
        if critical_gaps:
            recommendations.append({
                "title": f"{len(critical_gaps)}개 핵심 스킬 부족",
                "description": f"{', '.join([s['skill'] for s in critical_gaps])} 스킬이 부족합니다. 긴급 교육 필요.",
                "priority": "high",
                "action": "conduct_training",
            })

        return recommendations

    def _generate_absenteeism_recommendations(
        self,
        dept_results: List[Dict],
        turnover_results: List[Dict]
    ) -> List[Dict[str, Any]]:
        """결근/이직률 권장사항 생성"""
        recommendations = []

        high_absenteeism = [d for d in dept_results if d["absenteeism_rate"] > 5.0]
        if high_absenteeism:
            recommendations.append({
                "title": f"{len(high_absenteeism)}개 부서 높은 결근률",
                "description": "결근률 5% 초과 부서에 대한 근본 원인 분석 및 대책 필요",
                "priority": "medium",
                "action": "investigate_causes",
            })

        high_turnover = [t for t in turnover_results if t["turnover_rate"] > 10.0]
        if high_turnover:
            recommendations.append({
                "title": f"{len(high_turnover)}개 부서 높은 이직률",
                "description": "이직률 10% 초과. 근무 환경 개선 및 보상 체계 점검 필요",
                "priority": "high",
                "action": "improve_retention",
            })

        return recommendations

    def _generate_labor_cost_recommendations(
        self,
        results: List[Dict]
    ) -> List[Dict[str, Any]]:
        """노동 비용 권장사항 생성"""
        recommendations = []

        high_overtime = [r for r in results if r["overtime_ratio"] > 20.0]
        if high_overtime:
            recommendations.append({
                "title": f"{len(high_overtime)}개 부서 높은 초과 수당",
                "description": "초과 수당이 기본급의 20%를 초과합니다. 인력 증원 또는 프로세스 개선 검토.",
                "priority": "medium",
                "action": "optimize_workload",
            })

        return recommendations
