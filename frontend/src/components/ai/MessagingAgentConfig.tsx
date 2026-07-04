/**
 * 메시징 플랫폼 연동 설정 컴포넌트
 * Slack, Telegram, Discord 봇 설정 및 테스트
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Slack,
  Send,
  CheckCircle,
  XCircle,
  Settings,
  Bell,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react';

interface PlatformConfig {
  platform: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  webhookUrl: string;
  botToken: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface MessageTest {
  platform: string;
  channel_id: string;
  message: string;
}

interface NotificationTest {
  platform: string;
  channel_id: string;
  type: string;
  kpi_name?: string;
  current_value?: string;
  threshold?: string;
  status?: string;
}

export const MessagingAgentConfig: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    {
      platform: 'slack',
      name: 'Slack',
      icon: <Slack className="w-5 h-5" />,
      color: 'purple',
      enabled: false,
      webhookUrl: '',
      botToken: '',
      status: 'disconnected'
    },
    {
      platform: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'blue',
      enabled: false,
      webhookUrl: '',
      botToken: '',
      status: 'disconnected'
    },
    {
      platform: 'discord',
      name: 'Discord',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'indigo',
      enabled: false,
      webhookUrl: '',
      botToken: '',
      status: 'disconnected'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'notify'>('config');
  const [testMessage, setTestMessage] = useState<MessageTest>({
    platform: 'slack',
    channel_id: '',
    message: '테스트 메시지입니다.'
  });
  const [notificationTest, setNotificationTest] = useState<NotificationTest>({
    platform: 'slack',
    channel_id: '',
    type: 'kpi_alert',
    kpi_name: '생산 완료율',
    current_value: '85%',
    threshold: '90%',
    status: '낮음'
  });
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai/messaging/config/');
      if (response.ok) {
        const data = await response.json();
        // 설정 불러오기
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveConfig = async (platform: string) => {
    setLoading(true);
    try {
      const platformConfig = platforms.find(p => p.platform === platform);
      if (!platformConfig) return;

      const response = await fetch('/api/ai/messaging/config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          enabled: platformConfig.enabled,
          webhook_url: platformConfig.webhookUrl,
          bot_token: platformConfig.botToken
        })
      });

      if (response.ok) {
        setTestResult(`${platformConfig.name} 설정이 저장되었습니다.`);
        setTimeout(() => setTestResult(null), 3000);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setTestResult('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/messaging/test/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(`테스트 메시지가 전송되었습니다.\n${data.message}`);
      } else {
        setTestResult(`전송 실패: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      setTestResult(`전송 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/messaging/notify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: notificationTest.platform,
          channel_id: notificationTest.channel_id,
          notification: notificationTest
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(`알림이 전송되었습니다.\n${data.message}`);
      } else {
        setTestResult(`전송 실패: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setTestResult(`전송 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">메시징 AI 에이전트 설정</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'config'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          플랫폼 설정
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'test'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <TestTube className="w-4 h-4 inline mr-2" />
          메시지 테스트
        </button>
        <button
          onClick={() => setActiveTab('notify')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'notify'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          알림 설정
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {platforms.map((platform) => {
            const colors = getColorClasses(platform.color);
            return (
              <div
                key={platform.platform}
                className={`p-6 border rounded-lg ${colors.bg} ${colors.border}`}
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${colors.bg} rounded-lg`}>
                      {React.cloneElement(platform.icon as React.ReactElement, {
                        className: `w-6 h-6 ${colors.text}`
                      })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {platform.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(platform.status)}
                        <span className="text-sm text-gray-600">
                          {platform.status === 'connected' ? '연결됨' :
                           platform.status === 'disconnected' ? '연결 안됨' : '오류'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enable Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platform.enabled}
                      onChange={(e) => {
                        setPlatforms(platforms.map(p =>
                          p.platform === platform.platform
                            ? { ...p, enabled: e.target.checked }
                            : p
                        ));
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">활성화</span>
                  </label>
                </div>

                {/* Configuration Inputs */}
                {platform.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        웹훅 URL
                      </label>
                      <input
                        type="text"
                        value={platform.webhookUrl}
                        onChange={(e) => {
                          setPlatforms(platforms.map(p =>
                            p.platform === platform.platform
                              ? { ...p, webhookUrl: e.target.value }
                              : p
                          ));
                        }}
                        placeholder={`https://your-domain.com/api/ai/messaging/webhook/${platform.platform}/`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        이 URL을 {platform.name} 앱 설정에 등록하세요
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        봇 토큰
                      </label>
                      <input
                        type="password"
                        value={platform.botToken}
                        onChange={(e) => {
                          setPlatforms(platforms.map(p =>
                            p.platform === platform.platform
                              ? { ...p, botToken: e.target.value }
                              : p
                          ));
                        }}
                        placeholder="xoxb-your-token"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveConfig(platform.platform)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? '저장 중...' : '설정 저장'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'test' && (
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">테스트 메시지 전송</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  플랫폼
                </label>
                <select
                  value={testMessage.platform}
                  onChange={(e) => setTestMessage({ ...testMessage, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="slack">Slack</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  채널 ID / Chat ID
                </label>
                <input
                  type="text"
                  value={testMessage.channel_id}
                  onChange={(e) => setTestMessage({ ...testMessage, channel_id: e.target.value })}
                  placeholder="C0123456789 또는 -1001234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메시지
                </label>
                <textarea
                  value={testMessage.message}
                  onChange={(e) => setTestMessage({ ...testMessage, message: e.target.value })}
                  rows={3}
                  placeholder="전송할 테스트 메시지를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleTestMessage}
                disabled={loading || !testMessage.channel_id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Send className="w-4 h-4" />
                {loading ? '전송 중...' : '테스트 메시지 전송'}
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <pre className="text-sm text-blue-800 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notify' && (
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">자율 알림 설정 테스트</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    플랫폼
                  </label>
                  <select
                    value={notificationTest.platform}
                    onChange={(e) => setNotificationTest({ ...notificationTest, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="slack">Slack</option>
                    <option value="telegram">Telegram</option>
                    <option value="discord">Discord</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채널 ID
                  </label>
                  <input
                    type="text"
                    value={notificationTest.channel_id}
                    onChange={(e) => setNotificationTest({ ...notificationTest, channel_id: e.target.value })}
                    placeholder="채널 ID 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  알림 유형
                </label>
                <select
                  value={notificationTest.type}
                  onChange={(e) => setNotificationTest({ ...notificationTest, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kpi_alert">KPI 알림</option>
                  <option value="anomaly_detected">이상 감지</option>
                  <option value="info">일반 정보</option>
                </select>
              </div>

              {notificationTest.type === 'kpi_alert' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      KPI 명칭
                    </label>
                    <input
                      type="text"
                      value={notificationTest.kpi_name}
                      onChange={(e) => setNotificationTest({ ...notificationTest, kpi_name: e.target.value })}
                      placeholder="예: 생산 완료율"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재값
                    </label>
                    <input
                      type="text"
                      value={notificationTest.current_value}
                      onChange={(e) => setNotificationTest({ ...notificationTest, current_value: e.target.value })}
                      placeholder="예: 85%"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      임계값
                    </label>
                    <input
                      type="text"
                      value={notificationTest.threshold}
                      onChange={(e) => setNotificationTest({ ...notificationTest, threshold: e.target.value })}
                      placeholder="예: 90%"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <select
                      value={notificationTest.status}
                      onChange={(e) => setNotificationTest({ ...notificationTest, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="낮음">낮음</option>
                      <option value="높음">높음</option>
                      <option value="정상">정상</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={handleTestNotification}
                disabled={loading || !notificationTest.channel_id}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400"
              >
                <Bell className="w-4 h-4" />
                {loading ? '전송 중...' : '알림 테스트'}
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <pre className="text-sm text-blue-800 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">자율 알림 안내</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• KPI 임계값 도달 시 자동 알림</li>
              <li>• 데이터 이상 감지 시 즉시 알림</li>
              <li>• 정기 리포트 생성 알림</li>
              <li>• 시스템 이벤트 알림</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
