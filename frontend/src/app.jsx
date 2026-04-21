import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import LabourDirectory from './pages/LabourDirectory';
import LabourRegistration from './pages/LabourRegistration';
import { Toaster } from 'react-hot-toast';

// Placeholder Components for routes
const AuditLogs = () => (
  <div className="p-10">
    <div className="space-y-2 mb-10">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Security Audit</h1>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">System-wide Event Log & Tracking</p>
    </div>
    <div className="bg-white border-2 border-slate-900 p-20 text-center btn-industrial-shadow">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit database offline - Module under development</p>
    </div>
  </div>
);

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

          {/* Protected Routes - Inside Main Layout */}
          <Route element={<MainLayout />}>
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
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
