import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TermsModal, PrivacyModal } from './components/LegalModals';
import { LandingPage } from './pages/landing/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ComplaintList } from './pages/complaints/ComplaintList';
import { NewComplaint } from './pages/complaints/NewComplaint';
import { ComplaintDetail } from './pages/complaints/ComplaintDetail';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PriorityQueue } from './pages/admin/PriorityQueue';
import { WorkerWorkload } from './pages/admin/WorkerWorkload';
import { LocationSummary } from './pages/admin/LocationSummary';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-400">Loading auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/complaints" replace />;
  }
  return children;
};

export const App = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const location = useLocation();

  const isLanding = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isLanding ? 'bg-[#abb5ad]' : 'bg-slate-950 text-slate-100'}`}>
      {!isLanding && (
        <Navbar
          onOpenTerms={() => setIsTermsOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      )}

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <Login
                onOpenTerms={() => setIsTermsOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
              />
            }
          />
          <Route
            path="/register"
            element={
              <Register
                onOpenTerms={() => setIsTermsOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
              />
            }
          />

          {/* User Routes */}
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/new"
            element={
              <ProtectedRoute>
                <NewComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Technician Routes */}
          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/priority-queue"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PriorityQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workload"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <WorkerWorkload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LocationSummary />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isLanding && (
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>CampusOps Smart Maintenance & Predictive Complaint Management System</div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-slate-300">
                Terms & Conditions
              </button>
              <span>•</span>
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-300">
                Privacy Policy
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Legal Modals */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
