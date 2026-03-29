import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { ArrowLeft } from 'lucide-react';
import { getWinPercentage, getAverageFromStats, getCheckoutPercentage, getTopDoubles } from '../engine/statsEngine';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-surface2">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="text-text-primary font-semibold tabular">{value}</span>
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-8 pb-4">
        <button onPointerDown={() => navigate(-1)} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary flex-1">{player.name}</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <PlayerAvatar name={player.name} size="xl" />
        <p className="text-text-secondary text-sm mt-2">
          Lid sinds {new Date(player.createdAt).toLocaleDateString('nl-NL')}
        </p>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto space-y-4">
        <Section title="Algemeen">
          <StatRow label="Potjes gespeeld" value={stats.gamesPlayed} />
          <StatRow label="Gewonnen" value={`${stats.gamesWon} (${getWinPercentage(stats)}%)`} />
          <StatRow label="Verloren" value={stats.gamesPlayed - stats.gamesWon} />
          <StatRow label="Huidige win-streak" value={stats.currentWinStreak} />
          <StatRow label="Langste win-streak" value={stats.longestWinStreak} />
          <StatRow label="Keer gebroken" value={stats.timesFirstAndBroke} />
        </Section>

        <Section title="Scoring (X01)">
          <StatRow label="3-pijl gemiddelde" value={getAverageFromStats(stats).toFixed(1)} />
          <StatRow label="Totaal pijlen gegooid" value={stats.totalDartsThrown} />
          <StatRow label="Totaal gescoord" value={stats.totalScored} />
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
          <StatRow
            label="Win%"
            value={stats.cricketGamesPlayed > 0
              ? `${Math.round(stats.cricketGamesWon / stats.cricketGamesPlayed * 100)}%`
              : '—'
            }
          />
        </Section>
      </div>
    </div>
  );
}
