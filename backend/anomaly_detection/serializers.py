# -*- coding: utf-8 -*-
"""
Anomaly Detection Serializers
이상탐지 시리얼라이저
"""
from rest_framework import serializers

from .models import AnomalyDetector, AnomalyAlert, AnomalyPattern


class AnomalyDetectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnomalyDetector
        fields = '__all__'


class AnomalyAlertSerializer(serializers.ModelSerializer):
    detector_name = serializers.CharField(source='detector.name', read_only=True)

    class Meta:
        model = AnomalyAlert
        fields = '__all__'


class AnomalyPatternSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnomalyPattern
        fields = '__all__'
