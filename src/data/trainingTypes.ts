export type DrillId =
  | 'hundred_darts_t20'
  | 'big_trebles'
  | 'first_nine_tracker'
  | 't20_t19_bull'
  | 'bobs_27'
  | 'round_clock_doubles'
  | 'pressure_doubles'
  | 'checkout_121'
  | 'finishing_pyramid'
  | 'game_201'
  | 'bull_challenge'
  | 'frustration';

export type DrillCategory = 'scoring' | 'doubles' | 'checkouts';

export interface DrillDefinition {
  id: DrillId;
  category: DrillCategory;
  title: string;
  subtitle: string;
  description: string;
  scoringLabel: string; // e.g. "Raakpercentage", "Score", "Pijlen"
  higherIsBetter: boolean;
  levelTargets: [number, number, number, number, number]; // target per level 1-5
}

export interface DrillResult {
  date: string;
  score: number;
  metadata?: Record<string, number>;
}

export interface TrainingState {
  history: Record<DrillId, DrillResult[]>; // max 20 per drill
  personalRecords: Record<DrillId, number>;
  badges: string[];
}

export const DRILL_DEFINITIONS: DrillDefinition[] = [
  {
    id: 'hundred_darts_t20',
    category: 'scoring',
    title: '100 Darts T20',
    subtitle: 'Treble-precisie',
    description: 'Gooi 100 pijlen op Treble 20. Tel je raakpercentage. Elke pijl telt.',
    scoringLabel: '% raak',
    higherIsBetter: true,
    levelTargets: [20, 30, 40, 55, 65],
  },
  {
    id: 'big_trebles',
    category: 'scoring',
    title: 'Big Trebles',
    subtitle: 'Vier zones, 9 pijlen',
    description: '9 pijlen elk op T20, T19, T18 en T17 (36 totaal). Tel hoeveel trebles je raakt.',
    scoringLabel: 'Trebles geraakt',
    higherIsBetter: true,
    levelTargets: [4, 7, 11, 16, 21],
  },
  {
    id: 'first_nine_tracker',
    category: 'scoring',
    title: 'First 9 Tracker',
    subtitle: 'Topprestatie meten',
    description: '10 rondes van 9 pijlen op T20/T19. Noteer je score per ronde. Bereken je first-9-gemiddelde.',
    scoringLabel: 'Gem. per 9 pijlen',
    higherIsBetter: true,
    levelTargets: [30, 50, 70, 95, 115],
  },
  {
    id: 't20_t19_bull',
    category: 'scoring',
    title: 'T20-T19-Bull Combo',
    subtitle: 'Drie zones per ronde',
    description: '10 rondes: 1 pijl op T20, 1 op T19, 1 op Bull. Tel totale hits over alle rondes.',
    scoringLabel: 'Hits (max 30)',
    higherIsBetter: true,
    levelTargets: [5, 8, 12, 17, 22],
  },
  {
    id: 'bobs_27',
    category: 'doubles',
    title: "Bob's 27",
    subtitle: 'Het klassieke dubbel-spel',
    description: 'Start met 27 punten. Gooi D1 t/m D20 + Bull. Per dubbel 3 pijlen. Hit: +waarde×hits. Alle 3 mis: −waarde. Onder 0 = game over.',
    scoringLabel: 'Eindscore',
    higherIsBetter: true,
    levelTargets: [-27, 50, 120, 200, 300],
  },
  {
    id: 'round_clock_doubles',
    category: 'doubles',
    title: 'Round the Clock',
    subtitle: 'D1 t/m D20 + Bull',
    description: 'Gooi D1 t/m D20 en Bull in volgorde. Tel het totaal aantal pijlen dat je nodig hebt.',
    scoringLabel: 'Pijlen gebruikt',
    higherIsBetter: false,
    levelTargets: [100, 75, 55, 42, 30],
  },
  {
    id: 'pressure_doubles',
    category: 'doubles',
    title: 'Pressure Doubles',
    subtitle: 'Dubbel of terug',
    description: 'Round the Clock Doubles, maar als je een single raakt (niet de double) ga je terug naar het begin van die double. Pijlen tellen.',
    scoringLabel: 'Pijlen gebruikt',
    higherIsBetter: false,
    levelTargets: [150, 100, 70, 50, 36],
  },
  {
    id: 'checkout_121',
    category: 'checkouts',
    title: '121 Checkout',
    subtitle: '9 pijlen om uit te gooien',
    description: 'Start op 121. Heb je 9 pijlen (3 beurten) om uit te gooien. Raak = +1, mis = −1. Meerdere pogingen. Hint toont de standaard route.',
    scoringLabel: 'Score (pogingen)',
    higherIsBetter: true,
    levelTargets: [-5, -2, 0, 3, 6],
  },
  {
    id: 'finishing_pyramid',
    category: 'checkouts',
    title: 'Finishing Pyramid',
    subtitle: '60 → 170, stap voor stap',
    description: 'Begin op 60. Gooi uit → spring +10 omhoog (max 170). Mis → −1 punt op je score, blijf op dezelfde hoogte.',
    scoringLabel: 'Totaalscore',
    higherIsBetter: true,
    levelTargets: [-5, 0, 5, 10, 15],
  },
  {
    id: 'game_201',
    category: 'checkouts',
    title: 'The 201 Game',
    subtitle: 'Zo snel mogelijk uitgooien',
    description: 'Finish 201 in zo weinig mogelijk pijlen. Target is onder de 10 pijlen.',
    scoringLabel: 'Pijlen gebruikt',
    higherIsBetter: false,
    levelTargets: [30, 20, 15, 12, 9],
  },
  {
    id: 'bull_challenge',
    category: 'checkouts',
    title: 'Bull Challenge',
    subtitle: '30 pijlen op de bull',
    description: '30 pijlen op Bull. Tel inner bulls (50). Benchmark: beginner <3, gevorderd 6+, expert 12+.',
    scoringLabel: 'Inner Bulls',
    higherIsBetter: true,
    levelTargets: [1, 3, 6, 10, 15],
  },
  {
    id: 'frustration',
    category: 'checkouts',
    title: 'Frustration',
    subtitle: 'Score first, then finish',
    description: 'Gooi eerst 60+ met 2 pijlen, dan 1 pijl op de double. 8 moeilijkheidsgraden. Mis de double = volgende ronde opnieuw beginnen.',
    scoringLabel: 'Hoogste level gehaald',
    higherIsBetter: true,
    levelTargets: [1, 2, 3, 5, 7],
  },
];

export const DRILL_BY_ID: Record<DrillId, DrillDefinition> = Object.fromEntries(
  DRILL_DEFINITIONS.map(d => [d.id, d])
) as Record<DrillId, DrillDefinition>;

export const LEVEL_THRESHOLDS = [0, 35, 56, 71, 86]; // min avg for levels 1-5

export function detectLevel(avg3dart: number): number {
  if (avg3dart >= 86) return 5;
  if (avg3dart >= 71) return 4;
  if (avg3dart >= 56) return 3;
  if (avg3dart >= 35) return 2;
  return 1;
}

export const LEVEL_LABELS = ['Beginner', 'Basis', 'Gevorderd', 'Semi-Pro', 'Expert'];
