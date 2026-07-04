"""
LLM Service
AI 어시스턴트를 위한 LLM 연동 서비스
"""

import os
import json
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.core.cache import cache
import requests


class LLMService:
    """LLM 서비스 클래스"""

    def __init__(self):
        self.provider = getattr(settings, 'LLM_PROVIDER', 'local')
        self.model = getattr(settings, 'LLM_MODEL', 'gpt-3.5-turbo')
        self.api_key = getattr(settings, 'ANTHROPIC_API_KEY', None) or getattr(settings, 'OPENAI_API_KEY', None)
        self.api_base = getattr(settings, 'LLM_API_BASE', None)
        self.temperature = getattr(settings, 'LLM_TEMPERATURE', 0.7)
        self.max_tokens = getattr(settings, 'LLM_MAX_TOKENS', 2000)

    def get_config(self) -> Dict[str, Any]:
        """LLM 설정 반환"""
        return {
            'provider': self.provider,
            'model': self.model,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'api_base': self.api_base
        }

    def save_config(self, config: Dict[str, Any]):
        """LLM 설정 저장"""
        self.provider = config.get('provider', 'local')
        self.model = config.get('model', 'gpt-3.5-turbo')
        self.api_key = config.get('apiKey')
        self.api_base = config.get('apiBase')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('maxTokens', 2000)

    def generate_answer(
        self,
        question: str,
        context: str = '',
        sources: List[Dict] = None
    ) -> str:
        """LLM을 통한 답변 생성"""

        # RAG 컨텍스트 구성
        rag_context = self._build_rag_context(question, sources)

        # 프롬프트 구성
        messages = [
            {
                "role": "system",
                "content": self._get_system_prompt()
            }
        ]

        if context:
            messages.append({
                "role": "system",
                "content": f"추가 컨텍스트:\n{context}"
            })

        if rag_context:
            messages.append({
                "role": "system",
                "content": f"참고 문서:\n{rag_context}"
            })

        messages.append({
            "role": "user",
            "content": question
        })

        # LLM 호출
        if self.provider == 'local':
            return self._call_local_llm(messages)
        elif self.provider == 'anthropic':
            return self._call_anthropic(messages)
        elif self.provider == 'openai':
            return self._call_openai(messages)
        else:
            return self._fallback_answer(question)

    def generate_sql(self, question: str, schema: str = '') -> Dict[str, Any]:
        """Text to SQL 생성"""
        # 시스템 프롬프트
        system_prompt = """당신은 SQL 전문가입니다. 자연어 질문을 분석하여 적절한 SQL 쿼리를 생성하세요.

데이터베스 스키마 정보:
{schema}

지침:
1. 질문의 의도를 정확히 파악하세요
2. 안전한 쿼리를 생성하세요 (SQL 인젝션 방지)
3. 복잡한 쿼리는 필요한 경우만 JOIN을 사용하세요
4. 결과 설명을 제공하세요

SQL 쿼리만 JSON 형식으로 반환하세요."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"질문: {question}\n\nSQL 쿼리:"}
        ]

        try:
            if self.provider == 'anthropic':
                response_text = self._call_anthropic(messages)
            elif self.provider == 'openai':
                response_text = self._call_openai(messages)
            else:
                response_text = self._call_local_llm(messages)

            # SQL 추출
            sql = self._extract_sql(response_text)

            # 관련 테이블 추출
            tables = self._extract_tables(sql)

            return {
                'sql': sql,
                'explanation': '질문에 대한 SQL 쿼리입니다.',
                'tables': tables
            }
        except Exception as e:
            # 폴백 SQL 생성
            return self._generate_fallback_sql(question)

    def search_relevant_documents(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """RAG를 위한 관련 문서 검색"""
        try:
            # 캐시에서 검색
            cache_key = f"rag_search:{hash(query)}"
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result

            # 백엔드 knowledge 시스템 또는 벡터 검색
            # (여기서는 간단히 구현)
            from knowledge.models import DocumentChunk

            # 간단한 키워드 매칭 (실제로는 벡터 유사도 검색 사용)
            chunks = DocumentChunk.objects.filter(
                content__icontains=query
            )[:limit]

            results = []
            for chunk in chunks:
                results.append({
                    'type': 'document',
                    'content': chunk.content[:200] + '...' if len(chunk.content) > 200 else chunk.content,
                    'confidence': 0.85,
                    'source': chunk.document.title if hasattr(chunk, 'document') else '문서'
                })

            # 캐시 저장 (5분)
            cache.set(cache_key, results, timeout=300)

            return results

        except Exception as e:
            print(f"문서 검색 실패: {e}")
            return []

    def _build_rag_context(self, question: str, sources: List[Dict] = None) -> str:
        """RAG 컨텍스트 구성"""
        if not sources:
            return ""

        context_parts = []
        for source in sources[:3]:  # 상위 3개만 사용
            context_parts.append(f"- [{source.get('type', 'unknown')}]: {source.get('content', '')[:100]}")

        return "\n".join(context_parts)

    def _get_system_prompt(self) -> str:
        """시스템 프롬프트"""
        return """당신은 넷플러스 MIS 시스템의 AI 어시스턴트입니다.

제조업 데이터 분석, 경영 지표 해석, 프로세스 최적화 등 다양한 질문에 답변할 수 있습니다.

답변 시 다음 사항을 고려하세요:
1. 정확하고 최신의 데이터를 기반으로 답변하세요
2. 필요한 경우 데이터 시각화나 차트를 제안하세요
3. 구체적이고 실행 가능한 조언을 제공하세요
4. 한국어로 친절하고 전문적으로 답변하세요

