# -*- coding: utf-8 -*-
"""
ML Pipeline API Views
ML Pipeline API 엔드포인트
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MLModel, TrainingJob, PredictionRequest, FeatureStore
from .serializers import (
    MLModelSerializer,
    TrainingJobSerializer,
    PredictionRequestSerializer,
    FeatureStoreSerializer
)
from .services.pipeline_service import MLPipelineService, FeatureEngineeringService


class MLModelViewSet(viewsets.ModelViewSet):
    """ML 모델 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = MLModel.objects.all()

    def get_queryset(self):
        return MLModel.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        """모델 학습"""
        model = self.get_object()

        training_data = request.data.get('training_data', [])

        service = MLPipelineService()
        result = service.train_model(
            model_name=model.name,
            model_code=model.code,
            model_type=model.model_type,
            algorithm=model.algorithm,
            target_feature=model.target_feature,
            features=model.features,
            hyperparameters=model.hyperparameters,
            training_data=training_data,
            created_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def deploy(self, request, pk=None):
        """모델 배포"""
        model_id = str(pk)

        service = MLPipelineService()
        result = service.deploy_model(model_id)

        return Response(result)

    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """단일 예측"""
        model = self.get_object()

        input_data = request.data.get('input_data', {})

        service = MLPipelineService()
        result = service.predict(
            model_code=model.code,
            input_data=input_data,
            requested_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=True, methods=['post'])
    def batch_predict(self, request, pk=None):
        """일괄 예측"""
        model = self.get_object()

        input_data_list = request.data.get('input_data_list', [])

        service = MLPipelineService()
        result = service.batch_predict(
            model_code=model.code,
            input_data_list=input_data_list,
            requested_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """모든 모델 목록"""
        model_type = request.query_params.get('model_type')
        status = request.query_params.get('status')
        is_deployed = request.query_params.get('is_deployed')

        service = MLPipelineService()
        models = service.list_models(
            model_type=model_type,
            status=status,
            is_deployed=is_deployed.lower() == 'true' if is_deployed else None
        )

        return Response({
            'models': models,
            'count': len(models),
        })


# ViewSet에 직렬화기 설정
MLModelViewSet.serializer_class = MLModelSerializer


class TrainingJobViewSet(viewsets.ReadOnlyModelViewSet):
    """학습 작업 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = TrainingJob.objects.all()

    def get_queryset(self):
        return TrainingJob.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 학습 작업 조회"""
        limit = int(request.query_params.get('limit', 20))
        jobs = TrainingJob.objects.order_by('-created_at')[:limit]

        serializer = TrainingJobSerializer(jobs, many=True)
        return Response({
            'jobs': serializer.data,
            'count': len(jobs),
        })


# ViewSet에 직렬화기 설정
TrainingJobViewSet.serializer_class = TrainingJobSerializer


class PredictionRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """예측 요청 조회 API"""
    permission_classes = [IsAuthenticated]
    queryset = PredictionRequest.objects.all()

    def get_queryset(self):
        return PredictionRequest.objects.all().order_by('-created_at')


# ViewSet에 직렬화기 설정
PredictionRequestViewSet.serializer_class = PredictionRequestSerializer


class FeatureStoreViewSet(viewsets.ModelViewSet):
    """피쳐 저장소 관리 API"""
    permission_classes = [IsAuthenticated]
    queryset = FeatureStore.objects.all()

    def get_queryset(self):
        return FeatureStore.objects.filter(is_active=True).order_by('name')

    @action(detail=True, methods=['post'])
    def calculate_statistics(self, request, pk=None):
        """피쳐 통계 계산"""
        feature = self.get_object()

        service = FeatureEngineeringService()
        result = service.calculate_feature_statistics(str(feature.id))

        return Response(result)

    @action(detail=False, methods=['get'])
    def list_features(self, request):
        """피쳐 목록 조회"""
        feature_type = request.query_params.get('feature_type')
        source_table = request.query_params.get('source_table')

        service = FeatureEngineeringService()
        features = service.list_features(
            feature_type=feature_type,
            source_table=source_table
        )

        return Response({
            'features': features,
            'count': len(features),
        })


# ViewSet에 직렬화기 설정
FeatureStoreViewSet.serializer_class = FeatureStoreSerializer


class PipelineViewSet(viewsets.ViewSet):
    """ML 파이프라인 API"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def train(self, request):
        """새 모델 학습"""
        model_name = request.data.get('model_name')
        model_code = request.data.get('model_code')
        model_type = request.data.get('model_type', 'regression')
        algorithm = request.data.get('algorithm', 'linear_regression')
        target_feature = request.data.get('target_feature')
        features = request.data.get('features', [])
        hyperparameters = request.data.get('hyperparameters', {})
        training_data = request.data.get('training_data', [])

        service = MLPipelineService()
        result = service.train_model(
            model_name=model_name,
            model_code=model_code,
            model_type=model_type,
            algorithm=algorithm,
            target_feature=target_feature,
            features=features,
            hyperparameters=hyperparameters,
            training_data=training_data,
            created_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def predict(self, request):
        """예측 수행"""
        model_code = request.data.get('model_code')
        input_data = request.data.get('input_data', {})

        service = MLPipelineService()
        result = service.predict(
            model_code=model_code,
            input_data=input_data,
            requested_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def batch_predict(self, request):
        """일괄 예측 수행"""
        model_code = request.data.get('model_code')
        input_data_list = request.data.get('input_data_list', [])

        service = MLPipelineService()
        result = service.batch_predict(
            model_code=model_code,
            input_data_list=input_data_list,
            requested_by=request.user.username if request.user.is_authenticated else 'api',
        )

        return Response(result)

    @action(detail=False, methods=['post'])
    def create_feature(self, request):
        """피쳐 생성"""
        name = request.data.get('name')
        display_name = request.data.get('display_name')
        feature_type = request.data.get('feature_type', 'numerical')
        source_table = request.data.get('source_table')
        source_column = request.data.get('source_column')
        description = request.data.get('description', '')
        data_type = request.data.get('data_type', 'float')

        service = FeatureEngineeringService()
        result = service.create_feature(
            name=name,
            display_name=display_name,
            feature_type=feature_type,
            source_table=source_table,
            source_column=source_column,
            description=description,
            data_type=data_type,
        )

        return Response(result)
