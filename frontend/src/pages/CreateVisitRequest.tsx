import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../components/RefreshContext';
import { useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center justify-center mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Visit Request Created Successfully!
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Visit Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Purpose:</span> {createdRequest.purpose}</p>
                <p><span className="font-medium">Scheduled Time:</span> {new Date(createdRequest.scheduled_time).toLocaleString()}</p>
                <p><span className="font-medium">Type:</span> {createdRequest.visit_type}</p>
                <p><span className="font-medium">Status:</span> <span className="capitalize">{createdRequest.status}</span></p>
              </div>
            </div>

            {createdRequest.invitation_link && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Invitation Link</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Share this link with your visitor to complete their registration:
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={createdRequest.invitation_link}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setCreatedRequest(null);
                  setFormData({ purpose: '', scheduled_time: '' });
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Create Another Request
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center mb-6">
            <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Create Scheduled Visit Request</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {timeWarning && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Time Warning</h3>
                  <div className="mt-2 text-sm text-yellow-700">{timeWarning}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={4}
                required
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the purpose of the visit..."
              />
            </div>

            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                id="scheduled_time"
                name="scheduled_time"
                required
                value={formData.scheduled_time}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)} // Set minimum to current time
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Please select a future date and time for the visit.
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!timeWarning}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Visit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVisitRequest; 