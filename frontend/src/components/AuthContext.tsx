import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '../api/axiosInstance';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[]; // Add groups for role-based navigation
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/user/');
      setUser(response.data);
    } catch (error: any) {
      // If it's a 401 error, try to refresh the token
      if (error.response?.status === 401) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          // Retry the user info request with the new token
          try {
            const retryResponse = await axiosInstance.get('/api/auth/user/');
            setUser(retryResponse.data);
            return;
          } catch (retryError) {
            console.error('Failed to get user info after token refresh:', retryError);
          }
        }
      }
      
      // If refresh failed or other error, clear tokens and user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    const response = await axiosInstance.post('/api/auth/login/', {
      username,
      password,
    });

    // Use response.data.token and response.data.refresh
    const { token, refresh } = response.data;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Fetch complete user info with groups
    const userResponse = await axiosInstance.get('/api/auth/user/');
    setUser(userResponse.data);
    return true;
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint if user is authenticated
      if (user) {
        await axiosInstance.post('/api/auth/logout/');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await axiosInstance.post('/api/token/refresh/', {
        refresh: refreshTokenValue,
      });
      
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't automatically logout here - let the axios interceptor handle it
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    refreshToken,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 