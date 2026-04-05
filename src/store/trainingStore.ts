import { create } from 'zustand';
import { DrillId, DrillResult, TrainingState } from '../data/trainingTypes';

// v2: per-speler history/PRs
const STORAGE_KEY = 'dartmate_training_v2';

function load(): TrainingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TrainingState;
  } catch {}
  return { history: {}, personalRecords: {}, badges: [] };
}

function persist(state: TrainingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    history: state.history,
    personalRecords: state.personalRecords,
    badges: state.badges,
  }));
}

export interface SaveResultReturn {
  isNewPR: boolean;
  /** Was er al een eerder resultaat? (false = eerste keer deze oefening) */
  hadPrevious: boolean;
  oldPR: number | undefined;
  newPR: number;
}

interface TrainingStore extends TrainingState {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  saveResult: (
    drillId: DrillId,
    score: number,
    higherIsBetter: boolean,
    playerId: string,
    metadata?: Record<string, number>,
  ) => SaveResultReturn;
  addBadge: (badge: string) => void;
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  ...load(),
  selectedPlayerId: null,

  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  saveResult: (drillId, score, higherIsBetter, playerId, metadata) => {
    const state = get();

    const playerHistory = state.history[playerId] ?? {};
    const prev = playerHistory[drillId] ?? [];
    const newResult: DrillResult = { date: new Date().toISOString(), score, metadata };
    const updated = [newResult, ...prev].slice(0, 20);

    const playerPRs = state.personalRecords[playerId] ?? {};
    const currentPR: number | undefined = playerPRs[drillId];
    const hadPrevious = currentPR !== undefined;
    const newPR = currentPR === undefined
      ? score
      : higherIsBetter ? Math.max(currentPR, score) : Math.min(currentPR, score);
    const isNewPR = newPR !== currentPR;

    const next: TrainingState = {
      history: {
        ...state.history,
        [playerId]: { ...playerHistory, [drillId]: updated },
      },
      personalRecords: {
        ...state.personalRecords,
        [playerId]: { ...playerPRs, [drillId]: newPR },
      },
      badges: state.badges,
    };
    persist(next);
    set(next);

    return { isNewPR, hadPrevious, oldPR: currentPR, newPR };
  },

  addBadge: (badge) => {
    const state = get();
    if (state.badges.includes(badge)) return;
    const next = { ...state, badges: [...state.badges, badge] };
    persist(next);
    set(next);
  },
}));
