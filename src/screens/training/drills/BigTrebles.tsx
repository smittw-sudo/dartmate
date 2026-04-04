import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const ZONES = [20, 19, 18, 17];
const ZONE_LABEL = (z: number) => `T${z}`;
const DARTS_PER_ZONE = 9;

export function BigTrebles() {
  const navigate = useNavigate();
  const save = useSaveResult('big_trebles');

  const [zoneIdx, setZoneIdx] = useState(0);
  const [dartInZone, setDartInZone] = useState(0);
  const [hitsPerZone, setHitsPerZone] = useState([0, 0, 0, 0]);
  const [done, setDone] = useState(false);

  const totalHits = hitsPerZone.reduce((a, b) => a + b, 0);
  const totalDarts = zoneIdx * DARTS_PER_ZONE + dartInZone;

  function register(hit: boolean) {
    if (done) return;
    const newHits = [...hitsPerZone];
    if (hit) newHits[zoneIdx] += 1;
    setHitsPerZone(newHits);

    const newDartInZone = dartInZone + 1;
    if (newDartInZone >= DARTS_PER_ZONE) {
      const nextZone = zoneIdx + 1;
      if (nextZone >= ZONES.length) {
        const tot = newHits.reduce((a, b) => a + b, 0);
        setDone(true);
        save(tot, Object.fromEntries(ZONES.map((z, i) => [`t${z}`, newHits[i]])));
        setHitsPerZone(newHits);
        return;
      }
      setZoneIdx(nextZone);
      setDartInZone(0);
    } else {
      setDartInZone(newDartInZone);
    }
    setHitsPerZone(newHits);
  }

  function restart() {
    setZoneIdx(0);
    setDartInZone(0);
    setHitsPerZone([0, 0, 0, 0]);
    setDone(false);
  }

  return (
    <DrillShell drillId="big_trebles">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Trebles geraakt</p>
              <p className="text-6xl font-black text-accent">{totalHits}</p>
              <p className="text-text-secondary text-sm mt-1">van 36 mogelijk</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ZONES.map((z, i) => (
                <div key={z} className="bg-surface rounded-xl p-3 text-center">
                  <p className="text-text-secondary text-xs">T{z}</p>
                  <p className="text-xl font-black text-accent">{hitsPerZone[i]}</p>
                  <p className="text-text-secondary text-xs">/{DARTS_PER_ZONE}</p>
                </div>
              ))}
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
                  <p className="text-5xl font-black text-accent">{ZONE_LABEL(ZONES[zoneIdx])}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Trebles totaal</p>
                  <p className="text-5xl font-black text-text-primary">{totalHits}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: DARTS_PER_ZONE }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < dartInZone ? 'bg-accent' : 'bg-surface2'}`} />
                ))}
              </div>
              <p className="text-text-secondary text-xs mt-1">Pijl {dartInZone + 1} van {DARTS_PER_ZONE} · Zone {zoneIdx + 1}/{ZONES.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={() => register(true)}
                className="h-28 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✓ Treble Raak
              </button>
              <button
                onPointerDown={() => register(false)}
                className="h-28 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
              >
                ✗ Mis
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ZONES.map((z, i) => (
                <div key={z} className={`rounded-xl p-2 text-center ${i === zoneIdx ? 'bg-accent/20 border border-accent' : 'bg-surface'}`}>
                  <p className={`text-xs ${i === zoneIdx ? 'text-accent' : 'text-text-secondary'}`}>T{z}</p>
                  <p className="text-lg font-black text-text-primary">{hitsPerZone[i]}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
