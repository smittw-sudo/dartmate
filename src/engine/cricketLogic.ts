import { ActiveGameState } from '../data/types';

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 'bull'] as const;
export type CricketTarget = typeof CRICKET_TARGETS[number];

export const REQUIRED_HITS = 3;

export function getCricketProgress(
  state: ActiveGameState,
  playerId: string
): Record<string | number, number> {
  return state.cricketProgress?.[playerId] ?? {};
}

export function getCurrentTarget(
  state: ActiveGameState,
  playerId: string
): CricketTarget {
  const progress = getCricketProgress(state, playerId);
  for (const target of CRICKET_TARGETS) {
    const key = target === 'bull' ? 'bull' : target;
    const hits = progress[key] ?? 0;
    if (hits < REQUIRED_HITS) return target;
  }
  return 'bull'; // all done → game should be over
}

export function applyHits(
  state: ActiveGameState,
  playerId: string,
  hits: number
): ActiveGameState {
  const target = getCurrentTarget(state, playerId);
  const key = target === 'bull' ? 'bull' : target;

  const playerProgress = { ...(state.cricketProgress?.[playerId] ?? {}) };
  const current = playerProgress[key] ?? 0;
  playerProgress[key] = Math.min(current + hits, REQUIRED_HITS);

  const newProgress = {
    ...(state.cricketProgress ?? {}),
    [playerId]: playerProgress,
  };

  const nextIdx = (state.currentPlayerIndex + 1) % state.playerIds.length;

  return {
    ...state,
    cricketProgress: newProgress,
    currentPlayerIndex: nextIdx,
    currentVisitDarts: [],
  };
}

/** Returns up to `count` open (unclosed) targets for playerId, starting from their current target. */
export function getOpenTargets(
  state: ActiveGameState,
  playerId: string,
  count: number,
): CricketTarget[] {
  const progress = getCricketProgress(state, playerId);
  const open: CricketTarget[] = [];
  for (const target of CRICKET_TARGETS) {
    const key = target === 'bull' ? 'bull' : target;
    if ((progress[key] ?? 0) < REQUIRED_HITS) {
      open.push(target);
      if (open.length >= count) break;
    }
  }
  return open;
}

/** Apply hits to multiple targets in one visit. Hits are capped at REQUIRED_HITS per target. */
export function applyMultiTargetHits(
  state: ActiveGameState,
  playerId: string,
  entries: { target: CricketTarget; hits: number }[],
): ActiveGameState {
  const playerProgress = { ...(state.cricketProgress?.[playerId] ?? {}) };

  for (const { target, hits } of entries) {
    if (hits <= 0) continue;
    const key = target === 'bull' ? 'bull' : target;
    const current = playerProgress[key] ?? 0;
    playerProgress[key] = Math.min(current + hits, REQUIRED_HITS);
  }

  const newProgress = {
    ...(state.cricketProgress ?? {}),
    [playerId]: playerProgress,
  };

  const nextIdx = (state.currentPlayerIndex + 1) % state.playerIds.length;

  return {
    ...state,
    cricketProgress: newProgress,
    currentPlayerIndex: nextIdx,
    currentVisitDarts: [],
  };
}

export function isCricketGameComplete(state: ActiveGameState): { complete: boolean; winnerId: string | null } {
  for (const playerId of state.playerIds) {
    const progress = state.cricketProgress?.[playerId] ?? {};
    const allDone = CRICKET_TARGETS.every(target => {
      const key = target === 'bull' ? 'bull' : target;
      return (progress[key] ?? 0) >= REQUIRED_HITS;
    });
    if (allDone) return { complete: true, winnerId: playerId };
  }
  return { complete: false, winnerId: null };
}

export function getCricketTargetLabel(target: CricketTarget): string {
  if (target === 'bull') return 'Bull';
  return String(target);
}

export function initCricketProgress(playerIds: string[]): Record<string, Record<string | number, number>> {
  const progress: Record<string, Record<string | number, number>> = {};
  for (const pid of playerIds) {
    progress[pid] = {};
  }
  return progress;
}
