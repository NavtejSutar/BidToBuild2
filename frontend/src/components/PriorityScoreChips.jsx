import React from 'react';
import { Flame, Clock, RefreshCw } from 'lucide-react';

export const PriorityScoreChips = ({ score, breakdownJson }) => {
  let breakdown = null;
  if (breakdownJson) {
    try {
      breakdown = typeof breakdownJson === 'string' ? JSON.parse(breakdownJson) : breakdownJson;
    } catch (e) {
      // fallback
    }
  }

  const getScoreColor = (val) => {
    if (val >= 75) return 'text-rose-950 bg-rose-50 border-rose-300';
    if (val >= 50) return 'text-orange-950 bg-orange-50 border-orange-300';
    if (val >= 25) return 'text-amber-950 bg-amber-50 border-amber-300';
    return 'text-neutral-800 bg-neutral-100 border-neutral-300';
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
      <span className={`px-2 py-0.5 rounded-full font-bold border ${getScoreColor(score)}`}>
        Score {score}
      </span>
      {breakdown && (
        <>
          <span
            title={`Urgency base score: ${breakdown.urgencyBase}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 text-[11px]"
          >
            <Flame className="w-3 h-3 text-orange-500" />
            Base: {breakdown.urgencyBase}
          </span>
          <span
            title={`Aging bonus: ${breakdown.agingBonus} (${breakdown.hoursOpen || 0}h open)`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 text-[11px]"
          >
            <Clock className="w-3 h-3 text-sky-600" />
            Aging: +{breakdown.agingBonus}
          </span>
          {breakdown.recurrenceBonus > 0 && (
            <span
              title={`Recurrence bonus: ${breakdown.recurrenceBonus} (index ${breakdown.recurrenceIndex})`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px]"
            >
              <RefreshCw className="w-3 h-3 text-amber-600" />
              Recur: +{breakdown.recurrenceBonus}
            </span>
          )}
        </>
      )}
    </div>
  );
};
