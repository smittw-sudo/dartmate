import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useGameStore } from '../store/gameStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, Check, Users, X } from 'lucide-react';
import { GameType, GameFormat } from '../data/types';

const GAME_TYPES: { type: GameType; label: string; sub: string }[] = [
  { type: 'x01_501', label: '501', sub: 'Klassiek dartspel' },
  { type: 'x01_301', label: '301', sub: 'Kortere variant' },
  { type: 'x01_101', label: '101', sub: 'Snelle variant' },
  { type: 'cricket', label: 'Cricket', sub: 'Countdown-modus' },
];

const FORMATS: { format: GameFormat; label: string; sub: string }[] = [
  { format: 'single', label: 'Enkelvoudig', sub: '1 leg' },
  { format: 'bestOf3', label: 'Best of 3', sub: 'Eerst 2 legs' },
  { format: 'bestOf5', label: 'Best of 5', sub: 'Eerst 3 legs' },
  { format: 'competition', label: 'Competitie', sub: 'Sets + Legs' },
];

type Step = 'type' | 'format' | 'players' | 'teams';

export function NewGameScreen() {
  const navigate = useNavigate();
  const { players, addPlayer } = useAppStore();
  const startGame = useGameStore(s => s.startGame);

  const [step, setStep] = useState<Step>('type');
  const [gameType, setGameType] = useState<GameType>('x01_501');
  const [format, setFormat] = useState<GameFormat>('bestOf3');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[][] | null>(null);
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddPlayer = async () => {
    if (!newName.trim()) return;
    const p = await addPlayer(newName.trim());
    setSelectedPlayerIds(prev => [...prev, p.id]);
    setNewName('');
    setShowAddPlayer(false);
  };

  const handleStart = () => {
    if (selectedPlayerIds.length < 2) return;
    startGame({
      gameType,
      format,
      playerIds: selectedPlayerIds,
      teams: teamsEnabled ? teams : null,
      legsToWinSet: 4,
      setsToWin: 3,
    });
    navigate('/spel');
  };

  const stepLabels: Record<Step, string> = {
    type: 'Speltype',
    format: 'Formaat',
    players: 'Spelers',
    teams: 'Teams',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onPointerDown={() => step === 'type' ? navigate('/') : setStep(
          step === 'format' ? 'type' : step === 'players' ? 'format' : 'players'
        )} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Nieuw Spel</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 px-6 mb-4">
        {(['type', 'format', 'players'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${step === s || (i < ['type', 'format', 'players'].indexOf(step)) ? 'bg-accent' : 'bg-surface2'}`}
          />
        ))}
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Game Type */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-3"
            >
              <h2 className="text-xl font-bold text-text-primary mb-4">Speltype</h2>
              {GAME_TYPES.map(({ type, label, sub }) => (
                <button
                  key={type}
                  onPointerDown={() => { setGameType(type); setStep('format'); }}
                  className={`w-full bg-surface rounded-2xl p-5 flex items-center justify-between active:scale-98 touch-manipulation ${gameType === type ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
                >
                  <div className="text-left">
                    <div className="text-text-primary font-bold text-xl">{label}</div>
                    <div className="text-text-secondary text-sm">{sub}</div>
                  </div>
                  {gameType === type && <Check size={20} className="text-accent" />}
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Format */}
          {step === 'format' && (
            <motion.div
              key="format"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-3"
            >
              <h2 className="text-xl font-bold text-text-primary mb-4">Formaat</h2>
              {FORMATS.map(({ format: f, label, sub }) => (
                <button
                  key={f}
                  onPointerDown={() => { setFormat(f); setStep('players'); }}
                  className={`w-full bg-surface rounded-2xl p-5 flex items-center justify-between touch-manipulation ${format === f ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
                >
                  <div className="text-left">
                    <div className="text-text-primary font-bold text-xl">{label}</div>
                    <div className="text-text-secondary text-sm">{sub}</div>
                  </div>
                  {format === f && <Check size={20} className="text-accent" />}
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Players */}
          {step === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Spelers kiezen</h2>
                <button
                  onPointerDown={() => setShowAddPlayer(true)}
                  className="flex items-center gap-1 text-accent text-sm font-semibold touch-manipulation"
                >
                  <Plus size={18} /> Nieuw
                </button>
              </div>

              {showAddPlayer && (
                <div className="bg-surface2 rounded-2xl p-4 mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Naam nieuw profiel"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                    autoFocus
                    className="flex-1 bg-transparent text-text-primary outline-none text-base"
                  />
                  <button onPointerDown={handleAddPlayer} className="text-accent font-semibold touch-manipulation">
                    Toevoegen
                  </button>
                  <button onPointerDown={() => setShowAddPlayer(false)}>
                    <X size={18} className="text-text-secondary" />
                  </button>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {players.map(p => {
                  const selected = selectedPlayerIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onPointerDown={() => togglePlayer(p.id)}
                      className={`w-full bg-surface rounded-2xl p-4 flex items-center gap-4 touch-manipulation ${selected ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
                    >
                      <PlayerAvatar name={p.name} size="md" />
                      <span className="flex-1 text-left text-text-primary font-semibold">{p.name}</span>
                      {selected && <Check size={20} className="text-accent" />}
                    </button>
                  );
                })}
              </div>

              {/* Teams toggle */}
              {selectedPlayerIds.length >= 4 && (
                <button
                  onPointerDown={() => setTeamsEnabled(!teamsEnabled)}
                  className={`w-full bg-surface rounded-2xl p-4 flex items-center gap-3 mb-4 touch-manipulation ${teamsEnabled ? 'border-2 border-accent' : 'border-2 border-transparent'}`}
                >
                  <Users size={20} className={teamsEnabled ? 'text-accent' : 'text-text-secondary'} />
                  <span className="text-text-primary font-semibold">Teams spelen</span>
                  {teamsEnabled && <Check size={20} className="text-accent ml-auto" />}
                </button>
              )}

              <Button
                variant="primary"
                size="xl"
                fullWidth
                onPointerDown={handleStart}
                disabled={selectedPlayerIds.length < 2}
              >
                Start Spel ({selectedPlayerIds.length} spelers)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
