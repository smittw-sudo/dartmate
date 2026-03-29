import React, { useState } from 'react';
import { NumericPad } from '../ui/NumericPad';
import { useGameStore } from '../../store/gameStore';
import { isValidX01Score } from '../../engine/x01Logic';
import { DartThrow } from '../../data/types';
import { haptics } from '../../utils/haptics';

export function TotalScoreInput() {
  const [value, setValue] = useState('0');
  const submitVisit = useGameStore(s => s.submitVisit);
  const bustCurrentVisit = useGameStore(s => s.bustCurrentVisit);
  const game = useGameStore(s => s.game);

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const remaining = game.scores[currentPlayerId];

  const handleConfirm = () => {
    const score = parseInt(value, 10);
    if (isNaN(score) || score === 0) return;
    if (!isValidX01Score(score)) return;
    if (score > remaining) {
      // Auto-bust
      bustCurrentVisit();
      setValue('0');
      return;
    }

    haptics.confirm();
    // Create a synthetic single dart representing the total
    const dart: DartThrow = { segment: score, multiplier: 1, score };
    // For total mode, we pass 3 "virtual" darts but encode just the score
    submitVisit([dart]);
    setValue('0');
  };

  const handleBust = () => {
    bustCurrentVisit();
    setValue('0');
  };

  const numVal = parseInt(value, 10);
  const isInvalid = !isNaN(numVal) && numVal > 0 && !isValidX01Score(numVal);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {isInvalid && (
        <p className="text-warning text-sm text-center">Ongeldige score</p>
      )}
      <NumericPad
        value={value}
        onChange={setValue}
        onConfirm={handleConfirm}
        onBust={handleBust}
        maxValue={180}
        confirmLabel="Bevestig"
      />
    </div>
  );
}
