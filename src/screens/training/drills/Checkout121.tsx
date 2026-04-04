import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';
import { checkoutTable } from '../../../data/checkoutTable';

const ATTEMPTS = 10;
const START = 121;
const DARTS_TO_FINISH = 9;

function CheckoutHint({ score }: { score: number }) {
  const routes = checkoutTable[score];
  if (!routes || routes.length === 0) return null;
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
      <p className="text-accent text-xs font-bold mb-1">💡 Checkout tip</p>
      <p className="text-text-primary text-sm font-semibold">
        {routes[0].map(d => d.label).join(' → ')}
      </p>
      {routes[1] && (
        <p className="text-text-secondary text-xs mt-0.5">
          Alt: {routes[1].map(d => d.label).join(' → ')}
        </p>
      )}
    </div>
  );
}

export function Checkout121() {
  const navigate = useNavigate();
  const save = useSaveResult('checkout_121');

  const [attempt, setAttempt] = useState(1);
  const [score, setScore] = useState(0); // net score (hits - misses)
  const [remaining, setRemaining] = useState(START);
  const [dartsLeft, setDartsLeft] = useState(DARTS_TO_FINISH);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [log, setLog] = useState<{ attempt: number; success: boolean }[]>([]);

  function handleDigit(d: string) {
    if (input.length >= 3) return;
    const next = input + d;
    setInput(next);
  }

  function handleDelete() {
    setInput(prev => prev.slice(0, -1));
  }

  function registerThrow() {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0) return;
    setInput('');
    const newRemaining = remaining - val;
    const usedDarts = DARTS_TO_FINISH - dartsLeft + 1;
    const dartsInVisit = usedDarts % 3 === 0 ? 3 : usedDarts % 3;

    if (newRemaining === 0) {
      // Checkout!
      endAttempt(true);
    } else if (newRemaining < 0 || newRemaining === 1) {
      // Bust or impossible
      endAttempt(false);
    } else {
      const newDartsLeft = dartsLeft - 1;
      if (newDartsLeft <= 0) {
        endAttempt(false);
      } else {
        setRemaining(newRemaining);
        setDartsLeft(newDartsLeft);
      }
    }
  }

  function endAttempt(success: boolean) {
    const delta = success ? 1 : -1;
    const newScore = score + delta;
    const newLog = [...log, { attempt, success }];
    setLog(newLog);
    setScore(newScore);

    if (attempt >= ATTEMPTS) {
      setDone(true);
      save(newScore, { attempts: ATTEMPTS, hits: newLog.filter(l => l.success).length });
    } else {
      setAttempt(a => a + 1);
      setRemaining(START);
      setDartsLeft(DARTS_TO_FINISH);
      setInput('');
      setShowHint(false);
    }
  }

  function restart() {
    setAttempt(1);
    setScore(0);
    setRemaining(START);
    setDartsLeft(DARTS_TO_FINISH);
    setInput('');
    setDone(false);
    setShowHint(false);
    setLog([]);
  }

  return (
    <DrillShell drillId="checkout_121">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Eindscore</p>
              <p className="text-6xl font-black text-accent">{score > 0 ? `+${score}` : score}</p>
              <p className="text-text-secondary text-sm mt-1">{log.filter(l => l.success).length}/{ATTEMPTS} checkouts</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {log.map((l, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${l.success ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'}`}>
                  {l.success ? '✓' : '✗'}
                </div>
              ))}
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
                  <p className="text-5xl font-black text-accent tabular">{remaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Score</p>
                  <p className={`text-3xl font-black tabular ${score >= 0 ? 'text-text-primary' : 'text-red-400'}`}>{score > 0 ? `+${score}` : score}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Poging</p>
                  <p className="text-3xl font-black text-text-primary">{attempt}/{ATTEMPTS}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: DARTS_TO_FINISH }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < DARTS_TO_FINISH - dartsLeft ? 'bg-surface2' : 'bg-accent'}`} />
                ))}
              </div>
              <p className="text-text-secondary text-xs mt-1">{dartsLeft} pijlen over</p>
            </div>

            <CheckoutHint score={remaining} />

            <div className="bg-surface rounded-2xl p-4 text-center">
              <p className="text-text-secondary text-xs">Score deze beurt</p>
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

            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" fullWidth onPointerDown={registerThrow} disabled={!input}>Bevestig</Button>
              <Button variant="secondary" fullWidth onPointerDown={() => endAttempt(false)}>Bust / Mis</Button>
            </div>
          </>
        )}
      </div>
    </DrillShell>
  );
}
