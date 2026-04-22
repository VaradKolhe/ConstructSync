import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import LabourDirectory from './pages/LabourDirectory';
import LabourRegistration from './pages/LabourRegistration';
import AuditLogs from './pages/AuditLogs';
import { Toaster } from 'react-hot-toast';

const Unauthorized = () => (
  <div className="h-full flex items-center justify-center p-8 text-center">
    <div className="max-w-md">
      <h1 className="text-4xl font-black text-red-600 uppercase tracking-tighter mb-4">Access Denied</h1>
      <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Security clearance level insufficient for this terminal.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '0px',
            border: '2px solid #0f172a',
            background: '#fff',
            color: '#0f172a',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: '4px 4px 0px 0px #0f172a',
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes - No Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Inside Main Layout */}
          <Route element={<MainLayout />}>
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Specific Routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />

            {/* HR Routes */}
            <Route 
              path="/labour" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <LabourDirectory />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/labour/register" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <LabourRegistration />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
