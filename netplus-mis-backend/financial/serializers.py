from rest_framework import serializers
from .models import FinancialStatement, FinancialRatio


class FinancialStatementSerializer(serializers.ModelSerializer):
    """재무제표 시리얼라이저"""
    statement_type_display = serializers.CharField(source='get_statement_type_display', read_only=True)
    
    class Meta:
        model = FinancialStatement
        fields = [
            'id',
            'statement_type',
            'statement_type_display',
            'fiscal_year',
            'fiscal_month',
            # 손익계산서
            'revenue',
            'cost_of_sales',
            'gross_profit',
            'operating_expenses',
            'operating_income',
            'net_income',
            # 재무상태표
            'total_assets',
            'current_assets',
            'non_current_assets',
            'total_liabilities',
            'total_equity',
            # 현금흐름표
            'operating_cashflow',
            'investing_cashflow',
            'financing_cashflow',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """데이터 검증"""
        # 손익계산서 검증
        if data.get('statement_type') == 'income':
            if data.get('revenue', 0) < 0:
                raise serializers.ValidationError("매출액은 음수일 수 없습니다.")
        
        # 재무상태표 검증 (자산 = 부채 + 자본)
        if data.get('statement_type') == 'balance':
            total_assets = data.get('total_assets', 0)
            total_liabilities = data.get('total_liabilities', 0)
            total_equity = data.get('total_equity', 0)
            
            if abs(total_assets - (total_liabilities + total_equity)) > 1:
                raise serializers.ValidationError(
                    "재무상태표의 자산, 부채, 자본 합계가 일치하지 않습니다."
                )
        
        return data


class FinancialStatementListSerializer(serializers.ModelSerializer):
    """재무제표 목록용 간소화 시리얼라이저"""
    statement_type_display = serializers.CharField(source='get_statement_type_display', read_only=True)
    
    class Meta:
        model = FinancialStatement
        fields = [
            'id',
            'statement_type',
            'statement_type_display',
            'fiscal_year',
            'fiscal_month',
            'revenue',
            'net_income',
            'total_assets',
            'operating_cashflow',
            'created_at',
        ]


class FinancialRatioSerializer(serializers.ModelSerializer):
    """재무비율 시리얼라이저"""
    
    class Meta:
        model = FinancialRatio
        fields = [
            'id',
            'fiscal_year',
            'fiscal_month',
            # 수익성
            'roe',
            'roa',
            'operating_margin',
            'net_margin',
            # 안정성
            'debt_ratio',
            'current_ratio',
            'quick_ratio',
            # 활동성
            'asset_turnover',
            'inventory_turnover',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_fiscal_month(self, value):
        """회계월 검증"""
        if value < 1 or value > 12:
            raise serializers.ValidationError("회계월은 1~12 사이여야 합니다.")
        return value


class FinancialRatioListSerializer(serializers.ModelSerializer):
    """재무비율 목록용 간소화 시리얼라이저"""
    
    class Meta:
        model = FinancialRatio
        fields = [
            'id',
            'fiscal_year',
            'fiscal_month',
            'roe',
            'roa',
            'debt_ratio',
            'current_ratio',
        ]