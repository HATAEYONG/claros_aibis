# -*- coding: utf-8 -*-
"""
LangGraph 파이프라인 유닛테스트

fake llm_call을 주입해 실제 Anthropic API 호출 없이
Intent→Schema→SQL→Safety→Interpreter 5노드가 순서대로 동작하는지,
그리고 Safety가 실제로 실행을 막는지 검증한다.

실행: python -m unittest ai.graph.test_pipeline -v  (backend/ 디렉터리에서)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from ai.graph import run_pipeline

_EXPECTED_TRACE = ["intent", "schema", "sql", "safety", "interpreter"]


def _fake_llm(response_text):
    def _call(system_prompt, user_prompt):
        return response_text
    return _call


class TestPipelineHappyPath(unittest.TestCase):
    def test_all_five_nodes_visited_in_order(self):
        llm = _fake_llm("```sql\nSELECT id FROM sales_monthlysales\n```\n매출 조회")
        state = run_pipeline("매출 알려줘", execute=False, llm_call=llm)
        self.assertEqual(state["trace"], _EXPECTED_TRACE)

    def test_safe_select_generates_and_does_not_error(self):
        llm = _fake_llm("```sql\nSELECT id FROM sales_monthlysales\n```\n매출 조회")
        state = run_pipeline("매출 알려줘", execute=False, llm_call=llm)
        self.assertTrue(state["safe"])
        self.assertIsNone(state["guard_violation"])
        self.assertIn("sales_monthlysales", state["tables"])

    def test_execute_true_runs_query_against_db(self):
        llm = _fake_llm("```sql\nSELECT 1 AS one\n```\n상수 조회")
        state = run_pipeline("숫자 하나 보여줘", execute=True, llm_call=llm)
        self.assertTrue(state["safe"])
        self.assertEqual(state["results"], [{"one": 1}])


class TestPipelineBlocksUnsafeSQL(unittest.TestCase):
    def test_delete_is_blocked_and_not_executed(self):
        llm = _fake_llm("```sql\nDELETE FROM sales_monthlysales\n```\n삭제")
        state = run_pipeline("매출 데이터 지워줘", execute=True, llm_call=llm)

        self.assertEqual(state["trace"], _EXPECTED_TRACE)
        self.assertFalse(state["safe"])
        self.assertEqual(state["guard_violation"], "NOT_SELECT")
        self.assertEqual(state["results"], [])

    def test_stacked_statement_is_blocked(self):
        llm = _fake_llm("```sql\nSELECT 1; DROP TABLE sales_monthlysales;\n```\n")
        state = run_pipeline("전부 지워", execute=True, llm_call=llm)

        self.assertFalse(state["safe"])
        self.assertEqual(state["guard_violation"], "MULTI_STATEMENT")
        self.assertEqual(state["results"], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
