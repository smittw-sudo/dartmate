import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const DOUBLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25];
const LABEL = (d: number) => d === 25 ? 'Bull' : `D${d}`;

export function RoundClockDoubles() {
  const navigate = useNavigate();
  const save = useSaveResult('round_clock_doubles');

  const [idx, setIdx] = useState(0);
  const [darts, setDarts] = useState(0);
  const [done, setDone] = useState(false);

  function registerHit() {
    if (done) return;
    const newDarts = darts + 1;
    const nextIdx = idx + 1;
    if (nextIdx >= DOUBLES.length) {
      setDarts(newDarts);
      setDone(true);
      save(newDarts);
    } else {
      setDarts(newDarts);
      setIdx(nextIdx);
    }
  }

  function registerMiss() {
    if (done) return;
    setDarts(d => d + 1);
  }

  function restart() {
    setIdx(0);
    setDarts(0);
    setDone(false);
  }

  return (
    <DrillShell drillId="round_clock_doubles">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Pijlen gebruikt</p>
              <p className="text-6xl font-black text-accent">{darts}</p>
              <p className="text-text-secondary text-sm mt-1">voor alle {DOUBLES.length} dubbels</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-text-secondary text-xs">Huidige dubbel</p>
                  <p className="text-5xl font-black text-accent">{LABEL(DOUBLES[idx])}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Pijlen</p>
                  <p className="text-5xl font-black text-text-primary tabular">{darts}</p>
                </div>
              </div>
              <div className="w-full bg-surface2 rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: `${(idx / DOUBLES.length) * 100}%` }} />
              </div>
              <p className="text-text-secondary text-xs mt-1">{idx + 1} / {DOUBLES.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={registerHit}
                className="h-28 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Dubbel!
              </button>
              <button
                onPointerDown={registerMiss}
                className="h-28 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis
              </button>
            </div>

            <div className="bg-surface rounded-2xl p-3">
              <p className="text-text-secondary text-xs mb-2">Nog te gooien</p>
              <div className="flex flex-wrap gap-1.5">
                {DOUBLES.slice(idx).map(d => (
                  <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${d === DOUBLES[idx] ? 'bg-accent text-black font-bold' : 'bg-surface2 text-text-secondary'}`}>
                    {LABEL(d)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
