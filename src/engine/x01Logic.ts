import { ActiveGameState, DartThrow, Visit, GameFormat } from '../data/types';

export function getStartingScore(gameType: string): number {
  if (gameType === 'x01_501') return 501;
  if (gameType === 'x01_301') return 301;
  if (gameType === 'x01_101') return 101;
  return 501;
}

export function isBust(score: number, remaining: number): boolean {
  const newScore = remaining - score;
  if (newScore < 0) return true;
  if (newScore === 1) return true;
  return false;
}

export function isDoubleOut(dart: DartThrow): boolean {
  if (dart.multiplier === 2) return true;
  if (dart.segment === 50 && dart.multiplier === 1) return true; // Bull = 50 = double 25
  return false;
}

export function isValidX01Score(score: number): boolean {
  if (score < 0 || score > 180) return false;
  // Invalid totals that can't be scored with 3 darts
  const invalid = new Set([179, 178, 176, 175, 173, 172, 169, 166, 163]);
  return !invalid.has(score);
}

export function getLegTarget(format: GameFormat, legsToWinSet: number): number {
  switch (format) {
    case 'single': return 1;
    case 'bestOf3': return 2;
    case 'bestOf5': return 3;
    case 'competition': return legsToWinSet;
    default: return 1;
  }
}

export function getSetTarget(format: GameFormat, setsToWin: number): number {
  if (format === 'competition') return setsToWin;
  return 1; // non-competition: 1 "set" (all legs together)
}

export function getSetsEnabled(format: GameFormat): boolean {
  return format === 'competition';
}

export function checkLegWinner(
  state: ActiveGameState
): string | null {
  for (const playerId of state.playerIds) {
    if (state.scores[playerId] === 0) return playerId;
  }
  return null;
}

export function advanceLeg(state: ActiveGameState): ActiveGameState {
  const legWinner = checkLegWinner(state);
  if (!legWinner) return state;

  const newLegsWon = { ...state.legsWon };
  newLegsWon[legWinner] = (newLegsWon[legWinner] ?? 0) + 1;

  const legTarget = getLegTarget(state.format,
    state.format === 'competition' ? 4 : 0); // default

  const setsEnabled = getSetsEnabled(state.format);
  let newSetsWon = { ...state.setsWon };
  let newSet = state.currentSet;
  let setWinner: string | null = null;

  if (setsEnabled && newLegsWon[legWinner] >= legTarget) {
    // Reset leg wins for this set
    const resetLegs: Record<string, number> = {};
    for (const pid of state.playerIds) resetLegs[pid] = 0;
    setWinner = legWinner;
    newSetsWon[legWinner] = (newSetsWon[legWinner] ?? 0) + 1;
    newSet = state.currentSet + 1;
    return {
      ...state,
      legsWon: resetLegs,
      setsWon: newSetsWon,
      currentSet: newSet,
      currentLeg: state.currentLeg + 1,
    };
  }

  // Rotate: loser of leg throws first next leg
  const loserIdx = state.playerIds.findIndex(id => id !== legWinner);
  // Actually: loser of leg starts next leg
  const legLoser = state.playerIds.find(id => id !== legWinner) ?? state.playerIds[0];
  const newFirstPlayerIdx = state.playerIds.indexOf(legLoser);

  // Reset scores for new leg
  const newScores: Record<string, number> = {};
  for (const pid of state.playerIds) {
    newScores[pid] = state.startingScore;
  }

  return {
    ...state,
    scores: newScores,
    legsWon: newLegsWon,
    setsWon: newSetsWon,
    currentLeg: state.currentLeg + 1,
    currentPlayerIndex: newFirstPlayerIdx,
    firstPlayerThisLeg: legLoser,
    visits: [],
    currentVisitDarts: [],
  };
}

export function isGameOver(state: ActiveGameState): { over: boolean; winnerId: string | null } {
  const setsEnabled = getSetsEnabled(state.format);

  if (setsEnabled) {
    // Competition: check sets won
    for (const pid of state.playerIds) {
      const sw = state.setsWon[pid] ?? 0;
      if (sw >= (state.format === 'competition' ? 1 : 1)) {
        return { over: true, winnerId: pid };
      }
    }
  } else {
    const legTarget = getLegTarget(state.format, 0);
    for (const pid of state.playerIds) {
      const lw = state.legsWon[pid] ?? 0;
      if (lw >= legTarget) {
        return { over: true, winnerId: pid };
      }
    }
  }
  return { over: false, winnerId: null };
}

export function applyVisitToState(
  state: ActiveGameState,
  visit: Visit
): ActiveGameState {
  const newScores = { ...state.scores };
  if (!visit.isBust) {
    newScores[visit.playerId] = visit.remainingAfter;
  }

  // Advance player
  const nextIdx = (state.currentPlayerIndex + 1) % state.playerIds.length;

  return {
    ...state,
    scores: newScores,
    currentPlayerIndex: nextIdx,
    visits: [...state.visits, visit],
    currentVisitDarts: [],
  };
}

export function createVisit(
  state: ActiveGameState,
  playerId: string,
  darts: DartThrow[],
  options?: {
    checkoutDouble?: number; // expliciet opgegeven dubbel → nooit bust
    dartsCount?: number;     // override voor gemiddelde-berekening (altijd 3 in totaalmodus)
    totalOverride?: number;  // override totaalscore (bij dubbel-pad finish)
  }
): Visit {
  const total = options?.totalOverride ?? darts.reduce((s, d) => s + d.score, 0);
  const remaining = state.scores[playerId];
  const newRemaining = remaining - total;

  let bust: boolean;
  if (options?.checkoutDouble !== undefined) {
    // Speler heeft expliciet een dubbel gekozen → geen bust
    bust = false;
  } else {
    bust = isBust(total, remaining) ||
      (newRemaining === 0 && darts.length > 0 && !isDoubleOut(darts[darts.length - 1]));
  }

  return {
    playerId,
    darts,
    totalScore: total,
    remainingAfter: bust ? remaining : Math.max(0, newRemaining),
    isBust: bust,
    dartsCount: options?.dartsCount ?? darts.length,
    checkoutDouble: options?.checkoutDouble,
  };
}
