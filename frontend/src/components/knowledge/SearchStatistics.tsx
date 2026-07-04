// SearchStatistics.tsx - 검색 통계 컴포넌트
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Search,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface DailySearchStats {
  date: string;
  totalSearches: number;
  uniqueUsers: number;
  avgResponseTime: number;
  successRate: number;
}

interface TopSearchQuery {
  query: string;
  count: number;
  category: string;
  avgSimilarity: number;
}

const SearchStatistics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  const dailyStats: DailySearchStats[] = [
    { date: '2026-03-24', totalSearches: 1245, uniqueUsers: 89, avgResponseTime: 0.12, successRate: 94.5 },
    { date: '2026-03-25', totalSearches: 1356, uniqueUsers: 95, avgResponseTime: 0.11, successRate: 95.2 },
    { date: '2026-03-26', totalSearches: 1423, uniqueUsers: 102, avgResponseTime: 0.13, successRate: 93.8 },
    { date: '2026-03-27', totalSearches: 1589, uniqueUsers: 108, avgResponseTime: 0.12, successRate: 96.1 },
    { date: '2026-03-28', totalSearches: 1678, uniqueUsers: 115, avgResponseTime: 0.11, successRate: 95.7 },
    { date: '2026-03-29', totalSearches: 1823, uniqueUsers: 123, avgResponseTime: 0.10, successRate: 97.2 },
    { date: '2026-03-30', totalSearches: 1945, uniqueUsers: 132, avgResponseTime: 0.09, successRate: 98.1 }
  ];

  const topQueries: TopSearchQuery[] = [
    { query: '품질 관리 절차', count: 456, category: '품질', avgSimilarity: 0.92 },
    { query: '설비 점검 방법', count: 389, category: '설비', avgSimilarity: 0.89 },
    { query: '원가 분석 방법론', count: 345, category: '원가', avgSimilarity: 0.87 },
    { query: '생산 공정 표준', count: 298, category: '생산', avgSimilarity: 0.91 },
    { query: '안전 수칙', count: 267, category: '안전', avgSimilarity: 0.94 },
    { query: '4M2E 분석', count: 234, category: '분석', avgSimilarity: 0.88 },
    { query: '불량 원인 분석', count: 212, category: '품질', avgSimilarity: 0.86 },
    { query: '예산 관리', count: 189, category: '재무', avgSimilarity: 0.85 }
  ];

  const categoryStats = [
    { category: '품질', searches: 4523, percentage: 28, color: 'blue' },
    { category: '설비', searches: 3678, percentage: 23, color: 'green' },
    { category: '생산', searches: 2891, percentage: 18, color: 'purple' },
    { category: '원가', searches: 2234, percentage: 14, color: 'orange' },
    { category: '안전', searches: 1456, percentage: 9, color: 'red' },
    { category: '재무', searches: 1234, percentage: 8, color: 'yellow' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const totalSearches = dailyStats.reduce((sum, day) => sum + day.totalSearches, 0);
  const avgResponseTime = dailyStats.reduce((sum, day) => sum + day.avgResponseTime, 0) / dailyStats.length;
  const avgSuccessRate = dailyStats.reduce((sum, day) => sum + day.successRate, 0) / dailyStats.length;
  const uniqueUsers = dailyStats[dailyStats.length - 1].uniqueUsers;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">검색 통계</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            벡터 검색 사용 현황 및 성능 지표 분석
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 검색 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalSearches.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                +12.5%
              </div>
            </div>
            <Search className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">평균 응답시간</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{avgResponseTime.toFixed(2)}s</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                -8.3%
              </div>
            </div>
            <Clock className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">성공률</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{avgSuccessRate.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                +2.1%
              </div>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{uniqueUsers}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600 dark:text-green-400">
                <Users className="w-4 h-4" />
                +5.2%
              </div>
            </div>
            <Users className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 일별 검색 추이 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">일별 검색 추이</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">날짜</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">검색 수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">사용자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">응답시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">성공률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {dailyStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stat.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stat.totalSearches.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stat.uniqueUsers}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{stat.avgResponseTime.toFixed(2)}s</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      stat.successRate >= 95 ? 'bg-green-100 text-green-800' :
                      stat.successRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stat.successRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 검색어 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">인기 검색어 Top 10</h3>
          <div className="space-y-3">
            {topQueries.map((query, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx < 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{query.query}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {query.category} • 평균 유사도 {(query.avgSimilarity * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">{query.count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">회</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 분포 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">카테고리별 검색 분포</h3>
          <div className="space-y-4">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-900 dark:text-white font-medium">{cat.category}</div>
                <div className="flex-1">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${getColorClass(cat.color)}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{cat.searches.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{cat.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchStatistics;
