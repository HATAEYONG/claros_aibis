# -*- coding: utf-8 -*-
"""
KPI Monitoring Service
Phase 2: 실시간 KPI 모니터링 및 알림 서비스
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max, Min, F, Q
from django.db.models.functions import TruncDate, TruncHour
from collections import defaultdict

logger = logging.getLogger(__name__)


class KPIMonitorService:
    """
    KPI 모니터링 서비스
    실시간 KPI 추적, 임계값 모니터링, 알림 생성
    """

    # KPI 정의
    KPI_DEFINITIONS = {
        'financial': {
            'revenue': {
                'name': '매출',
                'unit': '원',
                'thresholds': {
                    'warning': -0.05,  # -5%
                    'critical': -0.10,  # -10%
                },
                'direction': 'higher_better',  # 높을수록 좋음
            },
            'operating_profit_margin': {
                'name': '영업이익률',
                'unit': '%',
                'thresholds': {
                    'warning': 5.0,
                    'critical': 3.0,
                },
                'direction': 'higher_better',
            },
            'cost_variance': {
                'name': '원가차이',
                'unit': '%',
                'thresholds': {
                    'warning': 5.0,
                    'critical': 10.0,
                },
                'direction': 'lower_better',  # 낮을수록 좋음
            },
        },
        'production': {
            'production_rate': {
                'name': '생산율',
                'unit': '%',
                'thresholds': {
                    'warning': 85.0,
                    'critical': 75.0,
                },
                'direction': 'higher_better',
            },
            'defect_rate': {
                'name': '불량률',
                'unit': '%',
                'thresholds': {
                    'warning': 2.0,
                    'critical': 5.0,
                },
                'direction': 'lower_better',
            },
            'capacity_utilization': {
                'name': '가동률',
                'unit': '%',
                'thresholds': {
                    'warning': 70.0,
                    'critical': 60.0,
                },
                'direction': 'higher_better',
            },
        },
        'quality': {
            'first_pass_yield': {
                'name': '초주도율',
                'unit': '%',
                'thresholds': {
                    'warning': 95.0,
                    'critical': 90.0,
                },
                'direction': 'higher_better',
            },
            'customer_complaint_rate': {
                'name': '고객불만률',
                'unit': '%',
                'thresholds': {
                    'warning': 1.0,
                    'critical': 2.0,
                },
                'direction': 'lower_better',
            },
            'capa_closure_rate': {
                'name': 'CAPA 조치율',
                'unit': '%',
                'thresholds': {
                    'warning': 80.0,
                    'critical': 70.0,
                },
                'direction': 'higher_better',
            },
        },
        'inventory': {
            'inventory_turnover': {
                'name': '재고회전율',
                'unit': '회/년',
                'thresholds': {
                    'warning': 4.0,
                    'critical': 3.0,
                },
                'direction': 'higher_better',
            },
            'stockout_rate': {
                'name': '품절률',
                'unit': '%',
                'thresholds': {
                    'warning': 2.0,
                    'critical': 5.0,
                },
                'direction': 'lower_better',
            },
        },
    }

    def __init__(self):
        self.tower_type = "kpi_monitor"

    def get_kpi_dashboard(
        self,
        domains: Optional[List[str]] = None,
        time_range: str = 'today'
    ) -> Dict[str, Any]:
        """
        KPI 대시보드 조회

        Args:
            domains: 조회할 도메인
            time_range: 시간 범위

        Returns:
            KPI 대시보드 데이터
        """
        domains = domains or ['financial', 'production', 'quality']

        # 기간 계산
        start_date, end_date = self._calculate_period(time_range)

        dashboard = {
            'period': {
                'type': time_range,
                'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date),
                'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date),
            },
            'kpis': {},
            'alerts': [],
            'summary': {
                'total_kpis': 0,
                'critical_count': 0,
                'warning_count': 0,
                'normal_count': 0,
            },
        }

        # 각 도메인 KPI 조회
        for domain in domains:
            if domain in self.KPI_DEFINITIONS:
                domain_kpis = self._get_domain_kpis(domain, start_date, end_date)
                dashboard['kpis'][domain] = domain_kpis

                # 알림 수집
                for kpi_id, kpi_data in domain_kpis.items():
                    if kpi_data.get('status') in ['warning', 'critical']:
                        dashboard['alerts'].append({
                            'domain': domain,
                            'kpi_id': kpi_id,
                            'kpi_name': kpi_data['name'],
                            'status': kpi_data['status'],
                            'current_value': kpi_data['current_value'],
                            'threshold': kpi_data.get('threshold_violated'),
                            'trend': kpi_data.get('trend', 'stable'),
                        })

                        # 상태 카운트
                        if kpi_data['status'] == 'critical':
                            dashboard['summary']['critical_count'] += 1
                        else:
                            dashboard['summary']['warning_count'] += 1
                    else:
                        dashboard['summary']['normal_count'] += 1

                    dashboard['summary']['total_kpis'] += 1

        return dashboard

    def _calculate_period(self, time_range: str) -> tuple:
        """기간 계산"""
        end_date = timezone.now()

        if time_range == 'today':
            start_date = end_date - timedelta(hours=24)
        elif time_range == 'week':
            start_date = end_date - timedelta(days=7)
        elif time_range == 'month':
            start_date = end_date - timedelta(days=30)
        elif time_range == 'quarter':
            start_date = end_date - timedelta(days=90)
        else:
            start_date = end_date - timedelta(hours=24)

        return start_date, end_date

    def _get_domain_kpis(
        self,
        domain: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        도메인별 KPI 조회

        Args:
            domain: 도메인명
            start_date: 시작일
            end_date: 종료일

        Returns:
            도메인 KPI 데이터
        """
        kpis = {}
        definitions = self.KPI_DEFINITIONS.get(domain, {})

        for kpi_id, kpi_def in definitions.items():
            kpi_data = self._get_kpi_value(domain, kpi_id, start_date, end_date)

            # 임계값 확인
            status = self._check_threshold(
                kpi_data.get('current_value', 0),
                kpi_def['thresholds'],
                kpi_def['direction']
            )

            kpi_data.update({
                'id': kpi_id,
                'name': kpi_def['name'],
                'unit': kpi_def['unit'],
                'status': status,
            })

            kpis[kpi_id] = kpi_data

        return kpis

    def _get_kpi_value(
        self,
        domain: str,
        kpi_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        KPI 값 조회

        Args:
            domain: 도메인
            kpi_id: KPI ID
            start_date: 시작일
            end_date: 종료일

        Returns:
            KPI 데이터
        """
        kpi_data = {
            'current_value': 0,
            'previous_value': 0,
            'trend': 'stable',
            'change_percent': 0,
        }

        try:
            if domain == 'financial':
                kpi_data = self._get_financial_kpi(kpi_id, start_date, end_date)
            elif domain == 'production':
                kpi_data = self._get_production_kpi(kpi_id, start_date, end_date)
            elif domain == 'quality':
                kpi_data = self._get_quality_kpi(kpi_id, start_date, end_date)
            elif domain == 'inventory':
                kpi_data = self._get_inventory_kpi(kpi_id, start_date, end_date)

        except Exception as e:
            logger.warning(f"KPI 값 조회 실패 ({domain}.{kpi_id}): {e}")

        return kpi_data

    def _get_financial_kpi(
        self,
        kpi_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """재무 KPI 조회"""
        kpi_data = {'current_value': 0, 'previous_value': 0, 'trend': 'stable', 'change_percent': 0}

        try:
            from financial.models import FinancialStatement

            if kpi_id == 'revenue':
                # 매출
                current = FinancialStatement.objects.filter(
                    statement_date__gte=start_date.date(),
                    statement_date__lte=end_date.date()
                ).aggregate(total=Sum('sales_revenue'))['total'] or 0

                prev_start = start_date - timedelta(days=(end_date - start_date).days)
                previous = FinancialStatement.objects.filter(
                    statement_date__gte=prev_start.date(),
                    statement_date__lt=start_date.date()
                ).aggregate(total=Sum('sales_revenue'))['total'] or 0

                kpi_data['current_value'] = float(current)
                kpi_data['previous_value'] = float(previous)

                if previous > 0:
                    change = ((current - previous) / previous) * 100
                    kpi_data['change_percent'] = round(change, 2)
                    kpi_data['trend'] = self._determine_trend(change)

            elif kpi_id == 'operating_profit_margin':
                # 영업이익률
                current_data = FinancialStatement.objects.filter(
                    statement_date__gte=start_date.date(),
                    statement_date__lte=end_date.date()
                ).aggregate(
                    revenue=Sum('sales_revenue'),
                    profit=Sum('operating_profit')
                )

                current_margin = 0
                if current_data['revenue'] and current_data['revenue'] > 0:
                    current_margin = (current_data['profit'] or 0) / current_data['revenue'] * 100

                kpi_data['current_value'] = round(current_margin, 2)

            elif kpi_id == 'cost_variance':
                # 원가차이
                from cost.models import CostVariance

                variances = CostVariance.objects.filter(
                    variance_date__gte=start_date.date(),
                    variance_date__lte=end_date.date()
                )

                total_cost = 0
                total_variance = 0

                for v in variances:
                    total_cost += v.actual_cost or 0
                    total_variance += abs(v.variance_amount or 0)

                variance_rate = (total_variance / total_cost * 100) if total_cost > 0 else 0
                kpi_data['current_value'] = round(variance_rate, 2)

        except Exception as e:
            logger.warning(f"재무 KPI 조회 실패: {e}")

        return kpi_data

    def _get_production_kpi(
        self,
        kpi_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """생산 KPI 조회"""
        kpi_data = {'current_value': 0, 'previous_value': 0, 'trend': 'stable', 'change_percent': 0}

        try:
            from production.models import ProductionResult

            if kpi_id == 'production_rate':
                # 생산율
                results = ProductionResult.objects.filter(
                    production_date__gte=start_date.date(),
                    production_date__lte=end_date.date(),
                    status='completed'
                ).aggregate(avg_rate=Avg('production_rate'))

                kpi_data['current_value'] = float(results['avg_rate'] or 0)

            elif kpi_id == 'defect_rate':
                # 불량률
                from quality.models import Defect

                total_defects = Defect.objects.filter(
                    detected_date__gte=start_date.date(),
                    detected_date__lte=end_date.date()
                ).count()

                # 총 생산량 (임시)
                total_production = max(total_defects * 50, 1000)

                defect_rate = (total_defects / total_production * 100) if total_production > 0 else 0
                kpi_data['current_value'] = round(defect_rate, 2)

            elif kpi_id == 'capacity_utilization':
                # 가동률
                results = ProductionResult.objects.filter(
                    production_date__gte=start_date.date(),
                    production_date__lte=end_date.date(),
                    status='completed'
                ).aggregate(
                    total_planned=Sum('planned_quantity'),
                    total_actual=Sum('production_quantity')
                )

                planned = results['total_planned'] or 0
                actual = results['total_actual'] or 0

                utilization = (actual / planned * 100) if planned > 0 else 0
                kpi_data['current_value'] = round(utilization, 2)

        except Exception as e:
            logger.warning(f"생산 KPI 조회 실패: {e}")

        return kpi_data

    def _get_quality_kpi(
        self,
        kpi_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """품질 KPI 조회"""
        kpi_data = {'current_value': 0, 'previous_value': 0, 'trend': 'stable', 'change_percent': 0}

        try:
            from quality.models import Defect, CAPA, CustomerComplaint

            if kpi_id == 'first_pass_yield':
                # 초주도율 (임시 계산)
                defects = Defect.objects.filter(
                    detected_date__gte=start_date.date(),
                    detected_date__lte=end_date.date()
                ).count()

                total_production = max(defects * 10, 1000)
                fpy = ((total_production - defects) / total_production * 100) if total_production > 0 else 0

                kpi_data['current_value'] = round(fpy, 2)

            elif kpi_id == 'customer_complaint_rate':
                # 고객불만률
                complaints = CustomerComplaint.objects.filter(
                    complaint_date__gte=start_date.date(),
                    complaint_date__lte=end_date.date()
                ).count()

                # 총 주문수 (임시)
                total_orders = max(complaints * 50, 500)
                complaint_rate = (complaints / total_orders * 100) if total_orders > 0 else 0

                kpi_data['current_value'] = round(complaint_rate, 2)

            elif kpi_id == 'capa_closure_rate':
                # CAPA 조치율
                total_capa = CAPA.objects.filter(
                    created_date__gte=start_date.date(),
                    created_date__lte=end_date.date()
                ).count()

                closed_capa = CAPA.objects.filter(
                    created_date__gte=start_date.date(),
                    created_date__lte=end_date.date(),
                    status='closed'
                ).count()

                closure_rate = (closed_capa / total_capa * 100) if total_capa > 0 else 0
                kpi_data['current_value'] = round(closure_rate, 2)

        except Exception as e:
            logger.warning(f"품질 KPI 조회 실패: {e}")

        return kpi_data

    def _get_inventory_kpi(
        self,
        kpi_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """재고 KPI 조회"""
        kpi_data = {'current_value': 0, 'previous_value': 0, 'trend': 'stable', 'change_percent': 0}

        try:
            from inventory.models import Inventory  # 가정

            if kpi_id == 'inventory_turnover':
                # 재고회전율 (연환산)
                # 실제 구현시 재고 모델 필요
                kpi_data['current_value'] = 4.5  # 예시값

            elif kpi_id == 'stockout_rate':
                # 품절률
                # 실제 구현시 품절 이력 모델 필요
                kpi_data['current_value'] = 1.2  # 예시값

        except Exception as e:
            logger.warning(f"재고 KPI 조회 실패: {e}")

        return kpi_data

    def _check_threshold(
        self,
        value: float,
        thresholds: Dict[str, float],
        direction: str
    ) -> str:
        """
        임계값 확인

        Args:
            value: 현재값
            thresholds: 임계값 {warning, critical}
            direction: 방향 (higher_better, lower_better)

        Returns:
            상태 (normal, warning, critical)
        """
        warning_threshold = thresholds.get('warning', 0)
        critical_threshold = thresholds.get('critical', 0)

        if direction == 'higher_better':
            # 높을수록 좋은 KPI
            if value < critical_threshold:
                return 'critical'
            elif value < warning_threshold:
                return 'warning'
            else:
                return 'normal'
        else:
            # 낮을수록 좋은 KPI
            if value > critical_threshold:
                return 'critical'
            elif value > warning_threshold:
                return 'warning'
            else:
                return 'normal'

    def _determine_trend(self, change_percent: float) -> str:
        """추세 결정"""
        if change_percent > 5:
            return 'increasing'
        elif change_percent < -5:
            return 'decreasing'
        else:
            return 'stable'

    def get_kpi_history(
        self,
        domain: str,
        kpi_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        KPI 이력 조회

        Args:
            domain: 도메인
            kpi_id: KPI ID
            days: 조회 일수

        Returns:
            KPI 이력 데이터
        """
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)

        history = {
            'domain': domain,
            'kpi_id': kpi_id,
            'kpi_name': self.KPI_DEFINITIONS.get(domain, {}).get(kpi_id, {}).get('name', kpi_id),
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days,
            },
            'data_points': [],
        }

        # 일별 데이터 생성 (실제 구현시 DB에서 조회)
        for i in range(days):
            date = start_date + timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0)
            day_end = date.replace(hour=23, minute=59, second=59)

            try:
                kpi_value = 0

                # 도메인별 KPI 조회
                if domain == 'financial':
                    # 재무 KPI 일별 조회 로직
                    pass
                elif domain == 'production':
                    # 생산 KPI 일별 조회 로직
                    pass

                history['data_points'].append({
                    'date': date.isoformat(),
                    'value': kpi_value,
                })

            except Exception as e:
                logger.warning(f"KPI 이력 조회 실패 ({date}): {e}")

        return history

    def create_kpi_alert(
        self,
        domain: str,
        kpi_id: str,
        current_value: float,
        status: str
    ) -> Dict[str, Any]:
        """
        KPI 알림 생성

        Args:
            domain: 도메인
            kpi_id: KPI ID
            current_value: 현재값
            status: 상태

        Returns:
            생성된 알림
        """
        kpi_def = self.KPI_DEFINITIONS.get(domain, {}).get(kpi_id, {})

        alert_data = {
            'domain': domain,
            'kpi_id': kpi_id,
            'kpi_name': kpi_def.get('name', kpi_id),
            'current_value': current_value,
            'status': status,
            'threshold': kpi_def.get('thresholds', {}).get(status),
            'direction': kpi_def.get('direction'),
            'unit': kpi_def.get('unit'),
            'created_at': timezone.now().isoformat(),
        }

        # 실제 구현시 이벤트 생성 로직 추가
        try:
            from events.models import Event

            Event.objects.create(
                event_type=f'KPI_{status.upper()}',
                severity='HIGH' if status == 'critical' else 'MEDIUM',
                title=f"{kpi_def.get('name')} {status.upper()}",
                description=f"{kpi_def.get('name')}이(가) 임계값을 위반했습니다. 현재값: {current_value}",
                metadata=alert_data,
                status='open',
            )
        except Exception as e:
            logger.warning(f"KPI 알림 생성 실패: {e}")

        return alert_data
