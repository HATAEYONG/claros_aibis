# -*- coding: utf-8 -*-
"""
Claude API Client
Anthropic Claude API와 통신하는 클라이언트

지원 모델:
- claude-sonnet-4-20250514 (최신 Sonnet 4)
- claude-3-5-sonnet-20241022
- claude-3-haiku-20240307
"""
import os
import json
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime

from django.conf import settings
from anthropic import Anthropic, AsyncAnthropic

logger = logging.getLogger(__name__)


@dataclass
class Message:
    """메시지 데이터 클래스"""
    role: str  # 'user' | 'assistant' | 'system'
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """API 요청 형식으로 변환"""
        result = {"role": self.role, "content": self.content}
        if self.metadata:
            result["metadata"] = self.metadata
        return result


@dataclass
class ClaudeResponse:
    """Claude API 응답 래퍼"""
    content: str
    model: str
    usage: Dict[str, int] = field(default_factory=dict)
    stop_reason: Optional[str] = None
    latency_ms: int = 0
    raw_response: Optional[Dict[str, Any]] = None

    @property
    def input_tokens(self) -> int:
        return self.usage.get("input_tokens", 0)

    @property
    def output_tokens(self) -> int:
        return self.usage.get("output_tokens", 0)

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


class ClaudeClient:
    """
    Anthropic Claude API 클라이언트

    주요 기능:
    - 동기/비동기 메시지 전송
    - 스트리밍 응답
    - 멀티턴 대화 지원
    - 토큰 사용량 추적
    - 재시도 로직
    """

    # 지원 모델
    MODEL_SONNET_4 = "claude-sonnet-4-20250514"
    MODEL_SONNET_3_5 = "claude-3-5-sonnet-20241022"
    MODEL_HAIKU = "claude-3-haiku-20240307"

    # 기본 설정
    DEFAULT_MODEL = MODEL_SONNET_4
    DEFAULT_MAX_TOKENS = 4096
    DEFAULT_TEMPERATURE = 0.3
    DEFAULT_TOP_P = 0.9

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
        top_p: float = DEFAULT_TOP_P,
    ):
        """
        Claude 클라이언트 초기화

        Args:
            api_key: Anthropic API 키 (None이면 settings에서 가져옴)
            model: 사용할 모델
            max_tokens: 최대 출력 토큰 수
            temperature: 샘플링 온도 (0-1)
            top_p: 핵 샘플링 파라미터
        """
        self.api_key = api_key or getattr(settings, 'ANTHROPIC_API_KEY', None)
        if not self.api_key:
            logger.warning("ANTHROPIC_API_KEY가 설정되지 않았습니다.")

        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p

        # 동기 클라이언트
        self.client = None
        if self.api_key:
            self.client = Anthropic(api_key=self.api_key)

        # 비동기 클라이언트 (lazy initialization)
        self._async_client = None

        # 사용량 추적
        self.total_tokens_used = 0

    @property
    def async_client(self) -> AsyncAnthropic:
        """비동기 클라이언트 (lazy initialization)"""
        if self._async_client is None and self.api_key:
            self._async_client = AsyncAnthropic(api_key=self.api_key)
        return self._async_client

    def messages_create(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        stream: bool = False,
        **kwargs
    ) -> ClaudeResponse:
        """
        메시지 생성 (동기)

        Args:
            messages: 메시지 리스트
            system_prompt: 시스템 프롬프트
            max_tokens: 최대 출력 토큰 수
            temperature: 샘플링 온도
            top_p: 핵 샘플링 파라미터
            stream: 스트리밍 모드
            **kwargs: 추가 API 파라미터

        Returns:
            ClaudeResponse: 응답 객체
        """
        if not self.client:
            return ClaudeResponse(
                content="",
                model=self.model,
                raw_response={"error": "API client not initialized"}
            )

        start_time = datetime.now()

        # API 요청 파라미터
        params = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "max_tokens": max_tokens or self.max_tokens,
            "temperature": temperature if temperature is not None else self.temperature,
            "top_p": top_p if top_p is not None else self.top_p,
            **kwargs
        }

        if system_prompt:
            params["system"] = system_prompt

        try:
            if stream:
                # 스트리밍 모드
                return self._stream_response(params, start_time)
            else:
                # 일반 모드
                response = self.client.messages.create(**params)
                return self._parse_response(response, start_time)

        except Exception as e:
            logger.error(f"Claude API 오류: {e}")
            return ClaudeResponse(
                content="",
                model=self.model,
                raw_response={"error": str(e)}
            )

    def _stream_response(self, params: Dict[str, Any], start_time: datetime) -> ClaudeResponse:
        """스트리밍 응답 처리"""
        content_parts = []
        with self.client.messages.stream(**params) as stream:
            for text in stream.text_stream:
                content_parts.append(text)

        content = "".join(content_parts)
        latency_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return ClaudeResponse(
            content=content,
            model=self.model,
            latency_ms=latency_ms
        )

    def _parse_response(self, response: Any, start_time: datetime) -> ClaudeResponse:
        """API 응답 파싱"""
        latency_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # 텍스트 추출
        content = ""
        if hasattr(response, 'content') and response.content:
            if isinstance(response.content, list):
                content = "".join(
                    block.text for block in response.content
                    if hasattr(block, 'text')
                )
            else:
                content = str(response.content)

        # 사용량 정보
        usage = {}
        if hasattr(response, 'usage'):
            usage = {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            }
            self.total_tokens_used += usage.get("total_tokens", 0)

        # 중단 이유
        stop_reason = None
        if hasattr(response, 'stop_reason'):
            stop_reason = response.stop_reason

        return ClaudeResponse(
            content=content,
            model=self.model,
            usage=usage,
            stop_reason=stop_reason,
            latency_ms=latency_ms,
            raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
        )

    async def acreate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> ClaudeResponse:
        """
        비동기 메시지 생성

        Args:
            messages: 메시지 리스트
            system_prompt: 시스템 프롬프트
            **kwargs: 추가 API 파라미터

        Returns:
            ClaudeResponse: 응답 객체
        """
        if not self.async_client:
            return ClaudeResponse(
                content="",
                model=self.model,
                raw_response={"error": "Async API client not initialized"}
            )

        start_time = datetime.now()

        params = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "max_tokens": kwargs.pop('max_tokens', self.max_tokens),
            **kwargs
        }

        if system_prompt:
            params["system"] = system_prompt

        try:
            response = await self.async_client.messages.create(**params)
            return self._parse_response(response, start_time)
        except Exception as e:
            logger.error(f"Claude API 비동기 오류: {e}")
            return ClaudeResponse(
                content="",
                model=self.model,
                raw_response={"error": str(e)}
            )

    def create_simple(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> ClaudeResponse:
        """
        단순 프롬프트 처리 헬퍼 메서드

        Args:
            prompt: 사용자 프롬프트
            system_prompt: 시스템 프롬프트
            **kwargs: 추가 파라미터

        Returns:
            ClaudeResponse: 응답 객체
        """
        messages = [Message(role="user", content=prompt)]
        return self.messages_create(messages, system_prompt, **kwargs)

    def get_token_estimate(self, text: str) -> int:
        """
        토큰 수 추정 (대략적: 1토큰 ≈ 4字符)

        Args:
            text: 텍스트

        Returns:
            추정 토큰 수
        """
        # 한글: 1토큰 ≈ 2-3자, 영문: 1토큰 ≈ 4字符
        korean_chars = sum(1 for c in text if ord(c) > 127)
        other_chars = len(text) - korean_chars
        return (korean_chars // 2) + (other_chars // 4)

    def reset_usage_tracking(self):
        """사용량 추적 리셋"""
        self.total_tokens_used = 0


# 싱글톤 인스턴스
_claude_client: Optional[ClaudeClient] = None


def get_claude_client(**kwargs) -> ClaudeClient:
    """
    Claude 클라이언트 싱글톤 인스턴스 가져오기

    Returns:
        ClaudeClient: 클라이언트 인스턴스
    """
    global _claude_client
    if _claude_client is None:
        _claude_client = ClaudeClient(**kwargs)
    return _claude_client


def reset_claude_client():
    """클라이언트 인스턴스 리셋"""
    global _claude_client
    _claude_client = None
