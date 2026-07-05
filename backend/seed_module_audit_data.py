# -*- coding: utf-8 -*-
"""
모듈별 데이터/프로세스 점검 MBO — 샘플 데이터 시딩 스크립트
2026_07_05__18.47_mbo-천상_모듈별데이터및프로세스점검.md 실행 산출물

대상 (13개 모듈군):
  master(+data_hub), ai, anomaly_detection, axos_erp, control_tower,
  events, governance, forecasting, ml_pipeline, kpi/kri fact,
  ontology, integrations, security

실행: DB_TYPE=sqlite python seed_module_audit_data.py
      (프로덕션에서는 docker exec ... python seed_module_audit_data.py)
"""
import os
import sys
import uuid
import random
from datetime import date, datetime, timedelta

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone


def log(msg):
    print(f"[SEED] {msg}")


# ============================================================
# 1. Master 데이터 (erp_sync.data_hub.master) — 다른 모듈 FK가 의존
# ============================================================
def seed_master():
    from erp_sync.data_hub.master.models import (
        MasterDepartment, MasterEmployee, MasterEquipment,
        MasterVendor, MasterProduct, MasterCustomer,
    )

    created = {"department": 0, "employee": 0, "equipment": 0, "vendor": 0, "product": 0, "customer": 0}

    dept_specs = [
        ("D100", "경영지원팀", "executive"),
        ("D200", "생산1팀", "production"),
        ("D300", "영업팀", "sales"),
        ("D400", "구매팀", "purchase"),
        ("D500", "품질팀", "quality"),
        ("D600", "재무팀", "finance"),
    ]
    depts = {}
    for code, name, dtype in dept_specs:
        obj, was_created = MasterDepartment.objects.get_or_create(
            department_code=code,
            defaults=dict(department_name=name, department_type=dtype, level=1, cost_center=code, plant="본사공장"),
        )
        depts[code] = obj
        created["department"] += int(was_created)

    emp_specs = [
        ("E1001", "김민준", "D100", "팀장"),
        ("E1002", "이서연", "D200", "생산기사"),
        ("E1003", "박도윤", "D300", "영업대리"),
        ("E1004", "최지우", "D400", "구매담당"),
        ("E1005", "정하은", "D500", "품질담당"),
        ("E1006", "강태양", "D600", "회계담당"),
    ]
    emps = {}
    for code, name, dept_code, position in emp_specs:
        obj, was_created = MasterEmployee.objects.get_or_create(
            employee_code=code,
            defaults=dict(
                employee_name=name, department=depts[dept_code], position=position,
                employment_type="정규직", status="active",
                hire_date=date(2022, 1, 1),
            ),
        )
        emps[code] = obj
        created["employee"] += int(was_created)

    equip_specs = [
        ("EQ001", "사출성형기 1호", "성형기", "P1"),
        ("EQ002", "CNC 가공기 1호", "가공기", "P1"),
        ("EQ003", "조립라인 A", "조립설비", "P2"),
    ]
    equips = {}
    for code, name, etype, plant in equip_specs:
        obj, was_created = MasterEquipment.objects.get_or_create(
            equipment_code=code,
            defaults=dict(
                equipment_name=name, equipment_type=etype, plant=plant, line="L1",
                status="operational", responsible_person=emps["E1002"],
            ),
        )
        equips[code] = obj
        created["equipment"] += int(was_created)

    vendor_specs = [
        ("V001", "대한정밀", "제조", "low"),
        ("V002", "한빛소재", "원자재", "medium"),
        ("V003", "성진전자", "부품", "low"),
    ]
    vendors = {}
    for code, name, vtype, risk in vendor_specs:
        obj, was_created = MasterVendor.objects.get_or_create(
            vendor_code=code,
            defaults=dict(vendor_name=name, vendor_type=vtype, risk_level=risk, currency="KRW", country="대한민국"),
        )
        vendors[code] = obj
        created["vendor"] += int(was_created)

    product_specs = [
        ("P001", "정밀부품 A", "finished_good", "V001"),
        ("P002", "반제품 B", "semi_finished", "V002"),
        ("P003", "원자재 C", "raw_material", "V002"),
    ]
    products = {}
    for code, name, ptype, vcode in product_specs:
        obj, was_created = MasterProduct.objects.get_or_create(
            product_code=code,
            defaults=dict(product_name=name, product_type=ptype, unit="EA", primary_vendor=vendors[vcode]),
        )
        products[code] = obj
        created["product"] += int(was_created)

    customer_specs = [
        ("C001", "삼성전자", "제조", "strategic"),
        ("C002", "LG전자", "제조", "key"),
        ("C003", "현대자동차", "제조", "key"),
    ]
    customers = {}
    for code, name, industry, tier in customer_specs:
        obj, was_created = MasterCustomer.objects.get_or_create(
            customer_code=code,
            defaults=dict(customer_name=name, industry=industry, tier=tier, currency="KRW"),
        )
        customers[code] = obj
        created["customer"] += int(was_created)

    log(f"master: {created}")
    return depts, emps, equips, vendors, products, customers


