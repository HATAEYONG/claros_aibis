# -*- coding: utf-8 -*-
"""
Forecasting Serializers
시계열 예측 시리얼라이저
"""
from rest_framework import serializers

from .models import ForecastModel, ForecastResult, ForecastAccuracyLog


class ForecastModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForecastModel
        fields = '__all__'


class ForecastResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForecastResult
        fields = '__all__'


class ForecastAccuracyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForecastAccuracyLog
        fields = '__all__'
