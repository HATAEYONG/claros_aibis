import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'wide';
  position: { row: number; col: number };
  visible: boolean;
  minimized: boolean;
  config?: Record<string, any>;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'default' | 'executive' | 'operations' | 'financial' | 'custom';
  thumbnail?: string;
  widgets: Widget[];
  layout: 'grid' | 'masonry' | 'list';
}

interface WidgetContextType {
  widgets: Widget[];
  templates: DashboardTemplate[];
  activeTemplate: string | null;
  isEditMode: boolean;
  setEditMode: (edit: boolean) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  reorderWidgets: (widgets: Widget[]) => void;
  toggleWidgetVisibility: (id: string) => void;
  toggleWidgetMinimized: (id: string) => void;
  saveTemplate: (name: string, description: string, category: DashboardTemplate['category']) => void;
  loadTemplate: (templateId: string) => void;
  resetToDefault: () => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const useWidgets = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within WidgetProvider');
  }
  return context;
};

// Default dashboard templates
const defaultTemplates: DashboardTemplate[] = [
  {
    id: 'default',
    name: '기본 대시보드',
    description: '표준 레이아웃의 대시보드',
    category: 'default',
    layout: 'grid',
    widgets: [
      { id: 'kpi-1', type: 'kpi', title: '총 매출', size: 'small', position: { row: 0, col: 0 }, visible: true, minimized: false },
      { id: 'kpi-2', type: 'kpi', title: '생산량', size: 'small', position: { row: 0, col: 1 }, visible: true, minimized: false },
      { id: 'kpi-3', type: 'kpi', title: '불량률', size: 'small', position: { row: 0, col: 2 }, visible: true, minimized: false },
      { id: 'kpi-4', type: 'kpi', title: '재고액', size: 'small', position: { row: 0, col: 3 }, visible: true, minimized: false },
      { id: 'chart-1', type: 'chart', title: '매출 추이', size: 'wide', position: { row: 1, col: 0 }, visible: true, minimized: false, config: { chartType: 'line' } },
      { id: 'chart-2', type: 'chart', title: '생산 현황', size: 'medium', position: { row: 2, col: 0 }, visible: true, minimized: false, config: { chartType: 'bar' } },
      { id: 'chart-3', type: 'chart', title: '품질 지표', size: 'medium', position: { row: 2, col: 1 }, visible: true, minimized: false, config: { chartType: 'doughnut' } },
    ]
  },
  {
    id: 'executive',
    name: '경영진 요약',
    description: '경영진을 위한 핵심 지표 중심 대시보드',
    category: 'executive',
    layout: 'grid',
    widgets: [
      { id: 'kpi-1', type: 'kpi', title: '총 매출', size: 'small', position: { row: 0, col: 0 }, visible: true, minimized: false },
      { id: 'kpi-2', type: 'kpi', title: '영업이익', size: 'small', position: { row: 0, col: 1 }, visible: true, minimized: false },
      { id: 'kpi-3', type: 'kpi', title: '당기순이익', size: 'small', position: { row: 0, col: 2 }, visible: true, minimized: false },
      { id: 'kpi-4', type: 'kpi', title: 'ROE', size: 'small', position: { row: 0, col: 3 }, visible: true, minimized: false },
      { id: 'chart-1', type: 'chart', title: '재무 제표', size: 'large', position: { row: 1, col: 0 }, visible: true, minimized: false, config: { chartType: 'combined' } },
      { id: 'chart-2', type: 'chart', title: 'KPI 달성률', size: 'wide', position: { row: 2, col: 0 }, visible: true, minimized: false, config: { chartType: 'gauge' } },
    ]
  },
  {
    id: 'operations',
    name: '운영 관리',
    description: '생산, 품질, 설비 운영 중심 대시보드',
    category: 'operations',
    layout: 'grid',
    widgets: [
      { id: 'kpi-1', type: 'kpi', title: '생산량', size: 'small', position: { row: 0, col: 0 }, visible: true, minimized: false },
      { id: 'kpi-2', type: 'kpi', title: '가동률', size: 'small', position: { row: 0, col: 1 }, visible: true, minimized: false },
      { id: 'kpi-3', type: 'kpi', title: '불량률', size: 'small', position: { row: 0, col: 2 }, visible: true, minimized: false },
      { id: 'kpi-4', type: 'kpi', title: '설비 가동', size: 'small', position: { row: 0, col: 3 }, visible: true, minimized: false },
      { id: 'chart-1', type: 'chart', title: '생산 추이', size: 'wide', position: { row: 1, col: 0 }, visible: true, minimized: false, config: { chartType: 'line' } },
      { id: 'chart-2', type: 'chart', title: '불량 유형별', size: 'medium', position: { row: 2, col: 0 }, visible: true, minimized: false, config: { chartType: 'pie' } },
      { id: 'chart-3', type: 'chart', title: '설비 OEE', size: 'medium', position: { row: 2, col: 1 }, visible: true, minimized: false, config: { chartType: 'bar' } },
      { id: 'table-1', type: 'table', title: '실시간 생산 현황', size: 'wide', position: { row: 3, col: 0 }, visible: true, minimized: false },
    ]
  },
  {
    id: 'financial',
    name: '재무 분석',
    description: '재무 성과 및 예산 관리 대시보드',
    category: 'financial',
    layout: 'grid',
    widgets: [
      { id: 'kpi-1', type: 'kpi', title: '총 수익', size: 'small', position: { row: 0, col: 0 }, visible: true, minimized: false },
      { id: 'kpi-2', type: 'kpi', title: '총 비용', size: 'small', position: { row: 0, col: 1 }, visible: true, minimized: false },
      { id: 'kpi-3', type: 'kpi', title: '영업이익률', size: 'small', position: { row: 0, col: 2 }, visible: true, minimized: false },
      { id: 'kpi-4', type: 'kpi', title: '예산 달성률', size: 'small', position: { row: 0, col: 3 }, visible: true, minimized: false },
      { id: 'chart-1', type: 'chart', title: '수익/비용 추이', size: 'wide', position: { row: 1, col: 0 }, visible: true, minimized: false, config: { chartType: 'line' } },
      { id: 'chart-2', type: 'chart', title: '비용 구성', size: 'medium', position: { row: 2, col: 0 }, visible: true, minimized: false, config: { chartType: 'doughnut' } },
      { id: 'chart-3', type: 'chart', title: '부서별 예산', size: 'medium', position: { row: 2, col: 1 }, visible: true, minimized: false, config: { chartType: 'bar' } },
      { id: 'table-1', type: 'table', title: '예산 대비 실적', size: 'wide', position: { row: 3, col: 0 }, visible: true, minimized: false },
    ]
  }
];

