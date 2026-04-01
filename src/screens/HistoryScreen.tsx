import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHistory } from '../hooks/useHistory';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy, Clock, Trash2, AlertCircle } from 'lucide-react';
import { GameRecord } from '../data/types';
import { deleteGame } from '../lib/supabase';
import { rebuildPlayerStats, getGameAverage } from '../engine/statsEngine';

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
              {game.playerIds.map((pid, i) => {
                const name = players.find(p => p.id === pid)?.name ?? '?';
                if (game.gameType === 'cricket') return (
                  <span key={pid}>{i > 0 ? ' vs ' : ''}{name}</span>
                );
                const avg = getGameAverage(game, pid);
                return (
                  <span key={pid}>
                    {i > 0 ? ' vs ' : ''}
                    {name}
                    {avg > 0 && <span className="text-accent text-xs ml-1">({avg.toFixed(1)})</span>}
                  </span>
                );
              })}
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

type GameFilter = 'all' | 'x01_501' | 'x01_301' | 'x01_101' | 'cricket';
const FILTER_LABELS: Record<GameFilter, string> = {
  all: 'Alles', x01_501: '501', x01_301: '301', x01_101: '101', cricket: 'Cricket',
};

export function HistoryScreen() {
  const navigate = useNavigate();
  const { games, loading, loadAll } = useHistory();
  const players = useAppStore(s => s.players);
  const updatePlayer = useAppStore(s => s.updatePlayer);
  const loadAllProfiles = useAppStore(s => s.loadAll);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [filter, setFilter] = useState<GameFilter>('all');

  const handleDelete = async (game: GameRecord) => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      // 1. Remove game from Supabase
      await deleteGame(game.id);

      // 2. Remaining games (snapshot before we reload)
      const remaining = games.filter(g => g.id !== game.id);

      // 3. Rebuild and save stats for every player in this game
      for (const pid of game.playerIds) {
        const player = players.find(p => p.id === pid);
        if (!player) continue;
        const rebuilt = rebuildPlayerStats(player, remaining);
        // Update local store immediately so UI reflects the change
        await updatePlayer(rebuilt);
      }

      // 4. Refresh games list AND player profiles from Supabase
      await Promise.all([loadAll(), loadAllProfiles()]);
    } catch (e) {
      console.error('Verwijderen mislukt:', e);
      setDeleteError('Verwijderen mislukt. Probeer opnieuw.');
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
        {deleteError && (
          <span className="text-danger text-xs flex items-center gap-1">
            <AlertCircle size={12} /> {deleteError}
          </span>
        )}
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto space-y-2">
        {loading && (
          <p className="text-text-secondary text-center py-8">Laden...</p>
        )}
        {!loading && games.length > 0 && (
          <div className="flex gap-1.5 pb-1 overflow-x-auto">
            {(Object.keys(FILTER_LABELS) as GameFilter[]).map(f => (
              <button
                key={f}
                onPointerDown={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap touch-manipulation transition-colors ${
                  filter === f ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        )}
        {!loading && games.length === 0 && (
          <div className="text-center text-text-secondary py-12">
            <p className="text-lg">Nog geen potjes gespeeld.</p>
          </div>
        )}
        {(filter === 'all' ? games : games.filter(g => g.gameType === filter)).map(game => (
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
