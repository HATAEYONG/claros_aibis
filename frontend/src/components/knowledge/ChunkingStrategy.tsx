// ChunkingStrategy.tsx - 청킹 전략 컴포넌트
import { useState } from 'react';
import {
  Scissors,
  FileText,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Code,
  File,
  Sliders
} from 'lucide-react';

interface ChunkingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'fixed' | 'semantic' | 'recursive' | 'hybrid';
  chunkSize: number;
  overlap: number;
  documentTypes: string[];
  pros: string[];
  cons: string[];
}

interface ChunkStatistics {
  strategy: string;
  avgChunkSize: number;
  totalChunks: number;
  processingTime: string;
  retrievalAccuracy: number;
  memoryUsage: string;
}

const ChunkingStrategy: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('semantic');
  const [isApplying, setIsApplying] = useState(false);

  const strategies: ChunkingStrategy[] = [
    {
      id: 'fixed',
      name: '고정 크기 청킹',
      description: '문서를 고정된 크기의 청크로 분할합니다. 가장 간단하고 빠른 방식입니다.',
      type: 'fixed',
      chunkSize: 1000,
      overlap: 200,
      documentTypes: ['텍스트', 'PDF', '일반 문서'],
      pros: ['구현이 간단함', '처리 속도가 빠름', '메모리 사용량이 적음'],
      cons: ['문맥이 끊길 수 있음', '의미 단위 무시', '검색 정확도가 낮을 수 있음']
    },
    {
      id: 'semantic',
      name: '시맨틱 청킹',
      description: '문장의 의미와 문맥을 고려하여 지능적으로 분할합니다.',
      type: 'semantic',
      chunkSize: 1500,
      overlap: 300,
      documentTypes: ['기술 문서', '매뉴얼', '보고서'],
      pros: ['문맥 보존이 우수함', '검색 정확도가 높음', '자연스러운 분할'],
      cons: ['처리 시간이 김', '복잡한 구현', '더 많은 메모리 사용']
    },
    {
      id: 'recursive',
      name: '재귀적 청킹',
      description: '다양한 구분자를 순차적으로 시도하여 최적의 분할점을 찾습니다.',
      type: 'recursive',
      chunkSize: 1200,
      overlap: 250,
      documentTypes: ['구조화된 문서', '마크다운', 'HTML'],
      pros: ['구조를 보존함', '유연한 분할', '문단/문단 단위 유지'],
      cons: ['중간 복잡도', '일부 문맥 손실 가능']
    },
    {
      id: 'hybrid',
      name: '하이브리드 청킹',
      description: '여러 청킹 방식을 결합하여 최적의 결과를 제공합니다.',
      type: 'hybrid',
      chunkSize: 1000,
      overlap: 200,
      documentTypes: ['복합 문서', '대규모 문서', '특수 형식'],
      pros: ['최적의 성능', '높은 정확도', '유연성'],
      cons: ['가장 복잡함', '가장 느림', '많은 리소스 사용']
    }
  ];

  const statistics: ChunkStatistics[] = [
    {
      strategy: '고정 크기',
      avgChunkSize: 1000,
      totalChunks: 156847,
      processingTime: '0.5s',
      retrievalAccuracy: 0.75,
      memoryUsage: '450MB'
    },
    {
      strategy: '시맨틱',
      avgChunkSize: 1500,
      totalChunks: 104564,
      processingTime: '2.3s',
      retrievalAccuracy: 0.92,
      memoryUsage: '1.2GB'
    },
    {
      strategy: '재귀적',
      avgChunkSize: 1200,
      totalChunks: 130706,
      processingTime: '1.1s',
      retrievalAccuracy: 0.85,
      memoryUsage: '780MB'
    },
    {
      strategy: '하이브리드',
      avgChunkSize: 1100,
      totalChunks: 142590,
      processingTime: '3.5s',
      retrievalAccuracy: 0.95,
      memoryUsage: '1.8GB'
    }
  ];

  const getStrategyTypeColor = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'semantic':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'recursive':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'hybrid':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return '고정 크기';
      case 'semantic':
        return '시맨틱';
      case 'recursive':
        return '재귀적';
      case 'hybrid':
        return '하이브리드';
      default:
        return type;
    }
  };

  const handleApplyStrategy = async () => {
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsApplying(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">청킹 전략</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RAG 시스템을 위한 문서 청킹 방법 설정 및 최적화
          </p>
        </div>
        <button
          onClick={handleApplyStrategy}
          disabled={isApplying}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isApplying
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${isApplying ? 'animate-spin' : ''}`} />
          {isApplying ? '적용 중...' : '전략 적용'}
        </button>
      </div>

      {/* 청킹 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">청킹 전략 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">전략</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">평균 크기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">총 청크 수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">처리 시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">검색 정확도</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">메모리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {statistics.map((stat, idx) => (
                <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                  selectedStrategy === strategies.find(s => s.name.includes(stat.strategy.split(' ')[0]))?.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{stat.strategy}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{stat.avgChunkSize}자</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{stat.totalChunks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{stat.processingTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stat.retrievalAccuracy >= 0.9 ? 'bg-green-500' :
                            stat.retrievalAccuracy >= 0.8 ? 'bg-blue-500' :
                            stat.retrievalAccuracy >= 0.7 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${stat.retrievalAccuracy * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{(stat.retrievalAccuracy * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{stat.memoryUsage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 청킹 전략 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
              selectedStrategy === strategy.id
                ? 'border-blue-500 dark:border-blue-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setSelectedStrategy(strategy.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStrategyTypeColor(strategy.type)}`}>
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{strategy.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStrategyTypeColor(strategy.type)}`}>
                    {getTypeLabel(strategy.type)}
                  </span>
                </div>
              </div>
              {selectedStrategy === strategy.id && (
                <CheckCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{strategy.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">청크 크기</span>
                <p className="font-semibold text-gray-900 dark:text-white">{strategy.chunkSize}자</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">오버랩</span>
                <p className="font-semibold text-gray-900 dark:text-white">{strategy.overlap}자</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">지원 문서 유형</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {strategy.documentTypes.map((type, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 장점
                </span>
                <ul className="mt-1 space-y-1">
                  {strategy.pros.map((pro, idx) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 단점
                </span>
                <ul className="mt-1 space-y-1">
                  {strategy.cons.map((con, idx) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 고급 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          고급 설정
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              최소 청크 크기
            </label>
            <input
              type="number"
              defaultValue={500}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              최대 청크 크기
            </label>
            <input
              type="number"
              defaultValue={2000}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              오버랩 비율 (%)
            </label>
            <input
              type="number"
              defaultValue={20}
              min={0}
              max={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChunkingStrategy;
