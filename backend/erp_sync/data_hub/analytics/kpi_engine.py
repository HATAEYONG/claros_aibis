# -*- coding: utf-8 -*-
"""
KPI 통합 엔진
8개 카테고리 80개 KPI 정의 및 계산
"""
from decimal import Decimal
from datetime import date
from typing import Dict, List, Optional, Any
from django.db.models import Avg, Sum, Count, F, Q, DecimalField
from django.db.models.functions import Round

from .models import KPIDefinition, KPIFact


class KPIRegistry:
    """
    KPI 레지스트리 - 8개 카테고리 80개 KPI 정의 중앙 관리
    """

    # KPI 카테고리 정의
    CATEGORIES = {
        'financial': '재무',
        'cost': '원가',
        'production': '생산',
        'quality': '품질',
        'sales': '영업',
        'purchase': '구매',
        'manufacturing': '제조',
        'accounting': '관리회계'
    }

    # KPI 정의 (8개 카테고리 x 10개 = 80개)
    KPI_DEFINITIONS = {
        # 재무 (Financial) - 10개
        'F001': {
            'code': 'F001',
            'name': '매출총이익률',
            'name_en': 'Gross Profit Margin',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '매출액 대비 매출총이익의 비율',
            'formula': '(매출액 - 매출원가) / 매출액 * 100'
        },
        'F002': {
            'code': 'F002',
            'name': '영업이익률',
            'name_en': 'Operating Profit Margin',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '매출액 대비 영업이익의 비율',
            'formula': '영업이익 / 매출액 * 100'
        },
        'F003': {
            'code': 'F003',
            'name': '순이익률',
            'name_en': 'Net Profit Margin',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '매출액 대비 순이익의 비율',
            'formula': '순이익 / 매출액 * 100'
        },
        'F004': {
            'code': 'F004',
            'name': 'ROI',
            'name_en': 'Return on Investment',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '투자수익률',
            'formula': '순이익 / 총자본 * 100'
        },
        'F005': {
            'code': 'F005',
            'name': 'ROE',
            'name_en': 'Return on Equity',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '자기자본이익률',
            'formula': '순이익 / 자기자본 * 100'
        },
        'F006': {
            'code': 'F006',
            'name': '부채비율',
            'name_en': 'Debt Ratio',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '부채 / 자본',
            'formula': '부채 / 자본 * 100'
        },
        'F007': {
            'code': 'F007',
            'name': '유동비율',
            'name_en': 'Current Ratio',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '유동자산 / 유동부채',
            'formula': '유동자산 / 유동부채 * 100'
        },
        'F008': {
            'code': 'F008',
            'name': '당좌비율',
            'name_en': 'Quick Ratio',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '(유동자산 - 재고자산) / 유동부채',
            'formula': '(유동자산 - 재고자산) / 유동부채 * 100'
        },
        'F009': {
            'code': 'F009',
            'name': '영업현금흐름비율',
            'name_en': 'Operating Cash Flow Ratio',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '영업현금흐름 / 유동부채',
            'formula': '영업현금흐름 / 유동부채 * 100'
        },
        'F010': {
            'code': 'F010',
            'name': '이자보호비율',
            'name_en': 'Interest Coverage Ratio',
            'category': 'financial',
            'type': 'efficiency',
            'unit': '배',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '영업이익 / 이자비용',
            'formula': '영업이익 / 이자비용'
        },

        # 원가 (Cost) - 10개
        'C001': {
            'code': 'C001',
            'name': '재료비율',
            'name_en': 'Material Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '재료비 / 매출원가',
            'formula': '재료비 / 매출원가 * 100'
        },
        'C002': {
            'code': 'C002',
            'name': '노무비율',
            'name_en': 'Labor Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '노무비 / 매출원가',
            'formula': '노무비 / 매출원가 * 100'
        },
        'C003': {
            'code': 'C003',
            'name': '경비율',
            'name_en': 'Overhead Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '경비 / 매출원가',
            'formula': '경비 / 매출원가 * 100'
        },
        'C004': {
            'code': 'C004',
            'name': '표준원가달성율',
            'name_en': 'Standard Cost Achievement Rate',
            'category': 'cost',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '표준원가 대비 실제원가 달성율',
            'formula': '표준원가 / 실제원가 * 100'
        },
        'C005': {
            'code': 'C005',
            'name': '원가절감액',
            'name_en': 'Cost Reduction Amount',
            'category': 'cost',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'high',
            'aggregation_method': 'sum',
            'description': '원가 절감 총액',
            'formula': '표준원가 - 실제원가'
        },
        'C006': {
            'code': 'C006',
            'name': '물류비율',
            'name_en': 'Logistics Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '물류비 / 매출액',
            'formula': '물류비 / 매출액 * 100'
        },
        'C007': {
            'code': 'C007',
            'name': '폐기손실률',
            'name_en': 'Waste Loss Rate',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '폐기손실 / 매출액',
            'formula': '폐기손실 / 매출액 * 100'
        },
        'C008': {
            'code': 'C008',
            'name': '외주비율',
            'name_en': 'Outsourcing Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '외주비 / 매출원가',
            'formula': '외주비 / 매출원가 * 100'
        },
        'C009': {
            'code': 'C009',
            'name': '설비비용률',
            'name_en': 'Equipment Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '설비비용 / 매출액',
            'formula': '설비비용 / 매출액 * 100'
        },
        'C010': {
            'code': 'C010',
            'name': '품질비용률',
            'name_en': 'Quality Cost Ratio',
            'category': 'cost',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '품질비용 / 매출액',
            'formula': '품질비용 / 매출액 * 100'
        },

        # 생산 (Production) - 10개
        'P001': {
            'code': 'P001',
            'name': '생산계획달성율',
            'name_en': 'Production Plan Achievement Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '생산계획 대비 실제 생산 달성율',
            'formula': '실제생산량 / 생산계획량 * 100'
        },
        'P002': {
            'code': 'P002',
            'name': '가동률',
            'name_en': 'Operation Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '설비 가동률',
            'formula': '가동시간 / 가용시간 * 100'
        },
        'P003': {
            'code': 'P003',
            'name': '설비가동률',
            'name_en': 'Equipment Utilization Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '설비 실제 가동률',
            'formula': '실제가동시간 / 총가능시간 * 100'
        },
        'P004': {
            'code': 'P004',
            'name': '생산능률',
            'name_en': 'Productivity',
            'category': 'production',
            'type': 'productivity',
            'unit': '개/시간',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '단위 시간당 생산량',
            'formula': '생산량 / 가동시간'
        },
        'P005': {
            'code': 'P005',
            'name': '공시간달성율',
            'name_en': 'Cycle Time Achievement Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '표준 공시간 대비 실제 공시간 달성율',
            'formula': '표준공시간 / 실제공시간 * 100'
        },
        'P006': {
            'code': 'P006',
            'name': '준비시간비율',
            'name_en': 'Setup Time Ratio',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '준비시간 / 총가동시간',
            'formula': '준비시간 / 총가동시간 * 100'
        },
        'P007': {
            'code': 'P007',
            'name': '비가동율',
            'name_en': 'Downtime Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '비가동 시간 비율',
            'formula': '비가동시간 / 총가능시간 * 100'
        },
        'P008': {
            'code': 'P008',
            'name': '재공품량',
            'name_en': 'WIP Quantity',
            'category': 'production',
            'type': 'productivity',
            'unit': '개',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '재공품(Work In Process) 수량',
            'formula': 'SUM(재공품량)'
        },
        'P009': {
            'code': 'P009',
            'name': '재공품회전율',
            'name_en': 'WIP Turnover Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '회/월',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '월간 재공품 회전율',
            'formula': '월생산량 / 평균재공품량'
        },
        'P010': {
            'code': 'P010',
            'name': '생산근태율',
            'name_en': 'Production Attendance Rate',
            'category': 'production',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '생산직 근태율',
            'formula': '실근무인원 / 배정인원 * 100'
        },

        # 품질 (Quality) - 10개
        'Q001': {
            'code': 'Q001',
            'name': '수율',
            'name_en': 'Yield Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '양품률',
            'formula': '양품수 / 투입수 * 100'
        },
        'Q002': {
            'code': 'Q002',
            'name': '불량률',
            'name_en': 'Defect Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '불량률',
            'formula': '불량수 / 검사수 * 100'
        },
        'Q003': {
            'code': 'Q003',
            'name': '출하불량률',
            'name_en': 'Shipment Defect Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '출하 후 발견된 불량률',
            'formula': '출하불량수 / 출하수 * 100'
        },
        'Q004': {
            'code': 'Q004',
            'name': '공정불량률',
            'name_en': 'Process Defect Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '공정별 불량률',
            'formula': '공정불량수 / 공정투입수 * 100'
        },
        'Q005': {
            'code': 'Q005',
            'name': '고객클레임율',
            'name_en': 'Customer Claim Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '고객 클레임 발생율',
            'formula': '클레임건수 / 출하수 * 100'
        },
        'Q006': {
            'code': 'Q006',
            'name': '품질검사합격률',
            'name_en': 'Quality Inspection Pass Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '품질 검사 합격률',
            'formula': '합격수 / 검사수 * 100'
        },
        'Q007': {
            'code': 'Q007',
            'name': '재작업율',
            'name_en': 'Rework Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '재작업 발생율',
            'formula': '재작업수 / 생산수 * 100'
        },
        'Q008': {
            'code': 'Q008',
            'name': '스크랩률',
            'name_en': 'Scrap Rate',
            'category': 'quality',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '스크랩 발생율',
            'formula': '스크랩량 / 투입량 * 100'
        },
        'Q009': {
            'code': 'Q009',
            'name': 'CPK',
            'name_en': 'Process Capability Index',
            'category': 'quality',
            'type': 'quality',
            'unit': '-',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '공정 능력 지수',
            'formula': 'MIN((USL-평균)/(3*표준편차), (평균-LSL)/(3*표준편차))'
        },
        'Q010': {
            'code': 'Q010',
            'name': '품질비용총액',
            'name_en': 'Total Quality Cost',
            'category': 'quality',
            'type': 'quality',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '품질 관련 총 비용',
            'formula': '예방비용 + 평가비용 + 실패비용'
        },

        # 영업 (Sales) - 10개
        'S001': {
            'code': 'S001',
            'name': '매출액',
            'name_en': 'Sales Revenue',
            'category': 'sales',
            'type': 'financial',
            'unit': '원',
            'target_direction': 'high',
            'aggregation_method': 'sum',
            'description': '총 매출액',
            'formula': 'SUM(매출액)'
        },
        'S002': {
            'code': 'S002',
            'name': '매출원가율',
            'name_en': 'Cost of Sales Ratio',
            'category': 'sales',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '매출액 대비 매출원가 비율',
            'formula': '매출원가 / 매출액 * 100'
        },
        'S003': {
            'code': 'S003',
            'name': '영업이익',
            'name_en': 'Operating Profit',
            'category': 'sales',
            'type': 'financial',
            'unit': '원',
            'target_direction': 'high',
            'aggregation_method': 'sum',
            'description': '영업이익',
            'formula': '매출액 - 매출원가 - 판매비관리비'
        },
        'S004': {
            'code': 'S004',
            'name': '수주율',
            'name_en': 'Order Win Rate',
            'category': 'sales',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '견적 대비 수주율',
            'formula': '수주건수 / 견적건수 * 100'
        },
        'S005': {
            'code': 'S005',
            'name': '신규고객비율',
            'name_en': 'New Customer Ratio',
            'category': 'sales',
            'type': 'growth',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '신규 고객 비율',
            'formula': '신규고객수 / 총고객수 * 100'
        },
        'S006': {
            'code': 'S006',
            'name': '고객유지율',
            'name_en': 'Customer Retention Rate',
            'category': 'sales',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '기존 고객 유지율',
            'formula': '유지고객수 / 전월고객수 * 100'
        },
        'S007': {
            'code': 'S007',
            'name': '납기준수율',
            'name_en': 'On-Time Delivery Rate',
            'category': 'sales',
            'type': 'delivery',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '약속 납기일 내 납품 비율',
            'formula': '준시납품수 / 총납품수 * 100'
        },
        'S008': {
            'code': 'S008',
            'name': '미수금회전율',
            'name_en': 'Accounts Receivable Turnover',
            'category': 'sales',
            'type': 'efficiency',
            'unit': '회/년',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '연간 미수금 회전율',
            'formula': '연간매출액 / 평균미수금'
        },
        'S009': {
            'code': 'S009',
            'name': '영업담당자생산성',
            'name_en': 'Sales Productivity',
            'category': 'sales',
            'type': 'productivity',
            'unit': '원/인',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '영업담당자 1인당 매출액',
            'formula': '매출액 / 영업담당자수'
        },
        'S010': {
            'code': 'S010',
            'name': '고객만족도',
            'name_en': 'Customer Satisfaction Score',
            'category': 'sales',
            'type': 'quality',
            'unit': '점',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '고객 만족도 점수',
            'formula': 'AVG(고객만족도점수)'
        },

        # 구매 (Purchase) - 10개
        'PU001': {
            'code': 'PU001',
            'name': '구매액',
            'name_en': 'Purchase Amount',
            'category': 'purchase',
            'type': 'financial',
            'unit': '원',
            'target_direction': 'target',
            'aggregation_method': 'sum',
            'description': '총 구매액',
            'formula': 'SUM(구매액)'
        },
        'PU002': {
            'code': 'PU002',
            'name': '자재납기준수율',
            'name_en': 'Material On-Time Delivery Rate',
            'category': 'purchase',
            'type': 'delivery',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '자재 납기준수율',
            'formula': '준시납품수 / 총발주수 * 100'
        },
        'PU003': {
            'code': 'PU003',
            'name': '공급처수',
            'name_en': 'Number of Suppliers',
            'category': 'purchase',
            'type': 'efficiency',
            'unit': '개소',
            'target_direction': 'target',
            'aggregation_method': 'count',
            'description': '활성 공급처 수',
            'formula': 'COUNT(DISTINCT 공급처ID)'
        },
        'PU004': {
            'code': 'PU004',
            'name': '단일공급처의존도',
            'name_en': 'Single Supplier Dependency',
            'category': 'purchase',
            'type': 'safety',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '최대 공급처 의존도',
            'formula': '최대공급처매출액 / 총매입액 * 100'
        },
        'PU005': {
            'code': 'PU005',
            'name': '구매불량률',
            'name_en': 'Purchase Defect Rate',
            'category': 'purchase',
            'type': 'quality',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '입고 불량률',
            'formula': '입고불량수 / 총입고수 * 100'
        },
        'PU006': {
            'code': 'PU006',
            'name': '평균재고일수',
            'name_en': 'Average Inventory Days',
            'category': 'purchase',
            'type': 'efficiency',
            'unit': '일',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '평균 재고 보유 일수',
            'formula': '평균재고금액 / 일일사용액'
        },
        'PU007': {
            'code': 'PU007',
            'name': '재고회전율',
            'name_en': 'Inventory Turnover Rate',
            'category': 'purchase',
            'type': 'efficiency',
            'unit': '회/년',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '연간 재고 회전율',
            'formula': '연간사용액 / 평균재고금액'
        },
        'PU008': {
            'code': 'PU008',
            'name': '자재가격변동률',
            'name_en': 'Material Price Change Rate',
            'category': 'purchase',
            'type': 'cost',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '자재 가격 변동율',
            'formula': '(현재단가 - 기준단가) / 기준단가 * 100'
        },
        'PU009': {
            'code': 'PU009',
            'name': '구매리드타임',
            'name_en': 'Purchase Lead Time',
            'category': 'purchase',
            'type': 'efficiency',
            'unit': '일',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '발주부터 입고까지 평균 소요일',
            'formula': 'AVG(입고일 - 발주일)'
        },
        'PU010': {
            'code': 'PU010',
            'name': '긴급구매비율',
            'name_en': 'Emergency Purchase Ratio',
            'category': 'purchase',
            'type': 'efficiency',
            'unit': '%',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '긴급 구매 비율',
            'formula': '긴급구매액 / 총구매액 * 100'
        },

        # 제조 (Manufacturing) - 10개
        'M001': {
            'code': 'M001',
            'name': '종합설비효율',
            'name_en': 'OEE',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': 'Overall Equipment Effectiveness',
            'formula': '가동율 * 성능율 * 양품율'
        },
        'M002': {
            'code': 'M002',
            'name': '성능율',
            'name_en': 'Performance Rate',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '설비 성능율',
            'formula': '실제생산량 / 이론생산량 * 100'
        },
        'M003': {
            'code': 'M003',
            'name': 'MTBF',
            'name_en': 'Mean Time Between Failures',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '시간',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '평균 고장 간격',
            'formula': '총가동시간 / 고장횟수'
        },
        'M004': {
            'code': 'M004',
            'name': 'MTTR',
            'name_en': 'Mean Time To Repair',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '시간',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '평균 수리 시간',
            'formula': '총수리시간 / 고장횟수'
        },
        'M005': {
            'code': 'M005',
            'name': '예방보전이행율',
            'name_en': 'Preventive Maintenance Compliance',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '예방 보전 계획 이행율',
            'formula': '이행건수 / 계획건수 * 100'
        },
        'M006': {
            'code': 'M006',
            'name': '제조리드타임',
            'name_en': 'Manufacturing Lead Time',
            'category': 'manufacturing',
            'type': 'efficiency',
            'unit': '일',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '투입부터 완성까지 소요 시간',
            'formula': 'AVG(완성일 - 투입일)'
        },
        'M007': {
            'code': 'M007',
            'name': '공정수',
            'name_en': 'Number of Processes',
            'category': 'manufacturing',
            'type': 'efficiency',
            'unit': '공정',
            'target_direction': 'low',
            'aggregation_method': 'count',
            'description': '제조 공정 수',
            'formula': 'COUNT(DISTINCT 공정ID)'
        },
        'M008': {
            'code': 'M008',
            'name': '작업자인원수',
            'name_en': 'Number of Operators',
            'category': 'manufacturing',
            'type': 'efficiency',
            'unit': '명',
            'target_direction': 'target',
            'aggregation_method': 'count',
            'description': '작업자 인원 수',
            'formula': 'COUNT(DISTINCT 작업자ID)'
        },
        'M009': {
            'code': 'M009',
            'name': '자동화율',
            'name_en': 'Automation Rate',
            'category': 'manufacturing',
            'type': 'productivity',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '자동화 공정 비율',
            'formula': '자동화공정수 / 전체공정수 * 100'
        },
        'M010': {
            'code': 'M010',
            'name': '에너지효율',
            'name_en': 'Energy Efficiency',
            'category': 'manufacturing',
            'type': 'efficiency',
            'unit': '원/생산단위',
            'target_direction': 'low',
            'aggregation_method': 'avg',
            'description': '단위 생산당 에너지 비용',
            'formula': '에너지비용 / 생산량'
        },

        # 관리회계 (Accounting) - 10개
        'A001': {
            'code': 'A001',
            'name': '원가차이',
            'name_en': 'Cost Variance',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '표준원가와 실제원가 차이',
            'formula': '표준원가 - 실제원가'
        },
        'A002': {
            'code': 'A002',
            'name': '물량차이',
            'name_en': 'Quantity Variance',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '표준물량과 실제물량 차이',
            'formula': '(표준물량 - 실제물량) * 표준단가'
        },
        'A003': {
            'code': 'A003',
            'name': '단가차이',
            'name_en': 'Price Variance',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '표준단가와 실제단가 차이',
            'formula': '(표준단가 - 실제단가) * 실제물량'
        },
        'A004': {
            'code': 'A004',
            'name': '능률차이',
            'name_en': 'Efficiency Variance',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '표준공시간과 실제공시간 차이',
            'formula': '(표준공시간 - 실제공시간) * 표준노무비율'
        },
        'A005': {
            'code': 'A005',
            'name': '배부비용차이',
            'name_en': 'Overhead Variance',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '배부기준과 실제 배부 차이',
            'formula': '배부예산 - 실제배부액'
        },
        'A006': {
            'code': 'A006',
            'name': '직접원가',
            'name_en': 'Direct Cost',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '직접 재료비 + 직접 노무비',
            'formula': '직접재료비 + 직접노무비'
        },
        'A007': {
            'code': 'A007',
            'name': '간접원가',
            'name_en': 'Indirect Cost',
            'category': 'accounting',
            'type': 'cost',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '제조 간접비',
            'formula': 'SUM(제조간접비)'
        },
        'A008': {
            'code': 'A008',
            'name': '한계이익',
            'name_en': 'Contribution Margin',
            'category': 'accounting',
            'type': 'financial',
            'unit': '원',
            'target_direction': 'high',
            'aggregation_method': 'sum',
            'description': '매출액 - 변동비',
            'formula': '매출액 - 변동비'
        },
        'A009': {
            'code': 'A009',
            'name': '손익분기점',
            'name_en': 'Break-Even Point',
            'category': 'accounting',
            'type': 'financial',
            'unit': '원',
            'target_direction': 'low',
            'aggregation_method': 'sum',
            'description': '고정비 / (1 - 변동비율)',
            'formula': '고정비 / (1 - 변동비/매출액)'
        },
        'A010': {
            'code': 'A010',
            'name': '안전율',
            'name_en': 'Margin of Safety',
            'category': 'accounting',
            'type': 'financial',
            'unit': '%',
            'target_direction': 'high',
            'aggregation_method': 'avg',
            'description': '손익분기점 여유율',
            'formula': '(매출액 - 손익분기점) / 매출액 * 100'
        },
    }

    @classmethod
    def get_kpi_definition(cls, kpi_code: str) -> Optional[Dict]:
        """KPI 정의 조회"""
        return cls.KPI_DEFINITIONS.get(kpi_code)

    @classmethod
    def get_all_kpi_definitions(cls) -> Dict[str, Dict]:
        """모든 KPI 정의 조회"""
        return cls.KPI_DEFINITIONS

    @classmethod
    def get_kpis_by_category(cls, category: str) -> List[Dict]:
        """카테고리별 KPI 목록 조회"""
        return [kpi for kpi in cls.KPI_DEFINITIONS.values() if kpi['category'] == category]

    @classmethod
    def get_categories(cls) -> Dict[str, str]:
        """KPI 카테고리 목록 조회"""
        return cls.CATEGORIES

    @classmethod
    def get_category_kpi_codes(cls, category: str) -> List[str]:
        """카테고리별 KPI 코드 목록 조회"""
        return [kpi['code'] for kpi in cls.get_kpis_by_category(category)]


