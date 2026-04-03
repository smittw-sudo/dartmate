import { create } from 'zustand';
import { PlayerProfile, ActiveGameState, InputMode } from '../data/types';
import {
  fetchProfiles, upsertProfile, fetchPausedGames,
  upsertPausedGame, removePausedGame,
} from '../lib/supabase';
import { initPlayerProfile } from '../engine/statsEngine';

// nickname, bio and avatarUrl are stored in localStorage so no Supabase schema changes are needed
interface ProfileExtras { nickname?: string; bio?: string; avatarUrl?: string; }
type ExtrasStore = Record<string, ProfileExtras>;

function getExtras(): ExtrasStore {
  try { return JSON.parse(localStorage.getItem('profileExtras') ?? '{}'); } catch { return {}; }
}
function saveExtras(id: string, extras: ProfileExtras) {
  const store = getExtras();
  store[id] = extras;
  localStorage.setItem('profileExtras', JSON.stringify(store));
}
function mergeExtras(profiles: PlayerProfile[]): PlayerProfile[] {
  const store = getExtras();
  return profiles.map(p => store[p.id] ? { ...p, ...store[p.id] } : p);
}

interface AppStore {
  players: PlayerProfile[];
  pausedGames: ActiveGameState[];
  inputMode: InputMode;
  isLoading: boolean;

  loadAll: () => Promise<void>;
  addPlayer: (name: string) => Promise<PlayerProfile>;
  updatePlayer: (player: PlayerProfile) => Promise<void>;
  setInputMode: (mode: InputMode) => void;
  loadPausedGames: () => Promise<void>;
  savePaused: (state: ActiveGameState) => Promise<void>;
  removePaused: (gameId: string) => Promise<void>;
  getPlayerById: (id: string) => PlayerProfile | undefined;
}

export const useAppStore = create<AppStore>((set, get) => ({
  players: [],
  pausedGames: [],
  inputMode: (localStorage.getItem('inputMode') as InputMode) ?? 'total',
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const [profiles, pausedGames] = await Promise.all([
      fetchProfiles().catch(() => [] as PlayerProfile[]),
      fetchPausedGames().catch(() => [] as ActiveGameState[]),
    ]);
    set({ players: mergeExtras(profiles), pausedGames, isLoading: false });
  },

  addPlayer: async (name: string) => {
    const player = initPlayerProfile(name.trim());
    await upsertProfile(player);
    set(s => ({ players: [...s.players, player] }));
    return player;
  },

  updatePlayer: async (player: PlayerProfile) => {
    // nickname, bio, avatarUrl live in localStorage; stats/name go to Supabase
    saveExtras(player.id, {
      nickname: player.nickname,
      bio: player.bio,
      avatarUrl: player.avatarUrl,
    });
    await upsertProfile(player);
    set(s => ({
      players: s.players.map(p => p.id === player.id ? player : p),
    }));
  },

  setInputMode: (mode: InputMode) => {
    localStorage.setItem('inputMode', mode);
    set({ inputMode: mode });
  },

  loadPausedGames: async () => {
    const pausedGames = await fetchPausedGames().catch(() => [] as ActiveGameState[]);
    set({ pausedGames });
  },

  savePaused: async (state: ActiveGameState) => {
    await upsertPausedGame(state);
    set(s => ({
      pausedGames: [
        ...s.pausedGames.filter(g => g.gameId !== state.gameId),
        state,
      ],
    }));
  },

  removePaused: async (gameId: string) => {
    await removePausedGame(gameId);
    set(s => ({
      pausedGames: s.pausedGames.filter(g => g.gameId !== gameId),
    }));
  },

  getPlayerById: (id: string) => get().players.find(p => p.id === id),
}));
