import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { DRILL_DEFINITIONS, DrillId, detectLevel, LEVEL_LABELS } from '../../data/trainingTypes';
import { useAppStore } from '../../store/appStore';
import { getAverageFromStats } from '../../engine/statsEngine';

interface SessionDrill { id: DrillId; duration: number; note: string; }

function buildDailySession(level: number): SessionDrill[] {
  const scoringDrills: Record<number, DrillId> = { 1: 'hundred_darts_t20', 2: 'hundred_darts_t20', 3: 'big_trebles', 4: 'first_nine_tracker', 5: 'first_nine_tracker' };
  const doublesDrills: Record<number, DrillId> = { 1: 'round_clock_doubles', 2: 'bobs_27', 3: 'bobs_27', 4: 'pressure_doubles', 5: 'pressure_doubles' };
  const checkoutDrills: Record<number, DrillId> = { 1: 'bull_challenge', 2: 'checkout_121', 3: 'checkout_121', 4: 'finishing_pyramid', 5: 'game_201' };

  return [
    { id: 't20_t19_bull',             duration: 5,  note: 'Warm-up — 10 rondes' },
    { id: scoringDrills[level],       duration: 15, note: 'Scoring drill' },
    { id: doublesDrills[level],       duration: 10, note: 'Dubbels drill' },
    { id: checkoutDrills[level],      duration: 10, note: 'Checkout drill' },
  ];
}

export function DailyTrainingScreen() {
  const navigate = useNavigate();
  const players = useAppStore(s => s.players);

  const avgAll = players.map(p => getAverageFromStats(p.stats));
  const bestAvg = avgAll.length > 0 ? Math.max(...avgAll) : 0;
  const level = detectLevel(bestAvg);
  const session = buildDailySession(level);
  const totalMin = session.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-8 pb-4 shrink-0">
        <button onPointerDown={() => navigate('/training')} className="p-2 touch-manipulation">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Dagelijkse Training</h1>
          <p className="text-text-secondary text-xs">Niveau {level} · {LEVEL_LABELS[level - 1]} · ~{totalMin} minuten</p>
        </div>
        <div className="flex items-center gap-1 bg-surface rounded-xl px-2 py-1">
          <Clock size={14} className="text-accent" />
          <span className="text-accent text-sm font-bold">{totalMin} min</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        <p className="text-text-secondary text-sm">Doe de oefeningen in volgorde voor een complete trainingssessie.</p>
        {session.map((item, i) => {
          const def = DRILL_DEFINITIONS.find(d => d.id === item.id)!;
          return (
            <button
              key={item.id}
              onPointerDown={() => navigate(`/training/drill/${item.id}`)}
              className="w-full bg-surface rounded-2xl p-4 flex items-center gap-4 active:bg-surface2 touch-manipulation text-left"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-accent font-black text-sm">{i + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-text-primary font-semibold">{def.title}</p>
                <p className="text-text-secondary text-xs">{item.note} · ~{item.duration} min</p>
              </div>
              <ChevronRight size={18} className="text-text-secondary shrink-0" />
            </button>
          );
        })}

        <div className="bg-surface rounded-2xl p-4 mt-4">
          <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Afsluiting</p>
          <p className="text-text-primary text-sm">Speel 1 leg 501 om je training af te ronden.</p>
          <button
            onPointerDown={() => navigate('/nieuw-spel')}
            className="mt-3 w-full bg-accent rounded-xl py-2.5 text-black font-bold touch-manipulation active:scale-95 transition-transform text-sm"
          >
            Start 501 Leg →
          </button>
        </div>
      </div>
    </div>
  );
}
