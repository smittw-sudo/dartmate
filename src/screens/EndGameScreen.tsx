import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { Trophy, RotateCcw, Home, Zap } from 'lucide-react';
import { updateStatsAfterGame } from '../engine/statsEngine';

export function EndGameScreen() {
  const navigate = useNavigate();
  const game = useGameStore(s => s.game);
  const endGame = useGameStore(s => s.endGame);
  const startGame = useGameStore(s => s.startGame);
  const players = useAppStore(s => s.players);
  const updatePlayer = useAppStore(s => s.updatePlayer);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!game?.isGameOver) { navigate('/'); return; }
    if (saved) return;
    setSaved(true);

    // checkoutDouble is already stored in each leg record (captured inline during play)
    endGame().then(async (record) => {
      if (!record) return;
      for (const pid of record.playerIds) {
        const player = players.find(p => p.id === pid);
        if (player) {
          const updated = updateStatsAfterGame(player, record);
          await updatePlayer(updated);
        }
      }
    });
  }, [game?.isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game?.isGameOver) return null;

  const winner = players.find(p => p.id === game.winnerId);

  const handleNewGame = () => {
    if (!game) return;
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
