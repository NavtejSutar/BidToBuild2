const fs = require('fs');
const path = require('path');

function writeFrontendFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'frontend', 'src', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 1. index.css
writeFrontendFile('index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-950 text-slate-100;
  }
}
`);

// 2. api/client.js
writeFrontendFile('api/client.js', `import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
`);

// 3. context/AuthContext.jsx
writeFrontendFile('context/AuthContext.jsx', `import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, id, fullName, role, department } = response.data;
    const userData = { id, email, fullName, role, department, token };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    const { token, id, fullName, role, department } = response.data;
    const userData = { id, email: registerData.email, fullName, role, department, token };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

// 4. components/Badge.jsx
writeFrontendFile('components/Badge.jsx', `import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    REPORTED: 'bg-amber-950/70 text-amber-300 border-amber-800',
    ASSIGNED: 'bg-blue-950/70 text-blue-300 border-blue-800',
    IN_PROGRESS: 'bg-sky-950/70 text-sky-300 border-sky-800',
    RESOLVED: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
  };

  const style = statusStyles[status] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border \${style}\`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const PriorityBadge = ({ level }) => {
  const levelStyles = {
    CRITICAL: 'bg-rose-950/70 text-rose-300 border-rose-800 animate-pulse',
    HIGH: 'bg-orange-950/70 text-orange-300 border-orange-800',
    MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-800',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const style = levelStyles[level] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border \${style}\`}>
      {level || 'LOW'}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const urgencyStyles = {
    CRITICAL: 'text-rose-400 font-semibold',
    HIGH: 'text-orange-400 font-semibold',
    MEDIUM: 'text-amber-400 font-semibold',
    LOW: 'text-slate-400 font-semibold',
  };

  return (
    <span className={\`text-xs \${urgencyStyles[urgency] || 'text-slate-400'}\`}>
      {urgency || 'LOW'}
    </span>
  );
};
`);

// 5. components/PriorityScoreChips.jsx
writeFrontendFile('components/PriorityScoreChips.jsx', `import React from 'react';
import { Flame, Clock, RefreshCw } from 'lucide-react';

export const PriorityScoreChips = ({ score, breakdownJson }) => {
  let breakdown = null;
  if (breakdownJson) {
    try {
      breakdown = typeof breakdownJson === 'string' ? JSON.parse(breakdownJson) : breakdownJson;
    } catch (e) {
      // fallback
    }
  }

  const getScoreColor = (val) => {
    if (val >= 75) return 'text-rose-400 bg-rose-950/50 border-rose-800';
    if (val >= 50) return 'text-orange-400 bg-orange-950/50 border-orange-800';
    if (val >= 25) return 'text-amber-400 bg-amber-950/50 border-amber-800';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className={\`px-2 py-0.5 rounded-md font-semibold border \${getScoreColor(score)}\`}>
        Score {score}
      </span>
      {breakdown && (
        <>
          <span
            title={\`Urgency base score: \${breakdown.urgencyBase}\`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            Base: {breakdown.urgencyBase}
          </span>
          <span
            title={\`Aging bonus: \${breakdown.agingBonus} (\${breakdown.hoursOpen || 0}h open)\`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
          >
            <Clock className="w-3 h-3 text-sky-400" />
            Aging: +{breakdown.agingBonus}
          </span>
          {breakdown.recurrenceBonus > 0 && (
            <span
              title={\`Recurrence bonus: \${breakdown.recurrenceBonus} (index \${breakdown.recurrenceIndex})\`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/50 border border-amber-800 text-amber-300 text-[11px]"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              Recur: +{breakdown.recurrenceBonus}
            </span>
          )}
        </>
      )}
    </div>
  );
};
`);

// 6. components/RecurrenceBadge.jsx
writeFrontendFile('components/RecurrenceBadge.jsx', `import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const RecurrenceBadge = ({ isRecurring, recurrenceIndex }) => {
  if (!isRecurring && recurrenceIndex <= 0) return null;

  return (
    <span
      title={\`Repeat occurrences in past 30 days: \${recurrenceIndex}\`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-700 text-amber-300 text-xs font-medium"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      Recurring ({recurrenceIndex})
    </span>
  );
};
`);

