/**
 * ERP 동기화 서비스 설정 컴포넌트
 * EMAX/FOM ERP 동기화 서비스의 On/Off 설정을 관리하는 UI
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Play,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface ERPSyncServiceConfig {
  id: number;
  config_id: number;
  service_type: 'emax' | 'fom';
  service_type_display: string;
  service_name: string;
  is_enabled: boolean;
  sync_status: 'running' | 'idle' | 'error' | 'disabled';
  sync_status_display: string;
  last_sync_at: string | null;
  last_error_message: string;
  total_sync_count: number;
  success_sync_count: number;
  failed_sync_count: number;
  success_rate: number;
  sync_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

interface ServiceSummary {
  total_services: number;
  enabled_count: number;
  disabled_count: number;
}

interface APIResponse {
  services: ERPSyncServiceConfig[];
  summary: ServiceSummary;
}

export const ERPSyncConfiguration: React.FC = () => {
  const [services, setServices] = useState<ERPSyncServiceConfig[]>([]);
  const [summary, setSummary] = useState<ServiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingService, setTogglingService] = useState<string | null>(null);
  const [syncingService, setSyncingService] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    fetchServices();
    // 자동 새로고침 (30초마다)
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/erp-sync/service-config/all_services/');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data: APIResponse = await response.json();
      setServices(data.services || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching ERP sync services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (serviceType: string) => {
    setTogglingService(serviceType);
    try {
      const response = await fetch(`/api/erp-sync/service-config/toggle/${serviceType}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to toggle service');

      const result = await response.json();
      alert(result.message || '서비스 상태가 변경되었습니다.');
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('서비스 상태 변경에 실패했습니다.');
    } finally {
      setTogglingService(null);
    }
  };

  const handleEnableService = async (serviceType: string) => {
    setTogglingService(serviceType);
    try {
      const response = await fetch('/api/erp-sync/service-config/enable_service/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service_type: serviceType }),
      });

      if (!response.ok) throw new Error('Failed to enable service');

      const result = await response.json();
      alert(result.message || '서비스가 활성화되었습니다.');
      fetchServices();
    } catch (error) {
      console.error('Error enabling service:', error);
      alert('서비스 활성화에 실패했습니다.');
    } finally {
      setTogglingService(null);
    }
  };

  const handleDisableService = async (serviceType: string) => {
    if (!confirm('정말 이 서비스를 비활성화하시겠습니까?')) return;

    setTogglingService(serviceType);
    try {
      const response = await fetch('/api/erp-sync/service-config/disable_service/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service_type: serviceType }),
      });

      if (!response.ok) throw new Error('Failed to disable service');

      const result = await response.json();
      alert(result.message || '서비스가 비활성화되었습니다.');
      fetchServices();
    } catch (error) {
      console.error('Error disabling service:', error);
      alert('서비스 비활성화에 실패했습니다.');
    } finally {
      setTogglingService(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'idle':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'disabled':
        return <ToggleLeft className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">ERP 동기화 서비스 설정</h2>
        </div>
        <button
          onClick={fetchServices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">전체 서비스</p>
                <p className="text-2xl font-bold text-blue-800">{summary.total_services}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">활성화된 서비스</p>
                <p className="text-2xl font-bold text-green-800">{summary.enabled_count}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">비활성화된 서비스</p>
                <p className="text-2xl font-bold text-gray-800">{summary.disabled_count}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.config_id}
            className="p-6 border rounded-lg hover:shadow-md transition-shadow"
          >
            {/* Service Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {service.service_name}
                  </h3>
                  <p className="text-sm text-gray-500">{service.service_type_display}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {getStatusIcon(service.sync_status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(service.sync_status)}`}>
                  {service.sync_status_display}
                </span>
              </div>
            </div>

            {/* Service Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">동기화 주기</p>
                <p className="text-sm font-medium text-gray-800">{service.sync_interval_minutes}분</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">총 동기화</p>
                <p className="text-sm font-medium text-gray-800">{service.total_sync_count}회</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">성공률</p>
                <p className="text-sm font-medium text-gray-800">{service.success_rate}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">마지막 동기화</p>
                <p className="text-sm font-medium text-gray-800">{formatDateTime(service.last_sync_at)}</p>
              </div>
            </div>

            {/* Error Message (if any) */}
            {service.last_error_message && service.sync_status === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{service.last_error_message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              {service.is_enabled ? (
                <>
                  <button
                    onClick={() => handleDisableService(service.service_type)}
                    disabled={togglingService === service.service_type}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    <ToggleLeft className="w-4 h-4" />
                    {togglingService === service.service_type ? '처리 중...' : '비활성화'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleEnableService(service.service_type)}
                  disabled={togglingService === service.service_type}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  <ToggleRight className="w-4 h-4" />
                  {togglingService === service.service_type ? '처리 중...' : '활성화'}
                </button>
              )}

              <button
                onClick={() => handleToggleService(service.service_type)}
                disabled={togglingService === service.service_type}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${togglingService === service.service_type ? 'animate-spin' : ''}`} />
                토글
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">등록된 동기화 서비스가 없습니다.</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      )}
    </div>
  );
};
