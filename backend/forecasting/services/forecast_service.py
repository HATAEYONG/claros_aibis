# -*- coding: utf-8 -*-
"""
Forecasting Service
시계열 예측 서비스
"""
import uuid
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db.models import Q

from ..models import ForecastModel, ForecastResult, ForecastAccuracyLog


class ForecastingService:
    """
    시계열 예측 서비스
    """

    def __init__(self):
        self.service_name = "forecasting"

    def create_forecast_model(
        self,
        name: str,
        code: str,
        target_metric: str,
        forecast_type: str = 'arima',
        forecast_horizon: int = 30,
        time_granularity: str = 'daily',
        parameters: Dict[str, Any] = None,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        예측 모델 생성

        Args:
            name: 모델명
            code: 모델 코드
            target_metric: 타겟 지표
            forecast_type: 예측 유형
            forecast_horizon: 예측 기간
            time_granularity: 시간 단위
            parameters: 파라미터
            description: 설명

        Returns:
            생성된 모델 정보
        """
        try:
            model = ForecastModel.objects.create(
                name=name,
                code=code,
                target_metric=target_metric,
                forecast_type=forecast_type,
                forecast_horizon=forecast_horizon,
                time_granularity=time_granularity,
                parameters=parameters or {},
                description=description,
                status='training',
            )

            return {
                'success': True,
                'model_id': str(model.id),
                'code': model.code,
                'name': model.name,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    def train_forecast_model(
        self,
        model_code: str,
        historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        예측 모델 학습

        Args:
            model_code: 모델 코드
            historical_data: 과거 데이터 [{date, value}]

        Returns:
            학습 결과
        """
        try:
            model = ForecastModel.objects.get(code=model_code)

            # 데이터 정렬
            sorted_data = sorted(historical_data, key=lambda x: x['date'])
            values = [d['value'] for d in sorted_data]

            # 학습 (시뮬레이션)
            # 실제 구현시 statsmodels, prophet 등 사용
            accuracy_metrics = self._calculate_accuracy(values)

            # 모델 업데이트
            model.mae = accuracy_metrics['mae']
            model.mape = accuracy_metrics['mape']
            model.rmse = accuracy_metrics['rmse']
            model.status = 'ready'
            model.last_trained = timezone.now()
            model.save()

            return {
                'success': True,
                'model_id': str(model.id),
                'accuracy': accuracy_metrics,
            }

        except ForecastModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_code}',
            }

    def _calculate_accuracy(self, values: List[float]) -> Dict[str, float]:
        """정확도 계산 (시뮬레이션)"""
        arr = np.array(values)
        mean = np.mean(arr)

        # 간단한 메트릭 계산
        mae = float(np.mean(np.abs(arr - mean)))
        rmse = float(np.sqrt(np.mean((arr - mean) ** 2)))
        mape = float(np.mean(np.abs((arr - mean) / arr)) * 100) if mean != 0 else 0

        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape,
        }

    def generate_forecast(
        self,
        model_code: str,
        horizon: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        예측 생성

        Args:
            model_code: 모델 코드
            horizon: 예측 기간

        Returns:
            예측 결과
        """
        try:
            model = ForecastModel.objects.get(
                code=model_code,
                status__in=['ready', 'active']
            )

            horizon = horizon or model.forecast_horizon

            # 예측 생성 (시뮬레이션)
            forecast_values = []
            start_date = date.today()

            # 마지막 값 가져오기 (실제로는 DB에서)
            last_value = 100.0

            for i in range(horizon):
                forecast_date = start_date + timedelta(days=i+1)

                # 간단한 예측 (실제 구현시 학습된 모델 사용)
                trend = 0.5 * (i + 1)  # 추세
                seasonality = 10 * np.sin(2 * np.pi * i / 7)  # 주간 계절성
                noise = np.random.normal(0, 5)  # 노이즈

                predicted_value = last_value + trend + seasonality + noise

                # 신뢰구간
                std = 5.0
                lower_bound = predicted_value - 1.96 * std
                upper_bound = predicted_value + 1.96 * std

                forecast_values.append({
                    'date': forecast_date.isoformat(),
                    'value': float(predicted_value),
                    'lower_bound': float(lower_bound),
                    'upper_bound': float(upper_bound),
                })

            # 예측 결과 저장
            result = ForecastResult.objects.create(
                forecast_model=model,
                forecast_date=timezone.now(),
                target_start=start_date + timedelta(days=1),
                target_end=start_date + timedelta(days=horizon),
                forecast_values=forecast_values,
                confidence_level=0.95,
            )

            return {
                'success': True,
                'forecast_id': str(result.id),
                'model_code': model_code,
                'forecast_values': forecast_values,
                'horizon': horizon,
            }

        except ForecastModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_code}',
            }

    def get_forecast_history(
        self,
        model_code: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        예측 이력 조회

        Args:
            model_code: 모델 코드
            limit: 반환 개수

        Returns:
            예측 이력
        """
        try:
            model = ForecastModel.objects.get(code=model_code)
            results = ForecastResult.objects.filter(
                forecast_model=model
            ).order_by('-forecast_date')[:limit]

            return [
                {
                    'id': str(r.id),
                    'forecast_date': r.forecast_date.isoformat(),
                    'target_start': r.target_start.isoformat(),
                    'target_end': r.target_end.isoformat(),
                    'confidence_level': r.confidence_level,
                }
                for r in results
            ]

        except ForecastModel.DoesNotExist:
            return []

    def evaluate_forecast_accuracy(
        self,
        model_code: str,
        evaluation_start: date,
        evaluation_end: date,
        actual_values: List[Dict[str, Any]],
        forecast_values: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        예측 정확도 평가

        Args:
            model_code: 모델 코드
            evaluation_start: 평가 시작일
            evaluation_end: 평가 종료일
            actual_values: 실제값
            forecast_values: 예측값

        Returns:
            정확도 평가 결과
        """
        try:
            model = ForecastModel.objects.get(code=model_code)

            # 정확도 계산
            metrics = self._calculate_forecast_metrics(actual_values, forecast_values)

            # 로그 저장
            log = ForecastAccuracyLog.objects.create(
                forecast_model=model,
                evaluation_start=evaluation_start,
                evaluation_end=evaluation_end,
                mae=metrics['mae'],
                mape=metrics['mape'],
                rmse=metrics['rmse'],
                sample_size=len(actual_values),
            )

            return {
                'success': True,
                'log_id': str(log.id),
                'metrics': metrics,
            }

        except ForecastModel.DoesNotExist:
            return {
                'success': False,
                'error': f'Model not found: {model_code}',
            }

    def _calculate_forecast_metrics(
        self,
        actual: List[Dict[str, Any]],
        forecast: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        예측 메트릭 계산
        """
        # 날짜 기준 매칭
        actual_dict = {a['date']: a['value'] for a in actual}
        forecast_dict = {f['date']: f['value'] for f in forecast}

        common_dates = set(actual_dict.keys()) & set(forecast_dict.keys())

        if not common_dates:
            return {'mae': 0, 'mape': 0, 'rmse': 0}

        actual_vals = np.array([actual_dict[d] for d in common_dates])
        forecast_vals = np.array([forecast_dict[d] for d in common_dates])

        mae = float(np.mean(np.abs(actual_vals - forecast_vals)))
        rmse = float(np.sqrt(np.mean((actual_vals - forecast_vals) ** 2)))
        mape = float(np.mean(np.abs((actual_vals - forecast_vals) / actual_vals)) * 100)

        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape,
        }

    def list_forecast_models(
        self,
        target_metric: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        예측 모델 목록 조회

        Args:
            target_metric: 타겟 지표 필터
            status: 상태 필터

        Returns:
            모델 목록
        """
        queryset = ForecastModel.objects.all()

        if target_metric:
            queryset = queryset.filter(target_metric=target_metric)
        if status:
            queryset = queryset.filter(status=status)

        models = queryset.order_by('-created_at')

        return [
            {
                'id': str(m.id),
                'name': m.name,
                'code': m.code,
                'target_metric': m.target_metric,
                'forecast_type': m.forecast_type,
                'forecast_horizon': m.forecast_horizon,
                'time_granularity': m.time_granularity,
                'status': m.status,
                'mae': m.mae,
                'mape': m.mape,
                'rmse': m.rmse,
                'last_trained': m.last_trained.isoformat() if m.last_trained else None,
            }
            for m in models
        ]
