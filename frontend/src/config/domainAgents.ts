// 도메인 에이전트 타입 정의
export interface DomainAgentConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  apiEndpoints: {
    base: string;
    endpoints: Record<string, string>;
  };
  prompts: {
    system: string;
    analysis: string;
    recommendation: string;
  };
  dataSources: string[];
  outputFormats: string[];
}

// 도메인 에이전트 구성
export const domainAgentsConfig: DomainAgentConfig[] = [
  {
    id: 'cost',
    name: 'Cost Intelligence',
    category: '도메인',
    description: '원가 분석 및 4M2E 분석 전문가',
    icon: 'DollarSign',
    color: 'blue',
    capabilities: [
      '원가 구조 분석',
      '4M2E 코스 분석',
      '원가 절감 기회 발굴',
      '원가 변동 요인 분석',
      '표준 원가 분석',
      'ABC 원가 분석',
      '코스 드라이버 분석'
    ],
    apiEndpoints: {
      base: '/api/cost-analysis',
      endpoints: {
        costStructure: '/cost-structure',
        costBreakdown: '/cost-breakdown',
        costDriver: '/cost-driver',
        costComparison: '/cost-comparison',
        costTrends: '/cost-trends',
        savingsOpportunities: '/savings-opportunities',
        standardCost: '/standard-cost',
        abcCost: '/abc-cost'
      }
    },
    prompts: {
      system: '당신은 원가 분석 전문가입니다. 4M2E(Man, Machine, Material, Method, Measurement, Environment) 방법론을 사용하여 원가 구조를 분석하고 개선 기회를 제시합니다.',
      analysis: '현재 원가 데이터를 분석하여 주요 원가 요소별 변동 추이와 원인을 파악합니다.',
      recommendation: '원가 절감을 위한 구체적이고 실행 가능한 추천 사항을 제시합니다.'
    },
    dataSources: [
      'ERP 원가 데이터',
      'MES 공정 데이터',
      '구매 관리 시스템',
      '재무 회계 시스템',
      'BOM(Bill of Materials)',
      '작업 표준서'
    ],
    outputFormats: [
      '원가 구조 테이블',
      '4M2E 분석 리포트',
      '원가 추이 차트',
      '절감 기회 매트릭스',
      '코스 드라이버 분석'
    ]
  },
  {
    id: 'quality',
    name: 'Quality Intelligence',
    category: '도메인',
    description: '품질 분석 및 불량 원인 규명 전문가',
    icon: 'CheckCircle',
    color: 'green',
    capabilities: [
      '불량률 분석',
      '품질 추이 모니터링',
      '원인 규명',
      '특성 요인도 분석',
      '파레토 분석',
      '품질 코스트 분석',
      '공정 능력 분석',
      'SPC 통계적 공정 관리'
    ],
    apiEndpoints: {
      base: '/api/quality-analysis',
      endpoints: {
        defectRate: '/defect-rate',
        defectTrends: '/defect-trends',
        rootCause: '/root-cause',
        paretoAnalysis: '/pareto-analysis',
        processCapability: '/process-capability',
        qualityCost: '/quality-cost',
        spcAnalysis: '/spc-analysis',
        qualityAlerts: '/quality-alerts'
      }
    },
    prompts: {
      system: '당신은 품질 분석 전문가입니다. 통계적 방법론을 사용하여 품질 문제를 분석하고 근본 원인을 규명합니다.',
      analysis: '품질 데이터를 분석하여 불량 패턴, 원인, 추이를 파악합니다.',
      recommendation: '품질 개선을 위한 구체적이고 과학적인 추천 사항을 제시합니다.'
    },
    dataSources: [
      'QMS 품질 데이터',
      '검사 리포트',
      '불량 원인 분석 DB',
      'SOP 표준 작업 절차',
      '공정 사양서'
    ],
    outputFormats: [
      '불합격 판정 리포트',
      '특성 요인도',
      '파레토 차트',
      '공정 능력 지표(Cpk)',
      '품질 개선 계획'
    ]
  },
  {
    id: 'production',
    name: 'Production Intelligence',
    category: '도메인',
    description: '생산 계획 및 가용율 분석 전문가',
    icon: 'Factory',
    color: 'orange',
    capabilities: [
      '생산 계획 최적화',
      '설비 가동율 분석',
      'OEE 분석',
      '생산 능력 분석',
      '리드타임 분석',
      '병목 공정 분석',
      '생산 성과 분석',
      '일정 최적화'
    ],
    apiEndpoints: {
      base: '/api/production-analysis',
      endpoints: {
        productionPlan: '/production-plan',
        utilizationRate: '/utilization-rate',
        oeeAnalysis: '/oee-analysis',
        productionCapacity: '/production-capacity',
        leadTime: '/lead-time',
        bottleneck: '/bottleneck',
        productionPerformance: '/production-performance',
        scheduleOptimization: '/schedule-optimization'
      }
    },
    prompts: {
      system: '당신은 생산 관리 전문가입니다. OEE 및 생산 관리 지표를 분석하여 생산 효율을 최적화합니다.',
      analysis: '생산 데이터를 분석하여 가동율, 효율, 품질 지표를 종합 평가합니다.',
      recommendation: '생산성 향상을 위한 설비, 공정, 일정 개선 방안을 제시합니다.'
    },
    dataSources: [
      'MES 생산 데이터',
      '설비 관리 시스템',
      '생산 계획 시스템',
      'APS 고급 생산 계획',
      'SCADA 제어 데이터'
    ],
    outputFormats: [
      '생산 현황 대시보드',
      'OEE 분석 리포트',
      '병목 공정 분석',
      '생산 계획 최적화',
      '설비 가동 현황'
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Intelligence',
    category: '도메인',
    description: '재고 관리 및 최적화 전문가',
    icon: 'Package',
    color: 'cyan',
    capabilities: [
      '재고 수준 분석',
      '회전율 최적화',
      '안전재고 설정',
      '재고 예측',
      'ABC 분류 분석',
      '과잉/부족 재고 분석',
      '재고 코스트 분석',
      '발전 최적화'
    ],
    apiEndpoints: {
      base: '/api/inventory-analysis',
      endpoints: {
        inventoryLevel: '/inventory-level',
        turnoverRate: '/turnover-rate',
        safetyStock: '/safety-stock',
        inventoryForecast: '/inventory-forecast',
        abcAnalysis: '/abc-analysis',
        excessShortage: '/excess-shortage',
        inventoryCost: '/inventory-cos',
        reorderOptimization: '/reorder-optimization'
      }
    },
    prompts: {
      system: '당신은 재고 관리 전문가입니다. 수요 예측과 재고 최적화 방법론을 사용하여 재고 비용 최소화와 서비스 수준 유지를 균형합니다.',
      analysis: '재고 데이터를 분석하여 수준, 회전율, ABC 분류를 파악합니다.',
      recommendation: '재고 최적화를 위한 안전재고, 발주점, 주기 설정 방안을 제시합니다.'
    },
    dataSources: [
      'WMS 창고 관리 시스템',
      '재고 관리 시스템',
      '수주 예측 시스템',
      '공급망 관리 시스템',
      '입출고 이력'
    ],
    outputFormats: [
      '재고 현황표',
      'ABC 분석 리포트',
      '회전율 분석',
      '안전재고 계산',
      '발전 최적화 제안'
    ]
  },
  {
    id: 'finance',
    name: 'Finance Intelligence',
    category: '도메인',
    description: '재무 분석 및 예산 관리 전문가',
    icon: 'TrendingUp',
    color: 'emerald',
    capabilities: [
      '재무 제표 분석',
      '예산 관리',
      '현금 흐름 분석',
      '수익성 분석',
      '손익 분석',
      '재무 비율 분석',
      '예산 대비 실적',
      '투자 수익률 분석'
    ],
    apiEndpoints: {
      base: '/api/finance-analysis',
      endpoints: {
        financialStatements: '/financial-statements',
        budgetManagement: '/budget-management',
        cashFlow: '/cash-flow',
        profitability: '/profitability',
        profitLoss: '/profit-loss',
        financialRatios: '/financial-ratios',
        budgetVsActual: '/budget-vs-actual',
        roiAnalysis: '/roi-analysis'
      }
    },
    prompts: {
      system: '당신은 재무 분석 전문가입니다. 재무 제표와 재무 비율을 분석하여 기업의 재무 건전성과 수익성을 평가합니다.',
      analysis: '재무 데이터를 분석하여 수익성, 안정성, 성장성을 평가합니다.',
      recommendation: '재무 건전성 강화와 수익성 개선을 위한 추천 사항을 제시합니다.'
    },
    dataSources: [
      'ERP 재무 데이터',
      '총계정 원장',
      '예산 관리 시스템',
      '자본 지출 계획',
      '결산 재무 제표'
    ],
    outputFormats: [
      '재무 분석 보고서',
      '손익 계산서',
      '현금 흐름표',
      '재무 비율표',
      '예산 대비 실적 분석'
    ]
  },
  {
    id: 'logistics',
    name: 'Logistics Intelligence',
    category: '도메인',
    description: '물류 및 배송 최적화 전문가',
    icon: 'Truck',
    color: 'amber',
    capabilities: [
      '배송 경로 최적화',
      '물류 비용 분석',
      '배송 시간 예측',
      '창고 최적화',
      '운송 수단 분석',
      '배송 성과 분석',
      '물류 네트워크 설계',
      '교차 도킹 최적화'
    ],
    apiEndpoints: {
      base: '/api/logistics-analysis',
      endpoints: {
        routeOptimization: '/route-optimization',
        logisticsCost: '/logistics-cost',
        deliveryForecast: '/delivery-forecast',
        warehouseOptimization: '/warehouse-optimization',
        transportMode: '/transport-mode',
        deliveryPerformance: '/delivery-performance',
        networkDesign: '/network-design',
        crossDocking: '/cross-docking'
      }
    },
    prompts: {
      system: '당신은 물류 관리 전문가입니다. 배송 경로 최적화와 물류 비용 절감 방법론을 사용하여 물류 효율을 개선합니다.',
      analysis: '물류 데이터를 분석하여 배송 시간, 비용, 성과를 평가합니다.',
      recommendation: '물류 효율 개선을 위한 경로, 창고, 운송 수단 최적화 방안을 제시합니다.'
    },
    dataSources: [
      'TMS 운송 관리 시스템',
      'WMS 창고 관리 시스템',
      'GPS 차량 추적',
      '배송 관리 시스템',
      '물류 비용 데이터'
    ],
    outputFormats: [
      '배송 경로 최적화',
      '물류 비용 분석',
      '배송 성과 리포트',
      '창고 활용도 분석',
      '물류 네트워크 설계'
    ]
  },
  {
    id: 'o2c',
    name: 'O2C Process Agent',
    category: '도메인',
    description: 'Order to Cash 프로세스 관리 전문가',
    icon: 'Users',
    color: 'indigo',
    capabilities: [
      '주문 처리 현황',
      '리드타임 분석',
      '수금 관리',
      '주문 이력 추적',
      'O2C 단계별 성과',
      '수금 기간 분석',
      '연체 관리',
      '고객사 포트폴리오'
    ],
    apiEndpoints: {
      base: '/api/business-process/o2c',
      endpoints: {
        stages: '/stages',
        orders: '/orders',
        issues: '/issues',
        kpi: '/kpi',
        predictions: '/predictions',
        recommendations: '/recommendations',
        collectionStatus: '/collection-status',
        customerPortfolio: '/customer-portfolio'
      }
    },
    prompts: {
      system: '당신은 O2C(Order to Cash) 프로세스 전문가입니다. 주문 접수부터 현금 수금까지 전체 프로세스를 분석하고 최적화합니다.',
      analysis: 'O2C 프로세스 데이터를 분석하여 단계별 리드타임, 병목, 성과를 파악합니다.',
      recommendation: 'O2C 프로세스 효율화와 수금 개선을 위한 추천 사항을 제시합니다.'
    },
    dataSources: [
      '주문 관리 시스템',
      'ERP 영업 데이터',
      'MES 생산 데이터',
      '물류 배송 데이터',
      'AR 매출 채권 데이터'
    ],
    outputFormats: [
      'O2C 대시보드',
      '리드타임 분석',
      '수금 현황표',
      '단계별 성과 리포트',
      '연체 관리 리포트'
    ]
  },
  {
    id: 'p2p',
    name: 'P2P Process Agent',
    category: '도메인',
    description: 'Procure to Pay 프로세스 관리 전문가',
    icon: 'FileCheck',
    color: 'violet',
    capabilities: [
      '구매 발주 현황',
      '공급사 관리',
      '지불 관리',
      '발주 이력 추적',
      'P2P 단계별 성과',
      '구매 리드타임',
      '지불 기간 분석',
      '공급사 평가'
    ],
    apiEndpoints: {
      base: '/api/business-process/p2p',
      endpoints: {
        stages: '/stages',
        orders: '/orders',
        issues: '/issues',
        kpi: '/kpi',
        predictions: '/predictions',
        recommendations: '/recommendations',
        paymentStatus: '/payment-status',
        supplierEvaluation: '/supplier-evaluation'
      }
    },
    prompts: {
      system: '당신은 P2P(Procure to Pay) 프로세스 전문가입니다. 구매 요청부터 지불 처리까지 전체 프로세스를 분석하고 최적화합니다.',
      analysis: 'P2P 프로세스 데이터를 분석하여 단계별 리드타임, 병목, 성과를 파악합니다.',
      recommendation: 'P2P 프로세스 효율화와 지불 최적화를 위한 추천 사항을 제시합니다.'
    },
    dataSources: [
      '구매 관리 시스템',
      'ERP 구매 데이터',
      '공급사 관리 시스템',
      'AP 매입 채권 데이터',
      '품질 검사 데이터'
    ],
    outputFormats: [
      'P2P 대시보드',
      '리드타임 분석',
      '지불 현황표',
      '단계별 성과 리포트',
      '공급사 평가 리포트'
    ]
  }
];

// 도메인 에이전트별 응답 생성기
export const generateDomainAgentResponse = async (
  agentId: string,
  query: string,
  context?: any
): Promise<{
  content: string;
  metadata: {
    processingTime: number;
    confidence: number;
    dataSources: string[];
    analysisType: string;
  };
}> => {
  const agent = domainAgentsConfig.find(a => a.id === agentId);

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  const startTime = Date.now();

  try {
    // 실제 API 호출 (구현 필요)
    const response = await fetch(`${agent.apiEndpoints.base}${agent.apiEndpoints.endpoints.costBreakdown}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });

    const data = await response.json();

    return {
      content: formatAgentResponse(agentId, data),
      metadata: {
        processingTime: (Date.now() - startTime) / 1000,
        confidence: data.confidence || 0.85,
        dataSources: agent.dataSources,
        analysisType: data.analysisType || 'standard'
      }
    };
  } catch (error) {
    // API 호출 실패 시 모의 응답
    return generateMockResponse(agent, query, startTime);
  }
};

// 에이전트 응답 포맷팅
const formatAgentResponse = (agentId: string, data: any): string => {
  // 각 에이전트별로 데이터 포맷팅
  switch (agentId) {
    case 'cost':
      return formatCostResponse(data);
    case 'quality':
      return formatQualityResponse(data);
    case 'production':
      return formatProductionResponse(data);
    default:
      return JSON.stringify(data, null, 2);
  }
};

// 원가 분석 응답 포맷팅
const formatCostResponse = (data: any): string => {
  return `**원가 분석 결과**

**분석 기간:** ${data.period || '최근 30일'}

**4M2E 원가 구조:**
| 요소 | 금액 | 비중 | 전월 대비 |
|------|------|------|----------|
| Man (인건비) | ${formatNumber(data.manCost)} | ${data.manCostRate}% | ${data.manCostChange > 0 ? '+' : ''}${data.manCostChange}% |
| Machine (설비비) | ${formatNumber(data.machineCost)} | ${data.machineCostRate}% | ${data.machineCostChange > 0 ? '+' : ''}${data.machineCostChange}% |
| Material (재료비) | ${formatNumber(data.materialCost)} | ${data.materialCostRate}% | ${data.materialCostChange > 0 ? '+' : ''}${data.materialCostChange}% |
| Method (공법비) | ${formatNumber(data.methodCost)} | ${data.methodCostRate}% | ${data.methodCostChange > 0 ? '+' : ''}${data.methodCostChange}% |
| Environment (에너지비) | ${formatNumber(data.environmentCost)} | ${data.environmentCostRate}% | ${data.environmentCostChange > 0 ? '+' : ''}${data.environmentCostChange}% |

**주요 발견:**
${data.findings.map((f: string) => `• ${f}`).join('\n')}

**추천 조치:**
${data.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`;
};

// 품질 분석 응답 포맷팅
const formatQualityResponse = (data: any): string => {
  return `**품질 분석 결과**

**분석 기간:** ${data.period || '최근 90일'}

**주요 품질 지표:**
• 전체 불량률: ${data.defectRate}% (목표: ${data.targetRate}%)
• 검사 건수: ${formatNumber(data.inspectionCount)}
• 불량 건수: ${formatNumber(data.defectCount)}
• 품질 지수: ${data.qualityIndex}/100

**불량 유형별 현황:**
| 유형 | 건수 | 비중 | 추이 |
|------|------|------|------|
${data.defectByType.map((d: any) => `| ${d.type} | ${d.count} | ${d.rate}% | ${d.trend} |`).join('\n')}

**원인 분석:**
${data.rootCauses.map((c: string) => `• ${c}`).join('\n')}

**개선 제안:**
${data.improvements.map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n')}`;
};

// 생산 분석 응답 포맷팅
const formatProductionResponse = (data: any): string => {
  return `**생산 분석 결과**

**분석 기간:** ${data.period || '최근 30일'}

**생산 현황:**
• 일일 평균 생산량: ${formatNumber(data.dailyProduction)}
• 설비 가동률: ${data.utilizationRate}% (목표: ${data.targetUtilizationRate}%)
• OEE (종합 설비 효율): ${data.oee}% (목표: ${data.targetOee}%)
• 생산 리드타임: ${data.leadTime}일 (목표: ${data.targetLeadTime}일)

**OEE 구성:**
| 구성 | 현재 | 목표 | 차이 |
|------|------|------|------|
| 가용율 (Availability) | ${data.availability}% | ${data.targetAvailability}% | ${data.availability - data.targetAvailability > 0 ? '+' : ''}${data.availability - data.targetAvailability}% |
| 성능율 (Performance) | ${data.performance}% | ${data.targetPerformance}% | ${data.performance - data.targetPerformance > 0 ? '+' : ''}${data.performance - data.targetPerformance}% |
| 양품률 (Quality) | ${data.quality}% | ${data.targetQuality}% | ${data.quality - data.targetQuality > 0 ? '+' : ''}${data.quality - data.targetQuality}% |

**병목 공정:**
${data.bottlenecks.map((b: any) => `• **${b.process}**: 가용율 ${b.rate}% (${b.reason})`).join('\n')}

**개선 제안:**
${data.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`;
};

// 모의 응답 생성 (API 연동 전)
const generateMockResponse = (agent: DomainAgentConfig, query: string, startTime: number): any => {
  const mockData = getMockDataForAgent(agent.id);

  return {
    content: formatAgentResponse(agent.id, mockData),
    metadata: {
      processingTime: (Date.now() - startTime) / 1000,
      confidence: 0.85 + Math.random() * 0.1,
      dataSources: agent.dataSources,
      analysisType: 'standard'
    }
  };
};

// 에이전트별 모의 데이터
const getMockDataForAgent = (agentId: string) => {
  const mockData: Record<string, any> = {
    cost: {
      period: '2026년 3월',
      manCost: 125000000,
      manCostRate: 25,
      manCostChange: 8.5,
      machineCost: 95000000,
      machineCostRate: 19,
      machineCostChange: -3.2,
      materialCost: 225000000,
      materialCostRate: 45,
      materialCostChange: 15.2,
      methodCost: 35000000,
      methodCostRate: 7,
      methodCostChange: -2.1,
      environmentCost: 20000000,
      environmentCostRate: 4,
      environmentCostChange: 5.4,
      findings: [
        '재료비가 전월 대비 15.2% 상승하여 원가 상승의 주요 원인임',
        '인건비는 8.5% 상승하였으나 원가 비중은 안정적',
        '설비비는 3.2% 감소하여 효율화 성과'
      ],
      recommendations: [
        '대체 자재 검토 (예상 절감: 8-12%)',
        '생산 효율화 방안 모색 (예상 절감: 3-5%)',
        '에너지 절감 활동 전개 (예상 절감: 2-3%)'
      ]
    },
    quality: {
      period: '2026년 1분기',
      defectRate: 2.3,
      targetRate: 2.5,
      inspectionCount: 125000,
      defectCount: 2875,
      qualityIndex: 87.5,
      defectByType: [
        { type: '치수 불량', count: 1207, rate: 42, trend: '감소 ↓' },
        { type: '외관 불량', count: 805, rate: 28, trend: '안정 →' },
        { type: '기능 불량', count: 863, rate: 30, trend: '증가 ↑' }
      ],
      rootCauses: [
        '치수 불량: 공구 마모로 인한 정밀도 저하',
        '외관 불량: 취급 과정에서의 흠집 발생',
        '기능 불량: 부품 조립 오차 및 토르크 불량'
      ],
      improvements: [
        '공구 교체 주기 단축 (현재 8시간 → 6시간)',
        '취급 작업 SOP 개정 및 교육 강화',
        '조립 공정 자동화 검토'
      ]
    },
    production: {
      period: '2026년 3월',
      dailyProduction: 12450,
      utilizationRate: 87.3,
      targetUtilizationRate: 85,
      oee: 78.5,
      targetOee: 75,
      leadTime: 2.8,
      targetLeadTime: 3,
      availability: 82.5,
      targetAvailability: 85,
      performance: 88.3,
      targetPerformance: 85,
      quality: 97.2,
      targetQuality: 96,
      bottlenecks: [
        { process: '조립 공정', rate: 72, reason: '설비 노후화' },
        { process: '검사 공정', rate: 68, reason: '대기 시간 과다' }
      ],
      recommendations: [
        '조립 설비 교체 시급 (투자비: 15억원, 예상 효과: OEE +5%p)',
        '검사 공정 자동화 도입 (투자비: 5억원, 예상 효과: 리드타임 -20%)',
        '예방 정비 강화로 가동률 개선'
      ]
    },
    inventory: {
      period: '2026년 3월',
      totalInventory: 850000000,
      turnoverRate: 4.2,
      targetTurnoverRate: 5.0,
      serviceLevel: 95.2,
      targetServiceLevel: 95,
      abcAnalysis: [
        { category: 'A', items: 156, valueRate: 72, turnover: 6.8 },
        { category: 'B', items: 412, valueRate: 21, turnover: 4.5 },
        { category: 'C', items: 1245, valueRate: 7, turnover: 2.1 }
      ],
      excessItems: 23,
      shortageItems: 8,
      recommendations: [
        'C류 품목 재고 금액 20% 절감 가능',
        '안전재고 최적화로 재고 비용 15% 절감',
        '수요 예측 정확도 개선으로 품절 건수 50% 감소'
      ]
    },
    finance: {
      period: '2026년 1분기',
      revenue: 15800000000,
      costOfSales: 9480000000,
      grossProfit: 6320000000,
      grossMargin: 40.0,
      operatingProfit: 1850000000,
      operatingMargin: 11.7,
      netProfit: 1420000000,
      netMargin: 9.0,
      budgetVariance: {
        revenue: 102,
        cost: 98,
        profit: 95
      },
      recommendations: [
        '영업이익률 개선을 위한 원가 구조 최적화',
        '비재무비용 10% 절감 방안 추진',
        'R&D 투자 확대로 장기 성장성 강화'
      ]
    },
    logistics: {
      period: '2026년 3월',
      onTimeDelivery: 94.5,
      targetOnTimeDelivery: 95,
      avgDeliveryTime: 2.3,
      targetAvgDeliveryTime: 2.5,
      logisticsCost: 485000000,
      logisticsCostRate: 3.1,
      targetLogisticsCostRate: 3.0,
      vehicleUtilization: 68.5,
      recommendations: [
        '배송 경로 최적화로 물류 비용 8% 절감',
        '차량 가용율 개선으로 투입 차량 15% 감축',
        '창고 레이아웃 개선으로 작업 효율 20% 향상'
      ]
    },
    o2c: {
      period: '2026년 3월',
      totalOrders: 1245,
      completedOrders: 1178,
      avgLeadTime: 8.5,
      targetLeadTime: 10,
      collectionRate: 94.5,
      targetCollectionRate: 95,
      avgCollectionDays: 28,
      targetAvgCollectionDays: 30,
      stagePerformance: [
        { stage: '주문 접수', avgTime: 0.5, targetTime: 1 },
        { stage: '생산', avgTime: 4.5, targetTime: 5 },
        { stage: '배송', avgTime: 2.0, targetTime: 2.5 },
        { stage: '청구', avgTime: 0.3, targetTime: 1 },
        { stage: '수금', avgTime: 28, targetTime: 30 }
      ],
      recommendations: [
        '수금 프로세스 간소화로 수금 기간 단축',
        '주문 자동화로 리드타임 20% 단축',
        '고객사별 신용 등급 관리 강화'
      ]
    },
    p2p: {
      period: '2026년 3월',
      totalOrders: 856,
      completedOrders: 812,
      avgLeadTime: 6.2,
      targetLeadTime: 7,
      onTimePayment: 92.5,
      targetOnTimePayment: 95,
      avgPaymentDays: 35,
      targetAvgPaymentDays: 30,
      stagePerformance: [
        { stage: '구매 요청', avgTime: 0.3, targetTime: 1 },
        { stage: '발주', avgTime: 1.5, targetTime: 2 },
        { stage: '수령', avgTime: 3.2, targetTime: 3 },
        { stage: '검수', avgTime: 0.5, targetTime: 1 },
        { stage: '지불', avgTime: 35, targetTime: 30 }
      ],
      recommendations: [
        '지불 일정 최적화로 현금 흐름 개선',
        '공급사 포털 도입으로 발주 리드타임 단축',
        '자동 검수 도입으로 검수 시간 50% 단축'
      ]
    }
  };

  return mockData[agentId] || {};
};

// 숫자 포맷팅
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export default domainAgentsConfig;
