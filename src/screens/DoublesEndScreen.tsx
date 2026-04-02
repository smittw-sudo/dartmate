import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useDoublesStore, DoublesSession } from '../store/doublesStore';
import { Button } from '../components/ui/Button';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface rounded-2xl p-4 text-center">
      <div className="text-2xl font-black text-text-primary">{value}</div>
      <div className="text-text-secondary text-xs mt-1">{label}</div>
    </div>
  );
}

export function DoublesEndScreen() {
  const navigate = useNavigate();
  const session = useDoublesStore(s => s.session);
  const reset = useDoublesStore(s => s.reset);

  const [snap] = useState<DoublesSession | null>(() => session);

  useEffect(() => {
    if (!snap?.isComplete) navigate('/dubbels');
  }, []);

  if (!snap?.isComplete) return null;

  const { results } = snap;
  const totalDarts = results.reduce((s, r) => s + r.dartsThrown, 0);
  const totalAttempts = results.reduce((s, r) => s + r.attempts, 0);
  const avgAttempts = (totalAttempts / results.length).toFixed(1);
  const avgDarts = (totalDarts / results.length).toFixed(1);
  const firstTryCount = results.filter(r => r.attempts === 1).length;
  const bestResult = results.reduce((b, r) => r.attempts < b.attempts ? r : b);
  const worstResult = results.reduce((w, r) => r.attempts > w.attempts ? r : w);
  const duration = Math.round((Date.now() - snap.startTime) / 60000);

  const handleOpnieuw = () => { reset(); navigate('/dubbels'); };
  const handleHome = () => { reset(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe-top pb-safe-bottom">
      <div className="flex-1 px-6 py-8 overflow-y-auto space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <Trophy size={48} className="text-accent mx-auto" />
          <h1 className="text-3xl font-black text-text-primary">Sessie Klaar!</h1>
          <p className="text-text-secondary text-sm">{snap.playerName} · {results.length} dubbels · {duration} min</p>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard label="Totaal pijlen" value={totalDarts} />
          <StatCard label="Gem. pogingen" value={avgAttempts} />
          <StatCard label="Gem. pijlen/dubbel" value={avgDarts} />
          <StatCard label={`In 1e poging`} value={`${firstTryCount}/${results.length}`} />
        </motion.div>

        {/* Results table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Per dubbel</h2>
          <div className="bg-surface rounded-2xl overflow-hidden">
            {results.map((r, i) => {
              const isBest = r === bestResult;
              const isWorst = r === worstResult && results.length > 1 && r.attempts > bestResult.attempts;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 ${i < results.length - 1 ? 'border-b border-surface2' : ''}`}
                >
                  <span className={`font-black text-lg ${isBest ? 'text-accent' : isWorst ? 'text-danger' : 'text-text-primary'}`}>
                    D{r.double}
                  </span>
                  <span className="text-text-secondary text-sm">
                    {r.attempts} poging{r.attempts !== 1 ? 'en' : ''} · {r.dartsThrown} pijlen
                  </span>
                  {isBest && <span className="text-accent text-xs font-bold ml-2">best</span>}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-8 space-y-3">
        <Button variant="primary" size="xl" fullWidth onPointerDown={handleOpnieuw}>
          Opnieuw
        </Button>
        <Button variant="secondary" size="lg" fullWidth onPointerDown={handleHome}>
          Naar huis
        </Button>
      </div>
    </div>
  );
}
