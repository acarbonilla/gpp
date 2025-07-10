import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

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
}

const MyVisitors: React.FC = () => {
  const [visitors, setVisitors] = useState<MyVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => localStorage.getItem('accessToken');

  useEffect(() => {
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
    fetchVisitors();
  }, []);

  const formatDateTime = (dateTimeString: string | null) => {
    return dateTimeString ? new Date(dateTimeString).toLocaleString() : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Visitors</h1>
          <p className="mt-2 text-gray-600">Track the check-in and check-out status of your approved visitors</p>
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Approved Visitors ({visitors.length})
            </h3>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Loading your visitors...</h3>
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No visitors found</h3>
              <p className="mt-1 text-sm text-gray-500">You have no approved visitors at this time.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <li key={visitor.visit_id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {visitor.visitor_name}
                      </h4>
                      <p className="text-sm text-gray-500">Email: {visitor.visitor_email}</p>
                      <p className="text-sm text-gray-500">Purpose: {visitor.purpose}</p>
                      <p className="text-sm text-gray-500">Scheduled: {formatDateTime(visitor.scheduled_time)}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        {!visitor.is_checked_in && !visitor.is_checked_out && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Arrived
                          </span>
                        )}
                        {visitor.is_checked_in && !visitor.is_checked_out && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Checked In
                          </span>
                        )}
                        {visitor.is_checked_in && visitor.is_checked_out && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                            Checked Out
                          </span>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVisitors; 