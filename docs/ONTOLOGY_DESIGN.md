# MIS-AI Dashboard 온톨로지 설계서

## 6M → 4M2E → 원가 → 재무 → ESG 통합 온톨로지

---

## 1. 개요

### 1.1 온톨로지 목적
제조업 전반의 데이터 흐름을 6M(Man, Machine, Material, Method, Measurement, Mother Nature) 기반으로 시작하여 4M2E(Man, Machine, Material, Method, Environment, Energy)로 재구성하고, 이를 원가관리 → 재무관리 → ESG 경영으로 연계하는 통합 지식 체계를 구축합니다.

### 1.2 데이터 흐름 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            6M 변경관리 (Source)                              │
│  ┌─────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  ┌────────┐ │
│  │ Man │  │ Machine │  │ Material │  │ Method │  │Measurement│  │ Nature │ │
│  └──┬──┘  └────┬────┘  └────┬─────┘  └───┬────┘  └─────┬─────┘  └───┬────┘ │
└─────┼──────────┼────────────┼────────────┼─────────────┼────────────┼──────┘
      │          │            │            │             │            │
      ▼          ▼            ▼            ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           4M2E 제조관리 (Transform)                          │
│  ┌─────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  ┌────────┐ │
│  │ Man │  │ Machine │  │ Material │  │ Method │  │Environment│  │ Energy │ │
│  │인력 │  │  설비   │  │   자재   │  │  공법  │  │   환경    │  │ 에너지 │ │
│  └──┬──┘  └────┬────┘  └────┬─────┘  └───┬────┘  └─────┬─────┘  └───┬────┘ │
└─────┼──────────┼────────────┼────────────┼─────────────┼────────────┼──────┘
      │          │            │            │             │            │
      └──────────┴────────────┴──────┬─────┴─────────────┴────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             원가관리 (Cost)                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │  재료비    │  │   노무비   │  │  제조경비  │  │  외주가공비 / 배부비용 │ │
│  │ (Material) │  │   (Labor)  │  │ (Overhead) │  │   (Outsourcing/Alloc)  │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───────────┬────────────┘ │
└────────┼───────────────┼───────────────┼─────────────────────┼──────────────┘
         │               │               │                     │
         └───────────────┴───────┬───────┴─────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             재무관리 (Finance)                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │  재무제표     │  │  손익계산서   │  │   현금흐름표  │  │   관리회계    │ │
│  │ (B/S, P/L)   │  │   (Profit)    │  │     (C/F)     │  │  (Mgmt Acct)  │ │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘ │
└──────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
           │                  │                  │                  │
           └──────────────────┴────────┬─────────┴──────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ESG 경영 (Sustainability)                        │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐│
│  │   Environment     │  │      Social       │  │       Governance          ││
│  │ (환경: 탄소/폐기물)│  │  (사회: 안전/복지)│  │    (지배구조: 윤리/규정)  ││
│  └───────────────────┘  └───────────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 온톨로지 계층 구조

### 2.1 Level 1: 6M 변경관리 (Source Layer)

#### 2.1.1 ERP 테이블 맵핑

| 6M 요소 | ERP 테이블 | 테이블 설명 | 주요 속성 |
|---------|-----------|------------|----------|
| **Man (인력)** | `QMM200_YH` | 6M변경신청관리-MASTER | req_no, req_dept, req_emp, chg_cd |
| **Man (인력)** | `HRA100` | 사원기본정보 | emp_no, emp_nm, dept_cd, cc_cd |
| **Man (인력)** | `HRA200` | 부서 | dept_cd, dept_nm, cc_cd |
| **Machine (설비)** | `FMA100` | 설비마스타 | fa_no, fa_nm, fac_cd, wc_cd |
| **Machine (설비)** | `FMA130` | 설비변경이력 | fa_no, chg_dt, rmks |
| **Material (자재)** | `DMA100` | 품목마스터 | itm_id, itm_cd, itm_nm |
| **Material (자재)** | `DMA160` | 원자재이력 | rmks (변경사유) |
| **Method (공법)** | `DME100` | ECO | chg_bc, chg_rmks |
| **Method (공법)** | `DME400` | 품목변경이력 | eco_no, eco_dt |
| **Measurement (측정)** | `QMM100` | 수입검사정보 | iqc_no, dlv_qty, ok_qty |
| **Measurement (측정)** | `QMM130` | 시료검사상세 | msr_std, msr_max, msr_min |
| **Mother Nature** | `QMM200_YH` | 6M변경신청관리 | chg_res (환경변경사유) |

#### 2.1.2 6M 변경관리 문서

| 문서 테이블 | 테이블 설명 | 역할 |
|------------|------------|------|
| `QMM210_YH` | 6M변경신청관리-사진첨부 | 변경 증빙 이미지 |
| `QMM220_YH` | 6M변경신청관리-문서File | 변경 관련 문서 |

---

### 2.2 Level 2: 4M2E 제조관리 (Transform Layer)

#### 2.2.1 4M2E 요소별 ERP 테이블 맵핑

