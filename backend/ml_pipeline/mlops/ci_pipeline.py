# ML Pipeline MLOps - CI/CD Pipeline
# 머신러닝 CI/CD 자동화 파이프라인

import os
import subprocess
import yaml
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class PipelineStatus(Enum):
    """파이프라인 상태"""
    PENDING = 'pending'
    RUNNING = 'running'
    SUCCESS = 'success'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


class StageType(Enum):
    """스테이지 유형"""
    DATA_VALIDATION = 'data_validation'
    FEATURE_ENGINEERING = 'feature_engineering'
    TRAINING = 'training'
    EVALUATION = 'evaluation'
    DEPLOYMENT = 'deployment'
    MONITORING = 'monitoring'


@dataclass
class StageConfig:
    """스테이지 설정"""
    name: str
    type: StageType
    command: str
    timeout_seconds: int = 3600
    retry_count: int = 0
    dependencies: List[str] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    enabled: bool = True


@dataclass
class StageResult:
    """스테이지 실행 결과"""
    stage_name: str
    status: PipelineStatus
    start_time: str
    end_time: Optional[str] = None
    duration_seconds: float = 0
    output: str = ''
    error: str = ''
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineRun:
    """파이프라인 실행"""
    run_id: str
    pipeline_name: str
    status: PipelineStatus
    start_time: str
    end_time: Optional[str] = None
    stages: Dict[str, StageResult] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    artifacts: List[str] = field(default_factory=list)


