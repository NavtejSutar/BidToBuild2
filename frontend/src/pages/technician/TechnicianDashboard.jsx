import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';
import { PriorityScoreChips } from '../../components/PriorityScoreChips';
import { RecurrenceBadge } from '../../components/RecurrenceBadge';
import { ResolveModal } from '../../components/ResolveModal';
import {
  Wrench,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  Clock,
  Eye,
  Filter
} from 'lucide-react';

export const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch assigned complaints
  const { data: pageData, isLoading, refetch } = useQuery({
    queryKey: ['technicianAssignedComplaints'],
    queryFn: async () => {
      const res = await api.get('/technicians/assigned');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const tasks = pageData?.content || [];

  const filteredTasks = tasks.filter((t) => {
    if (!filterStatus) return true;
    return t.status === filterStatus;
  });

  const handleStartWork = async (taskId) => {
    setActionLoadingId(taskId);
    try {
      await api.post(`/complaints/${taskId}/start-progress`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start progress');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openResolve = (task) => {
    setSelectedComplaint(task);
    setIsResolveModalOpen(true);
  };

  const assignedCount = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const criticalCount = tasks.filter((t) => t.priorityLevel === 'CRITICAL').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900 space-y-6">
        <div className="pb-6 border-b border-neutral-900">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // Field Dispatch Terminal
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
            Technician Work Queue
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Active maintenance tasks assigned to <span className="font-semibold text-neutral-900">{user?.fullName || user?.email}</span>
          </p>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Assigned Tasks</div>
            <div className="text-2xl sm:text-3xl font-normal text-neutral-950 mt-1">{assignedCount}</div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Ready to be started</div>
          </div>
          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">In Progress</div>
            <div className="text-2xl sm:text-3xl font-normal text-[#5a98a8] mt-1">{inProgressCount}</div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Work currently ongoing</div>
          </div>
          <div className="border border-neutral-900 rounded-sm p-4 bg-rose-50/60 border-rose-900">
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-800 font-semibold">Critical Priority</div>
            <div className="text-2xl sm:text-3xl font-normal text-[#ea4335] mt-1">{criticalCount}</div>
            <div className="text-[10px] text-rose-700 mt-1 font-mono">Requires immediate attention</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">Filter Queue:</span>
            <button
              onClick={() => setFilterStatus('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === ''
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Active
            </button>
            <button
              onClick={() => setFilterStatus('ASSIGNED')}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === 'ASSIGNED'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Assigned
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === 'IN_PROGRESS'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        {isLoading ? (
          <div className="p-16 text-center text-neutral-500 font-mono text-xs">
            // Loading task queue stream...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center">
            <Wrench className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">No assigned tasks right now</h3>
            <p className="text-xs text-neutral-500 mt-1">Great job! All assigned repairs are up to date.</p>
          </div>
        ) : (
          <div className="border border-neutral-900 rounded-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                <tr>
                  <th className="py-3 px-4 font-semibold">Task ID</th>
                  <th className="py-3 px-4 font-semibold">Title & Description</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-500">#{t.id}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <Link to={`/complaints/${t.id}`} className="font-semibold text-neutral-950 hover:underline underline-offset-2">
                          {t.title}
                        </Link>
                        <RecurrenceBadge isRecurring={t.recurring} recurrenceIndex={t.recurrenceIndex} />
                      </div>
                      <p className="text-neutral-500 text-[11px] truncate mt-0.5">{t.description}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{t.locationName || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <PriorityBadge level={t.priorityLevel} />
                        <PriorityScoreChips score={t.priorityScore} breakdownJson={t.priorityBreakdownJson} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/complaints/${t.id}`}
                          className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-colors"
                        >
                          View
                        </Link>
                        {t.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleStartWork(t.id)}
                            disabled={actionLoadingId === t.id}
                            className="px-3.5 py-1 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <PlayCircle className="w-3 h-3" />
                            Start ↗
                          </button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => openResolve(t)}
                            className="px-3.5 py-1 bg-[#5a98a8] hover:bg-[#487a87] text-white text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Resolve ↗
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ResolveModal
          complaint={selectedComplaint}
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          onResolved={refetch}
        />
      </div>
    </div>
  );
};
