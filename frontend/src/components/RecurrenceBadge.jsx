import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const RecurrenceBadge = ({ isRecurring, recurrenceIndex }) => {
  if (!isRecurring && recurrenceIndex <= 0) return null;

  return (
    <span
      title={`Repeat occurrences in past 30 days: ${recurrenceIndex}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-mono font-medium"
    >
      <AlertTriangle className="w-3 h-3 text-amber-600" />
      Recurring ({recurrenceIndex})
    </span>
  );
};