class CIPipeline:
    """
    CI/CD 파이프라인

    머신러닝 모델 학습, 평가, 배포 자동화

    파이프라인 구성:
    1. 데이터 검증
    2. 피처 엔지니어링
    3. 모델 학습
    4. 모델 평가
    5. 모델 배포
    6. 모니터링 설정
    """

    def __init__(
        self,
        pipeline_name: str,
        config_path: Optional[str] = None,
        working_dir: str = '.',
        artifact_dir: str = 'artifacts'
    ):
        """
        CI/CD 파이프라인 초기화

        Args:
            pipeline_name: 파이프라인 이름
            config_path: 설정 파일 경로 (YAML)
            working_dir: 작업 디렉토리
            artifact_dir: 아티팩트 저장 디렉토리
        """
        self.pipeline_name = pipeline_name
        self.working_dir = Path(working_dir)
        self.artifact_dir = Path(artifact_dir)
        self.artifact_dir.mkdir(parents=True, exist_ok=True)

        # 파이프라인 설정
        self.stages: Dict[str, StageConfig] = {}
        if config_path:
            self.load_config(config_path)
        else:
            self._init_default_stages()

        # 실행 기록
        self.runs: Dict[str, PipelineRun] = {}
        self.current_run: Optional[PipelineRun] = None

        # 상태 콜백
        self.status_callbacks: List[Callable] = []

        logger.info(f"CI/CD 파이프라인 초기화: {pipeline_name}")

    def _init_default_stages(self):
        """기본 스테이지 초기화"""
        self.stages = {
            'data_validation': StageConfig(
                name='data_validation',
                type=StageType.DATA_VALIDATION,
                command='python scripts/validate_data.py',
                timeout_seconds=600
            ),
            'feature_engineering': StageConfig(
                name='feature_engineering',
                type=StageType.FEATURE_ENGINEERING,
                command='python scripts/create_features.py',
                timeout_seconds=1800,
                dependencies=['data_validation']
            ),
            'training': StageConfig(
                name='training',
                type=StageType.TRAINING,
                command='python scripts/train_model.py',
                timeout_seconds=7200,
                dependencies=['feature_engineering']
            ),
            'evaluation': StageConfig(
                name='evaluation',
                type=StageType.EVALUATION,
                command='python scripts/evaluate_model.py',
                timeout_seconds=1800,
                dependencies=['training']
            ),
            'deployment': StageConfig(
                name='deployment',
                type=StageType.DEPLOYMENT,
                command='python scripts/deploy_model.py',
                timeout_seconds=600,
                dependencies=['evaluation']
            ),
            'monitoring': StageConfig(
                name='monitoring',
                type=StageType.MONITORING,
                command='python scripts/setup_monitoring.py',
                timeout_seconds=300,
                dependencies=['deployment']
            )
        }

    def load_config(self, config_path: str):
        """
        YAML 설정 파일 로드

        Args:
            config_path: 설정 파일 경로
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)

        # 스테이지 설정 로드
        for stage_config in config.get('stages', []):
            stage = StageConfig(
                name=stage_config['name'],
                type=StageType(stage_config['type']),
                command=stage_config['command'],
                timeout_seconds=stage_config.get('timeout_seconds', 3600),
                retry_count=stage_config.get('retry_count', 0),
                dependencies=stage_config.get('dependencies', []),
                parameters=stage_config.get('parameters', {}),
                enabled=stage_config.get('enabled', True)
            )
            self.stages[stage.name] = stage

        logger.info(f"설정 로드 완료: {len(self.stages)}개 스테이지")

    def save_config(self, config_path: str):
        """
        YAML 설정 파일 저장

        Args:
            config_path: 저장 경로
        """
        config = {
            'pipeline_name': self.pipeline_name,
            'stages': [
                {
                    'name': stage.name,
                    'type': stage.type.value,
                    'command': stage.command,
                    'timeout_seconds': stage.timeout_seconds,
                    'retry_count': stage.retry_count,
                    'dependencies': stage.dependencies,
                    'parameters': stage.parameters,
                    'enabled': stage.enabled
                }
                for stage in self.stages.values()
            ]
        }

        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False)

        logger.info(f"설정 저장 완료: {config_path}")

    def add_stage(self, stage: StageConfig):
        """
        스테이지 추가

        Args:
            stage: 스테이지 설정
        """
        self.stages[stage.name] = stage
        logger.info(f"스테이지 추가: {stage.name}")

    def remove_stage(self, stage_name: str):
        """
        스테이지 제거

        Args:
            stage_name: 스테이지 이름
        """
        if stage_name in self.stages:
            del self.stages[stage_name]
            logger.info(f"스테이지 제거: {stage_name}")

    def register_status_callback(self, callback: Callable):
        """
        상태 변경 콜백 등록

        Args:
            callback: 콜백 함수
        """
        self.status_callbacks.append(callback)

    def _notify_status_change(self, run: PipelineRun):
        """상태 변경 알림"""
        for callback in self.status_callbacks:
            try:
                callback(run)
            except Exception as e:
                logger.error(f"콜백 실행 오류: {str(e)}")

    def create_run(
        self,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        파이프라인 실행 생성

        Args:
            parameters: 실행 파라미터

        Returns:
            실행 ID
        """
        run_id = f"{self.pipeline_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        run = PipelineRun(
            run_id=run_id,
            pipeline_name=self.pipeline_name,
            status=PipelineStatus.PENDING,
            start_time=datetime.now().isoformat(),
            parameters=parameters or {}
        )

        self.runs[run_id] = run
        self.current_run = run

        logger.info(f"파이프라인 실행 생성: {run_id}")
        self._notify_status_change(run)

        return run_id

    def execute_stage(
        self,
        stage_name: str,
        run: PipelineRun
    ) -> StageResult:
        """
        스테이지 실행

        Args:
            stage_name: 스테이지 이름
            run: 파이프라인 실행

        Returns:
            스테이지 실행 결과
        """
        if stage_name not in self.stages:
            return StageResult(
                stage_name=stage_name,
                status=PipelineStatus.FAILED,
                start_time=datetime.now().isoformat(),
                error=f"스테이지 없음: {stage_name}"
            )

        stage = self.stages[stage_name]

        if not stage.enabled:
            logger.info(f"스테이지 비활성화: {stage_name}")
            return StageResult(
                stage_name=stage_name,
                status=PipelineStatus.SUCCESS,
                start_time=datetime.now().isoformat(),
                end_time=datetime.now().isoformat(),
                output='스테이지 비활성화로 건너뜀'
            )

        # 의존성 확인
        for dep in stage.dependencies:
            if dep in run.stages and run.stages[dep].status != PipelineStatus.SUCCESS:
                return StageResult(
                    stage_name=stage_name,
                    status=PipelineStatus.FAILED,
                    start_time=datetime.now().isoformat(),
                    error=f"의존 스테이지 실패: {dep}"
                )

        start_time = datetime.now()
        result = StageResult(
            stage_name=stage_name,
            status=PipelineStatus.RUNNING,
            start_time=start_time.isoformat()
        )

        run.stages[stage_name] = result
        self._notify_status_change(run)

        try:
            # 명령 실행
            logger.info(f"스테이지 실행 시작: {stage_name}")

            process = subprocess.Popen(
                stage.command,
                shell=True,
                cwd=self.working_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            stdout, stderr = process.communicate(timeout=stage.timeout_seconds)

            end_time = datetime.now()
            result.end_time = end_time.isoformat()
            result.duration_seconds = (end_time - start_time).total_seconds()

            if process.returncode == 0:
                result.status = PipelineStatus.SUCCESS
                result.output = stdout
                logger.info(f"스테이지 성공: {stage_name} ({result.duration_seconds:.1f}초)")

                # 아티팩트 수집
                self._collect_artifacts(stage_name, run)
            else:
                result.status = PipelineStatus.FAILED
                result.error = stderr or stdout
                logger.error(f"스테이지 실패: {stage_name} - {result.error}")

        except subprocess.TimeoutExpired:
            process.kill()
            result.status = PipelineStatus.FAILED
            result.error = f"타임아웃 ({stage.timeout_seconds}초 초과)"
            logger.error(f"스테이지 타임아웃: {stage_name}")

        except Exception as e:
            result.status = PipelineStatus.FAILED
            result.error = str(e)
            logger.error(f"스테이지 오류: {stage_name} - {str(e)}")

        self._notify_status_change(run)
        return result

    def _collect_artifacts(self, stage_name: str, run: PipelineRun):
        """아티팩트 수집"""
        stage_artifact_dir = self.artifact_dir / run.run_id / stage_name
        stage_artifact_dir.mkdir(parents=True, exist_ok=True)

        # 스테이지 출력 파일 저장
        result = run.stages[stage_name]
        if result.output:
            output_file = stage_artifact_dir / 'output.txt'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result.output)
            run.artifacts.append(str(output_file))

    def run_pipeline(
        self,
        parameters: Optional[Dict[str, Any]] = None,
        stop_on_failure: bool = True
    ) -> PipelineRun:
        """
        파이프라인 전체 실행

        Args:
            parameters: 실행 파라미터
            stop_on_failure: 실패 시 중지 여부

        Returns:
            파이프라인 실행 결과
        """
        run_id = self.create_run(parameters)
        run = self.runs[run_id]

        run.status = PipelineStatus.RUNNING
        self._notify_status_change(run)

        try:
            # 의존성 순서대로 스테이지 실행
            executed_stages = set()

            while len(executed_stages) < len(self.stages):
                progress_made = False

                for stage_name, stage in self.stages.items():
                    if stage_name in executed_stages:
                        continue

                    # 의존성 확인
                    dependencies_met = all(
                        dep in executed_stages and
                        run.stages[dep].status == PipelineStatus.SUCCESS
                        for dep in stage.dependencies
                    )

                    if dependencies_met:
                        result = self.execute_stage(stage_name, run)
                        executed_stages.add(stage_name)
                        progress_made = True

                        # 실패 시 중지
                        if stop_on_failure and result.status == PipelineStatus.FAILED:
                            logger.error(f"스테이지 실패로 파이프라인 중지: {stage_name}")
                            run.status = PipelineStatus.FAILED
                            break

                if not progress_made:
                    # 순환 의존성 또는 실행 불가능한 상태
                    logger.error("파이프라인 진행 불가 (순환 의존성 또는 실패)")
                    run.status = PipelineStatus.FAILED
                    break

            # 전체 성공 확인
            if all(
                run.stages[s].status == PipelineStatus.SUCCESS
                for s in run.stages
            ):
                run.status = PipelineStatus.SUCCESS
                logger.info(f"파이프라인 성공: {run_id}")

        except Exception as e:
            logger.error(f"파이프라인 실행 오류: {str(e)}")
            run.status = PipelineStatus.FAILED

        finally:
            run.end_time = datetime.now().isoformat()
            self._notify_status_change(run)

        return run

    def get_run(self, run_id: str) -> Optional[PipelineRun]:
        """
        파이프라인 실행 조회

        Args:
            run_id: 실행 ID

        Returns:
            파이프라인 실행
        """
        return self.runs.get(run_id)

    def list_runs(
        self,
        status: Optional[PipelineStatus] = None,
        limit: int = 100
    ) -> List[PipelineRun]:
        """
        파이프라인 실행 목록 조회

        Args:
            status: 필터링할 상태
            limit: 최대 개수

        Returns:
            파이프라인 실행 리스트
        """
        runs = list(self.runs.values())

        if status:
            runs = [r for r in runs if r.status == status]

        runs.sort(key=lambda x: x.start_time, reverse=True)
        return runs[:limit]

    def cancel_run(self, run_id: str) -> bool:
        """
        파이프라인 실행 취소

        Args:
            run_id: 실행 ID

        Returns:
            성공 여부
        """
        run = self.runs.get(run_id)
        if run and run.status == PipelineStatus.RUNNING:
            run.status = PipelineStatus.CANCELLED
            run.end_time = datetime.now().isoformat()
            self._notify_status_change(run)
            logger.info(f"파이프라인 취소: {run_id}")
            return True
        return False


