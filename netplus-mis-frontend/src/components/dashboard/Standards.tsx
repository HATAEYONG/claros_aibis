import React, { useState, useEffect } from 'react';
import api from '@/services/api';

interface StandardInfo {
  id: string;
  category: string;
  code: string;
  name: string;
  description: string;
  value: string;
  unit?: string;
  updatedAt: string;
  infoType: 'static' | 'dynamic';
  currentValue?: string;
  targetValue?: string;
  status?: 'normal' | 'warning' | 'error';
}

interface StandardCategory {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  dynamicCount: number;
}

// 10개 모듈 카테고리
const CATEGORIES: StandardCategory[] = [
  { id: 'product', name: '제품', icon: '📦', itemCount: 12, dynamicCount: 4 },
  { id: 'supplier', name: '공급사', icon: '🛒', itemCount: 8, dynamicCount: 3 },
  { id: 'customer', name: '고객', icon: '👤', itemCount: 10, dynamicCount: 4 },
  { id: 'employee', name: '사원', icon: '👥', itemCount: 6, dynamicCount: 2 },
  { id: 'warehouse', name: '창고', icon: '🏢', itemCount: 5, dynamicCount: 2 },
  { id: 'department', name: '부서', icon: '🏛️', itemCount: 4, dynamicCount: 1 },
  { id: 'factory', name: '공장', icon: '🏭', itemCount: 4, dynamicCount: 2 },
  { id: 'equipment', name: '설비', icon: '⚙️', itemCount: 8, dynamicCount: 3 },
  { id: 'costcenter', name: '원가중심점', icon: '💼', itemCount: 6, dynamicCount: 2 },
  { id: 'account', name: '계정과목', icon: '📋', itemCount: 5, dynamicCount: 2 },
];

