import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useRefresh } from '../components/RefreshContext';
import { useVisitors } from '../components/VisitorContext';
import { useQuery, QueryFunction, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { startOfWeek, endOfWeek, format, subDays } from 'date-fns';
import VisitorChart from '../components/VisitorChart';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
};

// Enhanced color scheme with gradients and modern colors
const COLOR_MAP: Record<string, { bg: string; gradient: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  yellow: {
    bg: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-500',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
  green: {
    bg: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-600',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  gray: {
    bg: 'bg-gray-500',
    gradient: 'from-gray-500 to-gray-600',
    text: 'text-gray-600',
    border: 'border-gray-200'
  },
  red: {
    bg: 'bg-red-500',
    gradient: 'from-red-500 to-red-600',
    text: 'text-red-600',
    border: 'border-red-200'
  },
  purple: {
    bg: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  indigo: {
    bg: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  },
  emerald: {
    bg: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-600',
    border: 'border-emerald-200'
  },
  rose: {
    bg: 'bg-rose-500',
    gradient: 'from-rose-500 to-pink-600',
    text: 'text-rose-600',
    border: 'border-rose-200'
  }
};

interface Activity {
  id: string;
  type: string;
  message: string;
  details: string;
  time: string;
  time_display: string;
  icon: string;
  color: string;
}

interface ActivityApiResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Activity[];
}

interface EnhancedStat {
  label: string;
  value: number;
  icon: string;
  color: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

interface DashboardReport {
  totalVisitors: number;
  checkedInVisitors: number;
  checkedOutVisitors: number;
  noShowVisitors: number;
  pendingVisitors: number;
  totalVisitRequests: number;
  averageCheckInTime: string;
  peakHours: string;
  topEmployees: Array<{name: string, visitors: number}>;
  topPurposes: Array<{purpose: string, count: number}>;
  visitors: Array<any>;
}

const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { subscribeToRefresh } = useRefresh();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Time period state
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  // Get visitor context for notifications
  const { setVisitors: setContextVisitors } = useVisitors();

  // Get date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'today':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        };
      case 'week':
        return {
          startDate: startOfWeek(today, { weekStartsOn: 1 }),
          endDate: endOfWeek(today, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0)
        };
      default:
        return {
          startDate: startOfWeek(today, { weekStartsOn: 1 }),
          endDate: endOfWeek(today, { weekStartsOn: 1 })
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Enhanced stats query with time period
  const fetchEnhancedStats: QueryFunction<EnhancedStat[]> = async () => {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    
    const response = await axiosInstance.get('/api/dashboard-analytics/', {
      params: { 
        start_date: start,
        end_date: end
      }
    });
    
    const data: DashboardReport = response.data;
    
    return [
      {
        label: 'Total Visit Requests',
        value: data.totalVisitRequests,
        icon: 'ClipboardDocumentListIcon',
        color: 'blue',
        change: 12, // This would be calculated from previous period
        changeType: 'increase'
      },
      {
        label: 'Completed Visits',
        value: data.totalVisitors,
        icon: 'UserGroupIcon',
        color: 'green',
        change: 8,
        changeType: 'increase'
      },
      {
        label: 'Checked In',
        value: data.checkedInVisitors,
        icon: 'CheckCircleIcon',
        color: 'green',
        change: 5,
        changeType: 'increase'
      },
      {
        label: 'Checked Out',
        value: data.checkedOutVisitors,
        icon: 'ClockIcon',
        color: 'gray',
        change: 3,
        changeType: 'neutral'
      },
      {
        label: 'Pending Check-in',
        value: data.pendingVisitors,
        icon: 'ClockIcon',
        color: 'yellow',
        change: -2,
        changeType: 'decrease'
      },
      {
        label: 'No Shows',
        value: data.noShowVisitors,
        icon: 'XCircleIcon',
        color: 'red',
        change: 1,
        changeType: 'increase'
      }
    ];
  };

  const { data: enhancedStatsData, isLoading: enhancedStatsLoading, isError: enhancedStatsError, error: enhancedStatsErrorObj, refetch: refetchEnhancedStats } = useQuery<EnhancedStat[]>({
    queryKey: ['enhanced-stats', selectedPeriod, startDate, endDate],
    queryFn: fetchEnhancedStats,
    refetchOnWindowFocus: false, // Disable to prevent excessive refetching
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Limit retries
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Legacy stats for backward compatibility
  const fetchStats: QueryFunction<any[]> = async () => {
    const response = await axiosInstance.get('/api/dashboard-metrics/');
    return response.data;
  };

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErrorObj, refetch: refetchStats } = useQuery<any[]>({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000 * 60, // 1 minute
  });

  const fetchActivities: QueryFunction<ActivityApiResponse, readonly ['activities', number, number, string, string]> = async ({ queryKey }) => {
    const [_key, page, pageSize, startDate, endDate] = queryKey;
    
    const response = await axiosInstance.get('/api/recent-activities/', {
      params: { 
        page, 
        page_size: pageSize,
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  };

  const { data: activityData, isFetching, isError: activitiesError, error: activitiesErrorObj, refetch } = useQuery<ActivityApiResponse, Error, ActivityApiResponse, readonly ['activities', number, number, string, string]>({
    queryKey: ['activities', page, pageSize, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')] as const,
    queryFn: fetchActivities,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1000 * 60, // 1 minute
  });

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    await Promise.all([
      refetchEnhancedStats(),
      refetchStats(),
      refetch(),
      fetchVisitorsForNotifications()
    ]);
  }, [refetchEnhancedStats, refetchStats, refetch]);

  // Fetch visitors for notifications
  const fetchVisitorsForNotifications = async () => {
    try {
      const response = await axiosInstance.get('/api/my-visitors/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setContextVisitors(response.data);
    } catch (error) {
      console.error('Failed to fetch visitors for notifications:', error);
    }
  };

  // Handle period change
  const handlePeriodChange = (period: 'today' | 'week' | 'month') => {
    setSelectedPeriod(period);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Add polling with setInterval - reduced frequency to prevent performance issues
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refetch if not currently loading
      if (!enhancedStatsLoading) {
        refetchEnhancedStats();
      }
      if (!statsLoading) {
        refetchStats();
      }
      if (!isFetching) {
        refetch();
      }
      fetchVisitorsForNotifications();
    }, 60000); // 60 seconds instead of 30
    return () => clearInterval(interval);
  }, [refetchEnhancedStats, refetchStats, refetch, enhancedStatsLoading, statsLoading, isFetching]);

  // Update useEffect to refetch when page or pageSize changes
  useEffect(() => {
    refetch();
  }, [refetch, page, pageSize]);

  // Redirect to login on 401/403 error for stats
  useEffect(() => {
    const err = statsErrorObj as any;
    if (statsError && (err?.response?.status === 401 || err?.response?.status === 403)) {
      navigate('/login');
    }
  }, [statsError, statsErrorObj, navigate]);

  // Redirect to login on 401/403 error for activities
  useEffect(() => {
    const err = activitiesErrorObj as any;
    if (activitiesError && (err?.response?.status === 401 || err?.response?.status === 403)) {
      navigate('/login');
    }
  }, [activitiesError, activitiesErrorObj, navigate]);

  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  const quickActions = [
    {
      name: 'Create New Visit Request',
      description: 'Invite a visitor to your office',
      href: '/create-visit',
      icon: PlusIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'View All Requests',
      description: 'Manage and approve visit requests',
      href: '/visit-requests',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Generate Reports',
      description: 'View detailed analytics and reports',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const formatDateRange = () => {
    return selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">Welcome to GatePassPro - Your Visitor Management System</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={enhancedStatsLoading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 ${
                enhancedStatsLoading ? 'animate-pulse' : ''
              }`}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${enhancedStatsLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Enhanced Time Period Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Time Period</h3>
              </div>
              <div className="flex space-x-3">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-200">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{formatDateRange()}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enhancedStatsLoading ? (
            <div className="col-span-3 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600 font-medium">Loading enhanced metrics...</p>
              </div>
            </div>
          ) : enhancedStatsError ? (
            <div className="col-span-3 bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Could not load dashboard metrics</h3>
              <p className="text-red-600">Please check your connection or contact support.</p>
            </div>
          ) : (
            enhancedStatsData && enhancedStatsData.map((stat: EnhancedStat) => {
              const Icon = ICON_MAP[stat.icon] || ClipboardDocumentListIcon;
              const color = COLOR_MAP[stat.color] || COLOR_MAP.blue;
              return (
                <div key={stat.label} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex-shrink-0 rounded-xl p-3 bg-gradient-to-r ${color.gradient} shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      {stat.change !== undefined && (
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          stat.changeType === 'increase' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : stat.changeType === 'decrease'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {stat.changeType === 'increase' && (
                            <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                          )}
                          {stat.changeType === 'decrease' && (
                            <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {stat.change > 0 ? '+' : ''}{stat.change}%
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {stat.value.toLocaleString()}
                      </h3>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${color.gradient}`}></div>
                </div>
              );
            })
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
              <EyeIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg`}>
                      <action.icon className="h-8 w-8" />
                    </div>
                    <div className="text-gray-300 group-hover:text-blue-400 transition-colors">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-gray-600 font-medium leading-relaxed">{action.description}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Analytics Charts */}
        {enhancedStatsData && enhancedStatsData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <VisitorChart
                  data={enhancedStatsData.map(stat => ({
                    label: stat.label,
                    value: stat.value,
                    color: COLOR_MAP[stat.color]?.bg || 'bg-blue-500',
                    icon: stat.icon
                  }))}
                  title="Visitor Metrics Overview"
                  type="bar"
                  height={300}
                />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <VisitorChart
                  data={enhancedStatsData
                    .filter(stat => stat.value > 0)
                    .map(stat => ({
                      label: stat.label,
                      value: stat.value,
                      color: COLOR_MAP[stat.color]?.bg || 'bg-blue-500',
                      icon: stat.icon
                    }))}
                  title="Distribution by Status"
                  type="pie"
                  height={300}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flow-root">
              {isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading activities...</p>
                  </div>
                </div>
              ) : activityData && activityData.results && activityData.results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <ClockIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No recent activity</h3>
                  <p className="text-gray-500">Activities will appear here as they happen</p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {activityData && activityData.results && activityData.results.map((activity: Activity, index: number) => {
                    const Icon = ICON_MAP[activity.icon] || ClockIcon;
                    const color = COLOR_MAP[activity.color] || COLOR_MAP.blue;
                    
                    return (
                      <li key={activity.id} className="relative">
                        <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                          <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${color.gradient} shadow-lg`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                {activity.message}
                              </p>
                              <time className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                                {activity.time_display}
                              </time>
                            </div>
                            {activity.details && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {activity.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Pagination Controls */}
        {activityData && activityData.total_pages > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(activityData.total_pages, p + 1))}
                  disabled={page === activityData.total_pages}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Next
                </button>
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                  Page {page} of {activityData.total_pages}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <label htmlFor="page-size" className="text-sm font-medium text-gray-700">Show</label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-sm font-medium text-gray-700">per page</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 