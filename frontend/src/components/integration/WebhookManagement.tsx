import React, { useState } from 'react';
import { WebhookIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, LinkIcon } from '@/components/icons/Icons';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret?: string;
  lastTriggered?: string;
  successRate: number;
}

const WebhookManagement: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'SLACK 알림',
      url: 'https://hooks.slack.com/services/XXX',
      events: ['order.created', 'order.updated', 'error.occurred'],
      status: 'active',
      lastTriggered: '2026-03-31 10:25:00',
      successRate: 98.5
    },
    {
      id: '2',
      name: 'ERP 연동',
      url: 'https://erp.example.com/webhook',
      events: ['production.completed', 'quality.checked'],
      status: 'active',
      lastTriggered: '2026-03-31 10:20:00',
      successRate: 99.2
    },
    {
      id: '3',
      name: '이메일 알림',
      url: 'https://email.service.com/api/webhook',
      events: ['alert.high', 'alert.critical'],
      status: 'inactive',
      successRate: 95.0
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const availableEvents = [
    'order.created',
    'order.updated',
    'order.deleted',
    'production.started',
    'production.completed',
    'quality.checked',
    'quality.failed',
    'error.occurred',
    'alert.low',
    'alert.high',
    'alert.critical',
    'user.login',
    'user.logout'
  ];

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAddWebhook = () => {
    setSelectedWebhook(null);
    setShowModal(true);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowModal(true);
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('정말 이 웹훅을 삭제하시겠습니까?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setWebhooks(webhooks.map(w =>
      w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w
    ));
  };

  const handleSaveWebhook = (webhook: Webhook) => {
    if (selectedWebhook) {
      setWebhooks(webhooks.map(w => w.id === webhook.id ? webhook : webhook));
    } else {
      setWebhooks([...webhooks, { ...webhook, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  const testWebhook = (webhook: Webhook) => {
    alert(`웹훅 테스트: ${webhook.name}\n${webhook.url}\n으로 테스트 이벤트를 전송합니다.`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">웹훅 관리</h2>
          <p className="text-gray-600 mt-1">외부 시스템으로 실시간 이벤트 알림을 전송합니다</p>
        </div>
        <button
          onClick={handleAddWebhook}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon size={20} />
          새 웹훅 추가
        </button>
      </div>

      <div className="space-y-4">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <WebhookIcon size={20} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{webhook.name}</h3>
                  <button
                    onClick={() => handleToggleStatus(webhook.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {webhook.status === 'active' ? '활성' : '비활성'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <LinkIcon size={16} />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    성공률: <span className={`font-semibold ${getSuccessRateColor(webhook.successRate)}`}>
                      {webhook.successRate}%
                    </span>
                  </span>
                  {webhook.lastTriggered && (
                    <span className="text-gray-600">
                      마지막 전송: {webhook.lastTriggered}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testWebhook(webhook)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  title="테스트"
                >
                  <LinkIcon size={18} />
                </button>
                <button
                  onClick={() => handleEditWebhook(webhook)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="수정"
                >
                  <EditIcon size={18} />
                </button>
                <button
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  title="삭제"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">구독 중인 이벤트:</p>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map(event => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <WebhookModal
          webhook={selectedWebhook}
          availableEvents={availableEvents}
          onSave={handleSaveWebhook}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

interface WebhookModalProps {
  webhook: Webhook | null;
  availableEvents: string[];
  onSave: (webhook: Webhook) => void;
  onClose: () => void;
}

const WebhookModal: React.FC<WebhookModalProps> = ({ webhook, availableEvents, onSave, onClose }) => {
  const [formData, setFormData] = useState<Webhook>(
    webhook || {
      id: '',
      name: '',
      url: '',
      events: [],
      status: 'active',
      successRate: 100
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleEvent = (event: string) => {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter(e => e !== event)
        : [...formData.events, event]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {webhook ? '웹훅 수정' : '새 웹훅 추가'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/webhook"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시크릿 (선택)</label>
            <input
              type="text"
              value={formData.secret || ''}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="HMAC signature secret"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이벤트 선택</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {availableEvents.map(event => (
                <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-gray-700">{event}</span>
                </label>
              ))}
            </div>
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

export default WebhookManagement;
