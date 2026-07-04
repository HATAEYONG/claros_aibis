# ERP 매핑 문서 - 인사/물류/설비관리

## 문서 개요

本文书는 인사관리(HR), 물류관리(Logistics), 설비관리(Equipment) 모듈의 ERP 테이블 매핑 정보를 정의합니다.

---

## 1. 인사관리 (HR Management)

### 1.1 개요
인사관리 모듈은 직원 정보, 부서 조직, 급여, 근태, 인력 통계를 관리합니다.

### 1.2 ERP 테이블 매핑

| API 경로 | 기능 | 소스 테이블 | 비고 |
|----------|------|-------------|------|
| `/hr/employee-list/` | 직원 목록 | PPB100_YH | 생산실적 테이블의 사원번호 활용 |
| `/hr/department-organization/` | 부서 조직 | PPB100_YH | 작업장 코드(wc_cd)를 부서로 활용 |
| `/hr/salary-information/` | 급여 정보 | CAM200_YH | 회계 데이터 활용 |
| `/hr/attendance-management/` | 근태 관리 | PPB100_YH | 생산실적의 근무시간 활용 |
| `/hr/hr-statistics/` | 인력 통계 | PPB100_YH, CAM300_YH | 생산/회계 데이터 집계 |
| `/hr/leave-management/` | 휴가 관리 | CAM900_YH | 회계 데이터 활용 |

### 1.3 소스 테이블 상세

#### PPB100_YH: 생산실적
- **설명**: 생산실적 데이터로 사원번호, 작업장 정보 포함
- **주요 필드**:
  - `emp_no`: 사원번호 (직원 식별)
  - `wc_cd`: 작업장 코드 (부서 매핑)
  - `work_qty`: 생산수량
  - `work_hours`: 근무시간

#### CAM200_YH: 회계마감표
- **설명**: 급여 지급 정보
- **주요 필드**:
  - `emp_no`: 사원번호
  - `salary_month`: 급여월
  - `base_salary`: 기본급
  - `overtime_pay`: 시간외수당

### 1.4 매핑 관계도

```
PPB100_YH (ERP)
├── emp_no → Employee.employee_no
├── wc_cd → Department.department_code
└── work_hours → Attendance.work_hours

CAM200_YH (ERP)
├── emp_no → Salary.employee_no
├── base_salary → Salary.base_salary
└── overtime_pay → Salary.overtime_pay
```

---

## 2. 물류관리 (Logistics Management)

### 2.1 개요
물류관리 모듈은 입고, 출고, 배송, 재고 이동, 운송 관리 기능을 제공합니다.

### 2.2 ERP 테이블 매핑

| API 경로 | 기능 | 소스 테이블 | 비고 |
|----------|------|-------------|------|
| `/logistics/inbound-management/` | 입고 관리 | LEB950_YH | 실사재고등록(매출이월) |
| `/logistics/outbound-management/` | 출고 관리 | LEB100_YH | 출고정보 |
| `/logistics/warehouse-management/` | 창고 관리 | LEB950_YH, LEB980_YH | 입고+실사 데이터 |
| `/logistics/delivery-management/` | 배송 관리 | LEB100_YH + LEB160_YH | 출고+선적 데이터 |
| `/logistics/inventory-movement/` | 재고 이동 | LEB100_YH + LEB120_YH | 출고+이동 데이터 |
| `/logistics/transport-management/` | 운송 관리 | LEB100_YH | 출고데이터의 운송정보 |

### 2.3 소스 테이블 상세

#### LEB950_YH: 실사재고등록(매출이월)
- **설명**: 입고 정보 관리
- **주요 필드**:
  - `fac_cd`: 공장코드
  - `wh_cd`: 창고코드
  - `itm_id`: 품목ID
  - `in_qty`: 입고수량
  - `in_dt`: 입고일자
  - `cust_cd`: 공급업체코드

#### LEB100_YH: 출고정보
- **설명**: 출고 기본 정보
- **주요 필드**:
  - `fac_cd`: 공장코드
  - `wh_cd`: 창고코드
  - `out_no`: 출고번호
  - `out_dt`: 출고일자
  - `itm_id`: 품목ID
  - `out_qty`: 출고수량
  - `cust_cd`: 고객코드
  - `ship_to`: 배송처

#### LEB120_YH: 출고-이동
- **설명**: 재고 이동 정보
- **주요 필드**:
  - `mov_no`: 이동번호
  - `mov_dt`: 이동일자
  - `from_wh`: 출고창고
  - `to_wh`: 입고창고
  - `mov_qty`: 이동수량

#### LEB160_YH: 출고-선적
- **설명**: 배송/선적 정보
- **주요 필드**:
  - `ship_no`: 선적번호
  - `ship_dt`: 선적일자
  - `carrier`: 운송업체
  - `tracking_no`: 운송장번호
  - `ship_to`: 배송처
  - `ship_addr`: 배송주소

