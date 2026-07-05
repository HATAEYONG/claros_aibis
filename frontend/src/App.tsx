import React, { lazy, Suspense } from 'react';

// 성능 최적화: React.lazy()를 통한 코드 분할 (Code Splitting)
// 각 컴포넌트를 별도의 청크로 분리하여 초기 로딩 시간 단축

// Admin
const LLMSettings = lazy(() => import('@/components/admin/LLMSettings'));

// Chat
const AIAssistantChat = lazy(() => import('@/components/chat/AIAssistantChatV2'));
const CausalAnalysisViewer = lazy(() => import('@/components/chat/CausalAnalysisViewer'));
const SQLResultViewer = lazy(() => import('@/components/chat/SQLResultViewer'));

// Common (필수 컴포넌트는 lazy 로딩하지 않음)
import ThemeToggle from '@/components/common/ThemeToggle';
import ToastContainer from '@/components/common/Toast';

// Dashboard - 자주 사용되는 컴포넌트부터 lazy 적용
const ABCCost = lazy(() => import('@/components/dashboard/ABCCost'));
const AdvancedVisualization = lazy(() => import('@/components/dashboard/AdvancedVisualization'));
const AIInsights = lazy(() => import('@/components/dashboard/AIInsights'));
const CollaborationDemo = lazy(() => import('@/components/dashboard/CollaborationDemo'));
const CostManagement = lazy(() => import('@/components/dashboard/CostManagement'));
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard'));
const DashboardV2 = lazy(() => import('@/components/dashboard/DashboardV2'));
const IntegratedDashboard = lazy(() => import('@/components/dashboard/IntegratedDashboard'));
const DataExportDemo = lazy(() => import('@/components/dashboard/DataExportDemo'));
const DesignCost = lazy(() => import('@/components/dashboard/DesignCost'));
const Development = lazy(() => import('@/components/dashboard/Development'));
const ESG = lazy(() => import('@/components/dashboard/ESG'));
const ExtendedScenarioAnalysis = lazy(() => import('@/components/dashboard/ExtendedScenarioAnalysis'));
const FinancialIndicators = lazy(() => import('@/components/dashboard/FinancialIndicators'));
const FinancialManagement = lazy(() => import('@/components/dashboard/FinancialManagement'));
const FourM2EStrategy = lazy(() => import('@/components/dashboard/FourM2EStrategy'));
const KPIManagement = lazy(() => import('@/components/dashboard/KPIManagement'));
const LocalAnalysis = lazy(() => import('@/components/dashboard/LocalAnalysis'));
const LotTrace = lazy(() => import('@/components/dashboard/LotTrace'));
const ManagerialAccounting = lazy(() => import('@/components/dashboard/ManagerialAccounting'));
const Manufacturing = lazy(() => import('@/components/dashboard/Manufacturing'));
const Ontology = lazy(() => import('@/components/dashboard/Ontology'));
const OutsourcingCost = lazy(() => import('@/components/dashboard/OutsourcingCost'));
const PerformanceOptimizationDemo = lazy(() => import('@/components/dashboard/PerformanceOptimization'));
import Production from '@/components/dashboard/Production';
import Productivity from '@/components/dashboard/Productivity';
import PurchaseCost from '@/components/dashboard/PurchaseCost';
import Quality from '@/components/dashboard/Quality';
import QualityCost from '@/components/dashboard/QualityCost';
import Reports from '@/components/dashboard/Reports';
import { CostBreakdown, CostDriverAnalysis } from '@/components/cost';
// Business Process (named imports are kept non-lazy for compatibility)
import { O2CView, P2PView, ProcessFlowChart, ProcessChainView } from '@/components/business-process';
const Sales = lazy(() => import('@/components/dashboard/Sales'));
const SalesCost = lazy(() => import('@/components/dashboard/SalesCost'));
const ScenarioAnalysis = lazy(() => import('@/components/dashboard/ScenarioAnalysis'));
const StandardCost = lazy(() => import('@/components/dashboard/StandardCost'));
const Standards = lazy(() => import('@/components/dashboard/Standards'));
const YHDatabaseConnection = lazy(() => import('@/components/dashboard/YHDatabaseConnection'));
const UpgradeStatus = lazy(() => import('@/components/dashboard/UpgradeStatus'));

// Control Tower
const ExecutiveTower = lazy(() => import('@/components/control_tower/ExecutiveTower'));
const FinancialTower = lazy(() => import('@/components/control_tower/FinancialTower'));
const SalesTower = lazy(() => import('@/components/control_tower/SalesTower'));
const ProductionTower = lazy(() => import('@/components/control_tower/ProductionTower'));
const PurchasingTower = lazy(() => import('@/components/control_tower/PurchasingTower'));
const QualityTower = lazy(() => import('@/components/control_tower/QualityTower'));

// Agents
const AgentMonitoring = lazy(() => import('@/components/agents/AgentMonitoring'));
const AgentExecutionLogs = lazy(() => import('@/components/agents/AgentExecutionLogs'));
const AgentPerformanceEvaluation = lazy(() => import('@/components/agents/AgentPerformanceEvaluation'));
const AgentRecommendationManagement = lazy(() => import('@/components/agents/AgentRecommendationManagement'));
const AgentLearningLogs = lazy(() => import('@/components/agents/AgentLearningLogs'));

// Events
const EventDashboard = lazy(() => import('@/components/events/EventDashboard'));
const EventList = lazy(() => import('@/components/events/EventList'));
const EventTimeline = lazy(() => import('@/components/events/EventTimeline'));
const EventCorrelationAnalysis = lazy(() => import('@/components/events/EventCorrelationAnalysis'));
const AlertManagement = lazy(() => import('@/components/events/AlertManagement'));
const IssueTracker = lazy(() => import('@/components/events/IssueTracker'));

// Knowledge Graph
const GraphExplorer = lazy(() => import('@/components/knowledge_graph/GraphExplorer'));
const PathAnalysis = lazy(() => import('@/components/knowledge_graph/PathAnalysis'));
const CentralityAnalysis = lazy(() => import('@/components/knowledge_graph/CentralityAnalysis'));
const FourM2EImpact = lazy(() => import('@/components/knowledge_graph/FourM2EImpact'));
const DataFlowTracking = lazy(() => import('@/components/knowledge_graph/DataFlowTracking'));

// Knowledge
const DocumentManagement = lazy(() => import('@/components/knowledge/DocumentManagement'));
const VectorSearch = lazy(() => import('@/components/knowledge/VectorSearch'));
const ChunkingStrategy = lazy(() => import('@/components/knowledge/ChunkingStrategy'));
const SearchStatistics = lazy(() => import('@/components/knowledge/SearchStatistics'));

// Additional Chat
const AgentChatbotV2 = lazy(() => import('@/components/chat/AgentChatbotV2'));
const OntologyAIAssistant = lazy(() => import('@/components/chat/OntologyAIAssistant'));
const AgentTrace = lazy(() => import('@/components/chat/AgentTrace'));
const ConversationContext = lazy(() => import('@/components/chat/ConversationContext'));
const EvidenceViewer = lazy(() => import('@/components/chat/EvidenceViewer'));
const EvidenceViewerPage = lazy(() => import('@/components/chat/EvidenceViewerPage'));

// ERP
import { ERPSyncConfiguration } from '@/components/erp/ERPSyncConfiguration';
const MappingManagement = lazy(() => import('@/components/erp/MappingManagement'));

// Integration
const IntegrationSettings = lazy(() => import('@/components/integration/IntegrationSettings'));
const SyncStatus = lazy(() => import('@/components/integration/SyncStatus'));
const WebhookManagement = lazy(() => import('@/components/integration/WebhookManagement'));
const DataExchange = lazy(() => import('@/components/integration/DataExchange'));
// Phase 4: Visualization components
import DashboardManagement from '@/components/visualization/DashboardManagement';
import WidgetLibrary from '@/components/visualization/WidgetLibrary';
import RealtimeStreaming from '@/components/visualization/RealtimeStreaming';
import ChartTemplates from '@/components/visualization/ChartTemplates';
// Phase 5: Monitoring components
import HealthCheck from '@/components/monitoring/HealthCheck';
import ApiUsage from '@/components/monitoring/ApiUsage';
import PerformanceMetrics from '@/components/monitoring/PerformanceMetrics';
import ErrorLogs from '@/components/monitoring/ErrorLogs';
import CacheStatistics from '@/components/monitoring/CacheStatistics';
// Phase 5: Security components
import AuditLogs from '@/components/security/AuditLogs';
import SecurityEvents from '@/components/security/SecurityEvents';
import LoginAttempts from '@/components/security/LoginAttempts';
import SuspiciousIPs from '@/components/security/SuspiciousIPs';
import ApiDocumentation from '@/components/security/ApiDocumentation';
// OCPM Integration
import EventHubManagement from '@/components/axos_erp/EventHubManagement';
import AIRiskAnalysis from '@/components/axos_erp/AIRiskAnalysis';
import ForecastingManagement from '@/components/axos_erp/ForecastingManagement';
import AlertManagementComponent from '@/components/axos_erp/AlertManagement';
import WorkflowManagement from '@/components/axos_erp/WorkflowManagement';
import ProcessGraph from '@/components/axos_erp/ProcessGraph';
// OCPM Enhancement (SAP ERP)
import ProductionPlanManagement from '@/components/axos_erp/ProductionPlanManagement';
import BOMCostManagement from '@/components/axos_erp/BOMCostManagement';
import QualityInspectionManagement from '@/components/axos_erp/QualityInspectionManagement';
import EquipmentMaintenanceManagement from '@/components/axos_erp/EquipmentMaintenanceManagement';
import InventoryMRPManagement from '@/components/axos_erp/InventoryMRPManagement';
import ProductionPerformanceAnalysis from '@/components/axos_erp/ProductionPerformanceAnalysis';
// Phase 11: Next-Gen AI components
import DiffusionModels from '@/components/next_gen_ai/DiffusionModels';
import NeuralArchitectureSearch from '@/components/next_gen_ai/NeuralArchitectureSearch';
import AdvancedCausal from '@/components/next_gen_ai/AdvancedCausal';
import MultiAgentSystem from '@/components/next_gen_ai/MultiAgentSystem';
import EdgeAI from '@/components/next_gen_ai/EdgeAI';
import DigitalTwin from '@/components/next_gen_ai/DigitalTwin';
import QuantumML from '@/components/next_gen_ai/QuantumML';
// AI/ML Features components
import AutoMLDashboard from '@/components/ai_features/AutoMLDashboard';
import MLOpsDashboard from '@/components/ai_features/MLOpsDashboard';
import XAIexplainedAIDashboard from '@/components/ai_features/XAIexplainedAIDashboard';
import LLMIntegrationDashboard from '@/components/ai_features/LLMIntegrationDashboard';
import MultimodalPredictionDashboard from '@/components/ai_features/MultimodalPredictionDashboard';
import FederatedLearningDashboard from '@/components/ai_features/FederatedLearningDashboard';
import KnowledgeGraphDashboard from '@/components/ai_features/KnowledgeGraphDashboard';
import ReinforcementLearningDashboard from '@/components/ai_features/ReinforcementLearningDashboard';
import IntegratedAIDashboard from '@/components/ai_features/IntegratedAIDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  ActivityIcon,
  AlertIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  BarChartIcon,
  BellIcon,
  BookIcon,
  BotIcon,
  BrainIcon,
  CalendarIcon,
  CheckIcon,
  DatabaseIcon,
  DollarIcon,
  FactoryIcon,
  FileIcon,
  GitBranchIcon,
  LayoutIcon,
  MenuIcon,
  NetworkIcon,
  PackageIcon,
  PlayIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TargetIcon,
  TrendUpIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
  LayersIcon,
  CheckCircleIcon,
  WrenchIcon,
  // Phase 4 & 5 Icons
  ExtensionIcon,
  SyncIcon,
  WebhookIcon,
  SwapHorizIcon,
  DashboardIcon,
  WidgetsIcon,
  StreamIcon,
  DescriptionIcon,
  FavoriteIcon,
  ApiIcon,
  SpeedIcon,
  ErrorIcon,
  StorageIcon,
  SecurityIcon,
  WarningIcon,
  LoginIcon,
  BlockIcon,
  MonitorIcon,
  HistoryIcon,
  // Phase 11: Next-Gen AI Icons
  CpuIcon,
  CopyIcon,
  AtomIcon,
  MemoryIcon,
  EyeIcon,
  DownloadIcon
} from '@/components/icons/Icons';
import PredictionManagement from '@/components/prediction/PredictionManagement';
import ModelManagement from '@/components/prediction/ModelManagement';
import ReinforcementLearning from '@/components/prediction/ReinforcementLearning';
import FourM2EPrediction from '@/components/prediction/FourM2EPrediction';
import FourM2EImpactPrediction from '@/components/prediction/FourM2EImpactPrediction';
import ScenarioPrediction from '@/components/prediction/ScenarioPrediction';
import ESGPrediction from '@/components/prediction/ESGPrediction';
import CostBreakdownPrediction from '@/components/prediction/CostBreakdownPrediction';
// P0: Master Data & KPI Management
import MasterDataManagement from '@/components/master/MasterDataManagement';
import KPIManagementPage from '@/components/kpi/KPIManagementPage';
import CostDriverPrediction from '@/components/prediction/CostDriverPrediction';
import QualityPrediction from '@/components/prediction/QualityPrediction';
import ProductionPrediction from '@/components/prediction/ProductionPrediction';
import InventoryPrediction from '@/components/prediction/InventoryPrediction';
import FinancePrediction from '@/components/prediction/FinancePrediction';
import ParameterTuning from '@/components/prediction/ParameterTuning';
import AccuracyAnalysis from '@/components/prediction/AccuracyAnalysis';
import PredictionVsActual from '@/components/prediction/PredictionVsActual';
import PredictionReport from '@/components/prediction/PredictionReport';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { WidgetProvider } from '@/context/WidgetContext';
import { AnalysisResult, analyzeCausalRelation, isCausalAnalysisQuery, ONTOLOGY_CONCEPTS } from '@/services/causalAnalysisService';
import { getActiveLLM, LLMProvider, sendMessage } from '@/services/llmService';
import { generateSQL, getSchemaSummary, SQLGenerationResult } from '@/services/textToSqlService';
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

