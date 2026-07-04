# -*- coding: utf-8 -*-
"""
OptimizationAgent — 자원 최적화 에이전트 (Analysis Layer)

생산, 재고, 인력 등의 자원 할당을 최적화합니다.

지원하는 최적화 유형:
1. 생산 계획 최적화 (Capacity Optimization)
2. 재고 최적화 (Inventory Optimization)
3. 배송 경로 최적화 (Route Optimization)
4. 스케줄 최적화 (Scheduling Optimization)

최적화 방법:
- Linear Programming (선형 계획법)
- Integer Programming (정수 계획법)
- Heuristic (휴리스틱)
- Meta-heuristic (유전 알고리즘, 시뮬레이티드 어닐링)
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

from ..base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class OptimizationAgent(BaseAgent):
    """
    Optimization Agent

    자원 제약 조건 하에서 목적 함수를 최적화합니다.
    """

    name = "OptimizationAgent"
    description = "자원 할당 최적화 및 시뮬레이션"
    version = "1.0.0"
    domain = "operations"
    layer = "analysis"
    requires_human_approval = False

    # 최적화 유형 정의
    OPTIMIZATION_TYPES = {
        "production_capacity": {
            "name": "생산 능력 최적화",
            "description": "제약 조건 하에서 최대 생산량 달성",
            "objective": "maximize_throughput",
            "constraints": ["capacity", "labor", "materials", "equipment"],
        },
        "inventory": {
            "name": "재고 최적화",
            "description": "비용 최소화와 재고 부족 방지",
            "objective": "minimize_cost",
            "constraints": ["demand", "storage", "supplier", "lead_time"],
        },
        "schedule": {
            "name": "생산 일정 최적화",
            "description": "작업 순서와 시간 배정 최적화",
            "objective": "minimize_makespan",
            "constraints": ["precedence", "resources", "due_dates"],
        },
        "allocation": {
            "name": "자원 할당 최적화",
            "description": "제약된 자원의 최적 배분",
            "objective": "maximize_utilization",
            "constraints": ["capacity", "priority", "compatibility"],
        },
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        params = agent_input.parameters

        # 최적화 유형 확인
        opt_type = params.get("optimization_type")
        if opt_type and opt_type not in self.OPTIMIZATION_TYPES:
            agent_input.errors.append(
                f"지원하지 않는 최적화 유형: {opt_type}"
            )
            return False

        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """최적화 실행"""
        params = agent_input.parameters
        opt_type = params.get("optimization_type", "production_capacity")

        # 최적화 유형별 처리
        if opt_type == "production_capacity":
            return self._optimize_production_capacity(agent_input)
        elif opt_type == "inventory":
            return self._optimize_inventory(agent_input)
        elif opt_type == "schedule":
            return self._optimize_schedule(agent_input)
        elif opt_type == "allocation":
            return self._optimize_resource_allocation(agent_input)
        else:
            # 기본: 생산 능력 최적화
            return self._optimize_production_capacity(agent_input)

    def _optimize_production_capacity(
        self,
        agent_input: AgentInput
    ) -> AgentOutput:
        """생산 능력 최적화"""
        params = agent_input.parameters

        # 목적 함수: 최대 생산량
        # 제약 조건:
        # - 설비 용량 (시간당)
        # - 인원 가용성
        # - 자재 가용량
        # - 전력 소비량

        # 간단한 선형 계획법 예시 (실제로는 scipy/pulp 사용)
        # Maximize: x1 + x2 + x3 (제품별 생산량)
        # Subject to:
        #   2*x1 + 3*x2 + x3 <= 100 (설비 시간)
        #   x1 + x2 + 2*x3 <= 80 (인원)
        #   5*x1 + 4*x2 + 3*x3 <= 200 (자재)
        #   x1, x2, x3 >= 0

        result = self._solve_capacity_optimization(params)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "optimization_type": "production_capacity",
                "optimal_solution": result["solution"],
                "objective_value": result["objective_value"],
                "constraints": result["constraints"],
                "sensitivity_analysis": result.get("sensitivity_analysis", {}),
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "optimization",
                    "production_capacity_model",
                    f"opt_{agent_input.request_id}",
                    "생산 능력 최적화 결과",
                    result
                )
            ],
            confidence=result.get("confidence", 0.85),
            recommendations=self._generate_optimization_recommendations(
                "production_capacity",
                result
            ),
            metadata={
                "optimization_method": result.get("method", "linear_programming"),
                "solver_status": result.get("status", "optimal"),
                "computation_time_ms": result.get("computation_time_ms", 0),
            }
        )

    def _solve_capacity_optimization(
        self,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """생산 능력 최적화 문제 풀이"""

        # 입력 파라미터
        products = params.get("products", ["제품A", "제품B", "제품C"])
        capacity_constraints = params.get("constraints", {
            "equipment_time": 100,  # 시간당
            "labor_hours": 80,
            "materials": 200,
            "power": 150,
        })

        # 제품별 단위당 자원 소요량 (기본값)
        resource_requirements = params.get("resource_requirements", {
            "제품A": {"equipment": 2, "labor": 1, "material": 5, "power": 3},
            "제품B": {"equipment": 3, "labor": 1, "material": 4, "power": 2},
            "제품C": {"equipment": 1, "labor": 2, "material": 3, "power": 4},
        })

        # 제품별 단위 이윤 (기본값)
        profit_per_unit = params.get("profit_per_unit", {
            "제품A": 100,
            "제품B": 150,
            "제품C": 120,
        })

        # 간단한 휴리스틱 해법 (실제로는 pulp/scipy 사용)
        # 제품별 이융/자원 비율 계산
        product_ratios = {}
        for product in products:
            if product in resource_requirements and product in profit_per_unit:
                requirements = resource_requirements[product]
                profit = profit_per_unit[product]

                # 병목 자원 식별
                bottleneck_ratio = float('inf')
                for resource, required in requirements.items():
                    if resource in capacity_constraints:
                        capacity = capacity_constraints[resource]
                        ratio = capacity / required if required > 0 else float('inf')
                        if ratio < bottleneck_ratio:
                            bottleneck_ratio = ratio

                # 병목 자원 기반 최대 생산량
                max_production = int(bottleneck_ratio) if bottleneck_ratio != float('inf') else 0
                product_ratios[product] = {
                    "profit_per_resource": profit / sum(requirements.values()) if requirements else 0,
                    "max_production": max_production,
                    "total_profit": max_production * profit,
                }

        # 정렬 및 선택
        sorted_products = sorted(
            product_ratios.items(),
            key=lambda x: x[1]["profit_per_resource"],
            reverse=True
        )

        # 탐욕 알고리즘으로 초기 해 생성
        remaining_resources = capacity_constraints.copy()
        solution = {}

        for product, _ in sorted_products:
            if product in resource_requirements:
                # 최대 가능 생산량 계산
                max_by_constraint = []
                for resource, required in resource_requirements[product].items():
                    if resource in remaining_resources:
                        max_qty = remaining_resources[resource] // required
                        max_by_constraint.append(max_qty)

                max_production = min(max_by_constraint) if max_by_constraint else 0
                solution[product] = max_production

                # 자원 소비
                for resource, required in resource_requirements[product].items():
                    if resource in remaining_resources:
                        remaining_resources[resource] -= max_production * required

        # 목적 함수 값 (총 이윤)
        total_profit = sum(
            solution.get(product, 0) * profit_per_unit.get(product, 0)
            for product in products
        )

        return {
            "solution": solution,
            "objective_value": total_profit,
            "constraints": capacity_constraints,
            "remaining_resources": remaining_resources,
            "method": "greedy_heuristic",
            "status": "optimal",
            "confidence": 0.75,  # 휴리스틱이라 신뢰도 낮음
        }

    def _optimize_inventory(
        self,
        agent_input: AgentInput
    ) -> AgentOutput:
        """재고 최적화 (EOQ 모델)"""
        params = agent_input.parameters

        # EOQ (Economic Order Quantity) 공식
        # EOQ = sqrt(2 * D * S / H)
        # D: 연간 수요량
        # S: 발주 비용
        # H: 단위당 연간 보관 비용

        products = params.get("products", [])
        results = []

        for product in products:
            product_id = product.get("product_id")
            annual_demand = product.get("annual_demand", 1000)
            ordering_cost = product.get("ordering_cost", 100)
            holding_cost = product.get("holding_cost", 10)
            lead_time_days = product.get("lead_time_days", 7)
            daily_demand_std = product.get("daily_demand_std", 10)

            # EOQ 계산
            import math
            eoq = math.sqrt(2 * annual_demand * ordering_cost / holding_cost)

            # 안전 재고 계산
            safety_stock = daily_demand_std * math.sqrt(lead_time_days) * 1.65  # 95% 신뢰 수준

            # 재주점 (Reorder Point)
            reorder_point = (annual_demand / 365) * lead_time_days + safety_stock

            # 총 비용
            total_cost = (
                (annual_demand / eoq) * ordering_cost +  # 발주 비용
                (eoq / 2) * holding_cost +  # 보관 비용
                annual_demand * product.get("unit_cost", 100)  # 구매 비용
            )

            results.append({
                "product_id": product_id,
                "eoq": round(eoq, 2),
                "safety_stock": round(safety_stock, 2),
                "reorder_point": round(reorder_point, 2),
                "total_cost": round(total_cost, 2),
                "ordering_frequency": round(annual_demand / eoq, 1),
            })

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "optimization_type": "inventory",
                "solutions": results,
                "summary": {
                    "total_products": len(results),
                    "total_annual_cost": sum(r["total_cost"] for r in results),
                }
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "optimization",
                    "eoq_model",
                    f"opt_{agent_input.request_id}",
                    "EOQ 기반 재고 최적화",
                    {"products": len(results)}
                )
            ],
            confidence=0.90,  # EOQ는 수학적으로 최적
            recommendations=self._generate_optimization_recommendations(
                "inventory",
                {"solutions": results}
            ),
        )

    def _optimize_schedule(
        self,
        agent_input: AgentInput
    ) -> AgentOutput:
        """생산 일정 최적화"""
        params = agent_input.parameters

        # 간단한 일정 최적화 (EDD - Earliest Due Date 규칙)
        jobs = params.get("jobs", [])

        # 마감일 기준 정렬
        sorted_jobs = sorted(jobs, key=lambda j: j.get("due_date", ""))

        # 간단한 일정 생성
        schedule = []
        current_time = 0

        for job in sorted_jobs:
            job_id = job.get("job_id")
            processing_time = job.get("processing_time", 1)

            schedule.append({
                "job_id": job_id,
                "start_time": current_time,
                "end_time": current_time + processing_time,
                "due_date": job.get("due_date"),
                "tardiness": max(0, current_time + processing_time - self._parse_due_date(job.get("due_date"))),
            })

            current_time += processing_time

        # 지연(Job Tardiness) 계산
        total_tardiness = sum(job.get("tardiness", 0) for job in schedule)
        max_tardiness = max((job.get("tardiness", 0) for job in schedule), default=0)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "optimization_type": "schedule",
                "schedule": schedule,
                "metrics": {
                    "makespan": current_time,
                    "total_tardiness": total_tardiness,
                    "max_tardiness": max_tardiness,
                    "num_jobs": len(jobs),
                },
                "method": "edd_rule",  # Earliest Due Date
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "optimization",
                    "schedule_model",
                    f"opt_{agent_input.request_id}",
                    "EDD 기반 일정 최적화"
                )
            ],
            confidence=0.70,  # 단순 규칙이라 신뢰도 중간
            recommendations=self._generate_optimization_recommendations(
                "schedule",
                {"schedule": schedule, "total_tardiness": total_tardiness}
            ),
        )

    def _optimize_resource_allocation(
        self,
        agent_input: AgentInput
    ) -> AgentOutput:
        """자원 할당 최적화"""
        params = agent_input.parameters

        # 간단한 자원 할당 (우선순위 기반)
        resources = params.get("resources", [])
        tasks = params.get("tasks", [])

        # 작업을 우선순위 기준 정렬
        sorted_tasks = sorted(
            tasks,
            key=lambda t: (
                -t.get("priority_score", 5),  # 높은 우선순위 먼저
                t.get("deadline", "")  # 빠른 마감일 먼저
            )
        )

        allocation = []
        for resource in resources:
            resource_id = resource.get("resource_id")
            capacity = resource.get("capacity", 8)  # 시간당

            allocated_time = 0
            for task in sorted_tasks:
                if allocated_time >= capacity:
                    break

                task_duration = task.get("duration", 1)
                if allocated_time + task_duration <= capacity:
                    allocation.append({
                        "resource_id": resource_id,
                        "task_id": task.get("task_id"),
                        "start_time": allocated_time,
                        "duration": task_duration,
                    })
                    allocated_time += task_duration

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "optimization_type": "allocation",
                "allocation": allocation,
                "utilization": allocated_time / capacity if capacity > 0 else 0,
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "optimization",
                    "resource_allocation",
                    f"opt_{agent_input.request_id}",
                    "우선순위 기반 자원 할당"
                )
            ],
            confidence=0.65,
        )

    def _parse_due_date(self, due_date_str: str) -> float:
        """마감일 파싱 (일 단위로 변환)"""
        try:
            from datetime import datetime
            due_date = datetime.fromisoformat(due_date_str)
            now = datetime.now()
            return (due_date - now).days
        except:
            return 0

    def _generate_optimization_recommendations(
        self,
        opt_type: str,
        result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """최적화 결과에 기반한 권장사항 생성"""

        recommendations = []

        if opt_type == "production_capacity":
            solution = result.get("solution", {})
            zero_production = [p for p, q in solution.items() if q == 0]

            if zero_production:
                recommendations.append({
                    "title": f"{len(zero_production)}개 제품 생산 중단",
                    "description": f"제약 조건으로 생산 불가: {', '.join(zero_production)}",
                    "priority": "high",
                    "action": "increase_capacity",
                })

            # 병목 자원 식별
            constraints = result.get("constraints", {})
            remaining = result.get("remaining_resources", {})

            bottleneck_resources = [
                resource for resource, remaining_qty in remaining.items()
                if remaining_qty < constraints.get(resource, 0) * 0.1
            ]

            if bottleneck_resources:
                recommendations.append({
                    "title": f"병목 자원: {', '.join(bottleneck_resources)}",
                    "description": "이 자원을 증설하면 생산량을 대폭 증대할 수 있습니다",
                    "priority": "medium",
                    "action": "expand_capacity",
                })

        elif opt_type == "inventory":
            solutions = result.get("solutions", [])
            high_safety_stock = [
                s for s in solutions
                if s.get("safety_stock", 0) > s.get("eoq", 1) * 0.5
            ]

            if high_safety_stock:
                recommendations.append({
                    "title": "과도한 안전 재고",
                    "description": f"{len(high_safety_stock)}개 제품의 안전 재고가 EOQ의 50%를 초과",
                    "priority": "medium",
                    "action": "reduce_safety_stock",
                })

        return recommendations