##### Man (인력관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| 인력기본 | `HRA100` | 사원기본정보 | emp_no, cc_cd (원가부문) |
| 부서관리 | `HRA200` | 부서 | dept_cd, cc_cd (원가부문코드) |
| 가족정보 | `HRK100` | 사원가족 | emp_no, base_yn, pay_yn |
| 변경이력 | `HRA250` | 부서변경이력 | chg_dt, fr_dept, to_dept |
| 노무비 | `CAG100` | 노무비집계 | cc_cd (원가부문코드) |
| 사원노무비 | `CAE100` | 사원별노무비 | pay_amt (배부대상액) |

##### Machine (설비관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| 설비마스터 | `FMA100` | 설비마스타 | fa_no, div_yn (전력비배부대상) |
| 설비변경 | `FMA130` | 설비변경이력 | chg_dt, fac_cd, wc_cd |
| 설비품목 | `FMA160` | 설비생산품목 | std_man, man_uph |
| 감가상각 | `CAG700` | 감가상각비집계 | cc_cd (원가부문코드) |
| 장비상각 | `CAG750` | 장비별상각비 | cc_cd |
| 상각비배부 | `CAR100` | 장비별상각비 | de_amt (배부대상액) |

##### Material (자재관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| 품목마스터 | `DMA100` | 품목마스터 | itm_id, itm_bc |
| 품목이력 | `DMA160` | 원자재이력 | rmks (변경사유) |
| BOM | `DMB110_yuhan` | BOM | 소요량, 로스율 |
| 재고실사 | `LEB900_YH` | 재고실사등록 | 재고수량 |
| 원자재투입 | `COS220_YH` | 원자재 투입집계 | cost_mon |
| 원자재배부 | `COS400_YH` | 원재료비 배부처리 | dir_amt, div_amt |

##### Method (공법관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| ECO관리 | `DME100` | ECO | chg_bc, chg_rmks |
| 품목변경 | `DME400` | 품목변경이력 | eco_no, eco_dt |
| 공정관리 | `PPZ100` | 작업장정보 | cc_cd (원가부문) |
| 생산실적 | `PPC100` | 생산실적 | pw_man (작업인원) |
| 외주실적 | `COS310_YH` | 외주실적집계 | cost_mon |
| 외주가공비 | `COS410_YH` | 외주가공비 배부처리 | dir_amt, div_amt |

##### Environment (환경관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| 환경비용마스터 | `GAW900_Yuhan` | 환경비용마스타 | itm_cd, itm_nm, itm_bc |
| 처리단가 | `GAW950_Yuhan` | 처리단가이력 | itm_cd (환경비용코드) |
| 환경비용처리 | `GAW990_Yuhan` | 환경비용처리 | qty, up, amt |
| 환경영향평가 | `QMM650` | 공급업체환경영향평가 | eval_score, grade |
| 환경영향내역 | `QMM655` | 공급업체환경영향평가내역 | work_dsc, eval_id |
| 작업환경점검 | `PPC140_YH` | 생산실적:작업환경,품질점검 | env_bc, env_chk |

##### Energy (에너지관리)

| 분류 | ERP 테이블 | 테이블 설명 | 연계 속성 |
|------|-----------|------------|----------|
| 전력배부율 | `FMP200` | 사무동전력배부율 | dept_cd, add_pnt |
| 월품목전력비 | `FMP500` | 월품목별전력비 | mc_amt, util_amt |
| 설비전력 | `FMA100` | 설비마스타 | div_yn (전력비배부대상) |

---

### 2.3 Level 3: 원가관리 (Cost Layer)

#### 2.3.1 원가요소 체계

```
원가관리 (Cost Management)
├── 원가기준정보
│   ├── CAZ100: 원가부문
│   ├── COA100: 원가요소코드
│   ├── COA200: 배부기준코드
│   └── COA300: 계정별배부기준
├── 원가배부기준
│   ├── COB100: 년도별 원가부문
│   ├── COB200: 원가부문배부기준
│   ├── COB300: 원가부문간배부기준입력값
│   ├── COB500: 년도별원가요소
│   └── COB550: 원가요소별계정
├── 배부기준값
│   ├── COC100: 배부기준입력값
│   └── COC200: 배부기준생성값
├── 배부결과
│   ├── COD100: 원가부문별배부결과
│   └── COD150: 원가부문별배부내역
├── 품목원가
│   ├── COM100: 품목원가상세
│   ├── COM110: 제품별배부내역
│   └── COM120: 품목대체이력
├── 손익분석
│   └── COP100: 제품별손익
└── 유한산업 원가시스템
    ├── COS100_YH: 원가계정별 금액집계
    ├── COS200_YH: 원재료수불부
    ├── COS300_YH: 생산실적집계
    ├── COS350_YH: 원가용BOM정보
    ├── COS400_YH: 원재료비 배부처리
    ├── COS410_YH: 외주가공비 배부처리
    ├── COS420_YH: 계정별 배부처리
    ├── COS500_YH: 재공품명세서
    ├── COS510_YH: 제품수불명세서
    └── COS520_YH: 품목별 원가계산내역
```

