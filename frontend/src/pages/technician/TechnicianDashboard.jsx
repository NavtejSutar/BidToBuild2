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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Technician Work Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Active maintenance tasks assigned to {user?.fullName || user?.email}
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Assigned Tasks</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{assignedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready to be started</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Work currently ongoing</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Critical Priority</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires immediate attention</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Filter Queue:</span>
          <button
            onClick={() => setFilterStatus('')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              filterStatus === '' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setFilterStatus('ASSIGNED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              filterStatus === 'ASSIGNED' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              filterStatus === 'IN_PROGRESS' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading task queue...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-12 text-center">
          <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">No assigned tasks right now</h3>
          <p className="text-xs text-slate-500 mt-1">Great job! All assigned repairs are up to date.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{t.id}</td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex items-center gap-2">
                      <Link to={`/complaints/${t.id}`} className="font-medium text-white hover:text-sky-400">
                        {t.title}
                      </Link>
                      <RecurrenceBadge isRecurring={t.recurring} recurrenceIndex={t.recurrenceIndex} />
                    </div>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">{t.description}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{t.locationName || 'N/A'}</td>
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
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {t.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleStartWork(t.id)}
                          disabled={actionLoadingId === t.id}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-md flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Start
                        </button>
                      )}
                      {t.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => openResolve(t)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolve
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
  );
};
