import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHistory } from '../hooks/useHistory';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy, Clock } from 'lucide-react';
import { GameRecord } from '../data/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function GameCard({ game, players }: { game: GameRecord; players: import('../data/types').PlayerProfile[] }) {
  const [expanded, setExpanded] = useState(false);
  const winner = players.find(p => p.id === game.winnerId);
  const gameLabel = game.gameType === 'cricket' ? 'Cricket' :
    game.gameType === 'x01_501' ? '501' :
    game.gameType === 'x01_301' ? '301' : '101';

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <button
        onPointerDown={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 touch-manipulation"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-bold">{gameLabel}</span>
            <span className="text-text-secondary text-xs">{new Date(game.date).toLocaleDateString('nl-NL')}</span>
          </div>
          <div className="text-text-secondary text-sm">
            {game.playerIds.map(pid => players.find(p => p.id === pid)?.name ?? '?').join(' vs ')}
          </div>
        </div>
        {winner && (
          <div className="flex items-center gap-1 text-warning text-sm font-semibold">
            <Trophy size={14} /> {winner.name}
          </div>
        )}
        {expanded ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-surface2 px-4 pb-4"
        >
          <div className="pt-3 space-y-2">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Clock size={14} /> Duur: {formatDuration(game.duration)}
            </div>
            {game.legs.map((leg, i) => (
              <div key={i} className="bg-surface2 rounded-xl p-3">
                <div className="text-text-secondary text-xs mb-2">Leg {leg.legNumber}</div>
                {leg.visits.map((v, j) => {
                  const p = players.find(x => x.id === v.playerId);
                  return (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{p?.name}</span>
                      <span className={v.isBust ? 'text-danger' : 'text-text-primary'}>
                        {v.isBust ? `BUST (${v.totalScore})` : v.totalScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const { games, loading } = useHistory();
  const players = useAppStore(s => s.players);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Geschiedenis</h1>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto space-y-2">
        {loading && (
          <p className="text-text-secondary text-center py-8">Laden...</p>
        )}
        {!loading && games.length === 0 && (
          <div className="text-center text-text-secondary py-12">
            <p className="text-lg">Nog geen potjes gespeeld.</p>
          </div>
        )}
        {games.map(game => (
          <GameCard key={game.id} game={game} players={players} />
        ))}
      </div>
    </div>
  );
}
