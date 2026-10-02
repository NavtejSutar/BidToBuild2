import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { X, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export const AssignModal = ({ complaint, isOpen, onClose, onAssigned }) => {
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch smart suggestions ranked by category skill match and available workload
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['techniciansSuggestions', complaint?.id],
    queryFn: async () => {
      const res = await api.get(`/technicians/suggestions?complaintId=${complaint.id}`);
      return res.data;
    },
    enabled: isOpen && !!complaint?.id,
  });

  // Also fetch all technicians workload as fallback / supplement
  const { data: workloadList, isLoading: workloadLoading } = useQuery({
    queryKey: ['techniciansWorkload'],
    queryFn: async () => {
      const res = await api.get('/technicians/workload');
      return res.data;
    },
    enabled: isOpen,
  });

  const isLoading = suggestionsLoading && workloadLoading;

  // Build list of technicians with priority given to suggestions
  const techOptions = React.useMemo(() => {
    if (suggestions && suggestions.length > 0) {
      return suggestions.map((s) => {
        const t = s.technician || s;
        return {
          id: t.id || s.technicianId,
          name: t.name || s.technicianName,
          email: t.email,
          department: t.department || 'General Maintenance',
          activeTasks: s.activeAssignmentsCount ?? 0,
          skillMatch: s.skillMatch,
          matchScore: s.matchScore,
        };
      });
    }

    if (workloadList && workloadList.length > 0) {
      return workloadList.map((w) => {
        const t = w.technician || w;
        return {
          id: t.id || w.technicianId,
          name: t.name || w.technicianName,
          email: t.email,
          department: t.department || w.department || 'General Maintenance',
          activeTasks: w.totalOpenTasks ?? w.totalActiveTasks ?? 0,
          skillMatch: false,
          matchScore: 0,
        };
      });
    }

    return [];
  }, [suggestions, workloadList]);

  // Set default selection to top recommended technician when list loads
  useEffect(() => {
    if (techOptions.length > 0 && !selectedTechId) {
      setSelectedTechId(String(techOptions[0].id));
    }
  }, [techOptions, selectedTechId]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setErrorMsg('Please select a technician.');
      return;
    }
    const techIdNum = Number(selectedTechId);
    if (isNaN(techIdNum) || techIdNum <= 0) {
      setErrorMsg('Invalid technician ID selected.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post(`/complaints/${complaint.id}/assign`, {
        technicianId: techIdNum,
        note: assignNote.trim() || 'Assigned via Admin Dashboard',
      });
      onAssigned();
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      let msg = 'Failed to assign complaint.';
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        msg = errorData.errors.map((e) => e.message || `${e.field}: ${e.message}`).join(', ');
      } else if (errorData?.message) {
        msg = errorData.message;
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTech = techOptions.find((t) => String(t.id) === String(selectedTechId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <UserCheck className="w-5 h-5 text-sky-400" />
            Assign Complaint #{complaint.id}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
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

          <div className="bg-slate-800/40 border border-slate-800 rounded-md p-3 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Complaint</div>
            <div className="text-sm font-medium text-white">{complaint.title}</div>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span>Category: <strong className="text-slate-200 font-semibold">{complaint.category || 'OTHER'}</strong></span>
              <span>•</span>
              <span>Location: <strong className="text-slate-200 font-semibold">{complaint.locationName || 'N/A'}</strong></span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Select Technician (Ranked by Skill & Availability)
              </label>
              {selectedTech?.skillMatch && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Sparkles className="w-3 h-3" /> Skill Match
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="text-xs text-slate-500 py-3 text-center">Loading available technicians...</div>
            ) : techOptions.length === 0 ? (
              <div className="text-xs text-rose-400 py-2">No active technicians found in system.</div>
            ) : (
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select a technician...</option>
                {techOptions.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.department}) — {tech.activeTasks} active task{tech.activeTasks !== 1 ? 's' : ''}
                    {tech.skillMatch ? ' [RECOMMENDED]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assignment Note</label>
            <input
              type="text"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              placeholder="e.g. Priority inspection requested before 3 PM"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isLoading || !selectedTechId}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors"
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
