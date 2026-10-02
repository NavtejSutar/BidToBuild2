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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="bg-white border border-neutral-900 rounded-sm max-w-lg w-full p-6 text-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Resolve Complaint #{complaint.id}
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-neutral-400 hover:text-neutral-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-sm text-rose-950 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-3 space-y-1">
            <div className="text-[11px] font-mono uppercase text-neutral-500">Complaint</div>
            <div className="text-sm font-semibold text-neutral-900">
              {complaint.title}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Resolution Note (Required)
            </label>
            <textarea
              rows={4}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe repairs completed, parts replaced, or tests verified..."
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold uppercase tracking-wider rounded-full cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
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
