import React, { useState } from 'react';
import { SwapHorizIcon, DownloadIcon, UploadIcon, FileIcon, PlayIcon, PlusIcon } from '@/components/icons/Icons';

interface ExportJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'custom';
  format: 'csv' | 'excel' | 'json' | 'xml';
  status: 'ready' | 'running' | 'completed' | 'failed';
  createdAt: string;
  recordCount: number;
  fileSize?: string;
}

interface ImportJob {
  id: string;
  name: string;
  source: string;
  format: 'csv' | 'excel' | 'json' | 'xml';
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  createdAt: string;
  recordCount: number;
  successCount?: number;
  errorCount?: number;
}

const DataExchange: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: '생산 데이터 전체 내보내기',
      type: 'full',
      format: 'excel',
      status: 'completed',
      createdAt: '2026-03-31 10:00:00',
      recordCount: 15234,
      fileSize: '45.2 MB'
    },
    {
      id: '2',
      name: '영업 데이터 일일 내보내기',
      type: 'incremental',
      format: 'csv',
      status: 'completed',
      createdAt: '2026-03-31 06:00:00',
      recordCount: 567,
      fileSize: '1.2 MB'
    },
    {
      id: '3',
      name: '품질 검사 결과 내보내기',
      type: 'custom',
      format: 'json',
      status: 'running',
      createdAt: '2026-03-31 10:15:00',
      recordCount: 0
    }
  ]);

  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: '1',
      name: 'ERP 재고 데이터 가져오기',
      source: 'ERP System',
      format: 'csv',
      status: 'completed',
      createdAt: '2026-03-31 09:00:00',
      recordCount: 12453,
      successCount: 12450,
      errorCount: 3
    },
    {
      id: '2',
      name: 'CRM 고객 데이터 가져오기',
      source: 'Salesforce',
      format: 'excel',
      status: 'validating',
      createdAt: '2026-03-31 10:20:00',
      recordCount: 0
    },
    {
      id: '3',
      name: '공급사 마스터 데이터',
      source: 'File Upload',
      format: 'json',
      status: 'failed',
      createdAt: '2026-03-31 08:30:00',
      recordCount: 0,
      errorCount: 0
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'running':
      case 'validating':
      case 'importing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'ready':
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ready: '준비',
      running: '진행중',
      completed: '완료',
      failed: '실패',
      pending: '대기중',
      validating: '검증중',
      importing: '가져오는중'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getFormatLabel = (format: string) => {
    return format.toUpperCase();
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      full: '전체',
      incremental: '증분',
      custom: '사용자 정의'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleExportJob = () => {
    setShowExportModal(true);
  };

  const handleImportJob = () => {
    setShowImportModal(true);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">데이터 내보내기/가져오기</h2>
          <p className="text-gray-600 mt-1">외부 시스템과의 데이터 교환을 관리합니다</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === 'export'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DownloadIcon size={18} />
          내보내기
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <UploadIcon size={18} />
          가져오기
        </button>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleExportJob}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon size={18} />
              새 내보내기 작업
            </button>
          </div>

          <div className="space-y-3">
            {exportJobs.map(job => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileIcon size={20} className="text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">{job.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {getFormatLabel(job.format)}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {getTypeLabel(job.type)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>생성: {job.createdAt}</span>
                      <span>레코드: {job.recordCount.toLocaleString()}</span>
                      {job.fileSize && <span>파일 크기: {job.fileSize}</span>}
                    </div>
                  </div>
                  {job.status === 'completed' && (
                    <button className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                      <DownloadIcon size={16} />
                      다운로드
                    </button>
                  )}
                  {job.status === 'ready' && (
                    <button className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                      <PlayIcon size={16} />
                      시작
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleImportJob}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon size={18} />
              새 가져오기 작업
            </button>
          </div>

          <div className="space-y-3">
            {importJobs.map(job => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <UploadIcon size={20} className="text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">{job.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {getFormatLabel(job.format)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span>소스: {job.source}</span>
                      <span>생성: {job.createdAt}</span>
                      {job.recordCount > 0 && <span>레코드: {job.recordCount.toLocaleString()}</span>}
                    </div>
                    {job.status === 'completed' && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">성공: {job.successCount?.toLocaleString()}</span>
                        {job.errorCount && job.errorCount > 0 && (
                          <span className="text-red-600">실패: {job.errorCount.toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
};

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'incremental',
    format: 'excel'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`내보내기 작업 생성: ${formData.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">새 내보내기 작업</h3>
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="incremental">증분</option>
              <option value="full">전체</option>
              <option value="custom">사용자 정의</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 형식</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
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

interface ImportModalProps {
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    source: 'file',
    format: 'csv'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`가져오기 작업 생성: ${formData.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">새 가져오기 작업</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">소스</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="file">파일 업로드</option>
              <option value="erp">ERP 시스템</option>
              <option value="crm">CRM 시스템</option>
              <option value="api">API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 형식</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
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

export default DataExchange;
