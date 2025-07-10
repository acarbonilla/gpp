import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useVisitors } from '../components/VisitorContext';
import { 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Tooltip from '../components/Tooltip';
import AnimatedCounter from '../components/AnimatedCounter';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import Analytics from '../components/Analytics';
import ThemeToggle from '../components/ThemeToggle';
import ExportReports from '../components/ExportReports';
import BulkActions from '../components/BulkActions';
import TouchOptimizedCard from '../components/TouchOptimizedCard';
import dayjs from 'dayjs';

interface DashboardStats {
  totalVisitors: number;
  checkedInVisitors: number;
  checkedOutVisitors: number;
  pendingCheckIns: number;
  noShowVisitors: number;
}



const LobbyAttendantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    checkedInVisitors: 0,
    checkedOutVisitors: 0,
    pendingCheckIns: 0,
    noShowVisitors: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingNoShow, setMarkingNoShow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredVisitors, setFilteredVisitors] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [visitorsPerPage, setVisitorsPerPage] = useState(10);
  const [paginatedVisitors, setPaginatedVisitors] = useState<any[]>([]);
  
  const { visitors, setVisitors: setContextVisitors } = useVisitors();

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const markAsNoShow = async (visitId: number) => {
    try {
      setMarkingNoShow(visitId);
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      await axiosInstance.post(`/api/visit-requests/${visitId}/no-show/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh dashboard data to update stats and activity
      await fetchDashboardData();
      
      alert('Visitor marked as no show successfully!');
    } catch (err: any) {
      console.error('Error marking visitor as no show:', err);
      alert(err.response?.data?.error || 'Failed to mark visitor as no show');
    } finally {
      setMarkingNoShow(null);
    }
  };

  const handleBulkNoShow = async (visitIds: number[]) => {
    try {
      setMarkingNoShow(-1); // Special value for bulk operation
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      // Process each visitor
      for (const visitId of visitIds) {
        await axiosInstance.post(`/api/visit-requests/${visitId}/no-show/`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Refresh dashboard data
      await fetchDashboardData();
      alert(`Successfully marked ${visitIds.length} visitors as no show!`);
    } catch (err: any) {
      console.error('Error in bulk no-show operation:', err);
      alert(err.response?.data?.error || 'Failed to mark visitors as no show');
    } finally {
      setMarkingNoShow(null);
    }
  };

  const handleBulkCheckIn = async (visitIds: number[]) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      // Process each visitor
      for (const visitId of visitIds) {
        await axiosInstance.post(`/api/visit-requests/${visitId}/check-in/`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Refresh dashboard data
      await fetchDashboardData();
      alert(`Successfully checked in ${visitIds.length} visitors!`);
    } catch (err: any) {
      console.error('Error in bulk check-in operation:', err);
      alert(err.response?.data?.error || 'Failed to check in visitors');
    }
  };

  const handleBulkCheckOut = async (visitIds: number[]) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      // Process each visitor
      for (const visitId of visitIds) {
        await axiosInstance.post(`/api/visit-requests/${visitId}/check-out/`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Refresh dashboard data
      await fetchDashboardData();
      alert(`Successfully checked out ${visitIds.length} visitors!`);
    } catch (err: any) {
      console.error('Error in bulk check-out operation:', err);
      alert(err.response?.data?.error || 'Failed to check out visitors');
    }
  };

  const shouldShowNoShowButton = (visitor: any) => {
    // Always compare in UTC
    const nowUTC = new Date();
    const scheduledUTC = new Date(visitor.scheduled_time);
    const timeDiff = nowUTC.getTime() - scheduledUTC.getTime();
    const minutesLate = timeDiff / (1000 * 60);

    return !visitor.is_checked_in &&
           visitor.status === 'approved' &&
           minutesLate >= 15;
  };

  // Pagination functions
  const getTotalPages = () => {
    return Math.ceil(filteredVisitors.length / visitorsPerPage);
  };

  const getPaginatedVisitors = () => {
    const startIndex = (currentPage - 1) * visitorsPerPage;
    const endIndex = startIndex + visitorsPerPage;
    return filteredVisitors.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setVisitorsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(getTotalPages());
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      // Fetch today's visitors for stats
      const visitorsResponse = await axiosInstance.get('/api/lobby/today-visitors/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const approvedVisitors = visitorsResponse.data;

      // Calculate stats
      const totalVisitors = approvedVisitors.length;
      const checkedInVisitors = approvedVisitors.filter((v: any) => v.is_checked_in).length;
      const checkedOutVisitors = approvedVisitors.filter((v: any) => v.is_checked_out).length;
      const pendingCheckIns = approvedVisitors.filter((v: any) => !v.is_checked_in && v.status === 'approved').length;
      const noShowVisitors = approvedVisitors.filter((v: any) => v.status === 'no_show').length;

      setStats({
        totalVisitors,
        checkedInVisitors,
        checkedOutVisitors,
        pendingCheckIns,
        noShowVisitors
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all today's visits for dashboard stats
  const fetchAllTodayVisits = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }
      const response = await axiosInstance.get('/api/lobby/today-all-visits/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setContextVisitors(response.data);
      console.log('Dashboard visitors:', response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard visits');
    } finally {
      setLoading(false);
    }
  };

  const downloadTodaysVisitorsCSV = async () => {
    setDownloading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      // Filter visitors for today only
      const todaysVisitors = visitors.filter(v => dayjs(v.scheduled_time).format('YYYY-MM-DD') === today);
      // Prepare CSV data
      const headers = [
        'Visitor Name',
        'Employee Name',
        'Purpose',
        'Scheduled Time',
        'Check-in Time',
        'Check-out Time',
        'Status',
        'Notes'
      ];
      const csvData = todaysVisitors.map(visitor => [
        visitor.visitor_name || '',
        visitor.employee_name || '',
        visitor.purpose || '',
        dayjs(visitor.scheduled_time).format('YYYY-MM-DD HH:mm'),
        visitor.check_in_time ? dayjs(visitor.check_in_time).format('YYYY-MM-DD HH:mm') : '',
        visitor.check_out_time ? dayjs(visitor.check_out_time).format('YYYY-MM-DD HH:mm') : '',
        visitor.is_checked_in && !visitor.is_checked_out ? 'Checked In' :
        visitor.is_checked_out ? 'Checked Out' :
        visitor.status === 'no_show' ? 'No Show' : 'Pending',
        visitor.notes || ''
      ]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `todays_visitors_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Failed to generate CSV.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    // Calculate stats from all visitors
    const totalVisitors = visitors.length;
    const checkedInVisitors = visitors.filter(v => v.is_checked_in).length;
    const checkedOutVisitors = visitors.filter(v => v.is_checked_out).length;
    const pendingCheckIns = visitors.filter(v => !v.is_checked_in && v.status === 'approved').length;
    const noShowVisitors = visitors.filter(v => v.status === 'no_show').length;

    setStats({
      totalVisitors,
      checkedInVisitors,
      checkedOutVisitors,
      pendingCheckIns,
      noShowVisitors
    });

    // Apply search and filter
    let filtered = visitors;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(visitor => 
        visitor.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'checked-in':
          filtered = filtered.filter(v => v.is_checked_in && !v.is_checked_out);
          break;
        case 'checked-out':
          filtered = filtered.filter(v => v.is_checked_out);
          break;
        case 'pending':
          filtered = filtered.filter(v => !v.is_checked_in && v.status === 'approved');
          break;
        case 'no-show':
          filtered = filtered.filter(v => v.status === 'no_show');
          break;
        case 'approved':
          filtered = filtered.filter(v => v.status === 'approved');
          break;
      }
    }
    
    setFilteredVisitors(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [visitors, searchTerm, statusFilter]);

  // Update paginated visitors when filtered visitors change
  useEffect(() => {
    setPaginatedVisitors(getPaginatedVisitors());
  }, [filteredVisitors, currentPage, visitorsPerPage]);

  useEffect(() => {
    fetchAllTodayVisits();
    const interval = setInterval(fetchAllTodayVisits, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      name: 'Manage Today\'s Visitors',
      description: 'View and manage visitor check-ins and check-outs',
      href: '/lobby',
      icon: UserGroupIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Create Walk-In Visit',
      description: 'Register an unexpected visitor',
      href: '/walkin',
      icon: PlusIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const totalPages = getTotalPages();
  const startIndex = (currentPage - 1) * visitorsPerPage + 1;
  const endIndex = Math.min(currentPage * visitorsPerPage, filteredVisitors.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lobby Attendant Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome! Manage visitor flow and check-ins for today</p>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={downloadTodaysVisitorsCSV}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 border border-blue-500 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download Today\'s Visitors (CSV)'}
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-blue-100 border-b-4 border-blue-500 rounded-lg shadow flex items-center p-5">
          <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-blue-900 truncate flex items-center gap-1">
                Total Visitors
                <Tooltip text="Total number of visitors scheduled for today">
                  <InformationCircleIcon className="h-4 w-4 text-blue-600 cursor-help" title="Total number of visitors scheduled for today" />
                </Tooltip>
              </dt>
              <dd className="text-2xl font-bold text-blue-900">
                <AnimatedCounter value={stats.totalVisitors} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-green-100 border-b-4 border-green-500 rounded-lg shadow flex items-center p-5">
          <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-green-900 truncate flex items-center gap-1">
                Checked In
                <Tooltip text="Visitors who have checked in and are currently in the building">
                  <InformationCircleIcon className="h-4 w-4 text-green-600 cursor-help" title="Visitors who have checked in and are currently in the building" />
                </Tooltip>
              </dt>
              <dd className="text-2xl font-bold text-green-900">
                <AnimatedCounter value={stats.checkedInVisitors} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-yellow-100 border-b-4 border-yellow-500 rounded-lg shadow flex items-center p-5">
          <div className="flex-shrink-0 rounded-md p-3 bg-yellow-500">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-yellow-900 truncate flex items-center gap-1">
                Pending
                <Tooltip text="Visitors who are approved but haven't checked in yet">
                  <InformationCircleIcon className="h-4 w-4 text-yellow-600 cursor-help" title="Visitors who are approved but haven't checked in yet" />
                </Tooltip>
              </dt>
              <dd className="text-2xl font-bold text-yellow-900">
                <AnimatedCounter value={stats.pendingCheckIns} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-gray-100 border-b-4 border-gray-500 rounded-lg shadow flex items-center p-5">
          <div className="flex-shrink-0 rounded-md p-3 bg-gray-500">
            <XCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                Checked Out
                <Tooltip text="Visitors who have completed their visit and left the building">
                  <InformationCircleIcon className="h-4 w-4 text-gray-600 cursor-help" title="Visitors who have completed their visit and left the building" />
                </Tooltip>
              </dt>
              <dd className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={stats.checkedOutVisitors} />
              </dd>
            </dl>
          </div>
        </div>

        <div className="bg-orange-100 border-b-4 border-orange-500 rounded-lg shadow flex items-center p-5">
          <div className="flex-shrink-0 rounded-md p-3 bg-orange-500">
            <ExclamationTriangleIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-orange-900 truncate flex items-center gap-1">
                No Show
                <Tooltip text="Visitors who did not arrive for their scheduled visit (15+ min late)">
                  <InformationCircleIcon className="h-4 w-4 text-orange-600 cursor-help" title="Visitors who did not arrive for their scheduled visit (15+ min late)" />
                </Tooltip>
              </dt>
              <dd className="text-2xl font-bold text-orange-900">
                <AnimatedCounter value={stats.noShowVisitors} />
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {showAnalytics && <Analytics visitors={visitors} />}

      {/* Export Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Reports & Export</h2>
        </div>
        <ExportReports visitors={visitors} stats={stats} />
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
                <h3 className="mt-4 text-base font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Today's Visitors</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showBulkActions ? 'Hide Bulk Actions' : 'Show Bulk Actions'}
            </button>
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
              placeholder="Search visitors, employees, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({visitors.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Approved ({visitors.filter(v => v.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('checked-in')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'checked-in'
                ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Checked In ({visitors.filter(v => v.is_checked_in && !v.is_checked_out).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending ({visitors.filter(v => !v.is_checked_in && v.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('checked-out')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'checked-out'
                ? 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-600 dark:text-gray-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Checked Out ({visitors.filter(v => v.is_checked_out).length})
          </button>
          <button
            onClick={() => setStatusFilter('no-show')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'no-show'
                ? 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900 dark:text-orange-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            No Show ({visitors.filter(v => v.status === 'no_show').length})
          </button>
        </div>

        {/* Visitors List */}
        {showBulkActions ? (
          <BulkActions
            visitors={paginatedVisitors}
            onBulkNoShow={handleBulkNoShow}
            onBulkCheckIn={handleBulkCheckIn}
            onBulkCheckOut={handleBulkCheckOut}
            markingNoShow={markingNoShow}
          />
        ) : (
          <div className="space-y-3">
            {paginatedVisitors.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'No visitors found matching your criteria.' : 'No visitors for today.'}
              </div>
            ) : (
              paginatedVisitors.map((visitor) => (
                <TouchOptimizedCard
                  key={visitor.visit_id}
                  visitor={visitor}
                  onNoShow={markAsNoShow}
                  onCheckIn={handleBulkCheckIn ? () => handleBulkCheckIn([visitor.visit_id]) : undefined}
                  onCheckOut={handleBulkCheckOut ? () => handleBulkCheckOut([visitor.visit_id]) : undefined}
                  markingNoShow={markingNoShow}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredVisitors.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <span>
                Showing {startIndex} to {endIndex} of {filteredVisitors.length} visitors
              </span>
              <span className="text-gray-400">|</span>
              <label htmlFor="page-size" className="flex items-center space-x-1">
                <span>Show</span>
                <select
                  id="page-size"
                  value={visitorsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              {/* First Page */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <ChevronLeftIcon className="h-4 w-4 -ml-1" />
              </button>

              {/* Previous Page */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

                             {/* Page Numbers */}
               <div className="flex items-center space-x-1">
                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                   let pageNum: number;
                   if (totalPages <= 5) {
                     pageNum = i + 1;
                   } else if (currentPage <= 3) {
                     pageNum = i + 1;
                   } else if (currentPage >= totalPages - 2) {
                     pageNum = totalPages - 4 + i;
                   } else {
                     pageNum = currentPage - 2 + i;
                   }

                   return (
                     <button
                       key={pageNum}
                       onClick={() => handlePageChange(pageNum)}
                       className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                         currentPage === pageNum
                           ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                           : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600'
                       }`}
                     >
                       {pageNum}
                     </button>
                   );
                 })}
               </div>

              {/* Next Page */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ChevronRightIcon className="h-4 w-4" />
                <ChevronRightIcon className="h-4 w-4 -ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyAttendantDashboard; 