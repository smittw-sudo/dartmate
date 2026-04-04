import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, ChevronRight, Target, Crosshair, CheckCircle, User } from 'lucide-react';
import { DRILL_DEFINITIONS, DrillCategory, DrillDefinition, LEVEL_LABELS, detectLevel } from '../../data/trainingTypes';
import { useTrainingStore } from '../../store/trainingStore';
import { useAppStore } from '../../store/appStore';
import { getAverageFromStats } from '../../engine/statsEngine';
import { PlayerAvatar } from '../../components/ui/PlayerAvatar';

const CATEGORY_LABELS: Record<DrillCategory, string> = {
  scoring: '🎯 Scoring',
  doubles: '🎳 Dubbels',
  checkouts: '✅ Checkouts',
};

const CATEGORY_ORDER: DrillCategory[] = ['scoring', 'doubles', 'checkouts'];

function DrillCard({ def, onPress }: { def: DrillDefinition; onPress: () => void }) {
  const pr = useTrainingStore(s => s.personalRecords[def.id]);
  const historyRaw = useTrainingStore(s => s.history[def.id]);
  const history = historyRaw ?? [];
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

function PillarProgress({ category, allHistory }: { category: DrillCategory; allHistory: Record<string, unknown[]> }) {
  const drills = DRILL_DEFINITIONS.filter(d => d.category === category);
  const played = drills.filter(d => (allHistory[d.id]?.length ?? 0) > 0).length;

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

export function TrainingScreen() {
  const navigate = useNavigate();
  const players = useAppStore(s => s.players);
  const allHistory = useTrainingStore(s => s.history);
  const selectedPlayerId = useTrainingStore(s => s.selectedPlayerId);
  const setSelectedPlayerId = useTrainingStore(s => s.setSelectedPlayerId);
  const [activeCategory, setActiveCategory] = useState<DrillCategory | 'all'>('all');

  // Determine level from selected player, or best avg if none selected
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;
  const avgForLevel = selectedPlayer
    ? getAverageFromStats(selectedPlayer.stats)
    : (players.length > 0 ? Math.max(...players.map(p => getAverageFromStats(p.stats))) : 0);
  const level = detectLevel(avgForLevel);
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
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Training</h1>
        <div className="bg-surface rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <Target size={14} className="text-accent" />
          <span className="text-accent text-sm font-bold">Lvl {level} · {levelLabel}</span>
        </div>
      </div>

      {/* Spelerkiezer */}
      {players.length > 0 && (
        <div className="px-4 pb-3 shrink-0">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <User size={11} />
            Wie gaat trainen?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {players.map(p => {
              const isSelected = p.id === selectedPlayerId;
              const avg = getAverageFromStats(p.stats);
              const lvl = detectLevel(avg);
              return (
                <button
                  key={p.id}
                  onPointerDown={() => setSelectedPlayerId(isSelected ? null : p.id)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 touch-manipulation transition-colors ${
                    isSelected ? 'bg-accent/20 border-2 border-accent' : 'bg-surface border-2 border-transparent'
                  }`}
                >
                  <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                  <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                    {p.nickname || p.name}
                  </span>
                  <span className="text-[10px] text-text-secondary">Lvl {lvl}</span>
                </button>
              );
            })}
          </div>
          {selectedPlayer && (
            <p className="text-text-secondary text-xs mt-1.5">
              Niveau aangepast op {selectedPlayer.nickname || selectedPlayer.name} · gem. {avgForLevel.toFixed(1)}
            </p>
          )}
        </div>
      )}

      {/* Pijler-voortgang */}
      <div className="px-4 pb-3 shrink-0">
        <div className="bg-surface rounded-2xl p-3 flex gap-3">
          {CATEGORY_ORDER.map(cat => (
            <PillarProgress key={cat} category={cat} allHistory={allHistory as Record<string, unknown[]>} />
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
                    <DrillCard def={def} onPress={() => navigate(`/training/drill/${def.id}`)} />
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
