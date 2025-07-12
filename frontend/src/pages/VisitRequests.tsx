import React, { useState, useEffect, useContext } from 'react';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

interface VisitRequest {
  id: number;
  purpose: string;
  scheduled_time: string;
  visit_type: string;
  status: string;
  visitor?: {
    full_name: string;
    email: string;
  };
  invitation_link: string;
  employee_id?: number; // Added for cancellation
  is_checked_out?: boolean; // Added to check if visit is completed
}

interface UpdateFormData {
  purpose: string;
  scheduled_time: string;
}

const VisitRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  
  // Update modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(null);
  const [updateFormData, setUpdateFormData] = useState<UpdateFormData>({
    purpose: '',
    scheduled_time: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // No Show modal states
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [noShowRequest, setNoShowRequest] = useState<VisitRequest | null>(null);

  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRequest, setCancelRequest] = useState<VisitRequest | null>(null);

  // Count pending visits
  const pendingCount = requests.filter(req => req.status === 'pending' && req.visitor).length;
  const { user } = useAuth();
  const isLobbyAttendant = user?.groups?.includes('lobby_attendant');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/api/visit-requests/', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setRequests(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load visit requests');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (link: string, id: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRejectClick = (request: VisitRequest) => {
    setSelectedRequest(request);
    setError('');
    setSuccessMessage('');
    setShowRejectModal(true);
  };

  const handleRescheduleClick = (request: VisitRequest) => {
    setSelectedRequest(request);
    setError('');
    setSuccessMessage('');
    setUpdateFormData({
      purpose: request.purpose,
      scheduled_time: new Date(request.scheduled_time).toISOString().slice(0, 16)
    });
    setShowRescheduleModal(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setIsUpdating(true);
    setError('');
    try {
      await axiosInstance.post(`/api/visit-requests/${selectedRequest.id}/reject/`);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setSuccessMessage('Visit request rejected successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject visit request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedRequest) return;
    
    setIsUpdating(true);
    setError('');
    try {
      await axiosInstance.patch(`/api/visit-requests/${selectedRequest.id}/`, {
        purpose: updateFormData.purpose,
        scheduled_time: new Date(updateFormData.scheduled_time).toISOString()
      });
      setShowRescheduleModal(false);
      setSelectedRequest(null);
      setUpdateFormData({ purpose: '', scheduled_time: '' });
      setSuccessMessage('Visit request rescheduled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule visit request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNoShowClick = (request: VisitRequest) => {
    setNoShowRequest(request);
    setError('');
    setSuccessMessage('');
    setShowNoShowModal(true);
  };
  const handleNoShow = async () => {
    if (!noShowRequest) return;
    setIsUpdating(true);
    setError('');
    try {
      await axiosInstance.post(`/api/visit-requests/${noShowRequest.id}/no-show/`);
      setShowNoShowModal(false);
      setNoShowRequest(null);
      setSuccessMessage('Visit marked as No Show.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark as No Show');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = (request: VisitRequest) => {
    setCancelRequest(request);
    setError('');
    setSuccessMessage('');
    setShowCancelModal(true);
  };
  const handleCancel = async () => {
    if (!cancelRequest) return;
    setIsUpdating(true);
    setError('');
    try {
      await axiosInstance.post(`/api/visit-requests/${cancelRequest.id}/cancel/`);
      setShowCancelModal(false);
      setCancelRequest(null);
      setSuccessMessage('Visit canceled successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel visit');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    const iconClasses = "h-6 w-6";
    switch (status) {
      case 'pending':
        return <ClockIcon className={`${iconClasses} text-yellow-500`} />;
      case 'approved':
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />;
      case 'rejected':
        return <XCircleIcon className={`${iconClasses} text-red-500`} />;
      case 'no_show':
        return <XCircleIcon className={`${iconClasses} text-orange-500`} />;
      case 'canceled':
        return <XCircleIcon className={`${iconClasses} text-gray-500`} />;
      default:
        return <ClockIcon className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Enhanced Modal Components
  const RejectModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Reject Visit Request</h3>
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Are you sure you want to reject this visit request? This action cannot be undone.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShowRejectModal(false);
              setSelectedRequest(null);
              setError('');
              setSuccessMessage('');
            }}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={isUpdating}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rejecting...
              </div>
            ) : (
              'Reject Request'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const RescheduleModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PencilIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Reschedule Visit</h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleReschedule(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
            <textarea
              name="purpose"
              value={updateFormData.purpose}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Time</label>
            <input
              type="datetime-local"
              name="scheduled_time"
              value={updateFormData.scheduled_time}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowRescheduleModal(false);
                setSelectedRequest(null);
                setUpdateFormData({ purpose: '', scheduled_time: '' });
                setError('');
                setSuccessMessage('');
              }}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const NoShowModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Mark as No Show</h3>
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Are you sure you want to mark this visit as "No Show"? This will update the visit status.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShowNoShowModal(false);
              setNoShowRequest(null);
              setError('');
              setSuccessMessage('');
            }}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleNoShow}
            disabled={isUpdating}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              'Mark as No Show'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const CancelModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Cancel Visit</h3>
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Are you sure you want to cancel this visit? This action cannot be undone.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShowCancelModal(false);
              setCancelRequest(null);
              setError('');
              setSuccessMessage('');
            }}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Canceling...
              </div>
            ) : (
              'Cancel Visit'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">Loading visit requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-700 leading-relaxed">{error}</p>
              </div>
            </div>
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Visit Requests
                  </h1>
                  <p className="text-lg text-gray-600 font-medium">Manage and track all visitor requests</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-200">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{requests.length} Total Requests</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Success</h3>
                <p className="text-green-700 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Check-ins Alert */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Pending Check-ins ({pendingCount})
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  You have {pendingCount} visit request{pendingCount > 1 ? 's' : ''} waiting for approval. 
                  <a href="/pending-approvals" className="font-medium text-yellow-800 hover:text-yellow-900 underline ml-1">
                    Review now
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No visit requests found</h3>
            <p className="text-gray-600 text-lg">Create your first visit request to get started.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">All Visit Requests</h2>
              </div>
            </div>
            <ul className="divide-y divide-gray-200/50">
              {requests.map((request) => (
                <li key={request.id} className="px-6 py-6 hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                              {request.purpose}
                            </h3>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(request.scheduled_time).toLocaleDateString()} at{' '}
                                {new Date(request.scheduled_time).toLocaleTimeString()}</span>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                              {request.is_checked_out && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Completed
                                </span>
                              )}
                              <span className="text-sm text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded-lg">
                                {request.visit_type}
                              </span>
                            </div>
                          </div>
                          {request.visitor && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <UserGroupIcon className="h-4 w-4" />
                              <span className="font-medium">{request.visitor.full_name}</span>
                              <span>•</span>
                              <span>{request.visitor.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-6">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRescheduleClick(request)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleRejectClick(request)}
                            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-semibold rounded-xl text-red-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
                      {request.status !== 'approved' && request.status !== 'canceled' && (
                        <button
                          onClick={() => copyToClipboard(request.invitation_link, request.id)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                          {copiedId === request.id ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                              Copy Link
                            </>
                          )}
                        </button>
                      )}
                      {isLobbyAttendant && request.status === 'approved' && (
                        <button
                          onClick={() => handleNoShowClick(request)}
                          className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-semibold rounded-xl text-yellow-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          No Show
                        </button>
                      )}
                      {user && request.status === 'approved' && user.id === request.employee_id && (
                        request.is_checked_out ? (
                          <button
                            disabled
                            title="Cannot cancel a completed visit"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCancelClick(request)}
                            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-semibold rounded-xl text-red-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enhanced Modals */}
        {showRejectModal && <RejectModal />}
        {showRescheduleModal && <RescheduleModal />}
        {showNoShowModal && <NoShowModal />}
        {showCancelModal && <CancelModal />}
      </div>
    </div>
  );
};

export default VisitRequests; 