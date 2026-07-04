import React, { useState, useEffect } from 'react';

// 타입 정의
interface CategorySummary {
  code: string;
  name: string;
  name_en: string;
  level: number;
  element_count: number;
  table_count: number;
  is_active: boolean;
}

interface ERPTable {
  table_name: string;
  table_description: string;
  module: string;
  column_count?: number;
  sample_columns?: string[];
}

interface Element {
  code: string;
  name_ko: string;
  name_en: string;
  icon: string;
  color: string;
  table_count: number;
  tables: ERPTable[];
}

interface FlowCategory {
  category_code: string;
  category_name: string;
  level: number;
  element_count: number;
  elements: Element[];
}

interface Impact4M2E {
  name: string;
  cost_ratio: number;
  tables: string[];
}

interface ESGData {
  score: number;
  tables: string[];
}

// 아이콘 컴포넌트들
const UserIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SettingsIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);

const PackageIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/>
    <polyline points="2.32 6.16 12 11 21.68 6.16"/>
    <line x1="12" y1="22.76" x2="12" y2="11"/>
  </svg>
);

const ZapIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const LeafIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const BoltIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const ArrowRightIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const DatabaseIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const TrendUpIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const getElementIcon = (iconName: string, color: string) => {
  const props = { size: 24, className: "text-white" };
  switch (iconName) {
    case 'UserIcon': return <UserIcon {...props} />;
    case 'SettingsIcon': return <SettingsIcon {...props} />;
    case 'PackageIcon': return <PackageIcon {...props} />;
    case 'ZapIcon': return <ZapIcon {...props} />;
    case 'AlertIcon': return <LeafIcon {...props} />;
    case 'BoltIcon': return <BoltIcon {...props} />;
    case 'LeafIcon': return <LeafIcon {...props} />;
    default: return <DatabaseIcon {...props} />;
  }
};

// ERD 테이블 인터페이스
interface ERDTableNode {
  id: string;
  name: string;
  description: string;
  module: string;
  columns: { name: string; type: string; isPK?: boolean; isFK?: boolean; fkRef?: string }[];
  x: number;
  y: number;
}

interface ERDRelation {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  type: '1:N' | '1:1' | 'N:M';
}

