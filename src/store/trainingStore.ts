import { create } from 'zustand';
import { DrillId, DrillResult, TrainingState } from '../data/trainingTypes';

const STORAGE_KEY = 'dartmate_training_v1';

function load(): TrainingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TrainingState;
  } catch {}
  return {
    history: {} as Record<DrillId, DrillResult[]>,
    personalRecords: {} as Record<DrillId, number>,
    badges: [],
  };
}

function persist(state: TrainingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    history: state.history,
    personalRecords: state.personalRecords,
    badges: state.badges,
  }));
}

interface TrainingStore extends TrainingState {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  saveResult: (drillId: DrillId, score: number, higherIsBetter: boolean, metadata?: Record<string, number>) => void;
  addBadge: (badge: string) => void;
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  ...load(),
  selectedPlayerId: null,

  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  saveResult: (drillId, score, higherIsBetter, metadata) => {
    const state = get();
    const prev = state.history[drillId] ?? [];
    const newResult: DrillResult = { date: new Date().toISOString(), score, metadata };
    const updated = [newResult, ...prev].slice(0, 20);

    const currentPR = state.personalRecords[drillId];
    const newPR = currentPR === undefined
      ? score
      : higherIsBetter ? Math.max(currentPR, score) : Math.min(currentPR, score);

    const next = {
      history: { ...state.history, [drillId]: updated },
      personalRecords: { ...state.personalRecords, [drillId]: newPR },
      badges: state.badges,
    };
    persist(next);
    set(next);
  },

  addBadge: (badge) => {
    const state = get();
    if (state.badges.includes(badge)) return;
    const next = { ...state, badges: [...state.badges, badge] };
    persist(next);
    set(next);
  },
}));
