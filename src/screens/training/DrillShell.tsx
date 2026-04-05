import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillId, DRILL_BY_ID } from '../../data/trainingTypes';
import { useTrainingStore, SaveResultReturn } from '../../store/trainingStore';
import { useAppStore } from '../../store/appStore';

// ─── Celebration context ────────────────────────────────────────────────────

interface CelebrationData {
  oldPR: number | undefined;
  newPR: number;
  higherIsBetter: boolean;
}

interface DrillContextValue {
  triggerCelebration: (data: CelebrationData) => void;
}

const DrillContext = createContext<DrillContextValue>({ triggerCelebration: () => {} });

// ─── History bars ───────────────────────────────────────────────────────────

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

// ─── Celebration overlay ────────────────────────────────────────────────────

function CelebrationOverlay({
  data,
  onDismiss,
}: {
  data: CelebrationData;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 3 s
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const arrow = data.higherIsBetter ? '↑' : '↓';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onDismiss}
    >
      <motion.div
        className="bg-surface rounded-3xl p-8 mx-6 text-center shadow-2xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
      >
        <div className="text-6xl mb-3">🏆</div>
        <h2 className="text-2xl font-black text-accent mb-2">Nieuw persoonlijk record!</h2>
        {data.oldPR !== undefined ? (
          <p className="text-text-secondary text-base">
            <span className="line-through opacity-50">{data.oldPR}</span>
            {' '}
            <span className="text-accent font-black text-xl">{arrow} {data.newPR}</span>
          </p>
        ) : (
          <p className="text-accent font-black text-xl">{data.newPR}</p>
        )}
        <p className="text-text-secondary text-xs mt-4">Tik om verder te gaan</p>
      </motion.div>
    </motion.div>
  );
}

// ─── DrillShell ─────────────────────────────────────────────────────────────

interface DrillShellProps {
  drillId: DrillId;
  children: React.ReactNode;
}

export function DrillShell({ drillId, children }: DrillShellProps) {
  const def = DRILL_BY_ID[drillId];
  const navigate = useNavigate();

  const selectedPlayerId = useTrainingStore(s => s.selectedPlayerId);
  const players = useAppStore(s => s.players);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;

  // Per-speler data — geen ?? {} in selector (geeft nieuwe referentie elke render → infinite loop)
  const playerHistory = useTrainingStore(s =>
    selectedPlayerId ? s.history[selectedPlayerId] : undefined
  );
  const playerPRs = useTrainingStore(s =>
    selectedPlayerId ? s.personalRecords[selectedPlayerId] : undefined
  );
  const historyForDrill: import('../../data/trainingTypes').DrillResult[] =
    (playerHistory?.[drillId] as import('../../data/trainingTypes').DrillResult[]) ?? [];
  const pr: number | undefined = playerPRs?.[drillId] as number | undefined;

  const scores = historyForDrill.map(r => r.score);

  // Celebration
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  return (
    <DrillContext.Provider value={{ triggerCelebration: setCelebration }}>
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
            <p className="text-text-secondary text-xs mt-1">
              Laatste {Math.min(scores.length, 10)} sessies
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Celebration overlay */}
        <AnimatePresence>
          {celebration && (
            <CelebrationOverlay
              data={celebration}
              onDismiss={() => setCelebration(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </DrillContext.Provider>
  );
}

// ─── useSaveResult hook ──────────────────────────────────────────────────────

export function useSaveResult(drillId: DrillId) {
  const def = DRILL_BY_ID[drillId];
  const saveResult = useTrainingStore(s => s.saveResult);
  const selectedPlayerId = useTrainingStore(s => s.selectedPlayerId);
  const { triggerCelebration } = useContext(DrillContext);

  return (score: number, metadata?: Record<string, number>) => {
    const pid = selectedPlayerId ?? '__anonymous__';
    const result: SaveResultReturn = saveResult(drillId, score, def.higherIsBetter, pid, metadata);

    // Vier alleen als er een echt vorig resultaat was om te verslaan
    if (result.isNewPR && result.hadPrevious) {
      triggerCelebration({
        oldPR: result.oldPR,
        newPR: result.newPR,
        higherIsBetter: def.higherIsBetter,
      });
    }
  };
}
