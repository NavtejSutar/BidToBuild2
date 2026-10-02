import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge, PriorityBadge } from '../../components/Badge';
import { PriorityScoreChips } from '../../components/PriorityScoreChips';
import { RecurrenceBadge } from '../../components/RecurrenceBadge';
import { AssignModal } from '../../components/AssignModal';
import {
  ListTodo,
  Search,
  Filter,
  UserCheck,
  Eye,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';

export const PriorityQueue = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch all open complaints sorted by priorityScore desc
  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ['adminPriorityQueue'],
    queryFn: async () => {
      const res = await api.get('/complaints/queue');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const complaints = Array.isArray(queue) ? queue : queue?.content || [];

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openAssign = (c) => {
    setSelectedComplaint(c);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dynamic Priority Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complaints ranked dynamically by urgency base + aging bonus + 30-day recurrence
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Categories</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="IT">IT Infrastructure</option>
            <option value="HVAC">HVAC</option>
            <option value="CIVIL">Civil</option>
            <option value="FURNITURE">Furniture</option>
            <option value="CLEANING">Cleaning</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading priority queue...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-12 text-center text-xs text-slate-400">
          No complaints currently in priority queue.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-800/70 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Score & Breakdown</th>
                <th className="py-3 px-4">Complaint Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.map((c, index) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">#{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <PriorityBadge level={c.priorityLevel} />
                      <PriorityScoreChips score={c.priorityScore} breakdownJson={c.priorityBreakdownJson} />
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <Link to={`/complaints/${c.id}`} className="font-semibold text-white hover:text-sky-400">
                        {c.title}
                      </Link>
                      <RecurrenceBadge isRecurring={c.recurring} recurrenceIndex={c.recurrenceIndex} />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">#{c.id} - {c.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300">{c.category || 'OTHER'}</span>
                    {c.suggestedCategory && c.suggestedCategory !== c.category && (
                      <span className="block text-[10px] text-sky-400">AI: {c.suggestedCategory}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{c.locationName || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {c.assignedTechnicianName || <span className="text-amber-400 italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openAssign(c)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssignModal
        complaint={selectedComplaint}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={refetch}
      />
    </div>
  );
};
