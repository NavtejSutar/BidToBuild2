import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const RecurrenceBadge = ({ isRecurring, recurrenceIndex }) => {
  if (!isRecurring && recurrenceIndex <= 0) return null;

  return (
    <span
      title={`Repeat occurrences in past 30 days: ${recurrenceIndex}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-700 text-amber-300 text-xs font-medium"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      Recurring ({recurrenceIndex})
    </span>
  );
};
