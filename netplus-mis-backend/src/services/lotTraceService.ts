/**
 * Lot Trace Service
 * 로트 추적 및 원인 분석을 위한 실제 DB 조회 서비스
 */

import { query } from '../config/database';

// 로트 추적 결과 인터페이스
export interface LotTraceResult {
  lotNo: string;
  productInfo?: ProductInfo;
  materialInfo?: MaterialInfo[];
  processInfo?: ProcessInfo[];
  qualityInfo?: QualityInfo[];
  equipmentInfo?: EquipmentInfo[];
  workerInfo?: WorkerInfo[];
  defectInfo?: DefectInfo[];
  traceHistory: TraceHistoryItem[];
}

export interface ProductInfo {
  productCode: string;
  productName: string;
  specification?: string;
  quantity: number;
  productionDate: string;
  lineCode?: string;
}

export interface MaterialInfo {
  materialCode: string;
  materialName: string;
  lotNo: string;
  supplierCode?: string;
  supplierName?: string;
  receiveDate: string;
  quantity: number;
}

export interface ProcessInfo {
  processCode: string;
  processName: string;
  startTime: string;
  endTime?: string;
  workerName?: string;
  equipmentCode?: string;
  equipmentName?: string;
  status: string;
}

export interface QualityInfo {
  inspectionId: string;
  inspectionType: string;
  inspectionDate: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  inspector?: string;
  defectType?: string;
  defectQty?: number;
}

export interface EquipmentInfo {
  equipmentCode: string;
  equipmentName: string;
  equipmentType?: string;
  status: string;
  lastMaintenance?: string;
  operatingHours?: number;
}

export interface WorkerInfo {
  workerId: string;
  workerName: string;
  department?: string;
  shift?: string;
  skillLevel?: string;
}

export interface DefectInfo {
  defectId: string;
  defectType: string;
  defectDate: string;
  quantity: number;
  cause?: string;
  action?: string;
  status: string;
}

export interface TraceHistoryItem {
  timestamp: string;
  event: string;
  description: string;
  relatedTable?: string;
  relatedId?: string;
}

/**
 * 로트 번호로 전체 추적 정보 조회
 */
export async function traceLot(lotNo: string): Promise<LotTraceResult> {
  const result: LotTraceResult = {
    lotNo,
    traceHistory: []
  };

  try {
    // 1. 생산 정보 조회 (PP_PRODUCTION 또는 유사 테이블)
    const productionData = await queryProductionByLot(lotNo);
    if (productionData) {
      result.productInfo = productionData;
      result.traceHistory.push({
        timestamp: productionData.productionDate,
        event: '생산',
        description: `${productionData.productName} ${productionData.quantity}개 생산`,
        relatedTable: 'PP_PRODUCTION'
      });
    }

    // 2. 자재/원자재 정보 조회
    const materialData = await queryMaterialByLot(lotNo);
    if (materialData.length > 0) {
      result.materialInfo = materialData;
      materialData.forEach(mat => {
        result.traceHistory.push({
          timestamp: mat.receiveDate,
          event: '자재입고',
          description: `${mat.materialName} (LOT: ${mat.lotNo}) 입고`,
          relatedTable: 'MM_MATERIAL'
        });
      });
    }

    // 3. 공정 정보 조회
    const processData = await queryProcessByLot(lotNo);
    if (processData.length > 0) {
      result.processInfo = processData;
      processData.forEach(proc => {
        result.traceHistory.push({
          timestamp: proc.startTime,
          event: '공정',
          description: `${proc.processName} 공정 수행 (${proc.status})`,
          relatedTable: 'PP_WORK_ORDER'
        });
      });
    }

    // 4. 품질검사 정보 조회
    const qualityData = await queryQualityByLot(lotNo);
    if (qualityData.length > 0) {
      result.qualityInfo = qualityData;
      qualityData.forEach(qc => {
        result.traceHistory.push({
          timestamp: qc.inspectionDate,
          event: '품질검사',
          description: `${qc.inspectionType} 검사 - ${qc.result}`,
          relatedTable: 'QM_INSPECTION'
        });
      });
    }

    // 5. 설비 정보 조회
    const equipmentData = await queryEquipmentByLot(lotNo);
    if (equipmentData.length > 0) {
      result.equipmentInfo = equipmentData;
    }

    // 6. 작업자 정보 조회
    const workerData = await queryWorkerByLot(lotNo);
    if (workerData.length > 0) {
      result.workerInfo = workerData;
    }

    // 7. 불량 정보 조회
    const defectData = await queryDefectByLot(lotNo);
    if (defectData.length > 0) {
      result.defectInfo = defectData;
      defectData.forEach(def => {
        result.traceHistory.push({
          timestamp: def.defectDate,
          event: '불량발생',
          description: `${def.defectType} 불량 ${def.quantity}건`,
          relatedTable: 'QM_DEFECT'
        });
      });
    }

    // 시간순 정렬
    result.traceHistory.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  } catch (error) {
    console.error('Lot trace error:', error);
  }

  return result;
}

