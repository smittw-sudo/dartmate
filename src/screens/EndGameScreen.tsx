import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { Trophy, RotateCcw, Home, Zap } from 'lucide-react';
import { GameRecord } from '../data/types';
import { updateStatsAfterGame } from '../engine/statsEngine';

const DOUBLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,'bull'] as const;

type EndStep = 'checkout' | 'result';

export function EndGameScreen() {
  const navigate = useNavigate();
  const game = useGameStore(s => s.game);
  const endGame = useGameStore(s => s.endGame);
  const startGame = useGameStore(s => s.startGame);
  const players = useAppStore(s => s.players);
  const updatePlayer = useAppStore(s => s.updatePlayer);
  const showAnimation = useGameStore(s => s.showAnimation);

  const [step, setStep] = useState<EndStep>('checkout');
  const [checkoutDouble, setCheckoutDouble] = useState<number | null>(null);
  const [finalRecord, setFinalRecord] = useState<GameRecord | null>(null);

  useEffect(() => {
    if (!game?.isGameOver) navigate('/');
  }, [game, navigate]);

  if (!game?.isGameOver) return null;

  const winner = players.find(p => p.id === game.winnerId);

  const handleCheckoutConfirm = async (dbl: number | null) => {
    setCheckoutDouble(dbl);
    // Save game
    const record = await endGame();
    setFinalRecord(record);

    // Update player stats
    if (record) {
      for (const pid of record.playerIds) {
        const player = players.find(p => p.id === pid);
        if (player) {
          let updated = updateStatsAfterGame(player, record);
          // Save preferred double for winner
          if (pid === record.winnerId && dbl !== null) {
            updated = {
              ...updated,
              preferredDoubles: {
                ...updated.preferredDoubles,
                [dbl]: (updated.preferredDoubles[dbl] ?? 0) + 1,
              },
            };
          }
          await updatePlayer(updated);
        }
      }
    }

    setStep('result');
  };

  const handleNewGame = () => {
    if (!game) return;
    // Reverse order
    const reversed = [...game.playerIds].reverse();
    startGame({
      gameType: game.gameType,
      format: game.format,
      playerIds: reversed,
      teams: game.teams,
      legsToWinSet: 4,
      setsToWin: 3,
    });
    navigate('/spel');
  };

  const handleNewType = () => navigate('/nieuw-spel');
  const handleHome = () => navigate('/');

  // Checkout selection step
  if (step === 'checkout' && winner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-6 pt-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center mb-8">
            <PlayerAvatar name={winner.name} size="xl" />
            <h1 className="text-3xl font-black text-text-primary mt-4">{winner.name} wint!</h1>
          </div>

          <h2 className="text-lg font-semibold text-text-secondary mb-4 text-center">
            Met welke dubbel heeft {winner.name} uitgegooid?
          </h2>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {DOUBLES.map(d => {
              const label = d === 'bull' ? 'Bull' : `D${d}`;
              const val = d === 'bull' ? 50 : Number(d);
              return (
                <button
                  key={d}
                  onPointerDown={() => handleCheckoutConfirm(val)}
                  className="h-12 bg-surface2 rounded-xl text-sm font-bold text-text-primary active:bg-accent active:text-black touch-manipulation"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onPointerDown={() => handleCheckoutConfirm(null)}
          >
            Overslaan
          </Button>
        </motion.div>
      </div>
    );
  }

  // Result step
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Trophy size={80} className="text-warning" />
        </motion.div>

        {winner && (
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar name={winner.name} size="xl" />
            <h1 className="text-4xl font-black text-text-primary">{winner.name}</h1>
            <p className="text-text-secondary text-lg">wint het potje!</p>
          </div>
        )}

        {/* Score overview */}
        <div className="w-full bg-surface rounded-2xl p-4 space-y-2">
          {game.playerIds.map(pid => {
            const p = players.find(x => x.id === pid);
            const legsWon = game.legsWon[pid] ?? 0;
            return (
              <div key={pid} className="flex items-center gap-3">
                <PlayerAvatar name={p?.name ?? '?'} size="sm" />
                <span className="flex-1 text-text-primary font-semibold">{p?.name}</span>
                <span className={`font-bold text-lg ${pid === game.winnerId ? 'text-accent' : 'text-text-secondary'}`}>
                  {legsWon} {legsWon === 1 ? 'leg' : 'legs'}
                </span>
                {pid === game.winnerId && <Trophy size={16} className="text-warning" />}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <Button variant="primary" size="xl" fullWidth onPointerDown={handleNewGame}>
            <RotateCcw size={20} className="mr-2" /> Nog een potje
          </Button>
          <Button variant="secondary" size="lg" fullWidth onPointerDown={handleNewType}>
            <Zap size={20} className="mr-2" /> Ander speltype
          </Button>
          <Button variant="ghost" size="lg" fullWidth onPointerDown={handleHome}>
            <Home size={20} className="mr-2" /> Terug naar start
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
