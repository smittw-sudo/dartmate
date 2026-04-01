import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { ArrowLeft } from 'lucide-react';
import { getWinPercentage, getAverageFromStats, getCheckoutPercentage, getTopDoubles, getGameAverage } from '../engine/statsEngine';
import { fetchGames } from '../lib/supabase';

type Period = 'all' | 'month' | 'quarter';

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

function ScoreChart({ bands }: { bands: number[] }) {
  const labels = ['0–60', '61–100', '101–120', '121–140', '141–180'];
  const max = Math.max(...bands, 1);
  return (
    <div className="pt-1 pb-1 space-y-1.5">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-text-secondary text-xs w-16 shrink-0">{label}</span>
          <div className="flex-1 h-4 bg-surface2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(bands[i] / max) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.07 }}
            />
          </div>
          <span className="text-text-secondary text-xs w-6 text-right shrink-0">{bands[i]}</span>
        </div>
      ))}
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

  const [period, setPeriod] = useState<Period>('all');
  const [bestAvg, setBestAvg] = useState<number>(0);
  const [worstAvg, setWorstAvg] = useState<number>(0);
  const [highestVisit, setHighestVisit] = useState<number>(0);
  const [above120, setAbove120] = useState<number>(0);
  const [avgDartsPerLeg, setAvgDartsPerLeg] = useState<number>(0);
  const [scoreBands, setScoreBands] = useState<number[]>([0, 0, 0, 0, 0]);
  const [cricketAvgDarts, setCricketAvgDarts] = useState<number>(0);
  const [cricketAvgFinish, setCricketAvgFinish] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    // Reset bij periode-wijziging
    setBestAvg(0); setWorstAvg(0); setHighestVisit(0); setAbove120(0);
    setAvgDartsPerLeg(0); setScoreBands([0, 0, 0, 0, 0]);
    setCricketAvgDarts(0); setCricketAvgFinish(0);

    const cutoff = period === 'all' ? null
      : new Date(Date.now() - (period === 'month' ? 30 : 90) * 86400000);

    fetchGames().then(allGames => {
      const playerGames = allGames.filter(g =>
        g.isComplete &&
        g.playerIds.includes(id) &&
        g.gameType !== 'cricket' &&
        (!cutoff || new Date(g.date) >= cutoff)
      );

      // Beste / slechtste pot-gemiddelde
      const avgs = playerGames.map(g => getGameAverage(g, id)).filter(a => a > 0);
      if (avgs.length > 0) {
        setBestAvg(Math.max(...avgs));
        setWorstAvg(Math.min(...avgs));
      }

      // Hoogste beurt-score, boven 120, score-verdeling
      let maxVisit = 0;
      let count120 = 0;
      const bands = [0, 0, 0, 0, 0];

      // Gem. pijlen per gewonnen leg
      let dartsInWonLegs = 0;
      let wonLegCount = 0;

      for (const game of playerGames) {
        for (const leg of game.legs) {
          // Pijlen per gewonnen leg
          if (leg.winnerId === id) {
            const legDarts = leg.visits
              .filter(v => v.playerId === id)
              .reduce((s, v) => s + (v.dartsCount ?? v.darts.length), 0);
            if (legDarts > 0) { dartsInWonLegs += legDarts; wonLegCount++; }
          }

          for (const visit of leg.visits) {
            if (visit.playerId !== id || visit.isBust) continue;
            const s = visit.totalScore;
            if (s > maxVisit) maxVisit = s;
            if (s > 120) count120++;
            if (s <= 60) bands[0]++;
            else if (s <= 100) bands[1]++;
            else if (s <= 120) bands[2]++;
            else if (s <= 140) bands[3]++;
            else bands[4]++;
          }
        }
      }

      if (maxVisit > 0) setHighestVisit(maxVisit);
      setAbove120(count120);
      setScoreBands(bands);
      if (wonLegCount > 0) setAvgDartsPerLeg(Math.round(dartsInWonLegs / wonLegCount * 10) / 10);

      // Cricket dart stats (always all-time, independent of period filter)
      const cricketGames = allGames.filter(g =>
        g.isComplete && g.playerIds.includes(id) && g.gameType === 'cricket'
      );
      let totalCricketDarts = 0;
      let gamesWithDarts = 0;
      let totalFinishDarts = 0;
      let finishCount = 0;
      for (const cg of cricketGames) {
        let gameDarts = 0;
        for (const leg of cg.legs) {
          for (const v of leg.visits) {
            if (v.playerId !== id || !v.dartsCount) continue;
            gameDarts += v.dartsCount;
          }
          // Finishing darts: last visit of the winning player in this leg
          if (leg.winnerId === id) {
            const myVisits = leg.visits.filter(v => v.playerId === id && v.dartsCount);
            if (myVisits.length > 0) {
              const last = myVisits[myVisits.length - 1];
              totalFinishDarts += last.dartsCount!;
              finishCount++;
            }
          }
        }
        if (gameDarts > 0) { totalCricketDarts += gameDarts; gamesWithDarts++; }
      }
      if (gamesWithDarts > 0) setCricketAvgDarts(Math.round(totalCricketDarts / gamesWithDarts * 10) / 10);
      if (finishCount > 0) setCricketAvgFinish(Math.round(totalFinishDarts / finishCount * 10) / 10);
    }).catch(() => {});
  }, [id, period]);

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

  const periodLabel = period === 'month' ? ' · 30 dagen' : period === 'quarter' ? ' · 3 mnd' : '';

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

        {/* Periode-filter */}
        <div className="flex gap-1.5">
          {(['all', 'month', 'quarter'] as Period[]).map(p => (
            <button
              key={p}
              onPointerDown={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold touch-manipulation transition-colors ${
                period === p ? 'bg-accent text-black' : 'bg-surface2 text-text-secondary'
              }`}
            >
              {p === 'all' ? 'Alles' : p === 'month' ? '30 dagen' : '3 maanden'}
            </button>
          ))}
        </div>

        <Section title={`Scoring (X01)${periodLabel}`}>
          <StatRow label="3-pijl gemiddelde" value={getAverageFromStats(stats).toFixed(1)} />
          {bestAvg > 0 && <StatRow label="Beste pot-gemiddelde" value={bestAvg.toFixed(1)} />}
          {worstAvg > 0 && <StatRow label="Slechtste pot-gemiddelde" value={worstAvg.toFixed(1)} />}
          {highestVisit > 0 && <StatRow label="Hoogste beurt-score" value={highestVisit} />}
          {above120 > 0 && <StatRow label="Boven de 120" value={above120} />}
          <StatRow label="180's" value={stats.oneEighties} />
          <StatRow label="140+" value={stats.hundredFortyPlus} />
          <StatRow label="100+" value={stats.hundredPlus} />
          <StatRow label="Beste leg (pijlen)" value={stats.bestLegDarts || '—'} />
          {avgDartsPerLeg > 0 && <StatRow label="Gem. pijlen per leg" value={avgDartsPerLeg.toFixed(1)} />}
          {scoreBands.some(b => b > 0) && (
            <>
              <div className="text-text-secondary text-xs pt-2 pb-0.5 uppercase tracking-wider">Score-verdeling</div>
              <ScoreChart bands={scoreBands} />
            </>
          )}
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
          {cricketAvgDarts > 0 && <StatRow label="Gem. pijlen per spel" value={cricketAvgDarts.toFixed(1)} />}
          {cricketAvgFinish > 0 && <StatRow label="Gem. eindpijlen" value={cricketAvgFinish.toFixed(1)} />}
        </Section>
      </div>
    </div>
  );
}
