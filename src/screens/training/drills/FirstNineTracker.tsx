import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

const ROUNDS = 10;

export function FirstNineTracker() {
  const navigate = useNavigate();
  const save = useSaveResult('first_nine_tracker');

  const [scores, setScores] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);

  const round = scores.length + 1;
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  function submitRound() {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0 || val > 180) return;
    const newScores = [...scores, val];
    setInput('');
    if (newScores.length >= ROUNDS) {
      const average = Math.round(newScores.reduce((a, b) => a + b, 0) / ROUNDS);
      setScores(newScores);
      setDone(true);
      save(average, { rounds: ROUNDS });
    } else {
      setScores(newScores);
    }
  }

  function handleDigit(d: string) {
    if (input.length >= 3) return;
    setInput(prev => prev + d);
  }

  function handleDelete() {
    setInput(prev => prev.slice(0, -1));
  }

  function restart() {
    setScores([]);
    setInput('');
    setDone(false);
  }

  return (
    <DrillShell drillId="first_nine_tracker">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">First-9 Gemiddelde</p>
              <p className="text-6xl font-black text-accent">{Math.round(avg)}</p>
              <p className="text-text-secondary text-sm mt-1">per 9 pijlen</p>
            </div>
            <div className="bg-surface rounded-2xl p-4 space-y-1">
              {scores.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-secondary">Ronde {i + 1}</span>
                  <span className="text-text-primary font-semibold">{s}</span>
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
                  <p className="text-text-secondary text-xs">Ronde</p>
                  <p className="text-4xl font-black text-accent">{round}/{ROUNDS}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Lopend gemiddelde</p>
                  <p className="text-4xl font-black text-text-primary">{scores.length > 0 ? Math.round(avg) : '—'}</p>
                </div>
              </div>
              <p className="text-text-secondary text-xs">Gooi 9 pijlen op T20/T19. Vul totale score in.</p>
            </div>

            {/* Score display */}
            <div className="bg-surface rounded-2xl p-4 text-center">
              <p className="text-text-secondary text-xs mb-1">Score deze ronde</p>
              <p className="text-5xl font-black text-text-primary tabular min-h-[60px]">{input || '—'}</p>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onPointerDown={() => handleDigit(d)}
                  className="h-14 bg-surface rounded-xl text-xl font-bold text-text-primary active:bg-accent active:text-black transition-colors touch-manipulation">
                  {d}
                </button>
              ))}
              <div />
              <button onPointerDown={() => handleDigit('0')}
                className="h-14 bg-surface rounded-xl text-xl font-bold text-text-primary active:bg-accent active:text-black transition-colors touch-manipulation">
                0
              </button>
              <button onPointerDown={handleDelete}
                className="h-14 bg-surface rounded-xl text-xl font-bold text-text-secondary active:bg-surface2 transition-colors touch-manipulation">
                ⌫
              </button>
            </div>

            <Button variant="primary" size="lg" fullWidth onPointerDown={submitRound} disabled={!input}>
              Bevestig ronde {round}
            </Button>

            {scores.length > 0 && (
              <div className="bg-surface rounded-2xl p-3 space-y-1">
                {scores.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-secondary">Ronde {i + 1}</span>
                    <span className="text-text-primary font-semibold">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DrillShell>
  );
}
