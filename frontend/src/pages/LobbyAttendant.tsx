import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../components/RefreshContext';
import { useVisitors } from '../components/VisitorContext';
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Visitor {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_email: string;
  employee_name: string; // Changed from host_name to match context
  purpose?: string;
  scheduled_time: string;
  visit_type: string;
  is_checked_in: boolean;
  check_in_time?: string;
  is_checked_out: boolean;
  check_out_time?: string;
  status: string;
  notes?: string;
  updated_at?: string;
}

const LobbyAttendant: React.FC = () => {
  const navigate = useNavigate();
  const { refreshDashboard } = useRefresh();
  const { setVisitors: setContextVisitors } = useVisitors();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for marking no show
  const [markingNoShow, setMarkingNoShow] = useState<number | null>(null);

  // Add status filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // State for manual operations
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Fetch today's visitors with React Query
  const fetchTodayVisitors = async (): Promise<Visitor[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login.');
    }

    const response = await axiosInstance.get('/api/lobby/today-visitors/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  };

  // Fetch all visits for notifications with React Query
  const fetchAllVisitsForNotifications = async (): Promise<Visitor[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login.');
    }
    
    const response = await axiosInstance.get('/api/lobby/today-all-visits/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Sort visitors by most recent date and time
    const sortedVisitors = response.data.sort((a: Visitor, b: Visitor) => {
      const dateA = new Date(a.scheduled_time);
      const dateB = new Date(b.scheduled_time);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
    
    return sortedVisitors;
  };

  // React Query hooks
  const {
    data: visitorsData,
    isLoading: visitorsLoading,
    isError: visitorsError,
    error: visitorsErrorObj,
    refetch: refetchVisitors
  } = useQuery<Visitor[]>({
    queryKey: ['lobby-today-visitors'],
    queryFn: fetchTodayVisitors,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const {
    data: allVisitsData,
    refetch: refetchAllVisits
  } = useQuery<Visitor[]>({
    queryKey: ['lobby-all-visits'],
    queryFn: fetchAllVisitsForNotifications,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Update context when data changes
  useEffect(() => {
    if (visitorsData) {
      setContextVisitors(visitorsData as any);
    }
  }, [visitorsData, setContextVisitors]);

  useEffect(() => {
    if (allVisitsData) {
      setContextVisitors(allVisitsData as any);
    }
  }, [allVisitsData, setContextVisitors]);

  // Check in a visitor
  const checkInVisitor = async (visitorId: number) => {
    try {
      setCheckingIn(visitorId);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      await axiosInstance.post('/api/lobby/checkin/', {
        visitor_id: visitorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['lobby-today-visitors'] });
      await queryClient.invalidateQueries({ queryKey: ['lobby-all-visits'] });
      
      // Trigger dashboard refresh
      refreshDashboard();
      
      alert('Visitor checked in successfully!');
    } catch (err: any) {
      console.error('Error checking in visitor:', err);
      alert(err.response?.data?.error || 'Failed to check in visitor');
    } finally {
      setCheckingIn(null);
    }
  };

  // Check out a visitor
  const checkOutVisitor = async (visitorId: number) => {
    try {
      setCheckingOut(visitorId);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      await axiosInstance.post('/api/lobby/checkout/', {
        visitor_id: visitorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['lobby-today-visitors'] });
      await queryClient.invalidateQueries({ queryKey: ['lobby-all-visits'] });
      
      // Trigger dashboard refresh
      refreshDashboard();
      
      alert('Visitor checked out successfully!');
    } catch (err: any) {
      console.error('Error checking out visitor:', err);
      alert(err.response?.data?.error || 'Failed to check out visitor');
    } finally {
      setCheckingOut(null);
    }
  };

  // Mark as No Show function
  const markAsNoShow = async (visitId: number) => {
    try {
      setMarkingNoShow(visitId);
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }
      await axiosInstance.post(`/api/visit-requests/${visitId}/no-show/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['lobby-today-visitors'] });
      await queryClient.invalidateQueries({ queryKey: ['lobby-all-visits'] });
      
      refreshDashboard();
      alert('Visitor marked as no show successfully!');
    } catch (err: any) {
      console.error('Error marking visitor as no show:', err);
      alert(err.response?.data?.error || 'Failed to mark visitor as no show');
    } finally {
      setMarkingNoShow(null);
    }
  };

  // Robust UTC logic for no show - improved with better timezone handling
  const shouldShowNoShowButton = (visitor: Visitor) => {
    const nowUTC = new Date();
    const scheduledUTC = new Date(visitor.scheduled_time);
    
    // Add a small buffer to prevent false positives due to timezone differences
    const bufferMinutes = 1; // 1 minute buffer
    const timeDiff = nowUTC.getTime() - scheduledUTC.getTime();
    const minutesLate = timeDiff / (1000 * 60);
    
    // Only show no-show button if visitor is 15+ minutes late and not checked in
    return !visitor.is_checked_in && 
           visitor.status === 'approved' && 
           minutesLate >= (15 + bufferMinutes);
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString();
  };

  // Show approved and not expired visitors
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const approvedVisitors = visitorsData && Array.isArray(visitorsData) ? visitorsData.filter((v: Visitor) => {
    const scheduledTime = new Date(v.scheduled_time);
    const isApproved = v.status === 'approved';
    const isNotExpired = scheduledTime >= twentyFourHoursAgo;
    return isApproved && isNotExpired;
  }) : [];
  
  // Apply search filter
  const filteredVisitors = approvedVisitors.filter((visitor: Visitor) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const visitorName = visitor.visitor_name?.toLowerCase() || '';
    const employeeName = visitor.employee_name?.toLowerCase() || '';
    
    return visitorName.includes(searchLower) || employeeName.includes(searchLower);
  });

  // Apply status filter
  const statusFilteredVisitors = filteredVisitors.filter((visitor: Visitor) => {
    switch (statusFilter) {
      case 'all':
        return true;
      case 'pending':
        return !visitor.is_checked_in && visitor.status === 'approved';
      case 'checked-in':
        return visitor.is_checked_in && !visitor.is_checked_out;
      case 'checked-out':
        return visitor.is_checked_out;
      case 'no-show':
        return visitor.status === 'no_show';
      default:
        return true;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(statusFilteredVisitors.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVisitors = statusFilteredVisitors.slice(startIndex, endIndex);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Redirect to login on 401/403 error
  useEffect(() => {
    const err = visitorsErrorObj as any;
    if (visitorsError && (err?.response?.status === 401 || err?.response?.status === 403)) {
      navigate('/login');
    }
  }, [visitorsError, visitorsErrorObj, navigate]);

  if (visitorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading today's visitors...</p>
          <p className="mt-2 text-gray-500 text-sm">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Lobby Attendant Dashboard
                </h1>
                <p className="mt-2 text-gray-600 text-lg">Manage visitor check-ins and check-outs for today</p>
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
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => navigate('/walkin')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Walk-In
                </button>
                <button
                  onClick={() => {
                    refetchVisitors();
                    refetchAllVisits();
                  }}
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
        </div>

        {visitorsError && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-6 shadow-lg">
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
                  {(visitorsErrorObj as any)?.response?.data?.error || 'Failed to fetch today\'s visitors'}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      refetchVisitors();
                      refetchAllVisits();
                    }}
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

        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Today's Visitors ({statusFilteredVisitors.length})
                  {statusFilter !== 'all' && (
                    <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Filtered by: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {/* Enhanced Search Bar */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by visitor name or host name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-300/50 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Filter Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                }`}
              >
                All ({approvedVisitors.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === 'pending'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                }`}
              >
                Pending ({approvedVisitors.filter(v => !v.is_checked_in && v.status === 'approved').length})
              </button>
              <button
                onClick={() => setStatusFilter('checked-in')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === 'checked-in'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                }`}
              >
                Checked In ({approvedVisitors.filter(v => v.is_checked_in && !v.is_checked_out).length})
              </button>
              <button
                onClick={() => setStatusFilter('checked-out')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === 'checked-out'
                    ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                }`}
              >
                Checked Out ({approvedVisitors.filter(v => v.is_checked_out).length})
              </button>
              <button
                onClick={() => setStatusFilter('no-show')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === 'no-show'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                }`}
              >
                No Show ({approvedVisitors.filter(v => v.status === 'no_show').length})
              </button>
            </div>
          </div>

          {paginatedVisitors.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mx-auto opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No visitors found' : 'No visitors today'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? `No visitors match "${searchTerm}". Try a different search term.`
                  : statusFilter !== 'all'
                  ? `No visitors with status "${statusFilter}" found.`
                  : 'There are no approved visitors scheduled for today.'
                }
              </p>
              {!searchTerm && (
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate('/walkin')}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create First Walk-In Visit
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200/50">
              {paginatedVisitors.map((visitor) => (
                <li key={visitor.visit_id} className="px-6 py-6 hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-semibold text-gray-700">
                                {visitor.visitor_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-semibold text-gray-900 truncate">
                                {visitor.visitor_name}
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">
                                Host: {visitor.employee_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Purpose</p>
                              <p className="text-sm text-gray-900">{visitor.purpose || 'No purpose specified'}</p>
                            </div>
                            <div className="bg-gray-50/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Scheduled</p>
                              <p className="text-sm text-gray-900">{formatDateTime(visitor.scheduled_time)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Approved
                            </span>
                            {visitor.visit_type === 'walkin' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Walk-In
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-3 ml-6">
                          <div className="flex items-center space-x-2">
                            {/* Show Check In button if not checked in and not checked out */}
                            {!visitor.is_checked_in && !visitor.is_checked_out && (
                              <button
                                onClick={() => checkInVisitor(visitor.visitor_id)}
                                disabled={checkingIn === visitor.visitor_id}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                              >
                                {checkingIn === visitor.visitor_id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Checking In...
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Check In
                                  </>
                                )}
                              </button>
                            )}
                            
                            {/* Show Checked In badge and Check Out button if checked in but not checked out */}
                            {visitor.is_checked_in && !visitor.is_checked_out && (
                              <>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Checked In
                                </span>
                                <button
                                  onClick={() => checkOutVisitor(visitor.visitor_id)}
                                  disabled={checkingOut === visitor.visitor_id}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                                >
                                  {checkingOut === visitor.visitor_id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Checking Out...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                      </svg>
                                      Check Out
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                            
                            {/* Show Checked Out badge if checked out */}
                            {visitor.is_checked_in && visitor.is_checked_out && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800 border border-gray-300">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Checked Out
                              </span>
                            )}
                            
                            {/* Show Convert to Walk-In button for scheduled visits that haven't been checked in */}
                            {!visitor.is_checked_in && visitor.visit_type === 'scheduled' && (
                              <button
                                onClick={() => navigate(`/walkin?convert_visit=${visitor.visit_id}`)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                </svg>
                                Convert to Walk-In
                              </button>
                            )}
                            
                            {/* Show Mark No Show button if visitor is approved, not checked in, and late */}
                            {shouldShowNoShowButton(visitor) && (
                              <button
                                onClick={() => markAsNoShow(visitor.visit_id)}
                                disabled={markingNoShow === visitor.visit_id}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                              >
                                {markingNoShow === visitor.visit_id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Marking No Show...
                                  </>
                                ) : (
                                  <>
                                    Mark No Show
                                    <ExclamationTriangleIcon className="h-4 w-4 ml-2" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          
                          {visitor.is_checked_in && (
                            <div className="text-xs text-gray-500 bg-gray-50/50 rounded-lg px-3 py-2">
                              <div className="font-medium mb-1">Visit Times:</div>
                              <div>In: {visitor.check_in_time ? formatDateTime(visitor.check_in_time) : 'N/A'}</div>
                              {visitor.is_checked_out && (
                                <div>Out: {visitor.check_out_time ? formatDateTime(visitor.check_out_time) : 'N/A'}</div>
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
          )}
          
          {/* Enhanced Pagination Controls */}
          {statusFilteredVisitors.length > 0 && (
            <div className="mt-6 flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1); // Reset to first page when changing page size
                  }}
                  className="border border-gray-300/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <span className="text-sm text-gray-600 font-medium">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, statusFilteredVisitors.length)} of {statusFilteredVisitors.length} visitors
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center px-4 py-2 border border-gray-300/50 text-sm font-medium rounded-lg text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-gray-400/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-sm"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-700 bg-white/50 backdrop-blur-sm border border-gray-300/50 hover:bg-white/80 hover:border-gray-400/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="inline-flex items-center px-4 py-2 border border-gray-300/50 text-sm font-medium rounded-lg text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-gray-400/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-sm"
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
  );
};

export default LobbyAttendant; 