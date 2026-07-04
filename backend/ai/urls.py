# AI Prediction URLs
from django.urls import path, include
from rest_framework.routers import SimpleRouter

from .views import PredictionViewSet, ai_chat, text_to_sql, search_documents, get_llm_config, save_llm_config, get_available_models
from .chat_services import (
    ontology_search,
    causal_analysis, lot_trace
)
from .chat_services_enhanced import (
    ai_chat_enhanced, agent_execute, agent_registry, agent_execution_history
)
from .rag_views import (
    DocumentUploadView,
    DocumentChunkView,
    BatchDocumentChunkView,
    HybridSearchView,
    RAGGenerateView,
    DocumentListView,
    ChunkListView,
)
from . import messaging_views


router = SimpleRouter()
router.register(r'predictions', PredictionViewSet, basename='prediction')

urlpatterns = [
    path('', include(router.urls)),

    # AI Chat & Analysis Endpoints (기존)
    path('chat/', ai_chat, name='ai-chat'),
    path('sql/text-to-sql/', text_to_sql, name='text-to-sql'),
    path('ontology/search/', ontology_search, name='ontology-search'),
    path('analysis/causal/', causal_analysis, name='causal-analysis'),
    path('lot/trace/<str:lot_no>/', lot_trace, name='lot-trace'),

    # Enhanced AI Chat with Agent Orchestration (신규)
    path('chat/v2/', ai_chat_enhanced, name='ai-chat-enhanced'),
    path('agents/execute/', agent_execute, name='agent-execute'),
    path('agents/registry/', agent_registry, name='agent-registry'),
    path('agents/history/', agent_execution_history, name='agent-history'),

    # RAG Endpoints (Phase 8)
    path('rag/upload/', DocumentUploadView.as_view(), name='rag-upload'),
    path('rag/chunk/', DocumentChunkView.as_view(), name='rag-chunk'),
    path('rag/chunk/batch/', BatchDocumentChunkView.as_view(), name='rag-chunk-batch'),
    path('rag/search/', HybridSearchView.as_view(), name='rag-search'),
    path('rag/generate/', RAGGenerateView.as_view(), name='rag-generate'),
    path('rag/documents/', DocumentListView.as_view(), name='rag-documents'),
    path('rag/chunks/', ChunkListView.as_view(), name='rag-chunks'),

    # Phase 5: AI Assistant API
    path('chat/', ai_chat, name='ai-chat-v2'),
    path('sql/', text_to_sql, name='text-to-sql-v2'),
    path('search/', search_documents, name='search-documents'),
    path('config/', get_llm_config, name='get-llm-config'),
    path('config/', save_llm_config, name='save-llm-config'),
    path('models/', get_available_models, name='get-available-models'),

    # Messaging Agent Integration (자율 AI 에이전트)
    path('messaging/webhook/slack/', messaging_views.SlackWebhookView.as_view(), name='slack-webhook'),
    path('messaging/webhook/telegram/', messaging_views.TelegramWebhookView.as_view(), name='telegram-webhook'),
    path('messaging/webhook/discord/', messaging_views.DiscordWebhookView.as_view(), name='discord-webhook'),
    path('messaging/config/', messaging_views.messaging_agent_config, name='messaging-config'),
    path('messaging/test/', messaging_views.send_test_message, name='send-test-message'),
    path('messaging/sessions/', messaging_views.agent_sessions, name='agent-sessions'),
    path('messaging/notify/', messaging_views.proactive_notification, name='proactive-notification'),
    path('messaging/process/', messaging_views.process_agent_message, name='process-agent-message'),
]
