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
    if (val >= 75) return 'text-rose-400 bg-rose-950/50 border-rose-800';
    if (val >= 50) return 'text-orange-400 bg-orange-950/50 border-orange-800';
    if (val >= 25) return 'text-amber-400 bg-amber-950/50 border-amber-800';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className={`px-2 py-0.5 rounded-md font-semibold border ${getScoreColor(score)}`}>
        Score {score}
      </span>
      {breakdown && (
        <>
          <span
            title={`Urgency base score: ${breakdown.urgencyBase}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            Base: {breakdown.urgencyBase}
          </span>
          <span
            title={`Aging bonus: ${breakdown.agingBonus} (${breakdown.hoursOpen || 0}h open)`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
          >
            <Clock className="w-3 h-3 text-sky-400" />
            Aging: +{breakdown.agingBonus}
          </span>
          {breakdown.recurrenceBonus > 0 && (
            <span
              title={`Recurrence bonus: ${breakdown.recurrenceBonus} (index ${breakdown.recurrenceIndex})`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/50 border border-amber-800 text-amber-300 text-[11px]"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              Recur: +{breakdown.recurrenceBonus}
            </span>
          )}
        </>
      )}
    </div>
  );
};
