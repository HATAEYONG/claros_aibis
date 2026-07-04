import React from 'react';
import { TrendUpIcon, TrendDownIcon, MinusIcon } from '@/components/icons/Icons';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  unit?: string;
  changeRate: number;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  unit = '',
  changeRate,
  trend,
  color,
  icon: Icon
}) => {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-600',
    red: 'from-red-500 to-rose-600'
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <TrendUpIcon size={16} className="text-green-600" />;
    } else if (trend === 'down') {
      return <TrendDownIcon size={16} className="text-red-600" />;
    }
    return <MinusIcon size={16} className="text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-medium">{title}</h3>
          <Icon size={24} className="text-white opacity-80" />
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-white text-3xl font-bold">{value}</p>
          {unit && <span className="text-white text-lg opacity-80">{unit}</span>}
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-2">{subtitle}</p>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`text-sm font-semibold ${getTrendColor()}`}>
            {changeRate > 0 ? '+' : ''}{changeRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default KPICard;