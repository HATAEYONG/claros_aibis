# AI Prediction API Views
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date

from .prediction_engine import AIPredictionEngine


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
