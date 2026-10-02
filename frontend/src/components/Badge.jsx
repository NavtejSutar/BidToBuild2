import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    REPORTED: 'bg-amber-950/70 text-amber-300 border-amber-800',
    ASSIGNED: 'bg-blue-950/70 text-blue-300 border-blue-800',
    IN_PROGRESS: 'bg-sky-950/70 text-sky-300 border-sky-800',
    RESOLVED: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
  };

  const style = statusStyles[status] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const PriorityBadge = ({ level }) => {
  const levelStyles = {
    CRITICAL: 'bg-rose-950/70 text-rose-300 border-rose-800 animate-pulse',
    HIGH: 'bg-orange-950/70 text-orange-300 border-orange-800',
    MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-800',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const style = levelStyles[level] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {level || 'LOW'}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const urgencyStyles = {
    CRITICAL: 'text-rose-400 font-semibold',
    HIGH: 'text-orange-400 font-semibold',
    MEDIUM: 'text-amber-400 font-semibold',
    LOW: 'text-slate-400 font-semibold',
  };

  return (
    <span className={`text-xs ${urgencyStyles[urgency] || 'text-slate-400'}`}>
      {urgency || 'LOW'}
    </span>
  );
};