/**
 * 생산 정보 조회
 */
async function queryProductionByLot(lotNo: string): Promise<ProductInfo | null> {
  try {
    // 실제 테이블 구조에 맞게 조정 필요
    const sql = `
      SELECT
        prod_code as productCode,
        prod_name as productName,
        spec as specification,
        qty as quantity,
        prod_date as productionDate,
        line_code as lineCode
      FROM PP_PRODUCTION
      WHERE lot_no = ? OR prod_id LIKE ?
      LIMIT 1
    `;
    const results = await query<any[]>(sql, [lotNo, `%${lotNo}%`]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.log('Production query - table may not exist, using mock data');
    return null;
  }
}

/**
 * 자재 정보 조회
 */
async function queryMaterialByLot(lotNo: string): Promise<MaterialInfo[]> {
  try {
    const sql = `
      SELECT
        m.mat_code as materialCode,
        m.mat_name as materialName,
        m.lot_no as lotNo,
        m.supplier_code as supplierCode,
        s.supplier_name as supplierName,
        m.receive_date as receiveDate,
        m.qty as quantity
      FROM MM_MATERIAL m
      LEFT JOIN MM_SUPPLIER s ON m.supplier_code = s.supplier_code
      WHERE m.lot_no = ? OR m.prod_lot_no = ?
    `;
    return await query<MaterialInfo[]>(sql, [lotNo, lotNo]);
  } catch (error) {
    console.log('Material query - table may not exist');
    return [];
  }
}

/**
 * 공정 정보 조회
 */
async function queryProcessByLot(lotNo: string): Promise<ProcessInfo[]> {
  try {
    const sql = `
      SELECT
        w.wo_no as processCode,
        w.wo_name as processName,
        w.start_date as startTime,
        w.end_date as endTime,
        e.emp_name as workerName,
        eq.equip_code as equipmentCode,
        eq.equip_name as equipmentName,
        w.status
      FROM PP_WORK_ORDER w
      LEFT JOIN HR_EMPLOYEE e ON w.worker_id = e.emp_id
      LEFT JOIN PM_EQUIPMENT eq ON w.equip_code = eq.equip_code
      WHERE w.lot_no = ?
      ORDER BY w.start_date
    `;
    return await query<ProcessInfo[]>(sql, [lotNo]);
  } catch (error) {
    console.log('Process query - table may not exist');
    return [];
  }
}

/**
 * 품질검사 정보 조회
 */
async function queryQualityByLot(lotNo: string): Promise<QualityInfo[]> {
  try {
    const sql = `
      SELECT
        insp_id as inspectionId,
        insp_type as inspectionType,
        insp_date as inspectionDate,
        CASE WHEN pass_rate >= 100 THEN 'PASS'
             WHEN pass_rate < 100 AND fail_qty > 0 THEN 'FAIL'
             ELSE 'PENDING' END as result,
        inspector,
        defect_type as defectType,
        fail_qty as defectQty
      FROM QM_INSPECTION
      WHERE lot_no = ?
      ORDER BY insp_date
    `;
    return await query<QualityInfo[]>(sql, [lotNo]);
  } catch (error) {
    console.log('Quality query - table may not exist');
    return [];
  }
}

/**
 * 설비 정보 조회
 */
async function queryEquipmentByLot(lotNo: string): Promise<EquipmentInfo[]> {
  try {
    const sql = `
      SELECT DISTINCT
        eq.equip_code as equipmentCode,
        eq.equip_name as equipmentName,
        eq.equip_type as equipmentType,
        eq.status,
        m.maint_date as lastMaintenance,
        eq.operating_hours as operatingHours
      FROM PM_EQUIPMENT eq
      LEFT JOIN PM_MAINTENANCE m ON eq.equip_code = m.equip_code
      INNER JOIN PP_WORK_ORDER w ON eq.equip_code = w.equip_code
      WHERE w.lot_no = ?
    `;
    return await query<EquipmentInfo[]>(sql, [lotNo]);
  } catch (error) {
    console.log('Equipment query - table may not exist');
    return [];
  }
}

/**
 * 작업자 정보 조회
 */
async function queryWorkerByLot(lotNo: string): Promise<WorkerInfo[]> {
  try {
    const sql = `
      SELECT DISTINCT
        e.emp_id as workerId,
        e.emp_name as workerName,
        d.dept_name as department,
        a.shift,
        e.skill_level as skillLevel
      FROM HR_EMPLOYEE e
      LEFT JOIN HR_DEPARTMENT d ON e.dept_code = d.dept_code
      LEFT JOIN HR_ATTENDANCE a ON e.emp_id = a.emp_id
      INNER JOIN PP_WORK_ORDER w ON e.emp_id = w.worker_id
      WHERE w.lot_no = ?
    `;
    return await query<WorkerInfo[]>(sql, [lotNo]);
  } catch (error) {
    console.log('Worker query - table may not exist');
    return [];
  }
}

/**
 * 불량 정보 조회
 */
async function queryDefectByLot(lotNo: string): Promise<DefectInfo[]> {
  try {
    const sql = `
      SELECT
        defect_id as defectId,
        defect_type as defectType,
        defect_date as defectDate,
        defect_qty as quantity,
        cause,
        action,
        status
      FROM QM_DEFECT
      WHERE lot_no = ?
      ORDER BY defect_date
    `;
    return await query<DefectInfo[]>(sql, [lotNo]);
  } catch (error) {
    console.log('Defect query - table may not exist');
    return [];
  }
}

/**
 * 특정 기간 불량 현황 조회
 */
export async function getDefectSummary(startDate: string, endDate: string): Promise<any[]> {
  try {
    const sql = `
      SELECT
        defect_type as defectType,
        COUNT(*) as count,
        SUM(defect_qty) as totalQty
      FROM QM_DEFECT
      WHERE defect_date BETWEEN ? AND ?
      GROUP BY defect_type
      ORDER BY count DESC
    `;
    return await query<any[]>(sql, [startDate, endDate]);
  } catch (error) {
    console.log('Defect summary query error');
    return [];
  }
}

/**
 * 설비 가동 현황 조회
 */
export async function getEquipmentStatus(): Promise<any[]> {
  try {
    const sql = `
      SELECT
        equip_code as equipmentCode,
        equip_name as equipmentName,
        status,
        location
      FROM PM_EQUIPMENT
      ORDER BY equip_code
    `;
    return await query<any[]>(sql, []);
  } catch (error) {
    console.log('Equipment status query error');
    return [];
  }
}

/**
 * 일별 생산 실적 조회
 */
export async function getDailyProduction(date: string): Promise<any[]> {
  try {
    const sql = `
      SELECT
        prod_date as productionDate,
        line_code as lineCode,
        SUM(plan_qty) as planQty,
        SUM(good_qty) as goodQty,
        SUM(defect_qty) as defectQty,
        AVG(yield_rate) as yieldRate
      FROM PP_PRODUCTION
      WHERE prod_date = ?
      GROUP BY prod_date, line_code
    `;
    return await query<any[]>(sql, [date]);
  } catch (error) {
    console.log('Daily production query error');
    return [];
  }
}