#### 2.3.2 원가 테이블 상세

| 원가 분류 | ERP 테이블 | 테이블 설명 | 핵심 컬럼 |
|----------|-----------|------------|----------|
| **원가부문** | `CAZ100` | 원가부문 | cc_cd, cc_nm, cc_bc (제조판관구분) |
| **원가요소** | `COA100` | 원가요소코드 | com_cd, com_nm, com_bc, dir_bc |
| **배부기준** | `COA200` | 배부기준코드 | div_cd, div_nm, ent_bc |
| **계정배부** | `COA300` | 계정별배부기준 | acc_cd, div1_cd~div5_cd |
| **부문배부** | `COB200` | 원가부문배부기준 | fr_cc, div_cd |
| **배부입력** | `COC100` | 배부기준입력값 | itm_id, cc_cd, div_cd, qty |
| **배부결과** | `COD100` | 원가부문별배부결과 | com_cd, cc_cd, amt, div_amt |
| **품목원가** | `COM100` | 품목원가상세 | itm_id, bas_mat/pay/exp, in_mat/pay/exp |
| **제품손익** | `COP100` | 제품별손익 | itm_id, in_up, out_amt, out_up |

#### 2.3.3 4M2E → 원가 연계 맵핑

| 4M2E 요소 | 원가 요소 | 연계 테이블 | 배부 기준 |
|-----------|----------|------------|----------|
| **Man** | 노무비 (직접/간접) | CAG100, CAE100 | cc_cd (원가부문) |
| **Machine** | 감가상각비 | CAG700, CAG750, CAR100 | cc_cd, de_amt |
| **Material** | 재료비 | COS220_YH, COS400_YH | itm_id, cost_mon |
| **Method** | 외주가공비 | COS310_YH, COS410_YH | cust_cd, acc_cd |
| **Environment** | 환경비용 | GAW990_Yuhan | itm_cd, amt |
| **Energy** | 전력비 | FMP500 | mc_amt, util_amt |

---

### 2.4 Level 4: 재무관리 (Finance Layer)

#### 2.4.1 재무 체계 구조

```
재무관리 (Financial Management)
├── 회계기준정보
│   ├── FAA100: 회계계정코드
│   ├── FAA120: 표준적요
│   ├── FAA150: 계정별관리항목
│   ├── FAA200: 회계관리항목
│   ├── FAA500: 전표기준계정
│   ├── FAA510: 매입기준계정
│   └── FAA520: 매출기준계정
├── 전표관리
│   ├── FAB100: 전표정보
│   ├── FAB200: 전표상세
│   ├── FAB300: 전표관리항목
│   └── FAB500: 반제마스타
├── 월별집계
│   ├── FAB800: 계정-월집계
│   ├── FAB850: 계정-년기초
│   ├── FAB900: 관리항목-월집계
│   └── FAB950: 관리항목-년기초
├── 재무제표
│   ├── ESF100: 재무제표집계
│   └── ESG100: 사업부별제조원가
├── 비용관리
│   ├── FAR200: 기간비용정보
│   ├── FAR210: 선급미지급계정
│   └── FAR250: 기간비용전표
└── 예산관리
    ├── FAN400: 변경예산
    ├── FAN410: 변경예산상세
    ├── FAN500: 실행예산_계정과목별
    └── FAN510: 실행예산_표준적요별
```

#### 2.4.2 재무 테이블 상세

| 재무 분류 | ERP 테이블 | 테이블 설명 | 핵심 컬럼 |
|----------|-----------|------------|----------|
| **계정코드** | `FAA100` | 회계계정코드 | acc_cd, acc_nm, acc_bc |
| **전표정보** | `FAB100` | 전표정보 | doc_no, doc_dt, doc_bc |
| **전표상세** | `FAB200` | 전표상세 | doc_sq, acc_cd, amt1, amt2 |
| **월집계** | `FAB800` | 계정-월집계 | doc_dt, acc_cd, amt1, amt2 |
| **년기초** | `FAB850` | 계정-년기초 | doc_mon, acc_cd, amt1, amt2 |
| **재무제표** | `ESF100` | 재무제표집계 | doc_bc, std_mon, amt1, amt2 |
| **제조원가** | `ESG100` | 사업부별제조원가 | biz_bc, std_mon, amt |

#### 2.4.3 원가 → 재무 연계 맵핑

| 원가 항목 | 재무 계정 | 연계 테이블 | 연계 키 |
|----------|----------|------------|---------|
| 재료비 | 원재료 | COM100 → FAB200 | acc_cd |
| 노무비 | 임금 | CAG100 → FAB200 | cc_cd → dept_cd |
| 제조경비 | 제조경비 | COD100 → FAB200 | acc_cd |
| 제품원가 | 제품매출원가 | COM100 → FAB800 | itm_id → acc_cd |
| 제조원가 | 사업부별제조원가 | COP100 → ESG100 | biz_bc |

---

