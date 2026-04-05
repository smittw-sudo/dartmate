import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, ChevronRight, Target, Crosshair, CheckCircle, Check } from 'lucide-react';
import { DRILL_DEFINITIONS, DrillCategory, DrillDefinition, LEVEL_LABELS, detectLevel } from '../../data/trainingTypes';
import { useTrainingStore } from '../../store/trainingStore';
import { useAppStore } from '../../store/appStore';
import { getRecentAverageFromStats } from '../../engine/statsEngine';
import { PlayerAvatar } from '../../components/ui/PlayerAvatar';
import { GUEST_PLAYER_ID } from '../../data/types';

const CATEGORY_LABELS: Record<DrillCategory, string> = {
  scoring: '🎯 Scoring',
  doubles: '🎳 Dubbels',
  checkouts: '✅ Checkouts',
};

const CATEGORY_ORDER: DrillCategory[] = ['scoring', 'doubles', 'checkouts'];

// ─── Spelersselectiescherm ───────────────────────────────────────────────────

function PlayerPicker({
  onSelect,
}: {
  onSelect: (playerId: string) => void;
}) {
  const navigate = useNavigate();
  const players = useAppStore(s => s.players);
  const [picked, setPicked] = useState<string | null>(null);

  const handleConfirm = () => {
    if (picked) onSelect(picked);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4 shrink-0">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Training</h1>
          <p className="text-text-secondary text-sm">Wie gaat er trainen?</p>
        </div>
      </div>

      {/* Spelerlijst */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {players.length === 0 && (
          <div className="text-center text-text-secondary py-8">
            <p className="text-lg">Nog geen spelers.</p>
            <p className="text-sm mt-1">Maak een profiel aan via het hoofdmenu, of ga als gast trainen.</p>
          </div>
        )}
        {players.map((p, i) => {
          const avg = getRecentAverageFromStats(p.stats);
          const level = detectLevel(avg);
          const isSelected = picked === p.id;

          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onPointerDown={() => setPicked(p.id)}
              className={`w-full rounded-2xl p-4 flex items-center gap-4 touch-manipulation transition-colors border-2 ${
                isSelected
                  ? 'bg-accent/10 border-accent'
                  : 'bg-surface border-transparent'
              }`}
            >
              <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size="lg" />
              <div className="flex-1 text-left">
                <p className="text-text-primary font-bold text-lg">
                  {p.nickname || p.name}
                </p>
                <p className="text-text-secondary text-xs">
                  Niveau {level} · {LEVEL_LABELS[level - 1]}
                  {avg > 0 && <span className="ml-1">· gem. {avg.toFixed(1)}</span>}
                </p>
              </div>
              {isSelected && (
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Check size={16} className="text-black" />
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Scheidslijn */}
        {players.length > 0 && (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-surface2" />
            <span className="text-text-secondary text-xs">of</span>
            <div className="flex-1 h-px bg-surface2" />
          </div>
        )}

        {/* Gast-optie */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: players.length * 0.06 + 0.05 }}
          onPointerDown={() => setPicked(GUEST_PLAYER_ID)}
          className={`w-full rounded-2xl p-4 flex items-center gap-4 touch-manipulation border-2 transition-colors ${
            picked === GUEST_PLAYER_ID
              ? 'bg-accent/10 border-accent'
              : 'bg-surface border-dashed border-surface2'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-2xl shrink-0">
            👤
          </div>
          <div className="flex-1 text-left">
            <p className={`font-bold text-lg ${picked === GUEST_PLAYER_ID ? 'text-accent' : 'text-text-primary'}`}>
              Gast
            </p>
            <p className="text-text-secondary text-xs">
              Trainen zonder profiel · resultaten worden na sessie gewist
            </p>
          </div>
          {picked === GUEST_PLAYER_ID && (
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Check size={16} className="text-black" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Start-knop */}
      {picked && (
        <motion.div
          className="px-4 pb-8 shrink-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onPointerDown={handleConfirm}
            className="w-full bg-accent rounded-2xl py-4 text-black font-black text-lg touch-manipulation active:scale-95 transition-transform"
          >
            Start Training →
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Drill card ───────────────────────────────────────────────────────────────

function DrillCard({
  def,
  playerId,
  onPress,
}: {
  def: DrillDefinition;
  playerId: string;
  onPress: () => void;
}) {
  const playerHistory = useTrainingStore(s => s.history[playerId]);
  const playerPRs = useTrainingStore(s => s.personalRecords[playerId]);
  const history = (playerHistory?.[def.id] ?? []) as import('../../data/trainingTypes').DrillResult[];
  const pr = playerPRs?.[def.id] as number | undefined;
  const last = history[0];

  return (
    <button
      onPointerDown={onPress}
      className="w-full bg-surface rounded-2xl p-4 flex items-center gap-3 active:bg-surface2 touch-manipulation text-left"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-text-primary font-semibold">{def.title}</p>
          {history.length > 0 && (
            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
              {history.length}×
            </span>
          )}
        </div>
        <p className="text-text-secondary text-xs mt-0.5">{def.subtitle}</p>
        {last && (
          <p className="text-accent text-xs mt-1 font-semibold">
            Laatste: {last.score} · {def.scoringLabel}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {pr !== undefined && (
          <div className="flex items-center gap-1">
            <Trophy size={11} className="text-accent" />
            <span className="text-accent text-xs font-bold">{pr}</span>
          </div>
        )}
        <ChevronRight size={18} className="text-text-secondary" />
      </div>
    </button>
  );
}

// ─── Pijler-voortgang ─────────────────────────────────────────────────────────

function PillarProgress({
  category,
  playerId,
}: {
  category: DrillCategory;
  playerId: string;
}) {
  const drills = DRILL_DEFINITIONS.filter(d => d.category === category);
  const playerHistory = useTrainingStore(s => s.history[playerId]);
  const played = drills.filter(d => ((playerHistory?.[d.id] as unknown[]) ?? []).length > 0).length;

  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-text-secondary text-xs">{CATEGORY_LABELS[category]}</span>
        <span className="text-text-secondary text-xs">{played}/{drills.length}</span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${(played / drills.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Trainingsoverzicht ────────────────────────────────────────────────────────

function TrainingContent({ playerId }: { playerId: string }) {
  const navigate = useNavigate();
  const players = useAppStore(s => s.players);
  const setSelectedPlayerId = useTrainingStore(s => s.setSelectedPlayerId);
  const clearGuestData = useTrainingStore(s => s.clearGuestData);

  const handleBack = () => {
    if (playerId === GUEST_PLAYER_ID) clearGuestData();
    setSelectedPlayerId(null);
  };
  const [activeCategory, setActiveCategory] = useState<DrillCategory | 'all'>('all');

  const isGuest = playerId === GUEST_PLAYER_ID;
  const player = isGuest ? null : players.find(p => p.id === playerId);
  const avg = player ? getRecentAverageFromStats(player.stats) : 0;
  const level = detectLevel(avg);
  const levelLabel = LEVEL_LABELS[level - 1];

  const drillsToShow = activeCategory === 'all'
    ? DRILL_DEFINITIONS
    : DRILL_DEFINITIONS.filter(d => d.category === activeCategory);

  const grouped: Record<DrillCategory, DrillDefinition[]> = {
    scoring: drillsToShow.filter(d => d.category === 'scoring'),
    doubles: drillsToShow.filter(d => d.category === 'doubles'),
    checkouts: drillsToShow.filter(d => d.category === 'checkouts'),
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-3 shrink-0">
        {/* Speler wisselen / terug */}
        <button
          onPointerDown={handleBack}
          className="p-2 touch-manipulation"
        >
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">
            {isGuest ? 'Gast' : (player ? (player.nickname || player.name) : 'Training')}
          </h1>
          {isGuest ? (
            <p className="text-text-secondary text-xs">Sessie wordt na afloop gewist</p>
          ) : avg > 0 && (
            <p className="text-text-secondary text-xs">
              gem. {avg.toFixed(1)} (laatste {Math.min(player?.stats.recentGameAverages?.length ?? 0, 20)} potjes)
            </p>
          )}
        </div>
        <div className="bg-surface rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <Target size={14} className="text-accent" />
          <span className="text-accent text-sm font-bold">Lvl {level} · {levelLabel}</span>
        </div>
      </div>

      {/* Pijler-voortgang */}
      <div className="px-4 pb-3 shrink-0">
        <div className="bg-surface rounded-2xl p-3 flex gap-3">
          {CATEGORY_ORDER.map(cat => (
            <PillarProgress key={cat} category={cat} playerId={playerId} />
          ))}
        </div>
      </div>

      {/* Snelkoppelingen */}
      <div className="px-4 pb-3 shrink-0 grid grid-cols-2 gap-2">
        <button
          onPointerDown={() => navigate('/training/dagelijks')}
          className="bg-accent rounded-2xl p-3 flex items-center gap-2 active:scale-95 transition-transform touch-manipulation"
        >
          <CheckCircle size={20} className="text-black" />
          <span className="text-black font-bold text-sm">Dagelijkse Training</span>
        </button>
        <button
          onPointerDown={() => navigate('/dubbels')}
          className="bg-surface rounded-2xl p-3 flex items-center gap-2 active:scale-95 transition-transform touch-manipulation"
        >
          <Crosshair size={20} className="text-accent" />
          <span className="text-text-primary font-bold text-sm">Dubbels Oefenen</span>
        </button>
      </div>

      {/* Categorie-filter */}
      <div className="px-4 pb-3 shrink-0 flex gap-2 overflow-x-auto">
        {(['all', ...CATEGORY_ORDER] as const).map(cat => (
          <button
            key={cat}
            onPointerDown={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap touch-manipulation transition-colors ${
              activeCategory === cat ? 'bg-accent text-black' : 'bg-surface text-text-secondary'
            }`}
          >
            {cat === 'all' ? 'Alles' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Drill lijst */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {CATEGORY_ORDER.map(cat => {
          const drills = grouped[cat];
          if (!drills || drills.length === 0) return null;
          return (
            <div key={cat} className="mb-5">
              <h2 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-2">
                {drills.map((def, i) => (
                  <motion.div
                    key={def.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DrillCard
                      def={def}
                      playerId={playerId}
                      onPress={() => navigate(`/training/drill/${def.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hoofd-export ─────────────────────────────────────────────────────────────

export function TrainingScreen() {
  const selectedPlayerId = useTrainingStore(s => s.selectedPlayerId);
  const setSelectedPlayerId = useTrainingStore(s => s.setSelectedPlayerId);

  if (!selectedPlayerId) {
    return <PlayerPicker onSelect={setSelectedPlayerId} />;
  }

  return <TrainingContent playerId={selectedPlayerId} />;
}
