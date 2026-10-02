const fs = require('fs');
const path = require('path');

function writeFrontendFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', 'frontend', 'src', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote: ' + relPath);
}

// 7. pages/admin/AdminDashboard.jsx
writeFrontendFile('pages/admin/AdminDashboard.jsx', `import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  LayoutDashboard,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  MapPin,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const AdminDashboard = () => {
  // Fetch summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['adminDashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Fetch status x priority matrix
  const { data: matrixData, isLoading: isMatrixLoading } = useQuery({
    queryKey: ['adminStatusPriorityMatrix'],
    queryFn: async () => {
      const res = await api.get('/analytics/matrix');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const categoryChartData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const BAR_COLORS = ['#0284c7', '#38bdf8', '#0ea5e9', '#0369a1', '#075985', '#64748b', '#94a3b8', '#cbd5e1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Campus Maintenance Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time facility operations, priority scoring, and triage telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/priority-queue"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md shadow-sm"
          >
            Open Priority Queue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Filed</div>
          <div className="text-2xl font-bold text-white mt-1">
            {isSummaryLoading ? '...' : summary?.totalComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">All time complaints</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Open Backlog</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {isSummaryLoading ? '...' : summary?.openComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active uncompleted</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {isSummaryLoading ? '...' : summary?.inProgressComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under repair</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Resolved</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {isSummaryLoading ? '...' : summary?.resolvedComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Completed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Critical Active</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {isSummaryLoading ? '...' : summary?.criticalComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immediate hazard</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Avg Resolution</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {isSummaryLoading ? '...' : \`\${summary?.avgResolutionTimeHours || 0}h\`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Turnaround time</div>
        </div>
      </div>

      {/* Status by Priority 2D Matrix (PS-07 Requirement) */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Status by Priority Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live two-dimensional distribution of complaints by current lifecycle status and dynamic priority
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            Grand Total: {matrixData?.grandTotal || 0}
          </span>
        </div>

        {isMatrixLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading matrix data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-xs text-center">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 text-left">Status</th>
                  <th className="py-2.5 px-4 text-rose-400">Critical</th>
                  <th className="py-2.5 px-4 text-orange-400">High</th>
                  <th className="py-2.5 px-4 text-amber-400">Medium</th>
                  <th className="py-2.5 px-4 text-slate-400">Low</th>
                  <th className="py-2.5 px-4 bg-slate-800/90 font-bold text-white">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {matrixData?.rows?.map((row) => (
                  <tr key={row.status} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-semibold text-left text-slate-300">
                      {row.status.replace('_', ' ')}
                    </td>
                    <td className={\`py-2.5 px-4 font-mono \${row.critical > 0 ? 'text-rose-400 font-bold bg-rose-950/20' : 'text-slate-500'}\`}>
                      {row.critical}
                    </td>
                    <td className={\`py-2.5 px-4 font-mono \${row.high > 0 ? 'text-orange-400 font-semibold bg-orange-950/20' : 'text-slate-500'}\`}>
                      {row.high}
                    </td>
                    <td className={\`py-2.5 px-4 font-mono \${row.medium > 0 ? 'text-amber-400' : 'text-slate-500'}\`}>
                      {row.medium}
                    </td>
                    <td className={\`py-2.5 px-4 font-mono \${row.low > 0 ? 'text-slate-300' : 'text-slate-500'}\`}>
                      {row.low}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-white bg-slate-800/50 font-mono">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800/70 font-semibold text-white">
                <tr>
                  <td className="py-2.5 px-4 text-left font-bold text-slate-300">Total</td>
                  <td className="py-2.5 px-4 font-mono text-rose-400">
                    {matrixData?.columnTotals?.CRITICAL || 0}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-orange-400">
                    {matrixData?.columnTotals?.HIGH || 0}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-amber-400">
                    {matrixData?.columnTotals?.MEDIUM || 0}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">
                    {matrixData?.columnTotals?.LOW || 0}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-sky-400 font-bold bg-slate-800">
                    {matrixData?.grandTotal || 0}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Category Chart & Location Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Complaints by Category</h2>
          <div className="h-64 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category data available.
              </div>
            )}
          </div>
        </div>

        {/* Top Location Hotspots */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Location Hotspots</h2>
            <Link to="/admin/locations" className="text-xs text-sky-400 hover:underline">
              View all
            </Link>
          </div>

          {summary?.topLocations && summary.topLocations.length > 0 ? (
            <div className="space-y-3">
              {summary.topLocations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="p-3 bg-slate-800/40 rounded-md border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {loc.locationName}
                    </div>
                    <div className="text-[11px] text-slate-400">{loc.building}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-semibold text-amber-400">
                      {loc.openComplaints} open / {loc.totalComplaints} total
                    </div>
                    {loc.recurringDetected && (
                      <span className="inline-block text-[10px] px-2 py-0.5 bg-amber-950/80 border border-amber-700 text-amber-300 rounded-md">
                        Repeat Faults
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">No hotspot data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
`);

