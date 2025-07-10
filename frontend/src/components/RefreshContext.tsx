import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RefreshContextType {
  refreshDashboard: () => void;
  subscribeToRefresh: (callback: () => void) => () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

interface RefreshProviderProps {
  children: ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const [subscribers, setSubscribers] = useState<(() => void)[]>([]);

  const refreshDashboard = useCallback(() => {
    subscribers.forEach(callback => callback());
  }, [subscribers]);

  const subscribeToRefresh = useCallback((callback: () => void) => {
    setSubscribers(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => prev.filter(sub => sub !== callback));
    };
  }, []);

  const value: RefreshContextType = {
    refreshDashboard,
    subscribeToRefresh,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}; 