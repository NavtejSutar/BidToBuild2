import React, { useState } from 'react';
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
      await api.post(`/complaints/${complaint.id}/resolve`, {
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