### 2.5 Level 5: ESG 경영 (Sustainability Layer)

#### 2.5.1 ESG 체계 구조

```
ESG 경영 (ESG Management)
├── Environment (환경)
│   ├── GAW900_Yuhan: 환경비용마스타
│   ├── GAW950_Yuhan: 처리단가이력
│   ├── GAW990_Yuhan: 환경비용처리
│   ├── QMM650: 공급업체환경영향평가
│   ├── QMM655: 공급업체환경영향평가내역
│   ├── QMM600: 공급업체대장 (cert2_nm: 환경인증)
│   └── FMP500: 월품목별전력비 (에너지 사용량)
├── Social (사회)
│   ├── HRA100: 사원기본정보
│   ├── HRK100: 사원가족
│   ├── HRM200: 사원가족사항이력
│   ├── QME200: 교육시행정보 (tot_amt: 총비용)
│   ├── PPC140_YH: 작업환경점검
│   └── GAY100_Yuhan: 연차관리 기준정보
└── Governance (지배구조)
    ├── BCC100: 법인정보
    ├── BCC200: 사업장정보
    ├── QMM600: 공급업체대장 (협력사 관리)
    ├── QMM630: 공급업체평가
    └── QMM640: 공급업체성과분석
```

#### 2.5.2 ESG 테이블 상세

| ESG 분류 | ERP 테이블 | 테이블 설명 | 핵심 컬럼 |
|----------|-----------|------------|----------|
| **E-환경비용** | `GAW900_Yuhan` | 환경비용마스타 | itm_cd, itm_nm, itm_bc |
| **E-환경처리** | `GAW990_Yuhan` | 환경비용처리 | qty, up, amt, vat |
| **E-환경평가** | `QMM650` | 공급업체환경영향평가 | eval_score, grade |
| **E-에너지** | `FMP500` | 월품목별전력비 | mc_amt, util_amt |
| **S-인력** | `HRA100` | 사원기본정보 | emp_no, cc_cd |
| **S-교육** | `QME200` | 교육시행정보 | tot_amt (총비용) |
| **S-안전** | `PPC140_YH` | 작업환경,품질점검 | env_bc, env_chk |
| **G-협력사** | `QMM600` | 공급업체대장 | cert2_nm, cert2_org |
| **G-평가** | `QMM630` | 공급업체평가 | eval_score |

#### 2.5.3 재무 → ESG 연계 맵핑

| 재무 항목 | ESG 영역 | 연계 테이블 | 지표 |
|----------|---------|------------|------|
| 환경비용 | E | GAW990_Yuhan | amt (처리비용) |
| 전력비 | E | FMP500 | mc_amt + util_amt |
| 인건비 | S | CAG100 → HRA100 | 노무비 총액 |
| 교육비 | S | QME200 | tot_amt |
| 협력사 거래 | G | QMM640 | 성과지표 |

---

## 3. 온톨로지 관계 정의

### 3.1 Entity Relationship

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Master Data Layer                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ HRA100  │    │ FMA100  │    │ DMA100  │    │ BCV100  │           │
│  │ (사원)  │    │ (설비)  │    │ (품목)  │    │(거래처) │           │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘           │
│       │              │              │              │                 │
└───────┼──────────────┼──────────────┼──────────────┼─────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Transaction Layer                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ PPC100  │    │ QMM200  │    │ LEA100  │    │ SDY100  │           │
│  │(생산)   │    │(6M변경) │    │ (입고)  │    │ (매출)  │           │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘           │
│       │              │              │              │                 │
└───────┼──────────────┼──────────────┼──────────────┼─────────────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Cost Layer                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ CAZ100  │───▶│ COA100  │───▶│ COD100  │───▶│ COM100  │           │
│  │(원가부문)│    │(원가요소)│    │(배부결과)│    │(품목원가)│           │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘           │
│                                                     │                 │
└─────────────────────────────────────────────────────┼─────────────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Finance Layer                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ FAA100  │───▶│ FAB100  │───▶│ FAB800  │───▶│ ESF100  │           │
│  │(계정코드)│    │ (전표)  │    │(월집계) │    │(재무제표)│           │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘           │
│                                                     │                 │
└─────────────────────────────────────────────────────┼─────────────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         ESG Layer                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐          │
│  │  GAW990     │    │   HRA100    │    │     QMM600      │          │
│  │ (환경비용)  │    │ (사회/인력) │    │ (지배구조/협력) │          │
│  └─────────────┘    └─────────────┘    └─────────────────┘          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름 연계 키

| 연계 구간 | Source | Target | 연계 키 |
|----------|--------|--------|---------|
| 6M → 4M2E | QMM200_YH | HRA100/FMA100 | req_emp, chg_cd |
| 4M2E → 원가 | HRA100 | CAZ100 | cc_cd (원가부문) |
| 4M2E → 원가 | FMA100 | CAG700 | fa_no, cc_cd |
| 4M2E → 원가 | DMA100 | COM100 | itm_id |
| 원가 → 재무 | COM100 | FAB200 | acc_cd |
| 원가 → 재무 | COD100 | FAB800 | acc_cd, div_cd |
| 재무 → ESG | FAB800 | GAW990 | doc_no, acc_cd |
| 재무 → ESG | ESG100 | QMM650 | co_cd, std_yy |