# ============================================================
# 2. ai — Agent 메모리/문서/추천/리플렉션
# ============================================================
def seed_ai():
    from ai.models import AgentRunLog, AgentMemory, Document, DocumentChunk, Recommendation, ReflectionLog, AnalysisPlan

    run = AgentRunLog.objects.order_by("-created_at").first()
    if run is None:
        run = AgentRunLog.objects.create(
            agent_name="KPIAgent", agent_version="1.0.0", agent_layer="monitoring", agent_domain="production",
            status="success", confidence=0.92, execution_time_ms=340, has_evidence=True,
        )

    AgentMemory.objects.get_or_create(
        memory_type="pattern", key="production.oee.weekday_dip",
        defaults=dict(domain="production", value={"note": "화요일 OEE가 평균 대비 5%p 낮음"}, frequency=6, importance=0.7),
    )
    AgentMemory.objects.get_or_create(
        memory_type="preference", key="report.format.executive",
        defaults=dict(domain="reports", value={"format": "요약 3줄 + 표"}, frequency=3, importance=0.5),
    )

    doc, _ = Document.objects.get_or_create(
        title="4M2E 온톨로지 가이드", defaults=dict(content_type="text/markdown", source_uri="internal://docs/4m2e.md", is_processed=True),
    )
    for i in range(3):
        DocumentChunk.objects.get_or_create(document=doc, chunk_index=i, defaults=dict(text=f"4M2E 관련 설명 청크 {i+1}"))

    Recommendation.objects.get_or_create(
        title="치수불량 재발 방지 대책",
        defaults=dict(
            description="설비 EQ001 진동 편차가 임계치를 초과해 치수불량 발생. 예방정비 주기 단축 권고.",
            domain="production", process_code="P2Prod", priority="high", impact_area="quality",
            estimated_impact={"defect_rate_reduction_pct": 12}, action_items=["예방정비 주기 2주->1주 단축"],
            generated_by_agent="RecommendationAgent", agent_run_id=run.request_id,
        ),
    )

    plan, _ = AnalysisPlan.objects.get_or_create(
        plan_type="root_cause", description="치수불량 원인 분석 계획",
        defaults=dict(request_id=run.request_id,
                      steps=[{"step": 1, "action": "설비 로그 조회"}, {"step": 2, "action": "작업자 배치 확인"}],
                      status="completed", completed_steps=2, total_steps=2, agent_run_id=run.request_id),
    )

    ReflectionLog.objects.get_or_create(
        agent_run=run, reflection_type="outcome",
        defaults=dict(what_went_well="근거 데이터 충분히 확보", what_went_wrong="응답시간 다소 지연",
                      lessons_learned="캐시 활용 필요", improvement_suggestions=["결과 캐싱 도입"]),
    )
    log("ai: memory/document/recommendation/plan/reflection seeded")


