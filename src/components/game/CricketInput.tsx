import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAppStore } from '../../store/appStore';
import { getCurrentTarget, getCricketProgress, CRICKET_TARGETS } from '../../engine/cricketLogic';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

export function CricketInput() {
  const game = useGameStore(s => s.game);
  const submitCricketHits = useGameStore(s => s.submitCricketHits);
  const players = useAppStore(s => s.players);

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const target = getCurrentTarget(game, currentPlayerId);
  const targetLabel = target === 'bull' ? 'Bull' : String(target);

  const isBullPhase = target === 'bull';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Progress overview */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="text-text-secondary">
              <th className="px-2 py-1 text-left">Doel</th>
              {game.playerIds.map(pid => {
                const p = players.find(x => x.id === pid);
                return <th key={pid} className="px-2 py-1">{p?.name ?? '?'}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {CRICKET_TARGETS.map(t => {
              const tLabel = t === 'bull' ? 'Bull' : String(t);
              const key = t === 'bull' ? 'bull' : t;
              const isCurrentTarget = t === target;
              return (
                <tr key={tLabel} className={isCurrentTarget ? 'bg-accent/10' : ''}>
                  <td className={`px-2 py-1 text-left font-bold ${isCurrentTarget ? 'text-accent' : 'text-text-secondary'}`}>
                    {tLabel}
                  </td>
                  {game.playerIds.map(pid => {
                    const progress = getCricketProgress(game, pid);
                    const hits = progress[key] ?? 0;
                    return (
                      <td key={pid} className="px-2 py-1">
                        {hits >= 3 ? (
                          <CheckCircle2 size={18} className="text-accent mx-auto" />
                        ) : (
                          <div className="flex gap-0.5 justify-center">
                            {[0,1,2].map(i => (
                              <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < hits ? 'bg-accent' : 'bg-surface2'}`} />
                            ))}
                          </div>
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

      {/* Hit buttons */}
      <div className="w-full max-w-sm">
        <p className="text-text-secondary text-sm text-center mb-3">
          Huidig doel: <span className="text-accent font-bold text-lg">{targetLabel}</span>
        </p>

        {!isBullPhase ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => submitCricketHits(0)}>
              Mis
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(1)}>
              1× (Single)
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(2)}>
              2× (Double)
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(3)}>
              3× (Triple)
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => submitCricketHits(0)}>
              Mis
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(1)}>
              Outer Bull (25)
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(2)}>
              Bullseye (50)
            </Button>
            <Button variant="primary" size="lg" fullWidth onPointerDown={() => submitCricketHits(3)}>
              Outer + Bull
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
