import { create } from 'zustand';
import { DrillId, DrillResult, TrainingState } from '../data/trainingTypes';

const STORAGE_KEY = 'dartmate_training_v1';

function load(): TrainingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TrainingState;
  } catch {}
  return { history: {} as Record<DrillId, DrillResult[]>, personalRecords: {} as Record<DrillId, number>, badges: [] };
}

function save(state: TrainingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface TrainingStore extends TrainingState {
  saveResult: (drillId: DrillId, score: number, higherIsBetter: boolean, metadata?: Record<string, number>) => void;
  getHistory: (drillId: DrillId) => DrillResult[];
  getPR: (drillId: DrillId) => number | undefined;
  addBadge: (badge: string) => void;
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  ...load(),

  saveResult: (drillId, score, higherIsBetter, metadata) => {
    const state = get();
    const prev = state.history[drillId] ?? [];
    const newResult: DrillResult = { date: new Date().toISOString(), score, metadata };
    const updated = [newResult, ...prev].slice(0, 20);

    const currentPR = state.personalRecords[drillId];
    const newPR = currentPR === undefined
      ? score
      : higherIsBetter
        ? Math.max(currentPR, score)
        : Math.min(currentPR, score);

    const next: TrainingState = {
      history: { ...state.history, [drillId]: updated },
      personalRecords: { ...state.personalRecords, [drillId]: newPR },
      badges: state.badges,
    };
    save(next);
    set(next);
  },

  getHistory: (drillId) => get().history[drillId] ?? [],
  getPR: (drillId) => get().personalRecords[drillId],

  addBadge: (badge) => {
    const state = get();
    if (state.badges.includes(badge)) return;
    const next = { ...state, badges: [...state.badges, badge] };
    save(next);
    set(next);
  },
}));
