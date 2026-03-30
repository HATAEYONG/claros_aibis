# -*- coding: utf-8 -*-
"""
프로젝트관리 데이터 서비스

프로젝트 현황, 프로젝트 진척관리, 프로젝트 예산관리,
프로젝트 자원배정, 프로젝트 마일스톤, 프로젝트 성과분석 데이터 제공
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


class ProjectManagementDataService:
    """프로젝트관리 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_list(request):
        """
        프로젝트 현황 조회

        GET /api/erp-sync/project/project-list/

        Query Parameters:
            project_status: 프로젝트 상태 (PLAN, PROGRESS, COMPLETE, HOLD)
            project_manager: 프로젝트 담당자
            from_date: 시작일자
            to_date: 종료일자
        """
        try:
            project_status = request.GET.get('project_status', '')
            project_manager = request.GET.get('project_manager', '')
            from_date = request.GET.get('from_date', '')
            to_date = request.GET.get('to_date', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA100_YH: 프로젝트 마스터
                    where_clause = "1=1"
                    if project_status:
                        where_clause += f" AND prj_sts = '{project_status}'"
                    if project_manager:
                        where_clause += f" AND prj_mgr = '{project_manager}'"
                    if from_date:
                        where_clause += f" AND prj_str_dt >= '{from_date}'"
                    if to_date:
                        where_clause += f" AND prj_end_dt <= '{to_date}'"

                    project_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA100_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if project_data:
                        for row in project_data:
                            prj_id = str(row.get('prj_id', ''))
                            results.append({
                                'project_id': prj_id,
                                'project_name': row.get('prj_nm', ''),
                                'project_code': row.get('prj_cd', ''),
                                'project_type': row.get('prj_type', ''),
                                'project_status': row.get('prj_sts', ''),
                                'project_status_name': ProjectManagementDataService._get_project_status_name(row.get('prj_sts', '')),
                                'start_date': str(row.get('prj_str_dt', '')) if row.get('prj_str_dt') else '',
                                'end_date': str(row.get('prj_end_dt', '')) if row.get('prj_end_dt') else '',
                                'project_manager': row.get('prj_mgr', ''),
                                'manager_name': row.get('mgr_nm', ''),
                                'department': row.get('dept_cd', ''),
                                'department_name': row.get('dept_nm', ''),
                                'budget_amount': float(row.get('budget_amt', 0) or 0),
                                'actual_cost': float(row.get('actual_cost', 0) or 0),
                                'progress_rate': float(row.get('progress_rate', 0) or 0),
                                'customer_code': row.get('cust_cd', ''),
                                'customer_name': row.get('cust_nm', ''),
                                'contract_amount': float(row.get('contract_amt', 0) or 0),
                                'description': row.get('rmrk', ''),
                                'source_tables': ['PJA100_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'factory_code': 'ALL',
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA100_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            statuses = ['PLAN', 'PROGRESS', 'COMPLETE', 'HOLD']
            types = ['development', 'construction', 'consulting', 'maintenance']
            managers = ['manager1', 'manager2', 'manager3']

            for i in range(1, 16):
                status = random.choice(statuses) if not project_status else project_status
                prj_type = random.choice(types)
                progress = random.uniform(0, 100)
                if status == 'COMPLETE':
                    progress = 100
                elif status == 'PLAN':
                    progress = 0

                budget = random.uniform(100000000, 500000000)
                actual = budget * (progress / 100) * random.uniform(0.9, 1.1)

                results.append({
                    'project_id': f'PRJ{i:04d}',
                    'project_name': f'프로젝트 {i} - {prj_type}',
                    'project_code': f'PCODE{i:04d}',
                    'project_type': prj_type,
                    'project_status': status,
                    'project_status_name': ProjectManagementDataService._get_project_status_name(status),
                    'start_date': (datetime.now() - timedelta(days=random.randint(30, 180))).strftime('%Y%m%d'),
                    'end_date': (datetime.now() + timedelta(days=random.randint(30, 180))).strftime('%Y%m%d'),
                    'project_manager': random.choice(managers),
                    'manager_name': f'담당자 {random.randint(1, 3)}',
                    'department': f'DEPT{random.randint(1, 5):02d}',
                    'department_name': f'{random.choice(["개발", "영업", "생산", "품질"])}팀',
                    'budget_amount': budget,
                    'actual_cost': actual,
                    'progress_rate': progress,
                    'customer_code': f'CUST{random.randint(1, 10):03d}',
                    'customer_name': f'고객사 {random.randint(1, 10)}',
                    'contract_amount': budget * random.uniform(1.1, 1.3),
                    'description': f'프로젝트 {i} 설명',
                    'source_tables': ['PJA100_YH'],
                    'data_source': 'fallback'
                })

            return Response({
                'factory_code': 'ALL',
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA100_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 현황 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 현황 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_progress(request):
        """
        프로젝트 진척관리 조회

        GET /api/erp-sync/project/project-progress/

        Query Parameters:
            project_id: 프로젝트 ID
            work_month: 작업년월 (YYYYMM)
        """
        try:
            project_id = request.GET.get('project_id', '')
            work_month = request.GET.get('work_month', datetime.now().strftime('%Y%m'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA110_YH: 프로젝트 진척관리
                    where_clause = f"work_mon = '{work_month}'"
                    if project_id:
                        where_clause += f" AND prj_id = '{project_id}'"

                    progress_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA110_YH',
                        where_clause=where_clause,
                        limit=200
                    )

                    if progress_data:
                        for row in progress_data:
                            results.append({
                                'project_id': row.get('prj_id', ''),
                                'project_name': row.get('prj_nm', ''),
                                'work_month': work_month,
                                'task_code': row.get('task_cd', ''),
                                'task_name': row.get('task_nm', ''),
                                'task_sequence': int(row.get('task_seq', 0) or 0),
                                'planned_start_date': str(row.get('plan_str_dt', '')) if row.get('plan_str_dt') else '',
                                'planned_end_date': str(row.get('plan_end_dt', '')) if row.get('plan_end_dt') else '',
                                'actual_start_date': str(row.get('act_str_dt', '')) if row.get('act_str_dt') else '',
                                'actual_end_date': str(row.get('act_end_dt', '')) if row.get('act_end_dt') else '',
                                'planned_progress': float(row.get('plan_prog', 0) or 0),
                                'actual_progress': float(row.get('act_prog', 0) or 0),
                                'progress_variance': float(row.get('prog_var', 0) or 0),
                                'planned_man_hours': float(row.get('plan_mh', 0) or 0),
                                'actual_man_hours': float(row.get('act_mh', 0) or 0),
                                'man_hour_variance': float(row.get('mh_var', 0) or 0),
                                'assigned_person': row.get('assign_person', ''),
                                'task_status': row.get('task_sts', ''),
                                'task_status_name': ProjectManagementDataService._get_task_status_name(row.get('task_sts', '')),
                                'completion_rate': float(row.get('compl_rate', 0) or 0),
                                'remarks': row.get('rmrk', ''),
                                'source_tables': ['PJA110_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'project_id': project_id,
                            'work_month': work_month,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA110_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            task_statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'DELAYED']
            projects = [f'PRJ{i:04d}' for i in range(1, 6)]

            for prj_id in projects[:3] if not project_id else [project_id]:
                for i in range(1, 11):
                    task_sts = random.choice(task_statuses)
                    plan_prog = random.uniform(20, 100)
                    act_prog = plan_prog * random.uniform(0.8, 1.1)
                    if task_sts == 'COMPLETE':
                        act_prog = 100
                    elif task_sts == 'PENDING':
                        act_prog = 0

                    results.append({
                        'project_id': prj_id,
                        'project_name': f'프로젝트 {prj_id[-4:]}',
                        'work_month': work_month,
                        'task_code': f'TASK{prj_id[-4:]}-{i:02d}',
                        'task_name': f'작업 {i}',
                        'task_sequence': i,
                        'planned_start_date': (datetime.now() + timedelta(days=i*7-30)).strftime('%Y%m%d'),
                        'planned_end_date': (datetime.now() + timedelta(days=i*7-20)).strftime('%Y%m%d'),
                        'actual_start_date': (datetime.now() + timedelta(days=i*7-28)).strftime('%Y%m%d') if task_sts != 'PENDING' else '',
                        'actual_end_date': (datetime.now() + timedelta(days=i*7-18)).strftime('%Y%m%d') if task_sts == 'COMPLETE' else '',
                        'planned_progress': plan_prog,
                        'actual_progress': min(act_prog, 100),
                        'progress_variance': act_prog - plan_prog,
                        'planned_man_hours': random.uniform(40, 200),
                        'actual_man_hours': random.uniform(40, 200),
                        'man_hour_variance': random.uniform(-20, 20),
                        'assigned_person': f'user{random.randint(1, 10)}',
                        'task_status': task_sts,
                        'task_status_name': ProjectManagementDataService._get_task_status_name(task_sts),
                        'completion_rate': 100 if task_sts == 'COMPLETE' else random.uniform(0, 90),
                        'remarks': f'작업 {i} 비고',
                        'source_tables': ['PJA110_YH'],
                        'data_source': 'fallback'
                    })

            return Response({
                'project_id': project_id,
                'work_month': work_month,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA110_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 진척관리 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 진척관리 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_budget(request):
        """
        프로젝트 예산관리 조회

        GET /api/erp-sync/project/project-budget/

        Query Parameters:
            project_id: 프로젝트 ID
            budget_year: 예산년도 (YYYY)
        """
        try:
            project_id = request.GET.get('project_id', '')
            budget_year = request.GET.get('budget_year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA120_YH: 프로젝트 예산관리
                    where_clause = f"bud_yr = '{budget_year}'"
                    if project_id:
                        where_clause += f" AND prj_id = '{project_id}'"

                    budget_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA120_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if budget_data:
                        for row in budget_data:
                            total_budget = float(row.get('total_budget', 0) or 0)
                            execution_amount = float(row.get('execution_amt', 0) or 0)
                            remaining_budget = total_budget - execution_amount

                            results.append({
                                'project_id': row.get('prj_id', ''),
                                'project_name': row.get('prj_nm', ''),
                                'budget_year': budget_year,
                                'budget_category': row.get('bud_cat', ''),
                                'category_name': ProjectManagementDataService._get_budget_category_name(row.get('bud_cat', '')),
                                'total_budget': total_budget,
                                'execution_amount': execution_amount,
                                'remaining_budget': remaining_budget,
                                'execution_rate': (execution_amount / total_budget * 100) if total_budget > 0 else 0,
                                'january_plan': float(row.get('jan_plan', 0) or 0),
                                'january_actual': float(row.get('jan_act', 0) or 0),
                                'february_plan': float(row.get('feb_plan', 0) or 0),
                                'february_actual': float(row.get('feb_act', 0) or 0),
                                'march_plan': float(row.get('mar_plan', 0) or 0),
                                'march_actual': float(row.get('mar_act', 0) or 0),
                                'april_plan': float(row.get('apr_plan', 0) or 0),
                                'april_actual': float(row.get('apr_act', 0) or 0),
                                'may_plan': float(row.get('may_plan', 0) or 0),
                                'may_actual': float(row.get('may_act', 0) or 0),
                                'june_plan': float(row.get('jun_plan', 0) or 0),
                                'june_actual': float(row.get('jun_act', 0) or 0),
                                'july_plan': float(row.get('jul_plan', 0) or 0),
                                'july_actual': float(row.get('jul_act', 0) or 0),
                                'august_plan': float(row.get('aug_plan', 0) or 0),
                                'august_actual': float(row.get('aug_act', 0) or 0),
                                'september_plan': float(row.get('sep_plan', 0) or 0),
                                'september_actual': float(row.get('sep_act', 0) or 0),
                                'october_plan': float(row.get('oct_plan', 0) or 0),
                                'october_actual': float(row.get('oct_act', 0) or 0),
                                'november_plan': float(row.get('nov_plan', 0) or 0),
                                'november_actual': float(row.get('nov_act', 0) or 0),
                                'december_plan': float(row.get('dec_plan', 0) or 0),
                                'december_actual': float(row.get('dec_act', 0) or 0),
                                'budget_manager': row.get('bud_mgr', ''),
                                'approval_status': row.get('appr_sts', ''),
                                'approval_status_name': ProjectManagementDataService._get_approval_status_name(row.get('appr_sts', '')),
                                'remarks': row.get('rmrk', ''),
                                'source_tables': ['PJA120_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'project_id': project_id,
                            'budget_year': budget_year,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA120_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            categories = ['labor', 'material', 'expense', 'outsourcing']
            appr_statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']
            projects = [f'PRJ{i:04d}' for i in range(1, 6)]

            for prj_id in projects[:3] if not project_id else [project_id]:
                for cat in categories:
                    total_budget = random.uniform(50000000, 200000000)
                    execution_amount = total_budget * random.uniform(0.3, 0.8)

                    results.append({
                        'project_id': prj_id,
                        'project_name': f'프로젝트 {prj_id[-4:]}',
                        'budget_year': budget_year,
                        'budget_category': cat,
                        'category_name': ProjectManagementDataService._get_budget_category_name(cat),
                        'total_budget': total_budget,
                        'execution_amount': execution_amount,
                        'remaining_budget': total_budget - execution_amount,
                        'execution_rate': (execution_amount / total_budget * 100),
                        'january_plan': total_budget * random.uniform(0.05, 0.1),
                        'january_actual': total_budget * random.uniform(0.04, 0.1),
                        'february_plan': total_budget * random.uniform(0.05, 0.1),
                        'february_actual': total_budget * random.uniform(0.04, 0.1),
                        'march_plan': total_budget * random.uniform(0.05, 0.1),
                        'march_actual': total_budget * random.uniform(0.04, 0.1),
                        'april_plan': total_budget * random.uniform(0.05, 0.1),
                        'april_actual': total_budget * random.uniform(0.04, 0.1),
                        'may_plan': total_budget * random.uniform(0.05, 0.1),
                        'may_actual': total_budget * random.uniform(0.04, 0.1),
                        'june_plan': total_budget * random.uniform(0.05, 0.1),
                        'june_actual': total_budget * random.uniform(0.04, 0.1),
                        'july_plan': total_budget * random.uniform(0.05, 0.1),
                        'july_actual': total_budget * random.uniform(0.04, 0.1),
                        'august_plan': total_budget * random.uniform(0.05, 0.1),
                        'august_actual': total_budget * random.uniform(0.04, 0.1),
                        'september_plan': total_budget * random.uniform(0.05, 0.1),
                        'september_actual': total_budget * random.uniform(0.04, 0.1),
                        'october_plan': total_budget * random.uniform(0.05, 0.1),
                        'october_actual': total_budget * random.uniform(0.04, 0.1),
                        'november_plan': total_budget * random.uniform(0.05, 0.1),
                        'november_actual': total_budget * random.uniform(0.04, 0.1),
                        'december_plan': total_budget * random.uniform(0.05, 0.1),
                        'december_actual': total_budget * random.uniform(0.04, 0.1),
                        'budget_manager': f'manager{random.randint(1, 3)}',
                        'approval_status': random.choice(appr_statuses),
                        'approval_status_name': ProjectManagementDataService._get_approval_status_name(random.choice(appr_statuses)),
                        'remarks': '예산 비고',
                        'source_tables': ['PJA120_YH'],
                        'data_source': 'fallback'
                    })

            return Response({
                'project_id': project_id,
                'budget_year': budget_year,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA120_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 예산관리 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 예산관리 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_resource_allocation(request):
        """
        프로젝트 자원배정 조회

        GET /api/erp-sync/project/resource-allocation/

        Query Parameters:
            project_id: 프로젝트 ID
            from_date: 시작일자
            to_date: 종료일자
        """
        try:
            project_id = request.GET.get('project_id', '')
            from_date = request.GET.get('from_date', '')
            to_date = request.GET.get('to_date', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA130_YH: 프로젝트 자원배정
                    where_clause = "1=1"
                    if project_id:
                        where_clause += f" AND prj_id = '{project_id}'"
                    if from_date:
                        where_clause += f" AND alloc_dt >= '{from_date}'"
                    if to_date:
                        where_clause += f" AND alloc_dt <= '{to_date}'"

                    resource_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA130_YH',
                        where_clause=where_clause,
                        limit=200
                    )

                    if resource_data:
                        for row in resource_data:
                            results.append({
                                'project_id': row.get('prj_id', ''),
                                'project_name': row.get('prj_nm', ''),
                                'resource_type': row.get('res_type', ''),
                                'resource_type_name': ProjectManagementDataService._get_resource_type_name(row.get('res_type', '')),
                                'resource_code': row.get('res_cd', ''),
                                'resource_name': row.get('res_nm', ''),
                                'allocation_date': str(row.get('alloc_dt', '')) if row.get('alloc_dt') else '',
                                'start_date': str(row.get('str_dt', '')) if row.get('str_dt') else '',
                                'end_date': str(row.get('end_dt', '')) if row.get('end_dt') else '',
                                'planned_hours': float(row.get('plan_hr', 0) or 0),
                                'actual_hours': float(row.get('act_hr', 0) or 0),
                                'allocation_rate': float(row.get('alloc_rate', 0) or 0),
                                'hourly_cost': float(row.get('hr_cost', 0) or 0),
                                'total_cost': float(row.get('total_cost', 0) or 0),
                                'department': row.get('dept_cd', ''),
                                'department_name': row.get('dept_nm', ''),
                                'skill_level': row.get('skill_lv', ''),
                                'role': row.get('role_cd', ''),
                                'role_name': row.get('role_nm', ''),
                                'utilization_rate': float(row.get('util_rate', 0) or 0),
                                'source_tables': ['PJA130_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'project_id': project_id,
                            'from_date': from_date,
                            'to_date': to_date,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA130_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            resource_types = ['human', 'equipment', 'facility']
            projects = [f'PRJ{i:04d}' for i in range(1, 6)]
            skills = ['junior', 'middle', 'senior', 'expert']

            for prj_id in projects[:3] if not project_id else [project_id]:
                for i in range(1, 8):
                    res_type = random.choice(resource_types)
                    plan_hr = random.uniform(40, 200)
                    act_hr = plan_hr * random.uniform(0.8, 1.1)

                    results.append({
                        'project_id': prj_id,
                        'project_name': f'프로젝트 {prj_id[-4:]}',
                        'resource_type': res_type,
                        'resource_type_name': ProjectManagementDataService._get_resource_type_name(res_type),
                        'resource_code': f'RES-{i:04d}',
                        'resource_name': f'자원 {i}',
                        'allocation_date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y%m%d'),
                        'start_date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y%m%d'),
                        'end_date': (datetime.now() + timedelta(days=random.randint(30, 90))).strftime('%Y%m%d'),
                        'planned_hours': plan_hr,
                        'actual_hours': act_hr,
                        'allocation_rate': random.uniform(50, 100),
                        'hourly_cost': random.uniform(30000, 100000),
                        'total_cost': act_hr * random.uniform(30000, 100000),
                        'department': f'DEPT{random.randint(1, 5):02d}',
                        'department_name': f'{random.choice(["개발", "영업", "생산", "품질"])}팀',
                        'skill_level': random.choice(skills) if res_type == 'human' else '',
                        'role': random.choice(['developer', 'designer', 'manager', 'tester']) if res_type == 'human' else '',
                        'role_name': random.choice(['개발자', '디자이너', '매니저', '테스터']) if res_type == 'human' else '',
                        'utilization_rate': random.uniform(60, 95),
                        'source_tables': ['PJA130_YH'],
                        'data_source': 'fallback'
                    })

            return Response({
                'project_id': project_id,
                'from_date': from_date,
                'to_date': to_date,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA130_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 자원배정 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 자원배정 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_milestone(request):
        """
        프로젝트 마일스톤 조회

        GET /api/erp-sync/project/milestone/

        Query Parameters:
            project_id: 프로젝트 ID
            milestone_status: 마일스톤 상태
        """
        try:
            project_id = request.GET.get('project_id', '')
            milestone_status = request.GET.get('milestone_status', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA140_YH: 프로젝트 마일스톤
                    where_clause = "1=1"
                    if project_id:
                        where_clause += f" AND prj_id = '{project_id}'"
                    if milestone_status:
                        where_clause += f" AND mil_sts = '{milestone_status}'"

                    milestone_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA140_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if milestone_data:
                        for row in milestone_data:
                            results.append({
                                'project_id': row.get('prj_id', ''),
                                'project_name': row.get('prj_nm', ''),
                                'milestone_code': row.get('mil_cd', ''),
                                'milestone_name': row.get('mil_nm', ''),
                                'milestone_sequence': int(row.get('mil_seq', 0) or 0),
                                'milestone_type': row.get('mil_type', ''),
                                'planned_date': str(row.get('plan_dt', '')) if row.get('plan_dt') else '',
                                'actual_date': str(row.get('act_dt', '')) if row.get('act_dt') else '',
                                'milestone_status': row.get('mil_sts', ''),
                                'milestone_status_name': ProjectManagementDataService._get_milestone_status_name(row.get('mil_sts', '')),
                                'progress_rate': float(row.get('prog_rate', 0) or 0),
                                'deliverables': row.get('deliverables', ''),
                                'responsible_person': row.get('resp_person', ''),
                                'dependency': row.get('dependency', ''),
                                'delay_days': int(row.get('delay_days', 0) or 0),
                                'completion_criteria': row.get('compl_crit', ''),
                                'approval_date': str(row.get('appr_dt', '')) if row.get('appr_dt') else '',
                                'approver': row.get('approver', ''),
                                'remarks': row.get('rmrk', ''),
                                'source_tables': ['PJA140_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'project_id': project_id,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA140_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            mil_statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'DELAYED']
            mil_types = ['phase', 'deliverable', 'review', 'approval']
            projects = [f'PRJ{i:04d}' for i in range(1, 6)]

            for prj_id in projects[:3] if not project_id else [project_id]:
                for i in range(1, 8):
                    mil_sts = random.choice(mil_statuses) if not milestone_status else milestone_status
                    delay_days = random.randint(0, 10) if mil_sts == 'DELAYED' else 0
                    prog_rate = 100 if mil_sts == 'COMPLETE' else random.uniform(20, 80)

                    results.append({
                        'project_id': prj_id,
                        'project_name': f'프로젝트 {prj_id[-4:]}',
                        'milestone_code': f'MIL{prj_id[-4:]}-{i:02d}',
                        'milestone_name': f'마일스톤 {i}',
                        'milestone_sequence': i,
                        'milestone_type': random.choice(mil_types),
                        'planned_date': (datetime.now() + timedelta(days=i*14-28)).strftime('%Y%m%d'),
                        'actual_date': (datetime.now() + timedelta(days=i*14-28+delay_days)).strftime('%Y%m%d') if mil_sts == 'COMPLETE' else '',
                        'milestone_status': mil_sts,
                        'milestone_status_name': ProjectManagementDataService._get_milestone_status_name(mil_sts),
                        'progress_rate': prog_rate,
                        'deliverables': f'산출물 {i}',
                        'responsible_person': f'user{random.randint(1, 10)}',
                        'dependency': f'MIL{prj_id[-4:]}-{i-1:02d}' if i > 1 else '',
                        'delay_days': delay_days,
                        'completion_criteria': f'완료기준 {i}',
                        'approval_date': (datetime.now() + timedelta(days=i*14-28+delay_days)).strftime('%Y%m%d') if mil_sts == 'COMPLETE' else '',
                        'approver': f'approver{random.randint(1, 3)}',
                        'remarks': f'마일스톤 {i} 비고',
                        'source_tables': ['PJA140_YH'],
                        'data_source': 'fallback'
                    })

            return Response({
                'project_id': project_id,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA140_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 마일스톤 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 마일스톤 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_project_performance(request):
        """
        프로젝트 성과분석 조회

        GET /api/erp-sync/project/performance/

        Query Parameters:
            project_id: 프로젝트 ID
            analysis_year: 분석년도 (YYYY)
        """
        try:
            project_id = request.GET.get('project_id', '')
            analysis_year = request.GET.get('analysis_year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PJA150_YH: 프로젝트 성과분석 + PJA100_YH(마스터)
                    where_clause = f"anal_yr = '{analysis_year}'"
                    if project_id:
                        where_clause += f" AND prj_id = '{project_id}'"

                    perf_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PJA150_YH',
                        where_clause=where_clause,
                        limit=50
                    )

                    if perf_data:
                        for row in perf_data:
                            budget_cost = float(row.get('budget_cost', 0) or 0)
                            actual_cost = float(row.get('actual_cost', 0) or 0)
                            planned_days = int(row.get('plan_days', 0) or 0)
                            actual_days = int(row.get('act_days', 0) or 0)

                            results.append({
                                'project_id': row.get('prj_id', ''),
                                'project_name': row.get('prj_nm', ''),
                                'analysis_year': analysis_year,
                                'budget_cost': budget_cost,
                                'actual_cost': actual_cost,
                                'cost_variance': actual_cost - budget_cost,
                                'cost_variance_rate': ((actual_cost - budget_cost) / budget_cost * 100) if budget_cost > 0 else 0,
                                'planned_days': planned_days,
                                'actual_days': actual_days,
                                'schedule_variance_days': actual_days - planned_days,
                                'schedule_performance_index': float(row.get('spi', 0) or 0),
                                'cost_performance_index': float(row.get('cpi', 0) or 0),
                                'quality_score': float(row.get('quality_score', 0) or 0),
                                'customer_satisfaction': float(row.get('cust_sat', 0) or 0),
                                'scope_change_count': int(row.get('scope_chg_cnt', 0) or 0),
                                'issue_count': int(row.get('issue_cnt', 0) or 0),
                                'risk_count': int(row.get('risk_cnt', 0) or 0),
                                'resource_utilization_rate': float(row.get('res_util_rate', 0) or 0),
                                'milestone_achievement_rate': float(row.get('mil_achv_rate', 0) or 0),
                                'on_time_delivery': row.get('ontime_dlv', 'Y'),
                                'within_budget': row.get('within_budg', 'Y'),
                                'final_grade': row.get('final_grade', ''),
                                'final_grade_name': ProjectManagementDataService._get_final_grade_name(row.get('final_grade', '')),
                                'lessons_learned': row.get('lessons', ''),
                                'best_practices': row.get('best_prac', ''),
                                'improvement_areas': row.get('imprv_area', ''),
                                'source_tables': ['PJA150_YH', 'PJA100_YH'],
                                'data_source': 'erp'
                            })

                        return Response({
                            'project_id': project_id,
                            'analysis_year': analysis_year,
                            'total_count': len(results),
                            'results': results,
                            'source_tables': ['PJA150_YH', 'PJA100_YH'],
                            'data_source': 'erp'
                        })

                except Exception as e:
                    logger.warning(f"ERP 데이터 조회 실패: {e}")

            # Fallback mock data
            grades = ['A', 'B', 'C', 'D', 'F']
            projects = [f'PRJ{i:04d}' for i in range(1, 6)]

            for prj_id in projects[:5] if not project_id else [project_id]:
                budget_cost = random.uniform(100000000, 500000000)
                actual_cost = budget_cost * random.uniform(0.9, 1.2)
                plan_days = random.randint(180, 365)
                act_days = int(plan_days * random.uniform(0.9, 1.2))
                spi = random.uniform(0.8, 1.2)
                cpi = random.uniform(0.8, 1.2)

                # 최종 등급 계산
                if spi >= 1.0 and cpi >= 1.0:
                    grade = 'A'
                elif spi >= 0.9 and cpi >= 0.9:
                    grade = 'B'
                elif spi >= 0.8 and cpi >= 0.8:
                    grade = 'C'
                else:
                    grade = 'D'

                results.append({
                    'project_id': prj_id,
                    'project_name': f'프로젝트 {prj_id[-4:]}',
                    'analysis_year': analysis_year,
                    'budget_cost': budget_cost,
                    'actual_cost': actual_cost,
                    'cost_variance': actual_cost - budget_cost,
                    'cost_variance_rate': ((actual_cost - budget_cost) / budget_cost * 100),
                    'planned_days': plan_days,
                    'actual_days': act_days,
                    'schedule_variance_days': act_days - plan_days,
                    'schedule_performance_index': spi,
                    'cost_performance_index': cpi,
                    'quality_score': random.uniform(70, 95),
                    'customer_satisfaction': random.uniform(70, 95),
                    'scope_change_count': random.randint(0, 10),
                    'issue_count': random.randint(0, 20),
                    'risk_count': random.randint(0, 10),
                    'resource_utilization_rate': random.uniform(70, 95),
                    'milestone_achievement_rate': random.uniform(80, 100),
                    'on_time_delivery': 'Y' if act_days <= plan_days else 'N',
                    'within_budget': 'Y' if actual_cost <= budget_cost else 'N',
                    'final_grade': grade,
                    'final_grade_name': ProjectManagementDataService._get_final_grade_name(grade),
                    'lessons_learned': f'프로젝트 {prj_id[-4:]} 교훈',
                    'best_practices': f'프로젝트 {prj_id[-4:]} 베스트프랙티스',
                    'improvement_areas': f'프로젝트 {prj_id[-4:]} 개선사항',
                    'source_tables': ['PJA150_YH', 'PJA100_YH'],
                    'data_source': 'fallback'
                })

            return Response({
                'project_id': project_id,
                'analysis_year': analysis_year,
                'total_count': len(results),
                'results': results,
                'source_tables': ['PJA150_YH', 'PJA100_YH'],
                'data_source': 'fallback'
            })

        except Exception as e:
            logger.error(f"프로젝트 성과분석 조회 오류: {e}")
            return Response({
                'error': f'프로젝트 성과분석 조회 중 오류가 발생했습니다: {str(e)}',
                'results': [],
                'total_count': 0
            }, status=500)

    # Helper methods
    @staticmethod
    def _get_project_status_name(status):
        """프로젝트 상태명 반환"""
        status_names = {
            'PLAN': '계획',
            'PROGRESS': '진행중',
            'COMPLETE': '완료',
            'HOLD': '보류',
            'CANCEL': '취소'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_task_status_name(status):
        """작업 상태명 반환"""
        status_names = {
            'PENDING': '대기',
            'IN_PROGRESS': '진행중',
            'COMPLETE': '완료',
            'DELAYED': '지연'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_budget_category_name(category):
        """예산 항목명 반환"""
        category_names = {
            'labor': '노무비',
            'material': '재료비',
            'expense': '경비',
            'outsourcing': '외주비'
        }
        return category_names.get(category, category)

    @staticmethod
    def _get_approval_status_name(status):
        """결재 상태명 반환"""
        status_names = {
            'DRAFT': '작성중',
            'PENDING': '결재대기',
            'APPROVED': '승인',
            'REJECTED': '반려'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_resource_type_name(res_type):
        """자원 유형명 반환"""
        type_names = {
            'human': '인적자원',
            'equipment': '설비자원',
            'facility': '시설자원'
        }
        return type_names.get(res_type, res_type)

    @staticmethod
    def _get_milestone_status_name(status):
        """마일스톤 상태명 반환"""
        status_names = {
            'PENDING': '대기',
            'IN_PROGRESS': '진행중',
            'COMPLETE': '완료',
            'DELAYED': '지연'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_final_grade_name(grade):
        """최종 등급명 반환"""
        grade_names = {
            'A': '우수',
            'B': '양호',
            'C': '보통',
            'D': '미흡',
            'F': '불량'
        }
        return grade_names.get(grade, grade)