// 챗 메시지 타입
interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  provider?: LLMProvider | 'quick' | 'sql' | 'analysis';
  sqlResult?: SQLGenerationResult;
  analysisResult?: AnalysisResult;
}

// MenuItem 컴포넌트 - 중첩된 메뉴 지원
interface MenuItemProps {
  item: any;
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  level: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, activeMenu, setActiveMenu, level }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  // 메뉴 그룹별 색상 설정
  const getMenuColor = (itemId: string) => {
    const colors: Record<string, { bg: string; bgHover: string; bgActive: string; ring: string; text: string }> = {
      // 업그레이드 현황 - 주황
      upgradeStatus: { bg: 'bg-red-700', bgHover: 'hover:bg-red-800', bgActive: 'bg-red-600', ring: 'ring-red-400', text: 'text-red-100' },
      // 경영 대시보드 - 파란
      managementDashboard: { bg: 'bg-purple-700', bgHover: 'hover:bg-purple-800', bgActive: 'bg-purple-600', ring: 'ring-purple-400', text: 'text-purple-100' },
      // 데이터 연계 - 인디고
      dataIntegration: { bg: 'bg-indigo-700', bgHover: 'hover:bg-indigo-800', bgActive: 'bg-indigo-600', ring: 'ring-indigo-400', text: 'text-indigo-100' },
      // 데이터 수집 - 청록
      dataCollection: { bg: 'bg-cyan-700', bgHover: 'hover:bg-cyan-800', bgActive: 'bg-cyan-600', ring: 'ring-cyan-400', text: 'text-cyan-100' },
      // 데이터 분석 - 녹색
      dataAnalysis: { bg: 'bg-emerald-700', bgHover: 'hover:bg-emerald-800', bgActive: 'bg-emerald-600', ring: 'ring-emerald-400', text: 'text-emerald-100' },
      // 데이터 예측 - 주황
      dataPrediction: { bg: 'bg-orange-700', bgHover: 'hover:bg-orange-800', bgActive: 'bg-orange-600', ring: 'ring-orange-400', text: 'text-orange-100' },
      // 예측 설정 - 회색
      predictionSettingsGroup: { bg: 'bg-stone-700', bgHover: 'hover:bg-stone-800', bgActive: 'bg-stone-600', ring: 'ring-stone-400', text: 'text-stone-100' },
      // 예측 결과 - 테루코이즈
      predictionResultsGroup: { bg: 'bg-teal-700', bgHover: 'hover:bg-teal-800', bgActive: 'bg-teal-600', ring: 'ring-teal-400', text: 'text-teal-100' },
      // 지식 그래프 - 핑크
      ontologyAnalysis: { bg: 'bg-pink-700', bgHover: 'hover:bg-pink-800', bgActive: 'bg-pink-600', ring: 'ring-pink-400', text: 'text-pink-100' },
      // 지식 관리 - 라임
      knowledgeManagement: { bg: 'bg-lime-700', bgHover: 'hover:bg-lime-800', bgActive: 'bg-lime-600', ring: 'ring-lime-400', text: 'text-lime-100' },
      // 데이터 인사이트 - 보라
      dataInsights: { bg: 'bg-violet-700', bgHover: 'hover:bg-violet-800', bgActive: 'bg-violet-600', ring: 'ring-violet-400', text: 'text-violet-100' },
      // 컴포넌트 쇼케이스 - 테루코이즈
      componentShowcaseGroup: { bg: 'bg-teal-700', bgHover: 'hover:bg-teal-800', bgActive: 'bg-teal-600', ring: 'ring-teal-400', text: 'text-teal-100' },
      // AI 에이전트 - 로즈
      aiAgents: { bg: 'bg-rose-700', bgHover: 'hover:bg-rose-800', bgActive: 'bg-rose-600', ring: 'ring-rose-400', text: 'text-rose-100' },
      // 이벤트 & 알림 - 앰버
      eventsAlerts: { bg: 'bg-amber-700', bgHover: 'hover:bg-amber-800', bgActive: 'bg-amber-600', ring: 'ring-amber-400', text: 'text-amber-100' },
      // AI 챗봇 - 스카이
      aiChatbot: { bg: 'bg-sky-700', bgHover: 'hover:bg-sky-800', bgActive: 'bg-sky-600', ring: 'ring-sky-400', text: 'text-sky-100' },
      // Phase 11: 차세대 AI - 그라데이션
      nextGenAI: { bg: 'bg-gradient-to-r from-purple-700 to-pink-700', bgHover: 'hover:from-purple-800 hover:to-pink-800', bgActive: 'bg-gradient-to-r from-purple-600 to-pink-600', ring: 'ring-purple-400', text: 'text-white' },
      // Phase 12: 데이터 파이프라인 - 청록
      dataPipeline: { bg: 'bg-gradient-to-r from-teal-600 to-cyan-600', bgHover: 'hover:from-teal-700 hover:to-cyan-700', bgActive: 'bg-gradient-to-r from-teal-500 to-cyan-500', ring: 'ring-teal-400', text: 'text-white' },
      // OCPM 통합 - 퍼플 그라데이션
      axosErpIntegration: { bg: 'bg-gradient-to-r from-violet-600 to-purple-600', bgHover: 'hover:from-violet-700 hover:to-purple-700', bgActive: 'bg-gradient-to-r from-violet-500 to-purple-500', ring: 'ring-violet-400', text: 'text-white' },
      // 기본 - 블루
      default: { bg: 'bg-blue-700', bgHover: 'hover:bg-blue-800', bgActive: 'bg-blue-600', ring: 'ring-blue-400', text: 'text-blue-100' }
    };
    return colors[itemId] || colors.default;
  };

  // 하위 메뉴가 활성화되어 있는지 확인하는 함수
  const isChildActive = (menuItem: any): boolean => {
    if (activeMenu === menuItem.id) return true;
    if (menuItem.children) {
      return menuItem.children.some((child: any) => isChildActive(child));
    }
    return false;
  };

  const hasActiveChild = hasChildren && isChildActive(item);
  const isDirectlyActive = activeMenu === item.id;
  const isActive = isDirectlyActive || hasActiveChild;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      setActiveMenu(item.id);
    }
  };

  const paddingLeft = level === 0 ? 'px-4' : level === 1 ? 'px-4' : 'px-4';
  const marginTop = level === 0 ? '' : 'mt-1';
  const colors = getMenuColor(item.id);
  const backgroundLevel = level === 0 ? colors.bg : 'bg-blue-600';
  const backgroundHover = level === 0 ? colors.bgHover : 'hover:bg-blue-700';
  const backgroundActive = level === 0 ? colors.bgActive : 'bg-blue-500';
  const fontSize = level === 0 ? 'text-sm' : 'text-xs';
  const iconSize = level === 0 ? 18 : 16;
  const indentMargin = level > 1 ? 'ml-6' : '';

  // 활성화된 하위 메뉴가 있으면 자동으로 펼침
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [activeMenu, hasActiveChild, isOpen]);

  return (
    <div className={indentMargin}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 ${paddingLeft} py-2 rounded-lg transition-colors ${fontSize} ${
          isActive
            ? `${backgroundActive} ring-2 ring-offset-1 ${colors.ring}`
            : backgroundHover
        }`}
      >
        <div className={`relative ${isActive ? 'animate-pulse' : ''}`}>
          <item.icon size={iconSize} className={isActive ? 'drop-shadow-lg' : ''} />
          {isActive && (
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ${colors.ring}`}></div>
          )}
        </div>
        <span className="flex-1 text-left font-medium">{item.label}</span>
        {hasChildren && (
          <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        )}
        {isActive && level === 0 && (
          <span className="ml-auto px-2 py-0.5 bg-white/20 rounded text-xs">●</span>
        )}
      </button>
      {hasChildren && isOpen && (
        <div className={`ml-4 mt-1 space-y-1`}>
          {item.children.map((child: any) => (
            <MenuItem
              key={child.id}
              item={child}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 메뉴 아이템 재귀적 검색 함수
const findMenuItem = (items: any[], id: string): any => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { type: 'bot', text: '안녕하세요! Claros MIS-AI 어시스턴트입니다.\n\n💡 **주요 기능:**\n• 🔍 원인-결과-대책: "치수불량 원인 분석", "설비 고장 대책" 등 6M 기반 분석\n• 📦 로트추적: "LOT-XXX 추적" 문제 로트의 자재/설비/작업자 추적\n• 📊 Text-to-SQL: "매출 현황 조회" 등 자연어로 SQL 생성\n• 🧠 온톨로지: 6M, 4M2E 개념 및 관계 설명\n\n위의 빠른 질문 버튼을 눌러보세요!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 화면 폭이 데스크톱(lg, 1024px) 경계를 넘나들 때만 사이드바를 자동으로 여닫음
  // (같은 구간 안에서 수동으로 토글한 상태는 유지)
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(e.matches);
    };
    desktopQuery.addEventListener('change', handleChange);
    return () => desktopQuery.removeEventListener('change', handleChange);
  }, []);

  const menuItems = [
    // 업그레이드 현황 (최상위)
    { id: 'upgradeStatus', icon: ActivityIcon, label: '업그레이드 현황' },
    // 통합 대시보드
    { id: 'integratedDashboard', icon: LayoutIcon, label: '통합 대시보드' },
    // 경영 대시보드 그룹
    {
      id: 'managementDashboard',
      icon: BarChartIcon,
      label: '경영 대시보드',
      children: [
        { id: 'executiveTower', icon: BarChartIcon, label: '경영진 컨트롤 타워' },
        { id: 'financialTower', icon: DollarIcon, label: '재무 컨트롤 타워' },
        { id: 'salesTower', icon: TrendUpIcon, label: '영업 컨트롤 타워' },
        { id: 'productionTower', icon: FactoryIcon, label: '생산 컨트롤 타워' },
        { id: 'purchasingTower', icon: ShoppingCartIcon, label: '구매 컨트롤 타워' },
        { id: 'qualityTower', icon: CheckIcon, label: '품질 컨트롤 타워' },
      ]
    },
    // 데이터 연계 그룹
    {
      id: 'dataIntegration',
      icon: NetworkIcon,
      label: '데이터 연계',
      children: [
        { id: 'erpMapping', icon: DatabaseIcon, label: 'ERP 맵핑 관리' },
        { id: 'erpSync', icon: TrendUpIcon, label: 'ERP 동기화 설정' },
        { id: 'yhDatabase', icon: DatabaseIcon, label: 'YH 데이터베이스' },
      ]
    },
    // 데이터 수집 그룹
    {
      id: 'dataCollection',
      icon: DatabaseIcon,
      label: '데이터 수집',
      children: [
        { id: 'masterData', icon: DatabaseIcon, label: '기준정보 관리' },
        { id: 'production', icon: FactoryIcon, label: '생산 관리' },
        { id: 'quality', icon: CheckIcon, label: '품질 관리' },
        { id: 'sales', icon: DollarIcon, label: '영업 관리' },
        { id: 'hrManagement', icon: UsersIcon, label: '인사 관리' },
        { id: 'payrollManagement', icon: DollarIcon, label: '급여 관리' },
        { id: 'financialManagement', icon: ActivityIcon, label: '재무 관리' },
        { id: 'logisticsManagement', icon: TruckIcon, label: '물류 관리' },
        { id: 'facilityManagement', icon: FactoryIcon, label: '설비 관리' },
        { id: 'purchasingManagement', icon: ShoppingCartIcon, label: '구매 관리' },
        { id: 'materialManagement', icon: PackageIcon, label: '자재 관리' },
        { id: 'manufacturing', icon: SettingsIcon, label: '제조 관리' },
      ]
    },
    // 데이터 분석 그룹
    {
      id: 'dataAnalysis',
      icon: BarChartIcon,
      label: '데이터 분석',
      children: [
        { id: 'dashboard', icon: BarChartIcon, label: '통합 대시보드' },
        { id: 'localAnalysis', icon: BarChartIcon, label: '종합 데이터 분석' },
        { id: 'lotTrace', icon: PackageIcon, label: 'LOT 추적' },
        { id: 'reports', icon: FileIcon, label: '분석 리포트' },
        { id: 'productivity', icon: TrendUpIcon, label: '생산성 분석' },
        { id: 'kpiManagement', icon: ActivityIcon, label: 'KPI 관리' },
        { id: 'financialIndicators', icon: BarChartIcon, label: '재무 지표' },
        { id: 'salesCost', icon: DollarIcon, label: '견적 원가' },
        { id: 'development', icon: ZapIcon, label: '개발 관리' },
        { id: 'designCost', icon: ZapIcon, label: '설계 원가' },
        { id: 'outsourcingCost', icon: FactoryIcon, label: '외주 원가' },
        { id: 'qualityCost', icon: AlertIcon, label: '품질 원가' },
        { id: 'purchaseCost', icon: ShoppingCartIcon, label: '구매 원가' },
        { id: 'costManagement', icon: PackageIcon, label: '원가 관리' },
        { id: 'standardCost', icon: TargetIcon, label: '표준 원가' },
        { id: 'abcCost', icon: ActivityIcon, label: 'ABC 원가' },
        { id: 'managerialAccounting', icon: SettingsIcon, label: '관리 회계' },
      ]
    },
    // 데이터 예측 그룹
    {
      id: 'dataPrediction',
      icon: TrendUpIcon,
      label: '데이터 예측',
      children: [
        { id: 'predictionDashboard', icon: BarChartIcon, label: '예측 대시보드' },
        {
          id: 'domainPredictionGroup',
          icon: FactoryIcon,
          label: '도메인별 예측',
          children: [
            { id: 'qualityPrediction', icon: CheckIcon, label: '품질 예측' },
            { id: 'productionPrediction', icon: FactoryIcon, label: '생산 예측' },
            { id: 'inventoryPrediction', icon: PackageIcon, label: '재고 예측' },
            { id: 'financePrediction', icon: DollarIcon, label: '재무 예측' },
            { id: 'fourM2EPrediction', icon: TargetIcon, label: '4M2E 예측' },
            { id: 'fourM2EImpactPrediction', icon: ZapIcon, label: '4M2E 영향도 예측' },
            { id: 'scenarioPrediction', icon: SearchIcon, label: '시나리오 예측' },
            { id: 'esgPrediction', icon: AlertIcon, label: 'ESG 예측' },
            { id: 'costBreakdownPrediction', icon: BarChart3Icon, label: '코스 분해 예측' },
            { id: 'costDriverPrediction', icon: ActivityIcon, label: '코스 드라이버 예측' },
          ]
        },
        {
          id: 'predictionSettingsGroup',
          icon: SettingsIcon,
          label: '예측 설정',
          children: [
            { id: 'predictionManagement', icon: TrendUpIcon, label: '예측 모델 관리' },
            { id: 'reinforcementLearning', icon: BrainIcon, label: '강화학습 기반 예측' },
            { id: 'parameterTuning', icon: SettingsIcon, label: '파라미터 튜닝' },
            { id: 'accuracyAnalysis', icon: BarChartIcon, label: '예측 정확도 분석' },
          ]
        },
        {
          id: 'predictionResultsGroup',
          icon: FileIcon,
          label: '예측 결과',
          children: [
            { id: 'predictionVsActual', icon: ActivityIcon, label: '예측 vs 실적 비교' },
            { id: 'predictionReport', icon: FileIcon, label: '예측 리포트' },
            { id: 'predictionAlert', icon: BellIcon, label: '알림 설정' },
          ]
        },
      ]
    },
    // 지식 그래프 그룹
    {
      id: 'ontologyAnalysis',
      icon: NetworkIcon,
      label: '지식 그래프',
      children: [
        { id: 'graphExplorer', icon: NetworkIcon, label: '지식 그래프 탐색' },
        { id: 'pathAnalysis', icon: GitBranchIcon, label: '경로 분석' },
        { id: 'centralityAnalysis', icon: ActivityIcon, label: '중심성 분석' },
        { id: 'dataFlowTracking', icon: NetworkIcon, label: '데이터 흐름 추적' },
        { id: 'ontology', icon: NetworkIcon, label: '온톨러지 분석' },
      ]
    },
    // 지식 관리 그룹
    {
      id: 'knowledgeManagement',
      icon: FileIcon,
      label: '지식 관리',
      children: [
        { id: 'documentManagement', icon: FileIcon, label: '문서 관리' },
        { id: 'vectorSearch', icon: SearchIcon, label: '벡터 검색' },
        { id: 'chunkingStrategy', icon: SettingsIcon, label: '청킹 전략' },
        { id: 'searchStatistics', icon: BarChartIcon, label: '검색 통계' },
      ]
    },
    // 데이터 인사이트 그룹
    {
      id: 'dataInsights',
      icon: BrainIcon,
      label: '데이터 인사이트',
      children: [
        { id: 'fourM2EStrategy', icon: TargetIcon, label: '4M2E 전략' },
        { id: 'fourM2EImpact', icon: ZapIcon, label: '4M2E 영향도' },
        { id: 'scenarioAnalysis', icon: SearchIcon, label: '6M 시나리오 분석' },
        { id: 'extendedScenarioAnalysis', icon: TrendUpIcon, label: '확장 시나리오 분석' },
        { id: 'esg', icon: AlertIcon, label: 'ESG 전략' },
        { id: 'costBreakdown', icon: BarChart3Icon, label: '4M2E 코스 분석' },
        { id: 'costDriverAnalysis', icon: ActivityIcon, label: '코스 드라이버 분석' },
        { id: 'o2cView', icon: ShoppingCartIcon, label: 'Order to Cash (O2C)' },
        { id: 'p2pView', icon: ShoppingCartIcon, label: 'Procure to Pay (P2P)' },
        { id: 'processFlowChart', icon: ActivityIcon, label: '프로세스 플로우' },
        { id: 'processChainView', icon: PackageIcon, label: '프로세스 연관성 추적' },
      ]
    },
    // AI 에이전트
    {
      id: 'aiAgents',
      icon: BrainIcon,
      label: 'AI 에이전트',
      children: [
        { id: 'agentMonitoring', icon: ActivityIcon, label: '에이전트 모니터링' },
        { id: 'agentExecutionLogs', icon: BarChartIcon, label: '에이전트 실행 로그' },
        { id: 'agentPerformanceEvaluation', icon: TrendUpIcon, label: '에이전트 성능 평가' },
        { id: 'agentRecommendationManagement', icon: TargetIcon, label: '에이전트 추천 관리' },
        { id: 'agentLearningLogs', icon: BookIcon, label: '에이전트 학습 로그' },
      ]
    },
    // 이벤트 & 알림
    {
      id: 'eventsAlerts',
      icon: AlertIcon,
      label: '이벤트 & 알림',
      children: [
        { id: 'eventDashboard', icon: ActivityIcon, label: '이벤트 대시보드' },
        { id: 'eventList', icon: SearchIcon, label: '이벤트 목록' },
        { id: 'eventTimeline', icon: BarChartIcon, label: '이벤트 타임라인' },
        { id: 'eventCorrelationAnalysis', icon: ZapIcon, label: '이벤트 상관분석' },
        { id: 'alertManagement', icon: BellIcon, label: '알림 관리' },
        { id: 'issueTracker', icon: AlertTriangleIcon, label: '이슈 추적' },
      ]
    },
    // AI 챗봇 그룹
    {
      id: 'aiChatbot',
      icon: BotIcon,
      label: 'AI 챗봇',
      children: [
        { id: 'agentChatbotV2', icon: BotIcon, label: '에이전트 챗봇 V2' },
        { id: 'ontologyAIAssistant', icon: BrainIcon, label: '온톨로지 AI 어시스턴트 Powered by Gemini' },
        { id: 'aiAssistant', icon: BrainIcon, label: 'AI 어시스턴트 (RAG)' },
        { id: 'llmSettings', icon: BotIcon, label: 'LLM 설정 (관리자)' },
        { id: 'evidenceViewer', icon: FileIcon, label: '증거 뷰어' },
        { id: 'agentTrace', icon: ActivityIcon, label: '에이전트 추적' },
        { id: 'conversationContext', icon: UserIcon, label: '대화 컨텍스트' },
      ]
    },
    // Phase 4: 외부 시스템 연동 및 데이터 시각화
    {
      id: 'externalIntegration',
      icon: ExtensionIcon,
      label: '외부 시스템 연동',
      children: [
        { id: 'integrationSettings', icon: SettingsIcon, label: '연동 설정 관리' },
        { id: 'syncStatus', icon: SyncIcon, label: '동기화 현황' },
        { id: 'webhookManagement', icon: WebhookIcon, label: '웹훅 관리' },
        { id: 'dataExchange', icon: SwapHorizIcon, label: '데이터 내보내기/가져오기' },
      ]
    },
    // Phase 5: 시스템 모니터링 및 보안
    {
      id: 'systemMonitoring',
      icon: MonitorIcon,
      label: '시스템 모니터링',
      children: [
        { id: 'healthCheck', icon: FavoriteIcon, label: '시스템 헬스 체크' },
        { id: 'apiUsage', icon: ApiIcon, label: 'API 사용 현황' },
        { id: 'performanceMetrics', icon: SpeedIcon, label: '성능 메트릭' },
        { id: 'errorLogs', icon: ErrorIcon, label: '에러 로그' },
        { id: 'cacheStatistics', icon: StorageIcon, label: '캐시 통계' },
      ]
    },
    {
      id: 'securityAudit',
      icon: SecurityIcon,
      label: '보안 및 감사',
      children: [
        { id: 'auditLogs', icon: HistoryIcon, label: '감사 로그' },
        { id: 'securityEvents', icon: WarningIcon, label: '보안 이벤트' },
        { id: 'loginAttempts', icon: LoginIcon, label: '로그인 시도' },
        { id: 'suspiciousIPs', icon: BlockIcon, label: '의심 IP 관리' },
        { id: 'apiDocumentation', icon: DescriptionIcon, label: 'API 문서' },
      ]
    },
    // Phase 11: 차세대 AI (확장 - 모든 AI/ML 기능 통합)
    {
      id: 'nextGenAI',
      icon: ZapIcon,
      label: '차세대 AI',
      children: [
        // Core AI/ML Features
        {
          id: 'coreAI',
          icon: BrainIcon,
          label: '핵심 AI/ML',
          children: [
            { id: 'automl', icon: ZapIcon, label: 'AutoML' },
            { id: 'mlops', icon: LayersIcon, label: 'MLOps' },
            { id: 'xai', icon: EyeIcon, label: '설명가능AI (XAI)' },
            { id: 'llmIntegration', icon: BrainIcon, label: 'LLM 통합' },
            { id: 'multimodal', icon: FileIcon, label: '멀티모달 예측' },
            { id: 'federated', icon: SecurityIcon, label: '연합학습' },
            { id: 'kgForecast', icon: NetworkIcon, label: '지식그래프 예측' },
            { id: 'rlForecast', icon: BrainIcon, label: '강화학습 예측' },
            { id: 'integratedAI', icon: LayersIcon, label: '통합 AI 시스템' },
          ]
        },
        // Next-Gen AI (Phase 11)
        { id: 'diffusionModels', icon: TrendUpIcon, label: 'Diffusion Models' },
        { id: 'neuralArchitectureSearch', icon: BrainIcon, label: 'Neural Architecture Search' },
        { id: 'advancedCausal', icon: GitBranchIcon, label: 'Advanced Causal ML' },
        { id: 'multiAgentSystem', icon: UsersIcon, label: 'Multi-Agent System' },
        { id: 'edgeAI', icon: CpuIcon, label: 'Edge AI & TinyML' },
        { id: 'digitalTwin', icon: CopyIcon, label: 'Digital Twin' },
        { id: 'quantumML', icon: AtomIcon, label: 'Quantum ML' },
      ]
    },
    // 데이터 시각화
    {
      id: 'dataVisualization',
      icon: BarChartIcon,
      label: '데이터 시각화',
      children: [
        { id: 'dashboardManagement', icon: DashboardIcon, label: '대시보드 관리' },
        { id: 'widgetLibrary', icon: WidgetsIcon, label: '위젯 라이브러리' },
        { id: 'realtimeStreaming', icon: StreamIcon, label: '실시간 데이터 스트림' },
        { id: 'chartTemplates', icon: DescriptionIcon, label: '차트 템플릿' },
      ]
    },
    // Phase 12: 데이터 파이프라인
    {
      id: 'dataPipeline',
      icon: SettingsIcon,
      label: '데이터 파이프라인',
      children: [
        { id: 'pipelineBuilder', icon: PlayIcon, label: '파이프라인 빌더' },
        { id: 'dataProcessing', icon: BarChartIcon, label: '데이터 처리' },
      ]
    },
    // 컴포넌트 쇼케이스 그룹
    {
      id: 'componentShowcaseGroup',
      icon: LayoutIcon,
      label: '컴포넌트 쇼케이스',
      children: [
        { id: 'dashboardV2', icon: LayoutIcon, label: '커스터마이징 대시보드' },
        { id: 'advancedVisualization', icon: ZapIcon, label: '고급 시각화' },
        { id: 'aiInsights', icon: BrainIcon, label: 'AI 인사이트' },
        { id: 'dataExport', icon: FileIcon, label: '데이터 내보내기' },
        { id: 'collaboration', icon: UsersIcon, label: '협업 기능' },
        { id: 'performance', icon: ZapIcon, label: '성능 최적화' },
      ]
    },
    // OCPM 통합
    {
      id: 'axosErpIntegration',
      icon: NetworkIcon,
      label: 'OCPM',
      children: [
        { id: 'eventHub', icon: ActivityIcon, label: '이벤트 허브' },
        { id: 'aiRisk', icon: AlertTriangleIcon, label: 'AI 리스크 분석' },
        { id: 'forecasting', icon: TrendUpIcon, label: '포캐스팅' },
        { id: 'alertManagement', icon: BellIcon, label: '알림 관리' },
        { id: 'workflow', icon: PlayIcon, label: '워크플로우' },
        { id: 'processGraph', icon: NetworkIcon, label: '프로세스 그래프' },
        { id: 'productionPlan', icon: CalendarIcon, label: '생산계획 관리' },
        { id: 'bomCost', icon: LayersIcon, label: 'BOM/원가 관리' },
        { id: 'qualityInspection', icon: CheckCircleIcon, label: '품질검사/불량 관리' },
        { id: 'equipmentMaintenance', icon: WrenchIcon, label: '설비/정비 관리' },
        { id: 'inventoryMRP', icon: PackageIcon, label: '재고/MRP 관리' },
        { id: 'productionPerformance', icon: BarChart3Icon, label: '생산실적/성과 분석' },
      ]
    },
  ];

  // SQL 관련 질문인지 감지
  const isSQLQuery = (message: string): boolean => {
    const sqlKeywords = [
      'sql', 'select', '쿼리', '조회', '데이터', '테이블',
      '사원', '급여', '재고', '생산', '품질', '매출', '원가', '설비',
      '부서', '발주', '수주', '검사', '불량', '예산', '전표',
      '몇 명', '몇명', '합계', '총', '목록', '현황', '리스트',
      '월별', '일별', '연도별', '추이', '통계'
    ];
    const lowerMessage = message.toLowerCase();
    return sqlKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 테이블 스키마 질문인지 감지
  const isSchemaQuery = (message: string): boolean => {
    const schemaKeywords = ['스키마', '테이블 목록', '어떤 테이블', '테이블 알려', 'db 구조', '데이터베이스 구조'];
    const lowerMessage = message.toLowerCase();
    return schemaKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 온톨로지 개요 질문인지 감지
  const isOntologyOverviewQuery = (message: string): boolean => {
    const overviewKeywords = ['6m 뭐', '6m이 뭐', '4m2e 뭐', '온톨로지 뭐', '온톨로지가 뭐', '6m 알려', '4m 알려'];
    const lowerMessage = message.toLowerCase();
    return overviewKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // 사용자 메시지 추가
    const newUserMessage: ChatMessage = { type: 'user', text: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);

    setIsLoading(true);
    try {
      // 1. 스키마 조회 질문인 경우
      if (isSchemaQuery(userMessage)) {
        const schemaSummary = getSchemaSummary();
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: schemaSummary,
          provider: 'sql'
        }]);
        return;
      }

      // 2. 온톨로지 개요 질문인 경우
      if (isOntologyOverviewQuery(userMessage)) {
        let overview = '## 6M / 4M2E 온톨로지 개념\n\n';
        overview += '### 6M (제조 품질 관점)\n';
        for (const concept of ONTOLOGY_CONCEPTS) {
          overview += `**${concept.concept}**\n`;
          overview += `${concept.definition}\n`;
          overview += `관련: ${concept.relatedConcepts.join(', ')}\n\n`;
        }
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: overview,
          provider: 'analysis'
        }]);
        return;
      }

      // 3. 원인-결과-대책 분석 질문인 경우 (로트 추적 스타일)
      if (isCausalAnalysisQuery(userMessage)) {
        const analysisResult = await analyzeCausalRelation(userMessage);
        setChatMessages(prev => [...prev, {
          type: 'bot',
          text: '', // CausalAnalysisViewer가 표시
          provider: 'analysis',
          analysisResult
        }]);
        return;
      }

      // 4. SQL 쿼리 생성 질문인 경우
      if (isSQLQuery(userMessage)) {
        const sqlResult = await generateSQL(userMessage);

        if (sqlResult.sql) {
          // SQL 생성 성공 - SQLResultViewer 컴포넌트로 표시
          setChatMessages(prev => [...prev, {
            type: 'bot',
            text: '', // SQLResultViewer가 표시되므로 텍스트는 비움
            provider: 'sql',
            sqlResult
          }]);
        } else {
          // SQL 생성 실패 - 일반 LLM 응답으로 폴백
          const { response, provider } = await sendMessage(userMessage);
          setChatMessages(prev => [...prev, { type: 'bot', text: response, provider }]);
        }
        return;
      }

      // 5. 일반 온톨로지/LLM 질문
      const { response, provider } = await sendMessage(userMessage);
      setChatMessages(prev => [...prev, { type: 'bot', text: response, provider }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 빠른 질문 버튼 클릭
  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

const renderContent = () => {
  if (activeMenu === 'dashboard') {
    return <Dashboard />;
  }
  if (activeMenu === 'dashboardV2') {
    return <DashboardV2 />;
  }
  if (activeMenu === 'integratedDashboard') {
    return <IntegratedDashboard />;
  }
  if (activeMenu === 'advancedVisualization') {
    return <AdvancedVisualization />;
  }
  if (activeMenu === 'aiInsights') {
    return <AIInsights />;
  }
  if (activeMenu === 'dataExport') {
    return <DataExportDemo />;
  }
  if (activeMenu === 'collaboration') {
    return <CollaborationDemo />;
  }
  if (activeMenu === 'performance') {
    return <PerformanceOptimizationDemo />;
  }
  if (activeMenu === 'localAnalysis') {
    return <LocalAnalysis />;
  }
  if (activeMenu === 'yhDatabase') {
    return <YHDatabaseConnection />;
  }
  if (activeMenu === 'upgradeStatus') {
    return <UpgradeStatus />;
  }
  if (activeMenu === 'executiveTower') {
    return <ExecutiveTower />;
  }
  if (activeMenu === 'financialTower') {
    return <FinancialTower />;
  }
  if (activeMenu === 'salesTower') {
    return <SalesTower />;
  }
  if (activeMenu === 'productionTower') {
    return <ProductionTower />;
  }
  if (activeMenu === 'purchasingTower') {
    return <PurchasingTower />;
  }
  if (activeMenu === 'qualityTower') {
    return <QualityTower />;
  }
  if (activeMenu === 'agentMonitoring') {
    return <AgentMonitoring />;
  }
  if (activeMenu === 'agentExecutionLogs') {
    return <AgentExecutionLogs />;
  }
  if (activeMenu === 'agentPerformanceEvaluation') {
    return <AgentPerformanceEvaluation />;
  }
  if (activeMenu === 'agentRecommendationManagement') {
    return <AgentRecommendationManagement />;
  }
  if (activeMenu === 'agentLearningLogs') {
    return <AgentLearningLogs />;
  }
  if (activeMenu === 'eventDashboard') {
    return <EventDashboard />;
  }
  if (activeMenu === 'eventList') {
    return <EventList />;
  }
  if (activeMenu === 'eventTimeline') {
    return <EventTimeline />;
  }
  if (activeMenu === 'eventCorrelationAnalysis') {
    return <EventCorrelationAnalysis />;
  }
  if (activeMenu === 'alertManagement') {
    return <AlertManagement />;
  }
  if (activeMenu === 'issueTracker') {
    return <IssueTracker />;
  }
  if (activeMenu === 'graphExplorer') {
    return <GraphExplorer />;
  }
  if (activeMenu === 'pathAnalysis') {
    return <PathAnalysis />;
  }
  if (activeMenu === 'centralityAnalysis') {
    return <CentralityAnalysis />;
  }
  if (activeMenu === 'standards') {
    return <Standards />;
  }
  if (activeMenu === 'masterData') {
    return <MasterDataManagement />;
  }
  if (activeMenu === 'kpiManagement') {
    return <KPIManagementPage />;
  }
  if (activeMenu === 'financialManagement') {
    return <FinancialManagement />;
  }
  if (activeMenu === 'financialIndicators') {
    return <FinancialIndicators />;
  }
  if (activeMenu === 'productivity') {
    return <Productivity />;
  }
  if (activeMenu === 'sales') {
    return <Sales />;
  }
  if (activeMenu === 'salesCost') {
    return <SalesCost />;
  }
  if (activeMenu === 'development') {
    return <Development />;
  }
  if (activeMenu === 'designCost') {
    return <DesignCost />;
  }
  if (activeMenu === 'production') {
    return <Production />;
  }
  if (activeMenu === 'outsourcingCost') {
    return <OutsourcingCost />;
  }
  if (activeMenu === 'quality') {
    return <Quality />;
  }
  if (activeMenu === 'qualityCost') {
    return <QualityCost />;
  }
  if (activeMenu === 'hrManagement') {
    return <HRManagement />;
  }
  if (activeMenu === 'payrollManagement') {
    return <PayrollManagement />;
  }
  if (activeMenu === 'logisticsManagement') {
    return <LogisticsManagement />;
  }
  if (activeMenu === 'facilityManagement') {
    return <FacilityManagement />;
  }
  if (activeMenu === 'purchasingManagement') {
    return <PurchasingManagement />;
  }
  if (activeMenu === 'purchaseCost') {
    return <PurchaseCost />;
  }
  if (activeMenu === 'materialManagement') {
    return <MaterialManagement />;
  }
  if (activeMenu === 'manufacturing') {
    return <Manufacturing />;
  }
  if (activeMenu === 'costManagement') {
    return <CostManagement />;
  }
  if (activeMenu === 'standardCost') {
    return <StandardCost />;
  }
  if (activeMenu === 'abcCost') {
    return <ABCCost />;
  }
  if (activeMenu === 'managerialAccounting') {
    return <ManagerialAccounting />;
  }
  if (activeMenu === 'costBreakdown') {
    return <CostBreakdown />;
  }
  if (activeMenu === 'costDriverAnalysis') {
    return <CostDriverAnalysis />;
  }
  if (activeMenu === 'o2cView') {
    return <O2CView />;
  }
  if (activeMenu === 'p2pView') {
    return <P2PView />;
  }
  if (activeMenu === 'processFlowChart') {
    return <ProcessFlowChart />;
  }
  if (activeMenu === 'processChainView') {
    return <ProcessChainView />;
  }
  if (activeMenu === 'fourM2EStrategy') {
    return <FourM2EStrategy />;
  }
  if (activeMenu === 'esg') {
    return <ESG />;
  }
  if (activeMenu === 'ontology') {
    return <Ontology />;
  }
  if (activeMenu === 'scenarioAnalysis') {
    return <ScenarioAnalysis />;
  }
  if (activeMenu === 'extendedScenarioAnalysis') {
    return <ExtendedScenarioAnalysis />;
  }
  if (activeMenu === 'lotTrace') {
    return <LotTrace />;
  }
  if (activeMenu === 'predictionManagement') {
    return <ModelManagement />;
  }
  if (activeMenu === 'reinforcementLearning') {
    return <ReinforcementLearning />;
  }
  if (activeMenu === 'fourM2EPrediction') {
    return <FourM2EPrediction />;
  }
  if (activeMenu === 'fourM2EImpactPrediction') {
    return <FourM2EImpactPrediction />;
  }
  if (activeMenu === 'scenarioPrediction') {
    return <ScenarioPrediction />;
  }
  if (activeMenu === 'esgPrediction') {
    return <ESGPrediction />;
  }
  if (activeMenu === 'costBreakdownPrediction') {
    return <CostBreakdownPrediction />;
  }
  if (activeMenu === 'costDriverPrediction') {
    return <CostDriverPrediction />;
  }
  // Prediction components
  if (activeMenu === 'predictionDashboard') {
    return <PredictionManagement />;
  }
  if (activeMenu === 'qualityPrediction') {
    return <QualityPrediction />;
  }
  if (activeMenu === 'productionPrediction') {
    return <ProductionPrediction />;
  }
  if (activeMenu === 'inventoryPrediction') {
    return <InventoryPrediction />;
  }
  if (activeMenu === 'financePrediction') {
    return <FinancePrediction />;
  }
  if (activeMenu === 'parameterTuning') {
    return <ParameterTuning />;
  }
  if (activeMenu === 'accuracyAnalysis') {
    return <AccuracyAnalysis />;
  }
  if (activeMenu === 'predictionVsActual') {
    return <PredictionVsActual />;
  }
  if (activeMenu === 'predictionReport') {
    return <PredictionReport />;
  }
  if (activeMenu === 'predictionAlert') {
    return <AlertManagement />;
  }
  if (activeMenu === 'reports') {
    return <Reports />;
  }
  if (activeMenu === 'llmSettings') {
    return <LLMSettings />;
  }
  // 새로운 메뉴 컴포넌트
  if (activeMenu === 'aiAssistant') {
    return <AIAssistantChat onExecuteSQL={async (sql) => {
      // SQL 실행 핸들러 (백엔드 API 호출)
      try {
        const response = await fetch('http://localhost:8000/api/sql/execute/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        return await response.json();
      } catch (error) {
        console.error('SQL execution error:', error);
        throw error;
      }
    }} />;
  }
  if (activeMenu === 'erpMapping') {
    return <MappingManagement />;
  }
  if (activeMenu === 'erpSync') {
    return <ERPSyncConfiguration />;
  }
  if (activeMenu === 'componentShowcase') {
    return <ComponentShowcase />;
  }
  // Ontology components
  if (activeMenu === 'fourM2EImpact') {
    return <FourM2EImpact />;
  }
  if (activeMenu === 'dataFlowTracking') {
    return <DataFlowTracking />;
  }
  // Knowledge components
  if (activeMenu === 'documentManagement') {
    return <DocumentManagement />;
  }
  if (activeMenu === 'vectorSearch') {
    return <VectorSearch />;
  }
  if (activeMenu === 'chunkingStrategy') {
    return <ChunkingStrategy />;
  }
  if (activeMenu === 'searchStatistics') {
    return <SearchStatistics />;
  }
  // Chat components
  if (activeMenu === 'agentChatbotV2') {
    return <AgentChatbotV2 />;
  }
  if (activeMenu === 'ontologyAIAssistant') {
    return <OntologyAIAssistant />;
  }
  if (activeMenu === 'evidenceViewer') {
    return <EvidenceViewerPage />;
  }
  if (activeMenu === 'agentTrace') {
    return <AgentTrace />;
  }
  if (activeMenu === 'conversationContext') {
    return <ConversationContext />;
  }
  // Phase 4: Integration routes
  if (activeMenu === 'integrationSettings') {
    return <IntegrationSettings />;
  }
  if (activeMenu === 'syncStatus') {
    return <SyncStatus />;
  }
  if (activeMenu === 'webhookManagement') {
    return <WebhookManagement />;
  }
  if (activeMenu === 'dataExchange') {
    return <DataExchange />;
  }
  // Phase 4: Visualization routes
  if (activeMenu === 'dashboardManagement') {
    return <DashboardManagement />;
  }
  if (activeMenu === 'widgetLibrary') {
    return <WidgetLibrary />;
  }
  if (activeMenu === 'realtimeStreaming') {
    return <RealtimeStreaming />;
  }
  if (activeMenu === 'chartTemplates') {
    return <ChartTemplates />;
  }
  // Phase 5: Monitoring routes
  if (activeMenu === 'healthCheck') {
    return <HealthCheck />;
  }
  if (activeMenu === 'apiUsage') {
    return <ApiUsage />;
  }
  if (activeMenu === 'performanceMetrics') {
    return <PerformanceMetrics />;
  }
  if (activeMenu === 'errorLogs') {
    return <ErrorLogs />;
  }
  if (activeMenu === 'cacheStatistics') {
    return <CacheStatistics />;
  }
  // Phase 5: Security routes
  if (activeMenu === 'auditLogs') {
    return <AuditLogs />;
  }
  if (activeMenu === 'securityEvents') {
    return <SecurityEvents />;
  }
  if (activeMenu === 'loginAttempts') {
    return <LoginAttempts />;
  }
  if (activeMenu === 'suspiciousIPs') {
    return <SuspiciousIPs />;
  }
  if (activeMenu === 'apiDocumentation') {
    return <ApiDocumentation />;
  }
  // Phase 11: Next-Gen AI routes
  if (activeMenu === 'diffusionModels') {
    return <DiffusionModels />;
  }
  if (activeMenu === 'neuralArchitectureSearch') {
    return <NeuralArchitectureSearch />;
  }
  if (activeMenu === 'advancedCausal') {
    return <AdvancedCausal />;
  }
  if (activeMenu === 'multiAgentSystem') {
    return <MultiAgentSystem />;
  }
  if (activeMenu === 'edgeAI') {
    return <EdgeAI />;
  }
  if (activeMenu === 'digitalTwin') {
    return <DigitalTwin />;
  }
  if (activeMenu === 'quantumML') {
    return <QuantumML />;
  }
  // AI/ML Features routes
  if (activeMenu === 'automl') {
    return <AutoMLDashboard />;
  }
  if (activeMenu === 'mlops') {
    return <MLOpsDashboard />;
  }
  if (activeMenu === 'xai') {
    return <XAIexplainedAIDashboard />;
  }
  if (activeMenu === 'llmIntegration') {
    return <LLMIntegrationDashboard />;
  }
  if (activeMenu === 'multimodal') {
    return <MultimodalPredictionDashboard />;
  }
  if (activeMenu === 'federated') {
    return <FederatedLearningDashboard />;
  }
  if (activeMenu === 'kgForecast') {
    return <KnowledgeGraphDashboard />;
  }
  if (activeMenu === 'rlForecast') {
    return <ReinforcementLearningDashboard />;
  }
  if (activeMenu === 'integratedAI') {
    return <IntegratedAIDashboard />;
  }
  // Phase 12: 데이터 파이프라인
  if (activeMenu === 'pipelineBuilder') {
    const DataPipelineBuilder = lazy(() => import('@/components/datapipeline/DataPipelineBuilder'));
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <DataPipelineBuilder />
      </Suspense>
    );
  }
  if (activeMenu === 'dataProcessing') {
    const DataProcessing = lazy(() => import('@/components/datapipeline/DataProcessing'));
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <DataProcessing />
      </Suspense>
    );
  }
  // OCPM Integration routes
  if (activeMenu === 'eventHub') {
    return <EventHubManagement />;
  }
  if (activeMenu === 'aiRisk') {
    return <AIRiskAnalysis />;
  }
  if (activeMenu === 'forecasting') {
    return <ForecastingManagement />;
  }
  if (activeMenu === 'alertManagement') {
    return <AlertManagementComponent />;
  }
  if (activeMenu === 'workflow') {
    return <WorkflowManagement />;
  }
  if (activeMenu === 'processGraph') {
    return <ProcessGraph />;
  }
  // OCPM Enhancement Routes
  if (activeMenu === 'productionPlan') {
    return <ProductionPlanManagement />;
  }
  if (activeMenu === 'bomCost') {
    return <BOMCostManagement />;
  }
  if (activeMenu === 'qualityInspection') {
    return <QualityInspectionManagement />;
  }
  if (activeMenu === 'equipmentMaintenance') {
    return <EquipmentMaintenanceManagement />;
  }
  if (activeMenu === 'inventoryMRP') {
    return <InventoryMRPManagement />;
  }
  if (activeMenu === 'productionPerformance') {
    return <ProductionPerformanceAnalysis />;
  }
  return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {findMenuItem(menuItems, activeMenu)?.label}
        </h2>
        <p className="text-gray-600">이 기능은 곧 추가될 예정입니다.</p>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WidgetProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
              {/* Sidebar */}
              <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-blue-900 text-white transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col`}>
                <div className="p-4 flex-shrink-0 flex items-center justify-between">
                  <h1 className="text-xl font-bold">AI & BI 지능형 시스템</h1>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-blue-800 transition-colors"
                    title="닫기"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <nav className="space-y-1">
                    {menuItems.map(item => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        level={0}
                      />
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <MenuIcon size={24} />
                    </button>
                    <button
                      onClick={() => setActiveMenu('ontologyAIAssistant')}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white transition-all shadow-md"
                      title="온톨로지 AI 어시스턴트"
                    >
                      <BrainIcon size={20} />
                      <span className="hidden sm:inline text-sm font-medium">온톨로지 AI 어시스턴트</span>
                    </button>
                    {/* AI 어시스턴트 (RAG) 아톰 버튼 */}
                    <button
                      onClick={() => setActiveMenu('aiAssistant')}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all shadow-md"
                      title="AI 어시스턴트(RAG)"
                    >
                      <BotIcon size={20} />
                      <span className="hidden sm:inline text-sm font-medium">AI 어시스턴트(RAG)</span>
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {findMenuItem(menuItems, activeMenu)?.label}
                  </h2>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <div className="w-2"></div>
                  </div>
                </header>

                <div className="p-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
                    {renderContent()}
                  </div>
                </div>
              </main>

              {/* AI Chat Panel */}
              {chatOpen && (
                <div className="fixed bottom-24 right-6 w-[420px] bg-white rounded-xl shadow-2xl z-50 flex flex-col" style={{ height: '520px' }}>
                  {/* 헤더 */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <BotIcon size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">온톨로지 AI 어시스턴트</h3>
                        <span className="text-xs text-blue-100">
                          {(() => {
                            const activeLLM = getActiveLLM();
                            if (!activeLLM) return 'LLM 미설정';
                            const names: Record<LLMProvider, string> = {
                              ollama: 'Ollama (오픈소스)',
                              chatgpt: 'ChatGPT',
                              gemini: 'Gemini'
                            };
                            return `Powered by ${names[activeLLM.provider]}`;
                          })()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
                      <XIcon size={20} />
                    </button>
                  </div>

                  {/* 빠른 질문 버튼 */}
                  <div className="px-3 py-2 border-b bg-gray-50 flex gap-2 overflow-x-auto">
                    <button
                      onClick={() => handleQuickQuestion('치수불량 원인 분석해줘')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 whitespace-nowrap"
                    >
                      🔍 불량원인분석
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('LOT-2024-1226-001 로트 추적해줘')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 whitespace-nowrap"
                    >
                      📦 로트추적
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('설비 고장 대책 알려줘')}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 whitespace-nowrap"
                    >
                      🔧 설비대책
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('6M이 뭐야?')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 whitespace-nowrap"
                    >
                      🧠 6M이란?
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('매출 현황 조회')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 whitespace-nowrap"
                    >
                      💰 매출조회
                    </button>
                  </div>

                  {/* 메시지 영역 */}
                  <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'bot' && (
                          <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <BotIcon size={14} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[90%] p-3 rounded-lg text-sm ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : msg.analysisResult || msg.sqlResult
                              ? 'bg-transparent p-0'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}>
                          {msg.analysisResult ? (
                            <CausalAnalysisViewer result={msg.analysisResult} />
                          ) : msg.sqlResult ? (
                            <SQLResultViewer result={msg.sqlResult} />
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          )}
                        </div>
                        {msg.type === 'user' && (
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                            <UserIcon size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                          <BotIcon size={14} className="text-white" />
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 입력 영역 */}
                  <div className="p-3 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder="온톨로지에 대해 질문하세요..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <SendIcon size={20} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                      원인분석, 로트추적, SQL생성, 6M/4M2E 질문에 답변합니다
                    </p>
                  </div>
                </div>
              )}
            </div>
            <ToastContainer />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </WidgetProvider>
  </ThemeProvider>
</ErrorBoundary>
  );
};

// 컴포넌트 쇼케이스
const ComponentShowcase: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4">컴포넌트 라이브러리</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'KPI Card', desc: 'KPI 지표 표시 카드' },
            { name: 'Chart', desc: '차트 컴포넌트' },
            { name: 'DataTable', desc: '데이터 테이블' },
            { name: 'StatusBadge', desc: '상태 배지' },
            { name: 'ProgressRing', desc: '진행률 링' },
            { name: 'Timeline', desc: '타임라인' },
          ].map((comp, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h4 className="font-semibold text-gray-800">{comp.name}</h4>
              <p className="text-sm text-gray-600">{comp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 인사 관리
const HRManagement: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDept, setSelectedDept] = React.useState<string>('all');

  const [hrData, setHrData] = React.useState<any>({
    total_employees: 0,
    active_employees: 0,
    on_leave: 0,
    new_hires_this_month: 0,
    turnover_rate: 0,
    avg_tenure: 0,
    by_department: [],
    by_position: [],
    recent_hires: [],
    upcoming_retirements: []
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // ERP HR 대시보드 API 호출
        const dashboardDataService = (await import('@/services/dashboardDataService')).default;
        const response = await dashboardDataService.dashboard.getHRDashboard({
          asof_date: new Date().toISOString().split('T')[0]
        });

        if (response.results?.[0]) {
          setHrData(response.results[0]);
        }
      } catch (err) {
        // Mock 데이터로 폴백
        setHrData({
          total_employees: 1234,
          active_employees: 1180,
          on_leave: 54,
          new_hires_this_month: 12,
          turnover_rate: 3.2,
          avg_tenure: 5.8,
          by_department: [
            { department: '영업팀', count: 156, new_hires: 3, turnover: 4.1 },
            { department: '생산팀', count: 423, new_hires: 5, turnover: 2.8 },
            { department: '품질팀', count: 89, new_hires: 1, turnover: 3.5 },
            { department: '개발팀', count: 134, new_hires: 2, turnover: 2.1 },
            { department: '관리팀', count: 67, new_hires: 0, turnover: 1.8 },
            { department: '지원팀', count: 311, new_hires: 1, turnover: 4.2 },
          ],
          by_position: [
            { position: '사원', count: 567 },
            { position: '대리', count: 312 },
            { position: '과장', count: 189 },
            { position: '차장', count: 98 },
            { position: '부장', count: 54 },
            { position: '임원', count: 14 },
          ],
          recent_hires: [
            { name: '김철수', department: '생산팀', position: '사원', hire_date: '2024-02-15' },
            { name: '이영희', department: '영업팀', position: '대리', hire_date: '2024-02-10' },
            { name: '박민수', department: '개발팀', position: '사원', hire_date: '2024-02-08' },
          ],
          upcoming_retirements: [
            { name: '정진호', department: '생산팀', position: '부장', retirement_date: '2024-06-30', days_remaining: 127 },
            { name: '한상순', department: '품질팀', position: '차장', retirement_date: '2024-05-15', days_remaining: 82 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">인사 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const deptData = selectedDept === 'all'
    ? (hrData.by_department || [])
    : (hrData.by_department || []).filter((d: any) => d.department === selectedDept);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <UsersIcon size={32} />
          <h1 className="text-3xl font-bold">인사 관리</h1>
        </div>
        <p className="text-indigo-100">인력 현황을 종합적으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">전체 사원수</span>
            <UsersIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{(hrData.total_employees || 0).toLocaleString()}명</p>
          <p className="text-sm text-gray-500 mt-2">재직: {(hrData.active_employees || 0).toLocaleString()}명</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">신규 입사</span>
            <TrendUpIcon className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{hrData.new_hires_this_month}명</p>
          <p className="text-sm text-gray-500 mt-2">이번 달</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">이직률</span>
            <ActivityIcon className="text-orange-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{hrData.turnover_rate}%</p>
          <p className="text-sm text-gray-500 mt-2">연간 기준</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">평균 근속</span>
            <UserIcon className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{hrData.avg_tenure}년</p>
          <p className="text-sm text-gray-500 mt-2">전체 평균</p>
        </div>
      </div>

      {/* 부서별 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <UsersIcon size={20} />
            부서별 인력 현황
          </h3>
          <p className="text-indigo-100 text-xs mt-1">부서별 인원 구성 및 이직률</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">부서</th>
                <th className="py-3 px-4 text-center">인원수</th>
                <th className="py-3 px-4 text-center">신규 입사</th>
                <th className="py-3 px-4 text-center">이직률</th>
                <th className="py-3 px-4 text-center">비중</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(hrData.by_department || []).map((dept: any, idx: number) => {
                const ratio = hrData.total_employees > 0 ? ((dept.count || 0) / hrData.total_employees * 100).toFixed(1) : '0';
                return (
                  <tr key={idx} className="hover:bg-indigo-50">
                    <td className="py-3 px-4 font-medium">{dept.department}</td>
                    <td className="py-3 px-4 text-center">{(dept.count || 0).toLocaleString()}명</td>
                    <td className="py-3 px-4 text-center text-green-600">+{dept.new_hires || 0}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        dept.turnover < 3 ? 'bg-green-100 text-green-700' :
                        dept.turnover < 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {dept.turnover}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{ratio}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 직급별 분포 & 신규 입사자 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserIcon className="text-purple-600" size={24} />
            직급별 분포
          </h3>
          <div className="space-y-3">
            {(hrData.by_position || []).map((pos: any, idx: number) => {
              const ratio = hrData.total_employees > 0 ? ((pos.count / hrData.total_employees) * 100).toFixed(1) : '0';
              const ratioValue = parseFloat(ratio);
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-gray-700">{pos.position}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(ratioValue, 15)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{pos.count}명</span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">{ratio}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendUpIcon className="text-green-600" size={24} />
            최신 입사자
          </h3>
          <div className="space-y-3">
            {(hrData.recent_hires || []).map((hire: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700">
                  {hire.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{hire.name}</p>
                  <p className="text-sm text-gray-600">{hire.department} / {hire.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-700">{hire.hire_date}</p>
                  <p className="text-xs text-gray-500">입사일</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 인사 인사이트 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">인사 인사이트</h3>
        <div className="space-y-3">
          {hrData.turnover_rate > 5 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">이직률 관리 필요</p>
                  <p className="text-sm text-gray-600">
                    전체 이직률이 {hrData.turnover_rate}%로 높은 편입니다.
                    근무 환경 개선 및 직원 만족도 조사가 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(hrData.upcoming_retirements || []).length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">예정된 정년퇴직</p>
                  <p className="text-sm text-gray-600">
                    {(hrData.upcoming_retirements || []).length}명의 정년퇴직이 예정되어 있습니다.
                    후임자 선발 및 업무 인수인계 계획을 수립하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          {hrData.new_hires_this_month > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">신규 입사자 온보딩</p>
                  <p className="text-sm text-gray-600">
                    이번 달 {hrData.new_hires_this_month || 0}명의 신규 입사자가 있습니다.
                    조기 적응을 위한 멘토링 프로그램 운영을 권장합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 급여 관리
const PayrollManagement: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>('all');

  const [payrollData, setPayrollData] = React.useState<any>({
    total_payroll: 0,
    avg_salary: 0,
    employee_count: 0,
    payment_count: 0,
    base_salary_total: 0,
    overtime_pay_total: 0,
    bonus_total: 0,
    deductions_total: 0,
    insurance_total: 0,
    tax_total: 0,
    by_department: [],
    payslip_details: [],
    deduction_breakdown: [],
    insurance_summary: [],
    bonus_history: [],
    severance_pay_summary: [],
    monthly_trend: []
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // HR 급여 API 호출 (전용 API가 없을 경우를 대비해 fallback)
        const dashboardDataService = (await import('@/services/dashboardDataService')).default;
        let response;
        try {
          response = await dashboardDataService.dashboard.getHRDashboard({
            asof_date: new Date().toISOString().split('T')[0]
          });
        } catch (e) {
          console.log('Payroll API not available, using mock data');
        }

        // Mock 데이터로 폴백
        setPayrollData({
          total_payroll: 1234567890,
          avg_salary: 4250000,
          employee_count: 1234,
          payment_count: 1234,
          base_salary_total: 980000000,
          overtime_pay_total: 89000000,
          bonus_total: 123000000,
          deductions_total: 156789000,
          insurance_total: 89000000,
          tax_total: 67890000,
          by_department: [
            { department: '영업팀', total_payroll: 185000000, avg_salary: 4500000, headcount: 41, overtime_ratio: 12.5 },
            { department: '생산팀', total_payroll: 389000000, avg_salary: 3800000, headcount: 102, overtime_ratio: 18.2 },
            { department: '품질팀', total_payroll: 89000000, avg_salary: 4200000, headcount: 21, overtime_ratio: 8.5 },
            { department: '개발팀', total_payroll: 168000000, avg_salary: 5200000, headcount: 32, overtime_ratio: 15.3 },
            { department: '관리팀', total_payroll: 92000000, avg_salary: 4800000, headcount: 19, overtime_ratio: 6.2 },
            { department: '지원팀', total_payroll: 312000000, avg_salary: 3600000, headcount: 87, overtime_ratio: 9.8 },
          ],
          payslip_details: [
            { emp_no: 'E001', name: '김철수', department: '생산팀', position: '사원', base_salary: 3500000, overtime_pay: 450000, bonus: 0, deductions: 620000, net_pay: 3330000, pay_date: '2024-02-25' },
            { emp_no: 'E002', name: '이영희', department: '영업팀', position: '대리', base_salary: 4200000, overtime_pay: 380000, bonus: 500000, deductions: 890000, net_pay: 4190000, pay_date: '2024-02-25' },
            { emp_no: 'E003', name: '박민수', department: '개발팀', position: '과장', base_salary: 5500000, overtime_pay: 520000, bonus: 1000000, deductions: 1250000, net_pay: 5770000, pay_date: '2024-02-25' },
            { emp_no: 'E004', name: '정진호', department: '생산팀', position: '부장', base_salary: 6800000, overtime_pay: 280000, bonus: 1500000, deductions: 1580000, net_pay: 7000000, pay_date: '2024-02-25' },
            { emp_no: 'E005', name: '한상순', department: '품질팀', position: '차장', base_salary: 5800000, overtime_pay: 350000, bonus: 800000, deductions: 1280000, net_pay: 5670000, pay_date: '2024-02-25' },
          ],
          deduction_breakdown: [
            { type: '국민연금', amount: 89000000, ratio: 7.2, description: '월 소득의 4.5% (사용자 부담 포함)' },
            { type: '건강보험', amount: 45000000, ratio: 3.6, description: '월 소득의 3.49% (사용자 부담 포함)' },
            { type: '고용보험', amount: 12000000, ratio: 1.0, description: '월 소득의 0.9% (사용자 부담 포함)' },
            { type: '소득세', amount: 45000000, ratio: 3.6, description: '누진세율 적용' },
            { type: '지방소득세', amount: 4500000, ratio: 0.4, description: '소득세의 10%' },
          ],
          insurance_summary: [
            { insurance: '국민연금', employee_ratio: 4.5, employer_ratio: 4.5, total_amount: 178000000, status: '정상' },
            { insurance: '건강보험', employee_ratio: 3.49, employer_ratio: 3.49, total_amount: 90000000, status: '정상' },
            { insurance: '고용보험', employee_ratio: 0.9, employer_ratio: 0.9, total_amount: 24000000, status: '정상' },
            { insurance: '산재보험', employee_ratio: 0, employer_ratio: 0.7, total_amount: 18000000, status: '정상' },
          ],
          bonus_history: [
            { month: '2024-01', type: '정기상여', amount: 89000000, recipients: 1234 },
            { month: '2024-02', type: '성과급', amount: 123000000, recipients: 1180 },
            { month: '2023-12', type: '연말상여', amount: 450000000, recipients: 1200 },
            { month: '2023-09', type: '추계상여', amount: 156000000, recipients: 1150 },
          ],
          severance_pay_summary: [
            { emp_no: 'E123', name: '퇴사자1', department: '생산팀', years_of_service: 5, severance_pay: 25000000, status: '지급 완료', payment_date: '2024-02-15' },
            { emp_no: 'E124', name: '퇴사자2', department: '영업팀', years_of_service: 3, severance_pay: 15000000, status: '지급 대기', expected_date: '2024-03-10' },
          ],
          monthly_trend: [
            { month: '2023-09', total_payroll: 1150000000, base_salary: 950000000, overtime_bonus: 200000000 },
            { month: '2023-10', total_payroll: 1180000000, base_salary: 970000000, overtime_bonus: 210000000 },
            { month: '2023-11', total_payroll: 1200000000, base_salary: 980000000, overtime_bonus: 220000000 },
            { month: '2023-12', total_payroll: 1650000000, base_salary: 990000000, overtime_bonus: 660000000 },
            { month: '2024-01', total_payroll: 1210000000, base_salary: 1000000000, overtime_bonus: 210000000 },
            { month: '2024-02', total_payroll: 1234567890, base_salary: 980000000, overtime_bonus: 254567890 },
          ],
        });
      } catch (err) {
        setError('급여 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">급여 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const filteredDeptData = selectedDepartment === 'all'
    ? (payrollData.by_department || [])
    : (payrollData.by_department || []).filter((d: any) => d.department === selectedDepartment);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <DollarIcon size={32} />
          <h1 className="text-3xl font-bold">급여 관리</h1>
        </div>
        <p className="text-green-100">급여 지급 현황 및 공제 내역 관리</p>

        {/* 필터 */}
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="2024-02" className="text-gray-800">2024년 2월</option>
            <option value="2024-01" className="text-gray-800">2024년 1월</option>
            <option value="2023-12" className="text-gray-800">2023년 12월</option>
            <option value="2023-11" className="text-gray-800">2023년 11월</option>
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="all" className="text-gray-800">전체 부서</option>
            <option value="영업팀" className="text-gray-800">영업팀</option>
            <option value="생산팀" className="text-gray-800">생산팀</option>
            <option value="품질팀" className="text-gray-800">품질팀</option>
            <option value="개발팀" className="text-gray-800">개발팀</option>
            <option value="관리팀" className="text-gray-800">관리팀</option>
            <option value="지원팀" className="text-gray-800">지원팀</option>
          </select>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 급여액</p>
              <p className="text-2xl font-bold text-gray-800">{(payrollData.total_payroll || 0).toLocaleString()}원</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarIcon className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">평균 급여</p>
              <p className="text-2xl font-bold text-gray-800">{(payrollData.avg_salary || 0).toLocaleString()}원</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendUpIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">지급 인원</p>
              <p className="text-2xl font-bold text-gray-800">{(payrollData.payment_count || 0).toLocaleString()}명</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <UsersIcon className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 공제액</p>
              <p className="text-2xl font-bold text-gray-800">{(payrollData.deductions_total || 0).toLocaleString()}원</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertIcon className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 급여 구성 & 월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ActivityIcon className="text-blue-600" size={24} />
            급여 구성
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">기본급</span>
                <span className="font-medium">{(payrollData.base_salary_total || 0).toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${payrollData.total_payroll > 0 ? ((payrollData.base_salary_total || 0) / payrollData.total_payroll * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">수당/상여</span>
                <span className="font-medium">{((payrollData.overtime_pay_total || 0) + (payrollData.bonus_total || 0)).toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${payrollData.total_payroll > 0 ? (((payrollData.overtime_pay_total || 0) + (payrollData.bonus_total || 0)) / payrollData.total_payroll * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">4대 보험</span>
                <span className="font-medium">{(payrollData.insurance_total || 0).toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{ width: `${payrollData.total_payroll > 0 ? ((payrollData.insurance_total || 0) / payrollData.total_payroll * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">소득세</span>
                <span className="font-medium">{(payrollData.tax_total || 0).toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${payrollData.total_payroll > 0 ? ((payrollData.tax_total || 0) / payrollData.total_payroll * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendUpIcon className="text-purple-600" size={24} />
            월별 급여 추이
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">월</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">기본급</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">수당/상여</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">합계</th>
                </tr>
              </thead>
              <tbody>
                {(payrollData.monthly_trend || []).slice(-6).map((trend: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 text-sm">{trend.month}</td>
                    <td className="py-2 text-right text-sm">{(trend.base_salary || 0).toLocaleString()}원</td>
                    <td className="py-2 text-right text-sm text-green-600">{(trend.overtime_bonus || 0).toLocaleString()}원</td>
                    <td className="py-2 text-right text-sm font-medium">{(trend.total_payroll || 0).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 부서별 급여 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChartIcon className="text-indigo-600" size={24} />
          부서별 급여 현황
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">부서</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">총 급여액</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">평균 급여</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">인원</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">초과근무 비율</th>
              </tr>
            </thead>
            <tbody>
              {(filteredDeptData || []).map((dept: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{dept.department}</td>
                  <td className="py-3 px-4 text-right">{(dept.total_payroll || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right">{(dept.avg_salary || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right">{dept.headcount || 0}명</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${dept.overtime_ratio > 15 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {dept.overtime_ratio || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 급여 명세서 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileIcon className="text-blue-600" size={24} />
          급여 명세서 상세
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">사번</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">성명</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">부서</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">직급</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">기본급</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">수당</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">상여</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">공제</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">실수령액</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">지급일</th>
              </tr>
            </thead>
            <tbody>
              {(payrollData.payslip_details || []).map((payslip: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{payslip.emp_no}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{payslip.name}</td>
                  <td className="py-3 px-4 text-sm">{payslip.department}</td>
                  <td className="py-3 px-4 text-sm">{payslip.position}</td>
                  <td className="py-3 px-4 text-right text-sm">{(payslip.base_salary || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right text-sm text-green-600">{(payslip.overtime_pay || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right text-sm text-blue-600">{(payslip.bonus || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right text-sm text-red-600">{(payslip.deductions || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-800">{(payslip.net_pay || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-center text-sm">{payslip.pay_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 급여 공제 내역 & 4대 보험 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertIcon className="text-red-600" size={24} />
            급여 공제 내역
          </h3>
          <div className="space-y-3">
            {(payrollData.deduction_breakdown || []).map((deduction: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">{deduction.type}</span>
                  <span className="text-lg font-bold text-gray-800">{(deduction.amount || 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">비율: {deduction.ratio || 0}%</span>
                  <span className="text-gray-500">{deduction.description}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${deduction.ratio * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckIcon className="text-green-600" size={24} />
            4대 보험 현황
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">보험</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">직원부담</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">사용자부담</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">총액</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody>
                {(payrollData.insurance_summary || []).map((insurance: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 text-sm font-medium">{insurance.insurance}</td>
                    <td className="py-2 text-center text-sm">{insurance.employee_ratio || 0}%</td>
                    <td className="py-2 text-center text-sm">{insurance.employer_ratio || 0}%</td>
                    <td className="py-2 text-right text-sm">{(insurance.total_amount || 0).toLocaleString()}원</td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{insurance.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상여금 지급 내역 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ZapIcon className="text-yellow-600" size={24} />
          상여금 지급 내역
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">지급월</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">상여 유형</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">지급액</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">수령 인원</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">평균 지급액</th>
              </tr>
            </thead>
            <tbody>
              {(payrollData.bonus_history || []).map((bonus: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{bonus.month}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bonus.type === '연말상여' ? 'bg-purple-100 text-purple-700' :
                      bonus.type === '정기상여' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {bonus.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{(bonus.amount || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-right">{bonus.recipients || 0}명</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">
                    {bonus.recipients > 0 ? ((bonus.amount || 0) / bonus.recipients).toLocaleString() : 0}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 퇴직금 지급 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserIcon className="text-indigo-600" size={24} />
          퇴직금 지급 현황
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">사번</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">성명</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">부서</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">근속연수</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">퇴직금</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">상태</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">지급일/예정일</th>
              </tr>
            </thead>
            <tbody>
              {(payrollData.severance_pay_summary || []).map((severance: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{severance.emp_no}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{severance.name}</td>
                  <td className="py-3 px-4 text-sm">{severance.department}</td>
                  <td className="py-3 px-4 text-right">{severance.years_of_service || 0}년</td>
                  <td className="py-3 px-4 text-right font-medium">{(severance.severance_pay || 0).toLocaleString()}원</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      severance.status === '지급 완료' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {severance.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-sm">{severance.payment_date || severance.expected_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 급여 관리 인사이트 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">급여 관리 인사이트</h3>
        <div className="space-y-3">
          {(payrollData.by_department || []).some((d: any) => d.overtime_ratio > 15) && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">초과근무 관리 필요</p>
                  <p className="text-sm text-gray-600">
                    {(payrollData.by_department || []).filter((d: any) => d.overtime_ratio > 15).length}개 부서에서
                    초과근무 비율이 15%를 초과하고 있습니다. 인력 운영 최적화를 검토하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          {((payrollData.deductions_total || 0) / (payrollData.total_payroll || 1) > 0.15) && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">공제액 비중 분석</p>
                  <p className="text-sm text-gray-600">
                    전체 급여액 대비 공제액 비중이 {((payrollData.deductions_total || 0) / (payrollData.total_payroll || 1) * 100).toFixed(1)}%입니다.
                    4대 보험 및 세제 혜택을 통해 사원 실수령액을 최적화할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(payrollData.bonus_history || []).filter((b: any) => b.type === '성과급').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">성과급 지급 현황</p>
                  <p className="text-sm text-gray-600">
                    최근 {(payrollData.bonus_history || []).filter((b: any) => b.type === '성과급').length}회의 성과급이 지급되었습니다.
                    성과 연동 제도의 효과를 정기적으로 분석하여 운영하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 물류 관리
const LogisticsManagement: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string>('all');

  const [logisticsData, setLogisticsData] = React.useState<any>({
    today_shipments: 0,
    today_receipts: 0,
    pending_orders: 0,
    delayed_shipments: 0,
    inventory_value: 0,
    warehouse_capacity: 0,
    warehouse_utilization: 0,
    by_warehouse: [],
    shipments_today: [],
    inbound_scheduled: [],
    carrier_performance: []
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 제조/생산 API와 연동 (400 에러 방지를 위해 try-catch 추가)
        const api = (await import('@/services/api')).default;
        let workOrders = { results: [] };
        try {
          workOrders = await api.production.getWorkOrders('status=in_progress&limit=20');
        } catch (e) {
          console.log('WorkOrders API error, using mock data');
        }

        // Mock 데이터로 변환 (실제로는 물류 전용 API 필요)
        setLogisticsData({
          today_shipments: 12345,
          today_receipts: 8765,
          pending_orders: (Array.isArray(workOrders) ? workOrders : workOrders?.results || []).length || 45,
          delayed_shipments: 3,
          inventory_value: 45.6,
          warehouse_capacity: 100000,
          warehouse_utilization: 78.5,
          by_warehouse: [
            { warehouse: '본사창고', capacity: 50000, utilized: 42000, utilization: 84, pending_inbound: 120, pending_outbound: 85 },
            { warehouse: '공장1창고', capacity: 30000, utilized: 22000, utilization: 73, pending_inbound: 85, pending_outbound: 62 },
            { warehouse: '공장2창고', capacity: 20000, utilized: 16500, utilization: 82.5, pending_inbound: 45, pending_outbound: 38 },
          ],
          shipments_today: [
            { order_id: 'SH-2024-0224-001', customer: '삼성전자', destination: '경기도 수원시', items: 150, status: 'shipped', eta: '2024-02-24 14:00' },
            { order_id: 'SH-2024-0224-002', customer: 'LG전자', destination: '경기도 평택시', items: 280, status: 'in_transit', eta: '2024-02-24 16:30' },
            { order_id: 'SH-2024-0224-003', customer: '현대모비스', destination: '울산광역시', items: 95, status: 'pending', eta: '2024-02-24 18:00' },
            { order_id: 'SH-2024-0224-004', customer: '기아차', destination: '광주광역시', items: 320, status: 'delayed', eta: '2024-02-25 10:00' },
          ],
          inbound_scheduled: [
            { po_number: 'PO-2024-0225-001', supplier: '한국금속', warehouse: '본사창고', items: 500, eta: '2024-02-25 09:00', status: 'on_time' },
            { po_number: 'PO-2024-0225-002', supplier: '대우물산', warehouse: '공장1창고', items: 1200, eta: '2024-02-25 14:00', status: 'on_time' },
            { po_number: 'PO-2024-0225-003', supplier: '삼성SDS', warehouse: '공장2창고', items: 350, eta: '2024-02-25 16:00', status: 'delayed' },
          ],
          carrier_performance: [
            { carrier: '롯데택배', on_time_rate: 96.5, avg_delivery_time: 1.8, total_shipments: 1234 },
            { carrier: '한진택배', on_time_rate: 94.2, avg_delivery_time: 2.1, total_shipments: 892 },
            { carrier: 'CU편의점택배', on_time_rate: 98.1, avg_delivery_time: 1.5, total_shipments: 567 },
          ]
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': case 'on_time': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'shipped': return '출고완료';
      case 'in_transit': return '운송중';
      case 'pending': return '대기중';
      case 'delayed': return '지연';
      case 'on_time': return '정시';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">물류 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TruckIcon size={32} />
          <h1 className="text-3xl font-bold">물류 관리</h1>
        </div>
        <p className="text-cyan-100">입출고 및 창고 운영을 효율적으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">오늘 출고량</span>
            <TruckIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{(logisticsData.today_shipments || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">건/개</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">오늘 입고량</span>
            <PackageIcon className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{(logisticsData.today_receipts || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">건/개</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">대기 건수</span>
            <ActivityIcon className="text-orange-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{logisticsData.pending_orders}</p>
          <p className="text-sm text-gray-500 mt-2">처리 대기</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">창고 가동률</span>
            <TrendUpIcon className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{logisticsData.warehouse_utilization}%</p>
          <p className="text-sm text-gray-500 mt-2">전체 평균</p>
        </div>
      </div>

      {/* 창고별 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-cyan-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <PackageIcon size={20} />
            창고별 운영 현황
          </h3>
          <p className="text-cyan-100 text-xs mt-1">창고별 수용률 및 입출고 현황</p>
        </div>

        <div className="p-6 space-y-4">
          {(logisticsData.by_warehouse || []).map((warehouse: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{warehouse.warehouse}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  warehouse.utilization > 85 ? 'bg-red-100 text-red-700' :
                  warehouse.utilization > 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  가동률 {warehouse.utilization}%
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">수용량</span>
                  <span className="font-medium">{(warehouse.utilized || 0).toLocaleString()} / {(warehouse.capacity || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      warehouse.utilization > 85 ? 'bg-red-500' :
                      warehouse.utilization > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${warehouse.utilization}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded p-2">
                  <span className="text-gray-600">입고 대기</span>
                  <p className="font-bold text-blue-600">{warehouse.pending_inbound}건</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <span className="text-gray-600">출고 대기</span>
                  <p className="font-bold text-green-600">{warehouse.pending_outbound}건</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 오늘의 출고 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <TruckIcon size={20} />
            오늘의 출고 현황
          </h3>
          <p className="text-blue-100 text-xs mt-1">진행 중인 출고 건</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">출고번호</th>
                <th className="py-3 px-4 text-left">고객사</th>
                <th className="py-3 px-4 text-left">목적지</th>
                <th className="py-3 px-4 text-center">수량</th>
                <th className="py-3 px-4 text-center">도착예정</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logisticsData.shipments_today || []).map((shipment: any, idx: number) => (
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="py-3 px-4 font-medium">{shipment.order_id}</td>
                  <td className="py-3 px-4">{shipment.customer}</td>
                  <td className="py-3 px-4">{shipment.destination}</td>
                  <td className="py-3 px-4 text-center">{(shipment.items || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">{shipment.eta}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 예정 입고 & 운송사별 성과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <PackageIcon size={20} />
              예정 입고
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4 text-left">발주번호</th>
                  <th className="py-3 px-4 text-left">공급사</th>
                  <th className="py-3 px-4 text-center">창고</th>
                  <th className="py-3 px-4 text-center">ETA</th>
                  <th className="py-3 px-4 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(logisticsData.inbound_scheduled || []).map((inbound: any, idx: number) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="py-3 px-4 font-medium">{inbound.po_number}</td>
                    <td className="py-3 px-4">{inbound.supplier}</td>
                    <td className="py-3 px-4 text-center">{inbound.warehouse}</td>
                    <td className="py-3 px-4 text-center">{inbound.eta}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(inbound.status)}`}>
                        {getStatusLabel(inbound.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ActivityIcon className="text-purple-600" size={24} />
            운송사별 성과
          </h3>
          <div className="space-y-4">
            {(logisticsData.carrier_performance || []).map((carrier: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{carrier.carrier}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    carrier.on_time_rate >= 97 ? 'bg-green-100 text-green-700' :
                    carrier.on_time_rate >= 94 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    정시율 {carrier.on_time_rate}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">평균 배송시간: {carrier.avg_delivery_time}일</div>
                  <div className="text-gray-600">총 배송건수: {(carrier.total_shipments || 0).toLocaleString()}건</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 물류 인사이트 */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">물류 인사이트</h3>
        <div className="space-y-3">
          {logisticsData.delayed_shipments > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">지연 출고 현황</p>
                  <p className="text-sm text-gray-600">
                    현재 {logisticsData.delayed_shipments}건의 출고가 지연되고 있습니다.
                    고객사 통보 및 대응 계획 수립이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {logisticsData.warehouse_utilization > 80 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">창고 용량 관리</p>
                  <p className="text-sm text-gray-600">
                    전체 창고 가동률이 {logisticsData.warehouse_utilization}%로 높습니다.
                    추가 창고 확보 또는 재고 최적화를 검토하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 설비 관리
const FacilityManagement: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedLine, setSelectedLine] = React.useState<string>('all');

  const [facilityData, setFacilityData] = React.useState<any>({
    total_equipment: 0,
    operating_equipment: 0,
    failed_equipment: 0,
    maintenance_equipment: 0,
    avg_oee: 0,
    avg_availability: 0,
    upcoming_maintenance: 0,
    by_line: [],
    equipment_list: [],
    maintenance_schedule: [],
    downtime_analysis: []
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 제조/생산 API와 연동
        const api = (await import('@/services/api')).default;
        const [equipment, maintenance, oeeData, downtime] = await Promise.all([
          api.production.getEquipment('limit=50'),
          api.production.getMaintenanceSchedule(),
          api.manufacturing.getOEEMetric('limit=50'),
          api.manufacturing.getEquipmentDowntime('days=30')
        ]);

        setFacilityData({
          total_equipment: equipment?.results?.length || 48,
          operating_equipment: equipment?.results?.filter((e: any) => e.status === 'operating').length || 42,
          failed_equipment: equipment?.results?.filter((e: any) => e.status === 'failed').length || 3,
          maintenance_equipment: equipment?.results?.filter((e: any) => e.status === 'maintenance').length || 3,
          avg_oee: 85.3,
          avg_availability: 92.1,
          upcoming_maintenance: maintenance?.results?.length || 12,
          by_line: [
            { line: '라인1', total: 12, operating: 11, failed: 0, maintenance: 1, oee: 87.5, availability: 94.2 },
            { line: '라인2', total: 12, operating: 10, failed: 1, maintenance: 1, oee: 84.2, availability: 91.5 },
            { line: '라인3', total: 12, operating: 11, failed: 1, maintenance: 0, oee: 86.8, availability: 93.8 },
            { line: '라인4', total: 12, operating: 10, failed: 1, maintenance: 1, oee: 82.7, availability: 88.9 },
          ],
          equipment_list: equipment?.results?.map((e: any) => ({
            id: e.id,
            name: e.name,
            code: e.code,
            line: e.line,
            status: e.status,
            oee: e.oee || 0,
            availability: e.availability || 0,
            last_maintenance: e.last_maintenance_date,
            next_maintenance: e.next_maintenance_date
          })) || [
            { id: 1, name: '프레스기 #1', code: 'EQ-001', line: '라인1', status: 'operating', oee: 89.2, availability: 95.5, last_maintenance: '2024-02-01', next_maintenance: '2024-03-01' },
            { id: 2, name: '용접기 #2', code: 'EQ-002', line: '라인1', status: 'operating', oee: 85.7, availability: 92.3, last_maintenance: '2024-02-05', next_maintenance: '2024-03-05' },
            { id: 3, name: '도장기 #1', code: 'EQ-003', line: '라인1', status: 'maintenance', oee: 0, availability: 0, last_maintenance: '2024-02-20', next_maintenance: '2024-02-25' },
            { id: 4, name: '프레스기 #2', code: 'EQ-004', line: '라인2', status: 'failed', oee: 0, availability: 0, last_maintenance: '2024-01-15', next_maintenance: '2024-02-24' },
            { id: 5, name: '조립라인 #1', code: 'EQ-005', line: '라인2', status: 'operating', oee: 88.1, availability: 94.7, last_maintenance: '2024-02-10', next_maintenance: '2024-03-10' },
          ],
          maintenance_schedule: maintenance?.results?.map((m: any) => ({
            id: m.id,
            equipment_name: m.equipment_name,
            scheduled_date: m.scheduled_date,
            type: m.maintenance_type,
            priority: m.priority,
            technician: m.technician
          })) || [
            { id: 1, equipment_name: '도장기 #1', scheduled_date: '2024-02-25', type: '예방', priority: 'high', technician: '김기술' },
            { id: 2, equipment_name: '프레스기 #2', scheduled_date: '2024-02-24', type: '고장', priority: 'urgent', technician: '이기술' },
            { id: 3, equipment_name: '컨베이어벨트 #3', scheduled_date: '2024-02-26', type: '예방', priority: 'medium', technician: '박기술' },
          ],
          downtime_analysis: downtime?.results?.map((d: any) => ({
            equipment_name: d.equipment_name,
            downtime_hours: d.downtime_hours,
            reason: d.failure_reason,
            date: d.downtime_date
          })) || [
            { equipment_name: '프레스기 #2', downtime_hours: 4.5, reason: '모터 고장', date: '2024-02-23' },
            { equipment_name: '용접기 #3', downtime_hours: 2.0, reason: '센서 오류', date: '2024-02-22' },
            { equipment_name: '컨베이어 #1', downtime_hours: 1.5, reason: '벨트 마모', date: '2024-02-21' },
          ]
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operating': return 'bg-green-100 text-green-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operating': return '가동중';
      case 'maintenance': return '점검중';
      case 'failed': return '고장';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">설비 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FactoryIcon size={32} />
          <h1 className="text-3xl font-bold">설비 관리</h1>
        </div>
        <p className="text-amber-100">설비 가동 현황과 예방 보전을 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">설비 가동율</span>
            <ActivityIcon className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{facilityData.avg_oee}%</p>
          <p className="text-sm text-gray-500 mt-2">OEE 기준</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">가동율</span>
            <TrendUpIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{facilityData.avg_availability}%</p>
          <p className="text-sm text-gray-500 mt-2">Availability</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">고장 설비</span>
            <AlertIcon className="text-red-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{facilityData.failed_equipment}대</p>
          <p className="text-sm text-gray-500 mt-2">총 {facilityData.total_equipment}대 중</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">예방 점검</span>
            <SettingsIcon className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{facilityData.upcoming_maintenance}건</p>
          <p className="text-sm text-gray-500 mt-2">예정된 점검</p>
        </div>
      </div>

      {/* 라인별 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-amber-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FactoryIcon size={20} />
            라인별 설비 현황
          </h3>
          <p className="text-amber-100 text-xs mt-1">생산라인별 가동율 및 설비 상태</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">라인</th>
                <th className="py-3 px-4 text-center">총설비</th>
                <th className="py-3 px-4 text-center">가동중</th>
                <th className="py-3 px-4 text-center">점검중</th>
                <th className="py-3 px-4 text-center">고장</th>
                <th className="py-3 px-4 text-center">OEE</th>
                <th className="py-3 px-4 text-center">가동율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(facilityData.by_line || []).map((line: any, idx: number) => (
                <tr key={idx} className="hover:bg-amber-50">
                  <td className="py-3 px-4 font-medium">{line.line}</td>
                  <td className="py-3 px-4 text-center">{line.total}대</td>
                  <td className="py-3 px-4 text-center text-green-600">{line.operating}대</td>
                  <td className="py-3 px-4 text-center text-yellow-600">{line.maintenance}대</td>
                  <td className="py-3 px-4 text-center text-red-600">{line.failed}대</td>
                  <td className="py-3 px-4 text-center font-bold">{line.oee}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      line.availability >= 93 ? 'bg-green-100 text-green-700' :
                      line.availability >= 90 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {line.availability}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 설비별 현황 & 예방 점검 일정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <ActivityIcon size={20} />
              설비별 현황
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4 text-left">설비명</th>
                  <th className="py-3 px-4 text-center">라인</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">OEE</th>
                  <th className="py-3 px-4 text-center">다음 점검</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(facilityData.equipment_list || []).slice(0, 8).map((equipment: any, idx: number) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{equipment.name}</div>
                      <div className="text-xs text-gray-500">{equipment.code}</div>
                    </td>
                    <td className="py-3 px-4 text-center">{equipment.line}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(equipment.status)}`}>
                        {getStatusLabel(equipment.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{equipment.oee > 0 ? equipment.oee + '%' : '-'}</td>
                    <td className="py-3 px-4 text-center text-sm">{equipment.next_maintenance || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <SettingsIcon size={20} />
              예방 점검 일정
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4 text-left">설비</th>
                  <th className="py-3 px-4 text-center">예정일</th>
                  <th className="py-3 px-4 text-center">유형</th>
                  <th className="py-3 px-4 text-center">우선순위</th>
                  <th className="py-3 px-4 text-center">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(facilityData.maintenance_schedule || []).map((schedule: any, idx: number) => (
                  <tr key={idx} className="hover:bg-purple-50">
                    <td className="py-3 px-4 font-medium">{schedule.equipment_name}</td>
                    <td className="py-3 px-4 text-center">{schedule.scheduled_date}</td>
                    <td className="py-3 px-4 text-center">{schedule.type}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(schedule.priority)}`}>
                        {schedule.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{schedule.technician}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 다운타임 분석 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <AlertIcon size={20} />
            최근 다운타임 분석 (30일)
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(facilityData.downtime_analysis || []).map((downtime: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{downtime.equipment_name}</h4>
                  <span className="text-red-600 font-bold">{downtime.downtime_hours}시간</span>
                </div>
                <p className="text-sm text-gray-600">원인: {downtime.reason}</p>
                <p className="text-xs text-gray-500 mt-1">발생일: {downtime.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 설비 인사이트 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">설비 인사이트</h3>
        <div className="space-y-3">
          {facilityData.failed_equipment > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔧</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">고장 설비 조치 필요</p>
                  <p className="text-sm text-gray-600">
                    현재 {facilityData.failed_equipment}대의 설비가 고장 상태입니다.
                    즉시 조치 후 생산 복구 계획을 수립하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          {facilityData.avg_oee < 85 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">OEE 개선 기회</p>
                  <p className="text-sm text-gray-600">
                    평균 OEE가 {facilityData.avg_oee}%로 목표(85%) 미달입니다.
                    비가동 시간 분석 및 설비 최적화를 통해 개선이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(facilityData.maintenance_schedule || []).filter((m: any) => m.priority === 'urgent').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">긴급 점검 대상</p>
                  <p className="text-sm text-gray-600">
                    {(facilityData.maintenance_schedule || []).filter((m: any) => m.priority === 'urgent').length}건의 긴급 점검이 예정되어 있습니다.
                    담당자 배치 및 부품 준비를 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 구매 관리
const PurchasingManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [monthlyPurchases, setMonthlyPurchases] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = (await import('@/services/api')).default;
        const [monthlyRes, ordersRes, suppliersRes] = await Promise.all([
          api.purchase.getMonthly('fiscal_year=2024'),
          api.purchase.getOrders(),
          api.purchase.getSuppliers(),
        ]);
        setMonthlyPurchases(Array.isArray(monthlyRes) ? monthlyRes : monthlyRes.results || []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.results || []);
        setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : suppliersRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-700';
      case 'in-transit': return 'bg-yellow-100 text-yellow-700';
      case 'received': return 'bg-green-100 text-green-700';
      case 'delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ordered': return '발주완료';
      case 'in-transit': return '운송중';
      case 'received': return '입고완료';
      case 'delayed': return '지연';
      default: return status;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-700';
      case 'B': return 'bg-blue-100 text-blue-700';
      case 'C': return 'bg-yellow-100 text-yellow-700';
      case 'D': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">구매 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const latestPurchase = monthlyPurchases.length > 0
    ? monthlyPurchases.sort((a, b) => b.fiscal_month - a.fiscal_month)[0]
    : null;
  const totalPurchase = monthlyPurchases.reduce((sum, m) => sum + parseFloat(m.purchase_amount || '0'), 0);
  const avgPurchase = monthlyPurchases.length > 0 ? totalPurchase / monthlyPurchases.length : 0;
  const pendingOrders = (orders || []).filter((o: any) => o.status !== 'received').length;
  const urgentOrders = (orders || []).filter((o: any) => o.is_urgent).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCartIcon size={32} />
          <h1 className="text-3xl font-bold">구매 관리</h1>
        </div>
        <p className="text-orange-100">구매 발주를 효율적으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">월간 구매액</span>
            <DollarIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {latestPurchase ? `${parseFloat(latestPurchase.purchase_amount).toFixed(0)}억` : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-2">평균: {avgPurchase.toFixed(0)}억</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">입고 대기</span>
            <ActivityIcon className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{pendingOrders}건</p>
          <p className="text-sm text-gray-500 mt-2">긴급: {urgentOrders}건</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">발주 건수</span>
            <ShoppingCartIcon className="text-yellow-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{(orders || []).length}건</p>
          <p className="text-sm text-gray-500 mt-2">운송중: {(orders || []).filter((o: any) => o.status === 'in-transit').length}건</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">연간 누적</span>
            <TrendUpIcon className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalPurchase.toFixed(0)}억</p>
          <p className="text-sm text-gray-500 mt-2">2024년 기준</p>
        </div>
      </div>

      {/* 발주 현황 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-orange-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ShoppingCartIcon size={20} />
            발주 현황
          </h3>
          <p className="text-orange-100 text-xs mt-1">진행 중인 구매 오더</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">PO 번호</th>
                <th className="py-3 px-4 text-left">공급사</th>
                <th className="py-3 px-4 text-left">품목</th>
                <th className="py-3 px-4 text-center">수량</th>
                <th className="py-3 px-4 text-right">금액</th>
                <th className="py-3 px-4 text-center">발주일</th>
                <th className="py-3 px-4 text-center">납기</th>
                <th className="py-3 px-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 10).map((order: any) => (
                <tr key={order.id} className={`hover:bg-orange-50 ${order.is_urgent ? 'bg-red-50' : ''}`}>
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {order.is_urgent && <span className="text-red-600">🔥</span>}
                      {order.po_number}
                    </div>
                  </td>
                  <td className="py-3 px-4">{order.supplier_name}</td>
                  <td className="py-3 px-4">{order.item_name}</td>
                  <td className="py-3 px-4 text-center">{(order.quantity ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {(parseFloat(order.total_amount || '0') / 10000).toFixed(0)}만
                  </td>
                  <td className="py-3 px-4 text-center">{order.order_date}</td>
                  <td className="py-3 px-4 text-center">{order.delivery_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 공급업체 평가 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <CheckIcon size={20} />
            공급업체 평가
          </h3>
          <p className="text-purple-100 text-xs mt-1">품질, 납기, 가격, 서비스 종합 평가</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4 text-left">공급업체</th>
                <th className="py-3 px-4 text-center">품질</th>
                <th className="py-3 px-4 text-center">납기</th>
                <th className="py-3 px-4 text-center">가격</th>
                <th className="py-3 px-4 text-center">서비스</th>
                <th className="py-3 px-4 text-center">종합점수</th>
                <th className="py-3 px-4 text-center">등급</th>
                <th className="py-3 px-4 text-center">추세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier: any) => (
                <tr key={supplier.id} className="hover:bg-purple-50">
                  <td className="py-3 px-4 font-medium">{supplier.supplier_name}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.quality_score || '0').toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.delivery_score || '0').toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.price_score || '0').toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(supplier.service_score || '0').toFixed(0)}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">
                    {parseFloat(supplier.total_score || '0').toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(supplier.grade)}`}>
                      {supplier.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {supplier.trend === 'up' && <span className="text-green-600">↗️ 상승</span>}
                    {supplier.trend === 'stable' && <span className="text-blue-600">→ 유지</span>}
                    {supplier.trend === 'down' && <span className="text-red-600">↘️ 하락</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 구매 인사이트 */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">구매 인사이트</h3>
        <div className="space-y-3">
          {urgentOrders > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">긴급 발주 현황</p>
                  <p className="text-sm text-gray-600">
                    현재 {urgentOrders}건의 긴급 발주가 진행 중입니다.
                    납기 준수 여부를 면밀히 모니터링하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(suppliers || []).filter((s: any) => s.trend === 'down').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">공급업체 평가 하락</p>
                  <p className="text-sm text-gray-600">
                    {(suppliers || []).filter((s: any) => s.trend === 'down').map((s: any) => s.supplier_name).join(', ')}의
                    평가가 하락 추세입니다. 개선 요청 및 대체 업체 물색이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 자재 관리
const MaterialManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [inventory, setInventory] = React.useState<any[]>([]);
  const [turnover, setTurnover] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = (await import('@/services/api')).default;
        const [invRes, turnoverRes] = await Promise.all([
          api.purchase.getInventory(),
          api.purchase.getTurnover('fiscal_year=2024'),
        ]);
        setInventory(Array.isArray(invRes) ? invRes : invRes.results || []);
        setTurnover(Array.isArray(turnoverRes) ? turnoverRes : turnoverRes.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'adequate': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'high': return 'text-blue-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'adequate': return '적정';
      case 'low': return '부족';
      case 'high': return '과다';
      case 'critical': return '긴급';
      default: return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">재고 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalInventoryValue = (inventory || []).reduce((sum, inv) => sum + parseFloat(inv.stock_value || '0'), 0);
  const lowStockItems = (inventory || []).filter((inv: any) => inv.status === 'low' || inv.status === 'critical');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <PackageIcon size={32} />
          <h1 className="text-3xl font-bold">자재 관리</h1>
        </div>
        <p className="text-green-100">재고를 효율적으로 관리합니다</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">재고 자산</span>
            <PackageIcon className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalInventoryValue.toFixed(0)}억</p>
          <p className="text-sm text-gray-500 mt-2">{inventory.length}개 품목</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">재고 부족</span>
            <AlertIcon className="text-red-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{lowStockItems.length}개</p>
          <p className="text-sm text-gray-500 mt-2">안전재고 미만</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">평균 회전율</span>
            <ActivityIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {inventory.length > 0
              ? (inventory.reduce((sum, inv) => sum + parseFloat(inv.turnover_rate || '0'), 0) / inventory.length).toFixed(1)
              : 0}회
          </p>
          <p className="text-sm text-gray-500 mt-2">월간 기준</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">총 품목</span>
            <PackageIcon className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{inventory.length}개</p>
          <p className="text-sm text-gray-500 mt-2">전체 자재</p>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'A', 'B', 'C'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' && '전체'}
              {category === 'A' && 'A등급 (고가)'}
              {category === 'B' && 'B등급 (중간)'}
              {category === 'C' && 'C등급 (저가)'}
            </button>
          ))}
        </div>
      </div>

      {/* 재고 현황 (ABC 분석) */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PackageIcon className="text-green-600" size={24} />
            재고 현황 (ABC 분석)
          </h3>
          <p className="text-sm text-gray-500 mt-1">중요도 기반 재고 관리</p>
        </div>

        <div className="space-y-3">
          {(inventory || [])
            .filter((inv: any) => selectedCategory === 'all' || inv.category === selectedCategory)
            .slice(0, 8)
            .map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white ${
                      item.category === 'A' ? 'bg-red-600' :
                      item.category === 'B' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {item.category}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.item_code} - {item.item_name}</h4>
                      <p className="text-sm text-gray-600">재고가치: {parseFloat(item.stock_value || '0').toFixed(1)}억원</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getStockStatusColor(item.status)}`}>
                      {getStockStatusLabel(item.status)}
                    </p>
                    <p className="text-xs text-gray-500">회전율: {parseFloat(item.turnover_rate || '0').toFixed(1)}회</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">현재 재고</p>
                    <p className="text-lg font-bold text-blue-600">{(item.current_stock ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">안전 재고</p>
                    <p className="text-lg font-bold text-yellow-600">{(item.safety_stock ?? 0).toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    (item.current_stock ?? 0) >= (item.safety_stock ?? 1) ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">재고율</p>
                    <p className={`text-lg font-bold ${
                      (item.current_stock ?? 0) >= (item.safety_stock ?? 1) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.safety_stock ? (((item.current_stock ?? 0) / item.safety_stock) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">ABC 분류 기준</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-bold text-red-600">A등급</span>
              <p className="text-gray-600">고가/중요 품목 집중관리</p>
            </div>
            <div>
              <span className="font-bold text-blue-600">B등급</span>
              <p className="text-gray-600">중간 가치 정기 점검</p>
            </div>
            <div>
              <span className="font-bold text-green-600">C등급</span>
              <p className="text-gray-600">저가 품목 간편 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 재고 인사이트 */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">재고 인사이트</h3>
        <div className="space-y-3">
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">재고 부족 품목 주의</p>
                  <p className="text-sm text-gray-600">
                    {lowStockItems.map((i: any) => i.item_name).join(', ')}의 재고가 안전재고 미만입니다.
                    긴급 발주 검토가 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(inventory || []).filter((i: any) => i.status === 'high').length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-bold text-gray-800 mb-1">과다 재고 품목</p>
                  <p className="text-sm text-gray-600">
                    {(inventory || []).filter((i: any) => i.status === 'high').length}개 품목의 재고가 과다합니다.
                    보관 비용 증가와 재고 부화风险(위험)이 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
