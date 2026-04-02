import { create } from 'zustand';

export interface DoubleResult {
  double: number;
  dartsThrown: number;
  attempts: number;
}

export interface DoublesSession {
  playerId: string;
  playerName: string;
  sequence: number[];
  currentIndex: number;
  currentAttempts: number;
  currentDarts: number;
  results: DoubleResult[];
  startTime: number;
  isComplete: boolean;
}

interface DoublesSessionConfig {
  playerId: string;
  playerName: string;
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

  // sequence: D1 → D{count}
  return all.slice(0, config.count);
}

export const useDoublesStore = create<DoublesStore>((set, get) => ({
  session: null,

  startSession: (config) => {
    const sequence = buildSequence(config);
    set({
      session: {
        playerId: config.playerId,
        playerName: config.playerName,
        sequence,
        currentIndex: 0,
        currentAttempts: 0,
        currentDarts: 0,
        results: [],
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

    const finalAttempts = session.currentAttempts + 1;
    const finalDarts = session.currentDarts + dartsUsed;
    const currentDouble = session.sequence[session.currentIndex];

    const newResult: DoubleResult = {
      double: currentDouble,
      dartsThrown: finalDarts,
      attempts: finalAttempts,
    };

    const newResults = [...session.results, newResult];
    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.sequence.length;

    set({
      session: {
        ...session,
        results: newResults,
        currentIndex: nextIndex,
        currentAttempts: 0,
        currentDarts: 0,
        isComplete,
      },
    });
  },

  reset: () => set({ session: null }),
}));