---

## 4. Django 모델 설계

### 4.1 온톨로지 중간 테이블 모델

```python
# ontology/models.py

from django.db import models
from django.utils import timezone

class OntologyCategory(models.Model):
    """온톨로지 카테고리 (6M, 4M2E, 원가, 재무, ESG)"""
    CATEGORY_CHOICES = [
        ('6M', '6M 변경관리'),
        ('4M2E', '4M2E 제조관리'),
        ('COST', '원가관리'),
        ('FINANCE', '재무관리'),
        ('ESG', 'ESG 경영'),
    ]

    code = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    level = models.IntegerField(default=1)  # 계층 레벨
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)

    class Meta:
        verbose_name = '온톨로지 카테고리'
        verbose_name_plural = '온톨로지 카테고리'


class OntologyElement(models.Model):
    """온톨로지 요소 (Man, Machine, Material 등)"""
    category = models.ForeignKey(OntologyCategory, on_delete=models.CASCADE)
    code = models.CharField(max_length=20)
    name_ko = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ['category', 'code']
        verbose_name = '온톨로지 요소'


class ERPTableMapping(models.Model):
    """ERP 테이블 맵핑"""
    element = models.ForeignKey(OntologyElement, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=50)
    table_description = models.CharField(max_length=200)
    key_columns = models.JSONField(default=list)  # 주요 컬럼 목록
    link_columns = models.JSONField(default=list)  # 연계 컬럼 목록

    class Meta:
        verbose_name = 'ERP 테이블 맵핑'


class OntologyRelation(models.Model):
    """온톨로지 요소 간 관계"""
    RELATION_TYPES = [
        ('TRANSFORM', '변환'),
        ('AGGREGATE', '집계'),
        ('ALLOCATE', '배부'),
        ('REFERENCE', '참조'),
    ]

    source_element = models.ForeignKey(OntologyElement, related_name='source_relations', on_delete=models.CASCADE)
    target_element = models.ForeignKey(OntologyElement, related_name='target_relations', on_delete=models.CASCADE)
    relation_type = models.CharField(max_length=20, choices=RELATION_TYPES)
    link_key = models.CharField(max_length=100)  # 연계 키
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = '온톨로지 관계'


class DataFlowLog(models.Model):
    """데이터 흐름 로그"""
    source_table = models.CharField(max_length=50)
    target_table = models.CharField(max_length=50)
    flow_date = models.DateField()
    record_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '데이터 흐름 로그'
```

### 4.2 온톨로지 서비스 클래스

```python
# ontology/services.py

from typing import Dict, List, Any
from django.db.models import Sum, Count
from .models import OntologyCategory, OntologyElement, ERPTableMapping, OntologyRelation

class OntologyService:
    """온톨로지 기반 데이터 분석 서비스"""

    @staticmethod
    def get_data_flow_chain(start_category: str, end_category: str) -> List[Dict]:
        """카테고리 간 데이터 흐름 체인 조회"""
        chain = []
        categories = ['6M', '4M2E', 'COST', 'FINANCE', 'ESG']

        start_idx = categories.index(start_category)
        end_idx = categories.index(end_category)

        for i in range(start_idx, end_idx + 1):
            category = OntologyCategory.objects.get(code=categories[i])
            elements = OntologyElement.objects.filter(category=category)

            chain.append({
                'category': category.code,
                'name': category.name,
                'elements': [
                    {
                        'code': e.code,
                        'name_ko': e.name_ko,
                        'tables': list(e.erptablemapping_set.values('table_name', 'table_description'))
                    }
                    for e in elements
                ]
            })

        return chain

    @staticmethod
    def trace_cost_to_esg(cost_mon: str) -> Dict:
        """원가 데이터의 ESG 영향 추적"""
        result = {
            'cost_month': cost_mon,
            'environment': {},
            'social': {},
            'governance': {}
        }

        # 환경 비용 추적
        # GAW990_Yuhan 테이블에서 환경비용 집계
        result['environment'] = {
            'waste_cost': 0,  # 폐기물 처리비용
            'energy_cost': 0,  # 에너지 비용
            'carbon_emission': 0  # 탄소 배출량
        }

        # 사회 비용 추적
        result['social'] = {
            'labor_cost': 0,  # 노무비
            'training_cost': 0,  # 교육비
            'safety_cost': 0  # 안전 관련 비용
        }

        # 지배구조 관련
        result['governance'] = {
            'supplier_count': 0,  # 협력사 수
            'eval_score_avg': 0  # 평균 평가점수
        }

        return result

    @staticmethod
    def get_4m2e_impact_analysis(target_date: str) -> Dict:
        """4M2E 요소별 원가 영향도 분석"""
        return {
            'man': {
                'labor_cost': 0,
                'headcount': 0,
                'productivity': 0
            },
            'machine': {
                'depreciation': 0,
                'maintenance': 0,
                'utilization': 0
            },
            'material': {
                'material_cost': 0,
                'inventory_value': 0,
                'waste_rate': 0
            },
            'method': {
                'outsourcing_cost': 0,
                'process_efficiency': 0,
                'defect_rate': 0
            },
            'environment': {
                'env_cost': 0,
                'compliance_rate': 0
            },
            'energy': {
                'power_cost': 0,
                'consumption': 0,
                'efficiency': 0
            }
        }
```

