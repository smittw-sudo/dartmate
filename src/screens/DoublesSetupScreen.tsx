import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Crosshair } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useDoublesStore } from '../store/doublesStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';

const COUNT_OPTIONS = [20, 15, 10, 5];

export function DoublesSetupScreen() {
  const navigate = useNavigate();
  const players = useAppStore(s => s.players);
  const startSession = useDoublesStore(s => s.startSession);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState<'random' | 'sequence'>('random');
  const [weakestFirst, setWeakestFirst] = useState(false);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const handleStart = () => {
    if (!selectedPlayer) return;
    startSession({
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      count,
      order,
      weakestFirst,
      preferredDoubles: selectedPlayer.preferredDoubles ?? {},
    });
    navigate('/dubbels/spel');
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Crosshair size={22} className="text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Dubbels Oefenen</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pb-4 overflow-y-auto space-y-6">
        {/* Player selection */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Speler</h2>
          <div className="space-y-2">
            {players.map(p => (
              <button
                key={p.id}
                onPointerDown={() => setSelectedPlayerId(p.id)}
                className={`w-full bg-surface rounded-2xl p-4 flex items-center gap-3 touch-manipulation border-2 transition-colors ${
                  selectedPlayerId === p.id ? 'border-accent' : 'border-transparent'
                }`}
              >
                <PlayerAvatar name={p.name} size="md" />
                <span className="text-text-primary font-semibold flex-1 text-left">{p.name}</span>
                {selectedPlayerId === p.id && <Check size={18} className="text-accent shrink-0" />}
              </button>
            ))}
            {players.length === 0 && (
              <p className="text-text-secondary text-sm text-center py-4">Geen spelers gevonden</p>
            )}
          </div>
        </motion.div>

        {/* Count */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Aantal dubbels</h2>
          <div className="flex gap-2">
            {COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onPointerDown={() => setCount(n)}
                className={`flex-1 h-12 rounded-xl text-lg font-bold touch-manipulation transition-colors ${
                  count === n ? 'bg-accent text-black' : 'bg-surface2 text-text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Order */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={weakestFirst ? 'opacity-40 pointer-events-none' : ''}
        >
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Volgorde</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['random', 'sequence'] as const).map(o => (
              <button
                key={o}
                onPointerDown={() => setOrder(o)}
                className={`bg-surface rounded-2xl p-4 text-left touch-manipulation border-2 transition-colors ${
                  order === o ? 'border-accent' : 'border-transparent'
                }`}
              >
                <div className="text-text-primary font-bold">{o === 'random' ? 'Willekeurig' : 'D20 → D1'}</div>
                <div className="text-text-secondary text-xs">{o === 'random' ? 'Gemengde volgorde' : 'Aflopend'}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Weakest first toggle */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onPointerDown={() => selectedPlayer && setWeakestFirst(v => !v)}
            disabled={!selectedPlayer}
            className={`w-full bg-surface rounded-2xl p-4 flex items-center justify-between touch-manipulation border-2 transition-colors ${
              weakestFirst ? 'border-accent' : 'border-transparent'
            } ${!selectedPlayer ? 'opacity-40' : ''}`}
          >
            <div className="text-left">
              <div className="text-text-primary font-bold">Zwakste eerst</div>
              <div className="text-text-secondary text-xs">Begin met minst geoefende dubbels</div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${weakestFirst ? 'bg-accent' : 'bg-surface2'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${weakestFirst ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        </motion.div>
      </div>

      {/* Start button */}
      <div className="shrink-0 px-6 pb-8 pt-3 border-t border-surface2">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onPointerDown={handleStart}
          disabled={!selectedPlayer}
        >
          Start Oefenen
        </Button>
      </div>
    </div>
  );
}
