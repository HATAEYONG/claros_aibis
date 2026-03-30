"""
거버넌스 앱 URL 설정
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PolicyRuleViewSet,
    PolicyViolationViewSet,
    ApprovalRequestViewSet,
    ApprovalWorkflowViewSet,
)

app_name = "governance"

router = DefaultRouter()
router.register(r'policy-rules', PolicyRuleViewSet, basename='policy-rule')
router.register(r'violations', PolicyViolationViewSet, basename='violation')
router.register(r'approvals', ApprovalRequestViewSet, basename='approval')
router.register(r'workflows', ApprovalWorkflowViewSet, basename='workflow')

urlpatterns = [
    path('', include(router.urls)),
]
