import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface MyVisitor {
  visit_id: number;
  visitor_name: string;
  visitor_email: string;
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
  const [visitors, setVisitors] = useState<MyVisitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<MyVisitor[]>([]);
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    pendingVisitors: 0,
    checkedInVisitors: 0,
    checkedOutVisitors: 0,
    todayVisitors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'checked-in' | 'checked-out'>('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthToken = () => localStorage.getItem('accessToken');

  const fetchVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }
      const response = await axiosInstance.get('/api/my-visitors/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setVisitors(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch your visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(); // initial fetch

    const interval = setInterval(() => {
      fetchVisitors(); // fetch every 30 seconds
    }, 30000); // 30,000 ms = 30 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  useEffect(() => {
    // Sort by scheduled_time, newest first
    let filtered = [...visitors].sort((a, b) => 
      new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
    );
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const totalVisitors = visitors.length;
    const pendingVisitors = visitors.filter(v => !v.is_checked_in && !v.is_checked_out).length;
    const checkedInVisitors = visitors.filter(v => v.is_checked_in && !v.is_checked_out).length;
    const checkedOutVisitors = visitors.filter(v => v.is_checked_in && v.is_checked_out).length;
    const todayVisitors = visitors.filter(v => {
      const scheduledDate = new Date(v.scheduled_time);
      return scheduledDate >= today;
    }).length;

    setStats({
      totalVisitors,
      pendingVisitors,
      checkedInVisitors,
      checkedOutVisitors,
      todayVisitors
    });

    // Apply filter
    switch (filter) {
      case 'today':
        filtered = filtered.filter(v => {
          const scheduledDate = new Date(v.scheduled_time);
          return scheduledDate >= today;
        });
        break;
      case 'pending':
        filtered = filtered.filter(v => !v.is_checked_in && !v.is_checked_out);
        break;
      case 'checked-in':
        filtered = filtered.filter(v => v.is_checked_in && !v.is_checked_out);
        break;
      case 'checked-out':
        filtered = filtered.filter(v => v.is_checked_in && v.is_checked_out);
        break;
      default:
        // already sorted
        break;
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(visitor => 
        visitor.visitor_name.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredVisitors(filtered);
    // Reset to first page when filter or search changes
    setPage(1);
  }, [visitors, filter, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredVisitors.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVisitors = filteredVisitors.slice(startIndex, endIndex);

  const formatDateTime = (dateTimeString: string | null) => {
    return dateTimeString ? new Date(dateTimeString).toLocaleString() : '';
  };

  const formatDate = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString();
  };

  const getStatusBadge = (visitor: MyVisitor) => {
    if (!visitor.is_checked_in && !visitor.is_checked_out) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    } else if (visitor.is_checked_in && !visitor.is_checked_out) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Checked In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Checked Out
        </span>
      );
    }
  };

  const quickActions = [
    {
      name: 'Invite New Visitor',
      description: 'Create a new visit request',
      href: '/create-visit',
      icon: PlusIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'View All Requests',
      description: 'Manage your visit requests',
      href: '/visit-requests',
      icon: UserGroupIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your visitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Visitors</h1>
          <p className="mt-2 text-gray-600">Track and manage the visitors you've invited</p>
        </div>
        <button
          onClick={fetchVisitors}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Visitors</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalVisitors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-yellow-500">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingVisitors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Checked In</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.checkedInVisitors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-gray-500">
                <XCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Checked Out</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.checkedOutVisitors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-purple-500">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todayVisitors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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

      {/* Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Visitors ({filteredVisitors.length})
            </h3>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'pending', label: 'Pending' },
                { key: 'checked-in', label: 'Checked In' },
                { key: 'checked-out', label: 'Checked Out' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by visitor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {paginatedVisitors.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No visitors found' : 'No visitors found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `No visitors match "${searchTerm}". Try a different search term.`
                  : filter === 'all' 
                    ? "You haven't invited any visitors yet."
                    : `No ${filter.replace('-', ' ')} visitors found.`
                }
              </p>
              {filter === 'all' && !searchTerm && (
                <div className="mt-6">
                  <Link
                    to="/create-visit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Invite Your First Visitor
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {paginatedVisitors.map((visitor) => (
                  <li key={visitor.visit_id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {visitor.visitor_name}
                            </h4>
                            <div className="flex items-center mt-1">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <p className="text-sm text-gray-500">{visitor.visitor_email}</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Purpose: {visitor.purpose}</p>
                            <div className="flex items-center mt-1">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <p className="text-sm text-gray-500">
                                Scheduled: {formatDate(visitor.scheduled_time)} at {new Date(visitor.scheduled_time).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(visitor)}
                            {visitor.is_checked_in && (
                              <div className="text-xs text-gray-500 mt-1">
                                In: {visitor.check_in_time ? formatDateTime(visitor.check_in_time) : ''}
                                {visitor.is_checked_out && (
                                  <> | Out: {visitor.check_out_time ? formatDateTime(visitor.check_out_time) : ''}</>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredVisitors.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1); // Reset to first page when changing page size
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">
                  of {filteredVisitors.length} visitors
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVisitorsDashboard; 