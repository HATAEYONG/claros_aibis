# -*- coding: utf-8 -*-
"""
SQL Guard 유닛테스트

Django 의존성 없이 순수 파이썬으로 동작 (sql_guard.py 자체가 Django에 의존하지 않음).
실행: python -m unittest ai.test_sql_guard -v  (backend/ 디렉터리에서)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.sql_guard import SQLGuardViolation, is_safe, validate_select_only


class TestSQLGuardAllowsReadOnly(unittest.TestCase):
    """정상적인 SELECT/WITH 쿼리는 통과해야 한다."""

    def test_simple_select(self):
        sql = "SELECT id, name FROM users WHERE id = 1"
        self.assertEqual(validate_select_only(sql), sql)

    def test_select_with_trailing_semicolon(self):
        sql = "SELECT id FROM users;"
        self.assertEqual(validate_select_only(sql), "SELECT id FROM users")

    def test_select_with_union(self):
        sql = "SELECT id FROM a UNION SELECT id FROM b"
        self.assertTrue(is_safe(sql))

    def test_cte_with_select(self):
        sql = "WITH t AS (SELECT id FROM users) SELECT * FROM t"
        self.assertTrue(is_safe(sql))

    def test_column_names_resembling_keywords_are_not_false_positives(self):
        # created_at / deleted_at / grant_date 처럼 금지 키워드를 포함한 컬럼명은 통과해야 한다
        sql = "SELECT id, created_at, deleted_at, grant_date FROM orders"
        self.assertTrue(is_safe(sql))


class TestSQLGuardBlocksWrites(unittest.TestCase):
    """DDL/DML은 전부 차단되어야 한다."""

    def _assert_blocked(self, sql, expected_reason=None):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only(sql)
        if expected_reason:
            self.assertEqual(ctx.exception.reason_code, expected_reason)

    def test_insert_blocked(self):
        self._assert_blocked("INSERT INTO users (name) VALUES ('x')", "NOT_SELECT")

    def test_update_blocked(self):
        self._assert_blocked("UPDATE users SET name = 'x' WHERE id = 1", "NOT_SELECT")

    def test_delete_blocked(self):
        self._assert_blocked("DELETE FROM users WHERE id = 1", "NOT_SELECT")

    def test_drop_table_blocked(self):
        self._assert_blocked("DROP TABLE users", "NOT_SELECT")

    def test_truncate_blocked(self):
        self._assert_blocked("TRUNCATE TABLE users", "NOT_SELECT")

    def test_alter_blocked(self):
        self._assert_blocked("ALTER TABLE users ADD COLUMN x INT", "NOT_SELECT")

    def test_grant_statement_blocked(self):
        self._assert_blocked("GRANT SELECT ON users TO public", "NOT_SELECT")


class TestSQLGuardBlocksInjectionPatterns(unittest.TestCase):
    """단일 SELECT처럼 시작하지만 위험한 부가 구문이 포함된 케이스."""

    def test_stacked_statement_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("SELECT 1; DROP TABLE users;")
        self.assertEqual(ctx.exception.reason_code, "MULTI_STATEMENT")

    def test_select_into_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("SELECT * INTO new_table FROM users")
        self.assertEqual(ctx.exception.reason_code, "SELECT_INTO")

    def test_system_proc_xp_cmdshell_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("SELECT 1; EXEC xp_cmdshell('dir')")
        # 세미콜론으로 인해 MULTI_STATEMENT가 먼저 걸리므로 이를 확인
        self.assertEqual(ctx.exception.reason_code, "MULTI_STATEMENT")

    def test_inline_comment_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("SELECT * FROM users -- WHERE id = 1")
        self.assertEqual(ctx.exception.reason_code, "INLINE_COMMENT")

    def test_block_comment_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("SELECT * FROM users /* comment */")
        self.assertEqual(ctx.exception.reason_code, "BLOCK_COMMENT")

    def test_empty_sql_blocked(self):
        with self.assertRaises(SQLGuardViolation) as ctx:
            validate_select_only("   ")
        self.assertEqual(ctx.exception.reason_code, "EMPTY_SQL")


if __name__ == "__main__":
    unittest.main(verbosity=2)