const Standards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('product');
  const [selectedInfoType, setSelectedInfoType] = useState<'all' | 'static' | 'dynamic'>('all');
  const [standards, setStandards] = useState<StandardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 더미 데이터 - 10개 모듈
  const DUMMY_STANDARDS: Record<string, StandardInfo[]> = {
    product: [
      // 정적 정보
      { id: '1', category: 'product', code: 'PRD-001', name: '제품코드', description: '제품별 고유 코드', value: 'P-2024-0001', updatedAt: '2024-12-15', infoType: 'static' },
      { id: '2', category: 'product', code: 'PRD-002', name: '제품명', description: '제품명', value: '스마트폰 케이스', updatedAt: '2024-12-15', infoType: 'static' },
      { id: '3', category: 'product', code: 'PRD-003', name: '규격', description: '제품 규격', value: '150x75x8.5mm', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '4', category: 'product', code: 'PRD-004', name: '단위', description: '재고 단위', value: '개', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '5', category: 'product', code: 'PRD-005', name: '표준 원가', description: '제품별 표준 원가', value: '15000', unit: '원/개', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '6', category: 'product', code: 'PRD-006', name: '판매 단가', description: '제품별 판매 단가', value: '25000', unit: '원/개', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '7', category: 'product', code: 'PRD-007', name: '안전재고', description: '최소 재고 기준', value: '1000', unit: '개', updatedAt: '2024-12-01', infoType: 'static' },
      { id: '8', category: 'product', code: 'PRD-008', name: '리드타임', description: '생산 리드타임', value: '3', unit: '일', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '9', category: 'product', code: 'PRD-D001', name: '현재 재고', description: '현재 창고 재고', value: '1000', unit: '개', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '850', targetValue: '1000', status: 'warning' },
      { id: '10', category: 'product', code: 'PRD-D002', name: '당일 생산량', description: '금일 생산 실적', value: '5000', unit: '개/일', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '4800', targetValue: '5000', status: 'normal' },
      { id: '11', category: 'product', code: 'PRD-D003', name: '불량률', description: '현재 불량률', value: '2.0', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '1.8', targetValue: '2.0', status: 'normal' },
      { id: '12', category: 'product', code: 'PRD-D004', name: '출고 현황', description: '금일 출고량', value: '4800', unit: '개', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '4200', targetValue: '4800', status: 'warning' },
    ],
    supplier: [
      // 정적 정보
      { id: '13', category: 'supplier', code: 'SUP-001', name: '공급사코드', description: '공급사별 코드', value: 'S-2024-0001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '14', category: 'supplier', code: 'SUP-002', name: '공급사명', description: '공급사명', value: '(주)한국플라스틱', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '15', category: 'supplier', code: 'SUP-003', name: '대표자', description: '대표자명', value: '김철수', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '16', category: 'supplier', code: 'SUP-004', name: '연락처', description: '담당자 연락처', value: '02-1234-5678', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '17', category: 'supplier', code: 'SUP-005', name: '계약 기간', description: '공급 계약 기간', value: '2024-01-01 ~ 2024-12-31', updatedAt: '2024-01-01', infoType: 'static' },
      // 동적 정보
      { id: '18', category: 'supplier', code: 'SUP-D001', name: '납품 실적', description: '금월 납품 실적', value: '95', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '92', targetValue: '95', status: 'warning' },
      { id: '19', category: 'supplier', code: 'SUP-D002', name: '불량률', description: '금월 불량률', value: '1.5', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '1.8', targetValue: '1.5', status: 'warning' },
      { id: '20', category: 'supplier', code: 'SUP-D003', name: '납기 준수율', description: '납기 준수율', value: '98', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '100', targetValue: '98', status: 'normal' },
    ],
    customer: [
      // 정적 정보
      { id: '21', category: 'customer', code: 'CUST-001', name: '고객코드', description: '고객별 코드', value: 'C-2024-0001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '22', category: 'customer', code: 'CUST-002', name: '고객명', description: '고객사명', value: '(주)삼성전자', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '23', category: 'customer', code: 'CUST-003', name: '대표자', description: '대표자명', value: '김기태', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '24', category: 'customer', code: 'CUST-004', name: '연락처', description: '담당자 연락처', value: '02-1234-5678', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '25', category: 'customer', code: 'CUST-005', name: '결제 조건', description: '결제 조건', value: '30일 후불', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '26', category: 'customer', code: 'CUST-006', name: '담당자', description: '영업 담당자', value: '이영업', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '27', category: 'customer', code: 'CUST-D001', name: '당월 매출', description: '금월 매출액', value: '500000000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '450000000', targetValue: '500000000', status: 'warning' },
      { id: '28', category: 'customer', code: 'CUST-D002', name: '주문 실적', description: '금월 주문 실적', value: '95', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '88', targetValue: '95', status: 'warning' },
      { id: '29', category: 'customer', code: 'CUST-D003', name: '미수금', description: '현재 미수금액', value: '50000000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '65000000', targetValue: '50000000', status: 'warning' },
      { id: '30', category: 'customer', code: 'CUST-D004', name: 'CLV', description: '고객 생애 가치', value: '50000000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '52000000', targetValue: '50000000', status: 'normal' },
    ],
    employee: [
      // 정적 정보
      { id: '31', category: 'employee', code: 'EMP-001', name: '사번', description: '사원별 사번', value: 'E-2024-0001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '32', category: 'employee', code: 'EMP-002', name: '성명', description: '사원명', value: '홍길동', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '33', category: 'employee', code: 'EMP-003', name: '부서', description: '소속 부서', value: '생산팀', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '34', category: 'employee', code: 'EMP-004', name: '직급', description: '사원 직급', value: '사원', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '35', category: 'employee', code: 'EMP-005', name: '입사일', description: '입사일자', value: '2020-03-01', updatedAt: '2024-03-01', infoType: 'static' },
      // 동적 정보
      { id: '36', category: 'employee', code: 'EMP-D001', name: '출근율', description: '당월 출근율', value: '98', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '95', targetValue: '98', status: 'normal' },
      { id: '37', category: 'employee', code: 'EMP-D002', name: '연차 잔여', description: '연차 잔여 일수', value: '10', unit: '일', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '8', targetValue: '10', status: 'normal' },
    ],
    warehouse: [
      // 정적 정보
      { id: '38', category: 'warehouse', code: 'WH-001', name: '창고코드', description: '창고별 코드', value: 'WH-001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '39', category: 'warehouse', code: 'WH-002', name: '창고명', description: '창고명', value: '제품창고', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '40', category: 'warehouse', code: 'WH-003', name: '위치', description: '창고 위치', value: '1층 101호', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '41', category: 'warehouse', code: 'WH-004', name: '용량', description: '창고 용량', value: '10000', unit: ' pallet', updatedAt: '2024-12-05', infoType: 'static' },
      // 동적 정보
      { id: '42', category: 'warehouse', code: 'WH-D001', name: '재고 수준', description: '현재 재고 수준', value: '70', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '75', targetValue: '70', status: 'warning' },
      { id: '43', category: 'warehouse', code: 'WH-D002', name: '가용량', description: '현재 가용 용량', value: '3000', unit: 'pallet', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '2500', targetValue: '3000', status: 'normal' },
    ],
    department: [
      // 정적 정보
      { id: '44', category: 'department', code: 'DEPT-001', name: '부서코드', description: '부서별 코드', value: 'D-001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '45', category: 'department', code: 'DEPT-002', name: '부서명', description: '부서명', value: '생산본부', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '46', category: 'department', code: 'DEPT-003', name: '본부장', description: '부서장', value: '이생산', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '47', category: 'department', code: 'DEPT-004', name: '인원', description: '부서 인원수', value: '50', unit: '명', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '48', category: 'department', code: 'DEPT-D001', name: '예산 집행률', description: '당월 예산 집행률', value: '85', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '82', targetValue: '85', status: 'normal' },
    ],
    factory: [
      // 정적 정보
      { id: '49', category: 'factory', code: 'FACT-001', name: '공장코드', description: '공장별 코드', value: 'F-001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '50', category: 'factory', code: 'FACT-002', name: '공장명', description: '공장명', value: '제1공장', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '51', category: 'factory', code: 'FACT-003', name: '위치', description: '공장 위치', value: '경기도 판교시', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '52', category: 'factory', code: 'FACT-004', name: '용량', description: '공장 용량', value: '100000', unit: '개/월', updatedAt: '2024-12-05', infoType: 'static' },
      // 동적 정보
      { id: '53', category: 'factory', code: 'FACT-D001', name: '가동률', description: '현재 공장 가동률', value: '85', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '82', targetValue: '85', status: 'normal' },
      { id: '54', category: 'factory', code: 'FACT-D002', name: '생산 달성률', description: '당월 생산 달성률', value: '92', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '88', targetValue: '92', status: 'warning' },
    ],
    equipment: [
      // 정적 정보
      { id: '55', category: 'equipment', code: 'EQ-001', name: '설비코드', description: '설비별 코드', value: 'EQ-001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '56', category: 'equipment', code: 'EQ-002', name: '설비명', description: '설비명', value: '사출기 1호', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '57', category: 'equipment', code: 'EQ-003', name: '모델명', description: '설비 모델', value: 'SM-500', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '58', category: 'equipment', code: 'EQ-004', name: '제조사', description: '제조사', value: 'JSW', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '59', category: 'equipment', code: 'EQ-005', name: '구입일', description: '설비 구입일', value: '2020-01-15', updatedAt: '2024-01-15', infoType: 'static' },
      { id: '60', category: 'equipment', code: 'EQ-006', name: '보전 주기', description: '예방 보전 주기', value: '30', unit: '일', updatedAt: '2024-12-01', infoType: 'static' },
      { id: '61', category: 'equipment', code: 'EQ-007', name: '금형 수명', description: '금형 수명', value: '50000', unit: 'shot', updatedAt: '2024-12-01', infoType: 'static' },
      { id: '62', category: 'equipment', code: 'EQ-008', name: '정격 용량', description: '설비 정격 용량', value: '300', unit: 'ton', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '63', category: 'equipment', code: 'EQ-D001', name: 'OEE', description: '현재 OEE', value: '75', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '72', targetValue: '75', status: 'warning' },
      { id: '64', category: 'equipment', code: 'EQ-D002', name: '상태', description: '설비 운전 상태', value: '정상', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '정상', targetValue: '정상', status: 'normal' },
      { id: '65', category: 'equipment', code: 'EQ-D003', name: '금형 잔여', description: '금형 잔여 수명', value: '50000', unit: 'shot', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '12500', targetValue: '50000', status: 'error' },
    ],
    costcenter: [
      // 정적 정보
      { id: '66', category: 'costcenter', code: 'CC-001', name: '원가중심점코드', description: '원가중심점 코드', value: 'CC-001', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '67', category: 'costcenter', code: 'CC-002', name: '원가중심점명', description: '원가중심점명', value: '사출 원가부', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '68', category: 'costcenter', code: 'CC-003', name: '책임자', description: '원가중심점 책임자', value: '김원가', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '69', category: 'costcenter', code: 'CC-004', name: '예산', description: '연간 예산', value: '1000000000', unit: '원', updatedAt: '2024-01-01', infoType: 'static' },
      { id: '70', category: 'costcenter', code: 'CC-005', name: '표준 원가', description: '제품별 표준 원가', value: '15000', unit: '원/개', updatedAt: '2024-12-01', infoType: 'static' },
      { id: '71', category: 'costcenter', code: 'CC-006', name: '할당율', description: '간접비 할당율', value: '120', unit: '%', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '72', category: 'costcenter', code: 'CC-D001', name: '원가 차이', description: '당월 원가 차이', value: '500000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '750000', targetValue: '0', status: 'warning' },
      { id: '73', category: 'costcenter', code: 'CC-D002', name: '예산 집행률', description: '당월 예산 집행률', value: '100', unit: '%', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '95', targetValue: '100', status: 'normal' },
    ],
    account: [
      // 정적 정보
      { id: '74', category: 'account', code: 'ACC-001', name: '계정과목코드', description: '계정과목 코드', value: '10101', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '75', category: 'account', code: 'ACC-002', name: '계정과목명', description: '계정과목명', value: '현금', updatedAt: '2024-12-10', infoType: 'static' },
      { id: '76', category: 'account', code: 'ACC-003', name: '계정 구분', description: '차대 구분', value: '자산', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '77', category: 'account', code: 'ACC-004', name: '세부 계정', description: '세부 계정', value: '일반 현금', updatedAt: '2024-12-05', infoType: 'static' },
      { id: '78', category: 'account', code: 'ACC-005', name: '적용 구간', description: '적용 구간', value: '1단계', updatedAt: '2024-12-01', infoType: 'static' },
      // 동적 정보
      { id: '79', category: 'account', code: 'ACC-D001', name: '잔액', description: '현재 계정 잔액', value: '50000000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '45000000', targetValue: '50000000', status: 'normal' },
      { id: '80', category: 'account', code: 'ACC-D002', name: '당기 증감', description: '당기 증감액', value: '5000000', unit: '원', updatedAt: '2024-12-22', infoType: 'dynamic', currentValue: '3000000', targetValue: '5000000', status: 'normal' },
    ],
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const data = DUMMY_STANDARDS[selectedCategory] || [];
      setStandards(data);
      setLoading(false);
    }, 300);
  }, [selectedCategory]);

  const filteredStandards = standards.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedInfoType === 'all' ||
      (selectedInfoType === 'static' && s.infoType === 'static') ||
      (selectedInfoType === 'dynamic' && s.infoType === 'dynamic');

    return matchesSearch && matchesType;
  });

  const staticCount = standards.filter(s => s.infoType === 'static').length;
  const dynamicCount = standards.filter(s => s.infoType === 'dynamic').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">📋 기준정보 관리</h1>
        <p className="text-indigo-100">제품, 공급사, 고객, 사원, 창고, 부서, 공장, 설비, 원가중심점, 계정과목 등 전체 기준정보를 관리합니다</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <input
          type="text"
          placeholder="🔍 기준정보 검색 (코드, 이름, 설명)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category Tabs - 10개 모듈 그리드 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-xs font-medium text-center">{category.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                selectedCategory === category.id
                  ? 'bg-indigo-500'
                  : 'bg-gray-300'
              }`}>
                {category.itemCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Static/Dynamic Info Filter */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">정보 유형:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedInfoType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedInfoType === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 ({standards.length})
            </button>
            <button
              onClick={() => setSelectedInfoType('static')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedInfoType === 'static'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 정적 정보 ({staticCount})
            </button>
            <button
              onClick={() => setSelectedInfoType('dynamic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedInfoType === 'dynamic'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 동적 정보 ({dynamicCount})
            </button>
          </div>
        </div>
      </div>

      {/* Standards List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {CATEGORIES.find(c => c.id === selectedCategory)?.name} 기준정보
          </h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></span>
              <span className="text-gray-600">정적: {staticCount}건</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
              <span className="text-gray-600">동적: {dynamicCount}건</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : filteredStandards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '기준정보가 없습니다.'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredStandards.map(standard => (
              <div key={standard.id} className={`p-4 hover:bg-gray-50 transition-colors ${
                standard.infoType === 'dynamic' ? 'border-l-4 border-l-green-500' : ''
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        standard.infoType === 'static'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {standard.code}
                      </span>
                      <h3 className="font-semibold text-gray-800">{standard.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        standard.infoType === 'static'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        {standard.infoType === 'static' ? '📋 정적' : '📊 동적'}
                      </span>
                      {standard.infoType === 'dynamic' && standard.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          standard.status === 'normal'
                            ? 'bg-green-100 text-green-700'
                            : standard.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {standard.status === 'normal' ? '정상' : standard.status === 'warning' ? '주의' : '경고'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{standard.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {standard.infoType === 'static' ? (
                        <>
                          <span className="font-bold text-indigo-600">
                            {standard.value}
                            {standard.unit && <span className="text-gray-500 ml-1">{standard.unit}</span>}
                          </span>
                          <span className="text-gray-400 text-xs">
                            수정일: {standard.updatedAt}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-gray-600">
                            기준값: {standard.targetValue}
                            {standard.unit && <span className="text-gray-500 ml-1">{standard.unit}</span>}
                          </span>
                          <span className={`font-bold ${
                            standard.status === 'normal'
                              ? 'text-green-600'
                              : standard.status === 'warning'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}>
                            현재값: {standard.currentValue}
                            {standard.unit && <span className="text-gray-500 ml-1">{standard.unit}</span>}
                          </span>
                          <span className="text-gray-400 text-xs">
                            업데이트: {standard.updatedAt}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    {standard.infoType === 'static' ? '수정' : '상세'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">정적 정보</p>
              <p className="text-xl font-bold text-gray-800">57건</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">동적 정보</p>
              <p className="text-xl font-bold text-gray-800">23건</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">정상</p>
              <p className="text-xl font-bold text-gray-800">18건</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">주의/경고</p>
              <p className="text-xl font-bold text-gray-800">5건</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Standards;
