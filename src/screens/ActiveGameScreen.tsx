import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAppStore } from '../store/appStore';
import { useGame } from '../hooks/useGame';
import { TotalScoreInput } from '../components/game/TotalScoreInput';
import { DartboardInput } from '../components/game/DartboardInput';
import { CricketInput } from '../components/game/CricketInput';
import { CheckoutBar } from '../components/ui/CheckoutBar';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { OneEightyAnimation } from '../components/animations/OneEightyAnimation';
import { BrokenAnimation } from '../components/animations/BrokenAnimation';
import { LegWonAnimation } from '../components/animations/LegWonAnimation';
import { Button } from '../components/ui/Button';
import { Pause, RotateCcw, Settings } from 'lucide-react';
import { calculateAverage, getAverageFromStats } from '../engine/statsEngine';
import { resolvePlayer } from '../data/types';

export function ActiveGameScreen() {
  const navigate = useNavigate();
  const game = useGameStore(s => s.game);
  const pauseGame = useGameStore(s => s.pauseGame);
  const undoLastVisit = useGameStore(s => s.undoLastVisit);
  const showAnimation = useGameStore(s => s.showAnimation);
  const animationData = useGameStore(s => s.animationData);
  const clearAnimation = useGameStore(s => s.clearAnimation);
  const completedLegs = useGameStore(s => s.completedLegs);
  const pendingCricketFinish = useGameStore(s => s.pendingCricketFinish);
  const confirmCricketFinish = useGameStore(s => s.confirmCricketFinish);

  const players = useAppStore(s => s.players);
  const inputMode = useAppStore(s => s.inputMode);
  const setInputMode = useAppStore(s => s.setInputMode);

  const { checkoutSuggestion, currentPlayerId } = useGame();

  useEffect(() => {
    if (!game) navigate('/');
  }, [game, navigate]);

  useEffect(() => {
    if (game?.isGameOver) {
      setTimeout(() => navigate('/einde'), 1500);
    }
  }, [game?.isGameOver, navigate]);

  if (!game) return null;

  const isCricket = game.gameType === 'cricket';

  const handlePause = async () => {
    await pauseGame();
    navigate('/');
  };

  const getPlayerVisits = (playerId: string) => {
    return game.visits.filter(v => v.playerId === playerId);
  };

  const getAverage = (playerId: string) => {
    // Inclusief afgeronde legs — consistent met het opgeslagen game-gemiddelde
    let scored = 0;
    let darts = 0;
    for (const leg of completedLegs) {
      for (const v of leg.visits) {
        if (v.playerId !== playerId) continue;
        if (!v.isBust) scored += v.totalScore;
        darts += v.dartsCount ?? v.darts.length;
      }
    }
    for (const v of game.visits.filter(v => v.playerId === playerId)) {
      if (!v.isBust) scored += v.totalScore;
      darts += v.dartsCount ?? v.darts.length;
    }
    if (darts === 0) return 0;
    return calculateAverage(scored, darts);
  };

  const getDartsThrown = (playerId: string) => {
    let total = 0;
    for (const leg of completedLegs) {
      for (const v of leg.visits) {
        if (v.playerId === playerId) total += v.dartsCount ?? v.darts.length;
      }
    }
    for (const v of game.visits) {
      if (v.playerId === playerId) total += v.dartsCount ?? v.darts.length;
    }
    return total;
  };

  const getLastVisitScore = (playerId: string) => {
    const visits = getPlayerVisits(playerId).filter(v => !v.isBust);
    if (visits.length === 0) return null;
    return visits[visits.length - 1].totalScore;
  };

  const gameTypeLabel = isCricket ? 'Cricket' :
    game.gameType === 'x01_501' ? '501' :
    game.gameType === 'x01_301' ? '301' : '101';

  const animationPlayer = resolvePlayer(animationData ?? '', players);
  const displayName = (pid: string) => {
    const p = resolvePlayer(pid, players);
    return p?.nickname || p?.name || '?';
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Cricket finish dart count modal */}
      {pendingCricketFinish && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-text-primary font-bold text-center text-lg">
              Hoeveel pijlen deze beurt?
            </p>
            <p className="text-text-secondary text-sm text-center">
              Met hoeveel pijlen heb je de laatste slag gemaakt?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onPointerDown={() => confirmCricketFinish(n)}
                  className="h-16 rounded-xl text-2xl font-black bg-surface2 text-text-primary active:bg-accent active:text-black touch-manipulation active:scale-95 transition-transform"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <OneEightyAnimation
        visible={showAnimation === 'oneEighty'}
        playerName={animationPlayer ? (animationPlayer.nickname || animationPlayer.name) : ''}
        onDone={clearAnimation}
      />
      <BrokenAnimation
        visible={showAnimation === 'broken'}
        playerName={animationPlayer ? (animationPlayer.nickname || animationPlayer.name) : ''}
        onDone={clearAnimation}
      />
      <LegWonAnimation
        visible={showAnimation === 'legWon'}
        playerName={animationPlayer ? (animationPlayer.nickname || animationPlayer.name) : ''}
        onDone={clearAnimation}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface shrink-0">
        <div className="w-16" />

        <div className="flex items-center gap-2">
          <span className="text-text-primary font-bold">{gameTypeLabel}</span>
          <span className="text-text-secondary text-sm">
            Leg {game.currentLeg}
            {game.format === 'competition' ? ` · Set ${game.currentSet}` : ''}
          </span>
        </div>

        <button onPointerDown={undoLastVisit} className="flex items-center gap-2 p-2 touch-manipulation">
          <RotateCcw size={20} className="text-text-secondary" />
          <span className="text-text-secondary text-sm">Undo</span>
        </button>
      </div>

      {/* Player cards */}
      <div className="flex gap-2 px-3 py-2 shrink-0 overflow-x-auto">
        {game.playerIds.map(pid => {
          const player = resolvePlayer(pid, players);
          const isCurrent = pid === currentPlayerId;
          const score = game.scores[pid];
          const avg = getAverage(pid);
          const lastScore = getLastVisitScore(pid);
          const legsWon = game.legsWon[pid] ?? 0;
          const careerAvg = !isCricket && player ? getAverageFromStats(player.stats) : 0;
          const dartsThrown = getDartsThrown(pid);

          return (
            <motion.div
              key={pid}
              className={`flex-1 min-w-[120px] bg-surface rounded-2xl p-3 flex flex-col gap-1 ${isCurrent ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
              animate={isCurrent ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <PlayerAvatar name={player?.name ?? '?'} avatarUrl={player?.avatarUrl} size="sm" />
                <span className="text-text-primary font-semibold text-sm truncate">{displayName(pid)}</span>
                {legsWon > 0 && (
                  <span className="ml-auto text-accent text-xs font-bold">{legsWon}L</span>
                )}
              </div>

              <div className={`text-4xl font-black tabular leading-none ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                {isCricket ? '—' : score}
              </div>

              <div className="text-text-secondary text-xs">
                gem. {avg.toFixed(1)}
                {!isCricket && careerAvg > 0 && (
                  <span className="opacity-40 ml-1">/ {careerAvg.toFixed(1)}</span>
                )}
              </div>
              {dartsThrown > 0 && (
                <div className="text-text-secondary text-xs opacity-60">{dartsThrown} pijlen</div>
              )}
              {isCurrent && (
                <div className="text-accent text-xs font-bold uppercase tracking-wide">Aan de beurt</div>
              )}

              {lastScore !== null && !isCurrent && (
                <div className="text-text-secondary text-xs">laatste: {lastScore}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Checkout bar */}
      {!isCricket && currentPlayerId && (
        <div className="px-3 pb-1 shrink-0">
          <CheckoutBar
            score={game.scores[currentPlayerId] ?? 0}
            suggestion={checkoutSuggestion}
          />
        </div>
      )}

      {/* Input mode toggle */}
      {!isCricket && (
        <div className="flex gap-1 px-3 pb-2 shrink-0">
          <button
            onPointerDown={() => setInputMode('total')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold touch-manipulation transition-colors ${inputMode === 'total' ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'}`}
          >
            Totaalscore
          </button>
          <button
            onPointerDown={() => setInputMode('dartboard')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold touch-manipulation transition-colors ${inputMode === 'dartboard' ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'}`}
          >
            Dartbord
          </button>
        </div>
      )}

      {/* Pauze-knop onderaan — bereikbaar met duim */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onPointerDown={handlePause}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-surface rounded-xl touch-manipulation active:bg-surface2 transition-colors"
        >
          <Pause size={18} className="text-text-secondary" />
          <span className="text-text-secondary text-sm">Pauze</span>
        </button>
      </div>

      {/* Score input */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isCricket ? (
          <CricketInput />
        ) : inputMode === 'total' ? (
          <TotalScoreInput />
        ) : (
          <DartboardInput />
        )}
      </div>
    </div>
  );
}
