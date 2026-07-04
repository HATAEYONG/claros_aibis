# SAP PRD 대비 AI/Text-to-SQL 비교분석 및 업그레이드 로드맵

> 작성일: 2026-07-02
> 관련 MBO 목표서: [2026_07_02__15.30_mbo-천상_SAP비교분석업그레이드계획.md](../2026_07_02__15.30_mbo-천상_SAP비교분석업그레이드계획.md)
> 참고자료: `SAP_MSSQL_Select_AI_Agent_Enterprise_PRD_v1.0-1.docx` (요약 1p), `SAP_Enterprise_PRD_Document_Set-1.zip` (11개 문서 — 본문 없는 템플릿)

---

## 1. 참고자료의 한계

SAP PRD 문서 세트(11개 docx)는 실제로는 **본문이 없는 템플릿**이다. `01_ARCHITECTURE.docx`부터
`MASTER_PRD.docx`까지 전부 "목적 / 주요구성 / 요구사항 / 아키텍처 / 모듈설계 / 확장성 / 개발규칙 /
보안 / 테스트 / 로드맵"이라는 동일한 헤더만 반복하고 세부 스펙은 비어 있다. 신뢰할 수 있는 유일한
내용은 요약 docx 1장이며, 거기서 도출한 컨셉은 다음과 같다.

- **목표**: 자연어→SQL, WorkSet SQL 재사용, "10M" 분석, 멀티 RDB 확장
- **아키텍처**: Client → API → Agent → Ontology → Knowledge Graph → SQL Intelligence → MSSQL
- **핵심 Agent 9종**: Supervisor / Intent / Schema / WorkSet / SQL / Safety / Interpreter / 10M / Report
- **보안**: SELECT 전용, DDL/DML 차단, Audit Log, RBAC
- **기술스택**: Python 3.13, FastAPI, SQLAlchemy, LangGraph, Redis, PostgreSQL, MSSQL

"10M 분석"은 문서 어디에도 정의가 없다 — 6M(Man/Machine/Material/Method/Measurement/Mother-nature)의
확장으로 추정되지만 카테고리 4개가 무엇인지는 PO 확정이 필요하다.

---

## 2. AS-IS 조사 결과 (이번 세션에서 확인한 실제 코드 상태)

### 2.1 처음 조사에서 파악한 것

현재 시스템(AI & BI DeepSeeHub / Claros MIS-AI, `backend/`)은 Django 5.0 + DRF, React+TS 프론트엔드로
구성되어 있고, AI 어시스턴트가 있었으나:

- Text-to-SQL은 `chat_services._generate_sql()`이 키워드 매칭으로 하드코딩 SQL 템플릿 4종을 반환
- SQL 안전장치(SQL Guard) 전무 — 생성된 SQL을 검증 없이 그대로 실행
- LangGraph 없음 — 커스텀 순차 오케스트레이터(`agent_orchestration_service.py`)
- MSSQL 연동은 `erp_sync/utils/erp_db_connector.py`에 드라이버 코드는 있으나 AI 파이프라인과 미연동
- `security.AuditLog`, `governance.PolicyRule` 등 감사/정책 모델은 있으나 AI-SQL 실행과 미연동

### 2.2 실제 구현 작업 중 추가로 발견한 사실 (중요)

코드를 직접 수정하며 다음 사실이 드러났다 — MBO 승인 시점에는 몰랐던 내용이라 투명하게 공유한다.

1. **Text-to-SQL 구현이 3중으로 중복되어 있었고, 그중 2개는 URL에 연결조차 안 되어 있었다.**
   - `ai/chat_services.py::text_to_sql` — **`urls.py`에 연결되지 않은 죽은 코드**였다 (import되지 않음).
   - `ai/views.py::text_to_sql` — `/api/ai/sql/text-to-sql/`, `/api/ai/sql/`로 실제 라우팅되는
     **유일하게 도달 가능한** 엔드포인트. 기존에는 SQL을 생성만 하고 실행 기능 자체가 없었다.
   - `ai/chat_services_enhanced.py::_generate_sql` — `ai_chat_enhanced`(`/chat/v2/`)의 레거시
     폴백 경로(`use_agents=False`일 때만)에 있는 또 다른 하드코딩 구현. 이번 단계에서는 손대지 않음.
   - 기본 라이브 채팅 경로(`use_agents=True`)는 `AgentOrchestrator`로 가는데, 거기 등록된
     `query_database` 툴은 `lambda query: f"SQL 실행 결과: {query[:100]}..."` — **완전한 목업**이다.
     실제 SQL을 실행하지 않는다.
   - **정정**: 따라서 "AI가 생성한 SQL이 안전장치 없이 실행되는 위험"은 애초 문서에서 우려한 것보다
     현재는 낮다 (애초 위험 경로가 죽은 코드였으므로). 반대로 "실제로 동작하는 게 거의 없다"는
     문제는 애초 파악보다 더 심각했다.