#### LEB980_YH: 재고실사(현장)
- **설명**: 재고 실사 데이터
- **주요 필드**:
  - `check_dt`: 실사일자
  - `wh_cd`: 창고코드
  - `itm_id`: 품목ID
  - `check_qty`: 실사수량
  - `diff_qty`: 차이수량

### 2.4 매핑 관계도

```
입고 프로세스:
LEB950_YH → InboundManagement
├── in_qty → quantity
├── in_dt → receipt_date
└── cust_cd → supplier_code

출고 프로세스:
LEB100_YH → OutboundManagement
├── out_no → shipment_number
├── out_qty → quantity
└── out_dt → shipment_date

배송 프로세스:
LEB100_YH + LEB160_YH → DeliveryManagement
├── out_no → delivery_number
├── ship_to → delivery_address
└── carrier → shipping_company

재고이동 프로세스:
LEB100_YH + LEB120_YH → InventoryMovement
├── mov_no → movement_number
├── from_wh → source_warehouse
└── to_wh → destination_warehouse
```

---

## 3. 설비관리 (Equipment Management)

### 3.1 개요
설비관리 모듈은 설비 목록, 상태, 예방/고장 보전, 수리 이력, 성과 분석을 관리합니다.

### 3.2 ERP 테이블 매핑

| API 경로 | 기능 | 소스 테이블 | 비고 |
|----------|------|-------------|------|
| `/equipment/equipment-list/` | 설비 목록 | FMA100_YH | 설비마스타 |
| `/equipment/equipment-status/` | 설비 상태 | FMA100_YH | 설비마스타 |
| `/equipment/preventive-maintenance/` | 예방 보전 | FMA100_YH + FMA120_YH | 설비+점검항목 |
| `/equipment/breakdown-maintenance/` | 고장 보전 | FMA100_YH + FMA140_YH | 설비+수리이력 |
| `/equipment/equipment-repair-history/` | 수리 이력 | FMA100_YH + FMA140_YH | 설비+수리이력 |
| `/equipment/equipment-performance/` | 설비 성과 | FMA100_YH + PPC140_YH | 설비+가동실적 |

### 3.3 소스 테이블 상세

#### FMA100_YH: 설비마스타
- **설명**: 설비 기본 정보
- **주요 필드**:
  - `fac_cd`: 공장코드
  - `eqp_cd`: 설비코드 (PK)
  - `eqp_nm`: 설비명
  - `eqp_type`: 설비유형
  - `wc_cd`: 작업장코드
  - `install_dt`: 설치일자
  - `maker`: 제조사
  - `model`: 모델명
  - `spec`: 규격
  - `status`: 상태 (정상/고장/점검)

#### FMA120_YH: 점검항목
- **설명**: 예방 점검 항목 정의
- **주요 필드**:
  - `eqp_cd`: 설비코드
  - `check_type`: 점검유형 (일일/주간/월간)
  - `check_item`: 점검항목
  - `check_method`: 점검방법
  - `check_cycle`: 점검주기
  - `next_check_dt`: 다음 점검일

#### FMA140_YH: 설비수리이력
- **설명**: 설비 수리 이력 정보
- **주요 필드**:
  - `eqp_cd`: 설비코드
  - `breakdown_dt`: 고장일자
  - `breakdown_type`: 고장유형
  - `symptom`: 증상
  - `cause`: 원인
  - `repair_content`: 수리내용
  - `repair_cost`: 수리비용
  - `repair_hours`: 수리시간
  - `repairer`: 수리자
  - `complete_dt`: 완료일자

#### PPC140_YH: 설비가동실적
- **설명**: 설비 가동 실적 데이터
- **주요 필드**:
  - `eqp_cd`: 설비코드
  - `work_dt`: 작업일자
  - `run_hours`: 가동시간
  - `stop_hours`: 정지시간
  - `production_qty`: 생산수량
  - `defect_qty`: 불량수량
  - `availability`: 가용률
  - `performance_rate`: 성능률
  - `quality_rate`: 품질지수

### 3.4 매핑 관계도

```
설비 기본 정보:
FMA100_YH → Equipment
├── eqp_cd → equipment_code
├── eqp_nm → equipment_name
├── eqp_type → equipment_type
└── status → operational_status

예방 보전:
FMA100_YH + FMA120_YH → PreventiveMaintenance
├── eqp_cd → equipment_code
├── check_type → maintenance_type
└── next_check_dt → scheduled_date

고장 보전:
FMA100_YH + FMA140_YH → BreakdownMaintenance
├── breakdown_dt → failure_date
├── symptom → failure_description
├── repair_cost → repair_cost
└── complete_dt → completion_date

설비 성과:
FMA100_YH + PPC140_YH → EquipmentPerformance
├── run_hours → operating_hours
├── availability → availability_rate
├── performance_rate → performance_rate
└── quality_rate → quality_rate
```

---

## 4. 매핑 구현 가이드

### 4.1 데이터 동기화 우선순위

