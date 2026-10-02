import React, { useState } from 'react';
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
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </span>
                    </Link>
                    <Link
                      to="/admin/priority-queue"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/priority-queue')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4" />
                        Priority Queue
                      </span>
                    </Link>
                    <Link
                      to="/admin/workload"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/workload')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Technicians
                      </span>
                    </Link>
                    <Link
                      to="/admin/locations"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/locations')
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
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
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive('/technician')
                        ? 'bg-slate-800 text-sky-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4" />
                      Assigned Queue
                    </span>
                  </Link>
                )}

                <Link
                  to="/complaints"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive('/complaints')
                      ? 'bg-slate-800 text-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    My Complaints
                  </span>
                </Link>

                <Link
                  to="/complaints/new"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors`}
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
