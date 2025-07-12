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
  CalendarIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingVisits();
  }, []);

  const fetchPendingVisits = async () => {
    try {
      const response = await axiosInstance.get('/api/visit-requests/pending-approvals/');
      setPendingVisits(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending visits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (visitId: number, action: 'approve' | 'reject') => {
    setProcessingId(visitId);
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
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Pending Approvals</h3>
            <p className="text-gray-600">Please wait while we retrieve your pending requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <ArrowLeftIcon className="h-6 w-6 text-white" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                  <ClockIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-yellow-800 to-orange-800 bg-clip-text text-transparent">
                    Pending Approvals
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">Review and approve visitor requests</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-xl border border-yellow-200">
              <UserGroupIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">{pendingVisits.length} Pending Requests</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {pendingVisits.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">All Caught Up!</h3>
            <p className="text-gray-600 text-lg mb-6">No pending approvals at the moment. All visit requests have been processed.</p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-green-800 text-sm font-medium">
                ✅ You're all set! Check back later for new requests.
              </p>
            </div>
          </div>
        ) : (
          /* Enhanced Pending Visits Grid */
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pendingVisits.map((visit) => (
              <div key={visit.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                {/* Header */}
                <div className="px-6 py-6 border-b border-gray-200/50 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {visit.visitor ? visit.visitor.full_name : 'Pending Visitor'}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                    <p className="text-gray-700 leading-relaxed">{visit.purpose}</p>
                  </div>
                </div>

                {/* Visitor Information */}
                <div className="px-6 py-6">
                  <div className="space-y-4 mb-6">
                    {visit.visitor ? (
                      <>
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Visitor Name</p>
                            <p className="text-blue-800">{visit.visitor.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          <EnvelopeIcon className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium text-emerald-900">Email</p>
                            <p className="text-emerald-800 truncate">{visit.visitor.email}</p>
                          </div>
                        </div>
                        {visit.visitor.contact && (
                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                            <PhoneIcon className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">Contact</p>
                              <p className="text-purple-800">{visit.visitor.contact}</p>
                            </div>
                          </div>
                        )}
                        {visit.visitor.address && (
                          <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                            <MapPinIcon className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-900">Address</p>
                              <p className="text-orange-800 text-sm leading-relaxed">{visit.visitor.address}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <EyeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium">Visitor information not yet provided</p>
                        <p className="text-gray-500 text-sm">Waiting for visitor to complete registration</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <CalendarIcon className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Scheduled Time</p>
                        <p className="text-indigo-800">{new Date(visit.scheduled_time).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-xl border border-yellow-200">
                        <SparklesIcon className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Awaiting your decision</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApproval(visit.id, 'approve')}
                        disabled={processingId === visit.id}
                        className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        {processingId === visit.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleApproval(visit.id, 'reject')}
                        disabled={processingId === visit.id}
                        className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        {processingId === visit.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
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