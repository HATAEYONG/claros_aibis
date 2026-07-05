# -*- coding: utf-8 -*-
"""
Forecasting API Views
시계열 예측 API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ForecastModel, ForecastResult, ForecastAccuracyLog
from .serializers import ForecastModelSerializer
from .services.forecast_service import ForecastingService


class ForecastModelViewSet(viewsets.ModelViewSet):
    """예측 모델 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = ForecastModel.objects.all()
    serializer_class = ForecastModelSerializer

    def get_queryset(self):
        return ForecastModel.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        """모델 학습"""
        model = self.get_object()

        historical_data = request.data.get('historical_data', [])

        service = ForecastingService()
        result = service.train_forecast_model(
            model_code=model.code,
            historical_data=historical_data
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def forecast(self, request, pk=None):
        """예측 생성"""
        model = self.get_object()

        horizon = request.data.get('horizon')

        service = ForecastingService()
        result = service.generate_forecast(
            model_code=model.code,
            horizon=horizon
        )

        return Response(result)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """예측 이력 조회"""
        model = self.get_object()

        limit = int(request.query_params.get('limit', 10))

        service = ForecastingService()
        history = service.get_forecast_history(
            model_code=model.code,
            limit=limit
        )

        return Response({
            'history': history,
            'count': len(history),
        })


class ForecastViewSet(viewsets.ViewSet):
    """시계열 예측 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def create_model(self, request):
        """예측 모델 생성"""
        name = request.data.get('name')
        code = request.data.get('code')
        target_metric = request.data.get('target_metric')
        forecast_type = request.data.get('forecast_type', 'arima')
        forecast_horizon = request.data.get('forecast_horizon', 30)
        time_granularity = request.data.get('time_granularity', 'daily')
        parameters = request.data.get('parameters', {})
        description = request.data.get('description', '')

        service = ForecastingService()
        result = service.create_forecast_model(
            name=name,
            code=code,
            target_metric=target_metric,
            forecast_type=forecast_type,
            forecast_horizon=forecast_horizon,
            time_granularity=time_granularity,
            parameters=parameters,
            description=description,
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def train(self, request):
        """모델 학습"""
        model_code = request.data.get('model_code')
        historical_data = request.data.get('historical_data', [])

        service = ForecastingService()
        result = service.train_forecast_model(
            model_code=model_code,
            historical_data=historical_data
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def predict(self, request):
        """예측 생성"""
        model_code = request.data.get('model_code')
        horizon = request.data.get('horizon')

        service = ForecastingService()
        result = service.generate_forecast(
            model_code=model_code,
            horizon=horizon
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def evaluate_accuracy(self, request):
        """정확도 평가"""
        model_code = request.data.get('model_code')
        evaluation_start = request.data.get('evaluation_start')
        evaluation_end = request.data.get('evaluation_end')
        actual_values = request.data.get('actual_values', [])
        forecast_values = request.data.get('forecast_values', [])

        service = ForecastingService()
        result = service.evaluate_forecast_accuracy(
            model_code=model_code,
            evaluation_start=evaluation_start,
            evaluation_end=evaluation_end,
            actual_values=actual_values,
            forecast_values=forecast_values
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def list_models(self, request):
        """모델 목록 조회"""
        target_metric = request.query_params.get('target_metric')
        status = request.query_params.get('status')

        service = ForecastingService()
        models = service.list_forecast_models(
            target_metric=target_metric,
            status=status
        )

        return Response({
            'models': models,
            'count': len(models),
        })
