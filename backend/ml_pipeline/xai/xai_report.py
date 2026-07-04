# ML Pipeline XAI - XAI Report
# 설명 가능 AI 리포트 생성기

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)

try:
    from jinja2 import Template, Environment, FileSystemLoader
    JINJA_AVAILABLE = True
except ImportError:
    JINJA_AVAILABLE = False
    logger.warning("Jinja2가 설치되지 않음. pip install jinja2")


class XAIReportGenerator:
    """
    설명 가능 AI 리포트 생성기

    모델 예측에 대한 설명을 담은 리포트를 자동 생성

    리포트 구성:
    1. 모델 개요
    2. 변수 중요도
    3. 예측 설명
    4. 시각화
    5. 인사이트 및 권장사항
    """

    def __init__(
        self,
        model_name: str,
        model_type: str,
        target_variable: str = 'target'
    ):
        """
        리포트 생성기 초기화

        Args:
            model_name: 모델 이름
            model_type: 모델 유형
            target_variable: 타겟 변수명
        """
        self.model_name = model_name
        self.model_type = model_type
        self.target_variable = target_variable

        # 리포트 데이터 저장소
        self.report_data: Dict[str, Any] = {
            'model': {
                'name': model_name,
                'type': model_type,
                'target': target_variable
            },
            'generated_at': datetime.now().isoformat()
        }

        logger.info(f"XAI 리포트 생성기 초기화: {model_name}")

    def add_model_summary(
        self,
        training_period: str,
        metrics: Dict[str, float],
        hyperparameters: Dict[str, Any]
    ):
        """
        모델 요약 추가

        Args:
            training_period: 학습 기간
            metrics: 성능 메트릭
            hyperparameters: 하이퍼파라미터
        """
        self.report_data['model'].update({
            'training_period': training_period,
            'metrics': metrics,
            'hyperparameters': hyperparameters
        })

    def add_feature_importance(
        self,
        importance: List[Dict[str, Any]],
        global_importance: Dict[str, float]
    ):
        """
        변수 중요도 추가

        Args:
            importance: 변수 중요도 리스트
            global_importance: 전역 변수 중요도
        """
        self.report_data['feature_importance'] = {
            'top_features': importance[:10],
            'global_importance': global_importance
        }

    def add_prediction_explanation(
        self,
        instance_id: str,
        prediction: float,
        actual: Optional[float],
        explanation: Dict[str, Any],
        shap_values: List[float]
    ):
        """
        예측 설명 추가

        Args:
            instance_id: 인스턴스 ID
            prediction: 예측값
            actual: 실제값
            explanation: SHAP 설명
            shap_values: SHAP 값
        """
        if 'predictions' not in self.report_data:
            self.report_data['predictions'] = []

        self.report_data['predictions'].append({
            'instance_id': instance_id,
            'prediction': prediction,
            'actual': actual,
            'error': abs(prediction - actual) if actual is not None else None,
            'explanation': explanation,
            'shap_values': shap_values
        })

    def add_visualizations(
        self,
        plots: Dict[str, str]
    ):
        """
        시각화 추가

        Args:
            plots: 플롯 경로 딕셔너리
        """
        self.report_data['visualizations'] = plots

    def add_insights(
        self,
        insights: List[str],
        recommendations: List[str]
    ):
        """
        인사이트 및 권장사항 추가

        Args:
            insights: 인사이트 리스트
            recommendations: 권장사항 리스트
        """
        self.report_data['insights'] = insights
        self.report_data['recommendations'] = recommendations

    def generate_html_report(
        self,
        output_path: str,
        template_path: Optional[str] = None
    ) -> bool:
        """
        HTML 리포트 생성

        Args:
            output_path: 출력 경로
            template_path: 템플릿 경로

        Returns:
            성공 여부
        """
        if not JINJA_AVAILABLE:
            logger.error("Jinja2 미설치로 HTML 리포트 생성 불가")
            return False

        # 기본 템플릿 사용 또는 커스텀 템플릿 로드
        if template_path and Path(template_path).exists():
            with open(template_path, 'r', encoding='utf-8') as f:
                template = Template(f.read())
        else:
            template = Template(self._get_default_html_template())

        # HTML 생성
        html_content = template.render(**self.report_data)

        # 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        logger.info(f"HTML 리포트 생성 완료: {output_path}")
        return True

    def generate_markdown_report(
        self,
        output_path: str
    ) -> bool:
        """
        Markdown 리포트 생성

        Args:
            output_path: 출력 경로

        Returns:
            성공 여부
        """
        md_content = self._generate_markdown_content()

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(md_content)

        logger.info(f"Markdown 리포트 생성 완료: {output_path}")
        return True

    def generate_json_report(
        self,
        output_path: str
    ) -> bool:
        """
        JSON 리포트 생성

        Args:
            output_path: 출력 경로

        Returns:
            성공 여부
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.report_data, f, indent=2, ensure_ascii=False)

        logger.info(f"JSON 리포트 생성 완료: {output_path}")
        return True

    def _generate_markdown_content(self) -> str:
        """Markdown 콘텐츠 생성"""
        lines = []

        # 제목
        lines.append(f"# {self.model_name} 설명 가능 AI 리포트\n")
        lines.append(f"**생성일시:** {self.report_data['generated_at']}\n")
        lines.append(f"**모델 유형:** {self.model_type}\n\n")

        # 모델 요약
        lines.append("## 1. 모델 요약\n\n")

        if 'training_period' in self.report_data['model']:
            lines.append(f"- **학습 기간:** {self.report_data['model']['training_period']}\n")

        if 'metrics' in self.report_data['model']:
            lines.append("\n### 성능 메트릭\n\n")
            lines.append("| 메트릭 | 값 |\n")
            lines.append("|--------|------|\n")
            for metric, value in self.report_data['model']['metrics'].items():
                lines.append(f"| {metric.upper()} | {value:.4f} |\n")

        # 변수 중요도
        if 'feature_importance' in self.report_data:
            lines.append("\n## 2. 변수 중요도\n\n")

            if 'top_features' in self.report_data['feature_importance']:
                lines.append("### 상위 변수\n\n")
                lines.append("| 순위 | 변수 | 중요도 |\n")
                lines.append("|------|------|--------|\n")
                for i, feat in enumerate(self.report_data['feature_importance']['top_features'][:10], 1):
                    if isinstance(feat, dict):
                        name = feat.get('feature', feat.get('name', 'N/A'))
                        value = feat.get('value', feat.get('importance', 0))
                        lines.append(f"| {i} | {name} | {value:.4f} |\n")

        # 예측 설명
        if 'predictions' in self.report_data and self.report_data['predictions']:
            lines.append("\n## 3. 예측 설명\n\n")

            for pred in self.report_data['predictions'][:3]:  # 최대 3개
                lines.append(f"### 인스턴스: {pred['instance_id']}\n\n")
                lines.append(f"- **예측값:** {pred['prediction']:.2f}\n")
                if pred['actual'] is not None:
                    lines.append(f"- **실제값:** {pred['actual']:.2f}\n")
                    lines.append(f"- **오차:** {pred['error']:.2f}\n")

                if 'explanation' in pred:
                    lines.append("\n**주요 영향 변수:**\n\n")
                    for feat in pred['explanation'].get('top_positive', [])[:5]:
                        lines.append(f"- +{feat['feature']}: {feat['value']:.4f}\n")
                    for feat in pred['explanation'].get('top_negative', [])[:3]:
                        lines.append(f"- -{feat['feature']}: {feat['value']:.4f}\n")
                lines.append("\n")

        # 인사이트
        if 'insights' in self.report_data:
            lines.append("## 4. 인사이트\n\n")
            for insight in self.report_data['insights']:
                lines.append(f"- {insight}\n")

        # 권장사항
        if 'recommendations' in self.report_data:
            lines.append("\n## 5. 권장사항\n\n")
            for rec in self.report_data['recommendations']:
                lines.append(f"- {rec}\n")

        return ''.join(lines)

    def _get_default_html_template(self) -> str:
        """기본 HTML 템플릿"""
        return '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ model.name }} - 설명 가능 AI 리포트</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header .meta {
            margin-top: 10px;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .metric-card .label {
            color: #666;
            margin-top: 5px;
        }
        .feature-importance {
            margin-top: 20px;
        }
        .feature-item {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .feature-rank {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
        }
        .feature-bar {
            flex: 1;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
        }
        .feature-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.5s;
        }
        .prediction-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        .shap-positive { color: #e74c3c; }
        .shap-negative { color: #27ae60; }
        .insight {
            background: #e8f4f8;
            padding: 15px;
            border-left: 4px solid #17a2b8;
            margin-bottom: 10px;
        }
        .recommendation {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ model.name }}</h1>
        <div class="meta">
            <p>모델 유형: {{ model.type }}</p>
            <p>생성일시: {{ generated_at }}</p>
        </div>
    </div>

    {% if model.metrics is defined %}
    <div class="section">
        <h2>1. 모델 성능</h2>
        <div class="metrics-grid">
            {% for metric, value in model.metrics.items() %}
            <div class="metric-card">
                <div class="value">{{ value | round(4) }}</div>
                <div class="label">{{ metric.upper() }}</div>
            </div>
            {% endfor %}
        </div>
    </div>
    {% endif %}

    {% if feature_importance is defined and feature_importance.top_features %}
    <div class="section">
        <h2>2. 변수 중요도</h2>
        <div class="feature-importance">
            {% for feature in feature_importance.top_features[:10] %}
            <div class="feature-item">
                <div class="feature-rank">{{ loop.index }}</div>
                <div style="flex: 1;">
                    <strong>{{ feature.feature or feature.name }}</strong>
                    <div class="feature-bar">
                        <div class="feature-fill" style="width: {{ (feature.value * 100) | round }}%"></div>
                    </div>
                </div>
                <div style="margin-left: 15px; font-weight: bold;">
                    {{ (feature.value * 100) | round(2) }}%
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
    {% endif %}

    {% if predictions is defined and predictions %}
    <div class="section">
        <h2>3. 예측 설명</h2>
        {% for pred in predictions[:3] %}
        <div class="prediction-card">
            <h3>인스턴스: {{ pred.instance_id }}</h3>
            <p><strong>예측값:</strong> {{ pred.prediction | round(2) }}
            {% if pred.actual is not none %}
            | <strong>실제값:</strong> {{ pred.actual | round(2) }}
            | <strong>오차:</strong> {{ pred.error | round(2) }}
            {% endif %}</p>

            {% if pred.explanation is defined %}
            <h4>주요 영향 변수:</h4>
            <p class="shap-positive">
                {% for feat in pred.explanation.top_positive[:5] %}
                +{{ feat.feature }}: {{ feat.value | round(4) }}<br>
                {% endfor %}
            </p>
            <p class="shap-negative">
                {% for feat in pred.explanation.top_negative[:3] %}
                -{{ feat.feature }}: {{ feat.value | round(4) }}<br>
                {% endfor %}
            </p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if insights is defined %}
    <div class="section">
        <h2>4. 인사이트</h2>
        {% for insight in insights %}
        <div class="insight">
            {{ insight }}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if recommendations is defined %}
    <div class="section">
        <h2>5. 권장사항</h2>
        {% for rec in recommendations %}
        <div class="recommendation">
            {{ rec }}
        </div>
        {% endfor %}
    </div>
    {% endif %}
</body>
</html>
'''


class XAISummary:
    """
    XAI 요약 생성

    모델 전체에 대한 설명 요약을 생성
    """

    def __init__(self):
        self.summaries: Dict[str, Dict] = {}

    def add_model_summary(
        self,
        model_name: str,
        summary: Dict[str, Any]
    ):
        """
        모델 요약 추가

        Args:
            model_name: 모델 이름
            summary: 요약 정보
        """
        self.summaries[model_name] = summary

    def get_comparison_summary(
        self,
        model_names: List[str]
    ) -> Dict[str, Any]:
        """
        모델 비교 요약

        Args:
            model_names: 비교할 모델 이름들

        Returns:
            비교 요약
        """
        summaries = [
            self.summaries[name] for name in model_names
            if name in self.summaries
        ]

        if not summaries:
            return {}

        # 공통 변수 중요도
        common_features = set()
        for summary in summaries:
            if 'feature_importance' in summary:
                common_features.update(
                    f['feature'] if isinstance(f, dict) else f
                    for f in summary['feature_importance'][:10]
                )

        # 모델별 변수 중요도 비교
        feature_comparison = {}
        for feature in list(common_features)[:20]:
            feature_comparison[feature] = {}
            for i, summary in enumerate(summaries):
                for feat in summary.get('feature_importance', []):
                    feat_name = feat.get('feature', feat.get('name', ''))
                    if feat_name == feature:
                        feature_comparison[feature][model_names[i]] = feat.get('value', 0)

        return {
            'models': model_names,
            'num_models': len(model_names),
            'feature_comparison': feature_comparison,
            'generated_at': datetime.now().isoformat()
        }

    def generate_executive_summary(
        self,
        model_name: str
    ) -> Dict[str, Any]:
        """
        경영진 요약 생성

        Args:
            model_name: 모델 이름

        Returns:
            경영진 요약
        """
        if model_name not in self.summaries:
            return {}

        summary = self.summaries[model_name]

        # 핵심 인사이트 추출
        key_insights = []

        if 'metrics' in summary:
            mape = summary['metrics'].get('mape', 0)
            if mape < 5:
                key_insights.append(f"모델 정확도 우수 (MAPE {mape:.1f}%)")
            elif mape < 10:
                key_insights.append(f"모델 정확도 양호 (MAPE {mape:.1f}%)")
            else:
                key_insights.append(f"모델 정확도 개선 필요 (MAPE {mape:.1f}%)")

        if 'feature_importance' in summary:
            top_feature = summary['feature_importance'][0]
            feature_name = top_feature.get('feature', top_feature.get('name', ''))
            key_insights.append(f"가장 중요한 변수: {feature_name}")

        return {
            'model_name': model_name,
            'key_insights': key_insights,
            'overall_assessment': self._get_assessment(summary),
            'generated_at': datetime.now().isoformat()
        }

    def _get_assessment(self, summary: Dict) -> str:
        """종합 평가"""
        if 'metrics' in summary:
            mape = summary['metrics'].get('mape', 100)
            if mape < 5:
                return "우수"
            elif mape < 10:
                return "양호"
            else:
                return "개선 필요"
        return "�가 불가"