const Ontology: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flow' | '4m2e' | 'esg' | 'erd'>('flow');
  const [selectedERDModule, setSelectedERDModule] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [flowChain, setFlowChain] = useState<FlowCategory[]>([]);
  const [impact4M2E, setImpact4M2E] = useState<Record<string, Impact4M2E>>({});
  const [esgData, setEsgData] = useState<{
    environment: ESGData;
    social: ESGData;
    governance: ESGData;
    esg_score: number;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);

  // 시뮬레이션 데이터 로드
  useEffect(() => {
    loadSimulationData();
  }, []);

  const loadSimulationData = () => {
    setLoading(true);

    // 카테고리 요약 데이터
    const categories: CategorySummary[] = [
      { code: '6M', name: '6M 변경관리', name_en: '6M Change', level: 1, element_count: 6, table_count: 7, is_active: true },
      { code: '4M2E', name: '4M2E 제조관리', name_en: '4M2E Manufacturing', level: 2, element_count: 6, table_count: 12, is_active: true },
      { code: 'COST', name: '원가관리', name_en: 'Cost Management', level: 3, element_count: 5, table_count: 25, is_active: true },
      { code: 'FINANCE', name: '재무관리', name_en: 'Finance', level: 4, element_count: 4, table_count: 20, is_active: true },
      { code: 'ESG', name: 'ESG 경영', name_en: 'ESG', level: 5, element_count: 3, table_count: 10, is_active: true },
    ];
    setCategorySummary(categories);

    // 플로우 체인 데이터
    const flow: FlowCategory[] = [
      {
        category_code: '6M',
        category_name: '6M 변경관리',
        level: 1,
        element_count: 6,
        elements: [
          { code: 'MAN', name_ko: '인력(Man)', name_en: 'Man', icon: 'UserIcon', color: '#3B82F6', table_count: 3, tables: [
            { table_name: 'QMM200_YH', table_description: '6M변경신청관리', module: '품질', column_count: 45, sample_columns: ['CHG_NO', 'CHG_TYPE', 'CHG_REASON', 'REQ_DATE'] },
            { table_name: 'HRA100', table_description: '인사마스터', module: '인사', column_count: 120, sample_columns: ['EMP_NO', 'EMP_NAME', 'DEPT_CD', 'POSITION'] },
            { table_name: 'CAG100', table_description: '근태관리', module: '급여', column_count: 35, sample_columns: ['EMP_NO', 'WORK_DATE', 'IN_TIME', 'OUT_TIME'] }
          ]},
          { code: 'MACHINE', name_ko: '설비(Machine)', name_en: 'Machine', icon: 'SettingsIcon', color: '#10B981', table_count: 4, tables: [
            { table_name: 'FMA100', table_description: '설비마스터', module: '설비', column_count: 85, sample_columns: ['EQUIP_CD', 'EQUIP_NM', 'EQUIP_TYPE', 'INSTALL_DATE'] },
            { table_name: 'FMB100', table_description: '설비가동현황', module: '설비', column_count: 42, sample_columns: ['EQUIP_CD', 'WORK_DATE', 'RUN_TIME', 'STOP_TIME'] },
            { table_name: 'FMC100', table_description: '설비보전이력', module: '설비', column_count: 38, sample_columns: ['MAINT_NO', 'EQUIP_CD', 'MAINT_TYPE', 'MAINT_DATE'] },
            { table_name: 'FMP200', table_description: '설비점검계획', module: '설비', column_count: 28, sample_columns: ['CHECK_NO', 'EQUIP_CD', 'CHECK_CYCLE', 'NEXT_DATE'] }
          ]},
          { code: 'MATERIAL', name_ko: '자재(Material)', name_en: 'Material', icon: 'PackageIcon', color: '#F59E0B', table_count: 5, tables: [
            { table_name: 'DMA100', table_description: '품목마스터', module: '자재', column_count: 150, sample_columns: ['ITEM_CD', 'ITEM_NM', 'ITEM_TYPE', 'UNIT'] },
            { table_name: 'DMA200', table_description: 'BOM마스터', module: '자재', column_count: 65, sample_columns: ['P_ITEM_CD', 'C_ITEM_CD', 'QTY', 'SEQ'] },
            { table_name: 'DBB100', table_description: '재고현황', module: '자재', column_count: 48, sample_columns: ['ITEM_CD', 'WH_CD', 'LOT_NO', 'QTY'] },
            { table_name: 'DBC100', table_description: '입출고이력', module: '자재', column_count: 55, sample_columns: ['IO_NO', 'IO_TYPE', 'ITEM_CD', 'QTY'] },
            { table_name: 'DPO100', table_description: '발주정보', module: '구매', column_count: 72, sample_columns: ['PO_NO', 'VENDOR_CD', 'ITEM_CD', 'PO_QTY'] }
          ]},
          { code: 'METHOD', name_ko: '공법(Method)', name_en: 'Method', icon: 'ZapIcon', color: '#8B5CF6', table_count: 4, tables: [
            { table_name: 'DME100', table_description: 'ECO관리', module: '개발', column_count: 58, sample_columns: ['ECO_NO', 'ECO_TYPE', 'ITEM_CD', 'CHG_REASON'] },
            { table_name: 'PPC100', table_description: '공정마스터', module: '생산', column_count: 45, sample_columns: ['PROC_CD', 'PROC_NM', 'PROC_TYPE', 'WORK_CENTER'] },
            { table_name: 'PPC200', table_description: '라우팅정보', module: '생산', column_count: 38, sample_columns: ['ITEM_CD', 'PROC_CD', 'SEQ', 'STD_TIME'] },
            { table_name: 'PPM100', table_description: '생산지시', module: '생산', column_count: 62, sample_columns: ['WO_NO', 'ITEM_CD', 'WO_QTY', 'START_DATE'] }
          ]},
          { code: 'MEASUREMENT', name_ko: '측정(Measurement)', name_en: 'Measurement', icon: 'SettingsIcon', color: '#EC4899', table_count: 5, tables: [
            { table_name: 'QMM100', table_description: '수입검사정보', module: '품질', column_count: 52, sample_columns: ['INS_NO', 'ITEM_CD', 'LOT_NO', 'INS_RESULT'] },
            { table_name: 'QMM110', table_description: '공정검사정보', module: '품질', column_count: 48, sample_columns: ['INS_NO', 'WO_NO', 'PROC_CD', 'INS_RESULT'] },
            { table_name: 'QMM120', table_description: '출하검사정보', module: '품질', column_count: 45, sample_columns: ['INS_NO', 'SHIP_NO', 'ITEM_CD', 'INS_RESULT'] },
            { table_name: 'QMM400', table_description: '검사성적서', module: '품질', column_count: 35, sample_columns: ['CERT_NO', 'INS_NO', 'ITEM_CD', 'CERT_DATE'] },
            { table_name: 'QMM500', table_description: '계측기관리', module: '품질', column_count: 42, sample_columns: ['GAUGE_CD', 'GAUGE_NM', 'CAL_DATE', 'NEXT_CAL'] }
          ]},
          { code: 'MOTHER_NATURE', name_ko: '자연환경(Mother Nature)', name_en: 'Mother Nature', icon: 'LeafIcon', color: '#22C55E', table_count: 4, tables: [
            { table_name: 'GAW990_Yuhan', table_description: '환경비용관리', module: '회계', column_count: 38, sample_columns: ['ENV_CD', 'ENV_TYPE', 'COST_AMT', 'REG_DATE'] },
            { table_name: 'QMM650', table_description: '환경규제관리', module: '품질', column_count: 32, sample_columns: ['REG_CD', 'REG_TYPE', 'REG_CONTENT', 'APPLY_DATE'] },
            { table_name: 'FMP500', table_description: '에너지사용현황', module: '설비', column_count: 28, sample_columns: ['ENERGY_TYPE', 'USE_DATE', 'USE_QTY', 'UNIT'] },
            { table_name: 'ENV100', table_description: '폐기물관리', module: '환경', column_count: 35, sample_columns: ['WASTE_CD', 'WASTE_TYPE', 'WASTE_QTY', 'DISP_DATE'] }
          ]}
        ]
      },
      {
        category_code: '4M2E',
        category_name: '4M2E 제조관리',
        level: 2,
        element_count: 6,
        elements: [
          { code: 'MAN', name_ko: '인력(Man)', name_en: 'Man', icon: 'UserIcon', color: '#3B82F6', table_count: 3, tables: [
            { table_name: 'PPC140_YH', table_description: '작업자배치', module: '생산', column_count: 32, sample_columns: ['WO_NO', 'EMP_NO', 'WORK_DATE', 'PROC_CD'] },
            { table_name: 'PPW100', table_description: '작업실적', module: '생산', column_count: 45, sample_columns: ['WO_NO', 'EMP_NO', 'PROD_QTY', 'WORK_TIME'] },
            { table_name: 'CAE100', table_description: '급여정보', module: '급여', column_count: 68, sample_columns: ['EMP_NO', 'PAY_YM', 'BASE_PAY', 'ALLOW_AMT'] }
          ]},
          { code: 'MACHINE', name_ko: '설비(Machine)', name_en: 'Machine', icon: 'SettingsIcon', color: '#10B981', table_count: 3, tables: [
            { table_name: 'CAG700', table_description: '설비감가상각', module: '회계', column_count: 28, sample_columns: ['ASSET_NO', 'DEP_AMT', 'ACC_DEP', 'BOOK_VALUE'] },
            { table_name: 'CAG750', table_description: '설비보험료', module: '회계', column_count: 22, sample_columns: ['ASSET_NO', 'INS_TYPE', 'INS_AMT', 'START_DATE'] },
            { table_name: 'FMD100', table_description: '설비고장이력', module: '설비', column_count: 35, sample_columns: ['FAIL_NO', 'EQUIP_CD', 'FAIL_TYPE', 'REPAIR_TIME'] }
          ]},
          { code: 'MATERIAL', name_ko: '자재(Material)', name_en: 'Material', icon: 'PackageIcon', color: '#F59E0B', table_count: 4, tables: [
            { table_name: 'COS220_YH', table_description: '재료비집계', module: '원가', column_count: 42, sample_columns: ['COST_YM', 'ITEM_CD', 'MAT_AMT', 'UNIT_COST'] },
            { table_name: 'COS400_YH', table_description: '원가계산', module: '원가', column_count: 55, sample_columns: ['COST_YM', 'ITEM_CD', 'TOT_COST', 'UNIT_COST'] },
            { table_name: 'DBD100', table_description: '불출현황', module: '자재', column_count: 38, sample_columns: ['ISS_NO', 'WO_NO', 'ITEM_CD', 'ISS_QTY'] },
            { table_name: 'DBE100', table_description: '스크랩관리', module: '자재', column_count: 28, sample_columns: ['SCRAP_NO', 'ITEM_CD', 'SCRAP_QTY', 'SCRAP_AMT'] }
          ]},
          { code: 'METHOD', name_ko: '공법(Method)', name_en: 'Method', icon: 'ZapIcon', color: '#8B5CF6', table_count: 3, tables: [
            { table_name: 'COS310_YH', table_description: '노무비집계', module: '원가', column_count: 38, sample_columns: ['COST_YM', 'DEPT_CD', 'LABOR_AMT', 'WORK_HR'] },
            { table_name: 'COS410_YH', table_description: '경비집계', module: '원가', column_count: 45, sample_columns: ['COST_YM', 'DEPT_CD', 'EXP_CD', 'EXP_AMT'] },
            { table_name: 'PPC300', table_description: '공정능력', module: '생산', column_count: 32, sample_columns: ['PROC_CD', 'CPK', 'PPM', 'EVAL_DATE'] }
          ]},
          { code: 'ENVIRONMENT', name_ko: '환경(Environment)', name_en: 'Environment', icon: 'LeafIcon', color: '#22C55E', table_count: 3, tables: [
            { table_name: 'GAW900', table_description: '환경설비투자', module: '회계', column_count: 35, sample_columns: ['INV_NO', 'ENV_TYPE', 'INV_AMT', 'INV_DATE'] },
            { table_name: 'ENV200', table_description: '배출량관리', module: '환경', column_count: 28, sample_columns: ['EMIT_DATE', 'EMIT_TYPE', 'EMIT_QTY', 'LIMIT_QTY'] },
            { table_name: 'ENV300', table_description: '환경인증', module: '환경', column_count: 25, sample_columns: ['CERT_CD', 'CERT_TYPE', 'ISSUE_DATE', 'EXPIRE_DATE'] }
          ]},
          { code: 'ENERGY', name_ko: '에너지(Energy)', name_en: 'Energy', icon: 'BoltIcon', color: '#EAB308', table_count: 3, tables: [
            { table_name: 'FMP500', table_description: '에너지사용현황', module: '설비', column_count: 28, sample_columns: ['ENERGY_TYPE', 'USE_DATE', 'USE_QTY', 'UNIT'] },
            { table_name: 'FMP510', table_description: '전력사용량', module: '설비', column_count: 25, sample_columns: ['METER_CD', 'USE_DATE', 'KWH', 'PEAK_KW'] },
            { table_name: 'FMP520', table_description: '가스사용량', module: '설비', column_count: 22, sample_columns: ['METER_CD', 'USE_DATE', 'GAS_QTY', 'UNIT'] }
          ]}
        ]
      },
      {
        category_code: 'COST',
        category_name: '원가관리',
        level: 3,
        element_count: 5,
        elements: [
          { code: 'MATERIAL_COST', name_ko: '재료비', name_en: 'Material Cost', icon: 'PackageIcon', color: '#F59E0B', table_count: 4, tables: [
            { table_name: 'COS220_YH', table_description: '재료비집계', module: '원가', column_count: 42, sample_columns: ['COST_YM', 'ITEM_CD', 'MAT_AMT', 'UNIT_COST'] },
            { table_name: 'COS221', table_description: '직접재료비', module: '원가', column_count: 38, sample_columns: ['COST_YM', 'ITEM_CD', 'DIR_MAT', 'PROC_CD'] },
            { table_name: 'COS222', table_description: '간접재료비', module: '원가', column_count: 35, sample_columns: ['COST_YM', 'DEPT_CD', 'IND_MAT', 'ALLOC_CD'] },
            { table_name: 'COS223', table_description: '부재료비', module: '원가', column_count: 32, sample_columns: ['COST_YM', 'ITEM_CD', 'SUB_MAT', 'USAGE_QTY'] }
          ]},
          { code: 'LABOR_COST', name_ko: '노무비', name_en: 'Labor Cost', icon: 'UserIcon', color: '#3B82F6', table_count: 4, tables: [
            { table_name: 'COS310_YH', table_description: '노무비집계', module: '원가', column_count: 38, sample_columns: ['COST_YM', 'DEPT_CD', 'LABOR_AMT', 'WORK_HR'] },
            { table_name: 'COS311', table_description: '직접노무비', module: '원가', column_count: 35, sample_columns: ['COST_YM', 'WO_NO', 'DIR_LABOR', 'WORK_HR'] },
            { table_name: 'COS312', table_description: '간접노무비', module: '원가', column_count: 32, sample_columns: ['COST_YM', 'DEPT_CD', 'IND_LABOR', 'ALLOC_CD'] },
            { table_name: 'CAE200', table_description: '퇴직급여', module: '급여', column_count: 28, sample_columns: ['EMP_NO', 'RET_YM', 'RET_AMT', 'PROV_AMT'] }
          ]},
          { code: 'OVERHEAD', name_ko: '제조경비', name_en: 'Overhead', icon: 'SettingsIcon', color: '#10B981', table_count: 5, tables: [
            { table_name: 'COS410_YH', table_description: '경비집계', module: '원가', column_count: 45, sample_columns: ['COST_YM', 'DEPT_CD', 'EXP_CD', 'EXP_AMT'] },
            { table_name: 'COS411', table_description: '감가상각비', module: '원가', column_count: 32, sample_columns: ['COST_YM', 'ASSET_NO', 'DEP_AMT', 'DEP_TYPE'] },
            { table_name: 'COS412', table_description: '수선비', module: '원가', column_count: 28, sample_columns: ['COST_YM', 'EQUIP_CD', 'REP_AMT', 'REP_TYPE'] },
            { table_name: 'COS413', table_description: '전력비', module: '원가', column_count: 25, sample_columns: ['COST_YM', 'METER_CD', 'PWR_AMT', 'KWH'] },
            { table_name: 'COS414', table_description: '기타경비', module: '원가', column_count: 35, sample_columns: ['COST_YM', 'DEPT_CD', 'EXP_CD', 'EXP_AMT'] }
          ]},
          { code: 'OUTSOURCING', name_ko: '외주가공비', name_en: 'Outsourcing', icon: 'ZapIcon', color: '#8B5CF6', table_count: 3, tables: [
            { table_name: 'COS510_YH', table_description: '외주비집계', module: '원가', column_count: 38, sample_columns: ['COST_YM', 'VENDOR_CD', 'OUT_AMT', 'ITEM_CD'] },
            { table_name: 'DPO200', table_description: '외주발주', module: '구매', column_count: 45, sample_columns: ['OUT_NO', 'VENDOR_CD', 'ITEM_CD', 'OUT_QTY'] },
            { table_name: 'DPO210', table_description: '외주입고', module: '구매', column_count: 42, sample_columns: ['RCV_NO', 'OUT_NO', 'RCV_QTY', 'RCV_DATE'] }
          ]},
          { code: 'ALLOCATION', name_ko: '배부비용', name_en: 'Allocation', icon: 'SettingsIcon', color: '#EC4899', table_count: 3, tables: [
            { table_name: 'COS600_YH', table_description: '배부기준', module: '원가', column_count: 28, sample_columns: ['ALLOC_CD', 'ALLOC_TYPE', 'BASE_CD', 'RATE'] },
            { table_name: 'COS610', table_description: '부문별배부', module: '원가', column_count: 35, sample_columns: ['COST_YM', 'FROM_DEPT', 'TO_DEPT', 'ALLOC_AMT'] },
            { table_name: 'COS620', table_description: '제품별배부', module: '원가', column_count: 38, sample_columns: ['COST_YM', 'ITEM_CD', 'ALLOC_CD', 'ALLOC_AMT'] }
          ]}
        ]
      },
      {
        category_code: 'FINANCE',
        category_name: '재무관리',
        level: 4,
        element_count: 4,
        elements: [
          { code: 'INCOME_STMT', name_ko: '손익계산서', name_en: 'Income Statement', icon: 'SettingsIcon', color: '#3B82F6', table_count: 4, tables: [
            { table_name: 'GAL100', table_description: '전표마스터', module: '회계', column_count: 55, sample_columns: ['SLIP_NO', 'SLIP_DATE', 'DR_AMT', 'CR_AMT'] },
            { table_name: 'GAL200', table_description: '계정별원장', module: '회계', column_count: 48, sample_columns: ['ACCT_CD', 'PERIOD', 'BAL_AMT', 'DR_AMT'] },
            { table_name: 'GAR100', table_description: '손익계산서', module: '회계', column_count: 35, sample_columns: ['REPORT_YM', 'ACCT_CD', 'CUR_AMT', 'PRV_AMT'] },
            { table_name: 'GAR110', table_description: '매출원가명세', module: '회계', column_count: 32, sample_columns: ['REPORT_YM', 'COST_TYPE', 'CUR_AMT', 'PRV_AMT'] }
          ]},
          { code: 'BALANCE_SHEET', name_ko: '재무상태표', name_en: 'Balance Sheet', icon: 'SettingsIcon', color: '#10B981', table_count: 4, tables: [
            { table_name: 'GAR200', table_description: '재무상태표', module: '회계', column_count: 38, sample_columns: ['REPORT_YM', 'ACCT_CD', 'CUR_AMT', 'PRV_AMT'] },
            { table_name: 'GAF100', table_description: '고정자산대장', module: '회계', column_count: 65, sample_columns: ['ASSET_NO', 'ASSET_NM', 'ACQ_AMT', 'BOOK_VALUE'] },
            { table_name: 'GAD100', table_description: '채권관리', module: '회계', column_count: 42, sample_columns: ['AR_NO', 'CUST_CD', 'AR_AMT', 'DUE_DATE'] },
            { table_name: 'GAP100', table_description: '채무관리', module: '회계', column_count: 42, sample_columns: ['AP_NO', 'VENDOR_CD', 'AP_AMT', 'DUE_DATE'] }
          ]},
          { code: 'CASHFLOW', name_ko: '현금흐름표', name_en: 'Cash Flow', icon: 'SettingsIcon', color: '#F59E0B', table_count: 3, tables: [
            { table_name: 'GAR300', table_description: '현금흐름표', module: '회계', column_count: 35, sample_columns: ['REPORT_YM', 'CF_TYPE', 'CUR_AMT', 'PRV_AMT'] },
            { table_name: 'GAT100', table_description: '자금현황', module: '회계', column_count: 28, sample_columns: ['FUND_DATE', 'BANK_CD', 'FUND_AMT', 'FUND_TYPE'] },
            { table_name: 'GAT200', table_description: '자금계획', module: '회계', column_count: 32, sample_columns: ['PLAN_YM', 'PLAN_TYPE', 'IN_AMT', 'OUT_AMT'] }
          ]},
          { code: 'MGMT_ACCT', name_ko: '관리회계', name_en: 'Management Acct', icon: 'SettingsIcon', color: '#8B5CF6', table_count: 4, tables: [
            { table_name: 'GAW100', table_description: '예산관리', module: '회계', column_count: 45, sample_columns: ['BUDGET_YM', 'DEPT_CD', 'ACCT_CD', 'BUDGET_AMT'] },
            { table_name: 'GAW200', table_description: '예실대비', module: '회계', column_count: 42, sample_columns: ['PERIOD', 'DEPT_CD', 'BUDGET', 'ACTUAL'] },
            { table_name: 'GAW300', table_description: '손익분석', module: '회계', column_count: 38, sample_columns: ['ANAL_YM', 'ITEM_CD', 'PROFIT', 'MARGIN'] },
            { table_name: 'GAW400', table_description: 'KPI관리', module: '회계', column_count: 35, sample_columns: ['KPI_CD', 'KPI_NM', 'TARGET', 'ACTUAL'] }
          ]}
        ]
      },
      {
        category_code: 'ESG',
        category_name: 'ESG 경영',
        level: 5,
        element_count: 3,
        elements: [
          { code: 'ENV', name_ko: '환경(E)', name_en: 'Environment', icon: 'LeafIcon', color: '#22C55E', table_count: 5, tables: [
            { table_name: 'GAW990_Yuhan', table_description: '환경비용관리', module: '회계', column_count: 38, sample_columns: ['ENV_CD', 'ENV_TYPE', 'COST_AMT', 'REG_DATE'] },
            { table_name: 'FMP500', table_description: '에너지사용현황', module: '설비', column_count: 28, sample_columns: ['ENERGY_TYPE', 'USE_DATE', 'USE_QTY', 'UNIT'] },
            { table_name: 'ENV200', table_description: '탄소배출관리', module: '환경', column_count: 32, sample_columns: ['EMIT_DATE', 'EMIT_TYPE', 'CO2_TON', 'SCOPE'] },
            { table_name: 'ENV300', table_description: '환경인증관리', module: '환경', column_count: 28, sample_columns: ['CERT_CD', 'CERT_TYPE', 'ISSUE_DATE', 'STATUS'] },
            { table_name: 'ENV400', table_description: '재활용관리', module: '환경', column_count: 25, sample_columns: ['REC_DATE', 'WASTE_TYPE', 'REC_QTY', 'REC_RATE'] }
          ]},
          { code: 'SOCIAL', name_ko: '사회(S)', name_en: 'Social', icon: 'UserIcon', color: '#3B82F6', table_count: 4, tables: [
            { table_name: 'HRA100', table_description: '인사마스터', module: '인사', column_count: 120, sample_columns: ['EMP_NO', 'EMP_NAME', 'GENDER', 'HIRE_DATE'] },
            { table_name: 'QME200', table_description: '교육관리', module: '품질', column_count: 38, sample_columns: ['EDU_NO', 'EDU_NM', 'EMP_NO', 'EDU_DATE'] },
            { table_name: 'SAF100', table_description: '안전관리', module: '안전', column_count: 35, sample_columns: ['SAF_NO', 'SAF_TYPE', 'OCC_DATE', 'EMP_NO'] },
            { table_name: 'QMM600', table_description: '협력사관리', module: '품질', column_count: 42, sample_columns: ['VENDOR_CD', 'VENDOR_NM', 'GRADE', 'EVAL_DATE'] }
          ]},
          { code: 'GOVERNANCE', name_ko: '지배구조(G)', name_en: 'Governance', icon: 'SettingsIcon', color: '#8B5CF6', table_count: 4, tables: [
            { table_name: 'QMM630', table_description: '협력사평가', module: '품질', column_count: 45, sample_columns: ['EVAL_NO', 'VENDOR_CD', 'EVAL_SCORE', 'EVAL_DATE'] },
            { table_name: 'QMM640', table_description: '성과평가', module: '품질', column_count: 38, sample_columns: ['PERF_NO', 'DEPT_CD', 'KPI_CD', 'SCORE'] },
            { table_name: 'AUD100', table_description: '내부감사', module: '감사', column_count: 32, sample_columns: ['AUD_NO', 'AUD_TYPE', 'AUD_DATE', 'RESULT'] },
            { table_name: 'COM100', table_description: '준법관리', module: '준법', column_count: 28, sample_columns: ['COMP_CD', 'REG_TYPE', 'STATUS', 'CHECK_DATE'] }
          ]}
        ]
      }
    ];
    setFlowChain(flow);

    // 4M2E 영향도 데이터
    const impact: Record<string, Impact4M2E> = {
      man: { name: '인력(Man)', cost_ratio: 25.5, tables: ['HRA100', 'CAG100', 'CAE100'] },
      machine: { name: '설비(Machine)', cost_ratio: 18.3, tables: ['FMA100', 'CAG700', 'CAG750'] },
      material: { name: '자재(Material)', cost_ratio: 32.8, tables: ['DMA100', 'COS220_YH', 'COS400_YH'] },
      method: { name: '공법(Method)', cost_ratio: 12.4, tables: ['PPC100', 'COS310_YH', 'COS410_YH'] },
      environment: { name: '환경(Environment)', cost_ratio: 5.8, tables: ['GAW900', 'GAW990', 'QMM650'] },
      energy: { name: '에너지(Energy)', cost_ratio: 5.2, tables: ['FMP200', 'FMP500'] },
    };
    setImpact4M2E(impact);

    // ESG 데이터
    setEsgData({
      environment: { score: 82, tables: ['GAW990_Yuhan', 'FMP500', 'QMM650'] },
      social: { score: 78, tables: ['HRA100', 'QME200', 'PPC140_YH'] },
      governance: { score: 85, tables: ['QMM600', 'QMM630', 'QMM640'] },
      esg_score: 81.7,
    });

    setLoading(false);
  };

  // 플로우 다이어그램 렌더링
  const renderFlowDiagram = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6">
        6M → 4M2E → 원가 → 재무 → ESG 데이터 흐름
      </h3>

      <div className="flex items-start justify-between overflow-x-auto pb-4">
        {flowChain.map((category, idx) => (
          <React.Fragment key={category.category_code}>
            {/* 카테고리 박스 */}
            <div
              className={`flex-shrink-0 w-48 cursor-pointer transition-all duration-200 ${
                selectedCategory === category.category_code
                  ? 'transform scale-105'
                  : 'hover:transform hover:scale-102'
              }`}
              onClick={() => {
                setSelectedCategory(
                  selectedCategory === category.category_code ? null : category.category_code
                );
                setSelectedElement(null);
              }}
            >
              <div className={`rounded-lg border-2 p-4 ${
                selectedCategory === category.category_code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}>
                <div className="text-center mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    Level {category.level}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-800 text-center mb-2">
                  {category.category_name}
                </h4>
                <div className="text-xs text-gray-500 text-center mb-3">
                  {category.element_count}개 요소
                </div>

                {/* 요소 아이콘들 */}
                <div className="flex flex-wrap justify-center gap-1">
                  {category.elements.slice(0, 4).map((elem) => (
                    <div
                      key={elem.code}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: elem.color }}
                      title={elem.name_ko}
                    >
                      {getElementIcon(elem.icon, elem.color)}
                    </div>
                  ))}
                  {category.elements.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                      +{category.elements.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 화살표 */}
            {idx < flowChain.length - 1 && (
              <div className="flex-shrink-0 flex items-center px-2 pt-16">
                <ArrowRightIcon size={24} className="text-blue-500" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 선택된 카테고리 상세 */}
      {selectedCategory && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-4">
            {flowChain.find(c => c.category_code === selectedCategory)?.category_name} 상세
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {flowChain
              .find(c => c.category_code === selectedCategory)
              ?.elements.map((elem) => (
                <div
                  key={elem.code}
                  className={`bg-white rounded-lg p-3 border-2 cursor-pointer transition-all ${
                    selectedElement?.code === elem.code
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(selectedElement?.code === elem.code ? null : elem);
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto"
                    style={{ backgroundColor: elem.color }}
                  >
                    {getElementIcon(elem.icon, elem.color)}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-800">{elem.name_ko}</div>
                    <div className="text-xs text-gray-500">{elem.table_count}개 테이블</div>
                  </div>
                </div>
              ))}
          </div>

          {/* 선택된 요소의 ERP 테이블 상세 */}
          {selectedElement && (
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedElement.color }}
                >
                  {getElementIcon(selectedElement.icon, selectedElement.color)}
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-800">{selectedElement.name_ko}</h5>
                  <p className="text-sm text-gray-500">{selectedElement.name_en} - {selectedElement.table_count}개 ERP 테이블 연계</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">테이블명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">설명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">모듈</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">컬럼수</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">주요 컬럼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedElement.tables.map((table, idx) => (
                      <tr key={table.table_name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-mono text-blue-600 font-medium">{table.table_name}</td>
                        <td className="px-4 py-3 text-gray-800">{table.table_description}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {table.module}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{table.column_count || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {table.sample_columns?.map((col) => (
                              <span key={col} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-mono">
                                {col}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 데이터 흐름 설명 */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <DatabaseIcon size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>{selectedElement.name_ko}</strong> 데이터는 위 테이블들에서 수집되어
                    다음 레벨({selectedCategory === 'ESG' ? '최종 ESG 지표' : '상위 온톨로지'})로 집계됩니다.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 4M2E 영향도 분석 렌더링
  const render4M2EAnalysis = () => {
    const colors: Record<string, string> = {
      man: '#3B82F6',
      machine: '#10B981',
      material: '#F59E0B',
      method: '#8B5CF6',
      environment: '#22C55E',
      energy: '#EAB308',
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">4M2E 원가 영향도 분석</h3>

        {/* 도넛 차트 영역 */}
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 도넛 차트 시뮬레이션 */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {Object.entries(impact4M2E).reduce((acc, [key, value], idx) => {
                const prevTotal = Object.values(impact4M2E)
                  .slice(0, idx)
                  .reduce((sum, v) => sum + v.cost_ratio, 0);
                const circumference = 2 * Math.PI * 35;
                const offset = (prevTotal / 100) * circumference;
                const length = (value.cost_ratio / 100) * circumference;

                acc.push(
                  <circle
                    key={key}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke={colors[key]}
                    strokeWidth="20"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                  />
                );
                return acc;
              }, [] as JSX.Element[])}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">100%</span>
              <span className="text-sm text-gray-500">총 원가</span>
            </div>
          </div>

          {/* 범례 및 상세 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {Object.entries(impact4M2E).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[key] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {value.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {value.tables.length}개 테이블
                  </div>
                </div>
                <div className="text-lg font-bold" style={{ color: colors[key] }}>
                  {value.cost_ratio}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 테이블 목록 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-3">연계 ERP 테이블</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(impact4M2E).map(([key, value]) => (
              <div key={key} className="text-xs">
                <div className="font-medium text-gray-700 mb-1" style={{ color: colors[key] }}>
                  {value.name}
                </div>
                {value.tables.map((table) => (
                  <div key={table} className="text-gray-500 flex items-center gap-1">
                    <DatabaseIcon size={12} />
                    {table}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ESG 분석 렌더링
  const renderESGAnalysis = () => {
    if (!esgData) return null;

    const esgColors = {
      environment: '#22C55E',
      social: '#3B82F6',
      governance: '#8B5CF6',
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">원가 → ESG 영향 분석</h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ESG 종합 점수 */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="text-sm opacity-90 mb-2">ESG 종합 점수</div>
            <div className="text-5xl font-bold mb-2">{esgData.esg_score}</div>
            <div className="flex items-center text-sm">
              <TrendUpIcon size={16} className="mr-1" />
              전월 대비 +2.3점
            </div>
          </div>

          {/* E - 환경 */}
          <div className="bg-white border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <LeafIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Environment</div>
                <div className="text-lg font-bold text-gray-800">환경</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {esgData.environment.score}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${esgData.environment.score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              연계 테이블: {esgData.environment.tables.join(', ')}
            </div>
          </div>

          {/* S - 사회 */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <UserIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Social</div>
                <div className="text-lg font-bold text-gray-800">사회</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {esgData.social.score}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${esgData.social.score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              연계 테이블: {esgData.social.tables.join(', ')}
            </div>
          </div>

          {/* G - 지배구조 */}
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <SettingsIcon size={20} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Governance</div>
                <div className="text-lg font-bold text-gray-800">지배구조</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {esgData.governance.score}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${esgData.governance.score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              연계 테이블: {esgData.governance.tables.join(', ')}
            </div>
          </div>
        </div>

        {/* 원가 → ESG 연계 다이어그램 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-4">원가 요소 → ESG 영향 맵핑</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-green-600 mb-2">환경(E) 영향 요소</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 환경비용 (GAW990)</div>
                <div>• 에너지 비용 (FMP500)</div>
                <div>• 폐기물 처리비</div>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-blue-600 mb-2">사회(S) 영향 요소</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 노무비 (CAG100)</div>
                <div>• 교육비 (QME200)</div>
                <div>• 안전관리비</div>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-purple-600 mb-2">지배구조(G) 영향 요소</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 협력사 관리 (QMM600)</div>
                <div>• 평가/성과 (QMM630)</div>
                <div>• 감사비용</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ERD 다이어그램 렌더링
  const renderERD = () => {
    // ERD 테이블 데이터
    const erdTables: ERDTableNode[] = [
      // 인사/급여 모듈
      { id: 'HRA100', name: 'HRA100', description: '인사마스터', module: '인사', x: 50, y: 50, columns: [
        { name: 'EMP_NO', type: 'VARCHAR(20)', isPK: true },
        { name: 'EMP_NAME', type: 'VARCHAR(100)' },
        { name: 'DEPT_CD', type: 'VARCHAR(10)', isFK: true, fkRef: 'DPT100' },
        { name: 'POSITION', type: 'VARCHAR(20)' },
        { name: 'HIRE_DATE', type: 'DATE' },
        { name: 'STATUS', type: 'VARCHAR(10)' }
      ]},
      { id: 'CAG100', name: 'CAG100', description: '근태관리', module: '급여', x: 250, y: 50, columns: [
        { name: 'EMP_NO', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'HRA100' },
        { name: 'WORK_DATE', type: 'DATE', isPK: true },
        { name: 'IN_TIME', type: 'TIME' },
        { name: 'OUT_TIME', type: 'TIME' },
        { name: 'WORK_HOURS', type: 'DECIMAL(5,2)' }
      ]},
      { id: 'CAE100', name: 'CAE100', description: '급여정보', module: '급여', x: 450, y: 50, columns: [
        { name: 'EMP_NO', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'HRA100' },
        { name: 'PAY_YM', type: 'VARCHAR(6)', isPK: true },
        { name: 'BASE_PAY', type: 'DECIMAL(15,2)' },
        { name: 'ALLOW_AMT', type: 'DECIMAL(15,2)' },
        { name: 'DEDUCT_AMT', type: 'DECIMAL(15,2)' }
      ]},
      // 자재 모듈
      { id: 'DMA100', name: 'DMA100', description: '품목마스터', module: '자재', x: 50, y: 220, columns: [
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isPK: true },
        { name: 'ITEM_NM', type: 'VARCHAR(200)' },
        { name: 'ITEM_TYPE', type: 'VARCHAR(10)' },
        { name: 'UNIT', type: 'VARCHAR(10)' },
        { name: 'SAFE_QTY', type: 'DECIMAL(15,3)' }
      ]},
      { id: 'DMA200', name: 'DMA200', description: 'BOM마스터', module: '자재', x: 250, y: 220, columns: [
        { name: 'P_ITEM_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'DMA100' },
        { name: 'C_ITEM_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'DMA100' },
        { name: 'SEQ', type: 'INT', isPK: true },
        { name: 'QTY', type: 'DECIMAL(15,5)' },
        { name: 'LOSS_RATE', type: 'DECIMAL(5,2)' }
      ]},
      { id: 'DBB100', name: 'DBB100', description: '재고현황', module: '자재', x: 450, y: 220, columns: [
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'DMA100' },
        { name: 'WH_CD', type: 'VARCHAR(10)', isPK: true },
        { name: 'LOT_NO', type: 'VARCHAR(30)', isPK: true },
        { name: 'QTY', type: 'DECIMAL(15,3)' },
        { name: 'UNIT_COST', type: 'DECIMAL(15,2)' }
      ]},
      // 설비 모듈
      { id: 'FMA100', name: 'FMA100', description: '설비마스터', module: '설비', x: 50, y: 390, columns: [
        { name: 'EQUIP_CD', type: 'VARCHAR(20)', isPK: true },
        { name: 'EQUIP_NM', type: 'VARCHAR(200)' },
        { name: 'EQUIP_TYPE', type: 'VARCHAR(10)' },
        { name: 'INSTALL_DATE', type: 'DATE' },
        { name: 'STATUS', type: 'VARCHAR(10)' }
      ]},
      { id: 'FMB100', name: 'FMB100', description: '설비가동현황', module: '설비', x: 250, y: 390, columns: [
        { name: 'EQUIP_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'FMA100' },
        { name: 'WORK_DATE', type: 'DATE', isPK: true },
        { name: 'RUN_TIME', type: 'DECIMAL(5,2)' },
        { name: 'STOP_TIME', type: 'DECIMAL(5,2)' },
        { name: 'EFFICIENCY', type: 'DECIMAL(5,2)' }
      ]},
      // 생산 모듈
      { id: 'PPM100', name: 'PPM100', description: '생산지시', module: '생산', x: 450, y: 390, columns: [
        { name: 'WO_NO', type: 'VARCHAR(20)', isPK: true },
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isFK: true, fkRef: 'DMA100' },
        { name: 'WO_QTY', type: 'DECIMAL(15,3)' },
        { name: 'START_DATE', type: 'DATE' },
        { name: 'END_DATE', type: 'DATE' },
        { name: 'STATUS', type: 'VARCHAR(10)' }
      ]},
      { id: 'PPW100', name: 'PPW100', description: '작업실적', module: '생산', x: 650, y: 390, columns: [
        { name: 'WO_NO', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'PPM100' },
        { name: 'SEQ', type: 'INT', isPK: true },
        { name: 'EMP_NO', type: 'VARCHAR(20)', isFK: true, fkRef: 'HRA100' },
        { name: 'PROD_QTY', type: 'DECIMAL(15,3)' },
        { name: 'WORK_TIME', type: 'DECIMAL(5,2)' }
      ]},
      // 원가 모듈
      { id: 'COS220', name: 'COS220_YH', description: '재료비집계', module: '원가', x: 50, y: 560, columns: [
        { name: 'COST_YM', type: 'VARCHAR(6)', isPK: true },
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'DMA100' },
        { name: 'MAT_AMT', type: 'DECIMAL(15,2)' },
        { name: 'UNIT_COST', type: 'DECIMAL(15,4)' }
      ]},
      { id: 'COS310', name: 'COS310_YH', description: '노무비집계', module: '원가', x: 250, y: 560, columns: [
        { name: 'COST_YM', type: 'VARCHAR(6)', isPK: true },
        { name: 'DEPT_CD', type: 'VARCHAR(10)', isPK: true },
        { name: 'LABOR_AMT', type: 'DECIMAL(15,2)' },
        { name: 'WORK_HR', type: 'DECIMAL(10,2)' }
      ]},
      { id: 'COS400', name: 'COS400_YH', description: '원가계산', module: '원가', x: 450, y: 560, columns: [
        { name: 'COST_YM', type: 'VARCHAR(6)', isPK: true },
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isPK: true, isFK: true, fkRef: 'DMA100' },
        { name: 'MAT_COST', type: 'DECIMAL(15,2)' },
        { name: 'LAB_COST', type: 'DECIMAL(15,2)' },
        { name: 'EXP_COST', type: 'DECIMAL(15,2)' },
        { name: 'TOT_COST', type: 'DECIMAL(15,2)' }
      ]},
      // 회계 모듈
      { id: 'GAL100', name: 'GAL100', description: '전표마스터', module: '회계', x: 650, y: 560, columns: [
        { name: 'SLIP_NO', type: 'VARCHAR(20)', isPK: true },
        { name: 'SLIP_DATE', type: 'DATE' },
        { name: 'ACCT_CD', type: 'VARCHAR(10)' },
        { name: 'DR_AMT', type: 'DECIMAL(15,2)' },
        { name: 'CR_AMT', type: 'DECIMAL(15,2)' }
      ]},
      // 품질 모듈
      { id: 'QMM100', name: 'QMM100', description: '수입검사정보', module: '품질', x: 650, y: 220, columns: [
        { name: 'INS_NO', type: 'VARCHAR(20)', isPK: true },
        { name: 'ITEM_CD', type: 'VARCHAR(20)', isFK: true, fkRef: 'DMA100' },
        { name: 'LOT_NO', type: 'VARCHAR(30)' },
        { name: 'INS_QTY', type: 'DECIMAL(15,3)' },
        { name: 'INS_RESULT', type: 'VARCHAR(10)' }
      ]},
    ];

    // ERD 관계 데이터
    const erdRelations: ERDRelation[] = [
      { from: 'HRA100', to: 'CAG100', fromColumn: 'EMP_NO', toColumn: 'EMP_NO', type: '1:N' },
      { from: 'HRA100', to: 'CAE100', fromColumn: 'EMP_NO', toColumn: 'EMP_NO', type: '1:N' },
      { from: 'HRA100', to: 'PPW100', fromColumn: 'EMP_NO', toColumn: 'EMP_NO', type: '1:N' },
      { from: 'DMA100', to: 'DMA200', fromColumn: 'ITEM_CD', toColumn: 'P_ITEM_CD', type: '1:N' },
      { from: 'DMA100', to: 'DBB100', fromColumn: 'ITEM_CD', toColumn: 'ITEM_CD', type: '1:N' },
      { from: 'DMA100', to: 'PPM100', fromColumn: 'ITEM_CD', toColumn: 'ITEM_CD', type: '1:N' },
      { from: 'DMA100', to: 'COS220', fromColumn: 'ITEM_CD', toColumn: 'ITEM_CD', type: '1:N' },
      { from: 'DMA100', to: 'COS400', fromColumn: 'ITEM_CD', toColumn: 'ITEM_CD', type: '1:N' },
      { from: 'DMA100', to: 'QMM100', fromColumn: 'ITEM_CD', toColumn: 'ITEM_CD', type: '1:N' },
      { from: 'FMA100', to: 'FMB100', fromColumn: 'EQUIP_CD', toColumn: 'EQUIP_CD', type: '1:N' },
      { from: 'PPM100', to: 'PPW100', fromColumn: 'WO_NO', toColumn: 'WO_NO', type: '1:N' },
    ];

    const modules = ['all', '인사', '급여', '자재', '설비', '생산', '원가', '회계', '품질'];
    const moduleColors: Record<string, string> = {
      '인사': '#3B82F6',
      '급여': '#10B981',
      '자재': '#F59E0B',
      '설비': '#8B5CF6',
      '생산': '#EC4899',
      '원가': '#EF4444',
      '회계': '#6366F1',
      '품질': '#14B8A6',
    };

    const filteredTables = selectedERDModule === 'all'
      ? erdTables
      : erdTables.filter(t => t.module === selectedERDModule);

    const filteredRelations = erdRelations.filter(r => {
      if (selectedERDModule === 'all') return true;
      const fromTable = erdTables.find(t => t.id === r.from);
      const toTable = erdTables.find(t => t.id === r.to);
      return fromTable?.module === selectedERDModule || toTable?.module === selectedERDModule;
    });

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">ERD (Entity Relationship Diagram)</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">모듈 필터:</span>
            <select
              value={selectedERDModule}
              onChange={(e) => setSelectedERDModule(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {modules.map(m => (
                <option key={m} value={m}>{m === 'all' ? '전체' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 모듈 범례 */}
        <div className="flex flex-wrap gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          {Object.entries(moduleColors).map(([module, color]) => (
            <div key={module} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600">{module}</span>
            </div>
          ))}
        </div>

        {/* ERD 다이어그램 */}
        <div className="relative overflow-auto border border-gray-200 rounded-lg bg-gray-50" style={{ height: '700px' }}>
          <svg width="900" height="750" className="absolute top-0 left-0">
            {/* 관계선 */}
            {filteredRelations.map((rel, idx) => {
              const fromTable = filteredTables.find(t => t.id === rel.from);
              const toTable = filteredTables.find(t => t.id === rel.to);
              if (!fromTable || !toTable) return null;

              const fromX = fromTable.x + 90;
              const fromY = fromTable.y + 60;
              const toX = toTable.x + 90;
              const toY = toTable.y + 60;

              // 곡선 경로 계산
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2;
              const controlX = midX;
              const controlY = midY - 30;

              return (
                <g key={idx}>
                  <path
                    d={`M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray={rel.type === 'N:M' ? '5,5' : '0'}
                  />
                  {/* 관계 타입 표시 */}
                  <text x={midX} y={midY - 10} fontSize="10" fill="#64748B" textAnchor="middle">
                    {rel.type}
                  </text>
                  {/* 화살표 */}
                  <circle cx={toX} cy={toY} r="4" fill="#94A3B8" />
                </g>
              );
            })}
          </svg>

          {/* 테이블 박스들 */}
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="absolute bg-white rounded-lg shadow-md border-2 overflow-hidden"
              style={{
                left: table.x,
                top: table.y,
                width: '180px',
                borderColor: moduleColors[table.module] || '#E5E7EB',
              }}
            >
              {/* 테이블 헤더 */}
              <div
                className="px-3 py-2 text-white text-sm font-bold"
                style={{ backgroundColor: moduleColors[table.module] || '#6B7280' }}
              >
                <div className="flex items-center gap-2">
                  <DatabaseIcon size={14} />
                  <span>{table.name}</span>
                </div>
                <div className="text-xs opacity-80 mt-0.5">{table.description}</div>
              </div>
              {/* 컬럼 목록 */}
              <div className="divide-y divide-gray-100">
                {table.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 text-xs flex items-center justify-between ${
                      col.isPK ? 'bg-yellow-50' : col.isFK ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.isPK && <span className="text-yellow-600 font-bold">PK</span>}
                      {col.isFK && <span className="text-blue-600 font-bold">FK</span>}
                      <span className={`font-mono ${col.isPK ? 'font-bold text-gray-800' : 'text-gray-700'}`}>
                        {col.name}
                      </span>
                    </div>
                    <span className="text-gray-400 text-[10px]">{col.type.split('(')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ERD 통계 */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredTables.length}</div>
            <div className="text-sm text-blue-800">테이블 수</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{filteredRelations.length}</div>
            <div className="text-sm text-green-800">관계 수</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {filteredTables.reduce((sum, t) => sum + t.columns.length, 0)}
            </div>
            <div className="text-sm text-purple-800">총 컬럼 수</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredTables.reduce((sum, t) => sum + t.columns.filter(c => c.isPK).length, 0)}
            </div>
            <div className="text-sm text-orange-800">Primary Key 수</div>
          </div>
        </div>

        {/* 테이블 상세 목록 */}
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">테이블 상세 정보</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">테이블명</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">설명</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">모듈</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">컬럼수</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Primary Key</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Foreign Keys</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map((table, idx) => (
                  <tr key={table.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-mono text-blue-600 font-medium">{table.name}</td>
                    <td className="px-4 py-2 text-gray-800">{table.description}</td>
                    <td className="px-4 py-2">
                      <span
                        className="px-2 py-1 text-white text-xs rounded-full"
                        style={{ backgroundColor: moduleColors[table.module] || '#6B7280' }}
                      >
                        {table.module}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-gray-600">{table.columns.length}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {table.columns.filter(c => c.isPK).map(c => (
                          <span key={c.name} className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-mono">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {table.columns.filter(c => c.isFK && !c.isPK).map(c => (
                          <span key={c.name} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-mono">
                            {c.name} → {c.fkRef}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">온톨로지 분석</h2>
        <p className="text-blue-100">
          6M → 4M2E → 원가 → 재무 → ESG 통합 데이터 흐름 분석
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        {categorySummary.map((cat) => (
          <div
            key={cat.code}
            className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedCategory(cat.code)}
          >
            <div className="text-xs text-gray-500 mb-1">Level {cat.level}</div>
            <div className="text-lg font-bold text-gray-800">{cat.name}</div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-blue-600">{cat.element_count}개 요소</span>
              <span className="text-green-600">{cat.table_count}개 테이블</span>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow p-1 inline-flex">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'flow'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          데이터 흐름
        </button>
        <button
          onClick={() => setActiveTab('4m2e')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === '4m2e'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          4M2E 분석
        </button>
        <button
          onClick={() => setActiveTab('esg')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'esg'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ESG 연계
        </button>
        <button
          onClick={() => setActiveTab('erd')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'erd'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ERD
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          {activeTab === 'flow' && renderFlowDiagram()}
          {activeTab === '4m2e' && render4M2EAnalysis()}
          {activeTab === 'esg' && renderESGAnalysis()}
          {activeTab === 'erd' && renderERD()}
        </>
      )}
    </div>
  );
};

export default Ontology;
