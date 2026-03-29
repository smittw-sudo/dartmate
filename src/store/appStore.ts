import { create } from 'zustand';
import { PlayerProfile, ActiveGameState, InputMode } from '../data/types';
import {
  getPlayers, savePlayer, updatePlayer as dbUpdatePlayer,
  getPausedGames, savePausedGame, deletePausedGame,
} from '../data/db';
import { initPlayerProfile } from '../engine/statsEngine';

interface AppStore {
  players: PlayerProfile[];
  pausedGames: ActiveGameState[];
  inputMode: InputMode;
  isLoading: boolean;

  // Actions
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
    const [players, pausedGames] = await Promise.all([
      getPlayers(),
      getPausedGames(),
    ]);
    set({ players, pausedGames, isLoading: false });
  },

  addPlayer: async (name: string) => {
    const player = initPlayerProfile(name.trim());
    await savePlayer(player);
    set(s => ({ players: [...s.players, player] }));
    return player;
  },

  updatePlayer: async (player: PlayerProfile) => {
    await dbUpdatePlayer(player);
    set(s => ({
      players: s.players.map(p => p.id === player.id ? player : p),
    }));
  },

  setInputMode: (mode: InputMode) => {
    localStorage.setItem('inputMode', mode);
    set({ inputMode: mode });
  },

  loadPausedGames: async () => {
    const pausedGames = await getPausedGames();
    set({ pausedGames });
  },

  savePaused: async (state: ActiveGameState) => {
    await savePausedGame(state);
    set(s => ({
      pausedGames: [
        ...s.pausedGames.filter(g => g.gameId !== state.gameId),
        state,
      ],
    }));
  },

  removePaused: async (gameId: string) => {
    await deletePausedGame(gameId);
    set(s => ({
      pausedGames: s.pausedGames.filter(g => g.gameId !== gameId),
    }));
  },

  getPlayerById: (id: string) => get().players.find(p => p.id === id),
}));