### 4.3 온톨로지 API 엔드포인트

```python
# ontology/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import OntologyService

class OntologyFlowAPIView(APIView):
    """온톨로지 데이터 흐름 API"""

    def get(self, request):
        """6M → 4M2E → 원가 → 재무 → ESG 전체 흐름 조회"""
        service = OntologyService()

        start = request.query_params.get('start', '6M')
        end = request.query_params.get('end', 'ESG')

        flow_chain = service.get_data_flow_chain(start, end)

        return Response({
            'status': 'success',
            'data': {
                'start_category': start,
                'end_category': end,
                'flow_chain': flow_chain
            }
        })


class CostToESGTraceAPIView(APIView):
    """원가 → ESG 추적 API"""

    def get(self, request, cost_mon):
        """특정 월의 원가 데이터가 ESG에 미치는 영향 추적"""
        service = OntologyService()
        result = service.trace_cost_to_esg(cost_mon)

        return Response({
            'status': 'success',
            'data': result
        })


class Impact4M2EAPIView(APIView):
    """4M2E 영향도 분석 API"""

    def get(self, request):
        """4M2E 요소별 원가 영향도 분석"""
        target_date = request.query_params.get('date')

        service = OntologyService()
        result = service.get_4m2e_impact_analysis(target_date)

        return Response({
            'status': 'success',
            'data': result
        })
```

---

## 5. API 엔드포인트 정의

### 5.1 온톨로지 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/ontology/flow` | 전체 데이터 흐름 조회 |
| GET | `/api/v1/ontology/flow/{category}` | 특정 카테고리 상세 |
| GET | `/api/v1/ontology/elements` | 온톨로지 요소 목록 |
| GET | `/api/v1/ontology/relations` | 요소 간 관계 조회 |

### 5.2 4M2E 분석 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/4m2e/summary` | 4M2E 요약 현황 |
| GET | `/api/v1/4m2e/man` | 인력(Man) 분석 |
| GET | `/api/v1/4m2e/machine` | 설비(Machine) 분석 |
| GET | `/api/v1/4m2e/material` | 자재(Material) 분석 |
| GET | `/api/v1/4m2e/method` | 공법(Method) 분석 |
| GET | `/api/v1/4m2e/environment` | 환경(Environment) 분석 |
| GET | `/api/v1/4m2e/energy` | 에너지(Energy) 분석 |

### 5.3 원가-재무-ESG 연계 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/cost-to-finance/{cost_mon}` | 원가→재무 연계 |
| GET | `/api/v1/finance-to-esg/{std_mon}` | 재무→ESG 연계 |
| GET | `/api/v1/cost-to-esg/{cost_mon}` | 원가→ESG 추적 |
| GET | `/api/v1/esg/impact-analysis` | ESG 영향도 분석 |

---

## 6. 대시보드 시각화 설계

### 6.1 온톨로지 플로우 차트

```
┌─────────────────────────────────────────────────────────────────────┐
│                    온톨로지 데이터 흐름 대시보드                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [6M 변경관리]  →  [4M2E 제조관리]  →  [원가관리]  →  [재무]  →  [ESG]│
│      ▼                  ▼                ▼           ▼         ▼   │
│  ┌──────────┐     ┌──────────┐     ┌─────────┐  ┌───────┐  ┌─────┐ │
│  │변경건수  │     │생산실적  │     │제조원가 │  │매출액 │  │E점수│ │
│  │  15건    │     │1,234톤   │     │850M원   │  │1.2B원 │  │ 85  │ │
│  └──────────┘     └──────────┘     └─────────┘  └───────┘  └─────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┤
│  │                    4M2E 구성비 분석                               │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │
│  │  │Man │ │Mach│ │Mat │ │Meth│ │Env │ │Ene │                      │
│  │  │25% │ │20% │ │30% │ │15% │ │5%  │ │5%  │                      │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                      │
│  └──────────────────────────────────────────────────────────────────┤
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 원가-ESG 연계 대시보드

```
┌─────────────────────────────────────────────────────────────────────┐
│                    원가 → ESG 영향도 분석                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  원가 구성                              ESG 지표                     │
│  ┌─────────────────┐                   ┌─────────────────┐          │
│  │ 재료비   45%    │ ──────────────▶  │ E: 환경 비용    │          │
│  │ 노무비   25%    │ ──────────────▶  │ S: 인건비/교육  │          │
│  │ 경비     20%    │ ──────────────▶  │ G: 협력사 관리  │          │
│  │ 외주비   10%    │                   │                 │          │
│  └─────────────────┘                   └─────────────────┘          │
│                                                                      │
│  ESG 종합 점수: 82점 (전월 대비 +3점)                               │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Environment: ████████████░░░ 78                                ││
│  │ Social:      █████████████░░ 85                                ││
│  │ Governance:  ████████████░░░ 83                                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. 구현 로드맵