# ============================================================
# 3. anomaly_detection
# ============================================================
def seed_anomaly_detection():
    from anomaly_detection.models import AnomalyDetector, AnomalyAlert, AnomalyPattern

    det, _ = AnomalyDetector.objects.get_or_create(
        code="AD-OEE-001",
        defaults=dict(name="OEE 이상탐지기", target_metric="oee", detector_type="statistical",
                      threshold=2.5, status="active", last_trained=timezone.now()),
    )
    det2, _ = AnomalyDetector.objects.get_or_create(
        code="AD-DEFECT-001",
        defaults=dict(name="불량률 이상탐지기", target_metric="defect_rate", detector_type="isolation_forest",
                      threshold=3.0, status="active", last_trained=timezone.now()),
    )

    for i, (d, sev) in enumerate([(det, "high"), (det2, "medium")]):
        AnomalyAlert.objects.get_or_create(
            detector=d, metric_name=d.target_metric, entity_id=f"LINE-{i+1}",
            detected_at=timezone.now() - timedelta(days=i),
            defaults=dict(actual_value=62.3, expected_value=78.5, deviation_score=3.2, severity=sev, status="open",
                          description=f"{d.name} 기준 이상치 감지"),
        )

    AnomalyPattern.objects.get_or_create(
        name="화요일 오전 생산성 저하", pattern_type="cyclical",
        defaults=dict(metrics=["oee", "output"], time_window="tuesday 09:00-11:00", frequency=6,
                      occurrence_count=6, last_occurrence=timezone.now()),
    )
    log("anomaly_detection: detector/alert/pattern seeded")


# ============================================================
# 4. axos_erp
# ============================================================
def seed_axos_erp():
    from axos_erp.models import EventHub, RiskScore, ForecastRecord, AlertRecord, WorkflowTask, ProcessGraph, ProcessGraphEdge

    for i in range(3):
        EventHub.objects.get_or_create(
            topic="production", event_key=f"EVT-{i+1}",
            defaults=dict(event_type="output_shortfall", payload_json={"line": f"L{i+1}", "shortfall_pct": 8.5}, processed=(i == 0)),
        )

    RiskScore.objects.get_or_create(
        object_type="vendor", object_id="V002",
        defaults=dict(score=68, level="MEDIUM", explanation_json={"reason": "납기 지연 이력 2회"}, features_json={"late_deliveries": 2}),
    )

    ForecastRecord.objects.get_or_create(
        revenue=520000000, cost=410000000,
        defaults=dict(delay_penalty=3000000, rework_cost=1500000, forecast_margin=105500000,
                      risk_level="NORMAL", recommendation="현 생산 계획 유지 권고"),
    )

    AlertRecord.objects.get_or_create(
        alert_type="quality", title="치수불량 군집 발생", severity="HIGH",
        defaults=dict(source_object_type="production_line", source_object_id="L1", status="OPEN",
                      detail_json={"defect_count": 12}),
    )

    WorkflowTask.objects.get_or_create(
        task_type="approval", title="설비 예방정비 승인 요청", owner_role="production_manager",
        defaults=dict(source_object_type="equipment", source_object_id="EQ001", status="OPEN",
                      detail_json={"requested_by": "이서연"}),
    )

    nodes = [
        ("N-ORDER", "주문접수", "order"),
        ("N-PROD", "생산", "process"),
        ("N-QC", "품질검사", "quality"),
        ("N-SHIP", "출하", "product"),
    ]
    for node_id, label, ntype in nodes:
        ProcessGraph.objects.get_or_create(node_id=node_id, defaults=dict(node_label=label, node_type=ntype, status="active"))

    edges = [("N-ORDER", "N-PROD"), ("N-PROD", "N-QC"), ("N-QC", "N-SHIP")]
    for src, tgt in edges:
        ProcessGraphEdge.objects.get_or_create(source_node=src, target_node=tgt, defaults=dict(edge_type="flow"))

    log("axos_erp: event_hub/risk/forecast/alert/workflow/process_graph seeded")


