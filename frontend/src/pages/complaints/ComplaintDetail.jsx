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
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Registry
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {complaint.assignedTechnicianName ? 'Reassign Tech ↗' : 'Assign Technician ↗'}
            </button>
          )}

          {isAssignedTech && complaint.status === 'ASSIGNED' && (
            <button
              onClick={handleStartProgress}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Work ↗
            </button>
          )}

          {isAssignedTech && complaint.status === 'IN_PROGRESS' && (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5a98a8] hover:bg-[#487a87] text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Resolved ↗
            </button>
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-neutral-900">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500">
              // Incident Dossier #{complaint.id}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={complaint.status} />
              <PriorityBadge level={complaint.priorityLevel} />
              <RecurrenceBadge isRecurring={complaint.recurring} recurrenceIndex={complaint.recurrenceIndex} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal text-neutral-950 tracking-tight pt-1">
              {complaint.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-neutral-900" />
                {complaint.locationName || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                Reporter: {complaint.reporterName || complaint.reporterEmail}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-900 min-w-[220px]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 mb-1.5 font-semibold">
              Dynamic Score
            </div>
            <PriorityScoreChips score={complaint.priorityScore} breakdownJson={complaint.priorityBreakdownJson} />
          </div>
        </div>

        {/* Category & AI Suggested Category Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
              Reporter Selected Category
            </div>
            <div className="text-base font-semibold text-neutral-950">
              {complaint.category || 'OTHER'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">Primary authoritative category</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-sm border border-neutral-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5a98a8]" />
              Groq AI Suggested Category
            </div>
            <div className="text-base font-semibold text-[#487a87]">
              {complaint.suggestedCategory || complaint.category || 'PENDING'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {complaint.classificationSource ? `Classified by ${complaint.classificationSource}` : 'Synchronous triage complete'}
            </p>
          </div>
        </div>

        {/* Description & Photo */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">Description</h3>
            <p className="text-sm text-neutral-800 bg-neutral-50 p-4 rounded-sm border border-neutral-300 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {complaint.imagePath && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">Attached Photo</h3>
              <div className="max-w-md rounded-sm overflow-hidden border border-neutral-900 bg-neutral-100 shadow-sm">
                <img
                  src={`/${complaint.imagePath.replace(/^\/+/, '')}`}
                  alt="Fault photo"
                  className="w-full h-auto object-cover max-h-80"
                />
              </div>
            </div>
          )}
        </div>

        {/* PS-07 Recurrence History Section */}
        <div className="pt-6 border-t border-neutral-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
                Location Recurrence History (Past 30 Days)
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-600">
              {recurrenceHistory ? `${recurrenceHistory.length} earlier issue(s) detected` : 'None'}
            </span>
          </div>

          {recurrenceHistory && recurrenceHistory.length > 0 ? (
            <div className="border border-neutral-900 rounded-sm overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Complaint ID</th>
                    <th className="py-2.5 px-3 font-semibold">Title</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                  {recurrenceHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/70">
                      <td className="py-2 px-3 font-mono text-neutral-600">
                        <Link to={`/complaints/${item.id}`} className="hover:underline underline-offset-2 font-medium text-neutral-950">
                          #{item.id}
                        </Link>
                      </td>
                      <td className="py-2 px-3 font-medium text-neutral-950">{item.title}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-2 px-3">
                        <PriorityBadge level={item.priorityLevel} />
                      </td>
                      <td className="py-2 px-3 text-neutral-500 font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-sm border border-neutral-200">
              No earlier complaints found in this location and category within the 30-day window.
            </p>
          )}
        </div>

        {/* Transition History Timeline */}
        <div className="pt-6 border-t border-neutral-900 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              Status Transition History
            </h3>
          </div>

          {complaint.history && complaint.history.length > 0 ? (
            <div className="space-y-2">
              {complaint.history.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 rounded-sm border border-neutral-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">{h.actorName || h.actorEmail}</span>
                    <span className="text-neutral-500">transitioned from</span>
                    <span className="text-neutral-600 font-mono">{h.fromStatus || 'START'}</span>
                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-950 font-mono font-semibold">{h.toStatus}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
                    {h.note && <span className="italic text-neutral-700">"{h.note}"</span>}
                    <span>{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-500">No transition records found.</div>
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
