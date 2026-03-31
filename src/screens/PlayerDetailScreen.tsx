import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { ArrowLeft } from 'lucide-react';
import { getWinPercentage, getAverageFromStats, getCheckoutPercentage, getTopDoubles, getGameAverage } from '../engine/statsEngine';
import { fetchGames } from '../lib/supabase';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-surface2">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="text-text-primary font-semibold tabular">{value}</span>
    </div>
  );
}

function WinBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="py-2 border-b border-surface2 space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl p-4 space-y-1">
      <h3 className="text-accent text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function PlayerDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const player = useAppStore(s => s.players.find(p => p.id === id));

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Speler niet gevonden.</p>
      </div>
    );
  }

  const { stats, preferredDoubles } = player;
  const topDoubles = getTopDoubles(preferredDoubles, 3);
  const cricketWinPct = stats.cricketGamesPlayed > 0
    ? Math.round(stats.cricketGamesWon / stats.cricketGamesPlayed * 100)
    : 0;

  const [bestAvg, setBestAvg] = useState<number>(0);
  const [worstAvg, setWorstAvg] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    fetchGames().then(allGames => {
      const avgs = allGames
        .filter(g => g.isComplete && g.playerIds.includes(id) && g.gameType !== 'cricket')
        .map(g => getGameAverage(g, id))
        .filter(a => a > 0);
      if (avgs.length === 0) return;
      setBestAvg(Math.max(...avgs));
      setWorstAvg(Math.min(...avgs));
    }).catch(() => {});
  }, [id]);

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-8 pb-4 shrink-0">
        <button onPointerDown={() => navigate(-1)} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">{player.name}</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6 shrink-0">
        <PlayerAvatar name={player.name} size="xl" />
        <p className="text-text-secondary text-sm mt-2">
          Lid sinds {new Date(player.createdAt).toLocaleDateString('nl-NL')}
        </p>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto space-y-4">
        <Section title="Algemeen">
          <StatRow label="Potjes gespeeld" value={stats.gamesPlayed} />
          <StatRow label="Gewonnen" value={stats.gamesWon} />
          <StatRow label="Verloren" value={stats.gamesPlayed - stats.gamesWon} />
          <WinBar pct={getWinPercentage(stats)} label="Win-percentage" />
          <StatRow label="Huidige win-streak" value={stats.currentWinStreak} />
          <StatRow label="Langste win-streak" value={stats.longestWinStreak} />
          <StatRow label="Keer gebroken" value={stats.timesFirstAndBroke} />
        </Section>

        <Section title="Scoring (X01)">
          <StatRow label="3-pijl gemiddelde" value={getAverageFromStats(stats).toFixed(1)} />
          {bestAvg > 0 && <StatRow label="Beste pot-gemiddelde" value={bestAvg.toFixed(1)} />}
          {worstAvg > 0 && <StatRow label="Slechtste pot-gemiddelde" value={worstAvg.toFixed(1)} />}
          <StatRow label="180's" value={stats.oneEighties} />
          <StatRow label="140+" value={stats.hundredFortyPlus} />
          <StatRow label="100+" value={stats.hundredPlus} />
          <StatRow label="Beste leg (pijlen)" value={stats.bestLegDarts || '—'} />
        </Section>

        <Section title="Uitgooien (X01)">
          <StatRow label="Checkout%" value={`${getCheckoutPercentage(stats)}%`} />
          <StatRow label="Pogingen / Hits" value={`${stats.checkoutAttempts} / ${stats.checkoutHits}`} />
          <StatRow label="Hoogste checkout" value={stats.highestCheckout || '—'} />
          <StatRow label="Busts" value={stats.busts} />
          {topDoubles.length > 0 && (
            <StatRow
              label="Favoriete dubbels"
              value={topDoubles.map(d => `D${d.double}(${d.hits}×)`).join(', ')}
            />
          )}
        </Section>

        <Section title="Cricket">
          <StatRow label="Cricket gespeeld" value={stats.cricketGamesPlayed} />
          <StatRow label="Cricket gewonnen" value={stats.cricketGamesWon} />
          {stats.cricketGamesPlayed > 0 && (
            <WinBar pct={cricketWinPct} label="Win-percentage" />
          )}
        </Section>
      </div>
    </div>
  );
}
