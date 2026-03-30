"""
이벤트 상관관계 서비스
이벤트 간의 인과관계, 시간적 상관성을 분석
"""
import logging
from datetime import timedelta
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone

from events.models import Event, EventCorrelation

logger = logging.getLogger(__name__)


class EventCorrelationService:
    """이벤트 상관관계 서비스"""

    # 상관관계 분석 설정
    TEMPORAL_WINDOW_HOURS = 24  # 시간적 상관관계 분석 윈도우
    MIN_CONFIDENCE = 0.5  # 최소 신뢰도

    @staticmethod
    def find_correlated_events(
        event: Event,
        correlation_type: str = None,
        max_results: int = 10
    ) -> List[Event]:
        """
        관련 이벤트 검색

        Args:
            event: 기준 이벤트
            correlation_type: 상관관계 유형 (causal, temporal, co_occurrence)
            max_results: 최대 결과 수

        Returns:
            List[Event]: 관련 이벤트 목록
        """
        # 시간 윈도우 설정
        time_window = timedelta(hours=EventCorrelationService.TEMPORAL_WINDOW_HOURS)
        start_time = event.event_time - time_window
        end_time = event.event_time + time_window

        # 기본 쿼리
        query = Event.objects.filter(
            event_time__range=(start_time, end_time),
            status__in=[EventStatus.OPEN, EventStatus.ACKNOWLEDGED, EventStatus.IN_PROGRESS]
        ).exclude(event_id=event.event_id)

        # 도메인이 같은 이벤트 우선
        if event.domain:
            query = query.filter(domain=event.domain)

        # 프로세스가 같은 이벤트 우선
        if event.process_code:
            query = query.filter(process_code=event.process_code)

        # 범위가 같은 이벤트 우선
        if event.scope_type and event.scope_id:
            query = query.filter(
                Q(scope_type=event.scope_type, scope_id=event.scope_id) |
                Q(scope_type__in=["kpi", "kri"])
            )

        return list(query[:max_results])

    @staticmethod
    @transaction.atomic
    def create_correlation(
        source_event: Event,
        target_event: Event,
        correlation_type: str,
        confidence: float,
        description: str = "",
        analysis_method: str = "rule_based",
        time_lag_seconds: int = None
    ) -> EventCorrelation:
        """
        이벤트 상관관계 생성

        Args:
            source_event: 소스 이벤트
            target_event: 타겟 이벤트
            correlation_type: 상관관계 유형
            confidence: 신뢰도 (0.0 ~ 1.0)
            description: 설명
            analysis_method: 분석 방법
            time_lag_seconds: 시간 지연 (초)

        Returns:
            EventCorrelation: 생성된 상관관계
        """
        # 신뢰도 검증
        if confidence < 0 or confidence > 1:
            raise ValueError("신뢰도는 0.0 ~ 1.0 사이여야 합니다.")

        # 중복 확인
        existing = EventCorrelation.objects.filter(
            source_event=source_event,
            target_event=target_event
        ).first()

        if existing:
            # 기존 상관관계 업데이트
            existing.confidence = max(existing.confidence, confidence)
            existing.description = description or existing.description
            existing.analysis_method = analysis_method
            if time_lag_seconds is not None:
                existing.time_lag_seconds = time_lag_seconds
            existing.save()
            logger.info(f"상관관계 업데이트: {source_event.event_id} -> {target_event.event_id}")
            return existing

        # 새 상관관계 생성
        correlation = EventCorrelation.objects.create(
            source_event=source_event,
            target_event=target_event,
            correlation_type=correlation_type,
            confidence=confidence,
            description=description,
            analysis_method=analysis_method,
            time_lag_seconds=time_lag_seconds
        )

        logger.info(
            f"상관관계 생성: {source_event.event_id} -> {target_event.event_id} "
            f"({correlation_type}, confidence={confidence:.2f})"
        )
        return correlation

    @staticmethod
    def analyze_temporal_correlation(
        event: Event,
        candidate_events: List[Event]
    ) -> List[Dict[str, Any]]:
        """
        시간적 상관관계 분석

        Args:
            event: 기준 이벤트
            candidate_events: 후보 이벤트 목록

        Returns:
            List[Dict]: 상관관계 분석 결과
        """
        correlations = []

        for candidate in candidate_events:
            # 시간 차이 계산
            if candidate.event_time < event.event_time:
                time_diff = (event.event_time - candidate.event_time).total_seconds()
                # 후보가 원인일 가능성
            else:
                time_diff = (candidate.event_time - event.event_time).total_seconds()
                # 이벤트가 원인일 가능성

            # 시간적 근접성에 따른 신뢰도 계산
            hours_diff = abs(time_diff) / 3600
            if hours_diff <= 1:
                confidence = 0.9
            elif hours_diff <= 6:
                confidence = 0.7
            elif hours_diff <= 12:
                confidence = 0.5
            elif hours_diff <= 24:
                confidence = 0.3
            else:
                continue  # 너무 멀면 상관관계 없음

            # 동일 도메인/프로세스면 가중치
            if candidate.domain == event.domain:
                confidence *= 1.1
            if candidate.process_code == event.process_code:
                confidence *= 1.1
            if candidate.scope_type == event.scope_type and candidate.scope_id == event.scope_id:
                confidence *= 1.2

            # 신뢰도 제한
            confidence = min(confidence, 1.0)

            if confidence >= EventCorrelationService.MIN_CONFIDENCE:
                correlations.append({
                    "candidate_event": candidate,
                    "confidence": confidence,
                    "time_lag_seconds": int(time_diff),
                    "reason": "temporal_proximity"
                })

        # 신뢰도 내림차순 정렬
        correlations.sort(key=lambda x: x["confidence"], reverse=True)
        return correlations

    @staticmethod
    def analyze_causal_correlation(
        event: Event,
        candidate_events: List[Event],
        domain_rules: Dict[str, List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        인과관계 분석 (도메인 규칙 기반)

        Args:
            event: 기준 이벤트
            candidate_events: 후보 이벤트 목록
            domain_rules: 도메인별 인과관계 규칙

        Returns:
            List[Dict]: 인과관계 분석 결과
        """
        # 기본 도메인 규칙
        if domain_rules is None:
            domain_rules = {
                "production": ["quality", "inventory"],
                "quality": ["production", "maintenance"],
                "purchasing": ["inventory", "production"],
                "maintenance": ["production", "quality"],
                "inventory": ["production", "sales"],
            }

        correlations = []
        event_domain = event.domain if event.domain else ""

        # 해당 도메인의 인과관계 규칙 확인
        related_domains = domain_rules.get(event_domain, [])

        for candidate in candidate_events:
            candidate_domain = candidate.domain if candidate.domain else ""

            # 인과관계 규칙 확인
            if candidate_domain in related_domains:
                # 시간적 선후 관계 확인
                if candidate.event_time < event.event_time:
                    time_diff = (event.event_time - candidate.event_time).total_seconds()
                    hours_diff = time_diff / 3600

                    # 24시간 이내면 인과관계 가능성
                    if hours_diff <= 24:
                        confidence = 0.7
                        # 동일 범위면 가중치
                        if candidate.scope_type == event.scope_type and candidate.scope_id == event.scope_id:
                            confidence = 0.9

                        if confidence >= EventCorrelationService.MIN_CONFIDENCE:
                            correlations.append({
                                "candidate_event": candidate,
                                "confidence": confidence,
                                "time_lag_seconds": int(time_diff),
                                "reason": f"domain_rule_{candidate_domain}_to_{event_domain}"
                            })

        # 신뢰도 내림차순 정렬
        correlations.sort(key=lambda x: x["confidence"], reverse=True)
        return correlations

    @staticmethod
    @transaction.atomic
    def auto_correlate_event(
        event: Event,
        max_correlations: int = 5
    ) -> List[EventCorrelation]:
        """
        이벤트 자동 상관관계 분석 및 생성

        Args:
            event: 상관관계를 분석할 이벤트
            max_correlations: 최대 상관관계 수

        Returns:
            List[EventCorrelation]: 생성된 상관관계 목록
        """
        # 관련 이벤트 검색
        correlated_events = EventCorrelationService.find_correlated_events(event)

        if not correlated_events:
            return []

        correlations = []

        # 시간적 상관관계 분석
        temporal_results = EventCorrelationService.analyze_temporal_correlation(
            event, correlated_events
        )

        for result in temporal_results[:max_correlations]:
            try:
                correlation = EventCorrelationService.create_correlation(
                    source_event=result["candidate_event"],
                    target_event=event,
                    correlation_type="temporal",
                    confidence=result["confidence"],
                    description=f"시간적 상관관계 ({result['reason']})",
                    analysis_method="temporal_analysis",
                    time_lag_seconds=result["time_lag_seconds"]
                )
                correlations.append(correlation)
            except Exception as e:
                logger.error(f"상관관계 생성 실패: {e}")

        # 인과관계 분석
        causal_results = EventCorrelationService.analyze_causal_correlation(
            event, correlated_events
        )

        for result in causal_results[:max_correlations]:
            try:
                correlation = EventCorrelationService.create_correlation(
                    source_event=result["candidate_event"],
                    target_event=event,
                    correlation_type="causal",
                    confidence=result["confidence"],
                    description=f"도메인 규칙 기반 인과관계 ({result['reason']})",
                    analysis_method="causal_analysis",
                    time_lag_seconds=result["time_lag_seconds"]
                )
                correlations.append(correlation)
            except Exception as e:
                logger.error(f"상관관계 생성 실패: {e}")

        logger.info(f"이벤트 {event.event_id}에 대해 {len(correlations)}개 상관관계 생성")
        return correlations

    @staticmethod
    def get_correlation_chain(
        event: Event,
        max_depth: int = 3,
        min_confidence: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        이벤트 체인 조회 (연쇄적 상관관계)

        Args:
            event: 시작 이벤트
            max_depth: 최대 깊이
            min_confidence: 최소 신뢰도

        Returns:
            List[Dict]: 이벤트 체인
        """
        chain = []
        visited = set()

        def _build_chain(current_event: Event, depth: int, path: List[Event]) -> None:
            if depth > max_depth or current_event.event_id in visited:
                return

            visited.add(current_event.event_id)

            # 나가는 상관관계 조회
            outgoing = EventCorrelation.objects.filter(
                source_event=current_event,
                confidence__gte=min_confidence
            ).select_related("target_event")

            for corr in outgoing:
                chain.append({
                    "source": current_event,
                    "target": corr.target_event,
                    "correlation": corr,
                    "depth": depth
                })
                _build_chain(corr.target_event, depth + 1, path + [corr.target_event])

        _build_chain(event, 0, [event])
        return chain

    @staticmethod
    def get_event_clusters(
        hours: int = 24,
        min_events: int = 2
    ) -> List[Dict[str, Any]]:
        """
        이벤트 클러스터 분석 (밀집된 이벤트 그룹)

        Args:
            hours: 분석 기간 (시간)
            min_events: 최소 이벤트 수

        Returns:
            List[Dict]: 이벤트 클러스터 목록
        """
        # 시간 범위 설정
        end_time = timezone.now()
        start_time = end_time - timedelta(hours=hours)

        # 기간 내 이벤트 조회
        events = Event.objects.filter(
            event_time__range=(start_time, end_time),
            status__in=[EventStatus.OPEN, EventStatus.ACKNOWLEDGED]
        )

        # 도메인/프로세스별 그룹화
        clusters = {}
        for event in events:
            key = f"{event.domain or 'unknown'}_{event.process_code or 'unknown'}"
            if key not in clusters:
                clusters[key] = {
                    "domain": event.domain,
                    "process_code": event.process_code,
                    "events": [],
                    "event_types": set()
                }
            clusters[key]["events"].append(event)
            clusters[key]["event_types"].add(event.event_type)

        # 최소 이벤트 수 이상인 클러스터만 반환
        result = []
        for key, cluster in clusters.items():
            if len(cluster["events"]) >= min_events:
                result.append({
                    "domain": cluster["domain"],
                    "process_code": cluster["process_code"],
                    "event_count": len(cluster["events"]),
                    "event_types": list(cluster["event_types"]),
                    "events": cluster["events"]
                })

        # 이벤트 수 내림차순 정렬
        result.sort(key=lambda x: x["event_count"], reverse=True)
        return result
