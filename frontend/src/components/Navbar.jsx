import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Users,
  MapPin,
  LogOut,
  FileText,
  ArrowUpRight
} from 'lucide-react';

export const Navbar = ({ onOpenTerms, onOpenPrivacy }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-neutral-900 sticky top-0 z-40 text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" className="flex items-center gap-2 font-mono text-sm tracking-tight font-semibold hover:opacity-80 transition-opacity">
              <span className="text-neutral-400 font-normal">//</span>
              <span className="text-neutral-950 tracking-wide uppercase">CampusOps</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive('/admin')
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/priority-queue"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive('/admin/priority-queue')
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                      }`}
                    >
                      Priority Queue
                    </Link>
                    <Link
                      to="/admin/workload"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive('/admin/workload')
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                      }`}
                    >
                      Workload
                    </Link>
                    <Link
                      to="/admin/locations"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive('/admin/locations')
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                      }`}
                    >
                      Facilities
                    </Link>
                  </>
                )}

                {user.role === 'TECHNICIAN' && (
                  <Link
                    to="/technician"
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                      isActive('/technician')
                        ? 'bg-neutral-950 text-white'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                    }`}
                  >
                    Assigned Tasks
                  </Link>
                )}

                <Link
                  to="/complaints"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive('/complaints')
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                  }`}
                >
                  My Complaints
                </Link>

                <Link
                  to="/complaints/new"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white transition-colors shadow-sm"
                >
                  Report Complaint
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-neutral-900">{user.fullName || user.email}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-800 text-white transition-colors"
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