### Phase 1: 기초 데이터 연계 (Week 1-2)
- 6M 변경관리 테이블 연동
- 4M2E 기초 데이터 수집
- 온톨로지 카테고리/요소 마스터 구축

### Phase 2: 원가 연계 (Week 3-4)
- 원가 테이블 연동 (CAZ, COA, COB, COC, COD, COM)
- 4M2E → 원가 배부 로직 구현
- 원가 분석 API 개발

### Phase 3: 재무 연계 (Week 5-6)
- 재무 테이블 연동 (FAA, FAB, ESF)
- 원가 → 재무 집계 로직
- 재무제표 생성 API

### Phase 4: ESG 연계 (Week 7-8)
- ESG 관련 테이블 연동 (GAW, QMM650, FMP)
- 재무 → ESG 지표 산출
- ESG 대시보드 구현

### Phase 5: 통합 및 최적화 (Week 9-10)
- 전체 흐름 통합 테스트
- 성능 최적화
- 대시보드 완성

---

## 8. 부록

### 8.1 ERP 테이블 총괄표

| Layer | 테이블 수 | 주요 테이블 |
|-------|----------|------------|
| 6M | 5 | QMM200_YH, QMM210_YH, QMM220_YH, DME100, DME400 |
| 4M2E-Man | 6 | HRA100, HRA200, HRA250, HRK100, CAG100, CAE100 |
| 4M2E-Machine | 6 | FMA100, FMA130, FMA160, CAG700, CAG750, CAR100 |
| 4M2E-Material | 6 | DMA100, DMA160, DMB110, COS220_YH, COS400_YH, LEB900 |
| 4M2E-Method | 6 | DME100, PPZ100, PPC100, COS310_YH, COS410_YH, DME400 |
| 4M2E-Environment | 6 | GAW900, GAW950, GAW990, QMM650, QMM655, PPC140_YH |
| 4M2E-Energy | 3 | FMP200, FMP500, FMA100 |
| 원가 | 25 | CAZ100, COA100-COG150, COM100-COM120, COP100, COS100-600_YH |
| 재무 | 20 | FAA100-FAA520, FAB100-FAB950, ESF100, ESG100 |
| ESG | 10 | GAW900-990, QMM600-655, HRA100, QME200 |
| **총계** | **~93** | - |

### 8.2 핵심 연계 키 정리

| 연계 | 소스 테이블 | 타겟 테이블 | 연계 키 |
|-----|-----------|-----------|---------|
| 사원-원가부문 | HRA100 | CAZ100 | cc_cd |
| 설비-원가부문 | FMA100 | CAZ100 | cc_cd |
| 품목-원가 | DMA100 | COM100 | itm_id |
| 원가요소-배부 | COA100 | COD100 | com_cd |
| 원가-재무 | COM100 | FAB200 | acc_cd |
| 재무-ESG | FAB800 | GAW990 | doc_no |

---

## 9. 원가 분석 컴포넌트 (Cost Analysis Components)

### 9.1 원가 분석 컴포넌트 개요

| 컴포넌트 | 메뉴 경로 | 설명 |
|---------|----------|-----|
| **PurchaseCost** | 구매 관리 → 구매 원가 | 자재별 구매 단가와 총비용 분석 |
| **QualityCost** | 품질 관리 → 품질 원가 | 예방/평가/실패 비용 분석 |
| **SalesCost** | 영업 관리 → 견적 원가 | 제품별 직접/간접 원가와 수익성 분석 |
| **DesignCost** | 개발 관리 → 설계 원가 | 설계 작업비와 자재비 분석 |
| **OutsourcingCost** | 생산 관리 → 외주 원가 | 협력사별 외주비와 품질 관리 |

### 9.2 원가 분석 컴포넌트 상세

#### 9.2.1 PurchaseCost (구매 원가)

```typescript
interface PurchaseCostData {
  id: number;
  supplier: string;      // 협력사 (A사, B사, C사, ...)
  material: string;      // 자재명
  purchasePrice: number; // 구매 단가
  quantity: number;      // 수량
  totalCost: number;     // 총비용
  unit: string;          // 단위 (kg, 개, m)
  category: string;      // 카테고리 (원자재, 부품, 소모품, 포장재)
}
```

**기능:**
- 협력사별 구매액 분석 (바 차트)
- 자재 카테고리별 필터링
- 월별 구매 단가 추이 (라인 차트)
- 구매 원가 상세 테이블

**KPI 지표:**
- 총 구매액
- 평균 단가
- 협력사 수
- 구매 품목 수

#### 9.2.2 QualityCost (품질 원가)

