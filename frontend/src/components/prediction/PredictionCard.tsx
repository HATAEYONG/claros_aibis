import React from 'react';
import { TrendUpIcon, TrendDownIcon, AlertIcon } from '@/components/icons/Icons';
import { PredictionResult, PredictionCardProps } from '@/types/prediction';

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  currentValue,
  showTrend = true,
  size = 'medium'
}) => {
  const { predicted_value, confidence, kpi_name, kpi_code, horizon } = prediction;

  // Calculate trend if current value is provided
  const trend = currentValue !== undefined
    ? ((predicted_value - currentValue) / currentValue) * 100
    : null;

  const isPositiveTrend = trend !== null && trend > 0;
  const isNegativeTrend = trend !== null && trend < 0;

  // Confidence level styling
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return '높음';
    if (confidence >= 0.5) return '보통';
    return '낮음';
  };

  // Size variants
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const valueFontSize = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className={`bg-white rounded-lg shadow ${sizeClasses[size]} border-l-4 ${
      isPositiveTrend ? 'border-green-500' :
      isNegativeTrend ? 'border-red-500' :
      'border-blue-500'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{kpi_code}</p>
          <h4 className="font-semibold text-gray-800 text-sm">{kpi_name}</h4>
        </div>
        <div className={`text-right ${getConfidenceColor()}`}>
          <p className="text-xs font-medium">{getConfidenceLabel()}</p>
          <p className="text-xs">{(confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Main Value */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className={`font-bold ${valueFontSize[size]} text-gray-800`}>
            {typeof predicted_value === 'number'
              ? predicted_value.toLocaleString('ko-KR', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 0
                })
              : '-'}
          </p>
          {currentValue !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              현재: {currentValue.toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        {/* Trend Indicator */}
        {showTrend && trend !== null && Math.abs(trend) > 0.1 && (
          <div className={`flex items-center gap-1 ${
            isPositiveTrend ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositiveTrend ? <TrendUpIcon size={16} /> : <TrendDownIcon size={16} />}
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2 mt-2">
        <span>예측 기간: {horizon}</span>
        <span className="flex items-center gap-1">
          <AlertIcon size={12} />
          AI 예측
        </span>
      </div>

      {/* Confidence Bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              confidence >= 0.8 ? 'bg-green-500' :
              confidence >= 0.5 ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
