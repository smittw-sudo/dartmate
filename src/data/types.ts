export type GameType = 'x01_501' | 'x01_301' | 'x01_101' | 'cricket';
export type GameFormat = 'single' | 'bestOf3' | 'bestOf5' | 'competition';
export type InputMode = 'total' | 'dartboard';

export interface PlayerProfile {
  id: string;
  name: string;
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  stats: PlayerStats;
  preferredDoubles: Record<number, number>; // double number -> hit count
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentWinStreak: number;
  longestWinStreak: number;
  timesFirstAndBroke: number;
  totalDartsThrown: number;
  totalScored: number;
  highestCheckout: number;
  oneEighties: number;
  hundredFortyPlus: number;
  hundredPlus: number;
  checkoutAttempts: number;
  checkoutHits: number;
  busts: number;
  bestLegDarts: number;
  bestGameAverage: number;
  worstGameAverage: number;
  recentGameAverages: number[]; // laatste ≤20 X01-potje-gemiddelden, meest recent eerst
  cricketGamesPlayed: number;
  cricketGamesWon: number;
}

export interface DartThrow {
  segment: number;    // 1-20, 25 (outer bull), 50 (bullseye)
  multiplier: number; // 1, 2, 3
  score: number;
}

export interface Visit {
  playerId: string;
  darts: DartThrow[];
  totalScore: number;
  remainingAfter: number;
  isBust: boolean;
  dartsCount?: number;       // altijd 3 in totaalmodus, werkelijk aantal in dartbordmodus
  checkoutDouble?: number;   // segment van de uitgooi-dubbel (1-20 of 50 voor Bull)
}

export interface LegRecord {
  legNumber: number;
  setNumber: number;
  startingPlayerId: string;
  winnerId: string | null;
  visits: Visit[];
  checkoutDouble: number | null;
}

export interface GameRecord {
  id: string;
  gameType: GameType;
  format: GameFormat;
  startingScore: number;
  date: string;
  duration: number;
  playerIds: string[];
  teams: string[][] | null;
  legs: LegRecord[];
  winnerId: string | null;
  isComplete: boolean;
  pausedState: ActiveGameState | null;
  legsToWinSet: number;
  setsToWin: number;
}

export interface ActiveGameState {
  gameId: string;
  gameType: GameType;
  format: GameFormat;
  startingScore: number;
  playerIds: string[];
  teams: string[][] | null;
  scores: Record<string, number>;
  currentPlayerIndex: number;
  currentLeg: number;
  currentSet: number;
  legsWon: Record<string, number>;
  setsWon: Record<string, number>;
  firstPlayerThisLeg: string;
  firstPlayerThisGame: string;
  visits: Visit[];
  currentVisitDarts: DartThrow[];
  pausedAt: string;
  legStartTime: number;
  gameStartTime: number;
  cricketProgress?: Record<string, Record<number | string, number>>;
  lastAnimation?: 'oneEighty' | 'bust' | 'legWon' | 'broken' | null;
  lastAnimationData?: string;
  isGameOver?: boolean;
  winnerId?: string | null;
}

export interface DartTarget {
  segment: number;
  multiplier: number;
  label: string; // "T20", "D16", "Bull"
  score: number;
}

export interface CheckoutSuggestion {
  score: number;
  primaryRoute: DartTarget[];
  alternatives: DartTarget[][];
  isBogey: boolean;
  setupSuggestion?: string;
  isPreferred: boolean;
}

export const BOGEY_NUMBERS = new Set([159, 162, 163, 165, 166, 168, 169]);

export const defaultStats = (): PlayerStats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  currentWinStreak: 0,
  longestWinStreak: 0,
  timesFirstAndBroke: 0,
  totalDartsThrown: 0,
  totalScored: 0,
  highestCheckout: 0,
  oneEighties: 0,
  hundredFortyPlus: 0,
  hundredPlus: 0,
  checkoutAttempts: 0,
  checkoutHits: 0,
  busts: 0,
  bestLegDarts: 0,
  bestGameAverage: 0,
  worstGameAverage: 0,
  recentGameAverages: [],
  cricketGamesPlayed: 0,
  cricketGamesWon: 0,
});

// ─── Gast-speler ─────────────────────────────────────────────────────────────
export const GUEST_PLAYER_ID = '__guest__';

/** Tijdelijk profiel voor een gast — nooit opgeslagen in Supabase. */
export function guestPlayerProfile(): PlayerProfile {
  return {
    id: GUEST_PLAYER_ID,
    name: 'Gast',
    nickname: 'Gast',
    createdAt: new Date().toISOString(),
    stats: defaultStats(),
    preferredDoubles: {},
  };
}

/** Zoek speler op ID; geeft gastprofiel terug voor __guest__ en onbekende IDs. */
export function resolvePlayer(id: string, players: PlayerProfile[]): PlayerProfile | undefined {
  if (id === GUEST_PLAYER_ID) return guestPlayerProfile();
  return players.find(p => p.id === id);
}
