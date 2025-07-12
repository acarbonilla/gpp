import React from 'react';
import { ChartBarIcon, UserGroupIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ChartData {
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface VisitorChartProps {
  data: ChartData[];
  title: string;
  type?: 'bar' | 'pie' | 'line';
  height?: number;
}

const VisitorChart: React.FC<VisitorChartProps> = ({ 
  data, 
  title, 
  type = 'bar', 
  height = 200 
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      UserGroupIcon,
      ClockIcon,
      CheckCircleIcon,
      ChartBarIcon,
    };
    return iconMap[iconName] || ChartBarIcon;
  };

  if (type === 'bar') {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4" style={{ height: `${height}px` }}>
          {data.map((item, index) => {
            const Icon = getIcon(item.icon);
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.label}</span>
                    <span className="text-gray-900 font-medium">{item.value}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => {
            const Icon = getIcon(item.icon);
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="text-center text-gray-500">
        <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Chart type not implemented yet</p>
      </div>
    </div>
  );
};

export default VisitorChart; 