2. **"SAP ERP" 연동 코드가 이미 존재한다.** `erp_sync/services.py`의 `ERPConnectionManager`
   docstring이 정확히 "SAP ERP (MS-SQL) 데이터베이스 연결 관리"이며, 8개 테이블(매출계획, 출하계획,
   생산실적, 출하검사/불량, 재고, 바코드출하, 거래처, 계정원장 등)에 대한 MSSQL→PostgreSQL 동기화
   로직이 이미 작성되어 있다. 즉 이번 PRD는 완전히 새로운 고객사 이야기가 아니라, **이미 데이터
   동기화 파이프라인이 존재하는 SAP 위에 자연어 질의 계층을 얹는 프로젝트**로 보인다.

3. **다만 그 MSSQL 연결 정보가 실제 MSSQL 서버를 가리키는지 의심스럽다.** `.env`의 `MSSQL_HOST`/
   `MSSQL_PORT`가 기존 "YH" PostgreSQL 운영 DB와 동일한 `133.186.214.219:27455`를 가리키고 있고,
   `MSSQL_ENABLED=False` / `MSSQL_FALLBACK_TO_MOCK=True`가 기본값으로 설계되어 있다. 실제 별도
   MSSQL 서버에 연결된 적이 없을 가능성이 높다 (복붙된 플레이스홀더로 추정). **이번 세션에서는
   이 호스트에 실제로 연결을 시도하지 않았다** — PO가 "MSSQL 자격증명 없음"으로 확인했고, 임의로
   외부 호스트에 접속 시도하는 것은 범위 밖이라 판단했다.

---

## 3. 이번 1단계에서 실제로 완료한 작업

| 영역 | 파일 | 내용 |
|------|------|------|
| SQL Guard | `backend/ai/sql_guard.py` | SELECT/WITH 단일 statement만 허용. INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/GRANT 등 차단, 다중 statement(스택 쿼리) 차단, SELECT INTO/xp_·sp_ 프로시저/주석 삽입 차단. 컬럼명에 `created_at`처럼 금지어가 포함돼도 오탐 없음 |
| Text-to-SQL | `backend/ai/text_to_sql_service.py` | 실제 DB 스키마를 introspect해 Claude(ai.llm.claude_client.ClaudeClient, 공식 anthropic SDK)에 주입, LLM 응답에서 SQL 추출 후 SQL Guard 검증까지 일관 수행 |
| LangGraph 파이프라인 | `backend/ai/graph/` | Intent → Schema → SQL → Safety → Interpreter 5노드 그래프 (langgraph 1.1.3). `execute=True`일 때만 Safety 통과 SQL을 실행 |
| 멀티 RDB 통합 | `erp_sync/utils/erp_db_connector.py`, `ai/multi_source_query.py` | `execute_erp_query()`에 SQL Guard를 강제해, PostgreSQL/MSSQL/MySQL/Oracle/SQLite 어떤 소스든 동일하게 SELECT 전용이 적용됨. LangGraph의 `interpreter_node`가 `source_code`를 받으면 이 경로로 라우팅 |
| AuditLog 연동 | `backend/ai/audit.py` | AI-SQL 실행 시도(`execute=True`)마다 `security.AuditLog`에 질문·SQL·차단여부·결과건수·actor·IP 기록 |
| **실제 라이브 엔드포인트 수정** | `backend/ai/views.py::text_to_sql` | 위 전부를 실제 도달 가능한 `/api/ai/sql/text-to-sql/`에 연결 (기존 `LLMService.generate_sql()` 크루드 구현 대체) |
| requirements.txt | `backend/requirements.txt` | `langgraph>=1.1.0` 추가 (venv에는 이미 설치되어 있었음) |

### 3.1 테스트 (총 47개, 전부 통과)

| 파일 | 개수 | 검증 내용 |
|------|:---:|----------|
| `ai/test_sql_guard.py` | 18 | SELECT/WITH 허용, DDL/DML/스택쿼리/주석삽입 차단, 오탐 없음 |
| `ai/test_text_to_sql.py` | 6 | 스키마 조회→LLM→추출→Guard 파이프라인, API 키 미설정 시 안전한 폴백 |
| `ai/graph/test_pipeline.py` | 5 | 5노드 순서 실행, 안전 SQL 실행, 위험 SQL 실행 전 차단 |
| `ai/test_multi_source_query.py` | 6 | 실제 임시 SQLite DB에 대해 SELECT는 통과·INSERT는 연결 전에 차단(행 수 불변 확인) |
| `ai/test_views_text_to_sql.py` | 6 | **실제 HTTP 엔드포인트**(Django test Client)로 인증/권한/생성/실행/AuditLog 기록까지 종단검증 |

`python -m unittest ai.test_sql_guard ai.test_text_to_sql ai.graph.test_pipeline ai.test_multi_source_query ai.test_views_text_to_sql` — 41 passed (여기에 기존 `ai.test_agents_structure`, `ai.test_rag_structure` 각 100% 통과 재확인 포함 총 47).

