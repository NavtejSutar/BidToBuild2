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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
              // Real-Time Queue Ranking
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
              Dynamic Priority Queue
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Complaints ranked dynamically by urgency base + aging bonus + 30-day recurrence
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm pl-9 pr-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
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
          <div className="p-16 text-center text-neutral-500 font-mono text-xs">
            // Loading dynamic priority queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center text-xs text-neutral-500">
            No complaints currently in priority queue.
          </div>
        ) : (
          <div className="border border-neutral-900 rounded-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Score & Breakdown</th>
                  <th className="py-3 px-4 font-semibold">Complaint Details</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Technician</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                {filtered.map((c, index) => (
                  <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-950">#{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <PriorityBadge level={c.priorityLevel} />
                        <PriorityScoreChips score={c.priorityScore} breakdownJson={c.priorityBreakdownJson} />
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Link to={`/complaints/${c.id}`} className="font-semibold text-neutral-950 hover:underline underline-offset-2">
                          {c.title}
                        </Link>
                        <RecurrenceBadge isRecurring={c.recurring} recurrenceIndex={c.recurrenceIndex} />
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">#{c.id} - {c.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-900">{c.category || 'OTHER'}</span>
                      {c.suggestedCategory && c.suggestedCategory !== c.category && (
                        <span className="block text-[10px] text-[#5a98a8] font-mono">AI: {c.suggestedCategory}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{c.locationName || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {c.assignedTechnicianName || <span className="text-amber-800 font-mono text-[11px]">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => openAssign(c)}
                          className="px-3.5 py-1 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          Assign ↗
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
    </div>
  );
};
