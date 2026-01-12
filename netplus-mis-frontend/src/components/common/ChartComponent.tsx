import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,  // ← 이 줄 추가
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Pie, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,  // ← 이 줄 추가
  RadialLinearScale
);

interface ChartComponentProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar';
  data: any;
  options?: any;
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, options, height = 300 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    ...options
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={defaultOptions} />;
      case 'bar':
        return <Bar data={data} options={defaultOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={defaultOptions} />;
      case 'pie':
        return <Pie data={data} options={defaultOptions} />;
      case 'radar':
        return <Radar data={data} options={defaultOptions} />;
      default:
        return <Line data={data} options={defaultOptions} />;
    }
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;