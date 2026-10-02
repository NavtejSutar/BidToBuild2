import React, { useState } from 'react';
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
      await api.post(`/complaints/${complaint.id}/assign`, {
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
