import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAppStore } from '../../store/appStore';
import {
  getCricketProgress, getOpenTargets, CRICKET_TARGETS, REQUIRED_HITS, CricketTarget,
} from '../../engine/cricketLogic';
import { Button } from '../ui/Button';
import { CheckCircle2, Plus, Minus } from 'lucide-react';

/** Dots showing 0–3 hits for a target (existing = faded, new = bright) */
function HitDots({ existing, added }: { existing: number; added: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {[0, 1, 2].map(i => {
        const isFilled = i < existing;
        const isNew = !isFilled && i < existing + added;
        return (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-colors ${
              isFilled ? 'bg-accent opacity-60' : isNew ? 'bg-accent' : 'bg-surface2'
            }`}
          />
        );
      })}
    </div>
  );
}

export function CricketInput() {
  const game = useGameStore(s => s.game);
  const submitCricketVisit = useGameStore(s => s.submitCricketVisit);
  const players = useAppStore(s => s.players);

  // hits entered this turn: keyed by target (number or 'bull')
  const [hits, setHits] = useState<Record<string | number, number>>({});

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const progress = getCricketProgress(game, currentPlayerId);
  const openTargets = getOpenTargets(game, currentPlayerId, 3);
  const totalHits = Object.values(hits).reduce((s, h) => s + h, 0);

  const getKey = (t: CricketTarget) => (t === 'bull' ? 'bull' : t);

  const inc = (t: CricketTarget) => {
    if (totalHits >= 3) return;
    const key = getKey(t);
    const existing = progress[key] ?? 0;
    const alreadyAdded = hits[key] ?? 0;
    // don't allow adding more than needed to close
    if (existing + alreadyAdded >= REQUIRED_HITS) return;
    setHits(prev => ({ ...prev, [key]: alreadyAdded + 1 }));
  };

  const dec = (t: CricketTarget) => {
    const key = getKey(t);
    const cur = hits[key] ?? 0;
    if (cur <= 0) return;
    setHits(prev => ({ ...prev, [key]: cur - 1 }));
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
                  <th key={pid} className={`px-2 py-1 text-xs ${pid === currentPlayerId ? 'text-accent' : ''}`}>
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
              const isOpen = openTargets.includes(t);
              return (
                <tr key={tLabel} className={isOpen && openTargets[0] === t ? 'bg-accent/10' : ''}>
                  <td className={`px-2 py-1 text-left font-bold text-sm ${isOpen && openTargets[0] === t ? 'text-accent' : 'text-text-secondary'}`}>
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

      {/* Per-target hit entry */}
      <div className="bg-surface rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-secondary text-sm font-semibold">Pijlen deze beurt</span>
          <span className={`text-lg font-black tabular ${totalHits === 3 ? 'text-accent' : 'text-text-primary'}`}>
            {totalHits} / 3
          </span>
        </div>

        {openTargets.length === 0 ? (
          <p className="text-center text-accent font-bold py-2">Alle doelen afgevinkt! 🎯</p>
        ) : (
          <div className="space-y-2">
            {openTargets.map((t, idx) => {
              const key = getKey(t);
              const existing = progress[key] ?? 0;
              const added = hits[key] ?? 0;
              const needed = REQUIRED_HITS - existing;
              const label = t === 'bull' ? 'Bull' : String(t);
              const isFirst = idx === 0;

              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 py-2 px-3 rounded-xl ${isFirst ? 'bg-accent/10 border border-accent/30' : 'bg-surface2'}`}
                >
                  {/* Target label */}
                  <span className={`font-black text-xl w-12 tabular ${isFirst ? 'text-accent' : 'text-text-primary'}`}>
                    {label}
                  </span>

                  {/* Dots */}
                  <div className="flex-1">
                    <HitDots existing={existing} added={added} />
                    <div className="text-text-secondary text-xs text-center mt-0.5">
                      {existing + added >= REQUIRED_HITS ? 'Gesloten!' : `${existing + added}/${REQUIRED_HITS}`}
                    </div>
                  </div>

                  {/* +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onPointerDown={() => dec(t)}
                      disabled={added === 0}
                      className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center disabled:opacity-30 active:bg-surface2 touch-manipulation"
                    >
                      <Minus size={16} className="text-text-primary" />
                    </button>
                    <span className="text-text-primary font-bold text-lg w-5 text-center tabular">{added}</span>
                    <button
                      onPointerDown={() => inc(t)}
                      disabled={totalHits >= 3 || existing + added >= REQUIRED_HITS}
                      className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center disabled:opacity-30 active:bg-surface2 touch-manipulation"
                    >
                      <Plus size={16} className="text-text-primary" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hint when no hits entered yet */}
        {totalHits === 0 && openTargets.length > 0 && (
          <p className="text-text-secondary text-xs text-center mt-2">
            Voer je raakschoten in per doel (max 3 pijlen)
          </p>
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
          disabled={openTargets.length === 0 && totalHits === 0}
        >
          Bevestig {totalHits > 0 ? `(${totalHits}×)` : ''}
        </Button>
      </div>
    </div>
  );
}
