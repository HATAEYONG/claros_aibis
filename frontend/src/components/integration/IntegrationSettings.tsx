import React, { useState, useEffect } from 'react';
import { SettingsIcon, PlusIcon, EditIcon, TrashIcon } from '@/components/icons/Icons';

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'ERP' | 'CRM' | 'PLM' | 'MES' | 'WMS' | 'OTHER';
  endpoint: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  description: string;
}

const IntegrationSettings: React.FC = () => {
  const [configs, setConfigs] = useState<IntegrationConfig[]>([
    {
      id: '1',
      name: 'SAP ERP 연동',
      type: 'ERP',
      endpoint: 'https://sap.example.com/api',
      status: 'active',
      lastSync: '2026-03-31 10:30:00',
      description: 'SAP ERP 시스템과의 데이터 연동'
    },
    {
      id: '2',
      name: 'Salesforce CRM',
      type: 'CRM',
      endpoint: 'https://crm.salesforce.com/api',
      status: 'active',
      lastSync: '2026-03-31 10:25:00',
      description: '영업 데이터 연동'
    },
    {
      id: '3',
      name: 'MES 시스템',
      type: 'MES',
      endpoint: 'https://mes.example.com/api',
      status: 'error',
      lastSync: '2026-03-31 09:00:00',
      description: '생산 실행 시스템 연동'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<IntegrationConfig | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'error': return '오류';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ERP: 'ERP',
      CRM: 'CRM',
      PLM: 'PLM',
      MES: 'MES',
      WMS: 'WMS',
      OTHER: '기타'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setShowModal(true);
  };

  const handleEditConfig = (config: IntegrationConfig) => {
    setEditingConfig(config);
    setShowModal(true);
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm('정말 이 연동 설정을 삭제하시겠습니까?')) {
      setConfigs(configs.filter(c => c.id !== id));
    }
  };

  const handleSaveConfig = (config: IntegrationConfig) => {
    if (editingConfig) {
      setConfigs(configs.map(c => c.id === config.id ? config : c));
    } else {
      setConfigs([...configs, { ...config, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">외부 시스템 연동 설정</h2>
          <p className="text-gray-600 mt-1">ERP, CRM, MES 등 외부 시스템과의 연동을 관리합니다</p>
        </div>
        <button
          onClick={handleAddConfig}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon size={20} />
          새 연동 추가
        </button>
      </div>

      <div className="grid gap-4">
        {configs.map(config => (
          <div key={config.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{config.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(config.status)}`}>
                    {getStatusLabel(config.status)}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {getTypeLabel(config.type)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{config.description}</p>
                <p className="text-gray-500 text-xs">엔드포인트: {config.endpoint}</p>
                <p className="text-gray-500 text-xs">마지막 동기화: {config.lastSync}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditConfig(config)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <EditIcon size={18} />
                </button>
                <button
                  onClick={() => handleDeleteConfig(config.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <IntegrationModal
          config={editingConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

interface IntegrationModalProps {
  config: IntegrationConfig | null;
  onSave: (config: IntegrationConfig) => void;
  onClose: () => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<IntegrationConfig>(
    config || {
      id: '',
      name: '',
      type: 'ERP',
      endpoint: '',
      status: 'inactive',
      lastSync: '',
      description: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {config ? '연동 설정 수정' : '새 연동 설정'}
        </h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ERP">ERP</option>
              <option value="CRM">CRM</option>
              <option value="PLM">PLM</option>
              <option value="MES">MES</option>
              <option value="WMS">WMS</option>
              <option value="OTHER">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">엔드포인트</label>
            <input
              type="url"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
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
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationSettings;
