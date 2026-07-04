# -*- coding: utf-8 -*-
"""
AI Module for Claros MIS-AI Dashboard

Phase 1 업그레이드:
- LLM Integration (Claude API)
- LangChain Infrastructure
- Vector Database (pgvector)
"""

# Database Connection
from .database_connection import YHDatabaseConnection, get_db_connection, get_yh_db_config

# LLM Integration (Phase 1)
from .llm import ClaudeClient, get_claude_client, PromptTemplate, get_prompt_template

# LangChain Integration (Phase 1)
from .langchain_integration import (
    LangChainTool,
    AgentMemory,
    ToolRegistry,
    get_langchain_tools,
)

# Vector Store (Phase 1)
from .vector_store import (
    VectorStoreBackend,
    JSONVectorStore,
    PgVectorStore,
    get_vector_store,
    EmbeddingGenerator,
    get_embedding_generator,
)

__all__ = [
    # Database
    'YHDatabaseConnection', 'get_db_connection', 'get_yh_db_config',
    # LLM
    'ClaudeClient', 'get_claude_client', 'PromptTemplate', 'get_prompt_template',
    # LangChain
    'LangChainTool', 'AgentMemory', 'ToolRegistry', 'get_langchain_tools',
    # Vector Store
    'VectorStoreBackend', 'JSONVectorStore', 'PgVectorStore',
    'get_vector_store', 'EmbeddingGenerator', 'get_embedding_generator',
]

# 기본 설정
default_app_config = 'ai.apps.AIConfig'
