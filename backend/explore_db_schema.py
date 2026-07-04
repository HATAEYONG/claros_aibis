#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Schema Explorer
실제 YH 데이터베이스의 스키마를 탐색하고 문서화합니다.
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# 데이터베이스 연결 정보
DB_CONFIG = {
    'host': '133.186.214.219',
    'port': 27455,
    'database': 'YH',
    'user': 'yh',
    'password': 'db!@yh#$1!',
    'sslmode': 'require',
    'connect_timeout': 10
}

def get_schema_info():
    """데이터베이스 스키마 정보를 가져옵니다."""

    conn = None
    try:
        print("🔗 데이터베이스 연결 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        print("✅ 연결 성공!")
        print(f"   호스트: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"   데이터베이스: {DB_CONFIG['database']}")

        # 1. 모든 테이블 목록 가져오기
        print("\n\n📋 테이블 목록 조회...")
        cursor.execute("""
            SELECT
                schemaname,
                tablename,
                tableowner
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
        """)

        tables = cursor.fetchall()
        print(f"   발견된 테이블: {len(tables)}개")

        # 2. 각 테이블의 컬럼 정보 가져오기
        schema_data = {}

        for table in tables:
            schema_name = table['schemaname']
            table_name = table['tablename']

            # 스키마가 public인 것만 처리
            if schema_name != 'public':
                continue

            print(f"\n   🔍 {table_name} 분석 중...")

            cursor.execute("""
                SELECT
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_schema = 'public'
                    AND table_name = %s
                ORDER BY ordinal_position;
            """, (table_name,))

            columns = cursor.fetchall()

            # 기본 키 정보
            cursor.execute("""
                SELECT a.attname AS column_name
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid
                    AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass
                    AND i.indisprimary = true;
            """, (f"public.{table_name}",))

            pk_columns = [row['column_name'] for row in cursor.fetchall()]

            # 외래 키 정보
            cursor.execute("""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                    AND tc.table_name = %s;
            """, (table_name,))

            fk_columns = cursor.fetchall()

            # 테이블 코멘트
            cursor.execute("""
                SELECT
                    obj_description((table_name::regclass)::oid, 'pg_class') as table_comment
                FROM information_schema.tables
                WHERE table_schema = 'public'
                    AND table_name = %s;
            """, (table_name,))

            table_comment_result = cursor.fetchone()
            table_comment = table_comment_result['table_comment'] if table_comment_result else None

            schema_data[table_name] = {
                'table_name': table_name,
                'comment': table_comment,
                'columns': [],
                'primary_keys': pk_columns,
                'foreign_keys': fk_columns
            }

            for col in columns:
                schema_data[table_name]['columns'].append({
                    'name': col['column_name'],
                    'type': col['data_type'],
                    'length': col['character_maximum_length'],
                    'nullable': col['is_nullable'] == 'YES',
                    'default': col['column_default'],
                    'is_pk': col['column_name'] in pk_columns
                })

        # 3. 결과 저장
        output_file = 'C:/work/claude_code/claros-mis-ai-dashboard/claros-mis-backend/YH_DB_SCHEMA.json'

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(schema_data, f, ensure_ascii=False, indent=2)

        print(f"\n\n✅ 스키마 정보 저장 완료: {output_file}")

        # 4. 요약 정보 출력
        print("\n\n" + "="*60)
        print("📊 데이터베이스 스키마 요약")
        print("="*60)

        for table_name, table_info in sorted(schema_data.items()):
            print(f"\n📌 {table_name}")
            if table_info['comment']:
                print(f"   설명: {table_info['comment']}")
            print(f"   컬럼수: {len(table_info['columns'])}")
            print(f"   PK: {', '.join(table_info['primary_keys']) if table_info['primary_keys'] else '없음'}")
            if table_info['foreign_keys']:
                print(f"   FK:")
                for fk in table_info['foreign_keys']:
                    print(f"      {fk['column_name']} → {fk['foreign_table_name']}.{fk['foreign_column_name']}")

        # 5. 모듈별 분류 제안
        print("\n\n" + "="*60)
        print("🗂️  모듈별 테이블 분류 제안")
        print("="*60)

        module_suggestions = {
            '인사(HR)': [],
            '급여(Payroll)': [],
            '자재(Materials)': [],
            '생산(Production)': [],
            '품질(Quality)': [],
            '영업(Sales)': [],
            '재고(Inventory)': [],
            '구매(Purchasing)': [],
            '회계(Accounting)': [],
            '원가(Cost)': [],
            '설비(Equipment)': [],
            '공통(Common)': []
        }

        # 테이블 이름 기반 분류
        for table_name in schema_data.keys():
            table_lower = table_name.lower()

            if any(x in table_lower for x in ['emp', 'hr_', 'employee', 'worker', '사원']):
                module_suggestions['인사(HR)'].append(table_name)
            elif any(x in table_lower for x in ['salary', 'payroll', '급여']):
                module_suggestions['급여(Payroll)'].append(table_name)
            elif any(x in table_lower for x in ['material', 'mat_', 'item', 'master', '자재']):
                module_suggestions['자재(Materials)'].append(table_name)
            elif any(x in table_lower for x in ['prod', 'production', 'work_order', '생산']):
                module_suggestions['생산(Production)'].append(table_name)
            elif any(x in table_lower for x in ['qual', 'insp', 'qc', '품질', '검사']):
                module_suggestions['품질(Quality)'].append(table_name)
            elif any(x in table_lower for x in ['sales', 'cust', 'customer', '영업', '고객']):
                module_suggestions['영업(Sales)'].append(table_name)
            elif any(x in table_lower for x in ['invent', 'stock', 'wareho', 'loc', '재고', '창고']):
                module_suggestions['재고(Inventory)'].append(table_name)
            elif any(x in table_lower for x in ['purchas', 'po_', 'buy', '구매', '발주']):
                module_suggestions['구매(Purchasing)'].append(table_name)
            elif any(x in table_lower for x in ['account', 'gl_', 'journal', '회계']):
                module_suggestions['회계(Accounting)'].append(table_name)
            elif any(x in table_lower for x in ['cost', '원가']):
                module_suggestions['원가(Cost)'].append(table_name)
            elif any(x in table_lower for x in ['equip', 'machine', 'facility', '설비']):
                module_suggestions['설비(Equipment)'].append(table_name)
            else:
                module_suggestions['공통(Common)'].append(table_name)

        for module, tables in module_suggestions.items():
            if tables:
                print(f"\n{module}:")
                for t in tables:
                    print(f"  • {t}")

        return schema_data

    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()
        return None

    finally:
        if conn:
            conn.close()
            print("\n\n🔌 데이터베이스 연결 종료")

def sample_data_query():
    """샘플 데이터를 조회합니다."""

    conn = None
    try:
        print("\n\n🔍 데이터 샘플 조회...")

        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 테이블 목록
        cursor.execute("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            LIMIT 10;
        """)

        tables = cursor.fetchall()

        for table in tables[:5]:  # 처음 5개 테이블만 샘플 조회
            table_name = table['tablename']
            print(f"\n📊 {table_name} (최대 5건)")

            try:
                cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 5;')
                rows = cursor.fetchall()

                if rows:
                    # 컬럼 헤더
                    cols = list(rows[0].keys())
                    print(f"   {' | '.join(cols)}")
                    print("   " + "-" * (len(' | '.join(cols))))

                    # 데이터 행
                    for row in rows:
                        values = [str(row.get(col, ''))[:20] for col in cols]
                        print(f"   {' | '.join(values)}")
                else:
                    print("   (데이터 없음)")

            except Exception as e:
                print(f"   조회 실패: {e}")

    except Exception as e:
        print(f"❌ 샘플 조회 오류: {e}")

    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("="*60)
    print("🚀 YH 데이터베이스 스키마 탐색기")
    print("="*60)

    # 스키마 정보 수집
    schema = get_schema_info()

    if schema:
        # 샘플 데이터 조회
        sample_data_query()

    print("\n\n✅ 작업 완료!")
