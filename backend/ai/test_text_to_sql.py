# -*- coding: utf-8 -*-
"""
Text-to-SQL 서비스 유닛테스트

실제 Anthropic API를 호출하지 않고, `llm_call`을 주입해 파이프라인
(스키마 조회 → LLM 호출 → SQL 추출 → SQL Guard 검증)을 결정론적으로 검증한다.
실행: python -m unittest ai.test_text_to_sql -v  (backend/ 디렉터리에서)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from ai.text_to_sql_service import generate_sql


def _fake_llm_returning(response_text):
    def _call(system_prompt, user_prompt):
        return response_text
    return _call


class TestTextToSQLGeneration(unittest.TestCase):
    """정상적인 LLM 응답에서 SQL을 올바르게 추출·검증하는지 확인."""

    def test_extracts_sql_from_code_block(self):
        llm_response = (
            "```sql\nSELECT id, name FROM sales_monthlysales WHERE fiscal_year = 2026\n```\n"
            "올해 월별 매출을 조회합니다."
        )
        result = generate_sql("올해 매출 알려줘", llm_call=_fake_llm_returning(llm_response))

        self.assertTrue(result.safe)
        self.assertIn("SELECT", result.sql.upper())
        self.assertIn("sales_monthlysales", result.tables)
        self.assertIsNone(result.guard_violation)

    def test_extracts_sql_without_code_block(self):
        llm_response = "SELECT * FROM production_dailyproduction LIMIT 10"
        result = generate_sql("생산 데이터 보여줘", llm_call=_fake_llm_returning(llm_response))

        self.assertTrue(result.safe)
        self.assertEqual(result.sql, "SELECT * FROM production_dailyproduction LIMIT 10")


class TestTextToSQLGuardIntegration(unittest.TestCase):
    """LLM이 위험한 SQL을 생성해도 SQL Guard가 실행 전에 차단하는지 확인."""

    def test_llm_generated_delete_is_blocked(self):
        llm_response = "```sql\nDELETE FROM sales_monthlysales WHERE fiscal_year = 2020\n```\n삭제합니다."
        result = generate_sql("2020년 매출 지워줘", llm_call=_fake_llm_returning(llm_response))

        self.assertFalse(result.safe)
        self.assertEqual(result.guard_violation, "NOT_SELECT")

    def test_llm_generated_stacked_statement_is_blocked(self):
        llm_response = "```sql\nSELECT 1; DROP TABLE sales_monthlysales;\n```\n"
        result = generate_sql("전체 삭제", llm_call=_fake_llm_returning(llm_response))

        self.assertFalse(result.safe)
        self.assertEqual(result.guard_violation, "MULTI_STATEMENT")

    def test_empty_llm_response_is_marked_unsafe_not_executed(self):
        result = generate_sql("의미 없는 질문", llm_call=_fake_llm_returning("죄송합니다, SQL을 만들 수 없습니다."))

        self.assertFalse(result.safe)
        self.assertEqual(result.guard_violation, "NO_SQL_GENERATED")
        self.assertEqual(result.sql, "")


class TestTextToSQLRealClientFallback(unittest.TestCase):
    """API 키 미설정 환경에서 기본 llm_call(ClaudeClient) 경로가 예외 없이 안전하게 실패하는지 확인."""

    def test_default_llm_call_without_api_key_does_not_crash(self):
        # 이 테스트 환경에는 ANTHROPIC_API_KEY가 설정되어 있지 않다.
        # ClaudeClient는 client=None 상태로 빈 문자열을 반환해야 하고,
        # generate_sql()은 이를 NO_SQL_GENERATED(safe=False)로 안전하게 처리해야 한다.
        result = generate_sql("올해 매출 알려줘")
        self.assertFalse(result.safe)
        self.assertEqual(result.guard_violation, "NO_SQL_GENERATED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
