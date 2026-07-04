/**
 * LLM 설정 관리 컴포넌트
 * 오픈소스(Ollama), ChatGPT, Gemini 설정 관리
 */

import React, { useState, useEffect } from 'react';
import {
  getLLMSettings,
  saveLLMSettings,
  testOllamaConnection,
  testChatGPTKey,
  testGeminiKey,
  LLMSettings as LLMSettingsType,
  LLMProvider
} from '@/services/llmService';

const LLMSettings: React.FC = () => {
  const [settings, setSettings] = useState<LLMSettingsType>(getLLMSettings());
  const [testing, setTesting] = useState<LLMProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<LLMProvider, { success: boolean; message: string } | null>>({
    ollama: null,
    chatgpt: null,
    gemini: null
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getLLMSettings());
  }, []);

  const handleSave = () => {
    saveLLMSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggle = (provider: LLMProvider) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        enabled: !prev[provider].enabled
      }
    }));
  };

  const handlePriorityChange = (provider: LLMProvider, priority: number) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        priority
      }
    }));
  };

  const handleConfigChange = (provider: LLMProvider, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleTest = async (provider: LLMProvider) => {
    setTesting(provider);
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      let result: { success: boolean; error?: string; models?: string[] };

      switch (provider) {
        case 'ollama':
          result = await testOllamaConnection(settings.ollama.endpoint || 'http://localhost:11434');
          break;
        case 'chatgpt':
          result = await testChatGPTKey(settings.chatgpt.apiKey || '');
          break;
        case 'gemini':
          result = await testGeminiKey(settings.gemini.apiKey || '');
          break;
      }

      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: result.success,
          message: result.success
            ? (provider === 'ollama' && result.models
              ? `연결 성공! 사용 가능 모델: ${result.models.join(', ')}`
              : '연결 성공!')
            : `연결 실패: ${result.error}`
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: `테스트 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const getProviderIcon = (provider: LLMProvider) => {
    switch (provider) {
      case 'ollama':
        return '🦙';
      case 'chatgpt':
        return '🤖';
      case 'gemini':
        return '✨';
    }
  };

  const getProviderName = (provider: LLMProvider) => {
    switch (provider) {
      case 'ollama':
        return 'Ollama (오픈소스)';
      case 'chatgpt':
        return 'ChatGPT (OpenAI)';
      case 'gemini':
        return 'Gemini (Google)';
    }
  };

  const getProviderDescription = (provider: LLMProvider) => {
    switch (provider) {
      case 'ollama':
        return '로컬에서 실행되는 오픈소스 LLM. 데이터 보안이 중요할 때 권장.';
      case 'chatgpt':
        return 'OpenAI의 GPT 모델. 높은 품질의 응답 제공.';
      case 'gemini':
        return 'Google의 Gemini 모델. 빠른 응답과 다국어 지원.';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🧠 LLM 모델 설정
        </h2>
        <p className="text-gray-600 mt-1">
          챗봇에서 사용할 AI 모델을 설정합니다. 우선순위가 높은 모델이 먼저 사용됩니다.
        </p>
      </div>

      {/* 우선순위 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📋 우선순위 안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>1순위</strong>: 오픈소스 모델 (Ollama) - 데이터 보안, 비용 절감</li>
          <li>• <strong>2순위</strong>: ChatGPT 또는 Gemini - 고품질 응답</li>
          <li>• 활성화된 모델 중 우선순위가 높은 모델이 먼저 사용됩니다.</li>
          <li>• 우선순위 모델 실패 시 자동으로 다음 순위 모델로 전환됩니다.</li>
        </ul>
      </div>

      {/* LLM 카드들 */}
      <div className="space-y-4">
        {(['ollama', 'chatgpt', 'gemini'] as LLMProvider[]).map(provider => (
          <div
            key={provider}
            className={`border rounded-xl p-5 transition-all ${
              settings[provider].enabled
                ? 'border-blue-300 bg-blue-50/50 shadow-md'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProviderIcon(provider)}</span>
                <div>
                  <h3 className="font-bold text-gray-800">{getProviderName(provider)}</h3>
                  <p className="text-sm text-gray-500">{getProviderDescription(provider)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* 우선순위 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">우선순위:</span>
                  <select
                    value={settings[provider].priority}
                    onChange={(e) => handlePriorityChange(provider, Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={1}>1 (최우선)</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                {/* 토글 스위치 */}
                <button
                  onClick={() => handleToggle(provider)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings[provider].enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings[provider].enabled ? 'translate-x-7' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 설정 필드 */}
            {settings[provider].enabled && (
              <div className="border-t pt-4 mt-4 space-y-3">
                {provider === 'ollama' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ollama 서버 주소
                      </label>
                      <input
                        type="text"
                        value={settings.ollama.endpoint || ''}
                        onChange={(e) => handleConfigChange('ollama', 'endpoint', e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        모델명
                      </label>
                      <input
                        type="text"
                        value={settings.ollama.model || ''}
                        onChange={(e) => handleConfigChange('ollama', 'model', e.target.value)}
                        placeholder="llama2, mistral, codellama 등"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}

                {provider === 'chatgpt' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OpenAI API 키
                      </label>
                      <input
                        type="password"
                        value={settings.chatgpt.apiKey || ''}
                        onChange={(e) => handleConfigChange('chatgpt', 'apiKey', e.target.value)}
                        placeholder="sk-..."
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        모델
                      </label>
                      <select
                        value={settings.chatgpt.model || 'gpt-3.5-turbo'}
                        onChange={(e) => handleConfigChange('chatgpt', 'model', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (빠름, 저렴)</option>
                        <option value="gpt-4">GPT-4 (고품질)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo (최신)</option>
                      </select>
                    </div>
                  </>
                )}

                {provider === 'gemini' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google AI API 키
                      </label>
                      <input
                        type="password"
                        value={settings.gemini.apiKey || ''}
                        onChange={(e) => handleConfigChange('gemini', 'apiKey', e.target.value)}
                        placeholder="AIza..."
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Google AI Studio에서 API 키 발급 →
                        </a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        모델
                      </label>
                      <select
                        value={settings.gemini.model || 'gemini-1.5-flash'}
                        onChange={(e) => handleConfigChange('gemini', 'model', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (빠름)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (고품질)</option>
                        <option value="gemini-pro">Gemini Pro (안정적)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 테스트 버튼 및 결과 */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleTest(provider)}
                    disabled={testing === provider}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {testing === provider ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        테스트 중...
                      </span>
                    ) : (
                      '🔌 연결 테스트'
                    )}
                  </button>
                  {testResults[provider] && (
                    <span className={`text-sm ${testResults[provider]?.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults[provider]?.success ? '✅' : '❌'} {testResults[provider]?.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 저장 버튼 */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          💾 설정 저장
        </button>
        {saved && (
          <span className="text-green-600 font-medium animate-pulse">
            ✅ 저장되었습니다!
          </span>
        )}
      </div>

      {/* 현재 활성 LLM 표시 */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">📊 현재 활성 LLM 상태</h4>
        <div className="text-sm text-gray-600">
          {(['ollama', 'chatgpt', 'gemini'] as LLMProvider[])
            .filter(p => settings[p].enabled)
            .sort((a, b) => settings[a].priority - settings[b].priority)
            .map((p, idx) => (
              <span key={p} className="inline-flex items-center gap-1 mr-4">
                <span className="font-medium">{idx + 1}.</span>
                {getProviderIcon(p)} {getProviderName(p)}
                {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">사용중</span>}
              </span>
            ))}
          {!(['ollama', 'chatgpt', 'gemini'] as LLMProvider[]).some(p => settings[p].enabled) && (
            <span className="text-red-500">⚠️ 활성화된 LLM이 없습니다</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMSettings;