# ============================================================
# 5. control_tower
# ============================================================
def seed_control_tower():
    from control_tower.models import ControlTowerConfig, DashboardLayout

    for code, name, ttype in [
        ("CT-EXEC", "경영진 컨트롤 타워", "executive"),
        ("CT-FUNC", "기능별 컨트롤 타워", "functional"),
    ]:
        cfg, _ = ControlTowerConfig.objects.get_or_create(
            code=code, defaults=dict(name=name, tower_type=ttype, metrics=["sales", "production", "quality"]),
        )
        DashboardLayout.objects.get_or_create(
            tower_config=cfg, name=f"{name} 기본 레이아웃",
            defaults=dict(layout={"cols": 4, "rows": 3}, widgets=[{"id": "kpi1", "type": "card"}], is_default=True),
        )
    log("control_tower: config/dashboard_layout seeded")


# ============================================================
# 6. data_hub (자체 테이블)
# ============================================================
def seed_data_hub():
    from data_hub.models import DataSource, DataSyncLog, DataMart, DataQualityRule, DataQualityCheck, DataLineage

    src, _ = DataSource.objects.get_or_create(
        name="SAP-ERP-MSSQL",
        defaults=dict(source_type="mssql", connection_params={"host": "sample-erp-host", "note": "샘플 값, 실접속정보 아님"},
                      sync_schedule="daily", status="active"),
    )

    sync_log, _ = DataSyncLog.objects.get_or_create(
        data_source=src, status="success",
        defaults=dict(completed_at=timezone.now(), records_processed=1200, records_succeeded=1195, records_failed=5, sync_type="incremental"),
    )

    mart, _ = DataMart.objects.get_or_create(
        name="fact_production_daily",
        defaults=dict(mart_type="fact", target_table="fact_production", source_query="SELECT * FROM production_raw",
                      refresh_schedule="daily", status="active", row_count=150),
    )

    rule, _ = DataQualityRule.objects.get_or_create(
        name="product_code_not_null", defaults=dict(rule_type="not_null", target_table="master_product", target_column="product_code", severity="critical"),
    )

    DataQualityCheck.objects.get_or_create(
        rule=rule, status="passed",
        defaults=dict(total_records=3, failed_records=0, failure_rate=0.0, sync_log=sync_log),
    )

    DataLineage.objects.get_or_create(
        source_entity_type="table", source_entity="erp_sda500_yh",
        target_entity_type="mart", target_entity="fact_production_daily",
        defaults=dict(transformation="EMAX SDA500 -> fact_production_daily 집계"),
    )
    log("data_hub: data_source/sync_log/mart/quality_rule/quality_check/lineage seeded")


# ============================================================
# 7. events
# ============================================================
def seed_events():
    from events.models import Event, EventCorrelation

    e1, _ = Event.objects.get_or_create(
        event_type="OUTPUT_SHORTFALL", scope_type="production_line", scope_id="L1",
        event_time=timezone.now() - timedelta(hours=2),
        defaults=dict(severity="HIGH", scope_name="1라인", domain="production", process_code="P2Prod",
                      title="1라인 생산 실적 미달", description="목표 대비 12% 미달", observed_value=88, threshold_value=100,
                      deviation_pct=12, detected_by_agent="ProcessMonitoringAgent"),
    )
    e2, _ = Event.objects.get_or_create(
        event_type="DEFECT_CLUSTER", scope_type="production_line", scope_id="L1",
        event_time=timezone.now() - timedelta(hours=1),
        defaults=dict(severity="MEDIUM", scope_name="1라인", domain="quality", process_code="Q2R",
                      title="1라인 불량 군집 발생", description="동일 유형 불량 12건 연속 발생", observed_value=12, threshold_value=5,
                      deviation_pct=140, detected_by_agent="EventDetectionAgent"),
    )
    EventCorrelation.objects.get_or_create(
        source_event=e1, target_event=e2,
        defaults=dict(correlation_type="causal", confidence=0.74, description="생산 실적 미달로 인한 무리한 속도 상승이 불량 군집 유발 추정"),
    )
    log("events: event/correlation seeded")


