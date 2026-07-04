import React, { useMemo } from 'react';
import ChartComponent from './ChartComponent';

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface WaterfallData {
  category: string;
  value: number;
  isTotal?: boolean;
}

interface BoxPlotData {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

interface AdvancedChartsProps {
  type: 'heatmap' | 'waterfall' | 'boxplot';
  data: HeatmapData[] | WaterfallData[] | BoxPlotData[];
  title?: string;
  height?: number;
}

export const HeatmapChart: React.FC<{ data: HeatmapData[]; title?: string }> = ({ data, title }) => {
  const chartData = useMemo(() => {
    const xLabels = [...new Set(data.map(d => d.x))];
    const yLabels = [...new Set(data.map(d => d.y))];
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    return {
      labels: yLabels,
      datasets: xLabels.map((xLabel, xIdx) => ({
        label: xLabel,
        data: yLabels.map(yLabel => {
          const item = data.find(d => d.x === xLabel && d.y === yLabel);
          return item ? item.value : 0;
        }),
        backgroundColor: yLabels.map((yLabel) => {
          const item = data.find(d => d.x === xLabel && d.y === yLabel);
          if (!item) return 'transparent';

          const ratio = (item.value - minValue) / (maxValue - minValue);
          const hue = 240 - ratio * 240;
          return `hsla(${hue}, 70%, 50%, 0.8)`;
        }),
        borderColor: 'transparent',
        borderWidth: 1
      }))
    };
  }, [data]);

  return (
    <div>
      {title && <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{title}</h4>}
      <ChartComponent
        type="bar"
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.raw;
                  return `Value: ${value}`;
                }
              }
            }
          }
        }}
        height={300}
      />
    </div>
  );
};

export const WaterfallChart: React.FC<{ data: WaterfallData[]; title?: string }> = ({ data, title }) => {
  const chartData = useMemo(() => {
    let cumulative = 0;
    const floatingData = data.map((item, idx) => {
      if (idx === 0) {
        cumulative = item.value;
        return { ...item, start: 0, end: item.value, floating: 0 };
      }
      if (item.isTotal) {
        const start = 0;
        const end = cumulative;
        return { ...item, start, end, floating: 0 };
      }
      const start = cumulative;
      cumulative += item.value;
      return { ...item, start, end: cumulative, floating: start };
    });

    return {
      labels: floatingData.map(d => d.category),
      datasets: [
        {
          label: 'Positive',
          data: floatingData.map(d => d.value > 0 && !d.isTotal ? d.value : 0),
          backgroundColor: '#10b981'
        },
        {
          label: 'Negative',
          data: floatingData.map(d => d.value < 0 && !d.isTotal ? Math.abs(d.value) : 0),
          backgroundColor: '#ef4444'
        },
        {
          label: 'Total',
          data: floatingData.map(d => d.isTotal ? d.end : 0),
          backgroundColor: '#3b82f6'
        }
      ]
    };
  }, [data]);

  return (
    <div>
      {title && <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{title}</h4>}
      <ChartComponent
        type="bar"
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
          }
        }}
        height={300}
      />
    </div>
  );
};

export const BoxPlotChart: React.FC<{ data: BoxPlotData[]; title?: string }> = ({ data, title }) => {
  const chartData = useMemo(() => {
    return {
      labels: data.map(d => d.category),
      datasets: [
        {
          label: 'Min',
          data: data.map(d => d.min),
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'transparent',
          borderWidth: 0
        },
        {
          label: 'Q1-Median',
          data: data.map(d => d.median - d.q1),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
          label: 'Median-Q3',
          data: data.map(d => d.q3 - d.median),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
        },
        {
          label: 'Max',
          data: data.map(d => d.max - d.q3),
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
        }
      ]
    };
  }, [data]);

  return (
    <div>
      {title && <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{title}</h4>}
      <div style={{ height: '300px' }}>
        <ChartComponent
          type="bar"
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    const idx = context.dataIndex;
                    const item = data[idx];
                    return [
                      `Min: ${item.min}`,
                      `Q1: ${item.q1}`,
                      `Median: ${item.median}`,
                      `Q3: ${item.q3}`,
                      `Max: ${item.max}`
                    ];
                  }
                }
              }
            }
          }}
        />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        {data.map((item, idx) => (
          <div key={idx} className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200">{item.category}</p>
            <p className="text-gray-600 dark:text-gray-400">Min: {item.min}</p>
            <p className="text-gray-600 dark:text-gray-400">Q1: {item.q1}</p>
            <p className="text-gray-600 dark:text-gray-400">Median: {item.median}</p>
            <p className="text-gray-600 dark:text-gray-400">Q3: {item.q3}</p>
            <p className="text-gray-600 dark:text-gray-400">Max: {item.max}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ type, data, title, height }) => {
  if (type === 'heatmap') {
    return <HeatmapChart data={data as HeatmapData[]} title={title} />;
  }
  if (type === 'waterfall') {
    return <WaterfallChart data={data as WaterfallData[]} title={title} />;
  }
  if (type === 'boxplot') {
    return <BoxPlotChart data={data as BoxPlotData[]} title={title} />;
  }
  return null;
};

export default AdvancedCharts;
