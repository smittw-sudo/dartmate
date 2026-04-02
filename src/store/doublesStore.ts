import { create } from 'zustand';

export interface DoubleResult {
  double: number;
  dartsThrown: number;
  attempts: number;
}

export interface DoublesSession {
  playerIds: string[];
  playerNames: Record<string, string>; // id → name
  sequence: number[];
  currentIndex: number;         // which double in sequence
  currentPlayerIndex: number;   // whose turn it is
  currentAttempts: number;      // attempts for current player on current double
  currentDarts: number;         // darts thrown by current player on current double
  results: Record<string, DoubleResult[]>; // id → results per double
  skippedDoubles: number[];
  startTime: number;
  isComplete: boolean;
}

interface DoublesSessionConfig {
  playerIds: string[];
  playerNames: Record<string, string>;
  count: number;
  order: 'random' | 'sequence';
  weakestFirst: boolean;
  preferredDoubles: Record<number, number>;
}

interface DoublesStore {
  session: DoublesSession | null;
  startSession: (config: DoublesSessionConfig) => void;
  registerMiss: () => void;
  registerHit: (dartsUsed: 1 | 2 | 3) => void;
  skipCurrent: () => void;
  reset: () => void;
}

function buildSequence(config: DoublesSessionConfig): number[] {
  const all = Array.from({ length: 20 }, (_, i) => i + 1);

  if (config.weakestFirst) {
    const sorted = [...all].sort((a, b) => {
      const ha = config.preferredDoubles[a] ?? 0;
      const hb = config.preferredDoubles[b] ?? 0;
      return ha !== hb ? ha - hb : a - b;
    });
    return sorted.slice(0, config.count);
  }

  if (config.order === 'random') {
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.count);
  }

  // sequence: D20 → D{21 - count}
  return all.slice(0, config.count).reverse();
}

export const useDoublesStore = create<DoublesStore>((set, get) => ({
  session: null,

  startSession: (config) => {
    const sequence = buildSequence(config);
    const results: Record<string, DoubleResult[]> = {};
    for (const pid of config.playerIds) results[pid] = [];

    set({
      session: {
        playerIds: config.playerIds,
        playerNames: config.playerNames,
        sequence,
        currentIndex: 0,
        currentPlayerIndex: 0,
        currentAttempts: 0,
        currentDarts: 0,
        results,
        skippedDoubles: [],
        startTime: Date.now(),
        isComplete: false,
      },
    });
  },

  registerMiss: () => {
    const { session } = get();
    if (!session || session.isComplete) return;
    set({
      session: {
        ...session,
        currentAttempts: session.currentAttempts + 1,
        currentDarts: session.currentDarts + 3,
      },
    });
  },

  registerHit: (dartsUsed) => {
    const { session } = get();
    if (!session || session.isComplete) return;

    const currentPlayerId = session.playerIds[session.currentPlayerIndex];
    const currentDouble = session.sequence[session.currentIndex];

    const newResult: DoubleResult = {
      double: currentDouble,
      dartsThrown: session.currentDarts + dartsUsed,
      attempts: session.currentAttempts + 1,
    };

    const newResults = {
      ...session.results,
      [currentPlayerId]: [...session.results[currentPlayerId], newResult],
    };

    const nextPlayerIndex = session.currentPlayerIndex + 1;
    const allPlayersDone = nextPlayerIndex >= session.playerIds.length;

    if (allPlayersDone) {
      // All players finished this double — advance to next
      const nextDoubleIndex = session.currentIndex + 1;
      const isComplete = nextDoubleIndex >= session.sequence.length;
      set({
        session: {
          ...session,
          results: newResults,
          currentIndex: nextDoubleIndex,
          currentPlayerIndex: 0,
          currentAttempts: 0,
          currentDarts: 0,
          isComplete,
        },
      });
    } else {
      // Next player's turn at the same double
      set({
        session: {
          ...session,
          results: newResults,
          currentPlayerIndex: nextPlayerIndex,
          currentAttempts: 0,
          currentDarts: 0,
        },
      });
    }
  },

  skipCurrent: () => {
    const { session } = get();
    if (!session || session.isComplete) return;
    const remaining = session.sequence.length - session.currentIndex;
    if (remaining <= 1) return;

    const currentDouble = session.sequence[session.currentIndex];
    const newSequence = [...session.sequence];
    newSequence.splice(session.currentIndex, 1);
    newSequence.push(currentDouble);

    set({
      session: {
        ...session,
        sequence: newSequence,
        currentPlayerIndex: 0,
        currentAttempts: 0,
        currentDarts: 0,
        skippedDoubles: [...session.skippedDoubles, currentDouble],
      },
    });
  },

  reset: () => set({ session: null }),
}));
