# -*- coding: utf-8 -*-
"""
ai.views.text_to_sql (실제 URL에 연결된 엔드포인트) 통합 테스트

`/api/ai/sql/text-to-sql/`, `/api/ai/sql/`가 실제로 라우팅하는 뷰다.
Django test Client로 요청을 보내 LangGraph 파이프라인 연동, SQL Guard,
AuditLog 기록까지 실제 HTTP 계층을 통해 검증한다.

실행: python -m unittest ai.test_views_text_to_sql -v  (backend/ 디렉터리에서)
"""
import json
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from django.contrib.auth import get_user_model
from django.test import Client


class TestTextToSqlEndpoint(unittest.TestCase):
    URL = "/api/ai/sql/text-to-sql/"

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        User = get_user_model()
        cls.username = "_test_text_to_sql_user"
        User.objects.filter(username=cls.username).delete()
        cls.user = User.objects.create_user(username=cls.username, password="testpass123")

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()
        super().tearDownClass()

    def setUp(self):
        self.client = Client()
        self.client.force_login(self.user)

    def test_unauthenticated_request_is_rejected(self):
        anon_client = Client()
        response = anon_client.post(
            self.URL, data=json.dumps({"question": "매출 알려줘"}),
            content_type="application/json",
        )
        self.assertIn(response.status_code, (401, 403))

    def test_missing_question_returns_400(self):
        response = self.client.post(
            self.URL, data=json.dumps({}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_without_api_key_generation_fails_safely_with_422(self):
        # 이 환경에는 ANTHROPIC_API_KEY가 없으므로 기본 llm_call은 빈 응답을 반환하고
        # 파이프라인이 이를 NO_SQL_GENERATED로 안전하게 처리해야 한다 (500이 아니라 422).
        response = self.client.post(
            self.URL, data=json.dumps({"question": "매출 알려줘"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertFalse(body["safe"])
        self.assertEqual(body["guard_violation"], "NO_SQL_GENERATED")

    @patch("ai.graph.nodes._default_llm_call")
    def test_generation_only_with_mocked_llm_returns_sql(self, mock_llm_call):
        mock_llm_call.return_value = (
            "```sql\nSELECT fiscal_year, SUM(actual_amount) FROM sales_monthlysales GROUP BY fiscal_year\n```\n"
            "연도별 매출 합계입니다."
        )
        response = self.client.post(
            self.URL, data=json.dumps({"question": "연도별 매출 알려줘", "execute": False}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["safe"])
        self.assertIn("sales_monthlysales", body["tables"])
        self.assertNotIn("results", body)  # execute=false면 results 필드 자체가 없어야 한다

    @patch("ai.graph.nodes._default_llm_call")
    def test_execute_true_with_unsafe_sql_is_blocked_and_audited(self, mock_llm_call):
        from security.models import AuditLog

        mock_llm_call.return_value = "```sql\nDELETE FROM sales_monthlysales\n```\n삭제합니다."

        before_count = AuditLog.objects.filter(action="ai_text_to_sql_execute").count()

        response = self.client.post(
            self.URL, data=json.dumps({"question": "매출 지워줘", "execute": True}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertFalse(body["safe"])
        self.assertEqual(body["guard_violation"], "NOT_SELECT")

        after_count = AuditLog.objects.filter(action="ai_text_to_sql_execute").count()
        self.assertEqual(after_count, before_count + 1)

        latest = AuditLog.objects.filter(action="ai_text_to_sql_execute").order_by("-timestamp").first()
        self.assertEqual(latest.status, "failed")
        self.assertEqual(latest.actor_id, self.user.id)

    @patch("ai.graph.nodes._default_llm_call")
    def test_execute_true_with_safe_sql_runs_and_is_audited(self, mock_llm_call):
        from security.models import AuditLog

        mock_llm_call.return_value = "```sql\nSELECT 1 AS one\n```\n상수 조회"

        response = self.client.post(
            self.URL, data=json.dumps({"question": "숫자 하나 보여줘", "execute": True}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["safe"])
        self.assertEqual(body["results"], [{"one": 1}])

        latest = AuditLog.objects.filter(action="ai_text_to_sql_execute").order_by("-timestamp").first()
        self.assertEqual(latest.status, "success")
        self.assertEqual(latest.metadata.get("result_count"), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