```typescript
interface QualityCostData {
  id: number;
  costType: string;      // 비용 유형 (예방 활동, 평가 활동, 내부 실패, 외부 실패)
  description: string;   // 설명 (품질 교육, 공정 관리, 입고 검사, ...)
  costAmount: number;    // 비용 금액
  defectRate: number;    // 불량률
  impactedProducts: number; // 영향 제품 수
  category: 'prevention' | 'appraisal' | 'failure' | 'external';
}
```

**기능:**
- 예방/평가/내부실패/외부실패 비용 분석
- 불량률 추이 모니터링
- 품질 비용 구성 (도넛 차트)
- 월별 품질 비용 추이 (스택 바 차트)

**KPI 지표:**
- 총 품질 비용
- 불량률
- 예방 비용
- 실패 비용 (내부 + 외부)

#### 9.2.3 SalesCost (견적/매출 원가)

```typescript
interface SalesCostData {
  id: number;
  product: string;       // 제품명 (제품 A, B, C, D)
  costType: string;      // 원가 유형 (직접 원가, 간접 원가)
  directCost: number;    // 직접 원가
  indirectCost: number;  // 간접 원가
  totalCost: number;     // 총 원가
  unitCost: number;      // 단위 원가
  salesVolume: number;   // 판매량
  salesRevenue: number;  // 매출액
  profitMargin: number;  // 이익률 (%)
}
```

**기능:**
- 제품별 직접/간접 원가 분석
- 수익성 및 마진율 분석
- 월별 수익성 추이 (라인 차트)
- 매출액 대비 원가 비율

**KPI 지표:**
- 총 매출액
- 총 원가 (직접 + 간접)
- 영업이익
- 평균 마진율

#### 9.2.4 DesignCost (설계 원가)

```typescript
interface DesignCostData {
  id: number;
  projectName: string;   // 프로젝트명
  projectCode: string;   // 프로젝트 코드 (D-2024-001)
  designType: string;    // 설계 유형 (신규 설계, 설계 변경, 최적화, 컨셉 설계, 시스템 설계, 해석/시뮬레이션)
  designHours: number;   // 설계 작업시간
  hourlyCost: number;    // 시간당 단가
  materialCost: number;  // 자재비
  softwareCost: number;  // 소프트웨어비
  totalCost: number;     // 총비용
  designer: string;      // 설계사
  status: 'planning' | 'in-progress' | 'review' | 'completed';
}
```

**기능:**
- 프로젝트별 설계비 분석
- 설계 유형별 비용 분석
- 설계사별 성과 분석
- 프로젝트 상태 관리

**KPI 지표:**
- 총 설계비
- 총 작업시간
- 평균 시간당 단가
- 진행 프로젝트 수

#### 9.2.5 OutsourcingCost (외주 원가)

```typescript
interface OutsourcingData {
  id: number;
  vendor: string;        // 협력사 (한국외주A사, 부산외주B사, ...)
  itemName: string;      // 품목명
  outsourcingType: string; // 외주 유형 (가공, 조립, 표면처리, 열처리, 용접, 사출성형, 도장)
  quantity: number;      // 수량
  unitCost: number;      // 단가
  totalCost: number;     // 총비용
  deliveryDate: string;  // 납기일
  status: 'pending' | 'in-production' | 'delivered' | 'accepted' | 'rejected';
  qualityRating?: number; // 품질 등급 (1.0 ~ 5.0)
}
```

**기능:**
- 협력사별 외주액 분석 (가로 바 차트)
- 외주 유형별 비용 분석
- 품질 등급 관리
- 납기 준수율 추적

**KPI 지표:**
- 총 외주비
- 협력사 수
- 평균 단가
- 진행 품목 수

### 9.3 원가 분석 컴포넌트 통합

```
┌─────────────────────────────────────────────────────────────────┐
│                      원가 분석 컴포넌트 구조                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PurchaseCost │  │ QualityCost  │  │  SalesCost   │          │
│  │  (구매 원가) │  │ (품질 원가) │  │ (견적 원가) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                     │
│                           ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Cost Management                          │ │
│  │                   (원가 관리)                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ DesignCost   │  │OutsourcingCost│                            │
│  │ (설계 원가)  │  │ (외주 원가)  │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 원가 분석 → 4M2E 연계

| 원가 분석 | 4M2E 요소 | 연계 방식 |
|----------|----------|----------|
| 구매 원가 | Material | 자재별 원가 → 4M2E Material 요소 |
| 품질 원가 | Method | 품질 비용 → 4M2E Method/Measurement 요소 |
| 견적 원가 | Material | 제품별 원가 → 4M2E Material 요소 |
| 설계 원가 | Method | 설계 비용 → 4M2E Method 요소 |
| 외주 원가 | Method | 외주 비용 → 4M2E Method 요소 |

---

**문서 버전**: 1.1
**작성일**: 2025-12-26
**수정일**: 2026-03-05
**작성자**: Claude AI Assistant
**프로젝트**: Claros MIS-AI Dashboard (유한산업)
