import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useRefresh } from '../components/RefreshContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';

interface PendingVisit {
  id: number;
  purpose: string;
  scheduled_time: string;
  visit_type: string;
  status: string;
  visitor: {
    full_name: string;
    email: string;
    contact: string;
    address: string;
  };
  created_at: string;
}

const PendingApprovals: React.FC = () => {
  const { user: _user } = useAuth(); // Prefix with _ to indicate intentionally unused
  const { refreshDashboard } = useRefresh();
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingVisits();
  }, []);

  const fetchPendingVisits = async () => {
    try {
      const response = await axiosInstance.get('/api/visit-requests/pending/');
      setPendingVisits(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending visits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (visitId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await axiosInstance.post(`/api/visit-requests/${visitId}/approve/`);
      } else {
        await axiosInstance.post(`/api/visit-requests/${visitId}/reject/`);
      }
      
      // Refresh the list
      fetchPendingVisits();
      
      // Trigger dashboard refresh
      refreshDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} visit`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending check-ins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center text-red-600">
            <XCircleIcon className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Check-ins</h1>
          <p className="mt-2 text-gray-600">
            Visitors who are approved but haven't checked in yet
          </p>
        </div>

        {pendingVisits.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Check-ins</h3>
            <p className="text-gray-600">All approved visitors have checked in.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingVisits.map((visit) => (
              <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {visit.visitor.full_name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Check-in
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{visit.purpose}</p>
                </div>

                <div className="px-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>{visit.visitor.full_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      <span>{visit.visitor.email}</span>
                    </div>
                    {visit.visitor.contact && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        <span>{visit.visitor.contact}</span>
                      </div>
                    )}
                    {visit.visitor.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{visit.visitor.address}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{new Date(visit.scheduled_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-center text-sm text-gray-500">
                      This visitor is approved and waiting to check in at the lobby
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals; 