import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../components/RefreshContext';
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Visitor {
  visit_id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_email: string;
  host_name: string;
  purpose: string;
  scheduled_time: string;
  visit_type: string;
  is_checked_in: boolean;
  check_in_time: string | null;
  is_checked_out: boolean;
  check_out_time: string | null;
  status: string; // Add this line
}

const LobbyAttendant: React.FC = () => {
  const navigate = useNavigate();
  const { refreshDashboard } = useRefresh();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for marking no show
  const [markingNoShow, setMarkingNoShow] = useState<number | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Fetch today's visitors
  const fetchTodayVisitors = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      const response = await axiosInstance.get('/api/lobby/today-visitors/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Raw API response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      setVisitors(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching visitors:', err);
      setError(err.response?.data?.error || 'Failed to fetch today\'s visitors');
    } finally {
      setLoading(false);
    }
  };

  // Check in a visitor
  const checkInVisitor = async (visitorId: number) => {
    try {
      setCheckingIn(visitorId);
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      await axiosInstance.post('/api/lobby/checkin/', {
        visitor_id: visitorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh the visitors list
      await fetchTodayVisitors();
      
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
        setError('No authentication token found. Please login.');
        return;
      }

      await axiosInstance.post('/api/lobby/checkout/', {
        visitor_id: visitorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh the visitors list
      await fetchTodayVisitors();
      
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
        setError('No authentication token found. Please login.');
        return;
      }
      await axiosInstance.post(`/api/visit-requests/${visitId}/no-show/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      await fetchTodayVisitors();
      refreshDashboard();
      alert('Visitor marked as no show successfully!');
    } catch (err: any) {
      console.error('Error marking visitor as no show:', err);
      alert(err.response?.data?.error || 'Failed to mark visitor as no show');
    } finally {
      setMarkingNoShow(null);
    }
  };

  // Robust UTC logic for no show
  const shouldShowNoShowButton = (visitor: Visitor) => {
    const nowUTC = new Date();
    const scheduledUTC = new Date(visitor.scheduled_time);
    const timeDiff = nowUTC.getTime() - scheduledUTC.getTime();
    const minutesLate = timeDiff / (1000 * 60);
    return !visitor.is_checked_in && visitor.status === 'approved' && minutesLate >= 15;
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString();
  };

  useEffect(() => {
    fetchTodayVisitors();
  }, []);

  // Show approved and not expired visitors
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  console.log('Current time:', now);
  console.log('24 hours ago:', twentyFourHoursAgo);
  console.log('All visitors before filtering:', visitors);
  
  const approvedVisitors = visitors.filter((v: any) => {
    const scheduledTime = new Date(v.scheduled_time);
    const isApproved = v.status === 'approved';
    const isNotExpired = scheduledTime >= twentyFourHoursAgo;
    console.log(`Visitor ${v.visitor_name}: status=${v.status}, scheduled=${scheduledTime}, 24hAgo=${twentyFourHoursAgo}, isApproved=${isApproved}, isNotExpired=${isNotExpired}`);
    return isApproved && isNotExpired;
  });
  
  // Apply search filter
  const filteredVisitors = approvedVisitors.filter((visitor) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const visitorName = visitor.visitor_name?.toLowerCase() || '';
    const hostName = visitor.host_name?.toLowerCase() || '';
    
    return visitorName.includes(searchLower) || hostName.includes(searchLower);
  });
  
  console.log('Filtered visitors:', filteredVisitors);

  // Calculate pagination
  const totalPages = Math.ceil(filteredVisitors.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVisitors = filteredVisitors.slice(startIndex, endIndex);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading today's visitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lobby Attendant Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage visitor check-ins and check-outs for today</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Today's Visitors ({filteredVisitors.length})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/walkin')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Walk-In
                </button>
                <button
                  onClick={fetchTodayVisitors}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by visitor name or host name..."
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
          </div>

          {paginatedVisitors.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No visitors found' : 'No visitors today'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `No visitors match "${searchTerm}". Try a different search term.`
                  : 'There are no approved visitors scheduled for today.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/walkin')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create First Walk-In Visit
                  </button>
                </div>
              )}
            </div>
          ) : (
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
                          <p className="text-sm text-gray-500">
                            Host: {visitor.host_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Purpose: {visitor.purpose}
                          </p>
                          <p className="text-sm text-gray-500">
                            Scheduled: {formatDateTime(visitor.scheduled_time)}
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                              Approved
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-2">
                            {/* Show Check In button if not checked in and not checked out */}
                            {!visitor.is_checked_in && !visitor.is_checked_out && (
                              <button
                                onClick={() => checkInVisitor(visitor.visitor_id)}
                                disabled={checkingIn === visitor.visitor_id}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {checkingIn === visitor.visitor_id ? 'Checking In...' : 'Check In'}
                              </button>
                            )}
                            {/* Show Checked In badge and Check Out button if checked in but not checked out */}
                            {visitor.is_checked_in && !visitor.is_checked_out && (
                              <>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Checked In
                                </span>
                                <button
                                  onClick={() => checkOutVisitor(visitor.visitor_id)}
                                  disabled={checkingOut === visitor.visitor_id}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {checkingOut === visitor.visitor_id ? 'Checking Out...' : 'Check Out'}
                                </button>
                              </>
                            )}
                            {/* Show Checked Out badge if checked out */}
                            {visitor.is_checked_in && visitor.is_checked_out && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
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
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {markingNoShow === visitor.visit_id ? 'Marking No Show...' : 'Mark No Show'}
                                <ExclamationTriangleIcon className="h-4 w-4 ml-2" />
                              </button>
                            )}
                          </div>
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
                    
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* Pagination Controls */}
          {filteredVisitors.length > 0 && (
            <div className="mt-6 flex items-center justify-between px-4 py-3 border-t border-gray-200">
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

export default LobbyAttendant; 