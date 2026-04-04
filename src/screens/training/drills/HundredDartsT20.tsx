import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const TOTAL = 100;

export function HundredDartsT20() {
  const navigate = useNavigate();
  const save = useSaveResult('hundred_darts_t20');

  const [hits, setHits] = useState(0);
  const [thrown, setThrown] = useState(0);
  const [done, setDone] = useState(false);

  function registerHit() {
    if (done) return;
    const newHits = hits + 1;
    const newThrown = thrown + 1;
    setHits(newHits);
    setThrown(newThrown);
    if (newThrown >= TOTAL) finish(newHits, TOTAL);
  }

  function registerMiss() {
    if (done) return;
    const newThrown = thrown + 1;
    setThrown(newThrown);
    if (newThrown >= TOTAL) finish(hits, TOTAL);
  }

  function finish(h: number, t: number) {
    const pct = Math.round((h / t) * 100);
    setDone(true);
    save(pct, { hits: h });
  }

  function restart() {
    setHits(0);
    setThrown(0);
    setDone(false);
  }

  const pct = thrown > 0 ? Math.round((hits / thrown) * 100) : 0;
  const remaining = TOTAL - thrown;

  return (
    <DrillShell drillId="hundred_darts_t20">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Resultaat</p>
              <p className="text-6xl font-black text-accent">{pct}%</p>
              <p className="text-text-secondary text-sm mt-1">{hits} van {TOTAL} trebles geraakt</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-text-secondary text-xs">Raakpercentage</p>
                  <p className="text-5xl font-black text-accent tabular">{pct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Nog te gooien</p>
                  <p className="text-5xl font-black text-text-primary tabular">{remaining}</p>
                </div>
              </div>
              <div className="w-full bg-surface2 rounded-full h-3">
                <div className="bg-accent h-3 rounded-full transition-all" style={{ width: `${(thrown / TOTAL) * 100}%` }} />
              </div>
              <p className="text-text-secondary text-xs mt-1">{thrown} / {TOTAL} pijlen</p>
            </div>

            <p className="text-center text-text-primary text-xl font-black">Treble 20</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={registerHit}
                className="h-28 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Treble Raak
              </button>
              <button
                onPointerDown={registerMiss}
                className="h-28 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">Raak</p>
                <p className="text-2xl font-black text-accent">{hits}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">Mis</p>
                <p className="text-2xl font-black text-text-primary">{thrown - hits}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">Pijlen</p>
                <p className="text-2xl font-black text-text-primary">{thrown}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
