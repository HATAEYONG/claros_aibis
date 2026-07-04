import React, { useState, useEffect } from 'react';
import WidgetPanel from '@/components/dashboard/WidgetPanel';
import { useWidgets, Widget } from '@/context/WidgetContext';
import KPICard from '@/components/common/KPICard';
import ChartComponent from '@/components/common/ChartComponent';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import {
  DollarIcon,
  FactoryIcon,
  TargetIcon,
  PackageIcon,
  ActivityIcon,
  AlertIcon
} from '@/components/icons/Icons';
import api from '@/services/api';

interface DashboardData {
  sales: number;
  production: number;
  quality: number;
  inventory: number;
}

const DashboardV2: React.FC = () => {
  const { widgets } = useWidgets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    sales: 0,
    production: 0,
    quality: 0,
    inventory: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      setData({
        sales: 1520000000,
        production: 85234,
        quality: 99.2,
        inventory: 423000000
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    if (widget.type === 'kpi') {
      const kpiData: Record<string, { value: string | number; subtitle: string; icon: any; color: string }> = {
        'kpi-1': {
          value: (data.sales / 100000000).toFixed(1),
          subtitle: 'Target: 160B',
          icon: DollarIcon,
          color: 'blue'
        },
        'kpi-2': {
          value: data.production.toLocaleString(),
          subtitle: 'Target: 90000',
          icon: FactoryIcon,
          color: 'green'
        },
        'kpi-3': {
          value: data.quality.toFixed(1) + '%',
          subtitle: 'Target: 99%',
          icon: TargetIcon,
          color: 'purple'
        },
        'kpi-4': {
          value: (data.inventory / 100000000).toFixed(1),
          subtitle: 'Target: 40B',
          icon: PackageIcon,
          color: 'orange'
        }
      };

      const kpi = kpiData[widget.id] || kpiData['kpi-1'];

      return (
        <KPICard
          title={widget.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          changeRate={0}
          trend="up"
          color={kpi.color as any}
          icon={kpi.icon}
        />
      );
    }

    if (widget.type === 'chart') {
      const chartConfig: Record<string, { type: string; data: any; options?: any }> = {
        'chart-1': {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: 'Sales (B KRW)',
              data: [120, 135, 142, 138, 152, 148, 155, 162, 158, 170, 165, 175],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            }]
          }
        },
        'chart-2': {
          type: 'bar',
          data: {
            labels: ['W1', 'W2', 'W3', 'W4'],
            datasets: [{
              label: 'Production',
              data: [21000, 22500, 21800, 23200],
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
            }]
          }
        },
        'chart-3': {
          type: 'doughnut',
          data: {
            labels: ['Good', 'Defect'],
            datasets: [{
              data: [data.quality, 100 - data.quality],
              backgroundColor: ['#10b981', '#ef4444']
            }]
          }
        }
      };

      const config = chartConfig[widget.id] || chartConfig['chart-1'];

      return (
        <div className="h-full">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{widget.title}</h4>
          <ChartComponent
            type={config.type as any}
            data={config.data}
            options={config.options || {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: '#6b7280'
                  }
                }
              }
            }}
          />
        </div>
      );
    }

    if (widget.type === 'table') {
      return (
        <div className="h-full">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">{widget.title}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Item</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Actual</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Target</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Achieve</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200">Production</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{data.production.toLocaleString()}</td>
                  <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">90000</td>
                  <td className="text-right py-2 px-3 text-green-600 font-medium">94.7%</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200">Quality</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{data.quality}%</td>
                  <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">99%</td>
                  <td className="text-right py-2 px-3 text-green-600 font-medium">100.2%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200">Inventory</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{(data.inventory / 100000000).toFixed(1)}B</td>
                  <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">40B</td>
                  <td className="text-right py-2 px-3 text-yellow-600 font-medium">105.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <AlertIcon size={32} />
        <span className="ml-2">Unknown widget type: {widget.type}</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ActivityIcon size={32} />
          <h1 className="text-3xl font-bold">Customizable Dashboard</h1>
        </div>
        <p className="text-blue-100">Drag widgets to customize your layout</p>
      </div>

      <WidgetPanel renderWidget={renderWidget} />
    </div>
  );
};

export default DashboardV2;