# ============================================================
# 8. governance
# ============================================================
def seed_governance():
    from governance.models import PolicyRule, PolicyViolation, ApprovalWorkflow, ApprovalRequest
    from ai.models import Recommendation

    rule, _ = PolicyRule.objects.get_or_create(
        code="POL-APPROVAL-001",
        defaults=dict(name_ko="고액 구매 승인 규칙", category="financial",
                      description="1000만원 이상 구매는 팀장 승인 필요",
                      conditions=[{"field": "amount", "operator": "gt", "value": 10000000}], severity="MEDIUM"),
    )
    PolicyViolation.objects.get_or_create(
        policy_rule=rule, violating_entity="구매팀", entity_type="process",
        defaults=dict(violation_details={"amount": 15000000, "approved": False}, severity="MEDIUM", status="open"),
    )

    wf, _ = ApprovalWorkflow.objects.get_or_create(
        code="WF-PURCHASE-001",
        defaults=dict(name="구매 승인 워크플로우", category="purchase",
                      approval_levels=[{"level": 1, "role": "팀장"}, {"level": 2, "role": "본부장"}]),
    )
    rec = Recommendation.objects.first()
    ApprovalRequest.objects.get_or_create(
        title="설비 예방정비 예산 승인", requested_by="이서연",
        defaults=dict(description="EQ001 예방정비 주기 단축에 따른 추가 예산 승인 요청", approval_level=1,
                      status="pending", business_impact="medium", recommendation=rec),
    )
    log("governance: policy_rule/violation/workflow/approval_request seeded")


# ============================================================
# 9. forecasting
# ============================================================
def seed_forecasting():
    from forecasting.models import ForecastModel, ForecastResult, ForecastAccuracyLog

    model, _ = ForecastModel.objects.get_or_create(
        code="FM-SALES-001",
        defaults=dict(name="월별 매출 예측 모델", target_metric="monthly_sales", forecast_type="prophet",
                      forecast_horizon=90, status="active", mae=1200000, mape=4.2, rmse=1800000, last_trained=timezone.now()),
    )
    today = date.today()
    values = [{"date": (today + timedelta(days=30 * i)).isoformat(), "value": 500000000 + i * 5000000,
               "lower_bound": 480000000 + i * 5000000, "upper_bound": 520000000 + i * 5000000} for i in range(3)]
    ForecastResult.objects.get_or_create(
        forecast_model=model, target_start=today, target_end=today + timedelta(days=90),
        defaults=dict(forecast_date=timezone.now(), forecast_values=values, confidence_level=0.95),
    )
    ForecastAccuracyLog.objects.get_or_create(
        forecast_model=model, evaluation_start=today - timedelta(days=30), evaluation_end=today,
        defaults=dict(mae=1150000, mape=3.9, rmse=1700000, sample_size=30),
    )
    log("forecasting: model/result/accuracy_log seeded")


