# -*- coding: utf-8 -*-
"""
Local Analysis API Views
로컬 데이터 분석 API 엔드포인트
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse

from .local_analysis import LocalAnalyzer


@api_view(['GET'])
@permission_classes([AllowAny])
def comprehensive_analysis(request):
    """종합 분석 API"""
    days = int(request.query_params.get('days', 90))

    try:
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_comprehensive(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def sales_analysis(request):
    """매출 분석 API"""
    months = int(request.query_params.get('months', 3))

    try:
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_sales(months=months)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def quality_analysis(request):
    """품질 분석 API"""
    days = int(request.query_params.get('days', 90))

    try:
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_quality(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def production_analysis(request):
    """생산 분석 API"""
    days = int(request.query_params.get('days', 90))

    try:
        analyzer = LocalAnalyzer()
        result = analyzer.analyze_production(days=days)

        return Response({
            'success': True,
            'data': result
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
