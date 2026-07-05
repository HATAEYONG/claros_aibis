import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  FactoryIcon,
  CheckIcon,
  PackageIcon,
  AlertTriangleIcon,
} from '@/components/icons/Icons';
import { fetchProcessChain, ProcessChain } from '@/services/processChainService';

const DEFAULT_PRODUCT_CODES = ['P001', 'P002', 'P003'];

const ProcessChainView: React.FC = () => {
  const [productCode, setProductCode] = useState('P001');
  const [chain, setChain] = useState<ProcessChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load(productCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCode]);

  const load = async (code: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchProcessChain(code);
    if (result.data) {
      setChain(result.data);
    } else {
      setChain(null);
      setError(result.error || '데이터를 불러오지 못했습니다.');
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const hasAnyData =
    chain &&
    (chain.sales_orders.length > 0 ||
      chain.production_orders.length > 0 ||
      chain.quality_records.length > 0 ||
      chain.materials.length > 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">프로세스 연관성 추적</h2>
          <p className="text-gray-600 mt-1">
            제품 하나를 축으로 수주 → 생산 → 품질검사 → 재고가 실제로 이어지는지 확인합니다
          </p>
        </div>
        <select
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {DEFAULT_PRODUCT_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-gray-500 py-8 text-center">불러오는 중...</div>}

      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangleIcon size={20} />
          {error}
        </div>
      )}

      {!loading && !error && chain && !hasAnyData && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          {chain.product_name}({chain.product_code})에 연결된 프로세스 데이터가 없습니다.
        </div>
      )}

      {!loading && !error && chain && hasAnyData && (
        <div>
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            기준 제품: <span className="font-semibold">{chain.product_name}</span> ({chain.product_code})
          </div>

          {/* 연결 흐름 */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {/* 수주 */}
            <div className="flex-1 min-w-[220px] border border-gray-200 rounded-lg">
              <div className="p-3 bg-blue-600 text-white rounded-t-lg flex items-center gap-2">
                <ShoppingCartIcon size={18} />
                <span className="font-semibold text-sm">수주 (Sales Order)</span>
              </div>
              <div className="p-3 space-y-2">
                {chain.sales_orders.length === 0 && <p className="text-xs text-gray-400">데이터 없음</p>}
                {chain.sales_orders.map((so) => (
                  <div key={so.order_id} className="p-2 bg-blue-50 rounded border border-blue-100 text-xs">
                    <p className="font-semibold text-gray-800">{so.order_number}</p>
                    <p className="text-gray-600">{so.customer_name}</p>
                    <p className="text-gray-600">
                      {so.quantity_shipped} / {so.quantity_ordered} 출하
                    </p>
                    <p className="text-gray-500">담당: {so.sales_person_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {so.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center text-gray-300 text-2xl">→</div>

            {/* 생산 */}
            <div className="flex-1 min-w-[220px] border border-gray-200 rounded-lg">
              <div className="p-3 bg-amber-600 text-white rounded-t-lg flex items-center gap-2">
                <FactoryIcon size={18} />
                <span className="font-semibold text-sm">생산 (Production)</span>
              </div>
              <div className="p-3 space-y-2">
                {chain.production_orders.length === 0 && <p className="text-xs text-gray-400">데이터 없음</p>}
                {chain.production_orders.map((po) => (
                  <div key={po.order_id} className="p-2 bg-amber-50 rounded border border-amber-100 text-xs">
                    <p className="font-semibold text-gray-800">{po.order_number}</p>
                    <p className="text-gray-600">설비: {po.equipment_name}</p>
                    <p className="text-gray-600">
                      {po.quantity_produced} / {po.quantity_ordered} 생산 (스크랩 {po.quantity_scrapped})
                    </p>
                    <p className="text-gray-500">담당: {po.production_supervisor_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      {po.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center text-gray-300 text-2xl">→</div>

            {/* 품질 */}
            <div className="flex-1 min-w-[220px] border border-gray-200 rounded-lg">
              <div className="p-3 bg-purple-600 text-white rounded-t-lg flex items-center gap-2">
                <CheckIcon size={18} />
                <span className="font-semibold text-sm">품질검사 (Quality)</span>
              </div>
              <div className="p-3 space-y-2">
                {chain.quality_records.length === 0 && <p className="text-xs text-gray-400">데이터 없음</p>}
                {chain.quality_records.map((qr) => (
                  <div key={qr.record_id} className="p-2 bg-purple-50 rounded border border-purple-100 text-xs">
                    <p className="font-semibold text-gray-800">{qr.record_number}</p>
                    <p className="text-gray-600">고객: {qr.customer_name}</p>
                    <p className="text-gray-600">
                      합격 {qr.ok_quantity} / 검사 {qr.inspection_quantity} (불량 {qr.ng_quantity})
                    </p>
                    <p className="text-gray-500">검사자: {qr.inspector_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {qr.result}
                    </span>
                    {qr.capa_required && (
                      <span className="ml-1 inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        CAPA {qr.capa_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center text-gray-300 text-2xl">→</div>

            {/* 재고 */}
            <div className="flex-1 min-w-[220px] border border-gray-200 rounded-lg">
              <div className="p-3 bg-green-600 text-white rounded-t-lg flex items-center gap-2">
                <PackageIcon size={18} />
                <span className="font-semibold text-sm">재고 (Material)</span>
              </div>
              <div className="p-3 space-y-2">
                {chain.materials.length === 0 && <p className="text-xs text-gray-400">데이터 없음</p>}
                {chain.materials.map((m) => (
                  <div key={m.material_id} className="p-2 bg-green-50 rounded border border-green-100 text-xs">
                    <p className="font-semibold text-gray-800">
                      {m.plant} / {m.warehouse}
                    </p>
                    <p className="text-gray-600">공급처: {m.primary_vendor_name}</p>
                    <p className="text-gray-600">
                      가용재고 {m.quantity_available} (안전재고 {m.safety_stock})
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      ABC 등급 {m.is_abcs}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            이 4개 카드는 전부 같은 제품({chain.product_code})을 통해 실제 데이터베이스 관계(FK)로 연결되어 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessChainView;
