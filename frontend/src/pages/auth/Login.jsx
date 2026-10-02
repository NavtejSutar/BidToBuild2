import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wrench, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const Login = ({ onOpenTerms, onOpenPrivacy }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TECHNICIAN') navigate('/technician');
      else navigate('/complaints');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-md bg-sky-600 mx-auto flex items-center justify-center text-white mb-3 shadow-lg shadow-sky-600/30">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CampusOps Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">Smart Maintenance & Predictive Complaint Management</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-md text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Campus Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@campus.edu"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Quick Demo Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@campus.edu', 'admin123')}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium rounded-md border border-slate-700 text-center"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('tech1@campus.edu', 'tech123')}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium rounded-md border border-slate-700 text-center"
            >
              Technician
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('student1@campus.edu', 'student123')}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium rounded-md border border-slate-700 text-center"
            >
              Student
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 space-y-2">
          <div>
            Need an account?{' '}
            <Link to="/register" className="text-sky-400 hover:underline font-medium">
              Register here
            </Link>
          </div>
          <div className="pt-2 flex justify-center gap-4 text-[11px] text-slate-500">
            <button type="button" onClick={onOpenTerms} className="hover:text-slate-300">
              Terms & Conditions
            </button>
            <span>•</span>
            <button type="button" onClick={onOpenPrivacy} className="hover:text-slate-300">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
