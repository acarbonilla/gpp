import React, { useState, useEffect, useContext } from 'react';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../components/AuthContext';

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
}

interface UpdateFormData {
  purpose: string;
  scheduled_time: string;
}

const VisitRequests: React.FC = () => {
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
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Modal components
  const RejectModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <XCircleIcon className="mx-auto flex items-center justify-center h-12 w-12 text-red-100 bg-red-600 rounded-full mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Visit Request</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to reject this visit request? This action cannot be undone.
          </p>
          {selectedRequest?.visitor && (
            <p className="text-sm text-gray-600 mb-6">
              Visitor: <strong>{selectedRequest.visitor.full_name}</strong>
            </p>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setError('');
                setSuccessMessage('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isUpdating}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const RescheduleModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-center mb-4">
            <PencilIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Reschedule Visit Request</h3>
          
          <form onSubmit={(e) => { e.preventDefault(); handleReschedule(); }}>
            <div className="space-y-4">
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Visit
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows={3}
                  required
                  value={updateFormData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the purpose of the visit..."
                />
              </div>

              <div>
                <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                  New Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_time"
                  name="scheduled_time"
                  required
                  value={updateFormData.scheduled_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const NoShowModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <XCircleIcon className="mx-auto flex items-center justify-center h-12 w-12 text-yellow-100 bg-yellow-600 rounded-full mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mark as No Show</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to mark this visit as No Show? This action cannot be undone.
          </p>
          {noShowRequest?.visitor && (
            <p className="text-sm text-gray-600 mb-6">
              Visitor: <strong>{noShowRequest.visitor.full_name}</strong>
            </p>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowNoShowModal(false);
                setError('');
                setSuccessMessage('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNoShow}
              disabled={isUpdating}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Marking...' : 'Mark as No Show'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const CancelModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <XCircleIcon className="mx-auto flex items-center justify-center h-12 w-12 text-red-100 bg-red-600 rounded-full mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Visit</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to cancel this visit? This action cannot be undone.
          </p>
          {cancelRequest?.visitor && (
            <p className="text-sm text-gray-600 mb-6">
              Visitor: <strong>{cancelRequest.visitor.full_name}</strong>
            </p>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setError('');
                setSuccessMessage('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Canceling...' : 'Cancel Visit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading visit requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visit Requests</h1>
          <p className="mt-2 text-gray-600">Manage and track all visitor requests</p>
        </div>
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mr-3" />
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Check-ins ({pendingCount})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                You have {pendingCount} visit request{pendingCount > 1 ? 's' : ''} waiting for approval. 
                <a href="/pending-approvals" className="font-medium text-yellow-800 hover:text-yellow-900 underline ml-1">
                  Review now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visit requests found</h3>
          <p className="text-gray-600">Create your first visit request to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {request.purpose}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {new Date(request.scheduled_time).toLocaleDateString()} at{' '}
                            {new Date(request.scheduled_time).toLocaleTimeString()}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            {request.visit_type}
                          </span>
                        </div>
                        {request.visitor && (
                          <p className="text-sm text-gray-500 mt-1">
                            Visitor: {request.visitor.full_name} ({request.visitor.email})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRescheduleClick(request)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleRejectClick(request)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    {request.status !== 'approved' && request.status !== 'canceled' && (
                      <button
                        onClick={() => copyToClipboard(request.invitation_link, request.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {copiedId === request.id ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                            Copy Link
                          </>
                        )}
                      </button>
                    )}
                    {isLobbyAttendant && request.status === 'approved' && (
                      <button
                        onClick={() => handleNoShowClick(request)}
                        className="inline-flex items-center px-3 py-1 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Mark as No Show
                      </button>
                    )}
                    {user && request.status === 'approved' && user.id === request.employee_id && (
                      <button
                        onClick={() => handleCancelClick(request)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modals */}
      {showRejectModal && <RejectModal />}
      {showRescheduleModal && <RescheduleModal />}
      {showNoShowModal && <NoShowModal />}
      {showCancelModal && <CancelModal />}
    </div>
  );
};

export default VisitRequests; 