import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillShell, useSaveResult } from '../DrillShell';
import { Button } from '../../../components/ui/Button';

// 8 levels: min score needed with 2 darts + target double
const LEVELS = [
  { level: 1, minScore: 40, double: 16, label: 'D16' },
  { level: 2, minScore: 50, double: 16, label: 'D16' },
  { level: 3, minScore: 60, double: 20, label: 'D20' },
  { level: 4, minScore: 70, double: 20, label: 'D20' },
  { level: 5, minScore: 80, double: 10, label: 'D10' },
  { level: 6, minScore: 90, double: 10, label: 'D10' },
  { level: 7, minScore: 100, double: 5,  label: 'D5' },
  { level: 8, minScore: 110, double: 1,  label: 'D1' },
];

type Stage = 'scoring' | 'doubling';

export function Frustration() {
  const navigate = useNavigate();
  const save = useSaveResult('frustration');

  const [levelIdx, setLevelIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('scoring');
  const [scoringInput, setScoringInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [highestLevel, setHighestLevel] = useState(0);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  const currentLevel = LEVELS[levelIdx];

  function handleDigit(d: string) {
    if (scoringInput.length >= 3) return;
    setScoringInput(prev => prev + d);
  }

  function handleDelete() {
    setScoringInput(prev => prev.slice(0, -1));
  }

  function submitScoringDarts() {
    const val = parseInt(scoringInput, 10);
    setScoringInput('');
    if (isNaN(val) || val < currentLevel.minScore) {
      setMessage(`❌ Te weinig — je hebt ${currentLevel.minScore}+ nodig met 2 pijlen`);
      setAttempts(a => a + 1);
    } else {
      setMessage(`✅ Goed! Nu op ${currentLevel.label}`);
      setStage('doubling');
    }
  }

  function registerDouble(hit: boolean) {
    setAttempts(a => a + 1);
    if (hit) {
      const newHighest = Math.max(highestLevel, currentLevel.level);
      setHighestLevel(newHighest);
      const nextIdx = levelIdx + 1;
      if (nextIdx >= LEVELS.length) {
        setMessage('🏆 Alle levels voltooid!');
        setDone(true);
        save(newHighest, { attempts });
      } else {
        setMessage(`🎯 Level ${currentLevel.level} gehaald! Door naar level ${nextIdx + 1}`);
        setLevelIdx(nextIdx);
        setStage('scoring');
      }
    } else {
      setMessage(`Miss op ${currentLevel.label} — opnieuw beginnen van level ${currentLevel.level}`);
      setStage('scoring');
    }
  }

  function stopAndSave() {
    setDone(true);
    save(highestLevel, { attempts });
  }

  function restart() {
    setLevelIdx(0);
    setStage('scoring');
    setScoringInput('');
    setAttempts(0);
    setHighestLevel(0);
    setDone(false);
    setMessage('');
  }

  return (
    <DrillShell drillId="frustration">
      <div className="px-4 py-3 flex flex-col gap-4">
        {done ? (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 text-center">
              <p className="text-text-secondary text-sm mb-1">Hoogste level</p>
              <p className="text-6xl font-black text-accent">{highestLevel}</p>
              <p className="text-text-secondary text-sm mt-1">van 8 · {attempts} pogingen</p>
            </div>
            <Button variant="primary" size="lg" fullWidth onPointerDown={restart}>Opnieuw</Button>
            <Button variant="secondary" size="lg" fullWidth onPointerDown={() => navigate('/training')}>Terug</Button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-text-secondary text-xs">Level</p>
                  <p className="text-4xl font-black text-accent">{currentLevel.level}/8</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-xs">Fase</p>
                  <p className="text-2xl font-black text-text-primary">{stage === 'scoring' ? '🎯 Score' : '🎯 Dubbel'}</p>
                </div>
              </div>
              {message && <p className="text-sm mt-1 text-text-secondary">{message}</p>}
            </div>

            <div className="bg-surface rounded-2xl p-3">
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map((l, i) => (
                  <div key={l.level} className={`px-2 py-1 rounded-lg text-xs font-bold ${i === levelIdx ? 'bg-accent text-black' : i < levelIdx ? 'bg-accent/20 text-accent' : 'bg-surface2 text-text-secondary'}`}>
                    L{l.level}
                  </div>
                ))}
              </div>
            </div>

            {stage === 'scoring' ? (
              <>
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-text-secondary text-sm">Gooi <span className="text-accent font-bold">{currentLevel.minScore}+</span> met 2 pijlen</p>
                  <p className="text-text-secondary text-xs mt-0.5">Dan mag je op {currentLevel.label} gooien</p>
                </div>

                <div className="bg-surface rounded-2xl p-4 text-center">
                  <p className="text-text-secondary text-xs">Score met 2 pijlen</p>
                  <p className="text-5xl font-black text-text-primary tabular min-h-[60px]">{scoringInput || '—'}</p>
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
                <Button variant="primary" size="lg" fullWidth onPointerDown={submitScoringDarts} disabled={!scoringInput}>Bevestig</Button>
              </>
            ) : (
              <>
                <div className="bg-surface rounded-2xl p-4 text-center">
                  <p className="text-text-secondary text-sm">Gooi nu op</p>
                  <p className="text-5xl font-black text-accent">{currentLevel.label}</p>
                  <p className="text-text-secondary text-xs mt-1">1 pijl — raak = level up, mis = opnieuw</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onPointerDown={() => registerDouble(true)}
                    className="h-24 bg-accent rounded-2xl text-black font-black text-2xl active:scale-95 transition-transform touch-manipulation"
                  >
                    ✓ Dubbel!
                  </button>
                  <button
                    onPointerDown={() => registerDouble(false)}
                    className="h-24 bg-surface2 rounded-2xl text-text-primary font-black text-2xl active:scale-95 transition-transform touch-manipulation"
                  >
                    ✗ Mis
                  </button>
                </div>
              </>
            )}

            <Button variant="secondary" size="sm" fullWidth onPointerDown={stopAndSave}>Stop & opslaan (level {highestLevel})</Button>
          </>
        )}
      </div>
    </DrillShell>
  );
}
