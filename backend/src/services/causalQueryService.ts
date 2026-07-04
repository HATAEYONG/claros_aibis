/**
 * Causal Query Service
 * 원인-결과 분석을 위한 DB 조회 서비스
 * 6M 관점에서 데이터를 수집하여 원인 분석 지원
 */

import { query } from '../config/database';

// 분석 결과 인터페이스
export interface CausalQueryResult {
  category: string;
  subcategory: string;
  data: any[];
  insights: string[];
}

/**
 * Man (인적요인) 관련 데이터 조회
 */
export async function queryManFactors(lotNo?: string, dateRange?: { start: string; end: string }): Promise<CausalQueryResult> {
  const insights: string[] = [];
  let data: any[] = [];

  try {
    // 1. 작업자별 불량률 조회
    let sql = `
      SELECT
        e.emp_id,
        e.emp_name,
        d.dept_name,
        COUNT(DISTINCT w.wo_no) as work_count,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) as defect_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as defect_rate
      FROM HR_EMPLOYEE e
      LEFT JOIN HR_DEPARTMENT d ON e.dept_code = d.dept_code
      LEFT JOIN PP_WORK_ORDER w ON e.emp_id = w.worker_id
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
    `;

    const params: any[] = [];
    if (lotNo) {
      sql += ` WHERE w.lot_no = ?`;
      params.push(lotNo);
    } else if (dateRange) {
      sql += ` WHERE w.start_date BETWEEN ? AND ?`;
      params.push(dateRange.start, dateRange.end);
    }

    sql += ` GROUP BY e.emp_id, e.emp_name, d.dept_name ORDER BY defect_rate DESC LIMIT 10`;

    data = await query<any[]>(sql, params);

    // 인사이트 생성
    if (data.length > 0) {
      const highDefectWorkers = data.filter((d: any) => d.defect_rate > 5);
      if (highDefectWorkers.length > 0) {
        insights.push(`불량률 5% 이상 작업자 ${highDefectWorkers.length}명 발견 - 추가 교육 필요`);
      }
    }

  } catch (error) {
    console.log('Man factors query - tables may not exist');
  }

  return {
    category: '6M',
    subcategory: 'Man (인적요인)',
    data,
    insights
  };
}

/**
 * Machine (설비) 관련 데이터 조회
 */
export async function queryMachineFactors(lotNo?: string, dateRange?: { start: string; end: string }): Promise<CausalQueryResult> {
  const insights: string[] = [];
  let data: any[] = [];

  try {
    // 1. 설비별 고장 이력 조회
    let sql = `
      SELECT
        eq.equip_code,
        eq.equip_name,
        eq.status,
        COUNT(m.maint_id) as maintenance_count,
        SUM(m.downtime_hours) as total_downtime,
        MAX(m.maint_date) as last_maintenance
      FROM PM_EQUIPMENT eq
      LEFT JOIN PM_MAINTENANCE m ON eq.equip_code = m.equip_code
    `;

    const params: any[] = [];
    if (dateRange) {
      sql += ` WHERE m.maint_date BETWEEN ? AND ?`;
      params.push(dateRange.start, dateRange.end);
    }

    sql += ` GROUP BY eq.equip_code, eq.equip_name, eq.status ORDER BY total_downtime DESC LIMIT 10`;

    data = await query<any[]>(sql, params);

    // 인사이트 생성
    if (data.length > 0) {
      const highDowntime = data.filter((d: any) => d.total_downtime > 24);
      if (highDowntime.length > 0) {
        insights.push(`다운타임 24시간 초과 설비 ${highDowntime.length}대 - 점검 필요`);
      }
    }

  } catch (error) {
    console.log('Machine factors query - tables may not exist');
  }

  return {
    category: '6M',
    subcategory: 'Machine (설비)',
    data,
    insights
  };
}

/**
 * Material (자재) 관련 데이터 조회
 */
export async function queryMaterialFactors(lotNo?: string, dateRange?: { start: string; end: string }): Promise<CausalQueryResult> {
  const insights: string[] = [];
  let data: any[] = [];

  try {
    // 1. 자재별 불량 연관 조회
    let sql = `
      SELECT
        m.mat_code,
        m.mat_name,
        m.supplier_code,
        s.supplier_name,
        COUNT(d.defect_id) as defect_count,
        SUM(d.defect_qty) as defect_qty
      FROM MM_MATERIAL m
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      LEFT JOIN QM_DEFECT d ON m.lot_no = d.lot_no
    `;

    const params: any[] = [];
    if (lotNo) {
      sql += ` WHERE m.lot_no = ? OR m.prod_lot_no = ?`;
      params.push(lotNo, lotNo);
    } else if (dateRange) {
      sql += ` WHERE m.receive_date BETWEEN ? AND ?`;
      params.push(dateRange.start, dateRange.end);
    }

    sql += ` GROUP BY m.mat_code, m.mat_name, m.supplier_code, s.supplier_name ORDER BY defect_count DESC LIMIT 10`;

    data = await query<any[]>(sql, params);

    // 인사이트 생성
    if (data.length > 0) {
      const problemMaterials = data.filter((d: any) => d.defect_count > 0);
      if (problemMaterials.length > 0) {
        insights.push(`불량 연관 자재 ${problemMaterials.length}건 - 입고검사 강화 필요`);
      }
    }

  } catch (error) {
    console.log('Material factors query - tables may not exist');
  }

  return {
    category: '6M',
    subcategory: 'Material (자재)',
    data,
    insights
  };
}

