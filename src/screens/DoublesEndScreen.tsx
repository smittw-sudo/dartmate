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

  const isMultiplayer = snap.playerIds.length > 1;
  const duration = Math.round((Date.now() - snap.startTime) / 60000);

  // Per-player summary
  const playerSummaries = snap.playerIds.map(pid => {
    const results = snap.results[pid] ?? [];
    const totalDarts = results.reduce((s, r) => s + r.dartsThrown, 0);
    const totalAttempts = results.reduce((s, r) => s + r.attempts, 0);
    const firstTryCount = results.filter(r => r.attempts === 1).length;
    return {
      pid,
      name: snap.playerNames[pid],
      results,
      totalDarts,
      totalAttempts,
      avgAttempts: results.length > 0 ? (totalAttempts / results.length).toFixed(1) : '—',
      avgDarts: results.length > 0 ? (totalDarts / results.length).toFixed(1) : '—',
      firstTryCount,
    };
  });

  // Sort by total darts ascending (fewer = better)
  const ranked = [...playerSummaries].sort((a, b) => a.totalDarts - b.totalDarts);
  const winner = ranked[0];

  // For single-player: use their results directly
  const solo = playerSummaries[0];
  const soloResults = solo.results;
  const soloBest = soloResults.length > 0
    ? soloResults.reduce((b, r) => r.attempts < b.attempts ? r : b)
    : null;
  const soloWorst = soloResults.length > 0
    ? soloResults.reduce((w, r) => r.attempts > w.attempts ? r : w)
    : null;

  const handleOpnieuw = () => { reset(); navigate('/dubbels'); };
  const handleHome = () => { reset(); navigate('/'); };

  return (
    <div className="h-screen bg-background flex flex-col pt-safe-top pb-safe-bottom">
      <div className="flex-1 px-6 py-8 overflow-y-auto space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <Trophy size={48} className="text-accent mx-auto" />
          <h1 className="text-3xl font-black text-text-primary">Sessie Klaar!</h1>
          <p className="text-text-secondary text-sm">
            {isMultiplayer
              ? `${snap.playerIds.length} spelers · ${snap.sequence.length} dubbels · ${duration} min`
              : `${solo.name} · ${snap.sequence.length} dubbels · ${duration} min`}
          </p>
        </motion.div>

        {/* Multiplayer leaderboard */}
        {isMultiplayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Uitslag</h2>
            <div className="bg-surface rounded-2xl overflow-hidden">
              {ranked.map((p, i) => (
                <div
                  key={p.pid}
                  className={`flex items-center gap-3 px-4 py-3 ${i < ranked.length - 1 ? 'border-b border-surface2' : ''}`}
                >
                  <span className={`text-lg font-black w-6 text-center ${i === 0 ? 'text-accent' : 'text-text-secondary'}`}>
                    {i === 0 ? '🏆' : i + 1}
                  </span>
                  <span className={`font-bold flex-1 ${i === 0 ? 'text-accent' : 'text-text-primary'}`}>
                    {p.name}
                  </span>
                  <div className="text-right">
                    <div className="text-text-primary text-sm font-semibold">{p.totalDarts} pijlen</div>
                    <div className="text-text-secondary text-xs">gem. {p.avgAttempts} pogingen</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Single-player summary stats */}
        {!isMultiplayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard label="Totaal pijlen" value={solo.totalDarts} />
            <StatCard label="Gem. pogingen" value={solo.avgAttempts} />
            <StatCard label="Gem. pijlen/dubbel" value={solo.avgDarts} />
            <StatCard label="In 1e poging" value={`${solo.firstTryCount}/${soloResults.length}`} />
          </motion.div>
        )}

        {/* Multiplayer per-player detail */}
        {isMultiplayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            {ranked.map(p => (
              <div key={p.pid} className="bg-surface rounded-2xl p-4">
                <p className={`font-bold text-sm mb-2 ${p.pid === winner.pid ? 'text-accent' : 'text-text-primary'}`}>
                  {p.name}
                </p>
                <p className="text-text-secondary text-xs">{p.totalDarts} pijlen</p>
                <p className="text-text-secondary text-xs">gem. {p.avgAttempts} pogingen</p>
                <p className="text-text-secondary text-xs">{p.firstTryCount}× in 1e poging</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Per-double results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Per dubbel</h2>
          <div className="bg-surface rounded-2xl overflow-hidden">
            {snap.sequence.map((d, i) => (
              <div
                key={d}
                className={`px-4 py-3 ${i < snap.sequence.length - 1 ? 'border-b border-surface2' : ''}`}
              >
                {isMultiplayer ? (
                  <div className="flex items-start gap-3">
                    <span className="font-black text-lg text-text-primary w-10 shrink-0">D{d}</span>
                    <div className="flex-1 space-y-0.5">
                      {snap.playerIds.map(pid => {
                        const r = snap.results[pid]?.[i];
                        if (!r) return null;
                        const isBest = snap.playerIds.every(
                          other => !snap.results[other]?.[i] || snap.results[other][i].attempts >= r.attempts
                        );
                        return (
                          <div key={pid} className="flex justify-between">
                            <span className={`text-sm ${isBest ? 'text-accent font-semibold' : 'text-text-secondary'}`}>
                              {snap.playerNames[pid]}
                            </span>
                            <span className="text-text-secondary text-xs">
                              {r.attempts} poging{r.attempts !== 1 ? 'en' : ''} · {r.dartsThrown} pijlen
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-lg ${soloResults[i] === soloBest ? 'text-accent' : soloResults[i] === soloWorst && soloResults.length > 1 && soloResults[i].attempts > (soloBest?.attempts ?? 0) ? 'text-danger' : 'text-text-primary'}`}>
                      D{d}
                    </span>
                    <span className="text-text-secondary text-sm">
                      {soloResults[i]?.attempts} poging{soloResults[i]?.attempts !== 1 ? 'en' : ''} · {soloResults[i]?.dartsThrown} pijlen
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="shrink-0 px-6 pb-8 pt-3 space-y-3 border-t border-surface2">
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
