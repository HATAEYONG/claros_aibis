import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { PredictionChartProps, HistoricalDataPoint } from '@/types/prediction';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PredictionChart: React.FC<PredictionChartProps> = ({
  historicalData,
  predictedValue,
  targetDate,
  confidence = 0.8,
  height = 300,
  type = 'line',
  color = '#3B82F6'
}) => {
  // Prepare chart data
  const labels = historicalData.map(d => d.date);

  // Extract values based on available data
  const getHistoricalValues = (): number[] => {
    return historicalData.map(d => {
      if (d.revenue !== undefined) return d.revenue;
      if (d.production_quantity !== undefined) return d.production_quantity;
      if (d.defect_rate !== undefined) return d.defect_rate;
      if (d.oee !== undefined) return d.oee;
      if (d.cpk !== undefined) return d.cpk;
      if (d.stock_level !== undefined) return d.stock_level;
      if (d.turnover_rate !== undefined) return d.turnover_rate;
      return d.value || 0;
    });
  };

  const historicalValues = getHistoricalValues();

  // Calculate confidence interval
  const lastValue = historicalValues[historicalValues.length - 1] || 0;
  const confidenceRange = lastValue * (1 - confidence) * 0.5;
  const lowerBound = predictedValue - confidenceRange;
  const upperBound = predictedValue + confidenceRange;

  // Prepare datasets
  const datasets = [
    {
      label: '실제 데이터',
      data: [...historicalValues, null],
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: false,
    },
    {
      label: '예측값',
      data: [
        ...Array(historicalValues.length - 1).fill(null),
        lastValue,
        predictedValue
      ],
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: false,
    },
    // Confidence interval (upper bound)
    {
      label: '신뢰구간 상한',
      data: [
        ...Array(historicalValues.length - 1).fill(null),
        lastValue,
        upperBound
      ],
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointRadius: 0,
      borderWidth: 0,
    },
    // Confidence interval (lower bound)
    {
      label: '신뢰구간 하한',
      data: [
        ...Array(historicalValues.length - 1).fill(null),
        lastValue,
        lowerBound
      ],
      borderColor: 'transparent',
      pointRadius: 0,
      borderWidth: 0,
      fill: '-1', // Fill to previous dataset (upper bound)
      backgroundColor: color + '15',
    },
  ];

  const chartData = {
    labels: [...labels, targetDate],
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    height,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            if (context.raw === null) return '';
            const label = context.dataset.label || '';
            const value = context.raw;
            if (typeof value === 'number') {
              return `${label}: ${value.toLocaleString('ko-KR', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 0
              })}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value.toLocaleString('ko-KR');
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PredictionChart;
