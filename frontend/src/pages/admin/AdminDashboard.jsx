import React from 'react';
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
            {isSummaryLoading ? '...' : `${summary?.avgResolutionTimeHours || 0}h`}
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
                    <td className={`py-2.5 px-4 font-mono ${row.critical > 0 ? 'text-rose-400 font-bold bg-rose-950/20' : 'text-slate-500'}`}>
                      {row.critical}
                    </td>
                    <td className={`py-2.5 px-4 font-mono ${row.high > 0 ? 'text-orange-400 font-semibold bg-orange-950/20' : 'text-slate-500'}`}>
                      {row.high}
                    </td>
                    <td className={`py-2.5 px-4 font-mono ${row.medium > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {row.medium}
                    </td>
                    <td className={`py-2.5 px-4 font-mono ${row.low > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
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
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
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