# ============================================================
# 10. ml_pipeline
# ============================================================
def seed_ml_pipeline():
    from ml_pipeline.models import MLModel, TrainingJob, PredictionRequest, FeatureStore, Experiment

    model, _ = MLModel.objects.get_or_create(
        code="MLM-DEFECT-001",
        defaults=dict(name="불량 예측 모델", model_type="classification", algorithm="RandomForest",
                      target_feature="is_defect", features=["temperature", "pressure", "cycle_time"],
                      metrics={"accuracy": 0.91, "f1": 0.88}, status="deployed", is_deployed=True,
                      trained_at=timezone.now(), training_samples=5000),
    )
    TrainingJob.objects.get_or_create(
        model=model, job_name="불량예측모델 v1 학습",
        defaults=dict(job_type="train", status="completed", progress=100, current_step="완료",
                      started_at=timezone.now() - timedelta(hours=1), completed_at=timezone.now(), duration_ms=3600000),
    )
    PredictionRequest.objects.get_or_create(
        model=model, request_id=str(uuid.uuid4()),
        defaults=dict(input_data={"temperature": 78.2, "pressure": 4.1, "cycle_time": 32},
                      prediction_result={"is_defect": False, "probability": 0.08}, inference_time_ms=42),
    )
    FeatureStore.objects.get_or_create(
        name="equipment_temperature",
        defaults=dict(display_name="설비 온도", feature_type="numerical", source_table="daily_productions",
                      source_column="temperature", data_type="float", statistics={"mean": 76.4, "std": 3.2}),
    )
    Experiment.objects.get_or_create(
        name="불량예측 하이퍼파라미터 튜닝",
        defaults=dict(parameters={"n_estimators": 200}, metrics={"accuracy": 0.91}, model=model, status="completed",
                      completed_at=timezone.now()),
    )
    log("ml_pipeline: model/training_job/prediction/feature_store/experiment seeded")


# ============================================================
# 11. kpi/kri fact (erp_sync.data_hub.analytics)
# ============================================================
def seed_kpi_kri_facts(depts, products, vendors, customers):
    from erp_sync.data_hub.analytics.models import KPIDefinition, KRIDefinition, KPIFact, KRIFact

    today = date.today()
    kpi_def = KPIDefinition.objects.filter(is_active=True).first()
    if kpi_def:
        for i in range(5):
            d = today - timedelta(days=i)
            KPIFact.objects.get_or_create(
                kpi=kpi_def, date=d, plant="본사공장", line="L1", product=list(products.values())[0],
                defaults=dict(year=d.year, quarter=(d.month - 1) // 3 + 1, month=d.month,
                              actual_value=92.5 + i, target_value=95.0, achievement_rate=97.3, status="good"),
            )
    kri_def = KRIDefinition.objects.filter(is_active=True).first()
    if kri_def:
        for i in range(5):
            d = today - timedelta(days=i)
            KRIFact.objects.get_or_create(
                kri=kri_def, date=d, plant="본사공장", line="L1", vendor=list(vendors.values())[0],
                defaults=dict(year=d.year, quarter=(d.month - 1) // 3 + 1, month=d.month,
                              actual_value=32.0 + i, risk_level="medium", risk_score=45.0),
            )
    log(f"kpi/kri fact: kpi_def={'있음' if kpi_def else '없음'}, kri_def={'있음' if kri_def else '없음'}")


# ============================================================
# 12. ontology
# ============================================================
def seed_ontology():
    from ontology.models import (
        OntologyCategory, OntologyElement, ERPTableMapping, OntologyRelation,
        DataFlowMetrics, OntologyAnalysisLog, OntologyNode, OntologyEdge,
    )

    cat, _ = OntologyCategory.objects.get_or_create(
        code="6M", defaults=dict(name="6M 변경관리", name_en="6M Change Management", level=1),
    )
    elem_specs = [("MAN", "작업자", "Man"), ("MACHINE", "설비", "Machine"), ("MATERIAL", "자재", "Material")]
    elems = {}
    for code, name_ko, name_en in elem_specs:
        elem, _ = OntologyElement.objects.get_or_create(category=cat, code=code, defaults=dict(name_ko=name_ko, name_en=name_en))
        elems[code] = elem

    ERPTableMapping.objects.get_or_create(
        element=elems["MACHINE"], table_name="erp_sdy100_yh",
        defaults=dict(table_description="연간제품생산계획", module="생산", key_columns=["equipment_code"], data_flow_direction="IN"),
    )

    OntologyRelation.objects.get_or_create(
        source_element=elems["MAN"], target_element=elems["MACHINE"], relation_type="FLOW",
        defaults=dict(description="작업자가 설비를 조작", weight=1.0),
    )

    DataFlowMetrics.objects.get_or_create(
        category=cat, metric_date=date.today(), metric_name="변경관리 처리건수",
        defaults=dict(metric_value=24, metric_unit="건", status="STABLE"),
    )

    OntologyAnalysisLog.objects.get_or_create(
        analysis_type="6M_change_impact", start_category="6M", end_category="COST", analysis_date=date.today(),
        defaults=dict(record_count=12, execution_time_ms=850, status="COMPLETED", completed_at=timezone.now()),
    )

    node1, _ = OntologyNode.objects.get_or_create(
        node_type="entity", name="1라인", defaults=dict(code="L1", category="production"),
    )
    node2, _ = OntologyNode.objects.get_or_create(
        node_type="event", name="치수불량 군집", defaults=dict(code="EVT-DEFECT-CLUSTER", category="quality"),
    )
    OntologyEdge.objects.get_or_create(
        source_node=node1, target_node=node2, relationship_type="causal", defaults=dict(weight=0.8, confidence=0.74),
    )
    log("ontology: category/element/erp_mapping/relation/data_flow_metrics/analysis_log/node/edge seeded")


