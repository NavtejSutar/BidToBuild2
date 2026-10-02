import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wrench, UserPlus, AlertCircle } from 'lucide-react';

export const Register = ({ onOpenTerms, onOpenPrivacy }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: '',
    phoneNumber: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TECHNICIAN') navigate('/technician');
      else navigate('/complaints');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-neutral-900 rounded-sm p-8 shadow-2xl text-neutral-900">
        <div className="text-center mb-6">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // CampusOps Registration
          </div>
          <div className="text-xl select-none mb-1">✦</div>
          <h1 className="text-2xl font-normal tracking-tight text-neutral-950">
            Create campus account
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Join the campus facility reporting network
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-sm text-rose-950 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Campus Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@campus.edu"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="TECHNICIAN">Technician</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. CS Lab"
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1-555-0199"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white font-medium text-xs uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {loading ? 'Creating Account...' : 'Register ↗'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600 space-y-2 border-t border-neutral-200 pt-4">
          <div>
            Already have an account?{' '}
            <Link to="/login" className="text-neutral-950 font-semibold underline underline-offset-4 hover:text-neutral-700">
              Sign In
            </Link>
          </div>
          <div className="pt-2 flex justify-center gap-4 text-[11px] text-neutral-500 font-mono uppercase">
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
