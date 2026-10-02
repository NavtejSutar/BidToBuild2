import React from 'react';
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
            const techId = tech.technicianId || tech.technician?.id || tech.id;
            const techName = tech.technicianName || tech.technician?.name || tech.name;
            const techEmail = tech.email || tech.technician?.email;
            const techDept = tech.department || tech.technician?.department || 'General Maintenance';
            const totalTasks = tech.totalOpenTasks ?? tech.totalActiveTasks ?? 0;
            const assignedTasks = tech.assignedTasks ?? tech.assignedCount ?? 0;
            const inProgressTasks = tech.inProgressTasks ?? tech.inProgressCount ?? 0;
            const criticalTasks = tech.criticalTasks ?? tech.priorityDistribution?.CRITICAL ?? 0;

            const isHeavy = totalTasks >= 5;
            const isAvailable = totalTasks === 0;

            return (
              <div
                key={techId}
                className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-semibold text-white">{techName}</h3>
                    <div className="text-xs text-slate-400">{techEmail}</div>
                    <div className="text-[11px] text-sky-400 font-medium mt-0.5">
                      {techDept}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      isAvailable
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                        : isHeavy
                        ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                        : 'bg-sky-950/70 text-sky-300 border-sky-800'
                    }`}
                  >
                    {isAvailable ? 'Available' : isHeavy ? 'Overloaded' : 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Open</div>
                    <div className="text-lg font-bold text-white mt-0.5">{totalTasks}</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Assigned</div>
                    <div className="text-lg font-bold text-sky-400 mt-0.5">{assignedTasks}</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-md border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">In Progress</div>
                    <div className="text-lg font-bold text-indigo-400 mt-0.5">{inProgressTasks}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Critical Priority Tasks:</span>
                  <span
                    className={`font-mono font-bold ${
                      criticalTasks > 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    {criticalTasks}
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