# ============================================================
# 13. integrations
# ============================================================
def seed_integrations():
    from integrations.models import IntegrationConfig, IntegrationLog, WebhookConfig, WebhookDelivery, DataExchange

    cfg, _ = IntegrationConfig.objects.get_or_create(
        code="INT-SAP-001",
        defaults=dict(name="SAP ERP 연동", integration_type="erp", auth_type="none", sync_interval=60),
    )
    IntegrationLog.objects.get_or_create(
        integration=cfg, action_type="sync", status="success",
        defaults=dict(started_at=timezone.now() - timedelta(minutes=5), completed_at=timezone.now(),
                      records_processed=500, records_succeeded=498, records_failed=2, duration_seconds=280.0),
    )

    wh, _ = WebhookConfig.objects.get_or_create(
        code="WH-EVENT-001",
        defaults=dict(name="이벤트 발생 알림 웹훅", event_type="OUTPUT_SHORTFALL", target_url="https://example.com/webhook/sample"),
    )
    WebhookDelivery.objects.get_or_create(
        webhook=wh, event_id="EVT-1",
        defaults=dict(payload={"event": "OUTPUT_SHORTFALL"}, response_status=200, status="delivered", delivered_at=timezone.now()),
    )

    DataExchange.objects.get_or_create(
        exchange_type="export", data_type="production_report", file_format="excel",
        defaults=dict(record_count=150, status="completed", requested_by="이서연",
                      started_at=timezone.now() - timedelta(minutes=2), completed_at=timezone.now()),
    )
    log("integrations: config/log/webhook_config/webhook_delivery/data_exchange seeded")


