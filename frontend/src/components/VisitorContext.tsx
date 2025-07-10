import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Visitor {
  visit_id: number;
  visitor_name: string;
  employee_name: string;
  purpose?: string;
  scheduled_time: string;
  check_in_time?: string;
  check_out_time?: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  status: string;
  notes?: string;
  updated_at?: string;
}

interface VisitorContextType {
  visitors: Visitor[];
  setVisitors: (visitors: Visitor[]) => void;
  updateVisitor: (visitId: number, updates: Partial<Visitor>) => void;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export const useVisitors = () => {
  const context = useContext(VisitorContext);
  if (context === undefined) {
    throw new Error('useVisitors must be used within a VisitorProvider');
  }
  return context;
};

interface VisitorProviderProps {
  children: ReactNode;
}

export const VisitorProvider: React.FC<VisitorProviderProps> = ({ children }) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  const updateVisitor = (visitId: number, updates: Partial<Visitor>) => {
    setVisitors(prevVisitors =>
      prevVisitors.map(visitor =>
        visitor.visit_id === visitId ? { ...visitor, ...updates } : visitor
      )
    );
  };

  return (
    <VisitorContext.Provider value={{ visitors, setVisitors, updateVisitor }}>
      {children}
    </VisitorContext.Provider>
  );
}; 