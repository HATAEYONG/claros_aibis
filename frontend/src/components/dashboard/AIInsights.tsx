import React, { useState } from 'react';
import { XAIExplanation, FeatureImportanceChart, AutoInsights, PredictionExplanation, FeatureImportance, Insight } from '@/components/common/AIComponents';
import { BrainIcon } from '@/components/icons/Icons';

const AIInsights: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'xai' | 'features' | 'insights'>('xai');

  // Sample prediction explanation
  const sampleExplanation: PredictionExplanation = {
    predictionId: 'pred-001',
    prediction: 1520000000,
    confidence: 0.87,
    factors: [
      {
        factor: 'Historical Sales Trend',
        impact: 0.45,
        direction: 'positive',
        description: 'Strong upward trend in Q4 sales (+23% YoY) significantly increases predicted revenue.'
      },
      {
        factor: 'Market Conditions',
        impact: 0.32,
        direction: 'positive',
        description: 'Favorable market conditions with growing demand in key segments.'
      },
      {
        factor: 'Seasonal Effect',
        impact: -0.18,
        direction: 'negative',
        description: 'Historically lower sales in this period due to seasonal factors.'
      },
      {
        factor: 'Competitor Activity',
        impact: -0.12,
        direction: 'negative',
        description: 'Increased competition in primary markets may limit growth.'
      }
    ],
    shapValues: [
      { feature: 'Sales Trend', value: 0.35, baseline: 0.0 },
      { feature: 'Market Index', value: 0.22, baseline: 0.0 },
      { feature: 'Seasonality', value: -0.15, baseline: 0.0 },
      { feature: 'Competition', value: -0.10, baseline: 0.0 },
      { feature: 'Marketing Spend', value: 0.08, baseline: 0.0 }
    ]
  };

  // Sample feature importance
  const sampleFeatures: FeatureImportance[] = [
    { feature: 'Sales Volume', importance: 0.28, category: 'Sales' },
    { feature: 'Customer Retention', importance: 0.22, category: 'Customer' },
    { feature: 'Marketing ROI', importance: 0.18, category: 'Marketing' },
    { feature: 'Product Quality', importance: 0.15, category: 'Product' },
    { feature: 'Price Competitiveness', importance: 0.12, category: 'Pricing' },
    { feature: 'Market Share', importance: 0.05, category: 'Market' }
  ];

  // Sample insights
  const sampleInsights: Insight[] = [
    {
      id: 'insight-001',
      type: 'trend',
      severity: 'high',
      title: 'Revenue Growth Acceleration',
      description: 'Monthly revenue growth has accelerated from 5% to 12% over the past quarter, indicating strong market momentum.',
      metrics: [
        { label: 'Growth Rate', value: '+12%', trend: 'up' },
        { label: 'Revenue', value: '1.52T KRW', trend: 'up' },
        { label: 'Market Share', value: '23.5%', trend: 'up' }
      ],
      actions: [
        'Increase production capacity to meet demand',
        'Invest in marketing to capitalize on momentum',
        'Expand into adjacent market segments'
      ],
      timestamp: new Date().toISOString()
    },
    {
      id: 'insight-002',
      type: 'anomaly',
      severity: 'medium',
      title: 'Unusual Inventory Pattern Detected',
      description: 'Product B inventory is depleting 40% faster than forecasted, indicating potential supply chain issues.',
      metrics: [
        { label: 'Depletion Rate', value: '+40%', trend: 'up' },
        { label: 'Days of Stock', value: '12 days', trend: 'down' },
        { label: 'Backorders', value: '450 units', trend: 'up' }
      ],
      actions: [
        'Review supplier performance',
        'Activate backup suppliers',
        'Adjust production schedule'
      ],
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'insight-003',
      type: 'opportunity',
      severity: 'medium',
      title: 'Cross-Selling Opportunity',
      description: 'Customers purchasing Product A show 67% higher likelihood to purchase Product C within 30 days.',
      metrics: [
        { label: 'Conversion Potential', value: '67%' },
        { label: 'Target Customers', value: '2,340' },
        { label: 'Revenue Potential', value: '450M KRW' }
      ],
      actions: [
        'Create bundled offering',
        'Launch targeted email campaign',
        'Train sales team on cross-sell techniques'
      ],
      timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'insight-004',
      type: 'warning',
      severity: 'low',
      title: 'Quality Metric Trending Down',
      description: 'First-pass yield has decreased by 2.3% over the past two weeks in Production Line 3.',
      metrics: [
        { label: 'FPY Change', value: '-2.3%', trend: 'down' },
        { label: 'Current FPY', value: '96.8%' },
        { label: 'Defect Rate', value: '3.2%', trend: 'up' }
      ],
      actions: [
        'Schedule equipment maintenance',
        'Review operator training',
        'Analyze defect patterns'
      ],
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BrainIcon size={32} />
          <h1 className="text-3xl font-bold">AI-Powered Insights</h1>
        </div>
        <p className="text-indigo-100">Explainable AI, feature importance, and automated business intelligence</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('xai')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'xai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Prediction Explanations
          </button>
          <button
            onClick={() => setSelectedTab('features')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'features'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Feature Importance
          </button>
          <button
            onClick={() => setSelectedTab('insights')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Auto Insights
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {selectedTab === 'xai' && (
          <XAIExplanation explanation={sampleExplanation} />
        )}
        {selectedTab === 'features' && (
          <FeatureImportanceChart features={sampleFeatures} title="Model Feature Importance" />
        )}
        {selectedTab === 'insights' && (
          <AutoInsights
            insights={sampleInsights}
            onActionClick={(insightId, action) => {
              console.log('Action clicked:', insightId, action);
              alert(`Action: ${action}`);
            }}
          />
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            XAI Explainer
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Understand why the AI makes specific predictions with SHAP values and factor analysis.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Feature Importance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualize which features most influence your model predictions to focus on key drivers.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Auto Insights
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-generated actionable insights from your data with trend detection and anomaly alerts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
