# -*- coding: utf-8 -*-
"""
대시보드 집계 엔드포인트
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.db.models import Sum, Avg, Count, Q


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_overview(request):
    """
    통합 대시보드 개요 - 전체 경영 지표 요약

    Query Parameters:
    - year: 연도 (기본값: 현재 연도)
    - month: 월 (선택적)

    Response:
    {
        "fiscal_year": int,
        "fiscal_month": int,
        "financial": {...},
        "production": {...},
        "quality": {...},
        "sales": {...},
        "purchase": {...},
        "kpis": {
            "financial": [...],
            "production": [...],
            ...
        }
    }
    """
    year = request.query_params.get('year', datetime.now().year)
    month = request.query_params.get('month')

    try:
        year = int(year)
        if month:
            month = int(month)
    except ValueError:
        return Response(
            {'error': '연도와 월은 숫자여야 합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 각 모듈에서 데이터 수집
    data = {
        'fiscal_year': year,
        'fiscal_month': month or datetime.now().month,
        'last_updated': datetime.now().isoformat(),
    }

    # 재무 데이터
    try:
        from financial.models import FinancialStatement, FinancialRatio
        from financial.serializers import FinancialStatementSerializer, FinancialRatioSerializer

        financial_stmt = FinancialStatement.objects.filter(
            fiscal_year=year,
            statement_type='income'
        ).order_by('-fiscal_month').first()

        if financial_stmt:
            data['financial'] = {
                'revenue': financial_stmt.revenue,
                'operating_income': financial_stmt.operating_income,
                'net_income': financial_stmt.net_income,
                'operating_margin': round(financial_stmt.operating_income / financial_stmt.revenue * 100, 2) if financial_stmt.revenue else 0,
            }

        financial_ratio = FinancialRatio.objects.filter(
            fiscal_year=year
        ).order_by('-fiscal_month').first()

        if financial_ratio:
            if 'financial' not in data:
                data['financial'] = {}
            data['financial'].update({
                'current_ratio': financial_ratio.current_ratio,
                'debt_ratio': financial_ratio.debt_ratio,
                'roe': financial_ratio.roe,
                'roa': financial_ratio.roa,
            })
    except Exception as e:
        data['financial'] = {'error': str(e)}

    # 생산 데이터
    try:
        from production.models import DailyProduction
        from django.db.models import Sum

        production_data = DailyProduction.objects.filter(
            production_date__year=year
        ).aggregate(
            total_target=Sum('target_quantity'),
            total_actual=Sum('actual_quantity'),
            total_defect=Sum('defect_quantity'),
            avg_efficiency=Avg('efficiency')
        )

        data['production'] = {
            'production_volume': production_data['total_actual'] or 0,
            'target_achievement': round((production_data['total_actual'] or 0) / (production_data['total_target'] or 1) * 100, 2),
            'defect_rate': round((production_data['total_defect'] or 0) / (production_data['total_actual'] or 1) * 100, 2),
            'efficiency': round(production_data['avg_efficiency'] or 0, 2),
        }
    except Exception as e:
        data['production'] = {'error': str(e)}

    # 품질 데이터
    try:
        from quality.models import QualityInspection
        from django.db.models import Count, Q

        quality_stats = QualityInspection.objects.filter(
            inspection_date__year=year
        ).aggregate(
            total_inspections=Count('id'),
            passed=Count('id', filter=Q(result='pass')),
            failed=Count('id', filter=Q(result='fail'))
        )

        total = quality_stats['total_inspections'] or 0
        passed = quality_stats['passed'] or 0

        data['quality'] = {
            'total_inspections': total,
            'pass_rate': round(passed / total * 100, 2) if total > 0 else 0,
            'failed_count': quality_stats['failed'] or 0,
        }
    except Exception as e:
        data['quality'] = {'error': str(e)}

    # 영업 데이터
    try:
        from sales.models import MonthlySales

        sales_data = MonthlySales.objects.filter(fiscal_year=year).aggregate(
            total_target=Sum('target_amount'),
            total_actual=Sum('actual_amount'),
            total_customers=Sum('new_customers')
        )

        data['sales'] = {
            'total_sales': sales_data['total_actual'] or 0,
            'target_achievement': round((sales_data['total_actual'] or 0) / (sales_data['total_target'] or 1) * 100, 2),
            'new_customers': sales_data['total_customers'] or 0,
        }
    except Exception as e:
        data['sales'] = {'error': str(e)}

    # 구매 데이터
    try:
        from purchase.models import MonthlyPurchase

        purchase_data = MonthlyPurchase.objects.filter(fiscal_year=year).aggregate(
            total_purchase=Sum('purchase_amount'),
            total_orders=Sum('order_count')
        )

        data['purchase'] = {
            'total_purchase': purchase_data['total_purchase'] or 0,
            'total_orders': purchase_data['total_orders'] or 0,
        }
    except Exception as e:
        data['purchase'] = {'error': str(e)}

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_kpis(request):
    """
    전체 KPI 요약 - 모든 모듈의 주요 KPI 반환

    Query Parameters:
    - year: 연도 (기본값: 현재 연도)
    - month: 월 (선택적)
    - modules: 포함할 모듈 목록 (쉼표로 구분, 기본값: all)

    Response:
    {
        "fiscal_year": int,
        "fiscal_month": int,
        "kpis": {
            "financial": [...],
            "production": [...],
            "quality": [...],
            "sales": [...],
            "purchase": [...],
            "accounting": [...],
            "manufacturing": [...],
            "esg": [...],
            "cost": [...]
        }
    }
    """
    year = request.query_params.get('year', datetime.now().year)
    month = request.query_params.get('month')
    modules_param = request.query_params.get('modules', 'all')

    try:
        year = int(year)
        if month:
            month = int(month)
    except ValueError:
        return Response(
            {'error': '연도와 월은 숫자여야 합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    modules = modules_param.split(',') if modules_param != 'all' else [
        'financial', 'production', 'quality', 'sales', 'purchase',
        'accounting', 'manufacturing', 'esg', 'cost'
    ]

    data = {
        'fiscal_year': year,
        'fiscal_month': month or datetime.now().month,
        'kpis': {}
    }

    # 각 모듈의 KPI 수집
    for module in modules:
        try:
            if module == 'financial':
                from financial.kpi_engine import FinanceKPIEngine
                engine = FinanceKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['financial'] = list(kpis.values())

            elif module == 'production':
                from production.kpi_engine import ProductionKPIEngine
                engine = ProductionKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['production'] = list(kpis.values())

            elif module == 'quality':
                from quality.kpi_engine import QualityKPIEngine
                engine = QualityKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['quality'] = list(kpis.values())

            elif module == 'sales':
                from sales.kpi_engine import SalesKPIEngine
                engine = SalesKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['sales'] = list(kpis.values())

            elif module == 'purchase':
                from purchase.kpi_engine import PurchaseKPIEngine
                engine = PurchaseKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['purchase'] = list(kpis.values())

            elif module == 'accounting':
                from accounting.kpi_engine import AccountingKPIEngine
                engine = AccountingKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['accounting'] = list(kpis.values())

            elif module == 'manufacturing':
                from manufacturing.kpi_engine import ManufacturingKPIEngine
                engine = ManufacturingKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['manufacturing'] = list(kpis.values())

            elif module == 'esg':
                from esg.kpi_engine import ESGKPIEngine
                engine = ESGKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['esg'] = list(kpis.values())

            elif module == 'cost':
                from cost.kpi_engine import CostKPIEngine
                engine = CostKPIEngine()
                kpis = engine.calculate_all_kpis()
                data['kpis']['cost'] = list(kpis.values())

        except Exception as e:
            data['kpis'][module] = {'error': str(e)}

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_trends(request):
    """
    대시보드 트렌드 - 월별 트렌드 데이터

    Query Parameters:
    - year: 연도 (기본값: 현재 연도)
    - metrics: 포함할 지표 목록 (쉼표로 구분)

    Response:
    {
        "fiscal_year": int,
        "trends": {
            "revenue": [{month: 1, value: 100}, ...],
            "production": [...],
            "quality_rate": [...],
            ...
        }
    }
    """
    year = request.query_params.get('year', datetime.now().year)
    metrics_param = request.query_params.get('metrics', 'revenue,production,quality_rate,sales')

    try:
        year = int(year)
    except ValueError:
        return Response(
            {'error': '연도는 숫자여야 합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    metrics = metrics_param.split(',')
    data = {'fiscal_year': year, 'trends': {}}

    # 매출 트렌드
    if 'revenue' in metrics:
        try:
            from financial.models import FinancialStatement

            monthly_data = []
            for month in range(1, 13):
                stmt = FinancialStatement.objects.filter(
                    fiscal_year=year,
                    fiscal_month=month,
                    statement_type='income'
                ).first()

                monthly_data.append({
                    'month': month,
                    'value': stmt.revenue if stmt else 0
                })

            data['trends']['revenue'] = monthly_data
        except Exception as e:
            data['trends']['revenue'] = {'error': str(e)}

    # 생산 트렌드
    if 'production' in metrics:
        try:
            from production.models import DailyProduction
            from django.db.models import Sum

            monthly_data = []
            for month in range(1, 13):
                monthly_prod = DailyProduction.objects.filter(
                    production_date__year=year,
                    production_date__month=month
                ).aggregate(total=Sum('actual_quantity'))

                monthly_data.append({
                    'month': month,
                    'value': monthly_prod['total'] or 0
                })

            data['trends']['production'] = monthly_data
        except Exception as e:
            data['trends']['production'] = {'error': str(e)}

    # 품질율 트렌드
    if 'quality_rate' in metrics:
        try:
            from quality.models import QualityInspection
            from django.db.models import Count, Q

            monthly_data = []
            for month in range(1, 13):
                month_stats = QualityInspection.objects.filter(
                    inspection_date__year=year,
                    inspection_date__month=month
                ).aggregate(
                    total=Count('id'),
                    passed=Count('id', filter=Q(result='pass'))
                )

                pass_rate = round((month_stats['passed'] or 0) / (month_stats['total'] or 1) * 100, 2)

                monthly_data.append({
                    'month': month,
                    'value': pass_rate
                })

            data['trends']['quality_rate'] = monthly_data
        except Exception as e:
            data['trends']['quality_rate'] = {'error': str(e)}

    # 매출 트렌드
    if 'sales' in metrics:
        try:
            from sales.models import MonthlySales

            monthly_data = MonthlySales.objects.filter(
                fiscal_year=year
            ).order_by('fiscal_month')

            data['trends']['sales'] = [
                {'month': item.fiscal_month, 'value': item.actual_amount}
                for item in monthly_data
            ]
        except Exception as e:
            data['trends']['sales'] = {'error': str(e)}

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard_alerts(request):
    """
    대시보드 알림 - 주요 경고 및 알림 정보

    Query Parameters:
    - severity: 심각도 (all, high, medium, low)

    Response:
    {
        "alerts": [
            {
                "type": "quality",
                "severity": "high",
                "message": "품질 불량률이 2% 이상입니다.",
                "value": 2.5,
                "threshold": 2.0,
                ...
            },
            ...
        ]
    }
    """
    severity = request.query_params.get('severity', 'all')

    alerts = []

    # 품질 경고
    try:
        from quality.models import QualityInspection
        from django.db.models import Count, Q, Avg

        recent_quality = QualityInspection.objects.filter(
            inspection_date__gte=datetime.now() - timedelta(days=7)
        ).aggregate(
            total=Count('id'),
            failed=Count('id', filter=Q(result='fail')),
            avg_defect_rate=Avg('defect_count')
        )

        if recent_quality['total'] and recent_quality['total'] > 0:
            fail_rate = (recent_quality['failed'] or 0) / recent_quality['total'] * 100
            if fail_rate > 2:
                alerts.append({
                    'type': 'quality',
                    'severity': 'high' if fail_rate > 5 else 'medium',
                    'message': f'품질 불합격률이 {fail_rate:.1f}%입니다.',
                    'value': fail_rate,
                    'threshold': 2.0,
                    'timestamp': datetime.now().isoformat()
                })
    except Exception:
        pass

    # 생산 경고
    try:
        from production.models import DailyProduction
        from django.db.models import Avg

        recent_production = DailyProduction.objects.filter(
            production_date__gte=datetime.now() - timedelta(days=7)
        ).aggregate(avg_efficiency=Avg('efficiency'))

        if recent_production['avg_efficiency'] and recent_production['avg_efficiency'] < 90:
            alerts.append({
                'type': 'production',
                'severity': 'high' if recent_production['avg_efficiency'] < 85 else 'medium',
                'message': f'생산 효율이 {recent_production["avg_efficiency"]:.1f}%입니다.',
                'value': recent_production['avg_efficiency'],
                'threshold': 90.0,
                'timestamp': datetime.now().isoformat()
            })
    except Exception:
        pass

    # 설비 경고
    try:
        from production.models import Equipment

        maintenance_due = Equipment.objects.filter(
            status='maintenance'
        ).count()

        if maintenance_due > 0:
            alerts.append({
                'type': 'equipment',
                'severity': 'medium',
                'message': f'{maintenance_due}대의 설비가 점검 중입니다.',
                'value': maintenance_due,
                'timestamp': datetime.now().isoformat()
            })
    except Exception:
        pass

    # 심각도 필터
    if severity != 'all':
        alerts = [a for a in alerts if a['severity'] == severity]

    return Response({'alerts': alerts})
