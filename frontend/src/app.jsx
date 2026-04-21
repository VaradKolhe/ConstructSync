import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/auth/OnboardingPage';

// Placeholder Components for routes
const Dashboard = () => (
  <div className="p-10">
    <div className="space-y-2 mb-10">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Command Center</h1>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Project Overview & Real-time Metrics</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-8 bg-white border-2 border-slate-900 btn-industrial-shadow h-48 flex flex-col justify-end">
          <div className="w-10 h-1 bg-orange-600 mb-4"></div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Metric 0{i}</h3>
          <p className="text-2xl font-black text-slate-900 uppercase">System Data P{i}</p>
        </div>
      ))}
    </div>
  </div>
);

const LabourDirectory = () => (
  <div className="p-10">
    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Labour Directory</h1>
    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-2">Personnel Database & Management</p>
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
                  <Dashboard />
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
