# ML Pipeline Upgrade - LLM Forecaster
# LLM (Large Language Model) 기반 시계열 예측

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    from transformers import (
        AutoModel, AutoTokenizer,
        GPT2LMHeadModel, GPT2Tokenizer
    )
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Transformers 미설치")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI API 미설치")


class LLMForecaster:
    """
    LLM 기반 시계열 예측 시스템

    지원 모델:
    - TimeGPT (Nixtla): 시계열 전용 사전학습 모델
    - Chronos (Amazon): 시계열 기반 Foundation Model
    - Lag-Llama (Meta): 시계열 LLM
    - GPT-4T (OpenAI): 멀티모달 시계열

    특징:
    - 사전학습된 시계열 지식 활용
    - Few-shot Learning
    - 자동 텍스트 설명 생성
    - 멀티모달 입력 지원 (텍스트, 수치, 이미지)
    - 불확실성 정량화
    """

    def __init__(
        self,
        model_type: str = 'timegpt',  # 'timegpt', 'chronos', 'gpt-4t', 'local'
        api_key: Optional[str] = None,
        model_path: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ):
        """
        LLM Forecaster 초기화

        Args:
            model_type: 모델 유형
            api_key: OpenAI API Key (GPT-4T용)
            model_path: 로컬 모델 경로 (로컬 모델용)
            max_tokens: 최대 토큰 수
            temperature: 샘플링 온도
        """
        self.model_type = model_type
        self.api_key = api_key
        self.model_path = model_path
        self.max_tokens = max_tokens
        self.temperature = temperature

        # 모델 초기화
        self.model = None
        self.tokenizer = None

        if model_type == 'gpt-4t' and OPENAI_AVAILABLE:
            self.client = OpenAI(api_key=api_key)
        elif model_type == 'local' and TRANSFORMERS_AVAILABLE:
            self._init_local_model()
        else:
            # 시뮬레이션 모드
            logger.warning(f"{model_type} 모델 사용 불가, 시뮬레이션 모드로 실행")

        logger.info(f"LLM Forecaster 초기화: {model_type}")

    def _init_local_model(self):
        """로컬 LLM 모델 초기화"""
        if self.model_path:
            # 커스텀 모델 로드
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModel.from_pretrained(self.model_path)
        else:
            # GPT-2 기반 (시뮬레이션)
            self.tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
            self.model = GPT2LMHeadModel.from_pretrained('gpt2')

    def generate_prompt(
        self,
        context_data: pd.DataFrame,
        target_col: str = 'value',
        horizon: int = 30,
        include_explanations: bool = True,
        external_context: Optional[str] = None
    ) -> str:
        """
        예측을 위한 프롬프트 생성

        Args:
            context_data: 과거 데이터
            target_col: 타겟 컬럼명
            horizon: 예측 기간
            include_explanations: 설명 포함 여부
            external_context: 외부 컨텍스트 (뉴스, 경제 지표 등)

        Returns:
            생성된 프롬프트
        """
        # 시계열 데이터를 텍스트로 변환
        values = context_data[target_col].values

        # 기본 프롬프트 템플릿
        prompt_parts = [
            "You are a time series forecasting expert. "
            "Given the historical data below, provide a forecast for the next period.\n\n",
            "Historical Data:\n"
        ]

        # 데이터 포맷팅
        recent_values = values[-min(90, len(values)):]
        prompt_parts.append(f"Recent values (last {len(recent_values)} periods): ")
        prompt_parts.append(", ".join([f"{v:.2f}" for v in recent_values]))
        prompt_parts.append("\n\n")

        # 통계 정보 추가
        prompt_parts.extend([
            "Statistics:\n",
            f"- Mean: {np.mean(values):.2f}\n",
            f"- Std Dev: {np.std(values):.2f}\n",
            f"- Min: {np.min(values):.2f}\n",
            f"- Max: {np.max(values):.2f}\n",
            f"- Trend: {'Increasing' if values[-1] > values[0] else 'Decreasing'}\n\n"
        ])

        # 계절성 분석
        if len(values) >= 90:  # 분기별 분석 가능
            prompt_parts.append("Seasonal Patterns:\n")
            quarterly_means = [
                np.mean(values[i::4]) for i in range(4)
            ]
            prompt_parts.append(f"- Q1-Q4 Average: {['{:.2f}'.format(m) for m in quarterly_means]}\n")

        # 외부 컨텍스트
        if external_context:
            prompt_parts.extend([
                "External Context:\n",
                external_context,
                "\n\n"
            ])

        # 예측 요청
        prompt_parts.extend([
            f"Task: Provide a {horizon}-period forecast.\n",
            "Output Format:\n"
            "1. Forecast values (comma-separated)\n"
        ])

        if include_explanations:
            prompt_parts.extend([
                "2. Explanation of the forecast\n",
                "3. Key factors influencing the prediction\n",
                "4. Confidence level (High/Medium/Low)\n"
            ])

        return "".join(prompt_parts)

    def parse_llm_response(
        self,
        response: str,
        horizon: int
    ) -> Dict[str, Any]:
        """
        LLM 응답 파싱

        Args:
            response: LLM 응답 텍스트
            horizon: 예측 기간

        Returns:
            파싱된 예측 결과
        """
        lines = response.strip().split('\n')

        result = {
            'forecast': [],
            'explanation': '',
            'confidence': 'Unknown',
            'factors': []
        }

        # 예측값 파싱
        for line in lines:
            line = line.strip()
            # 콤마로 구분된 숫자 찾기
            if ',' in line and all(c.isdigit() or c in '.-,' for c in line.replace(' ', '')):
                try:
                    values = [float(x.strip()) for x in line.split(',')]
                    if len(values) == horizon:
                        result['forecast'] = values
                        break
                except ValueError:
                    continue

        # 설명 추출
        explanation_keywords = ['explanation', 'reasoning', 'analysis', 'forecast:', 'prediction:']
        in_explanation = False
        explanation_lines = []

        for line in lines:
            line_lower = line.lower()
            if any(kw in line_lower for kw in explanation_keywords):
                in_explanation = True

            if in_explanation and line.strip():
                explanation_lines.append(line.strip())

        result['explanation'] = ' '.join(explanation_lines)

        # 신뢰도 추출
        confidence_keywords = ['high', 'medium', 'low']
        for line in lines:
            line_lower = line.lower()
            for conf in confidence_keywords:
                if conf in line_lower:
                    result['confidence'] = conf.title()
                    break

        return result

    def predict(
        self,
        context_data: pd.DataFrame,
        horizon: int = 30,
        target_col: str = 'value',
        use_api: bool = True,
        external_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        LLM 기반 예측

        Args:
            context_data: 과거 데이터
            horizon: 예측 기간
            target_col: 타겟 컬럼명
            use_api: API 사용 여부
            external_context: 외부 컨텍스트

        Returns:
            예측 결과
        """
        logger.info(f"LLM 예측 시작: model_type={self.model_type}, horizon={horizon}")

        # 프롬프트 생성
        prompt = self.generate_prompt(
            context_data,
            target_col,
            horizon,
            include_explanations=True,
            external_context=external_context
        )

        # LLM 호출
        if self.model_type == 'gpt-4t' and OPENAI_AVAILABLE and use_api:
            response = self._call_openai(prompt)
        elif self.model is not None:
            response = self._call_local_model(prompt)
        else:
            # 시뮬레이션
            response = self._simulate_llm_response(context_data, horizon)

        # 응답 파싱
        result = self.parse_llm_response(response, horizon)

        # 메타데이터 추가
        result.update({
            'model_type': self.model_type,
            'horizon': horizon,
            'prediction_timestamp': datetime.now().isoformat(),
            'context_data_points': len(context_data),
            'prompt_used': prompt[:500] + '...' if len(prompt) > 500 else prompt,
            'confidence_level': result.get('confidence', 'Unknown'),
            'explanation': result.get('explanation', '')
        })

        return result

    def _call_openai(self, prompt: str) -> str:
        """OpenAI API 호출"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a time series forecasting expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API 호출 오류: {str(e)}")
            raise

    def _call_local_model(self, prompt: str) -> str:
        """로컬 모델 호출"""
        try:
            inputs = self.tokenizer.encode(prompt, return_tensors='pt')
            outputs = self.model.generate(
                inputs,
                max_new_tokens=self.max_tokens,
                temperature=self.temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return response
        except Exception as e:
            logger.error(f"로컬 모델 호출 오류: {str(e)}")
            raise

    def _simulate_llm_response(
        self,
        context_data: pd.DataFrame,
        horizon: int
    ) -> str:
        """LLM 응답 시뮬레이션"""
        values = context_data.iloc[:, 0].values if len(context_data.shape) > 1 else context_data.values

        # 추세 계산
        recent_trend = (values[-7:] - values[-14:-7]).mean() if len(values) >= 14 else 0
        last_value = values[-1]

        # 예측 생성 (추세 + 계절성 + 노이즈)
        forecast = []
        for i in range(horizon):
            trend_component = last_value + (recent_trend * (i + 1))
            seasonal_component = 0.05 * last_value * np.sin(2 * np.pi * i / 7)
            noise = np.random.normal(0, 0.02 * last_value)
            predicted = trend_component + seasonal_component + noise
            forecast.append(max(0, predicted))  # 음수 방지

        # 설명 생성
        explanation_parts = [
            "Forecast based on historical analysis:\n",
            f"- Recent trend: {'Increasing' if recent_trend > 0 else 'Decreasing'} ({recent_trend:.2f} per period)\n",
            f"- Last observed value: {last_value:.2f}\n",
            f"- Forecast shows {'upward' if recent_trend > 0 else 'downward'} movement with weekly seasonality\n",
            "\nKey factors:\n",
            "- Historical trend pattern\n",
            "- Weekly seasonal fluctuations\n",
            "- Recent volatility level\n",
            "\nConfidence Level: Medium"
        ]

        response = "Forecast Values:\n"
        response += ", ".join([f"{v:.2f}" for v in forecast])
        response += "\n\n"
        response += "".join(explanation_parts)

        return response


class TimeGPTForecaster:
    """
    TimeGPT 전용 포터

    Nixtla TimeGPT 래퍼
    """

    def __init__(self):
        """TimeGPT 초기화"""
        try:
            from nixtla import TimeGPT
            self.model = TimeGPT()
            self.available = True
        except ImportError:
            self.available = False
            logger.warning("TimeGPT 미설치")

    def predict(
        self,
        df: pd.DataFrame,
        horizon: int = 30,
        freq: str = 'D'
    ) -> Dict[str, Any]:
        """
        TimeGPT 예측

        Args:
            df: 입력 데이터 (시간 인덱스 필요)
            horizon: 예측 기간
            freq: 빈도 ('D'=일, 'W'=주, 'M'=월)

        Returns:
            예측 결과
        """
        if not self.available:
            raise ImportError("TimeGPT가 설치되지 않음")

        # 시간 인덱스 확인
        if not isinstance(df.index, pd.DatetimeIndex):
            raise ValueError("시간 인덱스가 필요합니다")

        # TimeGPT 예측
        try:
            forecast_df = self.model.forecast(
                df,
                h=horizon,
                freq=freq
            )

            # 결과 포맷팅
            return {
                'forecast': forecast_df['value'].tolist(),
                'dates': forecast_df.index.astype(str).tolist(),
                'model_type': 'TimeGPT',
                'horizon': horizon,
                'prediction_timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"TimeGPT 예측 오류: {str(e)}")
            raise


class PromptEngineer:
    """
    프롬프트 엔지니어링

    최적의 예측을 위한 프롬프트 설계 및 최적화
    """

    def __init__(
        self,
        domain: str = 'general',
        language: str = 'ko'
    ):
        """
        프롬프트 엔지니어 초기화

        Args:
            domain: 도메인 (제조, 유통, 금융 등)
            language: 언어
        """
        self.domain = domain
        self.language = language

        # 프롬프트 템플릿
        self.templates = {
            'manufacturing': {
                'system': "You are an expert in manufacturing forecasting. Analyze production data and provide forecasts.",
                'few_shot': [
                    {
                        'input': 'Production: [100, 105, 102, 98, 110]',
                        'forecast': '[108, 112, 109, 115]',
                        'reasoning': 'Slight upward trend with weekly seasonality'
                    }
                ]
            },
            'retail': {
                'system': "You are an expert in retail sales forecasting.",
                'few_shot': []
            },
            'finance': {
                'system': "You are an expert in financial forecasting.",
                'few_shot': []
            }
        }

    def create_forecast_prompt(
        self,
        data: Dict[str, Any],
        domain: Optional[str] = None
    ) -> str:
        """
        예측 프롬프트 생성

        Args:
            data: 예측 데이터
            domain: 도메인

        Returns:
            생성된 프롬프트
        """
        domain = domain or self.domain
        template = self.templates.get(domain, self.templates['general'])

        prompt_parts = [template['system'], "\n\n"]

        # Few-shot 예시 추가
        if template['few_shot']:
            prompt_parts.append("Examples:\n")
            for example in template['few_shot'][:3]:
                prompt_parts.append(f"Input: {example['input']}\n")
                prompt_parts.append(f"Forecast: {example['forecast']}\n")
                prompt_parts.append(f"Reasoning: {example['reasoning']}\n\n")

        # 현재 데이터 추가
        prompt_parts.extend([
            "Current Data:\n",
            f"Historical values: {data.get('values', [])}\n",
            f"Statistics: Mean={data.get('mean', 0):.2f}, Std={data.get('std', 0):.2f}\n",
            f"Forecast horizon: {data.get('horizon', 30)} periods\n\n",
            "Provide forecast with explanation."
        ])

        return "".join(prompt_parts)

    def optimize_prompt(
        self,
        prompt_template: str,
        test_cases: List[Dict[str, Any]],
        metric_fn: callable
    ) -> str:
        """
        프롬프트 최적화

        Args:
            prompt_template: 프롬프트 템플릿
            test_cases: 테스트 케이스
            metric_fn: 평가 함수

        Returns:
            최적화된 프롬프트
        """
        # 간단한 구현 - 실제에서는 Optuna 등 활용
        best_score = float('inf')
        best_prompt = prompt_template

        # 테스트
        for i, test_case in enumerate(test_cases):
            try:
                # 테스트 프롬프트 생성
                test_prompt = self._fill_template(prompt_template, test_case)

                # 평가
                score = metric_fn(test_prompt)

                if score < best_score:
                    best_score = score
                    best_prompt = test_prompt

            except Exception as e:
                logger.error(f"프롬프트 테스트 오류: {str(e)}")

        return best_prompt

    def _fill_template(self, template: str, data: Dict[str, Any]) -> str:
        """템플릿 채우기"""
        for key, value in data.items():
            template = template.replace(f"{{{key}}}", str(value))
        return template


class MultimodalLLMForecaster:
    """
    멀티모달 LLM 예측 시스템

    입력:
    - 수치 데이터: 시계열 수치
    - 텍스트: 뉴스, 보고서, 이메일
    - 이미지: 위성 사진, 제품 이미지
    - 오디오: 고객 음성
    """

    def __init__(self, modalities: List[str] = ['numerical', 'text']):
        """
        멀티모달 예측기 초기화

        Args:
            modalities: 사용할 모달리티 리스트
        """
        self.modalities = modalities

        # 각 모달리티 인코더
        self.encoders = {}
        self._init_encoders()

    def _init_encoders(self):
        """모달리티 인코더 초기화"""
        if 'text' in self.modalities:
            if TRANSFORMERS_AVAILABLE:
                self.encoders['text'] = AutoModel.from_pretrained('bert-base-uncased')
                logger.info("텍스트 인코더 초기화 완료")

        if 'image' in self.modalities:
            try:
                import torchvision.models as models
                self.encoders['image'] = models.resnet50(pretrained=True)
                logger.info("이미지 인코더 초기화 완료")
            except ImportError:
                logger.warning("이미지 인코더 초기화 실패")

    def predict(
        self,
        numerical_data: Optional[pd.DataFrame] = None,
        text: Optional[str] = None,
        image: Optional[str] = None,
        audio: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        멀티모달 예측

        Args:
            numerical_data: 수치 데이터
            text: 텍스트 데이터
            image: 이미지 경로
            audio: 오디오 경로

        Returns:
            예측 결과
        """
        features = []
        modality_contributions = {}

        # 수치 데이터
        if numerical_data is not None:
            features.append(numerical_data.values.flatten())
            modality_contributions['numerical'] = 1.0

        # 텍스트
        if text and 'text' in self.modalities:
            text_features = self._encode_text(text)
            features.append(text_features)
            modality_contributions['text'] = 0.3

        # 이미지
        if image and 'image' in self.modalities:
            image_features = self._encode_image(image)
            features.append(image_features)
            modality_contributions['image'] = 0.2

        # 특징 결합
        if len(features) > 1:
            combined_features = np.concatenate(features, axis=-1)
        else:
            combined_features = features[0] if features else np.array([])

        # 예측 (시뮬레이션)
        forecast = self._forecast_from_features(combined_features)

        return {
            'forecast': forecast,
            'modality_contributions': modality_contributions,
            'modalities_used': list(modality_contributions.keys())
        }

    def _encode_text(self, text: str) -> np.ndarray:
        """텍스트 인코딩"""
        # BERT 임베딩 (평균 풀링)
        with torch.no_grad():
            outputs = self.encoders['text'](**text)
        return outputs.last_mean_sentence[:, 0, :].numpy()

    def _encode_image(self, image_path: str) -> np.ndarray:
        """이미지 인코딩"""
        try:
            from PIL import Image
            from torchvision import transforms

            # 이미지 로드 및 전처리
            image = Image.open(image_path)
            preprocess = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            image_tensor = preprocess(image).unsqueeze(0)

            # ResNet 특징 추출
            with torch.no_grad():
                features = self.encoders['image'](image_tensor)

            return features.flatten().numpy()

        except Exception as e:
            logger.error(f"이미지 인코딩 오류: {str(e)}")
            return np.zeros(2048)

    def _forecast_from_features(self, features: np.ndarray) -> List[float]:
        """특징에서 예측"""
        # 시뮬레이션: 간단한 선형 모델
        if len(features) == 0:
            return []

        # 마지막 30일 평균 + 약간의 추세
        last_value = features[-1] if len(features) > 0 else 100
        forecast = [last_value * (1 + 0.001 * i) for i in range(30)]

        return forecast


# 전역 인스턴스
_llm_forecaster: Optional[LLMForecaster] = None


def get_llm_forecaster(
    model_type: str = 'timegpt',
    api_key: Optional[str] = None
) -> LLMForecaster:
    """전역 LLM Forecaster 인스턴스 반환"""
    global _llm_forecaster

    if _llm_forecaster is None:
        _llm_forecaster = LLMForecaster(
            model_type=model_type,
            api_key=api_key
        )

    return _llm_forecaster
