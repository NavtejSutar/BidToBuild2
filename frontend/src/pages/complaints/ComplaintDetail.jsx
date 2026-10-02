import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';
import { PriorityScoreChips } from '../../components/PriorityScoreChips';
import { RecurrenceBadge } from '../../components/RecurrenceBadge';
import { AssignModal } from '../../components/AssignModal';
import { ResolveModal } from '../../components/ResolveModal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Clock,
  Sparkles,
  History,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch complaint detail with 15s polling
  const { data: complaint, isLoading, refetch } = useQuery({
    queryKey: ['complaintDetail', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`);
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Fetch recurrence history (PS-07 requirement)
  const { data: recurrenceHistory } = useQuery({
    queryKey: ['recurrenceHistory', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}/recurrence-history`);
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading complaint #{id}...</div>;
  }

  if (!complaint) {
    return <div className="p-12 text-center text-rose-400">Complaint not found.</div>;
  }

  const isAssignedTech = user?.role === 'TECHNICIAN' && complaint.assignedTechnicianId === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  const handleStartProgress = async () => {
    setActionLoading(true);
    try {
      await api.post(`/complaints/${id}/start-progress`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start progress');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={isAdmin ? '/admin/priority-queue' : '/complaints'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md"
            >
              <UserCheck className="w-4 h-4" />
              {complaint.assignedTechnicianName ? 'Reassign' : 'Assign Technician'}
            </button>
          )}

          {isAssignedTech && complaint.status === 'ASSIGNED' && (
            <button
              onClick={handleStartProgress}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-md"
            >
              <PlayCircle className="w-4 h-4" />
              Start Work
            </button>
          )}

          {isAssignedTech && complaint.status === 'IN_PROGRESS' && (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-400">#{complaint.id}</span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge level={complaint.priorityLevel} />
              <RecurrenceBadge isRecurring={complaint.recurring} recurrenceIndex={complaint.recurrenceIndex} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {complaint.locationName || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reported by: {complaint.reporterName || complaint.reporterEmail}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-md border border-slate-700/60 min-w-[200px] text-right sm:text-left">
            <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Dynamic Priority</div>
            <PriorityScoreChips score={complaint.priorityScore} breakdownJson={complaint.priorityBreakdownJson} />
          </div>
        </div>

        {/* Category & AI Suggested Category Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/40 rounded-md border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </div>
            <div className="text-base font-semibold text-white">
              {complaint.category || 'OTHER'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Primary category selected by reporter</p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-md border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Groq AI Suggested Category
            </div>
            <div className="text-base font-semibold text-sky-300">
              {complaint.suggestedCategory || complaint.category || 'PENDING'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {complaint.classificationSource ? `Classified by ${complaint.classificationSource}` : 'Synchronous triage complete'}
            </p>
          </div>
        </div>

        {/* Description & Photo */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
            <p className="text-sm text-slate-200 bg-slate-800/30 p-4 rounded-md border border-slate-800 whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {complaint.imagePath && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Attached Photo</h3>
              <div className="max-w-md rounded-md overflow-hidden border border-slate-700 bg-slate-800">
                <img
                  src={`http://localhost:8080/${complaint.imagePath.replace(/^\/+/, '')}`}
                  alt="Fault photo"
                  className="w-full h-auto object-cover max-h-80"
                />
              </div>
            </div>
          )}
        </div>

        {/* PS-07 Recurrence History Section */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Location Recurrence History (Past 30 Days)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {recurrenceHistory ? `${recurrenceHistory.length} earlier issue(s) detected` : 'None'}
            </span>
          </div>

          {recurrenceHistory && recurrenceHistory.length > 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-slate-700 text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Complaint ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {recurrenceHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/30">
                      <td className="py-2 px-3 font-mono text-slate-400">
                        <Link to={`/complaints/${item.id}`} className="text-sky-400 hover:underline">
                          #{item.id}
                        </Link>
                      </td>
                      <td className="py-2 px-3 font-medium text-white">{item.title}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-2 px-3">
                        <PriorityBadge level={item.priorityLevel} />
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 bg-slate-800/30 p-3 rounded-md border border-slate-800/50">
              No earlier complaints found in this location and category within the 30-day window.
            </p>
          )}
        </div>

        {/* Transition History Timeline */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Status Transition History</h3>
          </div>

          {complaint.history && complaint.history.length > 0 ? (
            <div className="space-y-2">
              {complaint.history.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/40 rounded-md border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{h.actorName || h.actorEmail}</span>
                    <span className="text-slate-500">transitioned from</span>
                    <span className="text-slate-400 font-mono">{h.fromStatus || 'START'}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-sky-300 font-mono font-semibold">{h.toStatus}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    {h.note && <span className="italic text-slate-300">"{h.note}"</span>}
                    <span>{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">No transition records found.</div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        complaint={complaint}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={refetch}
      />
      <ResolveModal
        complaint={complaint}
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onResolved={refetch}
      />
    </div>
  );
};
