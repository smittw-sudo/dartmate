import { create } from 'zustand';

export interface DoubleResult {
  double: number;
  dartsThrown: number;
  attempts: number;
}

export interface DoublesSession {
  playerIds: string[];
  playerNames: Record<string, string>;
  sequence: number[];
  currentIndex: number;           // which double in sequence
  currentPlayerIndex: number;     // whose turn it is RIGHT NOW
  // Per-player counters for the current double (reset when double advances)
  playerAttempts: Record<string, number>;
  playerDarts: Record<string, number>;
  playersDoneThisDouble: string[]; // players who have already hit this double
  results: Record<string, DoubleResult[]>;
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
    return [...all]
      .sort((a, b) => {
        const ha = config.preferredDoubles[a] ?? 0;
        const hb = config.preferredDoubles[b] ?? 0;
        return ha !== hb ? ha - hb : a - b;
      })
      .slice(0, config.count);
  }
  if (config.order === 'random') {
    return [...all].sort(() => Math.random() - 0.5).slice(0, config.count);
  }
  return all.slice(0, config.count).reverse(); // D20 → D1
}

/** Next player index who hasn't hit the current double yet, cycling from currentIdx */
function nextUndone(playerIds: string[], currentIdx: number, done: string[]): number {
  const n = playerIds.length;
  for (let i = 1; i <= n; i++) {
    const idx = (currentIdx + i) % n;
    if (!done.includes(playerIds[idx])) return idx;
  }
  return 0; // fallback (shouldn't happen if there are undone players left)
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
        playerAttempts: {},
        playerDarts: {},
        playersDoneThisDouble: [],
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

    const pid = session.playerIds[session.currentPlayerIndex];
    const newAttempts = { ...session.playerAttempts, [pid]: (session.playerAttempts[pid] ?? 0) + 1 };
    const newDarts = { ...session.playerDarts, [pid]: (session.playerDarts[pid] ?? 0) + 3 };
    const nextIdx = nextUndone(session.playerIds, session.currentPlayerIndex, session.playersDoneThisDouble);

    set({ session: { ...session, playerAttempts: newAttempts, playerDarts: newDarts, currentPlayerIndex: nextIdx } });
  },

  registerHit: (dartsUsed) => {
    const { session } = get();
    if (!session || session.isComplete) return;

    const pid = session.playerIds[session.currentPlayerIndex];
    const currentDouble = session.sequence[session.currentIndex];

    const finalAttempts = (session.playerAttempts[pid] ?? 0) + 1;
    const finalDarts = (session.playerDarts[pid] ?? 0) + dartsUsed;

    const newResults = {
      ...session.results,
      [pid]: [...session.results[pid], { double: currentDouble, dartsThrown: finalDarts, attempts: finalAttempts }],
    };

    const newDone = [...session.playersDoneThisDouble, pid];
    const allDone = newDone.length >= session.playerIds.length;

    if (allDone) {
      const nextDoubleIndex = session.currentIndex + 1;
      const isComplete = nextDoubleIndex >= session.sequence.length;
      set({
        session: {
          ...session,
          results: newResults,
          currentIndex: nextDoubleIndex,
          currentPlayerIndex: 0,
          playerAttempts: {},
          playerDarts: {},
          playersDoneThisDouble: [],
          isComplete,
        },
      });
    } else {
      const nextIdx = nextUndone(session.playerIds, session.currentPlayerIndex, newDone);
      set({
        session: {
          ...session,
          results: newResults,
          playersDoneThisDouble: newDone,
          currentPlayerIndex: nextIdx,
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
        playerAttempts: {},
        playerDarts: {},
        playersDoneThisDouble: [],
        skippedDoubles: [...session.skippedDoubles, currentDouble],
      },
    });
  },

  reset: () => set({ session: null }),
}));
