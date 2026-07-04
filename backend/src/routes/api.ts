/**
 * API Routes
 * REST API 엔드포인트 정의
 */

import { Router, Request, Response } from 'express';
import { testConnection, query, getTables, getTableSchema } from '../config/database';
import { traceLot, getDefectSummary, getEquipmentStatus, getDailyProduction } from '../services/lotTraceService';
import { queryCausalAnalysis, queryDefectCauses } from '../services/causalQueryService';

const router = Router();

// =====================================================
// 시스템 API
// =====================================================

/**
 * 헬스체크
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * DB 연결 테스트
 */
router.get('/db/test', async (req: Request, res: Response) => {
  try {
    const connected = await testConnection();
    res.json({ connected, message: connected ? 'Database connected' : 'Connection failed' });
  } catch (error: any) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

/**
 * 테이블 목록 조회
 */
router.get('/db/tables', async (req: Request, res: Response) => {
  try {
    const tables = await getTables();
    res.json({ tables, count: tables.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 테이블 스키마 조회
 */
router.get('/db/schema/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const schema = await getTableSchema(tableName);
    res.json({ tableName, schema });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 로트 추적 API
// =====================================================

/**
 * 로트 추적 조회
 */
router.get('/lot/trace/:lotNo', async (req: Request, res: Response) => {
  try {
    const { lotNo } = req.params;
    const result = await traceLot(lotNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 원인 분석 API
// =====================================================

/**
 * 6M 종합 원인 분석
 */
router.get('/analysis/causal', async (req: Request, res: Response) => {
  try {
    const { lotNo, startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { start: startDate as string, end: endDate as string }
      : undefined;
    const result = await queryCausalAnalysis(lotNo as string | undefined, dateRange);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 불량 유형별 원인 분석
 */
router.get('/analysis/defect/:defectType', async (req: Request, res: Response) => {
  try {
    const { defectType } = req.params;
    const result = await queryDefectCauses(defectType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 대시보드 데이터 API
// =====================================================

/**
 * 불량 현황 요약
 */
router.get('/dashboard/defects', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const result = await getDefectSummary(
      (startDate as string) || today,
      (endDate as string) || today
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 설비 가동 현황
 */
router.get('/dashboard/equipment', async (req: Request, res: Response) => {
  try {
    const result = await getEquipmentStatus();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 일별 생산 실적
 */
router.get('/dashboard/production', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const result = await getDailyProduction((date as string) || today);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// SQL 실행 API (Text-to-SQL 연동용)
// =====================================================

/**
 * SQL 쿼리 실행 (읽기 전용)
 */
router.post('/sql/execute', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;

    // 보안: SELECT 문만 허용
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      return res.status(403).json({ error: 'Only SELECT queries are allowed' });
    }

    // 위험한 키워드 체크
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE'];
    for (const keyword of dangerousKeywords) {
      if (trimmedSql.includes(keyword)) {
        return res.status(403).json({ error: `Forbidden keyword: ${keyword}` });
      }
    }

    const result = await query<any[]>(sql, []);
    res.json({
      success: true,
      data: result,
      rowCount: result.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
