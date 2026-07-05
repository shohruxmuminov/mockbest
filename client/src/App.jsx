import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThreeBackground from './components/ThreeBackground';

import Home from './pages/Home';
import AdminDashboard from './pages/admin/Dashboard';
import CandidateDashboard from './pages/candidate/Dashboard';
import TestRunner from './pages/candidate/TestRunner';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" />;
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <ThreeBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/candidate/*" element={
            <ProtectedRoute allowedRole="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          } />

          <Route path="/test/:sessionId" element={
            <ProtectedRoute allowedRole="candidate">
              <TestRunner />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
