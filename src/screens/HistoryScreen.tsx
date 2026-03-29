import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHistory } from '../hooks/useHistory';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy, Clock, Trash2 } from 'lucide-react';
import { GameRecord } from '../data/types';
import { deleteGame } from '../lib/supabase';
import { rebuildPlayerStats } from '../engine/statsEngine';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function GameCard({
  game,
  players,
  onDelete,
}: {
  game: GameRecord;
  players: import('../data/types').PlayerProfile[];
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const winner = players.find(p => p.id === game.winnerId);
  const gameLabel =
    game.gameType === 'cricket' ? 'Cricket' :
    game.gameType === 'x01_501' ? '501' :
    game.gameType === 'x01_301' ? '301' : '101';

  const handleDeleteTap = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <div className="flex items-center">
        {/* Main card tap area */}
        <button
          onPointerDown={() => { setExpanded(!expanded); setConfirmDelete(false); }}
          className="flex-1 p-4 flex items-center gap-3 touch-manipulation text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-bold">{gameLabel}</span>
              <span className="text-text-secondary text-xs">
                {new Date(game.date).toLocaleDateString('nl-NL')}
              </span>
            </div>
            <div className="text-text-secondary text-sm">
              {game.playerIds.map(pid => players.find(p => p.id === pid)?.name ?? '?').join(' vs ')}
            </div>
          </div>
          {winner && (
            <div className="flex items-center gap-1 text-warning text-sm font-semibold shrink-0">
              <Trophy size={14} /> {winner.name}
            </div>
          )}
          {expanded
            ? <ChevronUp size={18} className="text-text-secondary shrink-0" />
            : <ChevronDown size={18} className="text-text-secondary shrink-0" />}
        </button>

        {/* Delete button */}
        <button
          onPointerDown={handleDeleteTap}
          className={`px-4 py-4 touch-manipulation shrink-0 transition-colors ${
            confirmDelete
              ? 'bg-danger text-white rounded-r-2xl'
              : 'text-danger'
          }`}
        >
          {confirmDelete ? (
            <span className="text-xs font-bold">Zeker?</span>
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>

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
  const { games, loading, loadAll } = useHistory();
  const players = useAppStore(s => s.players);
  const updatePlayer = useAppStore(s => s.updatePlayer);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (game: GameRecord) => {
    if (deleting) return;
    setDeleting(true);
    try {
      // 1. Remove from Supabase
      await deleteGame(game.id);

      // 2. Get remaining games (without the deleted one)
      const remaining = games.filter(g => g.id !== game.id);

      // 3. Rebuild stats for every player who was in this game
      for (const pid of game.playerIds) {
        const player = players.find(p => p.id === pid);
        if (player) {
          const rebuilt = rebuildPlayerStats(player, remaining);
          await updatePlayer(rebuilt);
        }
      }

      // 4. Refresh game list
      await loadAll();
    } catch (e) {
      console.error('Verwijderen mislukt:', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-8 pb-4 shrink-0">
        <button onPointerDown={() => navigate('/')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">Geschiedenis</h1>
        {deleting && (
          <span className="text-text-secondary text-sm animate-pulse">Verwijderen...</span>
        )}
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
          <GameCard
            key={game.id}
            game={game}
            players={players}
            onDelete={() => handleDelete(game)}
          />
        ))}
      </div>
    </div>
  );
}
