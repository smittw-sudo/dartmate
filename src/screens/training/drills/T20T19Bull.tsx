import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const ROUNDS = 10;
const ZONES = ['T20', 'T19', 'Bull'] as const;
type Zone = typeof ZONES[number];

export function T20T19Bull() {
  const navigate = useNavigate();
  const save = useSaveResult('t20_t19_bull');

  const [round, setRound] = useState(1);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);

  function register(hit: boolean) {
    if (done) return;
    const newHits = hits + (hit ? 1 : 0);
    const nextZone = zoneIdx + 1;

    if (nextZone >= ZONES.length) {
      const nextRound = round + 1;
      if (nextRound > ROUNDS) {
        setHits(newHits);
        setDone(true);
        save(newHits, { rounds: ROUNDS });
      } else {
        setHits(newHits);
        setRound(nextRound);
        setZoneIdx(0);
      }
    } else {
      setHits(newHits);
      setZoneIdx(nextZone);
    }
  }

  function restart() {
    setRound(1);
    setZoneIdx(0);
    setHits(0);
    setDone(false);
  }

  const maxHits = ROUNDS * ZONES.length;
  const dartsThrown = (round - 1) * ZONES.length + zoneIdx;

  return (
    <DrillShell drillId="t20_t19_bull">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Hits</p>
              <p className="text-6xl font-black text-accent">{hits}</p>
              <p className="text-text-secondary text-sm mt-1">van {maxHits} mogelijk</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-text-secondary text-xs">Doel</p>
                  <p className="text-5xl font-black text-accent">{ZONES[zoneIdx]}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Ronde · Hits</p>
                  <p className="text-3xl font-black text-text-primary">{round}/{ROUNDS} · {hits}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {ZONES.map((z, i) => (
                  <div key={z} className={`flex-1 h-2 rounded-full ${i < zoneIdx ? 'bg-accent' : i === zoneIdx ? 'bg-accent/60' : 'bg-surface2'}`} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={() => register(true)}
                className="h-28 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Raak
              </button>
              <button
                onPointerDown={() => register(false)}
                className="h-28 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis
              </button>
            </div>

            <div className="bg-surface rounded-2xl p-3">
              <div className="w-full bg-surface2 rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: `${(dartsThrown / maxHits) * 100}%` }} />
              </div>
              <p className="text-text-secondary text-xs mt-1">{dartsThrown} / {maxHits} pijlen</p>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
