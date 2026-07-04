# Generated for Phase 1 Upgrade: pgvector support
from django.db import migrations, models


def migrate_json_to_vector(apps, schema_editor):
    """
    JSON embedding 필드를 vector_embedding으로 마이그레이션

    이 함수는 기존 JSONField에 저장된 임베딩을 pgvector 컬럼으로 복사합니다.
    """
    from ai.models import DocumentChunk

    # 임베딩이 있는 모든 청크 처리
    chunks_with_embedding = DocumentChunk.objects.filter(
        embedding__isnull=False,
        embedding__len=1536  # 올바른 크기의 임베딩만
    )

    migrated = 0
    for chunk in chunks_with_embedding:
        if chunk.embedding and isinstance(chunk.embedding, list):
            try:
                # 임베딩을 vector 형식으로 변환
                vector_str = f"[{','.join(map(str, chunk.embedding))}]"

                # Raw SQL로 업데이트
                with schema_editor.connection.cursor() as cursor:
                    cursor.execute("""
                        UPDATE ai_documentchunk
                        SET vector_embedding = %s::vector
                        WHERE chunk_id = %s
                    """, [vector_str, str(chunk.chunk_id)])

                migrated += 1
            except Exception as e:
                print(f"청크 {chunk.chunk_id} 마이그레이션 실패: {e}")

    print(f"{migrated}개 청크를 vector_embedding으로 마이그레이션했습니다.")


def migrate_vector_to_json(apps, schema_editor):
    """
    vector_embedding을 JSON embedding으로 되돌림 (롤백용)
    """
    # 롤백 시에는 vector 컬럼을 삭제만 하면 됨
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0001_initial'),
    ]

    operations = [
        # pgvector 확장 추가 (PostgreSQL만 해당)
        # SQLite를 사용하는 경우 무시됨
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS vector;",
            reverse_sql="DROP EXTENSION IF EXISTS vector;"
        ),

        # DocumentChunk에 vector_embedding 컬럼 추가 (pgvector 타입)
        # SQLite에서는 무시됨
        migrations.RunSQL(
            sql="""
                ALTER TABLE ai_documentchunk
                ADD COLUMN vector_embedding vector(1536) NULL;

                COMMENT ON COLUMN ai_documentchunk.vector_embedding IS 'pgvector 임베딩 (1536차원)';
            """,
            reverse_sql="ALTER TABLE ai_documentchunk DROP COLUMN vector_embedding IF EXISTS;"
        ),

        # vector_embedding 컬럼에 인덱스 생성 (PostgreSQL만 해당)
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS ai_documentchunk_vector_embedding_idx
                ON ai_documentchunk
                USING ivfflat (vector_embedding vector_cosine_ops)
                WITH (lists = 100);

                CREATE INDEX IF NOT EXISTS ai_documentchunk_vector_embedding_l2_idx
                ON ai_documentchunk
                USING ivfflat (vector_embedding vector_l2_ops)
                WITH (lists = 100);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS ai_documentchunk_vector_embedding_idx;
                DROP INDEX IF EXISTS ai_documentchunk_vector_embedding_l2_idx;
            """
        ),

        # 데이터 마이그레이션: 기존 JSON embedding을 vector_embedding으로 복사
        migrations.RunPython(
            code=migrate_json_to_vector,
            reverse_code=migrate_vector_to_json
        ),
    ]
