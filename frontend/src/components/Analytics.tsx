import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

interface AnalyticsProps {
  visitors: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({ visitors }) => {
  // Calculate hourly distribution
  const getHourlyDistribution = () => {
    const hourlyData = new Array(24).fill(0);
    visitors.forEach(visitor => {
      const hour = new Date(visitor.scheduled_time).getHours();
      hourlyData[hour]++;
    });
    return hourlyData;
  };

  // Calculate check-in rate
  const getCheckInRate = () => {
    const approvedVisitors = visitors.filter(v => v.status === 'approved');
    const checkedInVisitors = approvedVisitors.filter(v => v.is_checked_in);
    return approvedVisitors.length > 0 ? (checkedInVisitors.length / approvedVisitors.length * 100).toFixed(1) : '0';
  };

  // Calculate average check-in time
  const getAverageCheckInTime = () => {
    const checkedInVisitors = visitors.filter(v => v.is_checked_in && v.check_in_time);
    if (checkedInVisitors.length === 0) return 'N/A';
    
    const totalMinutes = checkedInVisitors.reduce((total, visitor) => {
      const scheduled = new Date(visitor.scheduled_time);
      const checkedIn = new Date(visitor.check_in_time);
      const diffMinutes = (checkedIn.getTime() - scheduled.getTime()) / (1000 * 60);
      return total + Math.max(0, diffMinutes); // Only count late arrivals
    }, 0);
    
    const averageMinutes = totalMinutes / checkedInVisitors.length;
    return averageMinutes < 1 ? 'On time' : `${averageMinutes.toFixed(1)} min late`;
  };

  // Get peak hours
  const getPeakHours = () => {
    const hourlyData = getHourlyDistribution();
    const maxVisitors = Math.max(...hourlyData);
    const peakHours = hourlyData
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count === maxVisitors && item.count > 0)
      .map(item => `${item.hour}:00`);
    
    return peakHours.length > 0 ? peakHours.join(', ') : 'No data';
  };

  // Calculate visitor status distribution for pie chart
  const getStatusDistribution = () => {
    const distribution = {
      approved: visitors.filter(v => v.status === 'approved' && !v.is_checked_in).length,
      checkedIn: visitors.filter(v => v.is_checked_in && !v.is_checked_out).length,
      checkedOut: visitors.filter(v => v.is_checked_out).length,
      noShow: visitors.filter(v => v.status === 'no_show').length,
      pending: visitors.filter(v => v.status === 'pending').length
    };

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return [];

    const colors = {
      approved: '#3B82F6', // blue
      checkedIn: '#10B981', // green
      checkedOut: '#6B7280', // gray
      noShow: '#F59E0B', // orange
      pending: '#8B5CF6' // purple
    };

    let currentAngle = 0;
    return Object.entries(distribution).map(([status, count]) => {
      const percentage = (count / total) * 100;
      const startAngle = currentAngle;
      currentAngle += (percentage / 100) * 360;
      
      return {
        status,
        count,
        percentage: percentage.toFixed(1),
        color: colors[status as keyof typeof colors],
        startAngle,
        endAngle: currentAngle
      };
    }).filter(item => item.count > 0);
  };

  const hourlyData = getHourlyDistribution();
  const maxHourlyVisitors = Math.max(...hourlyData);
  const statusData = getStatusDistribution();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Analytics Overview</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
            <span className="ml-2 text-sm font-medium text-blue-900">Check-in Rate</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{getCheckInRate()}%</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-green-600" />
            <span className="ml-2 text-sm font-medium text-green-900">Avg. Arrival Time</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">{getAverageCheckInTime()}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-purple-600" />
            <span className="ml-2 text-sm font-medium text-purple-900">Peak Hours</span>
          </div>
          <p className="text-lg font-bold text-purple-900 mt-1">{getPeakHours()}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-orange-600" />
            <span className="ml-2 text-sm font-medium text-orange-900">Total Today</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mt-1">{visitors.length}</p>
        </div>
      </div>

      {/* Pie Chart and Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Visitor Status Pie Chart */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Visitor Status Distribution</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {statusData.length === 0 ? (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No data</span>
                </div>
              ) : (
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {statusData.map((item, index) => {
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const startAngleRad = (item.startAngle * Math.PI) / 180;
                    const endAngleRad = (item.endAngle * Math.PI) / 180;
                    
                    const x1 = 50 + radius * Math.cos(startAngleRad);
                    const y1 = 50 + radius * Math.sin(startAngleRad);
                    const x2 = 50 + radius * Math.cos(endAngleRad);
                    const y2 = 50 + radius * Math.sin(endAngleRad);
                    
                    const largeArcFlag = item.endAngle - item.startAngle > 180 ? 1 : 0;
                    
                    const pathData = [
                      `M ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'L 50 50'
                    ].join(' ');
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="capitalize text-gray-700">
                    {item.status.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Hourly Visitor Distribution</h3>
          <div className="space-y-2">
            {hourlyData.map((count, hour) => (
              <div key={hour} className="flex items-center">
                <span className="w-12 text-sm text-gray-600">{hour.toString().padStart(2, '0')}:00</span>
                <div className="flex-1 ml-4">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: maxHourlyVisitors > 0 ? `${(count / maxHourlyVisitors) * 100}%` : '0%'
                      }}
                    />
                  </div>
                </div>
                <span className="ml-2 text-sm text-gray-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-md font-medium text-gray-900 mb-2">Today's Insights</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• {visitors.filter(v => v.is_checked_in).length} visitors have checked in</li>
          <li>• {visitors.filter(v => v.status === 'no_show').length} visitors marked as no-show</li>
          <li>• {visitors.filter(v => !v.is_checked_in && v.status === 'approved').length} visitors pending check-in</li>
          <li>• Peak activity: {getPeakHours()}</li>
        </ul>
      </div>
    </div>
  );
};

export default Analytics; 