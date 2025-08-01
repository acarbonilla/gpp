import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { 
  UserIcon, 
  LockClosedIcon, 
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Debug form state changes
  useEffect(() => {
    // Removed debug logging
  }, [formData, error, isSubmitting, isSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
      // Only clear password field when there's an error, keep username
      if (name === 'password') {
        setFormData(prev => ({
          ...prev,
          password: value
        }));
      }
    }
  };

  const handlePasswordFocus = () => {
    // Clear password field when user focuses on it (for retry)
    if (error) {
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Client-side validation
    if (!formData.username.trim()) {
      setError('Username is required. Please enter your username.');
      return;
    }
    
    if (!formData.password.trim()) {
      setError('Password is required. Please enter your password.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        setIsSuccess(true);
        // Show success animation before redirecting
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err: any) {
      // Handle specific API errors
      if (err.response?.status === 401) {
        const errorMsg = 'Invalid username or password. Please check your credentials and try again.';
        setError(errorMsg);
      } else if (err.response?.status === 400) {
        const errorMsg = 'Please provide both username and password.';
        setError(errorMsg);
      } else if (err.response?.status === 500) {
        const errorMsg = 'Server error. Please try again later.';
        setError(errorMsg);
      } else if (err.message?.includes('Network')) {
        const errorMsg = 'Network error. Please check your connection and try again.';
        setError(errorMsg);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        const errorMsg = 'Login failed. Please check your credentials and try again.';
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 fixed inset-0 p-4 sm:p-6 lg:p-8">
      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg transform rotate-3 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg transform -rotate-3 animate-pulse animation-delay-1000"></div>
              <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center shadow-inner">
                <BuildingOfficeIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-base sm:text-lg text-gray-600 font-medium">
                Sign in to GatePassPro
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Employee Portal Access
              </p>
            </div>
          </div>

          {/* Success state */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-fade-in">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Login Successful!</h3>
                  <p className="text-sm text-green-700">Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isSuccess && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-red-100 rounded-full">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Login Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login form */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
              <div className="space-y-4">
                {/* Username field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={handlePasswordFocus}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure access to GatePassPro employee portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 