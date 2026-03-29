import React from 'react';
import { DartboardSVG } from '../dartboard/DartboardSVG';
import { useGameStore } from '../../store/gameStore';
import { DartThrow } from '../../data/types';
import { Button } from '../ui/Button';
import { RotateCcw } from 'lucide-react';
import { getRemainingAfterDart } from '../../engine/checkoutEngine';

export function DartboardInput() {
  const game = useGameStore(s => s.game);
  const addDart = useGameStore(s => s.addDartToVisit);
  const removeDart = useGameStore(s => s.removeDartFromVisit);
  const submitVisit = useGameStore(s => s.submitVisit);
  const bustCurrentVisit = useGameStore(s => s.bustCurrentVisit);

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const remaining = game.scores[currentPlayerId];
  const darts = game.currentVisitDarts;
  const total = darts.reduce((s, d) => s + d.score, 0);
  const remainingNow = remaining - total;
  const dartsLeft = 3 - darts.length;

  const lastDart = darts[darts.length - 1] ?? null;

  // A dart counts as checkout-double if it's a double ring or the bullseye (50)
  const getCheckoutDouble = (dart: DartThrow, newRemaining: number): number | undefined => {
    if (newRemaining !== 0) return undefined;
    if (dart.multiplier === 2 || (dart.segment === 50 && dart.multiplier === 1)) return dart.segment;
    return undefined;
  };

  const handleDart = (dart: DartThrow) => {
    if (darts.length >= 3) return;
    addDart(dart);

    const newTotal = total + dart.score;
    const newRemaining = remaining - newTotal;

    // Auto-confirm on third dart or checkout
    const newDarts = [...darts, dart];
    const newDartCount = newDarts.length;

    if (newDartCount === 3 || newRemaining === 0 || newRemaining < 0) {
      const checkoutDouble = getCheckoutDouble(dart, newRemaining);
      setTimeout(() => {
        submitVisit(newDarts, { checkoutDouble });
      }, 150);
    }
  };

  const handleConfirm = () => {
    if (darts.length === 0) return;
    const totalScore = darts.reduce((s, d) => s + d.score, 0);
    const finalRemaining = remaining - totalScore;
    const lastDart = darts[darts.length - 1];
    const checkoutDouble = lastDart ? getCheckoutDouble(lastDart, finalRemaining) : undefined;
    submitVisit(darts, { checkoutDouble });
  };

  const handleBust = () => {
    bustCurrentVisit();
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Score display */}
      <div className="flex items-center gap-4 w-full justify-center">
        <div className="text-text-secondary text-sm">Beurt:</div>
        <div className="text-3xl font-bold tabular text-text-primary">{total}</div>
        <div className="text-text-secondary text-sm">Resterend: {remainingNow > 0 ? remainingNow : '—'}</div>
      </div>

      {/* Dart indicators */}
      <div className="flex gap-3">
        {darts.map((d, i) => (
          <div key={i} className="bg-surface2 px-3 py-1 rounded-lg text-sm text-accent font-bold">
            {d.multiplier === 3 ? 'T' : d.multiplier === 2 ? 'D' : 'S'}{d.segment === 50 ? 'Bull' : d.segment === 25 ? 'OBull' : d.segment}
          </div>
        ))}
        {Array(dartsLeft).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="bg-surface2 px-3 py-1 rounded-lg text-sm text-inactive">
            —
          </div>
        ))}
      </div>

      <DartboardSVG
        onDartThrown={handleDart}
        lastHit={lastDart ? { segment: lastDart.segment, multiplier: lastDart.multiplier } : null}
        disabled={darts.length >= 3}
        dartsThrown={darts.length}
      />

      <div className="flex gap-2 w-full max-w-xs">
        <Button
          variant="ghost"
          size="md"
          onPointerDown={removeDart}
          disabled={darts.length === 0}
          className="flex-1"
        >
          <RotateCcw size={18} className="mr-1" /> Undo
        </Button>
        <Button
          variant="danger"
          size="md"
          onPointerDown={handleBust}
          className="flex-1"
        >
          BUST
        </Button>
        <Button
          variant="primary"
          size="md"
          onPointerDown={handleConfirm}
          disabled={darts.length === 0}
          className="flex-1"
        >
          Klaar
        </Button>
      </div>
    </div>
  );
}
