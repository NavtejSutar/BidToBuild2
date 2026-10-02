import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { AlertTriangle, Send, ImagePlus, ShieldAlert, Sparkles } from 'lucide-react';

const CRITICAL_KEYWORDS = [
  'sparking', 'exposed wire', 'short circuit', 'flooding', 'fire', 'gas leak'
];

export const NewComplaint = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationId, setLocationId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch campus locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get('/locations');
      return res.data;
    },
  });

  // Keyword rule check for live user feedback
  const lowerDesc = description.toLowerCase();
  const matchedKeyword = CRITICAL_KEYWORDS.find((kw) => lowerDesc.includes(kw));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      setErrorMsg('Please select a category for this complaint.');
      return;
    }
    if (!locationId) {
      setErrorMsg('Please select a campus location.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('locationId', locationId);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/complaints/${res.data.id}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Report Maintenance Fault</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit details for campus facility management. AI will triage and score priority automatically.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-md text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Synchronous Immediate Critical Banner */}
      {matchedKeyword && (
        <div className="mb-6 p-4 bg-rose-950/80 border border-rose-700 rounded-md text-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            Safety Alert: Immediate CRITICAL Urgency Detected
          </div>
          <p>
            Your description contains hazard keyword: <span className="font-mono bg-rose-900/80 px-1 py-0.5 rounded text-rose-100">"{matchedKeyword}"</span>.
            This report will be marked CRITICAL instantly upon submission and trigger high-priority alerts.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-md p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Complaint Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sparking wire near breaker box in Lab 204"
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category (Required) <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="">Select Category...</option>
              <option value="ELECTRICAL">Electrical (Wires, Outlets, Panels)</option>
              <option value="PLUMBING">Plumbing (Leaks, Drains, Restrooms)</option>
              <option value="IT">IT Infrastructure (LAN, Projector, Wi-Fi)</option>
              <option value="HVAC">HVAC (Heating, Air Conditioning, Fans)</option>
              <option value="CIVIL">Civil (Windows, Doors, Walls, Flooring)</option>
              <option value="FURNITURE">Furniture (Desks, Chairs, Benches)</option>
              <option value="CLEANING">Cleaning & Janitorial</option>
              <option value="OTHER">Other Issue</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Groq AI may provide a suggestion, but your selection remains the primary category.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Location <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={locationsLoading}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            >
              <option value="">Select Campus Location...</option>
              {locations &&
                locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.displayName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Detailed Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, exact equipment, symptoms, or observed hazards..."
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Attach Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
          />
          {imagePreview && (
            <div className="mt-3 relative w-48 h-32 rounded-md overflow-hidden border border-slate-700">
              <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/complaints')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting & Classifying...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};
