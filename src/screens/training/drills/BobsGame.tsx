import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const DOUBLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25];
const DOUBLE_LABEL = (d: number) => d === 25 ? 'Bull' : `D${d}`;

type Phase = 'playing' | 'done';

export function BobsGame() {
  const navigate = useNavigate();
  const save = useSaveResult('bobs_27');

  const [score, setScore] = useState(27);
  const [doubleIdx, setDoubleIdx] = useState(0);
  const [dartsLeft, setDartsLeft] = useState(3);
  const [hitsThisDouble, setHitsThisDouble] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [log, setLog] = useState<{ label: string; delta: number }[]>([]);

  const currentDouble = DOUBLES[doubleIdx];

  function registerHit() {
    if (phase !== 'playing') return;
    const newHits = hitsThisDouble + 1;
    setHitsThisDouble(newHits);
    const remaining = dartsLeft - 1;
    setDartsLeft(remaining);
    if (remaining === 0) advanceDouble(newHits);
  }

  function registerMiss() {
    if (phase !== 'playing') return;
    const remaining = dartsLeft - 1;
    setDartsLeft(remaining);
    if (remaining === 0) advanceDouble(hitsThisDouble);
  }

  function advanceDouble(hits: number) {
    const delta = hits > 0 ? currentDouble * hits : -currentDouble;
    const newScore = score + delta;
    const newLog = [{ label: DOUBLE_LABEL(currentDouble), delta }, ...log];
    setLog(newLog);

    if (newScore <= 0) {
      // Game over
      const fs = newScore;
      setScore(fs);
      setFinalScore(fs);
      setPhase('done');
      save(fs, { doubles: doubleIdx + 1 });
      return;
    }

    const nextIdx = doubleIdx + 1;
    if (nextIdx >= DOUBLES.length) {
      setScore(newScore);
      setFinalScore(newScore);
      setPhase('done');
      save(newScore, { doubles: DOUBLES.length });
      return;
    }

    setScore(newScore);
    setDoubleIdx(nextIdx);
    setDartsLeft(3);
    setHitsThisDouble(0);
  }

  function restart() {
    setScore(27);
    setDoubleIdx(0);
    setDartsLeft(3);
    setHitsThisDouble(0);
    setPhase('playing');
    setFinalScore(0);
    setLog([]);
  }

  return (
    <DrillShell drillId="bobs_27">
      <div className="px-4 py-3 flex flex-col gap-4">
        {phase === 'done' ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">{finalScore <= 0 ? '💀 Game over!' : '🎯 Voltooid!'}</p>
              <p className="text-5xl font-black text-accent tabular">{finalScore}</p>
              <p className="text-text-secondary text-sm mt-1">punten</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            {/* Scoreboard */}
            <div className="bg-surface rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-text-secondary text-xs">Score</p>
                <p className="text-4xl font-black text-text-primary tabular">{score}</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-xs">Dubbel</p>
                <p className="text-3xl font-black text-accent">{DOUBLE_LABEL(currentDouble)}</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-xs">Pijlen</p>
                <div className="flex gap-1 mt-1 justify-end">
                  {[0,1,2].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full ${i < dartsLeft ? 'bg-accent' : 'bg-surface2'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Dart buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={registerHit}
                className="h-24 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Raak
              </button>
              <button
                onPointerDown={registerMiss}
                className="h-24 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis
              </button>
            </div>

            {/* Progress + log */}
            <div className="bg-surface rounded-2xl p-3">
              <p className="text-text-secondary text-xs mb-2">{doubleIdx + 1} / {DOUBLES.length} dubbels</p>
              <div className="w-full bg-surface2 rounded-full h-2 mb-3">
                <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${((doubleIdx) / DOUBLES.length) * 100}%` }} />
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {log.map((entry, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{entry.label}</span>
                    <span className={entry.delta >= 0 ? 'text-accent font-semibold' : 'text-red-400 font-semibold'}>
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
