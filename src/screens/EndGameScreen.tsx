import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { Trophy, RotateCcw, Home, Zap, BarChart2, Dumbbell } from 'lucide-react';
import { updateStatsAfterGame } from '../engine/statsEngine';
import { ActiveGameState, GameRecord, resolvePlayer, GUEST_PLAYER_ID } from '../data/types';
import { updateGameH2HFlag } from '../lib/supabase';

export function EndGameScreen() {
  const navigate = useNavigate();
  const game = useGameStore(s => s.game);
  const endGame = useGameStore(s => s.endGame);
  const startGame = useGameStore(s => s.startGame);
  const players = useAppStore(s => s.players);
  const updatePlayer = useAppStore(s => s.updatePlayer);

  const [snapshot] = useState<ActiveGameState | null>(() => game);
  const [savedRecord, setSavedRecord] = useState<GameRecord | null>(null);
  // null = nog niet gekozen, true = telt mee, false = oefenpotje
  const [h2hChoice, setH2hChoice] = useState<boolean | null>(null);

  // Bepaal of H2H-keuze relevant is (2+ vaste spelers, geen gast-only)
  const registeredPlayerIds = snapshot?.playerIds.filter(id => id !== GUEST_PLAYER_ID) ?? [];
  const showH2HPrompt = registeredPlayerIds.length >= 2;

  useEffect(() => {
    if (!snapshot?.isGameOver) {
      navigate('/');
      return;
    }
    endGame().then(async (record) => {
      if (!record) return;
      setSavedRecord(record);
      for (const pid of record.playerIds) {
        const player = players.find(p => p.id === pid);
        if (player) {
          const updated = updateStatsAfterGame(player, record);
          await updatePlayer(updated);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!snapshot?.isGameOver) return null;

  const winner = snapshot.winnerId ? resolvePlayer(snapshot.winnerId, players) : undefined;

  const handleH2HChoice = async (counts: boolean) => {
    if (h2hChoice !== null || !savedRecord) return;
    setH2hChoice(counts);
    if (!counts) {
      await updateGameH2HFlag(savedRecord.id, false).catch(console.error);
    }
  };

  const handleNewGame = () => {
    const reversed = [...snapshot.playerIds].reverse();
    startGame({
      gameType: snapshot.gameType,
      format: snapshot.format,
      playerIds: reversed,
      teams: snapshot.teams,
      legsToWinSet: 4,
      setsToWin: 3,
    });
    navigate('/spel');
  };

  const handleNewType = () => navigate('/nieuw-spel');
  const handleHome = () => navigate('/');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.4 }}
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Trophy size={80} className="text-warning" />
        </motion.div>

        {/* Winner */}
        {winner && (
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar name={winner.name} avatarUrl={winner.avatarUrl} size="xl" />
            <h1 className="text-4xl font-black text-text-primary">{winner.nickname || winner.name}</h1>
            <p className="text-text-secondary text-lg">wint het potje!</p>
          </div>
        )}

        {/* Score overview */}
        <div className="w-full bg-surface rounded-2xl p-4 space-y-2">
          {snapshot.playerIds.map(pid => {
            const p = resolvePlayer(pid, players);
            const legsWon = snapshot.legsWon[pid] ?? 0;
            return (
              <div key={pid} className="flex items-center gap-3">
                <PlayerAvatar name={p?.name ?? '?'} avatarUrl={p?.avatarUrl} size="sm" />
                <span className="flex-1 text-text-primary font-semibold">{p?.nickname || p?.name}</span>
                <span className={`font-bold text-lg ${pid === snapshot.winnerId ? 'text-accent' : 'text-text-secondary'}`}>
                  {legsWon} {legsWon === 1 ? 'leg' : 'legs'}
                </span>
                {pid === snapshot.winnerId && <Trophy size={16} className="text-warning" />}
              </div>
            );
          })}
        </div>

        {/* H2H keuze */}
        <AnimatePresence>
          {showH2HPrompt && savedRecord && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {h2hChoice === null ? (
                <div className="w-full bg-surface rounded-2xl p-4">
                  <p className="text-text-primary font-semibold text-sm text-center mb-3">
                    Telt dit potje mee in de onderlinge stand?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onPointerDown={() => handleH2HChoice(true)}
                      className="flex flex-col items-center gap-1.5 bg-accent/10 border-2 border-accent rounded-xl py-3 px-2 touch-manipulation active:scale-95 transition-transform"
                    >
                      <BarChart2 size={20} className="text-accent" />
                      <span className="text-accent font-bold text-sm">Ja, meetellen</span>
                      <span className="text-text-secondary text-xs text-center leading-tight">Telt mee in H2H</span>
                    </button>
                    <button
                      onPointerDown={() => handleH2HChoice(false)}
                      className="flex flex-col items-center gap-1.5 bg-surface2 border-2 border-transparent rounded-xl py-3 px-2 touch-manipulation active:scale-95 transition-transform"
                    >
                      <Dumbbell size={20} className="text-text-secondary" />
                      <span className="text-text-primary font-bold text-sm">Oefenpotje</span>
                      <span className="text-text-secondary text-xs text-center leading-tight">Telt niet mee in H2H</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`w-full rounded-2xl p-3 flex items-center gap-2 ${
                  h2hChoice ? 'bg-accent/10' : 'bg-surface2'
                }`}>
                  {h2hChoice
                    ? <BarChart2 size={16} className="text-accent shrink-0" />
                    : <Dumbbell size={16} className="text-text-secondary shrink-0" />
                  }
                  <span className={`text-sm font-semibold ${h2hChoice ? 'text-accent' : 'text-text-secondary'}`}>
                    {h2hChoice ? 'Telt mee in de onderlinge stand' : 'Oefenpotje — telt niet mee in H2H'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actieknoppen */}
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
