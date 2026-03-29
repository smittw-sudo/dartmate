import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useGameStore } from '../store/gameStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { Play, Users, History, Target, Clock, LogOut } from 'lucide-react';
import { signOut } from '../lib/supabase';

export function HomeScreen() {
  const navigate = useNavigate();
  const { players, pausedGames, loadAll } = useAppStore();
  const resumeGame = useGameStore(s => s.resumeGame);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleResume = (gameId: string) => {
    const paused = pausedGames.find(g => g.gameId === gameId);
    if (paused) {
      resumeGame(paused);
      navigate('/spel');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe-top pb-safe-bottom px-safe-left px-safe-right">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <Target size={32} className="text-accent" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">DartMate</h1>
        </div>
        <button onPointerDown={() => signOut()} className="p-2 touch-manipulation">
          <LogOut size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-6">
        {/* New Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onPointerDown={() => navigate('/nieuw-spel')}
            className="h-20 text-2xl font-black"
          >
            <Play size={28} className="mr-3" fill="currentColor" />
            Nieuw Spel
          </Button>
        </motion.div>

        {/* Navigation */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPointerDown={() => navigate('/spelers')}
          >
            <Users size={20} className="mr-2" /> Spelers
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPointerDown={() => navigate('/geschiedenis')}
          >
            <History size={20} className="mr-2" /> Geschiedenis
          </Button>
        </motion.div>

        {/* Paused Games */}
        {pausedGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Lopende Potjes
            </h2>
            <div className="space-y-2">
              {pausedGames.map(g => {
                const gameTypeLabel = g.gameType === 'cricket' ? 'Cricket' :
                  g.gameType === 'x01_501' ? '501' :
                  g.gameType === 'x01_301' ? '301' : '101';
                const pausedDate = g.pausedAt ? new Date(g.pausedAt).toLocaleString('nl-NL', {
                  hour: '2-digit', minute: '2-digit',
                }) : '';
                return (
                  <button
                    key={g.gameId}
                    onPointerDown={() => handleResume(g.gameId)}
                    className="w-full bg-surface rounded-2xl p-4 flex items-center gap-4 active:bg-surface2 touch-manipulation"
                  >
                    <Clock size={20} className="text-warning shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-text-primary font-semibold">{gameTypeLabel}</div>
                      <div className="text-text-secondary text-sm">{g.playerIds.length} spelers · {pausedDate}</div>
                    </div>
                    <div className="text-accent text-sm font-semibold">Hervat →</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent players */}
        {players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Spelers
            </h2>
            <div className="flex flex-wrap gap-3">
              {players.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  onPointerDown={() => navigate(`/speler/${p.id}`)}
                  className="flex flex-col items-center gap-1 touch-manipulation"
                >
                  <PlayerAvatar name={p.name} size="lg" />
                  <span className="text-xs text-text-secondary max-w-[56px] truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
