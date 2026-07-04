import React, { useState } from 'react';
import { WidgetsIcon, PlusIcon, SearchIcon, GridIcon } from '@/components/icons/Icons';

interface Widget {
  id: string;
  name: string;
  description: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'text';
  category: string;
  icon: string;
  preview: string;
  popular: boolean;
}

const WidgetLibrary: React.FC = () => {
  const [widgets] = useState<Widget[]>([
    {
      id: '1',
      name: '선형 차트',
      description: '시계열 데이터를 선형 그래프로 시각화',
      type: 'chart',
      category: '차트',
      icon: '📈',
      preview: '━━━📈',
      popular: true
    },
    {
      id: '2',
      name: '막대 차트',
      description: '범주형 데이터 비교에 적합한 막대 그래프',
      type: 'chart',
      category: '차트',
      icon: '📊',
      preview: '▃▄▆▇',
      popular: true
    },
    {
      id: '3',
      name: '원형 차트',
      description: '비율을 원형 차트로 시각화',
      type: 'chart',
      category: '차트',
      icon: '🥧',
      preview: '◑◑◑',
      popular: false
    },
    {
      id: '4',
      name: 'KPI 카드',
      description: '주요 성과 지표를 카드 형태로 표시',
      type: 'metric',
      category: '지표',
      icon: '🎯',
      preview: 'KPI',
      popular: true
    },
    {
      id: '5',
      name: '게이지',
      description: '목표 대비 진행률을 게이지로 표시',
      type: 'gauge',
      category: '지표',
      icon: '⚡',
      preview: '🕐',
      popular: true
    },
    {
      id: '6',
      name: '데이터 테이블',
      description: '상세 데이터를 테이블 형태로 표시',
      type: 'table',
      category: '테이블',
      icon: '📋',
      preview: '▦▦',
      popular: false
    },
    {
      id: '7',
      name: '히트맵',
      description: '데이터 밀도를 색상으로 시각화',
      type: 'chart',
      category: '차트',
      icon: '🔥',
      preview: '▒▒▒',
      popular: true
    },
    {
      id: '8',
      name: '지도 차트',
      description: '지리적 데이터를 지도 위에 표시',
      type: 'map',
      category: '지도',
      icon: '🗺️',
      preview: '🌏',
      popular: false
    },
    {
      id: '9',
      name: '텍스트 위젯',
      description: '텍스트와 설명을 표시하는 위젯',
      type: 'text',
      category: '텍스트',
      icon: '📝',
      preview: 'T',
      popular: false
    },
    {
      id: '10',
      name: '산점도',
      description: '두 변수 간의 상관관계를 시각화',
      type: 'chart',
      category: '차트',
      icon: '✨',
      preview: '⋆⋆⋆',
      popular: false
    },
    {
      id: '11',
      name: '영역 차트',
      description: '추적 영역을 강조한 차트',
      type: 'chart',
      category: '차트',
      icon: '🏔️',
      preview: '▔▔▔',
      popular: false
    },
    {
      id: '12',
      name: '누적 막대 차트',
      description: '여러 시리즈를 누적하여 표시',
      type: 'chart',
      category: '차트',
      icon: '📶',
      preview: '▆▆▆',
      popular: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

  const categories = ['all', '차트', '지표', '테이블', '지도', '텍스트'];

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularWidgets = widgets.filter(w => w.popular);

  const handleAddWidget = (widget: Widget) => {
    alert(`위젯 추가: ${widget.name}`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">위젯 라이브러리</h2>
          <p className="text-gray-600 mt-1">다양한 시각화 위젯을 대시보드에 추가하세요</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="위젯 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Popular Widgets */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">인기 위젯</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularWidgets.map(widget => (
            <div
              key={widget.id}
              onClick={() => handleAddWidget(widget)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-white"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{widget.icon}</div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{widget.name}</h4>
                <p className="text-xs text-gray-600">{widget.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? '전체' : category}
          </button>
        ))}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredWidgets.map(widget => (
          <div
            key={widget.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleAddWidget(widget)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl">{widget.icon}</div>
              {widget.popular && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  인기
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">{widget.name}</h4>
            <p className="text-xs text-gray-600 mb-2">{widget.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {widget.category}
              </span>
              <span className="text-xs text-gray-500">{widget.preview}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredWidgets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <WidgetsIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default WidgetLibrary;
