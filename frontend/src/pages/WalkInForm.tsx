import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';

interface WalkInFormData {
  full_name: string;
  email: string;
  contact: string;
  address: string;
  host_name: string;
  purpose: string;
}

interface ScheduledVisit {
  visit_id: number;
  visitor_name: string;
  visitor_email: string;
  employee_name: string;
  purpose: string;
  scheduled_time: string;
  status: string;
}

const WalkInForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formMode, setFormMode] = useState<'new' | 'convert'>('new');
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [loadingVisits, setLoadingVisits] = useState(false);
  
  const [formData, setFormData] = useState<WalkInFormData>({
    full_name: '',
    email: '',
    contact: '',
    address: '',
    host_name: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Check if we're converting a specific visit from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const visitId = params.get('convert_visit');
    if (visitId) {
      setFormMode('convert');
      setSelectedVisitId(parseInt(visitId));
      fetchScheduledVisits();
    }
  }, [location]);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const fetchScheduledVisits = async () => {
    try {
      setLoadingVisits(true);
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

      // Filter for approved visits that haven't been checked in yet
      const pendingVisits = response.data.filter((visit: any) => 
        visit.status === 'approved' && !visit.is_checked_in
      );
      
      setScheduledVisits(pendingVisits);
    } catch (err: any) {
      console.error('Error fetching scheduled visits:', err);
      setError('Failed to fetch scheduled visits');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVisitSelection = (visit: ScheduledVisit) => {
    setSelectedVisitId(visit.visit_id);
    setFormData({
      full_name: visit.visitor_name,
      email: visit.visitor_email,
      contact: '',
      address: '',
      host_name: visit.employee_name,
      purpose: visit.purpose,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please login.');
        return;
      }

      if (formMode === 'convert' && selectedVisitId) {
        // Convert scheduled visit to walk-in
        await convertScheduledToWalkIn(selectedVisitId);
      } else {
        // Create new walk-in visit
        await createNewWalkIn();
      }

      alert('Walk-in visit created successfully!');
      navigate('/lobby');
      
    } catch (err: any) {
      console.error('Error creating walk-in visit:', err);
      setError(err.response?.data?.error || 'Failed to create walk-in visit');
    } finally {
      setLoading(false);
    }
  };

  const createNewWalkIn = async () => {
    const walkInData = {
      ...formData,
      scheduled_time: new Date().toISOString(),
    };

    const response = await axiosInstance.post('/api/lobby/walkin/', walkInData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const convertScheduledToWalkIn = async (visitId: number) => {
    const response = await axiosInstance.post(`/api/lobby/convert-to-walkin/${visitId}/`, {
      host_name: formData.host_name,
      purpose: formData.purpose,
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const getSelectedVisit = () => {
    return scheduledVisits.find(visit => visit.visit_id === selectedVisitId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header with animation */}
        <div className={`mb-8 text-center transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            {formMode === 'convert' ? 'Convert to Walk-In' : 'Create Walk-In Visit'}
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            {formMode === 'convert' 
              ? 'Convert scheduled visit to walk-in to prevent no-show status'
              : 'Register a new walk-in visitor'
            }
          </p>
        </div>

        {/* Mode Selector */}
        <div className={`mb-6 transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setFormMode('new');
                  setSelectedVisitId(null);
                  setFormData({
                    full_name: '',
                    email: '',
                    contact: '',
                    address: '',
                    host_name: '',
                    purpose: '',
                  });
                }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  formMode === 'new'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Walk-In</span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setFormMode('convert');
                  fetchScheduledVisits();
                }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  formMode === 'convert'
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span>Convert Scheduled Visit</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error message with animation */}
        {error && (
          <div className={`mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-lg transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Visits Selection (for convert mode) */}
        {formMode === 'convert' && (
          <div className={`mb-6 transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select Scheduled Visit to Convert
              </h3>
              
              {loadingVisits ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading scheduled visits...</p>
                </div>
              ) : scheduledVisits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No pending scheduled visits found for today.</p>
                  <p className="text-sm mt-1">All visitors may have already checked in or been marked as no-show.</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {scheduledVisits.map((visit) => (
                    <div
                      key={visit.visit_id}
                      onClick={() => handleVisitSelection(visit)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedVisitId === visit.visit_id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{visit.visitor_name}</h4>
                          <p className="text-sm text-gray-600">Meeting: {visit.employee_name}</p>
                          <p className="text-sm text-gray-500">Purpose: {visit.purpose}</p>
                          <p className="text-xs text-gray-400">
                            Scheduled: {new Date(visit.scheduled_time).toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          {selectedVisitId === visit.visit_id && (
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM3.707 9.293a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L11 13.586l-5.293-5.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main form card with animation */}
        <div className={`bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Visitor Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Visitor Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Full Name Field */}
                  <div className="group">
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleInputChange}
                        disabled={formMode === 'convert'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter visitor's full name"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={formMode === 'convert'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter visitor's email"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Contact Number Field */}
                  <div className="group">
                    <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="contact"
                        id="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400"
                        placeholder="Enter contact number"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Address Field - Full Width */}
                  <div className="group sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <textarea
                        name="address"
                        id="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400 resize-none"
                        placeholder="Enter visitor's address"
                      />
                      <div className="absolute top-3 right-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Details Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Visit Details</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Host Name Field */}
                  <div className="group">
                    <label htmlFor="host_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Person to Visit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="host_name"
                        id="host_name"
                        required
                        value={formData.host_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400"
                        placeholder="Who are you visiting?"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Purpose Field */}
                  <div className="group">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose of Visit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="purpose"
                        id="purpose"
                        required
                        value={formData.purpose}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400"
                        placeholder="Meeting, interview, etc."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Notice */}
              {formMode === 'convert' && selectedVisitId && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-green-800">Converting Scheduled Visit</h3>
                      <div className="mt-1 text-sm text-green-700">
                        This will convert the scheduled visit to a walk-in, preventing it from being marked as "no show" 
                        and allowing proper time logging regardless of communication method used.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/lobby')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (formMode === 'convert' && !selectedVisitId)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {formMode === 'convert' ? 'Converting...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      {formMode === 'convert' ? 'Convert to Walk-In' : 'Create Walk-In Visit'}
                    </>
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

export default WalkInForm; 