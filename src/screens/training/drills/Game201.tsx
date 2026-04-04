import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';
import { checkoutTable } from '../../../data/checkoutTable';

const START = 201;

export function Game201() {
  const navigate = useNavigate();
  const save = useSaveResult('game_201');

  const [remaining, setRemaining] = useState(START);
  const [darts, setDarts] = useState(0);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [busted, setBusted] = useState(false);

  const hint = checkoutTable[remaining];

  function handleDigit(d: string) {
    if (input.length >= 3) return;
    setInput(prev => prev + d);
  }

  function handleDelete() {
    setInput(prev => prev.slice(0, -1));
  }

  function submit() {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0) return;
    setInput('');
    const newDarts = darts + 3;
    const newRemaining = remaining - val;

    if (newRemaining === 0) {
      setDarts(newDarts);
      setRemaining(0);
      setDone(true);
      save(newDarts, { checkout: remaining });
    } else if (newRemaining < 0 || newRemaining === 1) {
      setBusted(true);
      setDarts(newDarts);
    } else {
      setRemaining(newRemaining);
      setDarts(newDarts);
      setBusted(false);
    }
  }

  function restart() {
    setRemaining(START);
    setDarts(0);
    setInput('');
    setDone(false);
    setBusted(false);
  }

  return (
    <DrillShell drillId="game_201">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">{darts <= 9 ? '🏆 Target gehaald!' : 'Voltooid'}</p>
              <p className="text-6xl font-black text-accent tabular">{darts}</p>
              <p className="text-text-secondary text-sm mt-1">pijlen gebruikt · target &lt;10</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-text-secondary text-xs">Resterend</p>
                  <p className={`text-5xl font-black tabular ${remaining <= 170 ? 'text-accent' : 'text-text-primary'}`}>{remaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Pijlen</p>
                  <p className="text-5xl font-black text-text-primary tabular">{darts}</p>
                </div>
              </div>
              {busted && <p className="text-red-400 text-sm font-semibold mt-1">💥 Bust — probeer opnieuw</p>}
              {hint && remaining <= 170 && (
                <div className="mt-2 bg-accent/10 rounded-xl px-3 py-2">
                  <p className="text-accent text-xs font-bold">💡 Checkout: {hint[0].map(d => d.label).join(' → ')}</p>
                </div>
              )}
            </div>

            <div className="bg-surface rounded-2xl p-4 text-center">
              <p className="text-text-secondary text-xs">Score deze beurt (3 pijlen)</p>
              <p className="text-5xl font-black text-text-primary tabular min-h-[60px]">{input || '—'}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onPointerDown={() => handleDigit(d)}
                  className="h-14 bg-surface rounded-xl text-xl font-bold text-text-primary active:bg-accent active:text-black transition-colors touch-manipulation">{d}</button>
              ))}
              <div />
              <button onPointerDown={() => handleDigit('0')}
                className="h-14 bg-surface rounded-xl text-xl font-bold text-text-primary active:bg-accent active:text-black transition-colors touch-manipulation">0</button>
              <button onPointerDown={handleDelete}
                className="h-14 bg-surface rounded-xl text-xl font-bold text-text-secondary active:bg-surface2 transition-colors touch-manipulation">⌫</button>
            </div>

            <Button variant="primary" size="lg" fullWidth onPointerDown={submit} disabled={!input}>Bevestig beurt</Button>
          </>
        )}
      </div>
    </DrillShell>
  );
}