사용 가능한 데이터:
- 생산 데이터: 생산량, 가동률, 불량률 등
- 품질 데이터: 검사 결과, CPK, 불량 원인 등
- 재무 데이터: 매출, 비용, 이익 등
- 영업 데이터: 주문, 수주, 고객 정보 등
- 재고 데이터: 재고 수주, 입출고 현황 등
- 인사 데이터: 직원 정보, 급여 등"""

    def _call_openai(self, messages: List[Dict]) -> str:
        """OpenAI API 호출"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }

            data = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens
            }

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            return result['choices'][0]['message']['content']

        except Exception as e:
            print(f"OpenAI API 호출 실패: {e}")
            return self._fallback_answer(messages[-1]['content'])

    def _call_anthropic(self, messages: List[Dict]) -> str:
        """Anthropic Claude API 호출"""
        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }

            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }

            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            return result['content'][0]['text']

        except Exception as e:
            print(f"Anthropic API 호출 실패: {e}")
            return self._fallback_answer(messages[-1]['content'])

    def _call_local_llm(self, messages: List[Dict]) -> str:
        """로컬 LLM 호출 (Ollama 등)"""
        try:
            if self.api_base:
                url = f"{self.api_base}/api/generate"
                headers = {"Content-Type": "application/json"}

                # 프롬프트를 단일 텍스트로 변환
                prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])

                data = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }

                response = requests.post(url, headers=headers, json=data, timeout=60)
                response.raise_for_status()

                result = response.json()
                return result.get('response', '응답 생성 실패')

            else:
                return self._fallback_answer(messages[-1]['content'])

        except Exception as e:
            print(f"로컬 LLM 호출 실패: {e}")
            return self._fallback_answer(messages[-1]['content'])

    def _fallback_answer(self, question: str) -> str:
        """폴백 답변 생성"""
        question_lower = question.lower()

        # 간단한 키워드 기반 응답
        if any(keyword in question_lower for keyword in ['생산', 'production', '만들어']):
            return "생산 데이터를 조회하려면 다음 SQL을 사용하세요:\n\nSELECT * FROM production_production ORDER BY production_date DESC LIMIT 100;"

        elif any(keyword in question_lower for keyword in ['품질', 'quality', '불량률']):
            return "품질 데이터를 조회하려면 다음 SQL을 사용하세요:\n\nSELECT * FROM quality_qualitycheck ORDER BY check_date DESC LIMIT 100;"

        elif any(keyword in question_lower for keyword in ['매출', 'revenue', '판매', 'sales']):
            return "매출 데이터를 조회하려면 다음 SQL을 사용하세요:\n\nSELECT * FROM sales_sales ORDER BY sales_date DESC LIMIT 100;"

        elif any(keyword in question_lower for keyword in ['재고', 'inventory', '재고량']):
            return "재고 데이터를 조회하려면 다음 SQL을 사용하세요:\n\nSELECT * FROM inventory_inventory ORDER BY last_updated DESC LIMIT 100;"

        else:
            return "죄송합니다. 질문에 대한 답변을 생성할 수 없습니다. 더 구체적인 질문을 해주세요."

    def _generate_fallback_sql(self, question: str) -> Dict[str, Any]:
        """폴백 SQL 생성"""
        question_lower = question.lower()

        # 간단한 SQL 매핑
        if '생산' in question_lower or 'production' in question_lower:
            return {
                'sql': 'SELECT * FROM production_production ORDER BY production_date DESC LIMIT 100;',
                'explanation': '최근 생산 데이터를 조회합니다.',
                'tables': ['production_production']
            }
        elif '품질' in question_lower or 'quality' in question_lower:
            return {
                'sql': 'SELECT * FROM quality_qualitycheck ORDER BY check_date DESC LIMIT 100;',
                'explanation': '최근 품질 검사 결과를 조회합니다.',
                'tables': ['quality_qualitycheck']
            }
        elif '매출' in question_lower or 'revenue' in question_lower or '판매' in question_lower:
            return {
                'sql': 'SELECT * FROM sales_sales ORDER BY sales_date DESC LIMIT 100;',
                'explanation': '최근 매출 데이터를 조회합니다.',
                'tables': ['sales_sales']
            }
        else:
            return {
                'sql': 'SELECT 1;',
                'explanation': 'SQL을 생성할 수 없습니다. 더 구체적인 질문을 해주세요.',
                'tables': []
            }

    def _extract_sql(self, response_text: str) -> str:
        """응답에서 SQL 추출"""
        # SQL 코드 블록 찾기
        import re

        # 코드 블록 찾기
        sql_match = re.search(r'```sql\n(.*?)\n```', response_text, re.DOTALL)
        if sql_match:
            return sql_match.group(1).strip()

        # SELECT로 시작하는 문장 찾기
        select_match = re.search(r'SELECT.*?(?=\n\n|;\n|$)', response_text, re.IGNORECASE | re.DOTALL)
        if select_match:
            return select_match.group(0).strip()

        return "SELECT * FROM production_production LIMIT 10;"

    def _extract_tables(self, sql: str) -> List[str]:
        """SQL에서 테이블 추출"""
        import re

        # FROM 절의 테이블 찾기
        tables = re.findall(r'FROM\s+(\w+)', sql, re.IGNORECASE)
        return list(set(tables))


# 전역 서비스 인스턴스
_llm_service_instance = None

def get_llm_service():
    """LLM 서비스 인스턴스 반환 (싱글톤)"""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
