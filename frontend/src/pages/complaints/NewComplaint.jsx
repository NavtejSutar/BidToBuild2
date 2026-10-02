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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900">
        <div className="pb-6 border-b border-neutral-900 mb-6">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // Intake Protocol
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
            Report Maintenance Fault
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Submit details for campus facility management. AI will triage category and score dynamic priority automatically.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-300 rounded-sm text-rose-950 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            {errorMsg}
          </div>
        )}

        {/* Synchronous Immediate Critical Banner */}
        {matchedKeyword && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-[#ea4335] rounded-sm text-rose-950 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-rose-900 text-sm">
              <ShieldAlert className="w-4 h-4 text-[#ea4335]" />
              Safety Alert: Immediate CRITICAL Urgency Detected
            </div>
            <p className="text-rose-800">
              Your description matches hazard rule: <span className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-950 font-medium">"{matchedKeyword}"</span>.
              This report will be marked <span className="font-mono font-bold uppercase">CRITICAL</span> immediately upon submission and trigger high-priority alerts.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Complaint Title <span className="text-[#ea4335]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sparking wire near breaker box in Lab 204"
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Category (Required) <span className="text-[#ea4335]">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors"
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
              <p className="text-[11px] text-neutral-500 mt-1">
                Groq AI may suggest an alternative category, but your choice stays default.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Campus Location <span className="text-[#ea4335]">*</span>
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={locationsLoading}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors disabled:opacity-50"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Detailed Description <span className="text-[#ea4335]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, exact equipment, symptoms, or observed hazards..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Attach Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="block w-full text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-neutral-900 file:text-xs file:font-semibold file:bg-white file:text-neutral-900 hover:file:bg-neutral-100 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3 relative w-48 h-32 rounded-sm overflow-hidden border border-neutral-900 shadow-sm">
                <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/complaints')}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-full flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting & Classifying...' : 'Submit Complaint ↗'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
