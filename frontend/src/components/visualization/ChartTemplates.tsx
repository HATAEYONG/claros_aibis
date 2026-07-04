import React, { useState } from 'react';
import { DescriptionIcon, SearchIcon, GridIcon, BarChartIcon } from '@/components/icons/Icons';

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: 'trend' | 'comparison' | 'distribution' | 'composition' | 'correlation' | 'geographical';
  thumbnail: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  popular: boolean;
}

const ChartTemplates: React.FC = () => {
  const [templates] = useState<ChartTemplate[]>([
    {
      id: '1',
      name: '매출 추이 분석',
      description: '월별/분기별 매출 추이를 선형 차트로 분석',
      category: 'trend',
      thumbnail: '📈',
      difficulty: 'easy',
      popular: true
    },
    {
      id: '2',
      name: '제품별 비교',
      description: '제품/서비스 간 성과 비교를 위한 막대 차트',
      category: 'comparison',
      thumbnail: '📊',
      difficulty: 'easy',
      popular: true
    },
    {
      id: '3',
      name: '시장 점유율',
      description: '카테고리별 시장 점유율을 원형 차트로 시각화',
      category: 'composition',
      thumbnail: '🥧',
      difficulty: 'easy',
      popular: true
    },
    {
      id: '4',
      name: '품질 분포 분석',
      description: '품질 데이터의 분포를 히스토그램으로 분석',
      category: 'distribution',
      thumbnail: '📉',
      difficulty: 'medium',
      popular: false
    },
    {
      id: '5',
      name: '상관관계 분석',
      description: '변수 간의 상관관계를 산점도로 시각화',
      category: 'correlation',
      thumbnail: '✨',
      difficulty: 'medium',
      popular: false
    },
    {
      id: '6',
      name: '지역별 매출 지도',
      description: '지리적 매출 데이터를 지도에 시각화',
      category: 'geographical',
      thumbnail: '🗺️',
      difficulty: 'advanced',
      popular: true
    },
    {
      id: '7',
      name: '영업 대비 목표 달성률',
      description: '영업 목표 대비 실적 달성률을 게이지로 표시',
      category: 'comparison',
      thumbnail: '🎯',
      difficulty: 'easy',
      popular: true
    },
    {
      id: '8',
      name: '추세와 이상치',
      description: '시계열 데이터와 이상치를 함께 표시',
      category: 'trend',
      thumbnail: '🔍',
      difficulty: 'advanced',
      popular: false
    },
    {
      id: '9',
      name: '누적 영업 실적',
      description: '기간별 누적 영업 실적을 영역 차트로 표시',
      category: 'trend',
      thumbnail: '🏔️',
      difficulty: 'medium',
      popular: false
    },
    {
      id: '10',
      name: '다중 지표 대시보드',
      description: '여러 KPI를 한눈에 확인하는 복합 차트',
      category: 'comparison',
      thumbnail: '📊',
      difficulty: 'advanced',
      popular: true
    },
    {
      id: '11',
      name: '파레토 분석',
      description: '품질 불량 원인별 파레토 분석',
      category: 'composition',
      thumbnail: '📊',
      difficulty: 'medium',
      popular: false
    },
    {
      id: '12',
      name: '히트맵 달력',
      description: '일별 활동 내역을 히트맵 달력으로 시각화',
      category: 'trend',
      thumbnail: '📅',
      difficulty: 'medium',
      popular: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'trend', name: '추세 분석' },
    { id: 'comparison', name: '비교 분석' },
    { id: 'distribution', name: '분포 분석' },
    { id: 'composition', name: '구성 분석' },
    { id: 'correlation', name: '상관관계' },
    { id: 'geographical', name: '지리적' }
  ];

  const difficulties = [
    { id: 'all', name: '전체' },
    { id: 'easy', name: '쉬움' },
    { id: 'medium', name: '보통' },
    { id: 'advanced', name: '고급' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = { easy: '쉬움', medium: '보통', advanced: '고급' };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.name : category;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleUseTemplate = (template: ChartTemplate) => {
    alert(`템플릿 사용: ${template.name}`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">차트 템플릿</h2>
          <p className="text-gray-600 mt-1">미리 만들어진 차트 템플릿을 사용하여 빠르게 시각화하세요</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="템플릿 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {difficulties.map(difficulty => (
            <button
              key={difficulty.id}
              onClick={() => setSelectedDifficulty(difficulty.id)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                selectedDifficulty === difficulty.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {difficulty.name}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Thumbnail */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
              <div className="text-6xl">{template.thumbnail}</div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    {template.popular && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        인기
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                    {getDifficultyLabel(template.difficulty)}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  사용
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <DescriptionIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default ChartTemplates;
