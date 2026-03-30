# -*- coding: utf-8 -*-
"""
관리회계 데이터 서비스

비용센터별 원가분석, 수익센터별 수익성분석, 원가차이분석,
손익분기점분석, 예산대비실적분석, 활동기준원가계산 데이터 제공
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
import logging
import random

from erp_sync.models.erp_source import ERPSource
from erp_sync.services.dashboard_data_service import DataSyncService

logger = logging.getLogger(__name__)


class ManagerialAccountingDataService:
    """관리회계 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_cost_center_analysis(request):
        """
        비용센터별 원가분석 조회

        GET /api/erp-sync/managerial-accounting/cost-center-analysis/

        Query Parameters:
            cost_center: 비용센터 코드
            from_month: 시작년월 (YYYYMM)
            to_month: 종료년월 (YYYYMM)
        """
        try:
            cost_center = request.GET.get('cost_center', '')
            from_month = request.GET.get('from_month', '')
            to_month = request.GET.get('to_month', datetime.now().strftime('%Y%m'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # CCA100: 비용센터 원가분석
                    where_clause = "1=1"
                    if cost_center:
                        where_clause += f" AND cost_ctr = '{cost_center}'"
                    if from_month:
                        where_clause += f" AND work_mon >= '{from_month}'"
                    if to_month:
                        where_clause += f" AND work_mon <= '{to_month}'"

                    cost_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CCA100',
                        where_clause=where_clause,
                        limit=200
                    )

                    if cost_data:
                        for row in cost_data:
                            direct_material = float(row.get('direct_mat', 0) or 0)
                            direct_labor = float(row.get('direct_lab', 0) or 0)
                            overhead_cost = float(row.get('overhead_cost', 0) or 0)
                            total_cost = direct_material + direct_labor + overhead_cost

                            results.append({
                                'cost_center': row.get('cost_ctr', ''),
                                'cost_center_name': row.get('cost_ctr_nm', ''),
                                'work_month': row.get('work_mon', ''),
                                'cost_center_type': row.get('cost_ctr_type', ''),
                                'cost_center_type_name': ManagerialAccountingDataService._get_cost_center_type_name(row.get('cost_ctr_type', '')),
                                'department': row.get('dept_cd', ''),
                                'department_name': row.get('dept_nm', ''),
                                'direct_material_cost': direct_material,
                                'direct_labor_cost': direct_labor,
                                'overhead_cost': overhead_cost,
                                'total_cost': total_cost,
                                'production_quantity': float(row.get('prod_qty', 0) or 0),
                                'unit_cost': total_cost / max(float(row.get('prod_qty', 0) or 0), 1),
                                'budget_amount': float(row.get('budget_amt', 0) or 0),
                                'budget_variance': total_cost - float(row.get('budget_amt', 0) or 0),
                                'budget_variance_rate': ((total_cost - float(row.get('budget_amt', 0) or 0)) / max(float(row.get('budget_amt', 0) or 0), 1) * 100),
                                'activity_level': float(row.get('activity_lv', 0) or 0),
                                'cost_per_unit_activity': total_cost / max(float(row.get('activity_lv', 0) or 0), 1),
                                'person_count': int(row.get('person_cnt', 0) or 0),
                                'cost_per_person': total_cost / max(int(row.get('person_cnt', 0) or 0), 1),
                                'responsible_person': row.get('resp_person', ''),
                                'source_tables': ['CCA100'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'cost_center': cost_center,
                            'from_month': from_month,
                            'to_month': to_month,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['CCA100'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            cost_center_types = ['production', 'support', 'sales', 'admin']
            cost_centers = [f'CC{i:03d}' for i in range(1, 11)]
            departments = ['생산팀', '영업팀', '관리팀', '개발팀', '품질팀']

            for i, cc in enumerate(cost_centers):
                cc_type = random.choice(cost_center_types)
                direct_mat = random.uniform(10000000, 100000000)
                direct_lab = random.uniform(5000000, 50000000)
                overhead = random.uniform(3000000, 30000000)
                total = direct_mat + direct_lab + overhead

                results.append({
                    'cost_center': cc,
                    'cost_center_name': f'비용센터 {i+1}',
                    'work_month': datetime.now().strftime('%Y%m'),
                    'cost_center_type': cc_type,
                    'cost_center_type_name': ManagerialAccountingDataService._get_cost_center_type_name(cc_type),
                    'department': f'DEPT{(i % 5) + 1:02d}',
                    'department_name': departments[i % 5],
                    'direct_material_cost': direct_mat,
                    'direct_labor_cost': direct_lab,
                    'overhead_cost': overhead,
                    'total_cost': total,
                    'production_quantity': random.uniform(1000, 10000),
                    'unit_cost': total / random.uniform(1000, 10000),
                    'budget_amount': total * random.uniform(0.9, 1.1),
                    'budget_variance': total * random.uniform(-0.1, 0.1),
                    'budget_variance_rate': random.uniform(-10, 10),
                    'activity_level': random.uniform(5000, 50000),
                    'cost_per_unit_activity': total / random.uniform(5000, 50000),
                    'person_count': random.randint(10, 50),
                    'cost_per_person': total / random.randint(10, 50),
                    'responsible_person': f'manager{i+1}',
                    'source_tables': ['CCA100'],
                    'data_source': 'fallback'
                })

            return Response({
                'cost_center': cost_center,
                'from_month': from_month,
                'to_month': to_month,
                'total_count': len(results),
                'results': results,
                'source_tables': ['CCA100'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"비용센터별 원가분석 조회 오류: {e}")
            return Response({
                'error': f'비용센터별 원가분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_profit_center_analysis(request):
        """
        수익센터별 수익성분석 조회

        GET /api/erp-sync/managerial-accounting/profit-center-analysis/

        Query Parameters:
            profit_center: 수익센터 코드
            work_year: 작업년도 (YYYY)
        """
        try:
            profit_center = request.GET.get('profit_center', '')
            work_year = request.GET.get('work_year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PCA100: 수익센터 수익성분석
                    where_clause = f"work_yr = '{work_year}'"
                    if profit_center:
                        where_clause += f" AND profit_ctr = '{profit_center}'"

                    profit_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PCA100',
                        where_clause=where_clause,
                        limit=100
                    )

                    if profit_data:
                        for row in profit_data:
                            sales_revenue = float(row.get('sales_rev', 0) or 0)
                            cost_of_sales = float(row.get('cost_sales', 0) or 0)
                            gross_profit = sales_revenue - cost_of_sales
                            operating_expenses = float(row.get('op_exp', 0) or 0)
                            operating_profit = gross_profit - operating_expenses

                            results.append({
                                'profit_center': row.get('profit_ctr', ''),
                                'profit_center_name': row.get('profit_ctr_nm', ''),
                                'work_year': work_year,
                                'profit_center_type': row.get('profit_ctr_type', ''),
                                'profit_center_type_name': ManagerialAccountingDataService._get_profit_center_type_name(row.get('profit_ctr_type', '')),
                                'sales_revenue': sales_revenue,
                                'cost_of_sales': cost_of_sales,
                                'gross_profit': gross_profit,
                                'gross_profit_rate': (gross_profit / sales_revenue * 100) if sales_revenue > 0 else 0,
                                'operating_expenses': operating_expenses,
                                'operating_profit': operating_profit,
                                'operating_profit_rate': (operating_profit / sales_revenue * 100) if sales_revenue > 0 else 0,
                                'other_income': float(row.get('other_inc', 0) or 0),
                                'other_expenses': float(row.get('other_exp', 0) or 0),
                                'net_profit': operating_profit + float(row.get('other_inc', 0) or 0) - float(row.get('other_exp', 0) or 0),
                                'net_profit_rate': ((operating_profit + float(row.get('other_inc', 0) or 0) - float(row.get('other_exp', 0) or 0)) / sales_revenue * 100) if sales_revenue > 0 else 0,
                                'budget_revenue': float(row.get('budget_rev', 0) or 0),
                                'revenue_variance': sales_revenue - float(row.get('budget_rev', 0) or 0),
                                'revenue_achievement_rate': (sales_revenue / float(row.get('budget_rev', 0) or 1) * 100),
                                'budget_profit': float(row.get('budget_profit', 0) or 0),
                                'profit_variance': operating_profit - float(row.get('budget_profit', 0) or 0),
                                'roi': float(row.get('roi', 0) or 0),
                                'roa': float(row.get('roa', 0) or 0),
                                'assets': float(row.get('assets', 0) or 0),
                                'liabilities': float(row.get('liabilities', 0) or 0),
                                'equity': float(row.get('equity', 0) or 0),
                                'responsible_person': row.get('resp_person', ''),
                                'source_tables': ['PCA100'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'profit_center': profit_center,
                            'work_year': work_year,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PCA100'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            profit_center_types = ['division', 'branch', 'product_line', 'region']
            profit_centers = [f'PC{i:03d}' for i in range(1, 11)]

            for i, pc in enumerate(profit_centers):
                pc_type = random.choice(profit_center_types)
                sales_rev = random.uniform(500000000, 5000000000)
                cost_sales = sales_rev * random.uniform(0.5, 0.8)
                gross_profit = sales_rev - cost_sales
                op_exp = sales_rev * random.uniform(0.1, 0.2)
                operating_profit = gross_profit - op_exp

                results.append({
                    'profit_center': pc,
                    'profit_center_name': f'수익센터 {i+1}',
                    'work_year': work_year,
                    'profit_center_type': pc_type,
                    'profit_center_type_name': ManagerialAccountingDataService._get_profit_center_type_name(pc_type),
                    'sales_revenue': sales_rev,
                    'cost_of_sales': cost_sales,
                    'gross_profit': gross_profit,
                    'gross_profit_rate': (gross_profit / sales_rev * 100),
                    'operating_expenses': op_exp,
                    'operating_profit': operating_profit,
                    'operating_profit_rate': (operating_profit / sales_rev * 100),
                    'other_income': random.uniform(0, 50000000),
                    'other_expenses': random.uniform(0, 30000000),
                    'net_profit': operating_profit + random.uniform(-10000000, 50000000),
                    'net_profit_rate': ((operating_profit + random.uniform(-10000000, 50000000)) / sales_rev * 100),
                    'budget_revenue': sales_rev * random.uniform(0.9, 1.1),
                    'revenue_variance': sales_rev * random.uniform(-0.1, 0.1),
                    'revenue_achievement_rate': random.uniform(90, 110),
                    'budget_profit': operating_profit * random.uniform(0.9, 1.1),
                    'profit_variance': operating_profit * random.uniform(-0.1, 0.1),
                    'roi': random.uniform(5, 25),
                    'roa': random.uniform(3, 15),
                    'assets': random.uniform(1000000000, 10000000000),
                    'liabilities': random.uniform(300000000, 5000000000),
                    'equity': random.uniform(500000000, 7000000000),
                    'responsible_person': f'manager{i+1}',
                    'source_tables': ['PCA100'],
                    'data_source': 'fallback'
                })

            return Response({
                'profit_center': profit_center,
                'work_year': work_year,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PCA100'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"수익센터별 수익성분석 조회 오류: {e}")
            return Response({
                'error': f'수익센터별 수익성분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_variance_analysis(request):
        """
        원가차이분석 조회

        GET /api/erp-sync/managerial-accounting/variance-analysis/

        Query Parameters:
            work_month: 작업년월 (YYYYMM)
            variance_type: 차이유형 (PRICE, QUANTITY, EFFICIENCY, VOLUME)
        """
        try:
            work_month = request.GET.get('work_month', datetime.now().strftime('%Y%m'))
            variance_type = request.GET.get('variance_type', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # CVA100: 원가차이분석
                    where_clause = f"work_mon = '{work_month}'"
                    if variance_type:
                        where_clause += f" AND var_type = '{variance_type}'"

                    variance_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CVA100',
                        where_clause=where_clause,
                        limit=200
                    )

                    if variance_data:
                        for row in variance_data:
                            standard_cost = float(row.get('std_cost', 0) or 0)
                            actual_cost = float(row.get('act_cost', 0) or 0)
                            variance_amount = actual_cost - standard_cost

                            results.append({
                                'work_month': work_month,
                                'variance_type': row.get('var_type', ''),
                                'variance_type_name': ManagerialAccountingDataService._get_variance_type_name(row.get('var_type', '')),
                                'cost_element': row.get('cost_elem', ''),
                                'cost_element_name': row.get('cost_elem_nm', ''),
                                'item_code': row.get('item_cd', ''),
                                'item_name': row.get('item_nm', ''),
                                'standard_quantity': float(row.get('std_qty', 0) or 0),
                                'actual_quantity': float(row.get('act_qty', 0) or 0),
                                'standard_price': float(row.get('std_price', 0) or 0),
                                'actual_price': float(row.get('act_price', 0) or 0),
                                'standard_cost': standard_cost,
                                'actual_cost': actual_cost,
                                'variance_amount': variance_amount,
                                'variance_rate': (variance_amount / standard_cost * 100) if standard_cost > 0 else 0,
                                'price_variance': float(row.get('price_var', 0) or 0),
                                'quantity_variance': float(row.get('qty_var', 0) or 0),
                                'efficiency_variance': float(row.get('eff_var', 0) or 0),
                                'volume_variance': float(row.get('vol_var', 0) or 0),
                                'mix_variance': float(row.get('mix_var', 0) or 0),
                                'yield_variance': float(row.get('yield_var', 0) or 0),
                                'responsible_department': row.get('resp_dept', ''),
                                'variance_reason': row.get('var_reason', ''),
                                'corrective_action': row.get('corr_act', ''),
                                'favorable': variance_amount < 0,
                                'material_threshold': float(row.get('mat_threshold', 0) or 0),
                                'is_material_variance': abs(variance_amount) > float(row.get('mat_threshold', 0) or 0),
                                'source_tables': ['CVA100'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'work_month': work_month,
                            'variance_type': variance_type,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['CVA100'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            var_types = ['PRICE', 'QUANTITY', 'EFFICIENCY', 'VOLUME']
            cost_elements = ['material', 'labor', 'overhead']
            items = [f'ITEM-{i:04d}' for i in range(1, 21)]

            for item in items:
                for elem in cost_elements:
                    std_qty = random.uniform(100, 1000)
                    act_qty = std_qty * random.uniform(0.9, 1.1)
                    std_price = random.uniform(1000, 10000)
                    act_price = std_price * random.uniform(0.95, 1.05)

                    std_cost = std_qty * std_price
                    act_cost = act_qty * act_price
                    var_amount = act_cost - std_cost
                    var_type = random.choice(var_types)

                    results.append({
                        'work_month': work_month,
                        'variance_type': var_type,
                        'variance_type_name': ManagerialAccountingDataService._get_variance_type_name(var_type),
                        'cost_element': elem,
                        'cost_element_name': ManagerialAccountingDataService._get_cost_element_name(elem),
                        'item_code': item,
                        'item_name': f'품목 {item[-4:]}',
                        'standard_quantity': std_qty,
                        'actual_quantity': act_qty,
                        'standard_price': std_price,
                        'actual_price': act_price,
                        'standard_cost': std_cost,
                        'actual_cost': act_cost,
                        'variance_amount': var_amount,
                        'variance_rate': (var_amount / std_cost * 100),
                        'price_variance': (act_price - std_price) * act_qty,
                        'quantity_variance': (act_qty - std_qty) * std_price,
                        'efficiency_variance': var_amount * random.uniform(0.3, 0.5),
                        'volume_variance': var_amount * random.uniform(0.1, 0.3),
                        'mix_variance': var_amount * random.uniform(-0.1, 0.1),
                        'yield_variance': var_amount * random.uniform(-0.1, 0.1),
                        'responsible_department': f'DEPT{random.randint(1, 5):02d}',
                        'variance_reason': f'{var_type} 차이 발생',
                        'corrective_action': f'{var_type} 개선 조치',
                        'favorable': var_amount < 0,
                        'material_threshold': std_cost * 0.05,
                        'is_material_variance': abs(var_amount) > std_cost * 0.05,
                        'source_tables': ['CVA100'],
                        'data_source': 'fallback'
                    })

            return Response({
                'work_month': work_month,
                'variance_type': variance_type,
                'total_count': len(results),
                'results': results,
                'source_tables': ['CVA100'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"원가차이분석 조회 오류: {e}")
            return Response({
                'error': f'원가차이분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_break_even_analysis(request):
        """
        손익분기점분석 조회

        GET /api/erp-sync/managerial-accounting/break-even-analysis/

        Query Parameters:
            product_code: 품목코드
            analysis_year: 분석년도 (YYYY)
        """
        try:
            product_code = request.GET.get('product_code', '')
            analysis_year = request.GET.get('analysis_year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # CBA100: 손익분기점분석
                    where_clause = f"anal_yr = '{analysis_year}'"
                    if product_code:
                        where_clause += f" AND item_cd = '{product_code}'"

                    break_even_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CBA100',
                        where_clause=where_clause,
                        limit=100
                    )

                    if break_even_data:
                        for row in break_even_data:
                            selling_price = float(row.get('sell_price', 0) or 0)
                            variable_cost = float(row.get('var_cost', 0) or 0)
                            contribution_margin = selling_price - variable_cost
                            contribution_margin_ratio = (contribution_margin / selling_price * 100) if selling_price > 0 else 0

                            fixed_cost = float(row.get('fixed_cost', 0) or 0)
                            break_even_quantity = fixed_cost / contribution_margin if contribution_margin > 0 else 0
                            break_even_amount = break_even_quantity * selling_price

                            actual_sales = float(row.get('actual_sales', 0) or 0)
                            actual_quantity = float(row.get('actual_qty', 0) or 0)
                            margin_of_safety = actual_sales - break_even_amount
                            margin_of_safety_ratio = (margin_of_safety / actual_sales * 100) if actual_sales > 0 else 0

                            results.append({
                                'product_code': row.get('item_cd', ''),
                                'product_name': row.get('item_nm', ''),
                                'analysis_year': analysis_year,
                                'selling_price': selling_price,
                                'variable_cost': variable_cost,
                                'contribution_margin': contribution_margin,
                                'contribution_margin_ratio': contribution_margin_ratio,
                                'fixed_cost': fixed_cost,
                                'break_even_quantity': break_even_quantity,
                                'break_even_amount': break_even_amount,
                                'actual_sales': actual_sales,
                                'actual_quantity': actual_quantity,
                                'margin_of_safety': margin_of_safety,
                                'margin_of_safety_ratio': margin_of_safety_ratio,
                                'operating_leverage': float(row.get('op_leverage', 0) or 0),
                                'target_profit': float(row.get('target_profit', 0) or 0),
                                'target_quantity': (fixed_cost + float(row.get('target_profit', 0) or 0)) / contribution_margin if contribution_margin > 0 else 0,
                                'target_amount': (fixed_cost + float(row.get('target_profit', 0) or 0)) / contribution_margin * selling_price if contribution_margin > 0 else 0,
                                'cost_structure': row.get('cost_struct', ''),
                                'profitability': row.get('profitability', ''),
                                'risk_level': ManagerialAccountingDataService._get_break_even_risk_level(margin_of_safety_ratio),
                                'source_tables': ['CBA100'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'product_code': product_code,
                            'analysis_year': analysis_year,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['CBA100'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            products = [f'ITEM-{i:04d}' for i in range(1, 11)]

            for product in products:
                sell_price = random.uniform(10000, 100000)
                var_cost = sell_price * random.uniform(0.4, 0.7)
                contrib_margin = sell_price - var_cost
                contrib_margin_ratio = (contrib_margin / sell_price * 100)

                fixed_cost = random.uniform(100000000, 500000000)
                break_even_qty = fixed_cost / contrib_margin
                break_even_amt = break_even_qty * sell_price

                actual_sales = random.uniform(break_even_amt * 1.1, break_even_amt * 1.5)
                actual_qty = actual_sales / sell_price
                margin_safety = actual_sales - break_even_amt
                margin_safety_ratio = (margin_safety / actual_sales * 100)

                results.append({
                    'product_code': product,
                    'product_name': f'제품 {product[-4:]}',
                    'analysis_year': analysis_year,
                    'selling_price': sell_price,
                    'variable_cost': var_cost,
                    'contribution_margin': contrib_margin,
                    'contribution_margin_ratio': contrib_margin_ratio,
                    'fixed_cost': fixed_cost,
                    'break_even_quantity': break_even_qty,
                    'break_even_amount': break_even_amt,
                    'actual_sales': actual_sales,
                    'actual_quantity': actual_qty,
                    'margin_of_safety': margin_safety,
                    'margin_of_safety_ratio': margin_safety_ratio,
                    'operating_leverage': random.uniform(1.2, 3.0),
                    'target_profit': fixed_cost * random.uniform(0.2, 0.5),
                    'target_quantity': (fixed_cost + fixed_cost * 0.3) / contrib_margin,
                    'target_amount': (fixed_cost + fixed_cost * 0.3) / contrib_margin * sell_price,
                    'cost_structure': 'high_fixed' if random.random() > 0.5 else 'high_variable',
                    'profitability': 'high' if margin_safety_ratio > 30 else 'medium' if margin_safety_ratio > 15 else 'low',
                    'risk_level': ManagerialAccountingDataService._get_break_even_risk_level(margin_safety_ratio),
                    'source_tables': ['CBA100'],
                    'data_source': 'fallback'
                })

            return Response({
                'product_code': product_code,
                'analysis_year': analysis_year,
                'total_count': len(results),
                'results': results,
                'source_tables': ['CBA100'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"손익분기점분석 조회 오류: {e}")
            return Response({
                'error': f'손익분기점분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_budget_vs_actual(request):
        """
        예산대비실적분석 조회

        GET /api/erp-sync/managerial-accounting/budget-vs-actual/

        Query Parameters:
            department: 부서코드
            from_month: 시작년월 (YYYYMM)
            to_month: 종료년월 (YYYYMM)
        """
        try:
            department = request.GET.get('department', '')
            from_month = request.GET.get('from_month', '')
            to_month = request.GET.get('to_month', datetime.now().strftime('%Y%m'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # CBA200: 예산대비실적분석
                    where_clause = "1=1"
                    if department:
                        where_clause += f" AND dept_cd = '{department}'"
                    if from_month:
                        where_clause += f" AND work_mon >= '{from_month}'"
                    if to_month:
                        where_clause += f" AND work_mon <= '{to_month}'"

                    budget_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CBA200',
                        where_clause=where_clause,
                        limit=300
                    )

                    if budget_data:
                        for row in budget_data:
                            budget_amt = float(row.get('budget_amt', 0) or 0)
                            actual_amt = float(row.get('actual_amt', 0) or 0)
                            variance_amt = actual_amt - budget_amt
                            variance_rate = (variance_amt / budget_amt * 100) if budget_amt > 0 else 0

                            results.append({
                                'department': row.get('dept_cd', ''),
                                'department_name': row.get('dept_nm', ''),
                                'account_code': row.get('acct_cd', ''),
                                'account_name': row.get('acct_nm', ''),
                                'work_month': row.get('work_mon', ''),
                                'budget_type': row.get('budget_type', ''),
                                'budget_type_name': ManagerialAccountingDataService._get_budget_type_name(row.get('budget_type', '')),
                                'budget_amount': budget_amt,
                                'actual_amount': actual_amt,
                                'variance_amount': variance_amt,
                                'variance_rate': variance_rate,
                                'budget_achievement_rate': (actual_amt / budget_amt * 100) if budget_amt > 0 else 0,
                                'ytd_budget': float(row.get('ytd_budget', 0) or 0),
                                'ytd_actual': float(row.get('ytd_actual', 0) or 0),
                                'ytd_variance': float(row.get('ytd_actual', 0) or 0) - float(row.get('ytd_budget', 0) or 0),
                                'ytd_achievement_rate': (float(row.get('ytd_actual', 0) or 0) / float(row.get('ytd_budget', 0) or 1) * 100),
                                'annual_budget': float(row.get('annual_budget', 0) or 0),
                                'annual_forecast': float(row.get('annual_forecast', 0) or 0),
                                'remaining_budget': float(row.get('annual_budget', 0) or 0) - float(row.get('ytd_actual', 0) or 0),
                                'budget_manager': row.get('budget_mgr', ''),
                                'explanation': row.get('explanation', ''),
                                'action_plan': row.get('action_plan', ''),
                                'favorable': variance_amt < 0 if 'expense' in row.get('acct_nm', '').lower() else variance_amt > 0,
                                'material_variance': abs(variance_rate) > 10,
                                'source_tables': ['CBA200'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'department': department,
                            'from_month': from_month,
                            'to_month': to_month,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['CBA200'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            budget_types = ['revenue', 'expense', 'investment']
            departments = [f'DEPT{i:02d}' for i in range(1, 6)]
            accounts = {
                'revenue': ['매출액', '영업수익', '기타수익'],
                'expense': ['인건비', '재료비', '경비', '광고선전비'],
                'investment': ['설비투자', 'R&D투자', '교육투자']
            }

            for dept in departments:
                for budget_type in budget_types:
                    for acct in accounts[budget_type]:
                        for month in range(1, 13):
                            budget_amt = random.uniform(10000000, 100000000)
                            actual_amt = budget_amt * random.uniform(0.85, 1.15)
                            variance_amt = actual_amt - budget_amt
                            variance_rate = (variance_amt / budget_amt * 100)

                            results.append({
                                'department': dept,
                                'department_name': f'부서 {dept[-2:]}',
                                'account_code': f'{budget_type.upper()[:3]}-{random.randint(100, 999)}',
                                'account_name': acct,
                                'work_month': f'2026{month:02d}',
                                'budget_type': budget_type,
                                'budget_type_name': ManagerialAccountingDataService._get_budget_type_name(budget_type),
                                'budget_amount': budget_amt,
                                'actual_amount': actual_amt,
                                'variance_amount': variance_amt,
                                'variance_rate': variance_rate,
                                'budget_achievement_rate': (actual_amt / budget_amt * 100),
                                'ytd_budget': budget_amt * month,
                                'ytd_actual': actual_amt * month,
                                'ytd_variance': (actual_amt - budget_amt) * month,
                                'ytd_achievement_rate': (actual_amt / budget_amt * 100),
                                'annual_budget': budget_amt * 12,
                                'annual_forecast': actual_amt * 12,
                                'remaining_budget': budget_amt * (12 - month),
                                'budget_manager': f'manager{dept[-2:]}',
                                'explanation': f'{acct} 예산 차이 설명',
                                'action_plan': f'{acct} 개선 계획',
                                'favorable': variance_amt < 0 if budget_type == 'expense' else variance_amt > 0,
                                'material_variance': abs(variance_rate) > 10,
                                'source_tables': ['CBA200'],
                                'data_source': 'fallback'
                            })

            return Response({
                'department': department,
                'from_month': from_month,
                'to_month': to_month,
                'total_count': len(results),
                'results': results,
                'source_tables': ['CBA200'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"예산대비실적분석 조회 오류: {e}")
            return Response({
                'error': f'예산대비실적분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_abc_costing(request):
        """
        활동기준원가계산 조회

        GET /api/erp-sync/managerial-accounting/abc-costing/

        Query Parameters:
            product_code: 품목코드
            work_month: 작업년월 (YYYYMM)
        """
        try:
            product_code = request.GET.get('product_code', '')
            work_month = request.GET.get('work_month', datetime.now().strftime('%Y%m'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # ABC100: 활동기준원가계산
                    where_clause = f"work_mon = '{work_month}'"
                    if product_code:
                        where_clause += f" AND item_cd = '{product_code}'"

                    abc_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'ABC100',
                        where_clause=where_clause,
                        limit=200
                    )

                    if abc_data:
                        for row in abc_data:
                            activity_cost = float(row.get('activity_cost', 0) or 0)
                            activity_volume = float(row.get('activity_vol', 0) or 0)
                            cost_driver_rate = activity_cost / activity_volume if activity_volume > 0 else 0

                            results.append({
                                'product_code': row.get('item_cd', ''),
                                'product_name': row.get('item_nm', ''),
                                'work_month': work_month,
                                'activity_code': row.get('activity_cd', ''),
                                'activity_name': row.get('activity_nm', ''),
                                'activity_category': row.get('activity_cat', ''),
                                'activity_category_name': ManagerialAccountingDataService._get_activity_category_name(row.get('activity_cat', '')),
                                'cost_driver': row.get('cost_driver', ''),
                                'cost_driver_name': row.get('cost_driver_nm', ''),
                                'activity_cost': activity_cost,
                                'activity_volume': activity_volume,
                                'cost_driver_rate': cost_driver_rate,
                                'product_consumption': float(row.get('prod_consump', 0) or 0),
                                'allocated_cost': cost_driver_rate * float(row.get('prod_consump', 0) or 0),
                                'traditional_cost': float(row.get('trad_cost', 0) or 0),
                                'cost_variance': (cost_driver_rate * float(row.get('prod_consump', 0) or 0)) - float(row.get('trad_cost', 0) or 0),
                                'resource_type': row.get('res_type', ''),
                                'resource_name': row.get('res_nm', ''),
                                'process_code': row.get('proc_cd', ''),
                                'process_name': row.get('proc_nm', ''),
                                'activity_efficiency': float(row.get('activity_eff', 0) or 0),
                                'capacity_utilization': float(row.get('cap_util', 0) or 0),
                                'idle_capacity_cost': float(row.get('idle_cost', 0) or 0),
                                'activity_pool': row.get('activity_pool', ''),
                                'hierarchy_level': row.get('hier_lv', ''),
                                'hierarchy_level_name': ManagerialAccountingDataService._get_hierarchy_level_name(row.get('hier_lv', '')),
                                'source_tables': ['ABC100'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'product_code': product_code,
                            'work_month': work_month,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['ABC100'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            activity_categories = ['unit_level', 'batch_level', 'product_level', 'facility_level']
            activities = {
                'unit_level': ['기계가공', '조립', '검사'],
                'batch_level': ['설치', '일일생산계획', '배치검사'],
                'product_level': ['제품설계', '공정설계', '품질검사'],
                'facility_level': ['공장관리', '건물유지', '관리부서']
            }
            hierarchy_levels = ['unit', 'batch', 'product', 'facility']
            products = [f'ITEM-{i:04d}' for i in range(1, 6)]

            for product in products:
                for cat in activity_categories:
                    for activity in activities[cat]:
                        activity_cost = random.uniform(10000000, 100000000)
                        activity_volume = random.uniform(1000, 100000)
                        driver_rate = activity_cost / activity_volume

                        results.append({
                            'product_code': product,
                            'product_name': f'제품 {product[-4:]}',
                            'work_month': work_month,
                            'activity_code': f'ACT-{cat[:3].upper()}-{random.randint(100, 999)}',
                            'activity_name': activity,
                            'activity_category': cat,
                            'activity_category_name': ManagerialAccountingDataService._get_activity_category_name(cat),
                            'cost_driver': f'DRIVER-{random.randint(100, 999)}',
                            'cost_driver_name': f'원가동률 {random.randint(1, 99)}',
                            'activity_cost': activity_cost,
                            'activity_volume': activity_volume,
                            'cost_driver_rate': driver_rate,
                            'product_consumption': random.uniform(100, 10000),
                            'allocated_cost': driver_rate * random.uniform(100, 10000),
                            'traditional_cost': random.uniform(1000000, 50000000),
                            'cost_variance': random.uniform(-5000000, 5000000),
                            'resource_type': random.choice(['labor', 'machine', 'facility']),
                            'resource_name': f'자원 {random.randint(1, 20)}',
                            'process_code': f'PROC-{random.randint(100, 999)}',
                            'process_name': f'공정 {random.randint(1, 20)}',
                            'activity_efficiency': random.uniform(70, 95),
                            'capacity_utilization': random.uniform(60, 90),
                            'idle_capacity_cost': activity_cost * (1 - random.uniform(0.6, 0.9)),
                            'activity_pool': f'POOL-{cat[:3].upper()}',
                            'hierarchy_level': cat.split('_')[0],
                            'hierarchy_level_name': ManagerialAccountingDataService._get_hierarchy_level_name(cat.split('_')[0]),
                            'source_tables': ['ABC100'],
                            'data_source': 'fallback'
                        })

            return Response({
                'product_code': product_code,
                'work_month': work_month,
                'total_count': len(results),
                'results': results,
                'source_tables': ['ABC100'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"활동기준원가계산 조회 오류: {e}")
            return Response({
                'error': f'활동기준원가계산 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    # Helper methods
    @staticmethod
    def _get_cost_center_type_name(type_code):
        """비용센터 유형명 반환"""
        type_names = {
            'production': '생산비용센터',
            'support': '지원비용센터',
            'sales': '영업비용센터',
            'admin': '관리비용센터'
        }
        return type_names.get(type_code, type_code)

    @staticmethod
    def _get_profit_center_type_name(type_code):
        """수익센터 유형명 반환"""
        type_names = {
            'division': '사업부',
            'branch': '지사',
            'product_line': '제품라인',
            'region': '지역'
        }
        return type_names.get(type_code, type_code)

    @staticmethod
    def _get_variance_type_name(type_code):
        """차이유형명 반환"""
        type_names = {
            'PRICE': '가격차이',
            'QUANTITY': '수량차이',
            'EFFICIENCY': '효율성차이',
            'VOLUME': '물량차이'
        }
        return type_names.get(type_code, type_code)

    @staticmethod
    def _get_cost_element_name(element_code):
        """원가요소명 반환"""
        element_names = {
            'material': '재료비',
            'labor': '노무비',
            'overhead': '제조경비'
        }
        return element_names.get(element_code, element_code)

    @staticmethod
    def _get_budget_type_name(type_code):
        """예산유형명 반환"""
        type_names = {
            'revenue': '수익예산',
            'expense': '비용예산',
            'investment': '투자예산'
        }
        return type_names.get(type_code, type_code)

    @staticmethod
    def _get_break_even_risk_level(margin_ratio):
        """손익분기점 위험도 반환"""
        if margin_ratio >= 30:
            return 'low'
        elif margin_ratio >= 15:
            return 'medium'
        else:
            return 'high'

    @staticmethod
    def _get_activity_category_name(category_code):
        """활동카테고리명 반환"""
        category_names = {
            'unit_level': '단위수준활동',
            'batch_level': '배치수준활동',
            'product_level': '제품수준활동',
            'facility_level': '시설수준활동'
        }
        return category_names.get(category_code, category_code)

    @staticmethod
    def _get_hierarchy_level_name(level_code):
        """계층수준명 반환"""
        level_names = {
            'unit': '단위수준',
            'batch': '배치수준',
            'product': '제품수준',
            'facility': '시설수준'
        }
        return level_names.get(level_code, level_code)