class ScheduledPipeline:
    """
    스케줄된 파이프라인 실행

    주기적으로 파이프라인 실행 (일일, 주간 등)
    """

    def __init__(
        self,
        pipeline: CIPipeline,
        schedule: str  # cron 형식: '0 2 * * *' (매일 2시)
    ):
        """
        스케줄된 파이프라인 초기화

        Args:
            pipeline: CI/CD 파이프라인
            schedule: 스케줄 (cron 형식)
        """
        self.pipeline = pipeline
        self.schedule = schedule
        self.is_running = False

        logger.info(f"스케줄된 파이프라인 초기화: {schedule}")

    def start(self):
        """스케줄링 시작"""
        self.is_running = True
        logger.info("스케줄러 시작")

        # 실제 구현에서는 APScheduler 등 사용
        # 여기서는 예시만 제공

    def stop(self):
        """스케줄링 중지"""
        self.is_running = False
        logger.info("스케줄러 중지")

    def _execute_scheduled_run(self):
        """스케줄된 실행"""
        if self.is_running:
            logger.info("스케줄된 파이프라인 실행")
            self.pipeline.run_pipeline()


# YAML 설정 파일 예시
DEFAULT_PIPELINE_CONFIG = """
pipeline_name: ml_training_pipeline

stages:
  - name: data_validation
    type: data_validation
    command: python scripts/validate_data.py --input data/raw --output data/validated
    timeout_seconds: 600
    retry_count: 2
    enabled: true

  - name: feature_engineering
    type: feature_engineering
    command: python scripts/create_features.py --input data/validated --output data/features
    timeout_seconds: 1800
    dependencies:
      - data_validation
    parameters:
      feature_types:
        - temporal
        - lag
        - window
    enabled: true

  - name: training
    type: training
    command: python scripts/train_model.py --input data/features --output models
    timeout_seconds: 7200
    dependencies:
      - feature_engineering
    parameters:
      model_type: ensemble
      epochs: 50
      batch_size: 64
    enabled: true

  - name: evaluation
    type: evaluation
    command: python scripts/evaluate_model.py --model models/ensemble.pkl --test data/test
    timeout_seconds: 1800
    dependencies:
      - training
    parameters:
      metrics:
        - mape
        - mae
        - rmse
      threshold:
        mape: 5.0
    enabled: true

  - name: deployment
    type: deployment
    command: python scripts/deploy_model.py --model models/ensemble.pkl --stage staging
    timeout_seconds: 600
    dependencies:
      - evaluation
    enabled: true

  - name: monitoring
    type: monitoring
    command: python scripts/setup_monitoring.py --model models/ensemble.pkl
    timeout_seconds: 300
    dependencies:
      - deployment
    enabled: true
"""
