import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';
import { checkoutTable } from '../../../data/checkoutTable';

const MIN = 60;
const MAX = 170;
const STEP = 10;

export function FinishingPyramid() {
  const navigate = useNavigate();
  const save = useSaveResult('finishing_pyramid');

  const [target, setTarget] = useState(MIN);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const routes = checkoutTable[target];

  function registerHit() {
    if (done) return;
    const newScore = score + 1;
    const newTarget = Math.min(target + STEP, MAX);
    if (target === MAX) {
      // Already at top, just keep scoring
      setScore(newScore);
      setDone(true);
      save(newScore, { reached: target });
    } else {
      setScore(newScore);
      setTarget(newTarget);
    }
  }

  function registerMiss() {
    if (done) return;
    const newScore = score - 1;
    if (newScore <= -10) {
      setScore(newScore);
      setDone(true);
      save(newScore, { reached: target });
    } else {
      setScore(newScore);
    }
  }

  function finish() {
    setDone(true);
    save(score, { reached: target });
  }

  function restart() {
    setTarget(MIN);
    setScore(0);
    setDone(false);
  }

  const levels = [];
  for (let l = MIN; l <= MAX; l += STEP) levels.push(l);

  return (
    <DrillShell drillId="finishing_pyramid">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Totaalscore</p>
              <p className="text-6xl font-black text-accent">{score}</p>
              <p className="text-text-secondary text-sm mt-1">Bereikt tot {target}</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-text-secondary text-xs">Checkout-doel</p>
                  <p className="text-5xl font-black text-accent tabular">{target}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Score</p>
                  <p className={`text-5xl font-black tabular ${score >= 0 ? 'text-text-primary' : 'text-red-400'}`}>{score}</p>
                </div>
              </div>
              {routes && (
                <div className="mt-2 bg-accent/10 rounded-xl px-3 py-2">
                  <p className="text-accent text-xs font-bold">💡 Route: {routes[0].map(d => d.label).join(' → ')}</p>
                </div>
              )}
            </div>

            {/* Pyramid visual */}
            <div className="bg-surface rounded-2xl p-3">
              <div className="flex gap-1 items-end">
                {levels.map(l => (
                  <div key={l} className="flex-1 flex flex-col items-center">
                    <div className={`w-full rounded-sm ${l === target ? 'bg-accent' : l < target ? 'bg-accent/30' : 'bg-surface2'}`}
                      style={{ height: `${((l - MIN) / (MAX - MIN)) * 40 + 8}px` }} />
                    {l % 20 === 0 && <span className="text-[9px] text-text-secondary mt-0.5">{l}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={registerHit}
                className="h-24 bg-accent rounded-2xl text-black font-black text-xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Uitgegoooid!<br /><span className="text-sm font-normal">+1 → volgende</span>
              </button>
              <button
                onPointerDown={registerMiss}
                className="h-24 bg-surface2 rounded-2xl text-text-primary font-black text-xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis<br /><span className="text-sm font-normal text-text-secondary">−1</span>
              </button>
            </div>
            <Button variant="secondary" size="sm" fullWidth onPointerDown={finish}>Stop & opslaan</Button>
          </>
        )}
      </div>
    </DrillShell>
  );
}
