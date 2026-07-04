# -*- coding: utf-8 -*-
"""
Prompt Template Management System
LLM 프롬프트 템플릿 관리 및 변수 바인딩

주요 기능:
- 템플릿 정의 및 로드
- 변수 바인딩
- 멀티언어 지원
- 버전 관리
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime

from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class PromptVariable:
    """프롬프트 변수 정의"""
    name: str
    description: str
    type: str = "string"  # string, number, boolean, list, object
    required: bool = True
    default: Any = None
    examples: List[Any] = field(default_factory=list)


@dataclass
class PromptTemplate:
    """
    프롬프트 템플릿 클래스

    사용 예:
        template = PromptTemplate(
            name="analysis",
            template="다음 데이터를 분석해주세요: {data}",
            variables=[
                PromptVariable("data", "분석할 데이터", required=True)
            ]
        )
        result = template.format(data="매출 100억원")
    """
    name: str
    template: str
    description: str = ""
    version: str = "1.0.0"
    language: str = "ko"
    category: str = "general"
    variables: List[PromptVariable] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def format(self, **kwargs) -> str:
        """
        템플릿에 변수 바인딩

        Args:
            **kwargs: 변수 값들

        Returns:
            str: 바인딩된 프롬프트

        Raises:
            ValueError: 필수 변수가 누락된 경우
        """
        # 필수 변수 검증
        for var in self.variables:
            if var.required and var.name not in kwargs:
                if var.default is not None:
                    kwargs[var.name] = var.default
                else:
                    raise ValueError(f"필수 변수 누락: {var.name}")

        try:
            return self.template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"템플릿 변수 누락: {e}")
        except Exception as e:
            raise ValueError(f"템플릿 포맷팅 오류: {e}")

    def validate(self, **kwargs) -> tuple[bool, List[str]]:
        """
        변수 유효성 검증

        Args:
            **kwargs: 검증할 변수 값들

        Returns:
            tuple: (유효성, 오류 메시지 리스트)
        """
        errors = []

        for var in self.variables:
            # 필수 변수 확인
            if var.required and var.name not in kwargs:
                if var.default is None:
                    errors.append(f"필수 변수 누락: {var.name}")
                continue

            value = kwargs.get(var.name, var.default)

            # 타입 검증
            if var.type == "number" and not isinstance(value, (int, float)):
                errors.append(f"{var.name}: 숫자 타입 expected, got {type(value)}")
            elif var.type == "boolean" and not isinstance(value, bool):
                errors.append(f"{var.name}: 불리언 타입 expected, got {type(value)}")
            elif var.type == "list" and not isinstance(value, list):
                errors.append(f"{var.name}: 리스트 타입 expected, got {type(value)}")
            elif var.type == "object" and not isinstance(value, dict):
                errors.append(f"{var.name}: 객체 타입 expected, got {type(value)}")

        return len(errors) == 0, errors

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "name": self.name,
            "template": self.template,
            "description": self.description,
            "version": self.version,
            "language": self.language,
            "category": self.category,
            "variables": [
                {
                    "name": v.name,
                    "description": v.description,
                    "type": v.type,
                    "required": v.required,
                    "default": v.default,
                    "examples": v.examples,
                }
                for v in self.variables
            ],
            "metadata": self.metadata,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PromptTemplate":
        """딕셔너리에서 인스턴스 생성"""
        variables = [
            PromptVariable(**v) for v in data.get("variables", [])
        ]
        return cls(
            name=data["name"],
            template=data["template"],
            description=data.get("description", ""),
            version=data.get("version", "1.0.0"),
            language=data.get("language", "ko"),
            category=data.get("category", "general"),
            variables=variables,
            metadata=data.get("metadata", {}),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


class PromptTemplateRegistry:
    """
    프롬프트 템플릿 레지스트리

    템플릿을 중앙 관리하고 조회하는 클래스
    """

    def __init__(self):
        self._templates: Dict[str, PromptTemplate] = {}
        self._load_builtin_templates()

    def _load_builtin_templates(self):
        """기본 제공 템플릿 로드"""
        # 데이터 분석 템플릿
        self.register(PromptTemplate(
            name="data_analysis",
            description="데이터 분석 요청",
            category="analysis",
            template="""당신은 제조업 데이터 분석 전문가입니다.

