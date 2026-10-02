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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900 space-y-6">
        <div className="pb-6 border-b border-neutral-900">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // Spatial & Facility Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
            Campus Location Telemetry
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Complaint density, active fault counts, and recurring failure tracking across campus facilities
          </p>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-neutral-500 font-mono text-xs">
            // Loading location data stream...
          </div>
        ) : !summaries || summaries.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center text-xs text-neutral-500">
            No location records found.
          </div>
        ) : (
          <div className="border border-neutral-900 rounded-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-700 font-mono uppercase tracking-wider border-b border-neutral-900">
                <tr>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Building</th>
                  <th className="py-3 px-4 font-semibold">Zone</th>
                  <th className="py-3 px-4 text-center font-semibold">Open Faults</th>
                  <th className="py-3 px-4 text-center font-semibold">Total History</th>
                  <th className="py-3 px-4 text-center font-semibold">Recurrence Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-800 bg-white">
                {summaries.map((loc) => (
                  <tr key={loc.locationId} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-950 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
                      {loc.locationName}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{loc.building}</td>
                    <td className="py-3 px-4 text-neutral-500 font-mono">{loc.zone || 'Campus Core'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={loc.openComplaints > 0 ? 'text-amber-800' : 'text-neutral-400'}>
                        {loc.openComplaints}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-600">
                      {loc.totalComplaints}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {loc.recurringDetected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold bg-amber-100 border border-amber-400 text-amber-900">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          Repeat Cluster
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold bg-neutral-100 border border-neutral-300 text-neutral-700">
                          <CheckCircle className="w-3 h-3 text-neutral-500" />
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
    </div>
  );
};
