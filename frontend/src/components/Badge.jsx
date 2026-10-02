import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    REPORTED: 'bg-amber-50 text-amber-900 border-amber-300',
    ASSIGNED: 'bg-sky-50 text-sky-900 border-sky-300',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    RESOLVED: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  };

  const style = statusStyles[status] || 'bg-neutral-100 text-neutral-800 border-neutral-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border ${style}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const PriorityBadge = ({ level }) => {
  const levelStyles = {
    CRITICAL: 'bg-rose-50 text-rose-950 border-rose-300 font-bold',
    HIGH: 'bg-orange-50 text-orange-950 border-orange-300',
    MEDIUM: 'bg-amber-50 text-amber-950 border-amber-300',
    LOW: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  };

  const style = levelStyles[level] || 'bg-neutral-100 text-neutral-800 border-neutral-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border ${style}`}>
      {level || 'LOW'}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const urgencyStyles = {
    CRITICAL: 'text-rose-600 font-bold',
    HIGH: 'text-orange-600 font-semibold',
    MEDIUM: 'text-amber-600 font-semibold',
    LOW: 'text-neutral-600 font-medium',
  };

  return (
    <span className={`text-xs font-mono uppercase tracking-wider ${urgencyStyles[urgency] || 'text-neutral-500'}`}>
      {urgency || 'LOW'}
    </span>
  );
};