다음 데이터를 분석하고 인사이트를 도출해주세요:

## 분석 대상 데이터
{data}

## 분석 요구사항
{requirements}

## 분석 결과 형식
1. 주요 발견사항
2. 데이터 기반 인사이트
3. 개선 권장사항
4. 추가 분석 필요사항

분석을 시작해주세요.""",
            variables=[
                PromptVariable("data", "분석할 데이터", required=True),
                PromptVariable("requirements", "분석 요구사항", default="종합 분석"),
            ]
        ))

        # Root Cause 분석 템플릿
        self.register(PromptTemplate(
            name="root_cause_analysis",
            description="근본 원인 분석",
            category="analysis",
            template="""당신은 제조업 품질 문제의 근본 원인 분석 전문가입니다.

## 문제 현황
{problem_description}

## 관련 데이터
- 불량률: {defect_rate}%
- 발생 일시: {occurrence_time}
- 영향 범위: {impact_scope}

## 4M2E 차원 분석 지침
1. Man (인적 요인): 교육, 숙련도, 피로도 등
2. Machine (설비 요인): 설비 노후화, 설정 오류 등
3. Material (자재 요인): 원료 품질, 배치 차이 등
4. Method (방법 요인): 공정 절차, 작업 표준 등
5. Environment (환경 요인): 온습도, 진동 등
6. Energy (에너지 요인): 전력 공급, 압력 등

분석 결과를 다음 형식으로 제출해주세요:
- 4M2E별 원인 요인 분석
- 각 요인별 영향도 점수 (0-100)
- 최종 근본 원인 규명 (상위 3개)
- 검증 가능한 가설 제시""",
            variables=[
                PromptVariable("problem_description", "문제 설명", required=True),
                PromptVariable("defect_rate", "불량률", type="number", default=0),
                PromptVariable("occurrence_time", "발생 시간", default=""),
                PromptVariable("impact_scope", "영향 범위", default=""),
            ]
        ))

        # 시나리오 분석 템플릿
        self.register(PromptTemplate(
            name="scenario_analysis",
            description="What-if 시나리오 분석",
            category="analysis",
            template="""당신은 제조업 시나리오 분석 전문가입니다.

## 현재 상태
{current_state}

## 시나리오 변수
{scenario_variables}

## 분석할 시나리오
{scenarios}

각 시나리오에 대해 다음을 분석해주세요:
1. 예상되는 영향 (매출, 비용, 생산량 등)
2. 리스크 요인
3. 실행 가능성
4. 추천 순위

분석 결과를 표 형식과 상세 설명으로 제출해주세요.""",
            variables=[
                PromptVariable("current_state", "현재 상태", required=True),
                PromptVariable("scenario_variables", "시나리오 변수", type="object", required=True),
                PromptVariable("scenarios", "분석할 시나리오 리스트", type="list", required=True),
            ]
        ))

        # 추천 생성 템플릿
        self.register(PromptTemplate(
            name="recommendation",
            description="개선 권장사항 생성",
            category="decision",
            template="""당신은 제조업 개선 컨설턴트입니다.

## 분석 결과
{analysis_result}

## 현황
- KPI: {kpi_name} = {current_value}
- 목표: {target_value}
- 격차: {gap}

## 제약조건
{constraints}

다음 형식으로 개선 권장사항을 제출해주세요:
1. 권장사항 제목
2. 예상 효과 (KPI 개선폭)
3. 실행 난이도 (1-5)
4. 소요 기간
5. 필요 리소스
6. 리스크
7. 우선순위 (높음/중간/낮음)""",
            variables=[
                PromptVariable("analysis_result", "분석 결과", required=True),
                PromptVariable("kpi_name", "KPI 명칭", required=True),
                PromptVariable("current_value", "현재 값", type="number", required=True),
                PromptVariable("target_value", "목표 값", type="number", required=True),
                PromptVariable("gap", "격차", type="number", required=True),
                PromptVariable("constraints", "제약조건", default=""),
            ]
        ))

        # 이벤트 요약 템플릿
        self.register(PromptTemplate(
            name="event_summary",
            description="이벤트 요약 및 우선순위",
            category="monitoring",
            template="""당신은 제조업 이벤트 모니터링 담당자입니다.

