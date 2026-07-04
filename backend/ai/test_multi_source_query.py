# -*- coding: utf-8 -*-
"""
멀티 소스 쿼리 실행 유닛테스트

- execute_erp_query()가 SELECT 전용을 강제하는지 (연결 시도 전에 차단되는지)
- ERPSource(SQLite)로 등록된 소스를 실제로 조회할 수 있는지
- LangGraph interpreter_node가 source_code를 받으면 이 경로로 라우팅하는지

DB에 테스트용 ERPSource 행을 만들었다가 tearDown에서 반드시 삭제해
운영 데이터를 오염시키지 않는다.

실행: python -m unittest ai.test_multi_source_query -v  (backend/ 디렉터리에서)
"""
import os
import sys
import sqlite3
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from erp_sync.utils.erp_db_connector import execute_erp_query, ERPDatabaseConnector
from ai.sql_guard import SQLGuardViolation
from ai.multi_source_query import ERPSourceNotFound, run_query_for_source


class TestExecuteErpQueryGuardsBeforeConnecting(unittest.TestCase):
    """SQL Guard는 실제 DB 연결을 시도하기 전에 차단해야 한다 (erp_source가 None이어도 확인 가능)."""

    def test_delete_blocked_without_touching_connection(self):
        with self.assertRaises(SQLGuardViolation):
            execute_erp_query(erp_source=None, query="DELETE FROM whatever")

    def test_stacked_statement_blocked_without_touching_connection(self):
        with self.assertRaises(SQLGuardViolation):
            execute_erp_query(erp_source=None, query="SELECT 1; DROP TABLE whatever;")


class TestRunQueryForSourceAgainstRealSqlite(unittest.TestCase):
    """SQLite로 등록된 ERPSource에 대해 SQL Guard를 거쳐 실제로 조회되는지 확인."""

    SOURCE_CODE = "_TEST_MULTI_SOURCE_SQLITE"

    def setUp(self):
        from erp_sync.models import ERPSource

        self._tmp_db_fd, self._tmp_db_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(self._tmp_db_fd)

        conn = sqlite3.connect(self._tmp_db_path)
        conn.execute("CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT)")
        conn.execute("INSERT INTO widgets (name) VALUES ('gizmo')")
        conn.commit()
        conn.close()

        ERPDatabaseConnector.close_all_connections()
        ERPSource.objects.filter(source_code=self.SOURCE_CODE).delete()
        self.erp_source = ERPSource.objects.create(
            source_code=self.SOURCE_CODE,
            source_name="테스트용 임시 SQLite 소스",
            source_type="sqlite",
            database_name=self._tmp_db_path,
            is_active=True,
        )

    def tearDown(self):
        from erp_sync.models import ERPSource

        ERPDatabaseConnector.close_all_connections()
        ERPSource.objects.filter(source_code=self.SOURCE_CODE).delete()
        try:
            os.remove(self._tmp_db_path)
        except OSError:
            pass

    def test_select_query_returns_real_rows(self):
        results = run_query_for_source(self.SOURCE_CODE, "SELECT id, name FROM widgets")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "gizmo")

    def test_write_query_is_blocked_before_hitting_the_source(self):
        with self.assertRaises(SQLGuardViolation):
            run_query_for_source(self.SOURCE_CODE, "INSERT INTO widgets (name) VALUES ('hacked')")

        # 차단되었으니 실제로는 삽입되지 않았어야 한다
        results = run_query_for_source(self.SOURCE_CODE, "SELECT COUNT(*) as cnt FROM widgets")
        self.assertEqual(results[0]["cnt"], 1)

    def test_unknown_source_code_raises(self):
        with self.assertRaises(ERPSourceNotFound):
            run_query_for_source("_NO_SUCH_SOURCE", "SELECT 1")


class TestPipelineRoutesThroughSource(unittest.TestCase):
    """LangGraph interpreter_node가 source_code를 받으면 multi_source_query 경로를 타는지 확인."""

    SOURCE_CODE = "_TEST_MULTI_SOURCE_SQLITE_GRAPH"

    def setUp(self):
        from erp_sync.models import ERPSource

        self._tmp_db_fd, self._tmp_db_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(self._tmp_db_fd)

        conn = sqlite3.connect(self._tmp_db_path)
        conn.execute("CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT)")
        conn.execute("INSERT INTO widgets (name) VALUES ('from-graph')")
        conn.commit()
        conn.close()

        ERPDatabaseConnector.close_all_connections()
        ERPSource.objects.filter(source_code=self.SOURCE_CODE).delete()
        self.erp_source = ERPSource.objects.create(
            source_code=self.SOURCE_CODE,
            source_name="테스트용 임시 SQLite 소스 (그래프)",
            source_type="sqlite",
            database_name=self._tmp_db_path,
            is_active=True,
        )

    def tearDown(self):
        from erp_sync.models import ERPSource

        ERPDatabaseConnector.close_all_connections()
        ERPSource.objects.filter(source_code=self.SOURCE_CODE).delete()
        try:
            os.remove(self._tmp_db_path)
        except OSError:
            pass

    def test_pipeline_executes_against_named_source(self):
        # source_code는 run_pipeline() 헬퍼 시그니처에는 없는 확장 필드이므로
        # 컴파일된 그래프를 직접 invoke해 state에 실어 보낸다.
        from ai.graph.pipeline import get_pipeline

        def fake_llm(system_prompt, user_prompt):
            return "```sql\nSELECT name FROM widgets\n```\n위젯 목록"

        pipeline = get_pipeline()
        result_state = pipeline.invoke({
            "question": "위젯 목록 보여줘",
            "execute": True,
            "llm_call": fake_llm,
            "source_code": self.SOURCE_CODE,
            "trace": [],
        })

        self.assertTrue(result_state["safe"])
        self.assertEqual(result_state["results"], [{"name": "from-graph"}])


if __name__ == "__main__":
    unittest.main(verbosity=2)