# ============================================================
# 14b. 통합 레이어 (erp_sync.data_hub.integration) — O2C/P2P 프로세스가
# 마스터 데이터를 통해 실제로 이어지도록 연결
# ============================================================
def seed_integration_layer(depts, emps, equips, vendors, products, customers):
    from erp_sync.data_hub.integration.models import (
        IntegratedMaterial, IntegratedProductionOrder,
        IntegratedQualityRecord, IntegratedSalesOrder,
    )

    product = products["P001"]  # 정밀부품 A
    vendor = vendors["V001"]  # 대한정밀
    customer = customers["C001"]  # 삼성전자
    equipment = equips["EQ001"]  # 사출성형기 1호
    sales_person = emps["E1003"]  # 박도윤 (영업대리)
    production_supervisor = emps["E1002"]  # 이서연 (생산기사)
    inspector = emps["E1005"]  # 정하은 (품질담당)

    today = date.today()

    IntegratedMaterial.objects.get_or_create(
        product=product, plant="본사공장", warehouse="제1창고",
        defaults=dict(
            quantity_on_hand=500, quantity_reserved=120, quantity_available=380, safety_stock=100,
            moving_average_cost=8500, standard_cost=8200, total_value=4250000,
            primary_vendor=vendor, lead_time_days=14,
            last_receipt_date=today - timedelta(days=5), last_issue_date=today - timedelta(days=1),
            turnover_rate=4.2, days_of_supply=45, is_abcs="A",
        ),
    )

    sales_order, _ = IntegratedSalesOrder.objects.get_or_create(
        order_number="SO-2026-0001",
        defaults=dict(
            customer=customer, customer_po="PO-SEC-2026-001", product=product,
            quantity_ordered=1000, quantity_shipped=600, quantity_invoiced=600,
            unit_price=12000, total_amount=12000000,
            order_date=today - timedelta(days=10), request_date=today + timedelta(days=5),
            promise_date=today + timedelta(days=7), status="in_production", progress=60,
            sales_person=sales_person,
        ),
    )

    production_order, _ = IntegratedProductionOrder.objects.get_or_create(
        order_number="PROD-2026-0001",
        defaults=dict(
            order_type="standard", product=product,
            quantity_ordered=1000, quantity_produced=650, quantity_scrapped=8,
            plant="본사공장", line="L1", equipment=equipment,
            start_date_scheduled=today - timedelta(days=8), start_date_actual=today - timedelta(days=8),
            end_date_scheduled=today + timedelta(days=2), status="in_progress", progress=65,
            standard_cost=8200000, actual_cost=8450000, production_supervisor=production_supervisor,
        ),
    )

    IntegratedQualityRecord.objects.get_or_create(
        record_number="QR-2026-0001",
        defaults=dict(
            record_type="final", product=product, lot_number="LOT-20260701-01", batch_number="B001",
            inspection_quantity=650, ok_quantity=642, ng_quantity=8, rework_quantity=0,
            result="conditional", defect_types=["치수불량"], defect_details="사출 온도 편차로 인한 치수불량 8건",
            inspection_date=today - timedelta(days=1), inspector=inspector,
            customer=customer, capa_required=True, capa_number="CAPA-2026-0001",
            capa_due_date=today + timedelta(days=14), capa_status="in_progress",
        ),
    )

    log(f"integration_layer: SO={sales_order.order_number} -> PROD={production_order.order_number} "
        f"(같은 product={product.product_code}/customer={customer.customer_code}로 연결)")


# ============================================================
# 14. security
# ============================================================
def seed_security():
    from security.models import SecurityEvent, LoginAttempt

    SecurityEvent.objects.get_or_create(
        event_type="login_failure", description="비밀번호 5회 연속 실패",
        defaults=dict(severity="medium", ip_address="10.0.0.15"),
    )
    SecurityEvent.objects.get_or_create(
        event_type="rate_limit_exceeded", description="API 호출 속도 제한 초과",
        defaults=dict(severity="low", ip_address="10.0.0.22"),
    )

    for i in range(3):
        LoginAttempt.objects.get_or_create(
            username="admin", ip_address=f"10.0.0.{10+i}", was_successful=(i == 2),
            defaults=dict(failure_reason="" if i == 2 else "비밀번호 불일치"),
        )
    log("security: security_event/login_attempt seeded")


def main():
    log("=== 모듈별 데이터/프로세스 점검 MBO 시딩 시작 ===")
    depts, emps, equips, vendors, products, customers = seed_master()
    seed_ai()
    seed_anomaly_detection()
    seed_axos_erp()
    seed_control_tower()
    seed_data_hub()
    seed_events()
    seed_governance()
    seed_forecasting()
    seed_ml_pipeline()
    seed_kpi_kri_facts(depts, products, vendors, customers)
    seed_ontology()
    seed_integrations()
    seed_integration_layer(depts, emps, equips, vendors, products, customers)
    seed_security()
    log("=== 시딩 완료 ===")


if __name__ == "__main__":
    main()