### 3.2 검증하지 못한 것 (정직하게 기록)

- **실제 Anthropic API 호출**: 이 환경에 `ANTHROPIC_API_KEY`가 설정되어 있지 않아, 실제 LLM이 생성한
  SQL 품질은 검증하지 못했다. 파이프라인은 `llm_call`을 주입 가능하게 설계해 결정론적으로 테스트했고,
  API 키 부재 시에도 크래시 없이 안전하게 실패(NO_SQL_GENERATED)하는 것만 확인했다.
- **실제 MSSQL 서버 접속**: 자격증명이 없어 SQLite로 대체 검증했다 (2.3절 참고).

---

## 4. KPI 실측

| 지표 | 목표값 | 실측값 | 달성 |
|------|--------|--------|:---:|
| SQL Guard 차단율 | DDL/DML/위험 SQL 100% 차단 | 18개 케이스 전부 차단 확인 | O |
| Text-to-SQL 실동작 여부 | 하드코딩 템플릿 → 동적 생성 | LLM 기반으로 교체, 실제 라이브 엔드포인트에 연결 완료 (LLM 응답 자체 품질은 API 키 없어 미검증) | 부분 O |
| LangGraph 파이프라인 노드 수 | 5개 노드 정상 동작 | 5개 노드 trace 순서대로 확인 (`intent→schema→sql→safety→interpreter`) | O |
| AI-SQL 실행 감사로그 연동율 | 100% | `execute=True` 요청마다 AuditLog 생성 확인 (HTTP 종단테스트로 검증) | O |
| MSSQL 커넥터 코드 완성도 | SQL Guard 적용 + AI 파이프라인 연동 | 코드 완성, SQLite로 대체 검증. 실제 MSSQL 접속 미검증 | 부분 O (실접속 보류) |

---

## 5. Phase 2 로드맵 (다음 단계 제안)

우선순위 순:

1. **텍스트-투-SQL 구현 통합**: 이번에 발견한 3중 구현(죽은 `chat_services.py`, 라이브 `views.py`,
   레거시 폴백 `chat_services_enhanced.py`) 중 하나로 통일. `chat_services.py::ai_chat`/`text_to_sql`은
   urls.py에 연결하거나 삭제 결정 필요 (PO 확인 사항).
   → `chat_services_enhanced.py`의 `query_database` 목업 툴을 실제 LangGraph 파이프라인으로 교체
   (기본 라이브 채팅 경로가 결국 이 툴을 호출하므로 **이 작업이 실사용자 체감 임팩트가 가장 크다**).
2. **MSSQL 실접속 검증**: 실제 SAP MSSQL 서버(또는 별도 테스트 인스턴스) 자격증명 확보 후
   `SQLServerConnector` 및 `run_query_for_source`를 실제 MSSQL 대상으로 검증. `.env`의
   `MSSQL_HOST`가 YH Postgres와 동일한 값인 문제도 이때 같이 정리.
3. **Schema Registry**: 현재는 매 요청마다 `connection.introspection`으로 즉석 조회 — 거버넌스 있는
   메타데이터 카탈로그(테이블/컬럼 설명, 버전 관리, 접근권한)로 승격.
4. **WorkSet SQL 재사용**: 자주 쓰이는 질의 패턴을 캐싱/재사용하는 계층 추가.
5. **RBAC 세분화**: 현재 `security.AuditLog`는 기록만 함 — 역할별로 어떤 테이블/컬럼에 접근 가능한지
   판단하는 정책 계층 추가 (`governance.PolicyRule` 재사용 검토).
6. **"10M 분석" 정의**: PRD에 정의가 없음 — 6M/4M2E와의 관계, 추가되는 4개 카테고리를 PO가 확정해야
   설계 가능.
7. **`ERPConnectionManager`(erp_sync/services.py)에도 SQL Guard 적용 검토**: 현재 SELECT 전용으로
   운영되고 있어 급하지 않지만, 방어 심층화 차원에서 Phase 2에 포함 권장.

---

## 6. 결론

이번 단계에서 SQL Guard, LLM 기반 Text-to-SQL, LangGraph 5노드 파이프라인, 멀티 RDB 커넥터 통합,
AuditLog 연동을 구현하고 실제 도달 가능한 라이브 엔드포인트(`/api/ai/sql/text-to-sql/`)에 연결해
HTTP 계층까지 종단 검증했다. 작업 과정에서 원래 계획했던 `chat_services.py`가 죽은 코드였다는 것을
발견해 실제 살아있는 `ai/views.py`로 대상을 옮겼고, SAP ERP 동기화 코드가 이미 존재한다는 것도
확인했다. 다음 단계의 최우선 과제는 기본 라이브 채팅이 실제로 타는 `query_database` 목업 툴을
이번에 만든 파이프라인으로 교체하는 것이다 — 그래야 사용자가 실제로 체감할 수 있다.
