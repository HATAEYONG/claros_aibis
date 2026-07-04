import React, { useState } from 'react';
import { DashboardIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon } from '@/components/icons/Icons';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  owner: string;
  isPublic: boolean;
  widgetCount: number;
  lastModified: string;
  thumbnail: string;
  category: 'business' | 'production' | 'quality' | 'financial';
}

const DashboardManagement: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([
    {
      id: '1',
      name: '경영진 대시보드',
      description: '주요 경영 지표를 한눈에 파악하는 경영진용 대시보드',
      owner: '관리자',
      isPublic: true,
      widgetCount: 12,
      lastModified: '2026-03-31',
      thumbnail: '📊',
      category: 'business'
    },
    {
      id: '2',
      name: '생산 현황 모니터링',
      description: '실시간 생산 현황과 설비 가동률을 모니터링',
      owner: '생산팀',
      isPublic: true,
      widgetCount: 8,
      lastModified: '2026-03-30',
      thumbnail: '🏭',
      category: 'production'
    },
    {
      id: '3',
      name: '품질 관리 대시보드',
      description: '품질 검사 결과와 불량률 추이를 분석',
      owner: '품질팀',
      isPublic: true,
      widgetCount: 6,
      lastModified: '2026-03-29',
      thumbnail: '✅',
      category: 'quality'
    },
    {
      id: '4',
      name: '재무 분석 대시보드',
      description: '매출, 비용, 이익 등 재무 지표를 종합 분석',
      owner: '재무팀',
      isPublic: false,
      widgetCount: 10,
      lastModified: '2026-03-28',
      thumbnail: '💰',
      category: 'financial'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'business', name: '경영', icon: '💼' },
    { id: 'production', name: '생산', icon: '🏭' },
    { id: 'quality', name: '품질', icon: '✅' },
    { id: 'financial', name: '재무', icon: '💰' }
  ];

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.name : category;
  };

  const filteredDashboards = selectedCategory === 'all'
    ? dashboards
    : dashboards.filter(d => d.category === selectedCategory);

  const handleCreateDashboard = () => {
    setShowModal(true);
  };

  const handleEditDashboard = (id: string) => {
    alert(`대시보드 수정: ${id}`);
  };

  const handleDeleteDashboard = (id: string) => {
    if (confirm('정말 이 대시보드를 삭제하시겠습니까?')) {
      setDashboards(dashboards.filter(d => d.id !== id));
    }
  };

  const handleDuplicateDashboard = (id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (dashboard) {
      setDashboards([...dashboards, {
        ...dashboard,
        id: Date.now().toString(),
        name: `${dashboard.name} (복사본)`
      }]);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">대시보드 관리</h2>
          <p className="text-gray-600 mt-1">데이터 시각화 대시보드를 생성하고 관리합니다</p>
        </div>
        <button
          onClick={handleCreateDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon size={20} />
          새 대시보드
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {filteredDashboards.map(dashboard => (
          <div
            key={dashboard.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{dashboard.thumbnail}</span>
                  <h3 className="text-lg font-semibold text-gray-800">{dashboard.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{dashboard.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{getCategoryLabel(dashboard.category)}</span>
                  <span>•</span>
                  <span>{dashboard.owner}</span>
                  <span>•</span>
                  <span>위젯 {dashboard.widgetCount}개</span>
                  {dashboard.isPublic && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">공개</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">마지막 수정: {dashboard.lastModified}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => alert(`대시보드 보기: ${dashboard.id}`)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <EyeIcon size={16} />
                보기
              </button>
              <button
                onClick={() => handleEditDashboard(dashboard.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <EditIcon size={16} />
                편집
              </button>
              <button
                onClick={() => handleDuplicateDashboard(dashboard.id)}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                title="복제"
              >
                📋
              </button>
              <button
                onClick={() => handleDeleteDashboard(dashboard.id)}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                title="삭제"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <DashboardModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

interface DashboardModalProps {
  onClose: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'business',
    isPublic: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`대시보드 생성: ${formData.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">새 대시보드 생성</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="business">경영</option>
              <option value="production">생산</option>
              <option value="quality">품질</option>
              <option value="financial">재무</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded text-blue-600"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">공개 대시보드</label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardManagement;
