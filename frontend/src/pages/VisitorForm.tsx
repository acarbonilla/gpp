import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';

interface VisitDetails {
  purpose: string;
  scheduled_time: string;
  employee_name: string;
  visit_type: string;
}

const VisitorForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [visitDetails, setVisitDetails] = useState<VisitDetails | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVisitDetails = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axiosInstance.get(`/api/visitor-form/${token}/`);
      setVisitDetails(response.data.visit_details);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load visit details');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVisitDetails();
  }, [fetchVisitDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      await axiosInstance.post(`/api/visitor-form/${token}/`, formData);
      setSuccess(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit visitor information');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading visit details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Access Error</h2>
          <p className="text-center text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-center text-gray-600 mb-4">
            Thank you for completing your visitor registration. You will receive further instructions via email.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Visit Details</h3>
            <div className="text-sm text-blue-800">
              <p><span className="font-medium">Host:</span> {visitDetails?.employee_name}</p>
              <p><span className="font-medium">Purpose:</span> {visitDetails?.purpose}</p>
              <p><span className="font-medium">Time:</span> {visitDetails?.scheduled_time ? new Date(visitDetails.scheduled_time).toLocaleString() : ''}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Visitor Registration</h1>
              <p className="mt-2 text-gray-600">Please complete your visitor information</p>
            </div>

            {visitDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Visit Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Host:</span> {visitDetails.employee_name}</p>
                  <p><span className="font-medium">Purpose:</span> {visitDetails.purpose}</p>
                  <p><span className="font-medium">Scheduled Time:</span> {new Date(visitDetails.scheduled_time).toLocaleString()}</p>
                  <p><span className="font-medium">Type:</span> {visitDetails.visit_type}</p>
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{formError}</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your contact number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorForm; 