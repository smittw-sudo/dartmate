import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const TOTAL_DARTS = 30;

export function BullChallenge() {
  const navigate = useNavigate();
  const save = useSaveResult('bull_challenge');

  const [innerBulls, setInnerBulls] = useState(0);
  const [outerBulls, setOuterBulls] = useState(0);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);

  const thrown = innerBulls + outerBulls + misses;
  const remaining = TOTAL_DARTS - thrown;

  function register(type: 'inner' | 'outer' | 'miss') {
    if (done || thrown >= TOTAL_DARTS) return;
    let newInner = innerBulls, newOuter = outerBulls, newMiss = misses;
    if (type === 'inner') newInner++;
    else if (type === 'outer') newOuter++;
    else newMiss++;

    const newThrown = newInner + newOuter + newMiss;
    setInnerBulls(newInner);
    setOuterBulls(newOuter);
    setMisses(newMiss);

    if (newThrown >= TOTAL_DARTS) {
      setDone(true);
      save(newInner, { outer: newOuter, miss: newMiss });
    }
  }

  function restart() {
    setInnerBulls(0);
    setOuterBulls(0);
    setMisses(0);
    setDone(false);
  }

  const benchmark = innerBulls < 3 ? 'Beginner' : innerBulls < 6 ? 'Gevorderd' : innerBulls < 10 ? 'Semi-Pro' : 'Expert';

  return (
    <DrillShell drillId="bull_challenge">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Inner Bulls (50)</p>
              <p className="text-6xl font-black text-accent">{innerBulls}</p>
              <p className="text-text-secondary text-sm mt-1">{benchmark}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">Bull (50)</p>
                <p className="text-2xl font-black text-accent">{innerBulls}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">25</p>
                <p className="text-2xl font-black text-yellow-400">{outerBulls}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-text-secondary text-xs">Mis</p>
                <p className="text-2xl font-black text-text-secondary">{misses}</p>
              </div>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-text-secondary text-xs">Inner Bulls</p>
                  <p className="text-5xl font-black text-accent tabular">{innerBulls}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Nog te gooien</p>
                  <p className="text-5xl font-black text-text-primary tabular">{remaining}</p>
                </div>
              </div>
              <div className="w-full bg-surface2 rounded-full h-3">
                <div className="bg-accent h-3 rounded-full transition-all" style={{ width: `${(thrown / TOTAL_DARTS) * 100}%` }} />
              </div>
              <p className="text-text-secondary text-xs mt-1">{thrown} / {TOTAL_DARTS}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onPointerDown={() => register('inner')}
                className="h-24 bg-accent rounded-2xl text-black font-black text-lg active:scale-95 transition-transform touch-manipulation"
              >
                🎯<br />Bull<br /><span className="text-sm">50 pts</span>
              </button>
              <button
                onPointerDown={() => register('outer')}
                className="h-24 bg-yellow-500/20 border border-yellow-500 rounded-2xl text-yellow-400 font-black text-lg active:scale-95 transition-transform touch-manipulation"
              >
                ⭕<br />25<br /><span className="text-sm">Outer</span>
              </button>
              <button
                onPointerDown={() => register('miss')}
                className="h-24 bg-surface2 rounded-2xl text-text-primary font-black text-lg active:scale-95 transition-transform touch-manipulation"
              >
                ✗<br />Mis
              </button>
            </div>

            <div className="bg-surface rounded-2xl p-3">
              <p className="text-text-secondary text-xs mb-1">Benchmark: &lt;3 Beginner · 3-6 Basis · 6-10 Semi-Pro · 10+ Expert</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center"><p className="text-text-secondary text-xs">Bull</p><p className="text-xl font-black text-accent">{innerBulls}</p></div>
                <div className="text-center"><p className="text-text-secondary text-xs">25</p><p className="text-xl font-black text-yellow-400">{outerBulls}</p></div>
                <div className="text-center"><p className="text-text-secondary text-xs">Mis</p><p className="text-xl font-black text-text-secondary">{misses}</p></div>
              </div>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
