import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../components/RefreshContext';
import { useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';

interface VisitRequest {
  id: number;
  purpose: string;
  scheduled_time: string;
  visit_type: string;
  status: string;
  invitation_link: string;
}

const CreateVisitRequest: React.FC = () => {
  const navigate = useNavigate();
  const { refreshDashboard } = useRefresh();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    purpose: '',
    scheduled_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<VisitRequest | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeWarning, setTimeWarning] = useState('');

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check if scheduled time is in the past
    if (name === 'scheduled_time' && value) {
      const selectedTime = new Date(value);
      const now = new Date();
      
      if (selectedTime < now) {
        setTimeWarning('⚠️ The selected time is in the past. This visit request may be automatically rejected.');
      } else {
        setTimeWarning('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      // Validate scheduled time
      if (formData.scheduled_time) {
        const selectedTime = new Date(formData.scheduled_time);
        const now = new Date();
        
        if (selectedTime < now) {
          setError('Cannot create a visit request for a time that has already passed. Please select a future time.');
          setIsSubmitting(false);
          return;
        }
      }

      // For scheduled visits, use the regular endpoint
      const scheduledData = {
        ...formData,
        visit_type: 'scheduled',
        scheduled_time: formData.scheduled_time ? new Date(formData.scheduled_time).toISOString() : new Date().toISOString(),
      };
      
      const response = await axiosInstance.post('/api/visit-requests/', scheduledData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCreatedRequest(response.data);
      // Invalidate stats and activities queries for immediate dashboard update
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      // Trigger dashboard refresh (if needed for other contexts)
      refreshDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create visit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (createdRequest?.invitation_link) {
      try {
        await navigator.clipboard.writeText(createdRequest.invitation_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  if (createdRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Visit Request Created Successfully!
                </h2>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Visit Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Visit Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Purpose</p>
                    <p className="text-lg font-semibold text-gray-900 bg-white/60 rounded-lg p-3">{createdRequest.purpose}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Scheduled Time</p>
                    <p className="text-lg font-semibold text-gray-900 bg-white/60 rounded-lg p-3">{new Date(createdRequest.scheduled_time).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Type</p>
                    <p className="text-lg font-semibold text-gray-900 bg-white/60 rounded-lg p-3 capitalize">{createdRequest.visit_type}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-semibold ${
                      createdRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      createdRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {createdRequest.status.charAt(0).toUpperCase() + createdRequest.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invitation Link */}
              {createdRequest.invitation_link && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <ShareIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Invitation Link</h3>
                  </div>
                  <p className="text-gray-700 mb-4 font-medium">
                    Share this link with your visitor to complete their registration:
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={createdRequest.invitation_link}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {copied ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => {
                    setCreatedRequest(null);
                    setFormData({ purpose: '', scheduled_time: '' });
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Create Another Request
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Enhanced Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-6 w-6 text-white" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <PlusIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Create Visit Request</h1>
                  <p className="text-blue-100 font-medium">Schedule a new visitor appointment</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Error Display */}
            {error && (
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
            )}

            {/* Time Warning */}
            {timeWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Time Warning</h3>
                    <p className="text-yellow-700 leading-relaxed">{timeWarning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Purpose Field */}
              <div className="space-y-3">
                <label htmlFor="purpose" className="flex items-center space-x-2">
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded">
                    <DocumentTextIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Purpose of Visit *</span>
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows={4}
                  required
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none"
                  placeholder="Describe the purpose of the visit..."
                />
              </div>

              {/* Scheduled Time Field */}
              <div className="space-y-3">
                <label htmlFor="scheduled_time" className="flex items-center space-x-2">
                  <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded">
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Scheduled Time *</span>
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_time"
                  name="scheduled_time"
                  required
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
                <p className="text-sm text-gray-600 font-medium">
                  Please select a future date and time for the visit.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!timeWarning}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Visit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVisitRequest; 