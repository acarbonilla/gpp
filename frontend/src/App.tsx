import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LobbyAttendantDashboard from './pages/LobbyAttendantDashboard';
import MyVisitorsDashboard from './pages/MyVisitorsDashboard';
import CreateVisitRequest from './pages/CreateVisitRequest';
import VisitorForm from './pages/VisitorForm';
import VisitRequests from './pages/VisitRequests';
import PendingApprovals from './pages/PendingApprovals';
import LobbyAttendant from './pages/LobbyAttendant';
import WalkInForm from './pages/WalkInForm';
import Login from './pages/Login';
import MyVisitors from './pages/MyVisitors';
import Reports from './pages/Reports';
import { useAuth } from './components/AuthContext';
import { RefreshProvider } from './components/RefreshContext';
import { VisitorProvider } from './components/VisitorContext';

// Role-based Dashboard component
const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Check if user is in lobby_attendant group
  if (user?.groups?.includes('lobby_attendant')) {
    return <LobbyAttendantDashboard />;
  }
  
  // Default dashboard for other users
  return <Dashboard />;
};

// Role-based My Visitors component
const RoleBasedMyVisitors: React.FC = () => {
  const { user } = useAuth();
  
  // Check if user is in lobby_attendant group
  if (user?.groups?.includes('lobby_attendant')) {
    return <MyVisitors />; // Lobby attendants see the basic list view
  }
  
  // Other users see the specialized dashboard
  return <MyVisitorsDashboard />;
};

function App() {
  useAuth(); // still call to enforce auth, but no role-based dashboard
  
  return (
    <RefreshProvider>
      <VisitorProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/visitor-form/:token" element={<VisitorForm />} />
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/create-visit" element={
                  <ProtectedRoute>
                    <CreateVisitRequest />
                  </ProtectedRoute>
                } />
                <Route path="/visit-requests" element={
                  <ProtectedRoute>
                    <VisitRequests />
                  </ProtectedRoute>
                } />
                <Route path="/pending-approvals" element={
                  <ProtectedRoute>
                    <PendingApprovals />
                  </ProtectedRoute>
                } />
                <Route path="/lobby" element={
                  <ProtectedRoute>
                    <LobbyAttendant />
                  </ProtectedRoute>
                } />
                <Route path="/walkin" element={
                  <ProtectedRoute>
                    <WalkInForm />
                  </ProtectedRoute>
                } />
                <Route path="/my-visitors" element={
                  <ProtectedRoute>
                    <RoleBasedMyVisitors />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </VisitorProvider>
    </RefreshProvider>
  );
}

export default App;
