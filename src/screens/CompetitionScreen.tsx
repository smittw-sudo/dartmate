import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, Swords } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { getH2HRecords, getCricketH2HRecords, H2HRecord } from '../engine/h2hEngine';
import { PlayerProfile } from '../data/types';

type Tab = 'duels' | 'cricket';

function H2HCard({ record, players, hideSuffix = false }: { record: H2HRecord; players: PlayerProfile[]; hideSuffix?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const p1 = players.find(p => p.id === record.player1Id);
  const p2 = players.find(p => p.id === record.player2Id);
  if (!p1 || !p2) return null;

  const total = record.player1Wins + record.player2Wins;
  const p1Pct = total > 0 ? Math.round((record.player1Wins / total) * 100) : 50;
  const p2Pct = 100 - p1Pct;
  const lastDate = record.lastPlayed
    ? new Date(record.lastPlayed).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <button
        onPointerDown={() => setExpanded(!expanded)}
        className="w-full p-4 touch-manipulation"
      >
        {/* Players + score */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 min-w-[52px]">
            <PlayerAvatar name={p1.name} size="md" />
            <span className="text-xs text-text-primary font-semibold truncate max-w-[52px]">{p1.name}</span>
          </div>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-3xl font-black tabular ${record.player1Wins > record.player2Wins ? 'text-accent' : 'text-text-primary'}`}>
                {record.player1Wins}
              </span>
              <span className="text-text-secondary text-lg">–</span>
              <span className={`text-3xl font-black tabular ${record.player2Wins > record.player1Wins ? 'text-accent' : 'text-text-primary'}`}>
                {record.player2Wins}
              </span>
            </div>
            <div className="text-text-secondary text-xs mt-0.5">{record.gamesPlayed} potjes</div>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[52px]">
            <PlayerAvatar name={p2.name} size="md" />
            <span className="text-xs text-text-primary font-semibold truncate max-w-[52px]">{p2.name}</span>
          </div>

          <div className="ml-1 shrink-0">
            {expanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
          </div>
        </div>

        {/* Win bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="bg-accent rounded-l-full transition-all" style={{ width: `${p1Pct}%` }} />
          <div className="bg-surface2 rounded-r-full transition-all" style={{ width: `${p2Pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-accent font-semibold">{p1Pct}%</span>
          <span className="text-xs text-text-secondary font-semibold">{p2Pct}%</span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-surface2"
          >
            <div className="px-4 py-3 space-y-2">
              {!hideSuffix && (
                <div className="flex justify-between text-sm">
                  <div className="text-left">
                    <span className="text-accent font-bold">{record.player1Avg.toFixed(1)}</span>
                    <span className="text-text-secondary ml-1 text-xs">gem.</span>
                  </div>
                  <span className="text-text-secondary text-xs self-center">3-pijl gemiddelde</span>
                  <div className="text-right">
                    <span className="text-text-secondary ml-1 text-xs">gem.</span>
                    <span className="text-accent font-bold ml-1">{record.player2Avg.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {!hideSuffix && (record.player1BestLeg > 0 || record.player2BestLeg > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-primary font-bold">
                    {record.player1BestLeg > 0 ? `${record.player1BestLeg} pijlen` : '—'}
                  </span>
                  <span className="text-text-secondary text-xs self-center">beste leg</span>
                  <span className="text-text-primary font-bold">
                    {record.player2BestLeg > 0 ? `${record.player2BestLeg} pijlen` : '—'}
                  </span>
                </div>
              )}
              {lastDate && (
                <div className="text-center text-text-secondary text-xs pt-1">
                  Laatste potje: {lastDate}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompetitionScreen() {
  const navigate = useNavigate();
  const { games, loading } = useHistory();
  const players = useAppStore(s => s.players);
  const [tab, setTab] = useState<Tab>('duels');

  const playerIds = players.map(p => p.id);
  const h2hRecords = getH2HRecords(games, playerIds);
  const cricketH2H = getCricketH2HRecords(games, playerIds);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-3 shrink-0">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Onderlinge Stand</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pb-3 shrink-0">
        <button
          onPointerDown={() => setTab('duels')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold touch-manipulation flex items-center justify-center gap-2 ${tab === 'duels' ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'}`}
        >
          <Swords size={16} /> X01 H2H
        </button>
        <button
          onPointerDown={() => setTab('cricket')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold touch-manipulation flex items-center justify-center gap-2 ${tab === 'cricket' ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'}`}
        >
          🏏 Cricket H2H
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {loading && (
          <p className="text-text-secondary text-center py-12">Laden...</p>
        )}

        {/* X01 H2H TAB */}
        {!loading && tab === 'duels' && (
          <motion.div
            key="duels"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            {h2hRecords.length === 0 ? (
              <div className="text-center text-text-secondary py-12">
                <Swords size={40} className="mx-auto mb-3 opacity-40" />
                <p>Nog geen onderlinge duels.</p>
                <p className="text-sm mt-1">Speel een X01-potje met meerdere spelers.</p>
              </div>
            ) : (
              h2hRecords.map(record => (
                <H2HCard
                  key={`${record.player1Id}-${record.player2Id}`}
                  record={record}
                  players={players}
                />
              ))
            )}
          </motion.div>
        )}

        {/* CRICKET H2H TAB */}
        {!loading && tab === 'cricket' && (
          <motion.div
            key="cricket"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            {cricketH2H.length === 0 ? (
              <div className="text-center text-text-secondary py-12">
                <span className="text-4xl block mb-3">🏏</span>
                <p>Nog geen cricket gespeeld.</p>
                <p className="text-sm mt-1">Speel een Cricket-potje met meerdere spelers.</p>
              </div>
            ) : (
              cricketH2H.map(record => (
                <H2HCard
                  key={`c-${record.player1Id}-${record.player2Id}`}
                  record={record}
                  players={players}
                  hideSuffix
                />
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
