import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { DrillId, DRILL_BY_ID } from '../../data/trainingTypes';
import { useTrainingStore } from '../../store/trainingStore';
import { useAppStore } from '../../store/appStore';

function HistoryBars({ scores, higherIsBetter }: { scores: number[]; higherIsBetter: boolean }) {
  if (scores.length === 0) return null;
  const last10 = scores.slice(0, 10).reverse();
  const min = Math.min(...last10);
  const max = Math.max(...last10);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-1 h-8">
      {last10.map((v, i) => {
        const pct = higherIsBetter ? ((v - min) / range) * 100 : ((max - v) / range) * 100;
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
  const historyRaw = useTrainingStore(s => s.history[drillId]);
  const history = historyRaw ?? [];
  const pr = useTrainingStore(s => s.personalRecords[drillId]);
  const selectedPlayerId = useTrainingStore(s => s.selectedPlayerId);
  const players = useAppStore(s => s.players);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;

  const scores = history.map(r => r.score);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-3 shrink-0">
        <button onPointerDown={() => navigate('/training')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary leading-tight">{def.title}</h1>
          <p className="text-text-secondary text-xs">
            {selectedPlayer ? `${selectedPlayer.nickname || selectedPlayer.name} · ` : ''}{def.subtitle}
          </p>
        </div>
        {pr !== undefined && (
          <div className="flex items-center gap-1 bg-surface rounded-xl px-3 py-1.5">
            <Trophy size={14} className="text-accent" />
            <span className="text-accent text-sm font-bold tabular">{pr}</span>
          </div>
        )}
      </div>

      {/* History bars */}
      {scores.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <HistoryBars scores={scores} higherIsBetter={def.higherIsBetter} />
          <p className="text-text-secondary text-xs mt-1">Laatste {Math.min(scores.length, 10)} sessies</p>
        </div>
      )}

      {/* Content */}
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
