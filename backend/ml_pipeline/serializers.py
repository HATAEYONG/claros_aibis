# -*- coding: utf-8 -*-
"""
ML Pipeline Serializers
ML 모델 직렬화기
"""
from rest_framework import serializers
from .models import MLModel, TrainingJob, PredictionRequest, FeatureStore, Experiment


class MLModelSerializer(serializers.ModelSerializer):
    """ML 모델 직렬화기"""

    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'code', 'version', 'model_type', 'algorithm',
            'target_feature', 'features', 'hyperparameters', 'metrics',
            'status', 'is_deployed', 'trained_at', 'deployed_at',
            'training_samples', 'training_time_ms',
            'description', 'created_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'trained_at', 'deployed_at']


class TrainingJobSerializer(serializers.ModelSerializer):
    """학습 작업 직렬화기"""

    model_name = serializers.CharField(source='model.name', read_only=True)
    model_code = serializers.CharField(source='model.code', read_only=True)

    class Meta:
        model = TrainingJob
        fields = [
            'id', 'model', 'model_name', 'model_code',
            'job_name', 'job_type', 'parameters', 'data_source',
            'status', 'progress', 'current_step',
            'result', 'error_message',
            'started_at', 'completed_at', 'duration_ms',
            'cpu_usage', 'memory_usage_mb',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'completed_at']


class PredictionRequestSerializer(serializers.ModelSerializer):
    """예측 요청 직렬화기"""

    model_name = serializers.CharField(source='model.name', read_only=True)
    model_type = serializers.CharField(source='model.model_type', read_only=True)

    class Meta:
        model = PredictionRequest
        fields = [
            'id', 'model', 'model_name', 'model_type',
            'request_id', 'input_data', 'prediction_result',
            'inference_time_ms',
            'requested_by', 'request_source',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FeatureStoreSerializer(serializers.ModelSerializer):
    """피쳐 저장소 직렬화기"""

    class Meta:
        model = FeatureStore
        fields = [
            'id', 'name', 'display_name', 'feature_type',
            'source_table', 'source_column',
            'description', 'data_type', 'statistics',
            'transformation', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExperimentSerializer(serializers.ModelSerializer):
    """실험 직렬화기"""

    model_name = serializers.CharField(source='model.name', read_only=True)

    class Meta:
        model = Experiment
        fields = [
            'id', 'name', 'description',
            'parameters', 'metrics', 'model', 'model_name',
            'status', 'artifacts', 'logs',
            'started_at', 'completed_at',
        ]
        read_only_fields = ['id', 'started_at', 'completed_at']
