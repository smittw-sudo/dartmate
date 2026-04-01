import { create } from 'zustand';
import {
  ActiveGameState, DartThrow, Visit, GameRecord, GameType, GameFormat, LegRecord,
} from '../data/types';
import {
  getStartingScore, createVisit, applyVisitToState,
  checkLegWinner, isGameOver, getLegTarget, getSetsEnabled,
} from '../engine/x01Logic';
import { applyHits, applyMultiTargetHits, initCricketProgress, isCricketGameComplete, CricketTarget } from '../engine/cricketLogic';
import { upsertGame, upsertPausedGame, removePausedGame } from '../lib/supabase';
import { haptics } from '../utils/haptics';

interface GameConfig {
  gameType: GameType;
  format: GameFormat;
  playerIds: string[];
  teams: string[][] | null;
  legsToWinSet: number;
  setsToWin: number;
}

interface GameStore {
  game: ActiveGameState | null;
  completedLegs: LegRecord[];
  showAnimation: 'oneEighty' | 'bust' | 'legWon' | 'broken' | null;
  animationData: string;
  pendingCricketFinish: { winnerId: string | null } | null;

  startGame: (config: GameConfig) => void;
  submitVisit: (darts: DartThrow[], options?: { checkoutDouble?: number; dartsCount?: number }) => void;
  submitCricketHits: (hits: number) => void;
  submitCricketVisit: (entries: { target: CricketTarget; hits: number }[]) => void;
  confirmCricketFinish: (dartsCount: number) => void;
  bustCurrentVisit: () => void;
  undoLastVisit: () => void;
  addDartToVisit: (dart: DartThrow) => void;
  removeDartFromVisit: () => void;
  pauseGame: () => Promise<void>;
  resumeGame: (state: ActiveGameState) => void;
  endGame: () => Promise<GameRecord | null>;
  clearAnimation: () => void;
  setGame: (state: ActiveGameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  completedLegs: [],
  showAnimation: null,
  animationData: '',
  pendingCricketFinish: null,

  startGame: (config: GameConfig) => {
    const startingScore = getStartingScore(config.gameType);
    const scores: Record<string, number> = {};
    const legsWon: Record<string, number> = {};
    const setsWon: Record<string, number> = {};

    for (const pid of config.playerIds) {
      scores[pid] = startingScore;
      legsWon[pid] = 0;
      setsWon[pid] = 0;
    }

    const isCricket = config.gameType === 'cricket';

    const state: ActiveGameState = {
      gameId: crypto.randomUUID(),
      gameType: config.gameType,
      format: config.format,
      startingScore,
      playerIds: config.playerIds,
      teams: config.teams,
      scores,
      currentPlayerIndex: 0,
      currentLeg: 1,
      currentSet: 1,
      legsWon,
      setsWon,
      firstPlayerThisLeg: config.playerIds[0],
      firstPlayerThisGame: config.playerIds[0],
      visits: [],
      currentVisitDarts: [],
      pausedAt: '',
      legStartTime: Date.now(),
      gameStartTime: Date.now(),
      cricketProgress: isCricket ? initCricketProgress(config.playerIds) : undefined,
      isGameOver: false,
      winnerId: null,
    };

    set({ game: state, completedLegs: [], showAnimation: null });
  },

  addDartToVisit: (dart: DartThrow) => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, currentVisitDarts: [...game.currentVisitDarts, dart] } });
  },

  removeDartFromVisit: () => {
    const { game } = get();
    if (!game) return;
    const darts = [...game.currentVisitDarts];
    darts.pop();
    set({ game: { ...game, currentVisitDarts: darts } });
  },

  submitVisit: (darts: DartThrow[], options?: { checkoutDouble?: number; dartsCount?: number }) => {
    const { game, completedLegs } = get();
    if (!game) return;

    const currentPlayerId = game.playerIds[game.currentPlayerIndex];
    const visit = createVisit(game, currentPlayerId, darts, {
      checkoutDouble: options?.checkoutDouble,
      dartsCount: options?.dartsCount,
    });

    // Check for 180
    if (visit.totalScore === 180) {
      haptics.oneEighty();
      set({ showAnimation: 'oneEighty', animationData: currentPlayerId });
    } else if (visit.isBust) {
      haptics.bust();
      set({ showAnimation: 'bust', animationData: currentPlayerId });
    } else {
      haptics.confirm();
    }

    let newState = applyVisitToState(game, visit);

    // Check if leg won
    const legWinner = checkLegWinner(newState);
    if (legWinner) {
      haptics.legWon();

      // Record leg — checkoutDouble vanuit options of vanuit de visit zelf
      const leg: LegRecord = {
        legNumber: game.currentLeg,
        setNumber: game.currentSet,
        startingPlayerId: game.firstPlayerThisLeg,
        winnerId: legWinner,
        visits: [...game.visits, visit],
        checkoutDouble: options?.checkoutDouble ?? visit.checkoutDouble ?? null,
      };
      const newLegs = [...completedLegs, leg];

      // Update legs won
      const newLegsWon = { ...newState.legsWon };
      newLegsWon[legWinner] = (newLegsWon[legWinner] ?? 0) + 1;
      newState = { ...newState, legsWon: newLegsWon };

      // Check game over
      const setsEnabled = getSetsEnabled(game.format);
      const legTarget = getLegTarget(game.format, game.format === 'competition' ? 4 : 0);

      let gameOver = false;
      let winnerId: string | null = null;

      if (setsEnabled) {
        const newSetsWon = { ...newState.setsWon };
        if (newLegsWon[legWinner] >= legTarget) {
          newSetsWon[legWinner] = (newSetsWon[legWinner] ?? 0) + 1;
          newState = { ...newState, setsWon: newSetsWon };
          const setTarget = game.format === 'competition' ? 1 : 1;
          if (newSetsWon[legWinner] >= setTarget) {
            gameOver = true;
            winnerId = legWinner;
          }
        }
      } else {
        if (newLegsWon[legWinner] >= legTarget) {
          gameOver = true;
          winnerId = legWinner;
        }
      }

      if (gameOver) {
        // Check broken
        if (legWinner !== game.firstPlayerThisGame) {
          set({
            showAnimation: 'broken',
            animationData: game.firstPlayerThisGame,
          });
        } else {
          set({ showAnimation: 'legWon', animationData: legWinner });
        }
        set({
          game: { ...newState, isGameOver: true, winnerId },
          completedLegs: newLegs,
        });
        return;
      }

      // Start new leg
      const legLoser = game.playerIds.find(id => id !== legWinner) ?? game.playerIds[0];
      const newFirstIdx = game.playerIds.indexOf(legLoser);
      const newScores: Record<string, number> = {};
      for (const pid of game.playerIds) newScores[pid] = game.startingScore;

      newState = {
        ...newState,
        scores: newScores,
        currentLeg: game.currentLeg + 1,
        currentPlayerIndex: newFirstIdx,
        firstPlayerThisLeg: legLoser,
        visits: [],
        currentVisitDarts: [],
        legStartTime: Date.now(),
      };

      set({ showAnimation: 'legWon', animationData: legWinner, game: newState, completedLegs: newLegs });
      return;
    }

    set({ game: newState });
  },

  submitCricketHits: (hits: number) => {
    const { game, completedLegs } = get();
    if (!game) return;

    const currentPlayerId = game.playerIds[game.currentPlayerIndex];
    haptics.confirm();

    const newState = applyHits(game, currentPlayerId, hits);
    const result = isCricketGameComplete(newState);

    if (result.complete) {
      const leg: LegRecord = {
        legNumber: game.currentLeg,
        setNumber: game.currentSet,
        startingPlayerId: game.firstPlayerThisLeg,
        winnerId: result.winnerId,
        visits: game.visits,
        checkoutDouble: null,
      };

      if (result.winnerId !== game.firstPlayerThisGame) {
        set({ showAnimation: 'broken', animationData: game.firstPlayerThisGame });
      }

      set({
        game: { ...newState, isGameOver: true, winnerId: result.winnerId },
        completedLegs: [...completedLegs, leg],
      });
      return;
    }

    set({ game: newState });
  },

  submitCricketVisit: (entries: { target: CricketTarget; hits: number }[]) => {
    const { game } = get();
    if (!game) return;

    const currentPlayerId = game.playerIds[game.currentPlayerIndex];
    haptics.confirm();

    const newState = applyMultiTargetHits(game, currentPlayerId, entries);
    const result = isCricketGameComplete(newState);

    // Create a Visit record for this cricket turn so darts are tracked
    const hitsCount = entries.filter(e => e.hits > 0).length;
    const dartsUsed = hitsCount === 0 ? 3 : hitsCount; // miss = assume 3 darts thrown
    const cricketVisit: Visit = {
      playerId: currentPlayerId,
      darts: [],
      totalScore: 0,
      remainingAfter: 0,
      isBust: false,
      dartsCount: dartsUsed,
    };
    const stateWithVisit = { ...newState, visits: [...game.visits, cricketVisit] };

    if (result.complete) {
      // Pause finalization — ask for exact dart count on the finishing throw
      set({
        game: stateWithVisit,
        pendingCricketFinish: { winnerId: result.winnerId },
      });
      return;
    }

    set({ game: stateWithVisit });
  },

  confirmCricketFinish: (dartsCount: number) => {
    const { game, completedLegs, pendingCricketFinish } = get();
    if (!game || !pendingCricketFinish) return;

    // Update the last visit with the confirmed dart count
    const visits = [...game.visits];
    if (visits.length > 0) {
      visits[visits.length - 1] = { ...visits[visits.length - 1], dartsCount };
    }

    const { winnerId } = pendingCricketFinish;
    const leg: LegRecord = {
      legNumber: game.currentLeg,
      setNumber: game.currentSet,
      startingPlayerId: game.firstPlayerThisLeg,
      winnerId,
      visits,
      checkoutDouble: null,
    };

    if (winnerId !== game.firstPlayerThisGame) {
      set({ showAnimation: 'broken', animationData: game.firstPlayerThisGame });
    } else {
      set({ showAnimation: 'legWon', animationData: winnerId ?? '' });
    }

    set({
      game: { ...game, visits, isGameOver: true, winnerId },
      completedLegs: [...completedLegs, leg],
      pendingCricketFinish: null,
    });
  },

  bustCurrentVisit: () => {
    const { game } = get();
    if (!game) return;

    const currentPlayerId = game.playerIds[game.currentPlayerIndex];
    const darts = game.currentVisitDarts;
    const visit: Visit = {
      playerId: currentPlayerId,
      darts,
      totalScore: darts.reduce((s, d) => s + d.score, 0),
      remainingAfter: game.scores[currentPlayerId],
      isBust: true,
      dartsCount: darts.length === 0 ? 3 : darts.length, // totaalmodus = altijd 3
    };

    haptics.bust();
    set({ showAnimation: 'bust', animationData: currentPlayerId });

    const newState = applyVisitToState(game, visit);
    set({ game: newState });
  },

  undoLastVisit: () => {
    const { game } = get();
    if (!game || game.visits.length === 0) return;

    const visits = [...game.visits];
    const lastVisit = visits.pop()!;

    // Restore score
    const newScores = { ...game.scores };
    if (lastVisit.isBust) {
      // score was not changed
    } else {
      newScores[lastVisit.playerId] = newScores[lastVisit.playerId] + lastVisit.totalScore;
    }

    // Restore player index
    const prevIdx = (game.currentPlayerIndex - 1 + game.playerIds.length) % game.playerIds.length;

    set({ game: { ...game, visits, scores: newScores, currentPlayerIndex: prevIdx, currentVisitDarts: [] } });
  },

  pauseGame: async () => {
    const { game } = get();
    if (!game) return;
    const paused = { ...game, pausedAt: new Date().toISOString() };
    await upsertPausedGame(paused).catch(console.error);
    set({ game: null, completedLegs: [] });
  },

  resumeGame: (state: ActiveGameState) => {
    set({ game: state, completedLegs: [], showAnimation: null });
  },

  endGame: async () => {
    const { game, completedLegs } = get();
    if (!game) return null;

    // Build game record
    const record: GameRecord = {
      id: game.gameId,
      gameType: game.gameType,
      format: game.format,
      startingScore: game.startingScore,
      date: new Date().toISOString(),
      duration: Math.round((Date.now() - game.gameStartTime) / 1000),
      playerIds: game.playerIds,
      teams: game.teams,
      legs: completedLegs,
      winnerId: game.winnerId ?? null,
      isComplete: true,
      pausedState: null,
      legsToWinSet: 0,
      setsToWin: 0,
    };

    await upsertGame(record).catch(console.error);
    await removePausedGame(game.gameId).catch(() => {});

    set({ game: null, completedLegs: [] });
    return record;
  },

  clearAnimation: () => {
    set({ showAnimation: null, animationData: '' });
  },

  setGame: (state: ActiveGameState) => {
    set({ game: state });
  },
}));
