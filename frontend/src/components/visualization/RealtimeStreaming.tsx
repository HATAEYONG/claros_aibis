import React, { useState, useEffect } from 'react';
import { StreamIcon, PlayIcon, PauseIcon, RefreshIcon } from '@/components/icons/Icons';

interface StreamData {
  timestamp: string;
  production: number;
  quality: number;
  efficiency: number;
  temperature: number;
  pressure: number;
}

const RealtimeStreaming: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<StreamData[]>([]);
  const [currentValue, setCurrentValue] = useState<StreamData>({
    timestamp: new Date().toLocaleTimeString(),
    production: 0,
    quality: 0,
    efficiency: 0,
    temperature: 0,
    pressure: 0
  });

  // Generate random data for simulation
  const generateRandomData = (): StreamData => {
    return {
      timestamp: new Date().toLocaleTimeString(),
      production: Math.floor(Math.random() * 100) + 50,
      quality: Math.floor(Math.random() * 10) + 90,
      efficiency: Math.floor(Math.random() * 20) + 80,
      temperature: Number((Math.random() * 10 + 20).toFixed(1)),
      pressure: Number((Math.random() * 5 + 100).toFixed(1))
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      interval = setInterval(() => {
        const newData = generateRandomData();
        setCurrentValue(newData);

        setStreamData(prev => {
          const updated = [...prev, newData];
          return updated.slice(-20); // Keep last 20 data points
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const clearData = () => {
    setStreamData([]);
    setCurrentValue({
      timestamp: new Date().toLocaleTimeString(),
      production: 0,
      quality: 0,
      efficiency: 0,
      temperature: 0,
      pressure: 0
    });
  };

  const getStatusColor = (value: number, type: 'production' | 'quality' | 'efficiency' | 'temperature' | 'pressure') => {
    if (type === 'quality' || type === 'efficiency') {
      if (value >= 95) return 'text-green-600';
      if (value >= 85) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'production') {
      if (value >= 120) return 'text-green-600';
      if (value >= 80) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'temperature') {
      if (value >= 28) return 'text-red-600';
      if (value >= 24) return 'text-yellow-600';
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const renderMiniChart = (data: number[], color: string) => {
    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-1 h-16">
        {data.map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${height}%`,
                backgroundColor: color,
                opacity: 0.7 + (index / data.length) * 0.3
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">실시간 데이터 스트림</h2>
          <p className="text-gray-600 mt-1">실시간 데이터를 스트리밍하여 모니터링합니다</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshIcon size={18} />
            초기화
          </button>
          <button
            onClick={toggleStreaming}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isStreaming
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isStreaming ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
            {isStreaming ? '중지' : '시작'}
          </button>
        </div>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">생산량</span>
            <StreamIcon size={20} className="text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(currentValue.production, 'production')}`}>
            {currentValue.production}
          </p>
          <p className="text-xs text-blue-600">개/시간</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">품질률</span>
            <span className="text-xl">✅</span>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(currentValue.quality, 'quality')}`}>
            {currentValue.quality}%
          </p>
          <p className="text-xs text-green-600">양품률</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">가동률</span>
            <span className="text-xl">⚡</span>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(currentValue.efficiency, 'efficiency')}`}>
            {currentValue.efficiency}%
          </p>
          <p className="text-xs text-purple-600">설비 가동률</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">온도</span>
            <span className="text-xl">🌡️</span>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(currentValue.temperature, 'temperature')}`}>
            {currentValue.temperature}°C
          </p>
          <p className="text-xs text-orange-600">공장 온도</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">압력</span>
            <span className="text-xl">💨</span>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(currentValue.pressure, 'pressure')}`}>
            {currentValue.pressure} kPa
          </p>
          <p className="text-xs text-red-600">라인 압력</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">생산량 추이</h4>
          {renderMiniChart(streamData.map(d => d.production), '#3B82F6')}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">품질률 추이</h4>
          {renderMiniChart(streamData.map(d => d.quality), '#10B981')}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">가동률 추이</h4>
          {renderMiniChart(streamData.map(d => d.efficiency), '#8B5CF6')}
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">최근 데이터</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">시간</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">생산량</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">품질률</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">가동률</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">온도</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">압력</th>
              </tr>
            </thead>
            <tbody>
              {streamData.slice().reverse().map((data, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{data.timestamp}</td>
                  <td className="px-4 py-2 text-right text-blue-700">{data.production}</td>
                  <td className="px-4 py-2 text-right text-green-700">{data.quality}%</td>
                  <td className="px-4 py-2 text-right text-purple-700">{data.efficiency}%</td>
                  <td className="px-4 py-2 text-right text-orange-700">{data.temperature}°C</td>
                  <td className="px-4 py-2 text-right text-red-700">{data.pressure} kPa</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isStreaming && streamData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <StreamIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>스트리밍 시작 버튼을 클릭하여 실시간 데이터를 수집하세요</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeStreaming;
