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

  const BAR_COLORS = ['#ea4335', '#5a98a8', '#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#525252'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
              // Telemetry & Facility Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
              Campus Maintenance Analytics
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Real-time facility telemetry, Groq AI triage rationale, and dynamic priority scoring distribution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/priority-queue"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm transition-colors cursor-pointer"
            >
              Priority Queue ↗
            </Link>
          </div>
        </div>

        {/* Metric Cards - 6 modular blocks with 1px black borders */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Total Filed</div>
            <div className="text-2xl sm:text-3xl font-normal text-neutral-950 mt-1">
              {isSummaryLoading ? '...' : summary?.totalComplaints || 0}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">All-time registry</div>
          </div>

          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Open Backlog</div>
            <div className="text-2xl sm:text-3xl font-normal text-amber-700 mt-1">
              {isSummaryLoading ? '...' : summary?.openComplaints || 0}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Active pending</div>
          </div>

          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">In Progress</div>
            <div className="text-2xl sm:text-3xl font-normal text-[#5a98a8] mt-1">
              {isSummaryLoading ? '...' : summary?.inProgressComplaints || 0}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Under repair</div>
          </div>

          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Resolved</div>
            <div className="text-2xl sm:text-3xl font-normal text-emerald-700 mt-1">
              {isSummaryLoading ? '...' : summary?.resolvedComplaints || 0}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Completed fixes</div>
          </div>

          <div className="border border-neutral-900 rounded-sm p-4 bg-rose-50/60 border-rose-900">
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-800 font-semibold">Critical Active</div>
            <div className="text-2xl sm:text-3xl font-normal text-[#ea4335] mt-1">
              {isSummaryLoading ? '...' : summary?.criticalComplaints || 0}
            </div>
            <div className="text-[10px] text-rose-700 mt-1 font-mono">Immediate safety</div>
          </div>

          <div className="border border-neutral-900 rounded-sm p-4 bg-neutral-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Avg Resolution</div>
            <div className="text-2xl sm:text-3xl font-normal text-neutral-900 mt-1">
              {isSummaryLoading ? '...' : `${summary?.avgResolutionTimeHours || 0}h`}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">Turnaround SLA</div>
          </div>
        </div>
      </div>

      {/* Status by Priority 2D Matrix (PS-07 Requirement) */}
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-0.5">
              // Cross-Tabulation Matrix
            </div>
            <h2 className="text-lg font-semibold text-neutral-950">Status × Priority Distribution</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Two-dimensional matrix of complaints across lifecycle statuses and dynamic priority tiers
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-800 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-300">
            Grand Total: <span className="font-bold">{matrixData?.grandTotal || 0}</span>
          </span>
        </div>

        {isMatrixLoading ? (
          <div className="py-12 text-center text-neutral-500 font-mono text-xs">
            // Loading cross-tabulation matrix...
          </div>
        ) : (
          <div className="border border-neutral-900 rounded-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200 text-xs text-center">
              <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-rose-700 font-semibold">Critical</th>
                  <th className="py-3 px-4 text-orange-700 font-semibold">High</th>
                  <th className="py-3 px-4 text-amber-700 font-semibold">Medium</th>
                  <th className="py-3 px-4 text-neutral-600 font-semibold">Low</th>
                  <th className="py-3 px-4 bg-neutral-100 font-bold text-neutral-950 border-l border-neutral-300">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                {matrixData?.rows?.map((row) => (
                  <tr key={row.status} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-left text-neutral-900">
                      {row.status.replace('_', ' ')}
                    </td>
                    <td className={`py-3 px-4 font-mono ${row.critical > 0 ? 'text-rose-700 font-bold bg-rose-50/60' : 'text-neutral-400'}`}>
                      {row.critical}
                    </td>
                    <td className={`py-3 px-4 font-mono ${row.high > 0 ? 'text-orange-700 font-semibold bg-orange-50/50' : 'text-neutral-400'}`}>
                      {row.high}
                    </td>
                    <td className={`py-3 px-4 font-mono ${row.medium > 0 ? 'text-amber-700 font-medium' : 'text-neutral-400'}`}>
                      {row.medium}
                    </td>
                    <td className={`py-3 px-4 font-mono ${row.low > 0 ? 'text-neutral-700' : 'text-neutral-400'}`}>
                      {row.low}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-950 bg-neutral-50/80 font-mono border-l border-neutral-300">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-100 font-semibold text-neutral-950 border-t-2 border-neutral-900">
                <tr>
                  <td className="py-3 px-4 text-left font-bold text-neutral-900 font-mono uppercase">Total</td>
                  <td className="py-3 px-4 font-mono text-rose-700 font-bold">
                    {matrixData?.columnTotals?.CRITICAL || 0}
                  </td>
                  <td className="py-3 px-4 font-mono text-orange-700 font-bold">
                    {matrixData?.columnTotals?.HIGH || 0}
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-700 font-bold">
                    {matrixData?.columnTotals?.MEDIUM || 0}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-700 font-bold">
                    {matrixData?.columnTotals?.LOW || 0}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-950 font-bold bg-neutral-200 border-l border-neutral-300">
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
        <div className="bg-white border border-neutral-900 rounded-sm p-6 shadow-xl text-neutral-900 space-y-4">
          <div className="pb-3 border-b border-neutral-200">
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-0.5">
              // Volume Breakdown
            </div>
            <h2 className="text-base font-semibold text-neutral-950">Complaints by Category</h2>
          </div>
          <div className="h-64 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#171717',
                      borderRadius: '0.125rem',
                      fontSize: '12px',
                      color: '#171717',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-mono">
                No category data available.
              </div>
            )}
          </div>
        </div>

        {/* Top Location Hotspots */}
        <div className="bg-white border border-neutral-900 rounded-sm p-6 shadow-xl text-neutral-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-0.5">
                // Spatial Concentration
              </div>
              <h2 className="text-base font-semibold text-neutral-950">Location Hotspots</h2>
            </div>
            <Link
              to="/admin/locations"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
            >
              View all ↗
            </Link>
          </div>

          {summary?.topLocations && summary.topLocations.length > 0 ? (
            <div className="space-y-3">
              {summary.topLocations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="p-3.5 bg-neutral-50 rounded-sm border border-neutral-300 flex items-center justify-between hover:border-neutral-900 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-neutral-950 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                      {loc.locationName}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">{loc.building}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-mono font-semibold text-neutral-900">
                      {loc.openComplaints} open / {loc.totalComplaints} total
                    </div>
                    {loc.recurringDetected && (
                      <span className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-900 rounded-full font-semibold">
                        Repeat Faults
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400 font-mono">No hotspot data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
