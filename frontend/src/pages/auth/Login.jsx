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
      <div className="max-w-md w-full bg-white border border-neutral-900 rounded-sm p-8 shadow-2xl text-neutral-900">
        <div className="text-center mb-6">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // CampusOps Authentication
          </div>
          <div className="text-xl select-none mb-1">✦</div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-950">
            Sign in to portal
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Autonomous maintenance & predictive complaint operations
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-sm text-rose-950 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Campus Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@campus.edu"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In ↗'}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-neutral-200">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-600 mb-2.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Quick Demo Switcher</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@campus.edu', 'admin123')}
              className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-mono font-medium rounded-full border border-neutral-300 text-center cursor-pointer transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('tech1@campus.edu', 'tech123')}
              className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-mono font-medium rounded-full border border-neutral-300 text-center cursor-pointer transition-colors"
            >
              Technician
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('student1@campus.edu', 'student123')}
              className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-mono font-medium rounded-full border border-neutral-300 text-center cursor-pointer transition-colors"
            >
              Student
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500 space-y-2">
          <div>
            Need an account?{' '}
            <Link to="/register" className="text-neutral-950 font-semibold hover:underline">
              Register here
            </Link>
          </div>
          <div className="pt-2 flex justify-center gap-4 text-[11px] text-neutral-400">
            <button type="button" onClick={onOpenTerms} className="hover:text-neutral-900 cursor-pointer">
              Terms & Conditions
            </button>
            <span>•</span>
            <button type="button" onClick={onOpenPrivacy} className="hover:text-neutral-900 cursor-pointer">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