interface WidgetProviderProps {
  children: ReactNode;
}

export const WidgetProvider: React.FC<WidgetProviderProps> = ({ children }) => {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    return savedWidgets ? JSON.parse(savedWidgets) : defaultTemplates[0].widgets;
  });

  const [templates, setTemplates] = useState<DashboardTemplate[]>(() => {
    const savedTemplates = localStorage.getItem('dashboard-templates');
    return savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates;
  });

  const [activeTemplate, setActiveTemplate] = useState<string | null>(() => {
    return localStorage.getItem('active-template') || 'default';
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('dashboard-templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    if (activeTemplate) {
      localStorage.setItem('active-template', activeTemplate);
    }
  }, [activeTemplate]);

  const addWidget = useCallback((widget: Widget) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const reorderWidgets = useCallback((newWidgets: Widget[]) => {
    setWidgets(newWidgets);
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, []);

  const toggleWidgetMinimized = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
  }, []);

  const saveTemplate = useCallback((name: string, description: string, category: DashboardTemplate['category']) => {
    const newTemplate: DashboardTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category,
      widgets,
      layout: 'grid'
    };
    setTemplates(prev => [...prev, newTemplate]);
    setActiveTemplate(newTemplate.id);
  }, [widgets]);

  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setWidgets(template.widgets);
      setActiveTemplate(templateId);
    }
  }, [templates]);

  const resetToDefault = useCallback(() => {
    setWidgets(defaultTemplates[0].widgets);
    setActiveTemplate('default');
  }, []);

  return (
    <WidgetContext.Provider value={{
      widgets,
      templates,
      activeTemplate,
      isEditMode,
      setEditMode: setIsEditMode,
      addWidget,
      removeWidget,
      updateWidget,
      reorderWidgets,
      toggleWidgetVisibility,
      toggleWidgetMinimized,
      saveTemplate,
      loadTemplate,
      resetToDefault
    }}>
      {children}
    </WidgetContext.Provider>
  );
};
