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
      <div className="bg-white border border-neutral-900 rounded-sm p-6 sm:p-8 shadow-xl text-neutral-900">
        <div className="pb-6 border-b border-neutral-900 mb-6">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-1">
            // Personnel & Resource Balancing
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-950">
            Technician Workload Analysis
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor open task load, active repair distribution, and availability across maintenance technicians
          </p>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-neutral-500 font-mono text-xs">
            // Loading technician workloads stream...
          </div>
        ) : !workload || workload.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-sm p-12 text-center text-xs text-neutral-500">
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
                  className="bg-white border border-neutral-900 rounded-sm p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">{techName}</h3>
                      <div className="text-xs text-neutral-500">{techEmail}</div>
                      <div className="text-[11px] font-mono text-[#5a98a8] font-medium mt-0.5">
                        {techDept}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isHeavy
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                      }`}
                    >
                      {isAvailable ? 'Available' : isHeavy ? 'Overloaded' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                      <div className="text-[10px] uppercase font-mono text-neutral-500 font-semibold">Total</div>
                      <div className="text-lg font-bold text-neutral-950 mt-0.5">{totalTasks}</div>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                      <div className="text-[10px] uppercase font-mono text-neutral-500 font-semibold">Assigned</div>
                      <div className="text-lg font-bold text-neutral-900 mt-0.5">{assignedTasks}</div>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                      <div className="text-[10px] uppercase font-mono text-neutral-500 font-semibold">In Progress</div>
                      <div className="text-lg font-bold text-[#5a98a8] mt-0.5">{inProgressTasks}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-mono text-[11px]">Critical Tasks:</span>
                    <span
                      className={`font-mono font-bold ${
                        criticalTasks > 0 ? 'text-[#ea4335]' : 'text-neutral-400'
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
    </div>
  );
};
