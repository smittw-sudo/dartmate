import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAppStore } from '../../store/appStore';
import {
  getCricketProgress, getOpenTargets, CRICKET_TARGETS, REQUIRED_HITS, CricketTarget,
} from '../../engine/cricketLogic';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

/** Dots showing 0–3 hits (existing = faded, new = bright) */
function HitDots({ existing, added }: { existing: number; added: number }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => {
        const isFilled = i < existing;
        const isNew = !isFilled && i < existing + added;
        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              isFilled ? 'bg-accent opacity-50' : isNew ? 'bg-accent' : 'bg-surface2'
            }`}
          />
        );
      })}
    </div>
  );
}

const HIT_OPTIONS: { label: string; value: number }[] = [
  { label: '—', value: 0 },
  { label: 'S', value: 1 },
  { label: 'D', value: 2 },
  { label: 'T', value: 3 },
];

export function CricketInput() {
  const game = useGameStore(s => s.game);
  const submitCricketVisit = useGameStore(s => s.submitCricketVisit);
  const players = useAppStore(s => s.players);

  const [hits, setHits] = useState<Record<string | number, number>>({});

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const progress = getCricketProgress(game, currentPlayerId);
  const openTargets = getOpenTargets(game, currentPlayerId, 3);

  const getKey = (t: CricketTarget) => (t === 'bull' ? 'bull' : t);

  // Each S/D/T = ONE dart (1 dart on single / double / triple ring)
  // So dart budget = number of targets with a non-— selection (max 3)
  const totalDarts = Object.values(hits).filter(h => h > 0).length;

  const selectHits = (t: CricketTarget, value: number) => {
    const key = getKey(t);
    setHits(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    const entries = openTargets.map(t => ({ target: t, hits: hits[getKey(t)] ?? 0 }));
    submitCricketVisit(entries);
    setHits({});
  };

  const handleMiss = () => {
    submitCricketVisit([]);
    setHits({});
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Progress overview table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="text-text-secondary">
              <th className="px-2 py-1 text-left text-xs uppercase tracking-wide">Doel</th>
              {game.playerIds.map(pid => {
                const p = players.find(x => x.id === pid);
                return (
                  <th
                    key={pid}
                    className={`px-2 py-1 text-xs ${pid === currentPlayerId ? 'text-accent' : ''}`}
                  >
                    {p?.name ?? '?'}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {CRICKET_TARGETS.map(t => {
              const key = getKey(t);
              const tLabel = t === 'bull' ? 'Bull' : String(t);
              const isCurrentTarget = openTargets[0] === t;
              return (
                <tr key={tLabel} className={isCurrentTarget ? 'bg-accent/10' : ''}>
                  <td className={`px-2 py-1 text-left font-bold text-sm ${isCurrentTarget ? 'text-accent' : 'text-text-secondary'}`}>
                    {tLabel}
                  </td>
                  {game.playerIds.map(pid => {
                    const p = getCricketProgress(game, pid);
                    const h = p[key] ?? 0;
                    const addedNow = pid === currentPlayerId ? (hits[key] ?? 0) : 0;
                    return (
                      <td key={pid} className="px-2 py-1">
                        {h >= REQUIRED_HITS ? (
                          <CheckCircle2 size={16} className="text-accent mx-auto" />
                        ) : (
                          <HitDots existing={h} added={addedNow} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-target S/D/T input */}
      <div className="bg-surface rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-secondary text-sm font-semibold">Raakschoten invoeren</span>
          <span className={`text-lg font-black tabular ${totalDarts === 3 ? 'text-accent' : 'text-text-primary'}`}>
            {totalDarts}/3 pijlen
          </span>
        </div>

        {openTargets.length === 0 ? (
          <p className="text-center text-accent font-bold py-2">Alle doelen afgevinkt! 🎯</p>
        ) : (
          <div className="space-y-2">
            {openTargets.map((t, idx) => {
              const key = getKey(t);
              const existing = progress[key] ?? 0;
              const needed = REQUIRED_HITS - existing;
              const selected = hits[key] ?? 0;
              const label = t === 'bull' ? 'Bull' : String(t);
              const isFirst = idx === 0;

              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl ${isFirst ? 'bg-accent/10 border border-accent/30' : 'bg-surface2'}`}
                >
                  {/* Target label */}
                  <span className={`font-black text-xl w-12 tabular shrink-0 ${isFirst ? 'text-accent' : 'text-text-primary'}`}>
                    {label}
                  </span>

                  {/* Dots */}
                  <div className="shrink-0">
                    <HitDots existing={existing} added={selected} />
                  </div>

                  {/* S / D / T buttons */}
                  <div className="flex gap-1.5 ml-auto">
                    {HIT_OPTIONS.map(opt => {
                      const isSelected = selected === opt.value;
                      // Each S/D/T = 1 dart. Disable if:
                      // - Would add a NEW dart (this target has no selection) but budget is full
                      // - OR hits needed for this target < opt.value
                      const hasSelectionHere = selected > 0;
                      const dartsIfSelected = hasSelectionHere ? totalDarts : totalDarts + 1;
                      const wouldExceedDarts = opt.value > 0 && dartsIfSelected > 3;
                      const exceedsNeed = opt.value > 0 && opt.value > needed;
                      const disabled = !isSelected && (wouldExceedDarts || exceedsNeed);

                      return (
                        <button
                          key={opt.value}
                          onPointerDown={() => !disabled && selectHits(t, opt.value)}
                          disabled={disabled}
                          className={`w-10 h-10 rounded-xl text-sm font-bold touch-manipulation transition-colors ${
                            isSelected
                              ? 'bg-accent text-black'
                              : disabled
                              ? 'bg-surface2 text-text-secondary opacity-30'
                              : 'bg-surface2 text-text-primary active:bg-surface'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" fullWidth onPointerDown={handleMiss}>
          Mis (0 raak)
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPointerDown={handleConfirm}
        >
          Bevestig {totalDarts > 0 ? `(${totalDarts} pijl${totalDarts !== 1 ? 'en' : ''})` : ''}
        </Button>
      </div>
    </div>
  );
}
