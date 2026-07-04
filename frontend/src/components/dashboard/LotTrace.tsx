/**
 * LotTrace - 로트 추적 대시보드 컴포넌트
 * LOT 번호를 입력하여 자재, 공정, 품질, 설비, 작업자 정보를 추적
 */

import React, { useState } from 'react';
import { SearchIcon, PackageIcon, FactoryIcon, CheckIcon, SettingsIcon, UserIcon, AlertIcon } from '@/components/icons/Icons';
import { traceLot, LotTraceResult, checkBackendConnection } from '@/services/apiService';

const LotTrace: React.FC = () => {
  const [lotNo, setLotNo] = useState('');
  const [traceResult, setTraceResult] = useState<LotTraceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'product' | 'material' | 'process' | 'quality' | 'equipment' | 'worker' | 'defect' | 'history'>('product');

  const handleSearch = async () => {
    if (!lotNo.trim()) {
      setError('LOT 번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 백엔드 연결 확인
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        setError('백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
        setIsLoading(false);
        return;
      }

      const result = await traceLot(lotNo.trim());
      setTraceResult(result);
    } catch (err: any) {
      setError(err.message || '로트 추적 중 오류가 발생했습니다.');
      setTraceResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'product', label: '제품 정보', icon: PackageIcon },
    { id: 'material', label: '자재 정보', icon: PackageIcon },
    { id: 'process', label: '공정 이력', icon: FactoryIcon },
    { id: 'quality', label: '품질 검사', icon: CheckIcon },
    { id: 'equipment', label: '설비 정보', icon: SettingsIcon },
    { id: 'worker', label: '작업자 정보', icon: UserIcon },
    { id: 'defect', label: '불량 이력', icon: AlertIcon },
    { id: 'history', label: '추적 이력', icon: SearchIcon },
  ] as const;

  const renderTabContent = () => {
    if (!traceResult) return null;

    switch (activeTab) {
      case 'product':
        return traceResult.productInfo ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">제품 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">제품코드</p>
                <p className="font-medium">{traceResult.productInfo.productCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">제품명</p>
                <p className="font-medium">{traceResult.productInfo.productName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">규격</p>
                <p className="font-medium">{traceResult.productInfo.specification || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">수량</p>
                <p className="font-medium">{traceResult.productInfo.quantity?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">생산일</p>
                <p className="font-medium">{traceResult.productInfo.productionDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">라인코드</p>
                <p className="font-medium">{traceResult.productInfo.lineCode || '-'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            제품 정보가 없습니다.
          </div>
        );

      case 'material':
        return traceResult.materialInfo && traceResult.materialInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">자재 정보 ({traceResult.materialInfo.length}건)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">자재코드</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">자재명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">LOT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">공급업체</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">입고일</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">수량</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {traceResult.materialInfo.map((mat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{mat.materialCode}</td>
                      <td className="px-4 py-3 text-sm">{mat.materialName}</td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{mat.lotNo}</td>
                      <td className="px-4 py-3 text-sm">{mat.supplierName || mat.supplierCode || '-'}</td>
                      <td className="px-4 py-3 text-sm">{mat.receiveDate}</td>
                      <td className="px-4 py-3 text-sm text-right">{mat.quantity?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            자재 정보가 없습니다.
          </div>
        );

      case 'process':
        return traceResult.processInfo && traceResult.processInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">공정 이력 ({traceResult.processInfo.length}건)</h3>
            <div className="space-y-4">
              {traceResult.processInfo.map((proc, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{proc.processName} ({proc.processCode})</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      proc.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      proc.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {proc.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div>시작: {proc.startTime}</div>
                    <div>종료: {proc.endTime || '-'}</div>
                    <div>작업자: {proc.workerName || '-'}</div>
                    <div>설비: {proc.equipmentName || proc.equipmentCode || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            공정 이력이 없습니다.
          </div>
        );

      case 'quality':
        return traceResult.qualityInfo && traceResult.qualityInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">품질 검사 이력 ({traceResult.qualityInfo.length}건)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">검사ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">검사유형</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">검사일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">결과</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">검사자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">불량유형</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {traceResult.qualityInfo.map((qi, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{qi.inspectionId}</td>
                      <td className="px-4 py-3 text-sm">{qi.inspectionType}</td>
                      <td className="px-4 py-3 text-sm">{qi.inspectionDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          qi.result === 'PASS' ? 'bg-green-100 text-green-800' :
                          qi.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {qi.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{qi.inspector || '-'}</td>
                      <td className="px-4 py-3 text-sm">{qi.defectType || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            품질 검사 이력이 없습니다.
          </div>
        );

      case 'equipment':
        return traceResult.equipmentInfo && traceResult.equipmentInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">설비 정보 ({traceResult.equipmentInfo.length}건)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {traceResult.equipmentInfo.map((eq, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{eq.equipmentName}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      eq.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                      eq.status === 'IDLE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {eq.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>설비코드: {eq.equipmentCode}</p>
                    <p>설비유형: {eq.equipmentType || '-'}</p>
                    <p>최근정비: {eq.lastMaintenance || '-'}</p>
                    <p>가동시간: {eq.operatingHours ? `${eq.operatingHours}시간` : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            설비 정보가 없습니다.
          </div>
        );

      case 'worker':
        return traceResult.workerInfo && traceResult.workerInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">작업자 정보 ({traceResult.workerInfo.length}명)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {traceResult.workerInfo.map((worker, idx) => (
                <div key={idx} className="border rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{worker.workerName}</p>
                    <p className="text-sm text-gray-500">{worker.department || '-'}</p>
                    <p className="text-xs text-gray-400">
                      {worker.shift && `${worker.shift}`}
                      {worker.skillLevel && ` / ${worker.skillLevel}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            작업자 정보가 없습니다.
          </div>
        );

      case 'defect':
        return traceResult.defectInfo && traceResult.defectInfo.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4 text-red-600">불량 이력 ({traceResult.defectInfo.length}건)</h3>
            <div className="space-y-4">
              {traceResult.defectInfo.map((defect, idx) => (
                <div key={idx} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-700">{defect.defectType}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      defect.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      defect.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {defect.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div>발생일: {defect.defectDate}</div>
                    <div>수량: {defect.quantity}개</div>
                    <div>원인: {defect.cause || '-'}</div>
                    <div>조치: {defect.action || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            불량 이력이 없습니다.
          </div>
        );

      case 'history':
        return traceResult.traceHistory && traceResult.traceHistory.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">추적 이력</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {traceResult.traceHistory.map((history, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{history.event}</span>
                        <span className="text-xs text-gray-400">{history.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600">{history.description}</p>
                      {history.relatedTable && (
                        <p className="text-xs text-gray-400 mt-1">
                          관련: {history.relatedTable} {history.relatedId && `(${history.relatedId})`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            추적 이력이 없습니다.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 검색 영역 */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <SearchIcon size={24} className="text-blue-600" />
          LOT 추적 시스템
        </h2>
        <p className="text-gray-600 mb-4">
          LOT 번호를 입력하여 자재, 공정, 품질, 설비, 작업자 정보를 종합적으로 추적합니다.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="LOT 번호 입력 (예: LOT-2024-1226-001)"
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                검색 중...
              </>
            ) : (
              <>
                <SearchIcon size={20} />
                추적 시작
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* 추적 결과 */}
      {traceResult && (
        <div className="space-y-4">
          {/* LOT 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">추적 LOT 번호</p>
                <h3 className="text-2xl font-bold font-mono">{traceResult.lotNo}</h3>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">추적 완료</p>
                <p className="text-lg">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-xl shadow">
            <div className="flex border-b overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      {!traceResult && !isLoading && (
        <div className="bg-blue-50 p-6 rounded-xl">
          <h3 className="font-bold text-blue-800 mb-3">사용 안내</h3>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">1.</span>
              <span>LOT 번호를 입력하고 "추적 시작" 버튼을 클릭합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">2.</span>
              <span>제품, 자재, 공정, 품질, 설비, 작업자 정보를 탭으로 확인합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">3.</span>
              <span>불량 발생 시 관련 정보를 빠르게 추적하여 원인을 파악합니다.</span>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
            <strong>참고:</strong> 백엔드 서버(localhost:3001)가 실행 중이어야 합니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default LotTrace;
