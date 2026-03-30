# -*- coding: utf-8 -*-
"""
Ontology Service
온톨로지 관련 비즈니스 로직 서비스
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone

from ..models import (
    OntologyCategory,
    OntologyElement,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog,
    OntologyNode,
    OntologyEdge,
)


class OntologyService:
    """온톨로지 서비스"""

    @staticmethod
    def get_category_summary() -> List[Dict[str, Any]]:
        """
        카테고리별 요약 정보 조회

        Returns:
            카테고리 요약 리스트
        """
        categories = OntologyCategory.objects.filter(is_active=True)

        summaries = []
        for category in categories:
            element_count = OntologyElement.objects.filter(
                category=category,
                is_active=True
            ).count()

            summaries.append({
                'category_code': category.code,
                'category_name': category.name_ko,
                'element_count': element_count,
                'level': category.level,
            })

        return summaries

    @staticmethod
    def get_data_flow_chain(start: str, end: str) -> List[Dict[str, Any]]:
        """
        데이터 흐름 체인 조회

        Args:
            start: 시작 카테고리 코드
            end: 끝 카테고리 코드

        Returns:
            데이터 흐름 체인
        """
        # 시작 요소 조회
        start_elements = OntologyElement.objects.filter(
            category__code=start,
            is_active=True
        )

        # 끝 요소 조회
        end_elements = OntologyElement.objects.filter(
            category__code=end,
            is_active=True
        )

        chains = []
        for start_elem in start_elements:
            for end_elem in end_elements:
                # 관계 찾기
                relations = OntologyRelation.objects.filter(
                    Q(source=start_elem, target=end_elem) |
                    Q(source=end_elem, target=start_elem),
                    is_active=True
                )

                for relation in relations:
                    chains.append({
                        'source': {
                            'code': relation.source.code,
                            'name': relation.source.name_ko,
                            'category': relation.source.category.code,
                        },
                        'target': {
                            'code': relation.target.code,
                            'name': relation.target.name_ko,
                            'category': relation.target.category.code,
                        },
                        'relation_type': relation.relation_type,
                        'strength': relation.strength,
                    })

        return chains

    @staticmethod
    def create_analysis_log(
        analysis_type: str,
        parameters: Dict[str, Any],
        requested_by: str
    ) -> OntologyAnalysisLog:
        """
        분석 로그 생성

        Args:
            analysis_type: 분석 유형
            parameters: 분석 파라미터
            requested_by: 요청자

        Returns:
            생성된 분석 로그
        """
        return OntologyAnalysisLog.objects.create(
            analysis_type=analysis_type,
            parameters=parameters,
            status='running',
            requested_by=requested_by,
            started_at=timezone.now(),
        )

    @staticmethod
    def complete_analysis_log(
        log_id: str,
        result: Dict[str, Any],
        status: str = 'completed'
    ) -> None:
        """
        분석 로그 완료

        Args:
            log_id: 로그 ID
            result: 분석 결과
            status: 상태
        """
        try:
            log = OntologyAnalysisLog.objects.get(log_id=log_id)
            log.result = result
            log.status = status
            log.completed_at = timezone.now()

            if status == 'completed':
                duration = (log.completed_at - log.started_at).total_seconds()
                log.execution_time_ms = int(duration * 1000)

            log.save()
        except OntologyAnalysisLog.DoesNotExist:
            pass

    @staticmethod
    def get_4m2e_impact_analysis(target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        4M2E 영향도 분석

        Args:
            target_date: 대상 날짜

        Returns:
            4M2E 영향도 분석 결과
        """
        # 4M2E 카테고리 코드
        m2e_categories = ['MAN', 'MACHINE', 'MATERIAL', 'METHOD',
                         'MEASUREMENT', 'ENVIRONMENT', 'INFORMATION', 'MANAGEMENT']

        analysis = {
            'target_date': target_date or date.today(),
            'categories': []
        }

        for category_code in m2e_categories:
            try:
                element = OntologyElement.objects.get(code=category_code)

                # 관련 관계 조회
                relations = OntologyRelation.objects.filter(
                    Q(source=element) | Q(target=element),
                    is_active=True
                )

                # 영향도 계산
                impact_score = sum(r.strength for r in relations) / max(relations.count(), 1)

                analysis['categories'].append({
                    'category': category_code,
                    'name': element.name_ko,
                    'impact_score': round(impact_score, 2),
                    'relation_count': relations.count(),
                })

            except OntologyElement.DoesNotExist:
                continue

        return analysis

    @staticmethod
    def trace_cost_to_esg(cost_mon: str) -> Dict[str, Any]:
        """
        원가에서 ESG로 추적

        Args:
            cost_mon: 원가 월 (YYYY-MM 형식)

        Returns:
            추적 결과
        """
        try:
            year, month = map(int, cost_mon.split('-'))
            target_date = date(year, month, 1)
        except (ValueError, AttributeError):
            target_date = date.today()

        return {
            'cost_period': cost_mon,
            'trace_chain': [
                {'stage': 'cost', 'description': '원가 분석'},
                {'stage': '4m2e', 'description': '4M2E 분류'},
                {'stage': '6m', 'description': '6M 상위 분류'},
                {'stage': 'esg', 'description': 'ESG 연결'},
            ],
            'impact_summary': {
                'environmental': 0.35,
                'social': 0.40,
                'governance': 0.25,
            }
        }

    @staticmethod
    def get_relations_graph() -> Dict[str, Any]:
        """
        관계 그래프 데이터 조회

        Returns:
            그래프 데이터
        """
        nodes = []
        edges = []

        # 노드 데이터 생성
        elements = OntologyElement.objects.filter(is_active=True)
        for elem in elements:
            nodes.append({
                'id': elem.element_id,
                'code': elem.code,
                'name': elem.name_ko,
                'category': elem.category.code if elem.category else None,
                'level': elem.level,
            })

        # 엣지 데이터 생성
        relations = OntologyRelation.objects.filter(is_active=True)
        for rel in relations:
            edges.append({
                'source': str(rel.source.element_id),
                'target': str(rel.target.element_id),
                'type': rel.relation_type,
                'weight': float(rel.strength),
            })

        return {
            'nodes': nodes,
            'edges': edges,
            'node_count': len(nodes),
            'edge_count': len(edges),
        }

    @staticmethod
    def get_metrics_summary(category_code: Optional[str] = None) -> Dict[str, Any]:
        """
        메트릭 요약 조회

        Args:
            category_code: 카테고리 코드

        Returns:
            메트릭 요약
        """
        queryset = DataFlowMetrics.objects.filter(is_active=True)

        if category_code:
            queryset = queryset.filter(category__code=category_code)

        metrics = queryset.aggregate(
            total_count=Count('metric_id'),
            avg_flow_rate=Avg('flow_rate'),
            avg_quality_score=Avg('quality_score'),
            total_volume=Sum('volume'),
        )

        return {
            'category_code': category_code,
            'total_metrics': metrics['total_count'] or 0,
            'avg_flow_rate': round(metrics['avg_flow_rate'] or 0, 2),
            'avg_quality_score': round(metrics['avg_quality_score'] or 0, 2),
            'total_volume': metrics['total_volume'] or 0,
        }
