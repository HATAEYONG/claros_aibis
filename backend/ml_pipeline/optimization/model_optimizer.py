# ML Pipeline Optimization - Model Optimizer
# 모델 경량화 및 실시간 추론 최적화

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
import logging
from pathlib import Path
import copy

logger = logging.getLogger(__name__)

try:
    import onnx
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logger.warning("ONNX 미설치")


class ModelOptimizer:
    """
    모델 최적화 시스템

    기능:
    - 양자화 (Quantization): FP32 → FP16/INT8
    - 가지치기 (Pruning): 불필요한 연결 제거
    - 지식 증류 (Distillation): 큰 모델 → 작은 모델
    - ONNX 변환: 크로스프레임워크 호환
    - TensorRT 최적화: GPU 추론 가속

    목표:
    - 추론 속도: 10배 향상
    - 메모리 사용: 50% 감소
    - 정확도 손실: 1% 미만
    """

    def __init__(
        self,
        model: Optional[nn.Module] = None,
        model_path: Optional[str] = None
    ):
        """
        모델 최적화기 초기화

        Args:
            model: PyTorch 모델
            model_path: 모델 저장 경로
        """
        if model is not None:
            self.model = model
        elif model_path:
            self.model = torch.load(model_path)
        else:
            raise ValueError("model 또는 model_path 필수")

        self.original_model = copy.deepcopy(self.model)
        self.model.eval()

        # 최적화 결과 저장
        self.optimization_history = []

        logger.info("Model Optimizer 초기화 완료")

    def quantize(
        self,
        calibration_data: Optional[torch.Tensor] = None,
        quant_type: str = 'dynamic',
        dtype: torch.dtype = torch.qint8
    ) -> nn.Module:
        """
        모델 양자화

        Args:
            calibration_data: 보정 데이터 (Static Quantization용)
            quant_type: 양자화 유형 ('dynamic', 'static')
            dtype: 목표 데이터 타입

        Returns:
            양자화된 모델
        """
        logger.info(f"모델 양자화 시작: type={quant_type}, dtype={dtype}")

        # 원본 크기 측정
        original_size = self._get_model_size(self.model)
        logger.info(f"원본 모델 크기: {original_size:.2f} MB")

        # 동적 양자화
        if quant_type == 'dynamic':
            quantized_model = torch.quantization.quantize_dynamic(
                self.model,
                {nn.Linear, nn.LSTM, nn.GRU, nn.Conv1d},
                dtype=dtype
            )

        # 정적 양자화
        elif quant_type == 'static' and calibration_data is not None:
            quantized_model = torch.quantization.quantize(
                self.model,
                {nn.Linear, nn.LSTM, nn.GRU},
                dtype=dtype
            )
            # 보정
            quantized_model = self._calibrate_model(
                quantized_model,
                calibration_data
            )

        else:
            raise ValueError("정적 양자화에는 calibration_data가 필요함")

        # 크기 측정
        quantized_size = self._get_model_size(quantized_model)
        logger.info(f"양자화 모델 크기: {quantized_size:.2f} MB")
        logger.info(f"크기 감소: {(1 - quantized_size/original_size)*100:.1f}%")

        # 정확도 검증
        accuracy_diff = self._validate_quantization(quantized_model, calibration_data)
        logger.info(f"양자화 정확도 차이: {accuracy_diff:.2f}%")

        # 결과 저장
        self.optimization_history.append({
            'technique': 'quantization',
            'type': quant_type,
            'dtype': str(dtype),
            'original_size': original_size,
            'optimized_size': quantized_size,
            'size_reduction': (1 - quantized_size/original_size) * 100,
            'accuracy_diff': accuracy_diff,
            'timestamp': datetime.now().isoformat()
        })

        return quantized_model

    def _calibrate_model(
        self,
        quantized_model: nn.Module,
        calibration_data: torch.Tensor
    ) -> nn.Module:
        """
        양자화 모델 보정

        Args:
            quantized_model: 양자화된 모델
            calibration_data: 보정 데이터

        Returns:
            보정된 모델
        """
        logger.info("모델 보정 시작...")

        # 보정 데이터로 forward pass
        with torch.no_grad():
            for _ in range(100):  # 100번 반복
                _ = quantized_model(calibration_data)

        return quantized_model

    def _validate_quantization(
        self,
        quantized_model: nn.Module,
        test_data: Optional[torch.Tensor] = None
    ) -> float:
        """
        양자화 정확도 검증

        Args:
            quantized_model: 양자화된 모델
            test_data: 테스트 데이터

        Returns:
            정확도 차이 (%)
        """
        if test_data is None:
            # 랜덤 데이터 생성
            test_data = torch.randn(10, 100)

        # 원본 모델 예측
        with torch.no_grad():
            original_output = self.original_model(test_data)

        # 양자화 모델 예측
        with torch.no_grad():
            quantized_output = quantized_model(test_data)

        # RMSE 계산
        rmse = torch.sqrt(torch.mean((original_output - quantized_output) ** 2))
        relative_error = (rmse / (torch.std(original_output) + 1e-8)) * 100

        return relative_error.item()

    def prune(
        self,
        sparsity: float = 0.3,
        method: str = 'l1_unstructured',
        finetune_epochs: int = 5
    ) -> nn.Module:
        """
        모델 가지치기 (Pruning)

        Args:
            sparsity: 희소성 비율 (0.3 = 30% 연결 제거)
            method: 가지치기 방법
            finetune_epochs: Fine-tuning 에포크 수

        Returns:
            가지치된 모델
        """
        logger.info(f"모델 가지치기 시작: sparsity={sparsity}, method={method}")

        import torch.nn.utils.prune as prune

        # 파라미터 저장 (fine-tuning용)
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                param_backup = param.data.clone()

        # 가지치기 수행
        parameters_to_prune = []
        for name, module in self.model.named_modules():
            if isinstance(module, (nn.Linear, nn.Conv1d)):
                parameters_to_prune.append((module, 'weight'))

        if method == 'l1_unstructured':
            for module, name in parameters_to_prune:
                prune.l1_unstructured(
                    module,
                    name=name,
                    amount=sparsity
                )

        # 가지치기 적용
        for module, name in parameters_to_prune:
            prune.remove(module, name)

        # 제거된 파라미터 영구화
        for module, name in parameters_to_prune:
            prune.l1_unstructured(
                module,
                name=name,
                amount=sparsity
            )

        # Fine-tuning
        if finetune_epochs > 0:
            logger.info(f"Fine-tuning 시작: {finetune_epochs} epochs")
            self._finetune_pruned_model(finetune_epochs)

        # 파라미터 수 계산
        total_params = sum(p.numel() for p in self.model.parameters())
        remaining_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)

        logger.info(f"가지치기 완료: {total_params} → {remaining_params} ({(1-remaining_params/total_params)*100:.1f}% 제거)")

        return self.model

    def _finetune_pruned_model(self, epochs: int):
        """가지치기된 모델 Fine-tuning"""
        # 간단한 Fine-tuning
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)

        # 더미 데이터 생성
        dummy_data = torch.randn(100, 100)
        dummy_target = torch.randn(100, 1)

        for epoch in range(epochs):
            optimizer.zero_grad()
            output = self.model(dummy_data)
            loss = nn.functional.mse_loss(output, dummy_target)
            loss.backward()
            optimizer.step()

            if (epoch + 1) % max(1, epochs // 5) == 0:
                logger.info(f"Fine-tuning Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")

    def distill(
        self,
        student_model: nn.Module,
        train_data: torch.Tensor,
        temperature: float = 3.0,
        epochs: int = 10
    ) -> nn.Module:
        """
        지식 증류 (Knowledge Distillation)

        큰 모델(Teacher) → 작은 모델(Student)

        Args:
            student_model: 학생 모델
            train_data: 학습 데이터
            temperature: 온도 (높을수록 부드러운 확률)
            epochs: 학습 에포크

        Returns:
            학습된 학생 모델
        """
        logger.info("지식 증류 시작")

        self.teacher_model = self.model
        self.teacher_model.eval()

        # Distillation 손실 함수
        def distillation_loss(student_output, teacher_output, temperature):
            # Softmax with temperature
            T = temperature

            student_log_prob = torch.nn.functional.log_softmax(student_output / T, dim=-1)
            teacher_log_prob = torch.nn.functional.log_softmax(teacher_output / T, dim=-1)

            # KL Divergence
            kl_div = torch.nn.functional.kl_div(
                student_log_prob,
                teacher_log_prob,
                reduction='batchmean'
            )

            return kl_div * (temperature ** 2)

        # 학생 모델 학습
        optimizer = torch.optim.Adam(student_model.parameters(), lr=0.001)

        for epoch in range(epochs):
            optimizer.zero_grad()

            # Teacher 예측
            with torch.no_grad():
                teacher_output = self.teacher_model(train_data)

            # Student 예측
            student_output = student_model(train_data)

            # Distillation Loss
            loss = distillation_loss(student_output, teacher_output, temperature)

            loss.backward()
            optimizer.step()

            if (epoch + 1) % max(1, epochs // 5) == 0:
                logger.info(f"Distillation Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")

        logger.info("지식 증류 완료")
        return student_model

    def convert_to_onnx(
        self,
        dummy_input: Tuple,
        onnx_path: str = 'model.onnx',
        opset_version: int = 14,
        dynamic_axes: Optional[Dict[str, int]] = None
    ) -> str:
        """
        ONNX 변환

        Args:
            dummy_input: 더미 입력 (sample input)
            onnx_path: ONNX 저장 경로
            opset_version: ONNX opset 버전
            dynamic_axes: 동적 축 정의

        Returns:
            ONNX 파일 경로
        """
        if not ONNX_AVAILABLE:
            raise ImportError("ONNX 미설치")

        logger.info(f"ONNX 변환 시작: {onnx_path}")

        self.model.eval()

        # 동적 축 지정
        dynamic_axes = dynamic_axes or {}

        # ONNX 추론
        torch.onnx.export(
            self.model,
            dummy_input,
            f=onnx_path,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes=dynamic_axes,
            opset_version=opset_version,
            do_constant_folding=True,
            export_params=True
        )

        # 모델 크기 확인
        onnx_size = Path(onnx_path).stat().st_size / (1024 * 1024)  # MB
        logger.info(f"ONNX 모델 크기: {onnx_size:.2f} MB")

        # ONNX 검증
        try:
            onnx_model = onnx.load(onnx_path)
            onnx.checker.check_model(onnx_model)
            logger.info("ONNX 모델 검증 완료")
        except Exception as e:
            logger.warning(f"ONNX 검증 실패: {str(e)}")

        return onnx_path

    def convert_to_tensorrt(
        self,
        onnx_path: str,
        engine_path: str = 'model.trt',
        max_batch_size: int = 1,
        max_workspace_size: int = 1 << 30  # 1GB
    ) -> str:
        """
        TensorRT 엔진 변환

        GPU 추론 최적화

        Args:
            onnx_path: ONNX 파일 경로
            engine_path: TensorRT 엔진 저장 경로
            max_batch_size: 최대 배치 사이즈
            max_workspace_size: 최대 작업 공간

        Returns:
            TensorRT 엔진 경로
        """
        try:
            import tensorrt as trt
            TRT_AVAILABLE = True
        except ImportError:
            logger.error("TensorRT 미설치")
            raise ImportError("TensorRT 미설치")

        logger.info(f"TensorRT 변환 시작: {engine_path}")

        # TensorRT 로거
        TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
        builder = trt.Builder(TRT_LOGGER)
        builder.max_batch_size = max_batch_size
        builder.max_workspace_size = max_workspace_size

        # 네트워크 정의
        network = builder.create_network(1 << 20)  # 1MB
        parser = trt.OnnxParser(
            trt.Builder.TRACKER,
            network,
            TRT_LOGGER
        )

        # ONNX 파싱
        with open(onnx_path, 'rb') as model:
            parser.parse(model)

        # 엔진 빌드
        engine = builder.build_cuda_engine()

        # 엔진 저장
        engine.save(engine_path)

        logger.info(f"TensorRT 엔진 저장 완료: {engine_path}")
        return engine_path

    def benchmark_inference(
        self,
        input_data: torch.Tensor,
        num_iterations: int = 100,
        warmup: int = 10
    ) -> Dict[str, float]:
        """
        추론 성능 벤치마크

        Args:
            input_data: 입력 데이터
            num_iterations: 반복 횟수
            warmup: 워밍업 반복 횟수

        Returns:
            벤치마크 결과
        """
        logger.info("추론 벤치마크 시작")

        self.model.eval()

        # 워밍업
        with torch.no_grad():
            for _ in range(warmup):
                _ = self.model(input_data)

        # 타이밍
        import time
        start_time = time.time()

        with torch.no_grad():
            for _ in range(num_iterations):
                _ = self.model(input_data)

        end_time = time.time()

        # 메트릭 계산
        elapsed_time = end_time - start_time
        avg_time = elapsed_time / num_iterations
        throughput = num_iterations / elapsed_time

        return {
            'total_time': elapsed_time,
            'avg_time_ms': avg_time * 1000,
            'throughput_per_sec': throughput,
            'iterations': num_iterations
        }

    def _get_model_size(self, model: nn.Module) -> float:
        """모델 크기 계산 (MB)"""
        param_size = 0
        buffer_size = 0

        for param in model.parameters():
            param_size += param.numel() * param.element_size()

        for buffer in model.buffers():
            buffer_size += buffer.numel() * buffer.element_size()

        total_size = param_size + buffer_size
        return total_size / (1024 * 1024)  # Bytes to MB

    def get_optimization_summary(self) -> Dict[str, Any]:
        """
        최적화 요약 조회

        Returns:
            최적화 히스토리
        """
        if not self.optimization_history:
            return {
                'message': '수행된 최적화 없음'
            }

        summary = {
            'total_optimizations': len(self.optimization_history),
            'optimizations': self.optimization_history
        }

        # 전체 크기 감소율 계산
        if 'original_size' in self.optimization_history[0]:
            original_size = self.optimization_history[0]['original_size']
            final_size = self.optimization_history[-1]['optimized_size']
            summary['total_size_reduction'] = (1 - final_size / original_size) * 100

        return summary


class TensorRTInferenceEngine:
    """
    TensorRT 추론 엔진

    GPU 가속 추론을 위한 래�
    """

    def __init__(
        self,
        engine_path: str,
        input_shape: Tuple[int, ...]
    ):
        """
        TensorRT 엔진 초기화

        Args:
            engine_path: TensorRT 엔진 경로
            input_shape: 입력 텐플릿 형태
        """
        try:
            import tensorrt as trt
            TRT_AVAILABLE = True
        except ImportError:
            TRT_AVAILABLE = False
            raise ImportError("TensorRT 미설치")

        logger.info(f"TensorRT 엔진 로드: {engine_path}")

        # 엔진 로드
        self.runtime = trt.Logger(trt.Logger.WARNING)
        self.runtime = trt.Runtime(self.runtime)
        self.engine = self.runtime.load_engine(engine_path)

        # 입출력 바인딩
        self.inputs = []
        self.outputs = []
        self.bindings = []

        # I/O 텐플릿 자동 감지
        for i in range(self.engine.num_io_tensors):
            tensor_type = self.engine.get_tensor_type(i)
            if tensor_type == trt.TensorType.INPUT:
                self.inputs.append({
                    'index': i,
                    'name': self.engine.get_tensor_name(i),
                    'shape': self.engine.get_tensor_shape(i),
                    'dtype': trt.nptype(self.engine.get_tensor_dtype(i))
                })
            else:
                self.outputs.append({
                    'index': i,
                    'name': self.engine.get_tensor_name(i),
                    'shape': self.engine.get_tensor_shape(i),
                    'dtype': trt.nptype(self.engine.get_tensor_dtype(i))
                })

        self.input_shape = input_shape

        logger.info(f"TensorRT 엔진 초기화 완료: 입력={input_shape}")

    def predict(
        self,
        input_data: np.ndarray
    ) -> np.ndarray:
        """
        TensorRT 추론

        Args:
            input_data: 입력 데이터

        Returns:
            예측 결과
        """
        import torch

        # Torch 텐서로 변환
        input_tensor = torch.from_numpy(input_data).contiguous()

        # 출력 텐서 할당
        output_tensor = torch.empty(self.inputs[0]['shape'], dtype=torch.float32)

        # 추론
        self.runtime.execute_v2(
            bindings=list(self.bindings),
            inputs=[input_tensor.numpy()],
            outputs=[output_tensor.numpy()]
        )

        return output_tensor.numpy()

    def benchmark(
        self,
        input_data: np.ndarray,
        num_iterations: int = 100
    ) -> Dict[str, float]:
        """
        TensorRT 추론 벤치마크

        Returns:
        벤치마크 결과
        """
        import time

        # 워밍업
        for _ in range(10):
            self.predict(input_data)

        # 타이밍
        start_time = time.time()

        for _ in range(num_iterations):
            self.predict(input_data)

        end_time = time.time()

        elapsed_time = end_time - start_time
        avg_time = elapsed_time / num_iterations
        throughput = num_iterations / elapsed_time

        return {
            'total_time': elapsed_time,
            'avg_time_ms': avg_time * 1000,
            'throughput_per_sec': throughput,
            'iterations': num_iterations
        }


def create_student_model(
    teacher_model: nn.Module,
    compression_ratio: float = 0.5
) -> nn.Module:
    """
    학생 모델 생성 (지식 증류용)

    Args:
        teacher_model: 교사 모델
        compression_ratio: 압축 비율

    Returns:
        학생 모델
    """
    # 간단한 구조 - 교사보다 작은 모델
    student_layers = []

    for layer in teacher_model.children():
        if isinstance(layer, nn.Linear):
            in_features = layer.in_features
            out_features = int(in_features * compression_ratio)
            student_layers.append(nn.Linear(in_features, out_features))
        elif isinstance(layer, nn.LSTM):
            input_size = layer.input_size
            hidden_size = int(layer.hidden_size * compression_ratio)
            student_layers.append(nn.LSTM(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=layer.num_layers,
                batch_first=True
            ))
        else:
            # 다른 레이어는 그대로 복사
            student_layers.append(layer)

    return nn.Sequential(*student_layers)


def optimize_for_inference(
    model: nn.Module,
    optimization_level: str = 'standard'
) -> Tuple[nn.Module, Dict[str, Any]]:
    """
    추론 최적화 파이프라인

    Args:
        model: 원본 모델
        optimization_level: 최적화 수준
            - 'light': 양자화만
            - 'standard': 양자화 + 가지치기
            - 'aggressive': 양자화 + 가지치기 + 지식 증류

    Returns:
        최적화된 모델, 최적화 정보
    """
    optimizer = ModelOptimizer(model=model)

    if optimization_level == 'light':
        # 동적 양자화만
        optimized_model = optimizer.quantize(quant_type='dynamic')

    elif optimization_level == 'standard':
        # 양자화 + 가지치기
        optimized_model = optimizer.quantize(quant_type='dynamic')
        optimized_model = optimizer.prune(sparsity=0.3)

    elif optimization_level == 'aggressive':
        # 양자화 + 가지치기 + 지식 증류
        optimized_model = optimizer.quantize(quant_type='dynamic')
        optimized_model = optimizer.prune(sparsity=0.5)

        # 지식 증류
        student_model = create_student_model(optimized_model, compression_ratio=0.5)
        train_data = torch.randn(100, 100)  # 실제 데이터 필요
        optimized_model = optimizer.distill(student_model, train_data)

    else:
        raise ValueError(f"알 수 없는 최적화 수준: {optimization_level}")

    summary = optimizer.get_optimization_summary()

    return optimized_model, summary