// 8. pages/admin/PriorityQueue.jsx
writeFrontendFile('pages/admin/PriorityQueue.jsx', `import React, { useState } from 'react';
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
                      <Link to={\`/complaints/\${c.id}\`} className="font-semibold text-white hover:text-sky-400">
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
                        to={\`/complaints/\${c.id}\`}
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
`);

// 9. pages/admin/WorkerWorkload.jsx
writeFrontendFile('pages/admin/WorkerWorkload.jsx', `import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Users, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const WorkerWorkload = () => {
  const { data: workload, isLoading } = useQuery({
    queryKey: ['workerWorkloadView'],
    queryFn: async () => {
      const res = await api.get('/technicians/workload');
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Technician Workload Analysis</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor open task load, active repair distribution, and availability across maintenance technicians
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading technician workloads...</div>
      ) : !workload || workload.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-12 text-center text-xs text-slate-400">
          No registered technicians found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workload.map((tech) => {
            const isHeavy = tech.totalOpenTasks >= 5;
            const isAvailable = tech.totalOpenTasks === 0;

            return (
              <div
                key={tech.technicianId}
                className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-semibold text-white">{tech.technicianName}</h3>
                    <div className="text-xs text-slate-400">{tech.email}</div>
                    <div className="text-[11px] text-sky-400 font-medium mt-0.5">
                      {tech.department || 'General Maintenance'}
                    </div>
                  </div>
                  <span
                    className={\`px-2.5 py-0.5 rounded-md text-xs font-medium border \${
                      isAvailable
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                        : isHeavy
                        ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                        : 'bg-sky-950/70 text-sky-300 border-sky-800'
                    }\`}
                  >
                    {isAvailable ? 'Available' : isHeavy ? 'Overloaded' : 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Open</div>
                    <div className="text-lg font-bold text-white mt-0.5">{tech.totalOpenTasks}</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Assigned</div>
                    <div className="text-lg font-bold text-sky-400 mt-0.5">{tech.assignedTasks}</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">In Progress</div>
                    <div className="text-lg font-bold text-indigo-400 mt-0.5">{tech.inProgressTasks}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Critical Priority Tasks:</span>
                  <span
                    className={\`font-mono font-bold \${
                      tech.criticalTasks > 0 ? 'text-rose-400' : 'text-slate-500'
                    }\`}
                  >
                    {tech.criticalTasks}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
`);

// 10. pages/admin/LocationSummary.jsx
writeFrontendFile('pages/admin/LocationSummary.jsx', `import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

export const LocationSummary = () => {
  const { data: summaries, isLoading } = useQuery({
    queryKey: ['locationSummaryView'],
    queryFn: async () => {
      const res = await api.get('/locations/summary');
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Campus Location Telemetry</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complaint density, active fault counts, and recurring failure tracking across campus facilities
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading location data...</div>
      ) : !summaries || summaries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-12 text-center text-xs text-slate-400">
          No location records found.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-800/70 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4 text-center">Open Faults</th>
                <th className="py-3 px-4 text-center">Total History</th>
                <th className="py-3 px-4 text-center">Recurrence Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {summaries.map((loc) => (
                <tr key={loc.locationId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    {loc.locationName}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{loc.building}</td>
                  <td className="py-3 px-4 text-slate-400">{loc.zone || 'Campus Core'}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className={loc.openComplaints > 0 ? 'text-amber-400' : 'text-slate-500'}>
                      {loc.openComplaints}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {loc.totalComplaints}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {loc.recurringDetected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950/70 border border-amber-800 text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Repeat Cluster
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/40 border border-emerald-900 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
`);

// 11. App.jsx
writeFrontendFile('App.jsx', `import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TermsModal, PrivacyModal } from './components/LegalModals';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ComplaintList } from './pages/complaints/ComplaintList';
import { NewComplaint } from './pages/complaints/NewComplaint';
import { ComplaintDetail } from './pages/complaints/ComplaintDetail';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PriorityQueue } from './pages/admin/PriorityQueue';
import { WorkerWorkload } from './pages/admin/WorkerWorkload';
import { LocationSummary } from './pages/admin/LocationSummary';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-400">Loading auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/complaints" replace />;
  }
  return children;
};

export const App = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                onOpenTerms={() => setIsTermsOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
              />
            }
          />
          <Route
            path="/register"
            element={
              <Register
                onOpenTerms={() => setIsTermsOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
              />
            }
          />

          {/* User Routes */}
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/new"
            element={
              <ProtectedRoute>
                <NewComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Technician Routes */}
          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/priority-queue"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PriorityQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workload"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <WorkerWorkload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LocationSummary />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/complaints" replace />} />
          <Route path="*" element={<Navigate to="/complaints" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>CampusOps Smart Maintenance & Predictive Complaint Management System</div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-slate-300">
              Terms & Conditions
            </button>
            <span>•</span>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-300">
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
`);

// 12. main.jsx
writeFrontendFile('main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 15000, // 15-second polling per architecture spec
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
`);
