import React from 'react';

export interface FeatureImportance {
  feature: string;
  importance: number;
  category?: string;
}

export interface PredictionExplanation {
  predictionId: string;
  prediction: number;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
    description: string;
  }[];
  shapValues: {
    feature: string;
    value: number;
    baseline: number;
  }[];
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  metrics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  actions?: string[];
  timestamp: string;
}

interface XAIExplanationProps {
  explanation: PredictionExplanation;
}

export const XAIExplanation: React.FC<XAIExplanationProps> = ({ explanation }) => {
  const getImpactColor = (impact: number) => {
    const abs = Math.abs(impact);
    if (abs > 0.5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (abs > 0.3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-800 dark:text-gray-200">Prediction Explanation</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            explanation.confidence > 0.8
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {Math.round(explanation.confidence * 100)}% Confidence
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {explanation.prediction.toFixed(2)}
        </p>
      </div>

      <div>
        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Factors</h5>
        <div className="space-y-2">
          {explanation.factors.map((factor, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">{factor.factor}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    factor.direction === 'positive'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {factor.direction === 'positive' ? '+' : '-'}
                    {Math.abs(factor.impact * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{factor.description}</p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    factor.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">SHAP Values</h5>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="space-y-3">
            {explanation.shapValues.map((shap, idx) => {
              const totalRange = Math.max(...explanation.shapValues.map(s => Math.abs(s.value)));
              const barWidth = (Math.abs(shap.value) / totalRange) * 100;
              const isPositive = shap.value > 0;

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{shap.feature}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{shap.baseline.toFixed(2)}</span>
                    <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                      <div
                        className={`h-full ${
                          isPositive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                        {isPositive ? '+' : ''}{shap.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureImportanceChartProps {
  features: FeatureImportance[];
  title?: string;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ features, title }) => {
  const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance);
  const maxValue = Math.max(...features.map(f => f.importance));

  const getColor = (idx: number) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
      'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500'
    ];
    return colors[idx % colors.length];
  };

  return (
    <div>
      {title && <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{title}</h4>}
      <div className="space-y-3">
        {sortedFeatures.map((feature, idx) => {
          const barWidth = (feature.importance / maxValue) * 100;
          const colorClass = getColor(idx);

          return (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{feature.feature}</span>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      {(feature.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colorClass}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AutoInsightsProps {
  insights: Insight[];
  onActionClick?: (insightId: string, action: string) => void;
}

export const AutoInsights: React.FC<AutoInsightsProps> = ({ insights, onActionClick }) => {
  const getIconForType = (type: Insight['type']) => {
    switch (type) {
      case 'trend': return '📈';
      case 'anomaly': return '⚠️';
      case 'opportunity': return '💡';
      case 'warning': return '🔔';
    }
  };

  const getColorForType = (type: Insight['type']) => {
    switch (type) {
      case 'trend': return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
      case 'anomaly': return 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20';
      case 'opportunity': return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
      case 'warning': return 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20';
    }
  };

  const getSeverityColor = (severity: Insight['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
    }
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.type]) acc[insight.type] = [];
    acc[insight.type].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 dark:text-gray-200">Auto-Generated Insights</h4>
        <span className="text-sm text-gray-500 dark:text-gray-400">{insights.length} insights</span>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedInsights).map(([type, typeInsights]) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getIconForType(type as Insight['type'])}</span>
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{type}s ({typeInsights.length})</h5>
            </div>
            <div className="space-y-3">
              {typeInsights.map(insight => (
                <div key={insight.id} className={`bg-gradient-to-r ${getColorForType(insight.type)} rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(insight.severity)} mt-2`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-bold text-gray-800 dark:text-gray-200">{insight.title}</h6>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(insight.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{insight.description}</p>

                      {insight.metrics.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {insight.metrics.map((metric, idx) => (
                            <div key={idx} className="bg-white/50 dark:bg-black/10 rounded p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
                              <p className="font-bold text-gray-800 dark:text-gray-200">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {insight.actions && insight.actions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Suggested Actions:</p>
                          {insight.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => onActionClick?.(insight.id, action)}
                              className="block w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded text-sm hover:bg-white/80 dark:hover:bg-gray-700 transition-colors"
                            >
                              <span className="text-blue-600 dark:text-blue-400">→</span> {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default { XAIExplanation, FeatureImportanceChart, AutoInsights };
