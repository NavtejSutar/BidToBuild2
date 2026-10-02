import React from 'react';
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
