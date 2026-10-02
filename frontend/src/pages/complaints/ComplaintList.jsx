import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge, PriorityBadge } from '../../components/Badge';
import { RecurrenceBadge } from '../../components/RecurrenceBadge';
import { PriorityScoreChips } from '../../components/PriorityScoreChips';
import { PlusCircle, Search, Filter, Eye, AlertCircle, Clock } from 'lucide-react';

export const ComplaintList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: complaintsPage, isLoading, error } = useQuery({
    queryKey: ['myComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints/my');
      return res.data;
    },
    refetchInterval: 15000, // 15-second live polling
  });

  const complaints = complaintsPage?.content || [];

  const filtered = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
              // Student & Staff Records
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
              Reported Complaints
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Track live lifecycle, AI triage rationale, priority scores, and technician resolution
            </p>
          </div>
          <Link
            to="/complaints/new"
            className="inline-flex items-center px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors self-start sm:self-auto shadow-sm"
          >
            Report Complaint
          </Link>
        </div>

        {/* Filters */}
        <div className="pt-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm pl-9 pr-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 focus:border-neutral-900 focus:bg-white rounded-sm px-3 py-2 text-sm text-neutral-900 focus:outline-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-neutral-500 text-sm font-mono">
            // Loading complaints stream...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-sm text-rose-950 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Failed to load complaints. Please refresh the connection.
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center my-4">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">No complaints found</h3>
            <p className="text-xs text-neutral-500 mt-1">You haven't submitted any matching complaints yet.</p>
          </div>
        ) : (
          <div className="border border-neutral-900 rounded-sm overflow-hidden my-4">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Reported</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-500">#{c.id}</td>
                    <td className="py-3 px-4 font-medium text-neutral-950 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Link to={`/complaints/${c.id}`} className="hover:underline underline-offset-2">
                          {c.title}
                        </Link>
                        <RecurrenceBadge isRecurring={c.recurring} recurrenceIndex={c.recurrenceIndex} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-900">{c.category || 'OTHER'}</span>
                      {c.suggestedCategory && c.suggestedCategory !== c.category && (
                        <span className="block text-[10px] text-teal-700 font-mono">AI: {c.suggestedCategory}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{c.locationName || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <PriorityBadge level={c.priorityLevel} />
                        <PriorityScoreChips score={c.priorityScore} breakdownJson={c.priorityBreakdownJson} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center px-3 py-1 bg-neutral-950 hover:bg-neutral-850 text-white text-[11px] font-semibold uppercase tracking-wider rounded-full transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