## 감지된 이벤트
{events}

## 우선순위 결정 기준
1. 재정적 영향
2. 안전/환경 영향
3. 생산 영향
4. 품질 영향
5. 고객 영향

다음 형식으로 요약해주세요:
1. 총 이벤트 수 및 유형별 분포
2. 상위 5개 우선순위 이벤트
3. 각 이벤트별 조치 요구사항
4. 추천 연계 에이전트""",
            variables=[
                PromptVariable("events", "이벤트 리스트", type="list", required=True),
            ]
        ))

        # 대화형 인터페이스 템플릿
        self.register(PromptTemplate(
            name="copilot_chat",
            description="Copilot 대화형 인터페이스",
            category="copilot",
            template="""당신은 유한산업의 AI Copilot입니다.

## 사용자 질문
{user_message}

## 관련 컨텍스트
{context}

## 대화 기록
{conversation_history}

도움말:
- 데이터 조회: "X 조회해줘"
- 분석 요청: "Y 분석해줘"
- 보고서: "Z 보고서 작성해줘"
- 도구 호출: 필요시 관련 도구 사용

친절하고 전문적으로 답변해주세요. 필요시 도구를 호출하여 정보를 가져올 수 있습니다.""",
            variables=[
                PromptVariable("user_message", "사용자 메시지", required=True),
                PromptVariable("context", "컨텍스트", default=""),
                PromptVariable("conversation_history", "대화 기록", default=""),
            ]
        ))

    def register(self, template: PromptTemplate):
        """템플릿 등록"""
        self._templates[template.name] = template
        logger.debug(f"프롬프트 템플릿 등록: {template.name}")

    def get(self, name: str) -> Optional[PromptTemplate]:
        """템플릿 조회"""
        return self._templates.get(name)

    def list(
        self,
        category: Optional[str] = None,
        language: str = "ko"
    ) -> List[PromptTemplate]:
        """템플릿 목록 조회"""
        templates = list(self._templates.values())
        if category:
            templates = [t for t in templates if t.category == category]
        templates = [t for t in templates if t.language == language]
        return templates

    def format(self, name: str, **kwargs) -> str:
        """템플릿 포맷팅"""
        template = self.get(name)
        if not template:
            raise ValueError(f"템플릿을 찾을 수 없습니다: {name}")
        return template.format(**kwargs)

    def export(self, filepath: str):
        """템플릿을 JSON 파일로 내보내기"""
        data = {
            "exported_at": datetime.now().isoformat(),
            "templates": [t.to_dict() for t in self._templates.values()]
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"템플릿 내보내기 완료: {filepath}")

    def import_from(self, filepath: str):
        """JSON 파일에서 템플릿 가져오기"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for template_data in data.get("templates", []):
            template = PromptTemplate.from_dict(template_data)
            self.register(template)
        logger.info(f"템플릿 가져오기 완료: {filepath}")


# 전역 레지스트리 인스턴스
_registry: Optional[PromptTemplateRegistry] = None


def get_prompt_template_registry() -> PromptTemplateRegistry:
    """프롬프트 템플릿 레지스트리 싱글톤"""
    global _registry
    if _registry is None:
        _registry = PromptTemplateRegistry()
    return _registry


def get_prompt_template(name: str) -> Optional[PromptTemplate]:
    """프롬프트 템플릿 조회 헬퍼"""
    return get_prompt_template_registry().get(name)


def format_prompt(name: str, **kwargs) -> str:
    """프롬프트 포맷팅 헬퍼"""
    return get_prompt_template_registry().format(name, **kwargs)
