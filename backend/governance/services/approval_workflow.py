"""
승인 워크플로우 서비스 — 승인 프로세스 관리
"""
import logging
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db import transaction

from governance.models import ApprovalRequest, ApprovalWorkflow

logger = logging.getLogger(__name__)


class ApprovalWorkflowService:
    """승인 워크플로우 서비스"""

    @staticmethod
    def create_approval_request(
        title: str,
        description: str,
        requested_by: str,
        recommendation_id: str = None,
        category: str = "general",
        business_impact: str = "medium",
        context: Dict[str, Any] = None
    ) -> ApprovalRequest:
        """
        승인 요청 생성

        Args:
            title: 제목
            description: 설명
            requested_by: 요청자
            recommendation_id: 관련 추천 ID
            category: 카테고리
            business_impact: 업무 영향도
            context: 추가 컨텍스트

        Returns:
            생성된 승인 요청
        """
        context = context or {}

        # 적절한 워크플로우 찾기
        try:
            workflow = ApprovalWorkflow.objects.filter(
                category=category,
                is_active=True
            ).first()

            if workflow:
                # 워크플로우 기반 승인 레벨 결정
                approval_level = workflow.get_required_level(context)
            else:
                # 기본 승인 레벨
                impact_level_map = {
                    "low": 1,
                    "medium": 2,
                    "high": 3,
                    "critical": 4
                }
                approval_level = impact_level_map.get(business_impact, 2)

        except Exception as e:
            logger.error(f"승인 레벨 결정 실패: {e}")
            approval_level = 2

        # 승인 요청 생성
        approval_request = ApprovalRequest.objects.create(
            title=title,
            description=description,
            requested_by=requested_by,
            recommendation_id=recommendation_id,
            approval_level=approval_level,
            business_impact=business_impact,
            approval_history=[{
                "action": "created",
                "user": requested_by,
                "timestamp": timezone.now().isoformat()
            }]
        )

        logger.info(f"승인 요청 생성: {approval_request.request_id} (레벨 {approval_level})")
        return approval_request

    @staticmethod
    @transaction.atomic
    def process_approval(
        request_id: str,
        action: str,
        approver: str,
        comment: str = ""
    ) -> ApprovalRequest:
        """
        승인 처리

        Args:
            request_id: 요청 ID
            action: 액션 (approve, reject)
            approver: 승인자
            comment: 코멘트

        Returns:
            처리된 승인 요청
        """
        try:
            request = ApprovalRequest.objects.get(request_id=request_id)
        except ApprovalRequest.DoesNotExist:
            logger.error(f"승인 요청을 찾을 수 없음: {request_id}")
            raise

        if request.status != "pending":
            logger.warning(f"승인 요청이 대기 상태가 아님: {request.status}")
            return request

        if action == "approve":
            request.approve(approver=approver, comment=comment)
            logger.info(f"승인 요청 승인됨: {request_id}")
        elif action == "reject":
            request.reject(approver=approver, reason=comment)
            logger.info(f"승인 요청 거부됨: {request_id}")
        else:
            logger.error(f"잘못된 액션: {action}")
            raise ValueError(f"잘못된 액션: {action}")

        return request

    @staticmethod
    def get_pending_approvals(user: str = None) -> List[ApprovalRequest]:
        """
        대기 중인 승인 요청 목록

        Args:
            user: 특정 사용자의 요청만 (None이면 전체)

        Returns:
            대기 중인 승인 요청 목록
        """
        queryset = ApprovalRequest.objects.filter(status="pending")

        if user:
            queryset = queryset.filter(requested_by=user)

        return list(queryset.order_by("-created_at"))

    @staticmethod
    def get_approval_statistics(days: int = 30) -> Dict[str, Any]:
        """
        승인 통계 조회

        Args:
            days: 통계 기간 (일)

        Returns:
            승인 통계
        """
        from django.utils import timezone
        from datetime import timedelta

        start_date = timezone.now() - timedelta(days=days)
        queryset = ApprovalRequest.objects.filter(created_at__gte=start_date)

        total = queryset.count()
        approved = queryset.filter(status="approved").count()
        rejected = queryset.filter(status="rejected").count()
        pending = queryset.filter(status="pending").count()

        # 레벨별 분포
        level_distribution = {}
        for level in [1, 2, 3, 4, 5, 6]:
            level_count = queryset.filter(approval_level=level).count()
            level_distribution[f"L{level}"] = level_count

        # 평균 처리 시간
        processed = queryset.filter(status__in=["approved", "rejected"], approved_at__isnull=False)
        avg_processing_time = None
        if processed.exists():
            processing_times = [
                (req.approved_at - req.created_at).total_seconds() / 3600
                for req in processed
            ]
            avg_processing_time = sum(processing_times) / len(processing_times)

        return {
            "period_days": days,
            "total_requests": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": round(approved / total * 100, 1) if total > 0 else 0,
            "level_distribution": level_distribution,
            "avg_processing_time_hours": round(avg_processing_time, 1) if avg_processing_time else None
        }

    @staticmethod
    def escalate_overdue_requests(hours: int = 24) -> List[ApprovalRequest]:
        """
        지연된 승인 요청 에스컬레이션

        Args:
            hours: 경과 시간 (시간)

        Returns:
            에스컬레이션된 요청 목록
        """
        from datetime import timedelta

        cutoff_time = timezone.now() - timedelta(hours=hours)
        overdue = ApprovalRequest.objects.filter(
            status="pending",
            created_at__lt=cutoff_time
        )

        escalated = []
        for request in overdue:
            # TODO: 이메일/알림 전송
            logger.warning(f"지연된 승인 요청: {request.request_id}")
            escalated.append(request)

        return escalated