/**
 * Method (방법) 관련 데이터 조회
 */
export async function queryMethodFactors(lotNo?: string): Promise<CausalQueryResult> {
  const insights: string[] = [];
  let data: any[] = [];

  try {
    // 공정별 불량률 조회
    const sql = `
      SELECT
        w.process_code,
        w.process_name,
        COUNT(*) as total_count,
        SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) as fail_count,
        ROUND(SUM(CASE WHEN q.result = 'FAIL' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as fail_rate
      FROM PP_WORK_ORDER w
      LEFT JOIN QM_INSPECTION q ON w.lot_no = q.lot_no
      GROUP BY w.process_code, w.process_name
      ORDER BY fail_rate DESC
      LIMIT 10
    `;

    data = await query<any[]>(sql, []);

    // 인사이트 생성
    if (data.length > 0) {
      const highFailProcess = data.filter((d: any) => d.fail_rate > 3);
      if (highFailProcess.length > 0) {
        insights.push(`불량률 3% 초과 공정 ${highFailProcess.length}건 - 작업표준 검토 필요`);
      }
    }

  } catch (error) {
    console.log('Method factors query - tables may not exist');
  }

  return {
    category: '6M',
    subcategory: 'Method (방법)',
    data,
    insights
  };
}

/**
 * Measurement (측정) 관련 데이터 조회
 */
export async function queryMeasurementFactors(dateRange?: { start: string; end: string }): Promise<CausalQueryResult> {
  const insights: string[] = [];
  let data: any[] = [];

  try {
    // 검사 유형별 결과 조회
    let sql = `
      SELECT
        insp_type as inspection_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as fail_count,
        ROUND(AVG(pass_rate), 2) as avg_pass_rate
      FROM QM_INSPECTION
    `;

    const params: any[] = [];
    if (dateRange) {
      sql += ` WHERE insp_date BETWEEN ? AND ?`;
      params.push(dateRange.start, dateRange.end);
    }

    sql += ` GROUP BY insp_type ORDER BY fail_count DESC`;

    data = await query<any[]>(sql, params);

  } catch (error) {
    console.log('Measurement factors query - tables may not exist');
  }

  return {
    category: '6M',
    subcategory: 'Measurement (측정)',
    data,
    insights
  };
}

/**
 * 종합 6M 분석 조회
 */
export async function queryCausalAnalysis(lotNo?: string, dateRange?: { start: string; end: string }): Promise<{
  man: CausalQueryResult;
  machine: CausalQueryResult;
  material: CausalQueryResult;
  method: CausalQueryResult;
  measurement: CausalQueryResult;
  summary: string[];
}> {
  const man = await queryManFactors(lotNo, dateRange);
  const machine = await queryMachineFactors(lotNo, dateRange);
  const material = await queryMaterialFactors(lotNo, dateRange);
  const method = await queryMethodFactors(lotNo);
  const measurement = await queryMeasurementFactors(dateRange);

  // 종합 요약
  const summary: string[] = [];
  const allInsights = [
    ...man.insights,
    ...machine.insights,
    ...material.insights,
    ...method.insights,
    ...measurement.insights
  ];

  if (allInsights.length > 0) {
    summary.push(`총 ${allInsights.length}건의 주요 이슈가 발견되었습니다.`);
    summary.push(...allInsights);
  } else {
    summary.push('특이사항 없음');
  }

  return {
    man,
    machine,
    material,
    method,
    measurement,
    summary
  };
}

/**
 * 불량 유형별 원인 분석
 */
export async function queryDefectCauses(defectType: string): Promise<any> {
  try {
    const sql = `
      SELECT
        d.defect_type,
        d.cause,
        COUNT(*) as occurrence_count,
        GROUP_CONCAT(DISTINCT d.action) as actions_taken
      FROM QM_DEFECT d
      WHERE d.defect_type LIKE ?
      GROUP BY d.defect_type, d.cause
      ORDER BY occurrence_count DESC
      LIMIT 20
    `;

    const data = await query<any[]>(sql, [`%${defectType}%`]);
    return {
      defectType,
      causes: data,
      totalOccurrences: data.reduce((sum: number, d: any) => sum + d.occurrence_count, 0)
    };

  } catch (error) {
    console.log('Defect causes query error');
    return { defectType, causes: [], totalOccurrences: 0 };
  }
}
