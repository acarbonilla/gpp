import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';
import { useVisitors } from '../components/VisitorContext';
import { 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  CalendarIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AnimatedCounter from '../components/AnimatedCounter';
import Tooltip from '../components/Tooltip';

interface MyVisitor {
  visit_id: number;
  visitor_name: string;
  visitor_email: string;
  employee_name: string;
  purpose: string;
  scheduled_time: string;
  is_checked_in: boolean;
  check_in_time: string | null;
  is_checked_out: boolean;
  check_out_time: string | null;
  status: string;
}

interface VisitorStats {
  totalVisitors: number;
  pendingVisitors: number;
  checkedInVisitors: number;
  checkedOutVisitors: number;
  todayVisitors: number;
}

const MyVisitorsDashboard: React.FC = () => {
  const [filteredVisitors, setFilteredVisitors] = useState<MyVisitor[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'checked-in' | 'checked-out'>('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Get visitor context for notifications
  const { setVisitors: setContextVisitors } = useVisitors();
  const queryClient = useQueryClient();

  const getAuthToken = () => localStorage.getItem('accessToken');

  // Fetch visitors with React Query
  const fetchVisitors = async (): Promise<MyVisitor[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login.');
    }
    const response = await axiosInstance.get('/api/my-visitors/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  };

  // React Query hook
  const {
    data: visitors = [],
    isLoading: visitorsLoading,
    isError: visitorsError,
    error: visitorsErrorObj,
    refetch: refetchVisitors
  } = useQuery<MyVisitor[]>({
    queryKey: ['my-visitors'],
    queryFn: fetchVisitors,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update context when data changes
  useEffect(() => {
    if (visitors) {
      setContextVisitors(visitors as any);
    }
  }, [visitors, setContextVisitors]);

  useEffect(() => {
    let filtered = visitors;

    // Apply filter
    switch (filter) {
      case 'today':
        filtered = visitors.filter(v => {
          const scheduledDate = new Date(v.scheduled_time);
          return scheduledDate >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        });
        break;
      case 'pending':
        filtered = visitors.filter(v => !v.is_checked_in && !v.is_checked_out);
        break;
      case 'checked-in':
        filtered = visitors.filter(v => v.is_checked_in && !v.is_checked_out);
        break;
      case 'checked-out':
        filtered = visitors.filter(v => v.is_checked_in && v.is_checked_out);
        break;
      default:
        filtered = visitors;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.visitor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVisitors(filtered);
    setPage(1); // Reset to first page when filter/search changes
  }, [visitors, filter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredVisitors.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVisitors = filteredVisitors.slice(startIndex, endIndex);

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString();
  };

  const formatDate = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString();
  };

  const getStatusBadge = (visitor: MyVisitor) => {
    if (visitor.is_checked_out) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Completed
        </span>
      );
    } else if (visitor.is_checked_in) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Checked In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
  };

  const quickActions = [
    {
      name: 'Create Visit Request',
      description: 'Invite a new visitor to your organization',
      href: '/create-visit',
      icon: PlusIcon,
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    },
    {
      name: 'View All Requests',
      description: 'See all your visit requests and their status',
      href: '/visit-requests',
      icon: UserGroupIcon,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600'
    }
  ];

  if (visitorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading your visitors...</p>
          <p className="mt-2 text-gray-500 text-sm">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Visitors
              </h1>
              <p className="mt-2 text-gray-600 text-lg">Track and manage the visitors you've invited</p>
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Real-time updates every 30 seconds
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={() => refetchVisitors()}
                disabled={visitorsLoading}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-lg ${
                  visitorsLoading ? 'animate-pulse' : ''
                }`}
              >
                <svg className={`h-5 w-5 mr-2 ${visitorsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {visitorsLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Error Display */}
        {visitorsError && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-6 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800">Connection Error</h3>
                <div className="mt-2 text-red-700">
                  {(visitorsErrorObj as any)?.response?.data?.error || 'Failed to fetch your visitors'}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => refetchVisitors()}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate flex items-center gap-1">
                      Total Visitors
                      <Tooltip text="Total number of visitors you've invited">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={visitors.length} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3 bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate flex items-center gap-1">
                      Pending
                      <Tooltip text="Visitors who haven't checked in yet">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={visitors.filter(v => !v.is_checked_in && !v.is_checked_out).length} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3 bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate flex items-center gap-1">
                      Checked In
                      <Tooltip text="Visitors currently in the building">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={visitors.filter(v => v.is_checked_in && !v.is_checked_out).length} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3 bg-gradient-to-r from-gray-500 to-slate-600 shadow-lg">
                  <XCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate flex items-center gap-1">
                      Checked Out
                      <Tooltip text="Visitors who have completed their visit">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={visitors.filter(v => v.is_checked_in && v.is_checked_out).length} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-xl p-3 bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate flex items-center gap-1">
                      Today
                      <Tooltip text="Visitors scheduled for today">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter value={visitors.filter(v => {
                        const scheduledDate = new Date(v.scheduled_time);
                        return scheduledDate >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                      }).length} />
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/30 hover:border-white/50"
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl ${action.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {action.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-gray-300 group-hover:text-blue-400 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Filter Tabs and Visitor List */}
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 lg:mb-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-white" />
                </div>
                Your Visitors ({filteredVisitors.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                  { key: 'today', label: 'Today', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                  { key: 'checked-in', label: 'Checked In', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                  { key: 'checked-out', label: 'Checked Out', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      filter === tab.key
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : tab.color
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Enhanced Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by visitor name, email, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {paginatedVisitors.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No visitors found' : 'No visitors found'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? `No visitors match "${searchTerm}". Try a different search term.`
                    : filter === 'all' 
                      ? "You haven't invited any visitors yet. Start by creating your first visit request."
                      : `No ${filter.replace('-', ' ')} visitors found.`
                  }
                </p>
                {filter === 'all' && !searchTerm && (
                  <Link
                    to="/create-visit"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Invite Your First Visitor
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedVisitors.map((visitor) => (
                  <div key={visitor.visit_id} className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-white/30 hover:border-white/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {visitor.visitor_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-semibold text-gray-900 truncate mb-2">
                              {visitor.visitor_name}
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="truncate">{visitor.visitor_email}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{visitor.purpose}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span>
                                  {formatDate(visitor.scheduled_time)} at {new Date(visitor.scheduled_time).toLocaleTimeString()}
                                </span>
                              </div>
                              {visitor.is_checked_in && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>
                                    Checked in: {visitor.check_in_time ? formatDateTime(visitor.check_in_time) : ''}
                                    {visitor.is_checked_out && (
                                      <> | Checked out: {visitor.check_out_time ? formatDateTime(visitor.check_out_time) : ''}</>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        {getStatusBadge(visitor)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Enhanced Pagination Controls */}
            {filteredVisitors.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">
                    of {filteredVisitors.length} visitors
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-700 bg-white/50 backdrop-blur-sm border border-gray-200 hover:bg-white/70'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyVisitorsDashboard; 