class UnifiedKPIEngine:
    """
    통합 KPI 계산 엔진
    8개 카테고리 80개 KPI 계산 수행
    """

    def __init__(self):
        self.registry = KPIRegistry()

    def calculate_kpi(
        self,
        kpi_code: str,
        date: date,
        plant: Optional[str] = None,
        line: Optional[str] = None,
        department: Optional[str] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        단일 KPI 계산

        Args:
            kpi_code: KPI 코드 (예: F001)
            date: 대상 날짜
            plant: 공장 코드 (선택)
            line: 라인 코드 (선택)
            department: 부서 코드 (선택)
            **kwargs: 추가 차원 정보

        Returns:
            KPI 계산 결과 딕셔너리
        """
        kpi_def = self.registry.get_kpi_definition(kpi_code)
        if not kpi_def:
            return None

        # KPI 계산 로직 (실제 구현은 각 KPI별로 데이터 조회 후 계산)
        # 여기서는 예시로 기본 구조만 제공
        result = {
            'kpi_code': kpi_code,
            'date': date,
            'plant': plant,
            'line': line,
            'department': department,
            'actual_value': self._calculate_actual_value(kpi_code, date, plant, line, department, **kwargs),
            'target_value': self._get_target_value(kpi_code, date),
            'baseline_value': self._get_baseline_value(kpi_code, date),
        }

        # 달성율 및 상태 계산
        result['achievement_rate'] = self._calculate_achievement_rate(result, kpi_def)
        result['variance'] = result['actual_value'] - (result['target_value'] or 0)
        result['variance_rate'] = self._calculate_variance_rate(result, kpi_def)
        result['status'] = self._determine_status(result, kpi_def)

        return result

    def calculate_kpis_for_period(
        self,
        start_date: date,
        end_date: date,
        kpi_codes: Optional[List[str]] = None,
        **dimensions
    ) -> List[Dict[str, Any]]:
        """
        기간별 KPI 대량 계산

        Args:
            start_date: 시작 날짜
            end_date: 종료 날짜
            kpi_codes: KPI 코드 목록 (None이면 전체)
            **dimensions: 차원 정보

        Returns:
            KPI 계산 결과 목록
        """
        from datetime import timedelta
        import calendar

        results = []
        current_date = start_date

        # 계산 대상 KPI 목록
        if kpi_codes is None:
            kpi_codes = list(self.registry.get_all_kpi_definitions().keys())

        # 일별 계산
        while current_date <= end_date:
            for kpi_code in kpi_codes:
                result = self.calculate_kpi(kpi_code, current_date, **dimensions)
                if result:
                    results.append(result)
            current_date += timedelta(days=1)

        return results

    def save_kpi_fact(self, kpi_data: Dict[str, Any]) -> Optional[KPIFact]:
        """
        KPI 팩트 저장

        Args:
            kpi_data: KPI 계산 결과 데이터

        Returns:
            저장된 KPIFact 인스턴스
        """
        try:
            kpi_def = KPIDefinition.objects.get(kpi_code=kpi_data['kpi_code'])

            fact_data = {
                'kpi': kpi_def,
                'date': kpi_data['date'],
                'year': kpi_data['date'].year,
                'quarter': (kpi_data['date'].month - 1) // 3 + 1,
                'month': kpi_data['date'].month,
                'week': kpi_data['date'].isocalendar()[1] if kpi_data['date'].day <= 7 else None,
                'plant': kpi_data.get('plant', ''),
                'line': kpi_data.get('line', ''),
                'department': kpi_data.get('department', ''),
                'actual_value': kpi_data.get('actual_value', 0),
                'target_value': kpi_data.get('target_value'),
                'baseline_value': kpi_data.get('baseline_value'),
                'achievement_rate': kpi_data.get('achievement_rate'),
                'variance': kpi_data.get('variance'),
                'variance_rate': kpi_data.get('variance_rate'),
                'status': kpi_data.get('status', 'neutral'),
                'source_system': 'UnifiedKPIEngine',
                'metadata': kpi_data.get('metadata', {}),
            }

            # upsert
            fact, created = KPIFact.objects.update_or_create(
                kpi=kpi_def,
                date=kpi_data['date'],
                plant=kpi_data.get('plant', ''),
                line=kpi_data.get('line', ''),
                defaults=fact_data
            )

            return fact
        except KPIDefinition.DoesNotExist:
            return None
        except Exception as e:
            print(f"KPI 팩트 저장 실패: {e}")
            return None

    def _calculate_actual_value(
        self,
        kpi_code: str,
        date: date,
        plant: Optional[str],
        line: Optional[str],
        department: Optional[str],
        **kwargs
    ) -> Decimal:
        """
        실제값 계산 (실제 구현 필요)
        각 KPI별로 데이터를 조회하고 계산하는 로직 구현
        """
        # TODO: 실제 데이터 조회 및 계산 로직 구현
        # 여기서는 예시로 0 반환
        return Decimal('0.00')

    def _get_target_value(self, kpi_code: str, date: date) -> Optional[Decimal]:
        """목표값 조회"""
        # TODO: 목표값 설정 테이블에서 조회
        return None

    def _get_baseline_value(self, kpi_code: str, date: date) -> Optional[Decimal]:
        """기준값 조회"""
        # TODO: 기준값 설정 테이블에서 조회
        return None

    def _calculate_achievement_rate(self, result: Dict, kpi_def: Dict) -> Optional[Decimal]:
        """달성율 계산"""
        if result['target_value'] and result['target_value'] != 0:
            if kpi_def['target_direction'] == 'high':
                return Decimal(str((result['actual_value'] / result['target_value']) * 100))
            else:
                return Decimal(str((result['target_value'] / result['actual_value']) * 100))
        return None

    def _calculate_variance_rate(self, result: Dict, kpi_def: Dict) -> Optional[Decimal]:
        """차이율 계산"""
        if result['target_value'] and result['target_value'] != 0:
            return Decimal(str(((result['actual_value'] - result['target_value']) / result['target_value']) * 100))
        return None

    def _determine_status(self, result: Dict, kpi_def: Dict) -> str:
        """상태 결정"""
        kpi_def_obj = KPIDefinition.objects.filter(kpi_code=kpi_def['code']).first()

        if kpi_def_obj:
            if kpi_def_obj.threshold_critical is not None:
                if kpi_def['target_direction'] == 'high':
                    if result['actual_value'] < kpi_def_obj.threshold_critical:
                        return 'critical'
                    elif result['actual_value'] < kpi_def_obj.threshold_warning:
                        return 'warning'
                    else:
                        return 'good'
                else:
                    if result['actual_value'] > kpi_def_obj.threshold_critical:
                        return 'critical'
                    elif result['actual_value'] > kpi_def_obj.threshold_warning:
                        return 'warning'
                    else:
                        return 'good'

        return 'neutral'
