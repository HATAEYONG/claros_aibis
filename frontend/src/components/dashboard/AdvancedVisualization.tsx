import React, { useState, useMemo } from 'react';
import AdvancedCharts, { HeatmapData, WaterfallData, BoxPlotData } from '@/components/common/AdvancedCharts';
import InteractiveFilter, { FilterConfig } from '@/components/common/InteractiveFilter';
import { ActivityIcon } from '@/components/icons/Icons';

const AdvancedVisualization: React.FC = () => {
  const [chartType, setChartType] = useState<'heatmap' | 'waterfall' | 'boxplot'>('heatmap');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Sample data for Heatmap
  const heatmapData: HeatmapData[] = [
    { x: 'Jan', y: 'Product A', value: 120 },
    { x: 'Jan', y: 'Product B', value: 85 },
    { x: 'Jan', y: 'Product C', value: 65 },
    { x: 'Feb', y: 'Product A', value: 145 },
    { x: 'Feb', y: 'Product B', value: 95 },
    { x: 'Feb', y: 'Product C', value: 75 },
    { x: 'Mar', y: 'Product A', value: 160 },
    { x: 'Mar', y: 'Product B', value: 110 },
    { x: 'Mar', y: 'Product C', value: 90 },
    { x: 'Apr', y: 'Product A', value: 135 },
    { x: 'Apr', y: 'Product B', value: 100 },
    { x: 'Apr', y: 'Product C', value: 80 },
  ];

  // Sample data for Waterfall
  const waterfallData: WaterfallData[] = [
    { category: 'Start', value: 100000 },
    { category: 'Sales', value: 50000 },
    { category: 'Costs', value: -30000 },
    { category: 'Tax', value: -8000 },
    { category: 'Net Profit', value: 112000, isTotal: true },
  ];

  // Sample data for Box Plot
  const boxPlotData: BoxPlotData[] = [
    { category: 'Team A', min: 45, q1: 65, median: 78, q3: 88, max: 95, outliers: [30, 98] },
    { category: 'Team B', min: 50, q1: 70, median: 82, q3: 90, max: 100, outliers: [35] },
    { category: 'Team C', min: 40, q1: 60, median: 75, q3: 85, max: 92, outliers: [25, 28, 96] },
    { category: 'Team D', min: 55, q1: 72, median: 80, q3: 88, max: 98 },
  ];

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      id: 'period',
      label: 'Period',
      type: 'select',
      options: [
        { value: 'q1', label: 'Q1 2024' },
        { value: 'q2', label: 'Q2 2024' },
        { value: 'q3', label: 'Q3 2024' },
        { value: 'q4', label: 'Q4 2024' }
      ]
    },
    {
      id: 'region',
      label: 'Region',
      type: 'multiselect',
      options: [
        { value: 'kr', label: 'Korea', count: 45 },
        { value: 'us', label: 'USA', count: 32 },
        { value: 'eu', label: 'Europe', count: 28 },
        { value: 'cn', label: 'China', count: 35 }
      ]
    },
    {
      id: 'valueRange',
      label: 'Value Range',
      type: 'range',
      min: 0,
      max: 200000
    }
  ];

  // Filter data based on active filters
  const filteredHeatmapData = useMemo(() => {
    if (!filterValues.period && !filterValues.region && !filterValues.valueRange) {
      return heatmapData;
    }
    return heatmapData.filter(d => {
      if (filterValues.valueRange && Array.isArray(filterValues.valueRange)) {
        const [min, max] = filterValues.valueRange;
        if (d.value < min || d.value > max) return false;
      }
      return true;
    });
  }, [heatmapData, filterValues]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">Advanced Data Visualization</h1>
        </div>
        <p className="text-purple-100">Interactive charts with heatmap, waterfall, and box plot visualizations</p>
      </div>

      {/* Chart Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('heatmap')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              chartType === 'heatmap'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setChartType('waterfall')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              chartType === 'waterfall'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Waterfall
          </button>
          <button
            onClick={() => setChartType('boxplot')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              chartType === 'boxplot'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Box Plot
          </button>
        </div>
      </div>

      {/* Interactive Filters */}
      <div className="flex justify-end">
        <InteractiveFilter
          filters={filterConfigs}
          onFilterChange={setFilterValues}
          compact
        />
      </div>

      {/* Chart Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {chartType === 'heatmap' && (
          <AdvancedCharts
            type="heatmap"
            data={filteredHeatmapData}
            title="Sales Heatmap by Product and Month"
          />
        )}
        {chartType === 'waterfall' && (
          <AdvancedCharts
            type="waterfall"
            data={waterfallData}
            title="Revenue Waterfall Analysis (KRW)"
          />
        )}
        {chartType === 'boxplot' && (
          <AdvancedCharts
            type="boxplot"
            data={boxPlotData}
            title="Team Performance Distribution"
          />
        )}
      </div>

      {/* Full Filter Panel */}
      <InteractiveFilter
        filters={filterConfigs}
        onFilterChange={setFilterValues}
      />

      {/* Chart Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Heatmap Chart
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualize data intensity using color gradients. Perfect for identifying patterns and hotspots in two-dimensional data.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Waterfall Chart
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Show cumulative effect of sequential positive and negative values. Ideal for financial analysis and tracking changes over time.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Box Plot Chart
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Display statistical distribution with quartiles, median, and outliers. Essential for analyzing data spread and comparisons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVisualization;