| 우선순위 | 모듈 | 테이블 | 동기화 주기 |
|----------|------|--------|-------------|
| 1 (실시간) | 설비관리 | FMA100_YH (상태) | 매시간 |
| 2 (시간별) | 물류관리 | LEB100_YH (출고) | 1시간 |
| 2 (시간별) | 설비관리 | PPC140_YH (가동) | 1시간 |
| 3 (일별) | 인사관리 | PPB100_YH (실적) | 일일 |
| 3 (일별) | 물류관리 | LEB950_YH (입고) | 일일 |
| 4 (주별) | 인사관리 | CAM200_YH (급여) | 월간 |

### 4.2 키 필드 매핑

#### 인사관리 키 필드
```python
employee_key = {
    'source_field': 'emp_no',
    'target_field': 'employee_no',
    'type': 'string',
    'required': True
}

department_key = {
    'source_field': 'wc_cd',
    'target_field': 'department_code',
    'type': 'string',
    'required': True
}
```

#### 물류관리 키 필드
```python
inbound_key = {
    'source_field': 'in_no',
    'target_field': 'receipt_number',
    'type': 'string',
    'required': True
}

outbound_key = {
    'source_field': 'out_no',
    'target_field': 'shipment_number',
    'type': 'string',
    'required': True
}

item_key = {
    'source_field': 'itm_id',
    'target_field': 'item_code',
    'type': 'integer',
    'required': True
}
```

#### 설비관리 키 필드
```python
equipment_key = {
    'source_field': 'eqp_cd',
    'target_field': 'equipment_code',
    'type': 'string',
    'required': True
}

maintenance_key = {
    'source_field': 'breakdown_dt',
    'target_field': 'failure_date',
    'type': 'date',
    'required': True
}
```

### 4.3 데이터 변환 규칙

#### 인사관리 변환 규칙
```python
TRANSFORM_RULES = {
    'hire_date': 'date_format:YYYY-MM-DD',
    'service_years': 'calculate:CURRENT_YEAR - hire_year',
    'employment_status': 'lookup:{"A": "active", "R": "resigned", "L": "leave"}',
    'department_name': 'concat:"{wc_cd} 부서"'
}
```

#### 물류관리 변환 규칙
```python
TRANSFORM_RULES = {
    'receipt_date': 'date_format:YYYY-MM-DD',
    'shipment_date': 'date_format:YYYY-MM-DD',
    'quantity': 'decimal_cast:2',
    'warehouse_name': 'lookup:{"WH01": "원자재창고", "WH02": "부품창고"}'
}
```

#### 설비관리 변환 규칙
```python
TRANSFORM_RULES = {
    'install_date': 'date_format:YYYY-MM-DD',
    'operational_status': 'lookup:{"1": "normal", "2": "breakdown", "3": "inspection"}',
    'availability_rate': 'calculate:(run_hours / (run_hours + stop_hours)) * 100',
    'oee': 'calculate:availability * performance * quality / 10000'
}
```

---

## 5. 검증 및 테스트

### 5.1 데이터 검증 항목

#### 인사관리 검증
- [ ] 사원번호 중복 체크
- [ ] 부서 코드 참조 무결성
- [ ] 급여 금액 데이터 형식
- [ ] 근태 시간 합계 검증

#### 물류관리 검증
- [ ] 입고/출고 수량 합계 검증
- [ ] 재고 실사 차이 분석
- [ ] 배송지 주소 형식
- [ ] 운송장 번호 유니크 체크

#### 설비관리 검증
- [ ] 설비 코드 유니크 체크
- [ ] 가동률 계산 범위 검증 (0-100%)
- [ ] 수리 비용 음수 체크
- [ ] OEE 지표 계산 검증

### 5.2 연결 테스트 케이스

```python
# 인사관리 연결 테스트
def test_hr_connection():
    """PPB100_YH 테이블 연결 테스트"""
    result = fetch_from_erp(
        erp_source,
        'PPB100_YH',
        where_clause="emp_no IS NOT NULL",
        limit=10
    )
    assert len(result) > 0
    assert 'emp_no' in result[0]

# 물류관리 연결 테스트
def test_logistics_connection():
    """LEB100_YH 테이블 연결 테스트"""
    result = fetch_from_erp(
        erp_source,
        'LEB100_YH',
        where_clause="out_dt >= '2026-01-01'",
        limit=10
    )
    assert len(result) > 0
    assert 'out_no' in result[0]

# 설비관리 연결 테스트
def test_equipment_connection():
    """FMA100_YH 테이블 연결 테스트"""
    result = fetch_from_erp(
        erp_source,
        'FMA100_YH',
        where_clause="status = '1'",
        limit=10
    )
    assert len(result) > 0
    assert 'eqp_cd' in result[0]
```

---

## 6. 문서 변경 이력

| 버전 | 일자 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-03-04 | Claude | 초판 작성 |

---

## 7. 참고 문서

- SAP_table_yuhan.csv - ERP 테이블 정의서
- ERP_MAPPING_SYSTEM.md - 매핑 시스템 설계 문서
- DATABASE_SCHEMA.md - 데이터베이스 스키마 정의서
