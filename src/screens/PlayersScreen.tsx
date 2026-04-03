import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, X, ChevronRight } from 'lucide-react';
import { getWinPercentage, getAverageFromStats } from '../engine/statsEngine';

export function PlayersScreen() {
  const navigate = useNavigate();
  const { players, addPlayer } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addPlayer(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Spelers</h1>
        <button
          onPointerDown={() => setShowAdd(true)}
          className="p-2 bg-accent rounded-xl touch-manipulation"
        >
          <Plus size={24} className="text-black" />
        </button>
      </div>

      {/* Add Player modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdd(false)} />
            <motion.div
              className="relative z-10 bg-surface rounded-t-3xl p-6 w-full max-w-lg"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Nieuw profiel</h2>
                <button onPointerDown={() => setShowAdd(false)}>
                  <X size={24} className="text-text-secondary" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Naam"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
                className="w-full bg-surface2 text-text-primary rounded-xl px-4 py-3 text-lg mb-4 outline-none border border-transparent focus:border-accent"
              />
              <Button variant="primary" size="lg" fullWidth onPointerDown={handleAdd} disabled={!newName.trim()}>
                Aanmaken
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player list */}
      <div className="flex-1 px-6 py-2 overflow-y-auto space-y-2">
        {players.length === 0 && (
          <div className="text-center text-text-secondary py-12">
            <p className="text-lg">Nog geen spelers.</p>
            <p className="text-sm mt-1">Tik op + om een profiel aan te maken.</p>
          </div>
        )}
        {players.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onPointerDown={() => navigate(`/speler/${p.id}`)}
            className="w-full bg-surface rounded-2xl p-4 flex items-center gap-4 active:bg-surface2 touch-manipulation"
          >
            <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size="lg" />
            <div className="flex-1 text-left">
              <div className="flex items-baseline gap-2">
                <div className="text-text-primary font-semibold text-lg">{p.name}</div>
                {p.nickname && (
                  <div className="text-accent text-sm font-medium">"{p.nickname}"</div>
                )}
              </div>
              <div className="text-text-secondary text-sm">
                {p.stats.gamesPlayed} potjes · {getWinPercentage(p.stats)}% gewonnen · avg {getAverageFromStats(p.stats).toFixed(1)}
              </div>
            </div>
            <ChevronRight size={20} className="text-text-secondary" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
