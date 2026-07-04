// AlertManagement.tsx - 알림 관리 컴포넌트
import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Settings,
  Eye
} from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'kpi' | 'quality' | 'production' | 'financial' | 'procurement' | 'compliance';
  source_event_id?: string;
  source_agent?: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved';
  recipients: Array<{
    type: 'user' | 'team' | 'role';
    name: string;
    acknowledged_at?: string;
  }>;
  channels: Array<'email' | 'sms' | 'slack' | 'dashboard'>;
  created_at: string;
  sent_at?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  action_required: boolean;
  metadata: Record<string, any>;
}

const AlertManagement: React.FC = () => {
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'alerts' | 'rules'>('alerts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date());
    setIsLoading(false);
  };

  const alerts: Alert[] = [
    {
      id: 'alt001',
      title: '원가율 KPI 이탈 경고',
      description: '원가율이 목표 75%를 초과하여 77.5%로 상승했습니다.',
      severity: 'high',
      category: 'kpi',
      status: 'pending',
      recipients: [{ type: 'user', name: '이재무' }],
      channels: ['email', 'slack'],
      created_at: new Date(Date.now() - 1800000).toISOString(),
      action_required: true,
      metadata: { current_value: 77.5, target_value: 75.0 }
    },
    {
      id: 'alt002',
      title: '치수 불량 급증 알림',
      description: '치수 불량이 지난 24시간 동안 8건 발생했습니다.',
      severity: 'critical',
      category: 'quality',
      status: 'sent',
      recipients: [{ type: 'user', name: '김품질' }],
      channels: ['email', 'sms', 'slack'],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sent_at: new Date(Date.now() - 3500000).toISOString(),
      action_required: true,
      metadata: { defect_count: 8 }
    }
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">알림 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">시스템 알림을 모니터링하고 관리</p>
        </div>
        <button onClick={handleRefresh} disabled={isLoading} className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} bg-opacity-10`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.channels.includes('email') && <Mail className="w-4 h-4 text-gray-400" />}
                  {alert.channels.includes('slack') && <MessageSquare className="w-4 h-4 text-gray-400" />}
                  {alert.channels.includes('sms') && <Smartphone className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;
