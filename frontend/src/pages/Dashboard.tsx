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
  XCircleIcon
} from '@heroicons/react/24/outline';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  gray: 'bg-gray-500',
  red: 'bg-red-500',
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

const Dashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { subscribeToRefresh } = useRefresh();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get visitor context for notifications
  const { setVisitors: setContextVisitors } = useVisitors();

  interface Stat {
    label: string;
    value: number;
    icon: string;
    color: string;
  }

  const fetchStats: QueryFunction<Stat[]> = async () => {
    const response = await axiosInstance.get('/api/dashboard-metrics/');
    return response.data;
  };

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErrorObj, refetch: refetchStats } = useQuery<Stat[]>({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000 * 60, // 1 minute
  });

  const fetchActivities: QueryFunction<ActivityApiResponse, readonly ['activities', number, number]> = async ({ queryKey }) => {
    const [_key, page, pageSize] = queryKey;
    const response = await axiosInstance.get('/api/recent-activities/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  };

  const { data: activityData, isFetching, isError: activitiesError, error: activitiesErrorObj, refetch } = useQuery<ActivityApiResponse, Error, ActivityApiResponse, readonly ['activities', number, number]>({
    queryKey: ['activities', page, pageSize] as const,
    queryFn: fetchActivities,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000 * 60, // 1 minute
  });

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    await Promise.all([
      refetchStats(),
      refetch(),
      fetchVisitorsForNotifications()
    ]);
  }, [refetchStats, refetch]);

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

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Add polling with setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetch();
      fetchVisitorsForNotifications();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [refetchStats, refetch]);

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
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to GatePassPro - Your Visitor Management System</p>
          {/* lastUpdated state removed */}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={false} // refreshing state removed
          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            false ? 'animate-spin' : '' // refreshing state removed
          }`}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${false ? 'animate-spin' : ''}`} /> {/* refreshing state removed */}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statsLoading ? (
          <div className="col-span-3 text-center py-8 text-gray-400">Loading...</div>
        ) : statsError ? (
          <div className="col-span-3 text-center py-8 text-red-500 font-semibold">Could not load dashboard metrics. Please check your connection or contact support.</div>
        ) : (
          statsData && (statsData as Stat[]).map((stat: Stat) => {
            const Icon = ICON_MAP[stat.icon] || ClipboardDocumentListIcon;
            const color = COLOR_MAP[stat.color] || 'bg-blue-500';
            return (
              <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`inline-flex p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{action.description}</p>
              </div>
              <span className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-4">
            <div className="flow-root">
              {isFetching ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : activityData && activityData.results && activityData.results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <ul className="-mb-8">
                  {activityData && activityData.results && activityData.results.map((activity: Activity, index: number) => {
                    const Icon = ICON_MAP[activity.icon] || ClockIcon;
                    const color = COLOR_MAP[activity.color] || 'bg-blue-500';
                    const isLast = index === activityData.results.length - 1;
                    
                    return (
                      <li key={activity.id} className={`relative ${!isLast ? 'pb-8' : ''}`}>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full ${color} flex items-center justify-center ring-8 ring-white`}>
                              <Icon className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.message}
                              </p>
                              {activity.details && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {activity.details}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{activity.time_display}</time>
                            </div>
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
      </div>

      {/* Pagination Controls */}
      {activityData && activityData.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 mr-2"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(activityData.total_pages, p + 1))}
              disabled={page === activityData.total_pages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
            <span className="ml-4 text-sm text-gray-500">
              Page {page} of {activityData.total_pages}
            </span>
          </div>
          <div>
            <label htmlFor="page-size" className="mr-2 text-sm text-gray-500">Show</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2 text-sm text-gray-500">per page</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 