// 7. components/Navbar.jsx
writeFrontendFile('components/Navbar.jsx', `import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Users,
  MapPin,
  LogOut,
  Shield,
  FileText
} from 'lucide-react';

export const Navbar = ({ onOpenTerms, onOpenPrivacy }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 text-white font-semibold text-lg tracking-tight">
              <div className="w-8 h-8 rounded-md bg-sky-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span>CampusOps</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                        isActive('/admin')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </span>
                    </Link>
                    <Link
                      to="/admin/priority-queue"
                      className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                        isActive('/admin/priority-queue')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4" />
                        Priority Queue
                      </span>
                    </Link>
                    <Link
                      to="/admin/workload"
                      className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                        isActive('/admin/workload')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Technicians
                      </span>
                    </Link>
                    <Link
                      to="/admin/locations"
                      className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                        isActive('/admin/locations')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }\`}
                    >
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        Locations
                      </span>
                    </Link>
                  </>
                )}

                {user.role === 'TECHNICIAN' && (
                  <Link
                    to="/technician"
                    className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                      isActive('/technician')
                        ? 'bg-slate-800 text-sky-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }\`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4" />
                      Assigned Queue
                    </span>
                  </Link>
                )}

                <Link
                  to="/complaints"
                  className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-colors \${
                    isActive('/complaints')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }\`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    My Complaints
                  </span>
                </Link>

                <Link
                  to="/complaints/new"
                  className={\`px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors\`}
                >
                  <span className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    Report Fault
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-200">{user.fullName || user.email}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                    <Shield className="w-3 h-3 text-sky-400" />
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
`);

// 8. components/LegalModals.jsx
writeFrontendFile('components/LegalModals.jsx', `import React from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <FileCheck className="w-5 h-5 text-sky-400" />
            Terms and Conditions
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-sm text-slate-300 max-h-80 overflow-y-auto pr-2">
          <p>
            Welcome to the Campus Smart Maintenance and Predictive Complaint Management System. By accessing or submitting complaints, you agree to these terms:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>Reports submitted must represent genuine physical faults or hazards on campus premises.</li>
            <li>False, abusive, or spam reports may lead to account suspension and disciplinary review.</li>
            <li>Uploaded images must only depict the reported maintenance issue.</li>
            <li>Urgency levels generated via automatic keyword screening and Groq AI classification are binding for technician response times.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Privacy Policy
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-sm text-slate-300 max-h-80 overflow-y-auto pr-2">
          <p>
            Your privacy is strictly guarded within the campus operations infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>User email and departmental affiliation are accessed solely for operational assignment and status alerts.</li>
            <li>Complaint text submitted for AI processing does not contain sensitive personal data.</li>
            <li>Passwords are hashed using BCrypt at work factor 12 before persistence.</li>
            <li>Activity logs and transition audits are retained for operational accountability.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
`);

// 9. components/AssignModal.jsx
writeFrontendFile('components/AssignModal.jsx', `import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { X, UserCheck, AlertCircle, Wrench } from 'lucide-react';

export const AssignModal = ({ complaint, isOpen, onClose, onAssigned }) => {
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: workloadList, isLoading } = useQuery({
    queryKey: ['techniciansWorkload'],
    queryFn: async () => {
      const res = await api.get('/technicians/workload');
      return res.data;
    },
    enabled: isOpen,
  });

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setErrorMsg('Please select a technician.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post(\`/complaints/\${complaint.id}/assign\`, {
        technicianId: Number(selectedTechId),
        note: assignNote || 'Assigned via Admin Dashboard',
      });
      onAssigned();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <UserCheck className="w-5 h-5 text-sky-400" />
            Assign Complaint #{complaint.id}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-md text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Complaint Title</label>
            <div className="text-sm font-medium text-slate-200 bg-slate-800/60 p-2.5 rounded-md border border-slate-700/60">
              {complaint.title}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Technician (Ranked by Available Workload)
            </label>
            {isLoading ? (
              <div className="text-xs text-slate-500 py-3">Loading technicians...</div>
            ) : (
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select a technician...</option>
                {workloadList &&
                  workloadList.map((tech) => (
                    <option key={tech.technicianId} value={tech.technicianId}>
                      {tech.technicianName} ({tech.department || 'General'}) : {tech.totalOpenTasks} active tasks
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Assignment Note</label>
            <input
              type="text"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              placeholder="e.g. Please check Lab 204 breaker panel first"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-md flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 10. components/ResolveModal.jsx
writeFrontendFile('components/ResolveModal.jsx', `import React, { useState } from 'react';
import api from '../api/client';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResolveModal = ({ complaint, isOpen, onClose, onResolved }) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setErrorMsg('Please enter a resolution note explaining the fix.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post(\`/complaints/\${complaint.id}/resolve\`, {
        note: resolutionNote.trim(),
      });
      onResolved();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark resolved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Resolve Complaint #{complaint.id}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-md text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Complaint Title</label>
            <div className="text-sm font-medium text-slate-200 bg-slate-800/60 p-2.5 rounded-md border border-slate-700/60">
              {complaint.title}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Resolution Note (Required)
            </label>
            <textarea
              rows={4}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe repairs completed, parts replaced, or tests verified..."
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Resolving...' : 'Complete & Mark Resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);
