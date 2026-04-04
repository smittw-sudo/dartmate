import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { DrillId, DrillDefinition, DRILL_BY_ID } from '../../data/trainingTypes';
import { useTrainingStore } from '../../store/trainingStore';

interface HistoryBarProps {
  results: { score: number }[];
  higherIsBetter: boolean;
}

function HistoryBars({ results, higherIsBetter }: HistoryBarProps) {
  if (results.length === 0) return null;
  const last10 = results.slice(0, 10).reverse();
  const vals = last10.map(r => r.score);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-1 h-8">
      {last10.map((r, i) => {
        const pct = higherIsBetter
          ? ((r.score - min) / range) * 100
          : ((max - r.score) / range) * 100;
        const isLast = i === last10.length - 1;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${isLast ? 'bg-accent' : 'bg-surface2'}`}
            style={{ height: `${Math.max(15, pct)}%` }}
          />
        );
      })}
    </div>
  );
}

interface DrillShellProps {
  drillId: DrillId;
  children: React.ReactNode;
}

export function DrillShell({ drillId, children }: DrillShellProps) {
  const def = DRILL_BY_ID[drillId];
  const navigate = useNavigate();
  const history = useTrainingStore(s => s.getHistory(drillId));
  const pr = useTrainingStore(s => s.getPR(drillId));

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-3 shrink-0">
        <button onPointerDown={() => navigate('/training')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary leading-tight">{def.title}</h1>
          <p className="text-text-secondary text-xs">{def.subtitle}</p>
        </div>
        {pr !== undefined && (
          <div className="flex items-center gap-1 bg-surface rounded-xl px-3 py-1.5">
            <Trophy size={14} className="text-accent" />
            <span className="text-accent text-sm font-bold tabular">
              {def.higherIsBetter ? '' : ''}{pr}{def.scoringLabel.includes('%') ? '%' : ''}
            </span>
          </div>
        )}
      </div>

      {/* History bars */}
      {history.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <HistoryBars results={history} higherIsBetter={def.higherIsBetter} />
          <p className="text-text-secondary text-xs mt-1">Laatste {Math.min(history.length, 10)} sessies</p>
        </div>
      )}

      {/* Drill content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function useSaveResult(drillId: DrillId) {
  const def = DRILL_BY_ID[drillId];
  const saveResult = useTrainingStore(s => s.saveResult);
  return (score: number, metadata?: Record<string, number>) =>
    saveResult(drillId, score, def.higherIsBetter, metadata);
}
