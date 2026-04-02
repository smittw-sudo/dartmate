import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { useDoublesStore } from '../store/doublesStore';
import { Button } from '../components/ui/Button';
import { haptics } from '../utils/haptics';

export function DoublesGameScreen() {
  const navigate = useNavigate();
  const session = useDoublesStore(s => s.session);
  const registerMiss = useDoublesStore(s => s.registerMiss);
  const registerHit = useDoublesStore(s => s.registerHit);
  const skipCurrent = useDoublesStore(s => s.skipCurrent);
  const reset = useDoublesStore(s => s.reset);

  const [showHitModal, setShowHitModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!session) { navigate('/dubbels'); return; }
    if (session.isComplete) { navigate('/dubbels/einde'); }
  }, [session, navigate]);

  if (!session || session.isComplete) return null;

  const isMultiplayer = session.playerIds.length > 1;
  const currentPlayerId = session.playerIds[session.currentPlayerIndex];
  const currentPlayerName = session.playerNames[currentPlayerId];
  const currentDouble = session.sequence[session.currentIndex];
  const total = session.sequence.length;
  const progress = session.currentIndex / total;
  const remaining = total - session.currentIndex;
  const wasSkipped = session.skippedDoubles.includes(currentDouble);
  const canSkip = !wasSkipped && remaining > 1;

  // Players who already finished this double (before current player in turn order)
  const doneThisDouble = session.playerIds
    .slice(0, session.currentPlayerIndex)
    .map(pid => ({
      name: session.playerNames[pid],
      result: session.results[pid][session.results[pid].length - 1],
    }));

  // Streak: trailing consecutive first-attempt hits for current player
  const currentPlayerResults = session.results[currentPlayerId] ?? [];
  const streak = (() => {
    let s = 0;
    for (let i = currentPlayerResults.length - 1; i >= 0; i--) {
      if (currentPlayerResults[i].attempts === 1) s++;
      else break;
    }
    return s;
  })();

  const handleMiss = () => {
    haptics.tap?.() ?? haptics.confirm();
    registerMiss();
  };

  const handleHit = (darts: 1 | 2 | 3) => {
    const isFirstAttempt = session.currentAttempts === 0;
    haptics.legWon();
    if (isFirstAttempt) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        registerHit(darts);
      }, 1200);
    } else {
      registerHit(darts);
    }
    setShowHitModal(false);
  };

  const handleBack = () => {
    const confirmed = window.confirm('Sessie stoppen?');
    if (confirmed) { reset(); navigate('/dubbels'); }
  };

  return (
    <div className="h-screen bg-background flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4 shrink-0">
        <button onPointerDown={handleBack} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-secondary" />
        </button>
        <span className="text-text-secondary text-sm font-semibold">
          {session.currentIndex} / {total} gereed
        </span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="mx-6 h-2 bg-surface2 rounded-full overflow-hidden mb-6 shrink-0">
        <motion.div
          className="h-full bg-accent rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Streak badge */}
      <AnimatePresence>
        {streak >= 2 && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center mb-3 shrink-0"
          >
            <span className="bg-accent/20 text-accent text-sm font-bold px-4 py-1.5 rounded-full">
              {isMultiplayer ? `${currentPlayerName}: ` : ''}Streak: {streak} op rij!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main double display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 min-h-0">
        <motion.div
          key={currentDouble}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <span className="text-4xl font-bold text-text-secondary">D</span>
          <span className="text-8xl font-black text-accent tabular">{currentDouble}</span>
        </motion.div>

        <div className="text-center space-y-1">
          {wasSkipped && (
            <p className="text-warning text-xs font-semibold uppercase tracking-wide">Eerder overgeslagen</p>
          )}
          {isMultiplayer && (
            <p className="text-accent font-bold text-lg">{currentPlayerName}</p>
          )}
          <p className="text-text-secondary text-base font-semibold">
            Poging {session.currentAttempts + 1}
          </p>
          {session.currentDarts > 0 && (
            <p className="text-text-secondary text-sm">{session.currentDarts} pijlen gegooid</p>
          )}
        </div>

        {/* Done players for this double */}
        {doneThisDouble.length > 0 && (
          <div className="flex flex-col gap-1 w-full max-w-xs">
            {doneThisDouble.map(({ name, result }) => (
              <div key={name} className="flex items-center justify-between bg-surface2 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-accent shrink-0" />
                  <span className="text-text-secondary text-sm">{name}</span>
                </div>
                <span className="text-text-secondary text-xs">
                  {result?.attempts} poging{result?.attempts !== 1 ? 'en' : ''} · {result?.dartsThrown} pijlen
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-8 shrink-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" size="xl" fullWidth onPointerDown={handleMiss}>
            Mis
          </Button>
          <Button variant="primary" size="xl" fullWidth onPointerDown={() => setShowHitModal(true)}>
            Raak!
          </Button>
        </div>
        {canSkip && (
          <button
            onPointerDown={skipCurrent}
            className="w-full py-3 text-text-secondary text-sm font-semibold touch-manipulation active:text-text-primary transition-colors"
          >
            Sla over → komt later terug
          </button>
        )}
      </div>

      {/* Hit modal overlay */}
      <AnimatePresence>
        {showHitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-end justify-center z-50 pb-8 px-6"
            onPointerDown={() => setShowHitModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4"
              onPointerDown={e => e.stopPropagation()}
            >
              <p className="text-text-primary font-bold text-center text-lg">
                Met hoeveel pijlen?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([1, 2, 3] as const).map(n => (
                  <button
                    key={n}
                    onPointerDown={() => handleHit(n)}
                    className="h-16 rounded-xl text-2xl font-black bg-surface2 text-text-primary active:bg-accent active:text-black touch-manipulation"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-attempt celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-accent rounded-3xl px-10 py-8 text-center shadow-2xl">
              {isMultiplayer && <p className="text-black text-xl font-bold mb-1">{currentPlayerName}</p>}
              <p className="text-black text-3xl font-black">Raak in</p>
              <p className="text-black text-3xl font-black">1 poging!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
