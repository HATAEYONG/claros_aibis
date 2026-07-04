# AI Assistant API Views
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta, date
import time

from .prediction_engine import AIPredictionEngine
from .llm_service import LLMService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    """AI 질문 답변 (RAG)"""
    try:
        data = request.data
        question = data.get('question', '')
        context = data.get('context', '')
        use_rag = data.get('use_rag', True)

        if not question:
            return Response(
                {'error': '질문이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # LLM 서비스 인스턴스
        llm_service = LLMService()

        start_time = time.time()

        # RAG 검색이 필요한 경우
        sources = []
        if use_rag:
            sources = llm_service.search_relevant_documents(question, limit=3)

        # LLM을 통한 답변 생성
        answer = llm_service.generate_answer(
            question,
            context,
            sources=sources
        )

        processing_time = (time.time() - start_time) * 1000

        return Response({
            'answer': answer,
            'sources': sources,
            'metadata': {
                'model': llm_service.model,
                'provider': llm_service.provider,
                'tokens_used': len(answer.split()) * 1.3,  # 추정치
                'processing_time': round(processing_time, 2)
            }
        })
    except Exception as e:
        return Response(
            {'error': f'AI 응답 생성 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def text_to_sql(request):
    """
    Text to SQL 변환 (LangGraph 파이프라인: Intent→Schema→SQL→Safety→Interpreter)

    이 뷰가 실제로 URL에 연결된(도달 가능한) text-to-SQL 엔드포인트다
    (`/api/ai/sql/text-to-sql/`, `/api/ai/sql/`). 기존에는 LLMService.generate_sql()
    (requests 기반 crude 구현)로 SQL만 생성하고 안전성 검증·실행 기능이 없었다.
    이제 ai.graph.run_pipeline()에 위임해 실제 DB 스키마를 인지한 SQL을 생성하고,
    SQL Guard로 SELECT 전용을 강제하며, execute=true일 때만 안전성 검증을 통과한
    SQL을 실행하고 AuditLog에 기록한다.

    Request Body:
    {
        "question": "자연어 질문",
        "execute": false  // 선택적: true면 SQL Guard 통과 시 실제 실행
    }
    """
    try:
        data = request.data
        question = data.get('question', '')
        execute = bool(data.get('execute', False))

        if not question:
            return Response(
                {'error': '질문이 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from ai.audit import log_ai_sql_execution
        from ai.graph import run_pipeline

        state = run_pipeline(question, execute=execute)

        if execute:
            log_ai_sql_execution(
                request, question, state.get('sql', ''),
                guard_violation=state.get('guard_violation'),
                result_count=len(state.get('results') or []),
                error=state.get('error'),
            )

        response_data = {
            'sql': state.get('sql', ''),
            'explanation': state.get('explanation', ''),
            'tables': state.get('tables', []),
            'safe': state.get('safe', False),
            'guard_violation': state.get('guard_violation'),
        }
        if execute:
            response_data['results'] = state.get('results', [])
            response_data['error'] = state.get('error')

        if not state.get('safe'):
            return Response(response_data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response(response_data)
    except Exception as e:
        return Response(
            {'error': f'SQL 생성 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_documents(request):
    """관련 문서 검색 (RAG)"""
    try:
        data = request.data
        query = data.get('query', '')
        limit = data.get('limit', 5)

        if not query:
            return Response(
                {'error': '검색어가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        llm_service = LLMService()

        # 문서 검색
        results = llm_service.search_relevant_documents(query, limit)

        return Response({
            'results': results
        })
    except Exception as e:
        return Response(
            {'error': f'문서 검색 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_llm_config(request):
    """LLM 설정 조회"""
    try:
        llm_service = LLMService()
        config = llm_service.get_config()

        return Response({
            'provider': config.get('provider', 'local'),
            'model': config.get('model', 'gpt-3.5-turbo'),
            'temperature': config.get('temperature', 0.7),
            'max_tokens': config.get('max_tokens', 2000)
        })
    except Exception as e:
        return Response(
            {'error': f'설정 조회 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_llm_config(request):
    """LLM 설정 저장"""
    try:
        data = request.data
        llm_service = LLMService()

        # 설정 저장
        llm_service.save_config(data)

        return Response({'message': '설정이 저장되었습니다.'})
    except Exception as e:
        return Response(
            {'error': f'설정 저장 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_models(request):
    """지원 가능한 LLM 모델 목록"""
    try:
        models = [
            {
                'provider': 'OpenAI',
                'models': [
                    {'id': 'gpt-4', 'name': 'GPT-4', 'description': '가장 강력한 모델'},
                    {'id': 'gpt-4-turbo', 'name': 'GPT-4 Turbo', 'description': '빠르고 강력한 모델'},
                    {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'description': '빠르고 경제적인 모델'}
                ]
            },
            {
                'provider': 'Anthropic',
                'models': [
                    {'id': 'claude-3-opus', 'name': 'Claude 3 Opus', 'description': '복잡한 작업에 최적화'},
                    {'id': 'claude-3-sonnet', 'name': 'Claude 3 Sonnet', 'description': '균형형 성능'},
                    {'id': 'claude-3-haiku', 'name': 'Claude 3 Haiku', 'description': '매우 빠른 응답'}
                ]
            },
            {
                'provider': 'Local',
                'models': [
                    {'id': 'llama-3', 'name': 'LLaMA 3', 'description': '로컬 LLM'},
                    {'id': 'mistral', 'name': 'Mistral', 'description': '경량형 로컬 모델'}
                ]
            }
        ]

        return Response(models)
    except Exception as e:
        return Response(
            {'error': f'모델 목록 조회 실패: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# AI Prediction API Views (기존 코드 유지)


class PredictionViewSet(viewsets.ViewSet):
    """AI Prediction API ViewSet"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.engine = AIPredictionEngine()

    def list(self, request):
        """List all available prediction models"""
        models = []
        for code, config in self.engine.PREDICTION_MODELS.items():
            models.append({
                'code': code,
                'name': config['name'],
                'target_kpi': config['target_kpi'],
                'horizon': config['horizon'],
                'model_type': config['model'],
                'features': config['features']
            })

        return Response({
            'total': len(models),
            'models': models
        })

    @action(detail=False, methods=['get'])
    def predict(self, request):
        """Generate prediction for a specific KPI"""
        prediction_code = request.query_params.get('code')

        if not prediction_code:
            return Response(
                {'error': 'prediction_code parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = self.engine.predict(prediction_code)

        if result is None:
            return Response(
                {'error': f'Unknown prediction code: {prediction_code}'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'kpi_code': result.kpi_code,
            'kpi_name': result.kpi_name,
            'predicted_value': result.predicted_value,
            'confidence': result.confidence,
            'horizon': result.prediction_horizon,
            'model_used': result.model_used,
            'features_used': result.features_used,
            'predicted_at': result.predicted_at.isoformat(),
            'target_date': result.target_date.isoformat()
        })

    @action(detail=False, methods=['get'])
    def anomalies(self, request):
        """Detect anomalies for a specific KPI"""
        kpi_code = request.query_params.get('kpi_code')
        threshold = float(request.query_params.get('threshold', 2.0))

        if not kpi_code:
            return Response(
                {'error': 'kpi_code parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        anomalies = self.engine.detect_anomalies(kpi_code, threshold)

        return Response({
            'kpi_code': kpi_code,
            'threshold': threshold,
            'anomalies': [
                {
                    'kpi_code': a.kpi_code,
                    'kpi_name': a.kpi_name,
                    'current_value': a.current_value,
                    'expected_range': a.expected_range,
                    'is_anomaly': a.is_anomaly,
                    'severity': a.severity,
                    'anomaly_score': a.anomaly_score,
                    'detected_at': a.detected_at.isoformat()
                }
                for a in anomalies
            ]
        })

    @action(detail=False, methods=['get'])
    def all_predictions(self, request):
        """Get all predictions for a module or all modules"""
        module = request.query_params.get('module', None)

        predictions = self.engine.get_all_predictions(module)

        return Response({
            'module': module or 'all',
            'total': len(predictions),
            'predictions': [
                {
                    'kpi_code': p.kpi_code,
                    'kpi_name': p.kpi_name,
                    'predicted_value': p.predicted_value,
                    'confidence': p.confidence,
                    'horizon': p.prediction_horizon,
                    'model_used': p.model_used,
                    'target_date': p.target_date.isoformat()
                }
                for p in predictions
            ]
        })

    @action(detail=False, methods=['get'], url_path='finance')
    def finance_predictions(self, request):
        """Get financial predictions (매출/재무 예측)"""
        predictions = self.engine.get_all_predictions('FIN')

        # Add historical data for charts
        historical_data = self._get_financial_historical_data()

        return Response({
            'category': 'finance',
            'category_name': '매출/재무 예측',
            'predictions': [
                {
                    'prediction_code': f"FIN_PRED_{i:03d}",
                    'kpi_code': p.kpi_code,
                    'kpi_name': p.kpi_name,
                    'predicted_value': p.predicted_value,
                    'confidence': p.confidence,
                    'horizon': p.prediction_horizon,
                    'model_used': p.model_used,
                    'target_date': p.target_date.isoformat()
                }
                for i, p in enumerate(predictions, 1)
            ],
            'historical_data': historical_data
        })

    @action(detail=False, methods=['get'], url_path='production')
    def production_predictions(self, request):
        """Get production predictions (생산 예측)"""
        predictions = self.engine.get_all_predictions('PROD')

        # Add historical data for charts
        historical_data = self._get_production_historical_data()

        return Response({
            'category': 'production',
            'category_name': '생산 예측',
            'predictions': [
                {
                    'prediction_code': f"PROD_PRED_{i:03d}",
                    'kpi_code': p.kpi_code,
                    'kpi_name': p.kpi_name,
                    'predicted_value': p.predicted_value,
                    'confidence': p.confidence,
                    'horizon': p.prediction_horizon,
                    'model_used': p.model_used,
                    'target_date': p.target_date.isoformat()
                }
                for i, p in enumerate(predictions, 1)
            ],
            'historical_data': historical_data
        })

    @action(detail=False, methods=['get'], url_path='quality')
    def quality_predictions(self, request):
        """Get quality predictions (품질 예측)"""
        predictions = self.engine.get_all_predictions('QUAL')

        # Add historical data for charts
        historical_data = self._get_quality_historical_data()

        return Response({
            'category': 'quality',
            'category_name': '품질 예측',
            'predictions': [
                {
                    'prediction_code': f"QUAL_PRED_{i:03d}",
                    'kpi_code': p.kpi_code,
                    'kpi_name': p.kpi_name,
                    'predicted_value': p.predicted_value,
                    'confidence': p.confidence,
                    'horizon': p.prediction_horizon,
                    'model_used': p.model_used,
                    'target_date': p.target_date.isoformat()
                }
                for i, p in enumerate(predictions, 1)
            ],
            'historical_data': historical_data
        })

    @action(detail=False, methods=['get'], url_path='inventory')
    def inventory_predictions(self, request):
        """Get inventory predictions (재고 예측)"""
        predictions = self.engine.get_all_predictions('INV')

        # Add historical data for charts
        historical_data = self._get_inventory_historical_data()

        return Response({
            'category': 'inventory',
            'category_name': '재고 예측',
            'predictions': [
                {
                    'prediction_code': f"INV_PRED_{i:03d}",
                    'kpi_code': p.kpi_code,
                    'kpi_name': p.kpi_name,
                    'predicted_value': p.predicted_value,
                    'confidence': p.confidence,
                    'horizon': p.prediction_horizon,
                    'model_used': p.model_used,
                    'target_date': p.target_date.isoformat()
                }
                for i, p in enumerate(predictions, 1)
            ],
            'historical_data': historical_data
        })

    @action(detail=False, methods=['get'], url_path='finance/historical')
    def finance_historical(self, request):
        """Get historical financial data for charts"""
        days = int(request.query_params.get('days', 30))
        return Response({
            'historical_data': self._get_financial_historical_data(days)
        })

    def _get_financial_historical_data(self, days=30):
        """Generate mock historical financial data for chart visualization"""
        import random
        from datetime import datetime, timedelta

        data = []
        base_value = 1000000000  # 1 billion base
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d')
            variation = random.uniform(-0.1, 0.1)
            data.append({
                'date': date,
                'revenue': base_value * (1 + variation),
                'operating_profit': base_value * 0.15 * (1 + variation * 0.5),
                'net_income': base_value * 0.1 * (1 + variation * 0.3),
                'cash_flow': base_value * 0.08 * (1 + variation * 0.4)
            })
        return data

    def _get_production_historical_data(self, days=30):
        """Generate mock historical production data for chart visualization"""
        import random
        from datetime import datetime, timedelta

        data = []
        base_quantity = 5000
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d')
            variation = random.uniform(-0.15, 0.15)
            data.append({
                'date': date,
                'production_quantity': base_quantity * (1 + variation),
                'defect_rate': 2.5 + variation * 10,
                'oee': 85 + variation * 20
            })
        return data

    def _get_quality_historical_data(self, days=30):
        """Generate mock historical quality data for chart visualization"""
        import random
        from datetime import datetime, timedelta

        data = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d')
            variation = random.uniform(-0.2, 0.2)
            data.append({
                'date': date,
                'defect_rate': 2.5 + variation * 5,
                'cpk': 1.33 + variation * 0.5,
                'inspection_time': 45 + variation * 20
            })
        return data

    def _get_inventory_historical_data(self, days=30):
        """Generate mock historical inventory data for chart visualization"""
        import random
        from datetime import datetime, timedelta

        data = []
        base_stock = 100000
        for i in range(days):
            date = (datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d')
            variation = random.uniform(-0.1, 0.1)
            data.append({
                'date': date,
                'stock_level': base_stock * (1 + variation),
                'turnover_rate': 4.5 + variation * 2,
                'depletion_days': 30 + variation * 15
            })
        return data
