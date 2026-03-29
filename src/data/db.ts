import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PlayerProfile, GameRecord, ActiveGameState } from './types';

interface DartMateDB extends DBSchema {
  players: {
    key: string;
    value: PlayerProfile;
  };
  games: {
    key: string;
    value: GameRecord;
    indexes: {
      'by-date': string;
      'by-player': string[];
    };
  };
  pausedGames: {
    key: string;
    value: ActiveGameState;
  };
}

let dbPromise: Promise<IDBPDatabase<DartMateDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DartMateDB>('dartmate', 1, {
      upgrade(db) {
        db.createObjectStore('players', { keyPath: 'id' });
        const gameStore = db.createObjectStore('games', { keyPath: 'id' });
        gameStore.createIndex('by-date', 'date');
        db.createObjectStore('pausedGames', { keyPath: 'gameId' });
      },
    });
  }
  return dbPromise;
}

// Players
export async function getPlayers(): Promise<PlayerProfile[]> {
  const db = await getDB();
  return db.getAll('players');
}

export async function savePlayer(player: PlayerProfile): Promise<void> {
  const db = await getDB();
  await db.put('players', player);
}

export async function updatePlayer(player: PlayerProfile): Promise<void> {
  const db = await getDB();
  await db.put('players', player);
}

export async function deletePlayer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('players', id);
}

export async function getPlayer(id: string): Promise<PlayerProfile | undefined> {
  const db = await getDB();
  return db.get('players', id);
}

// Games
export async function saveGame(game: GameRecord): Promise<void> {
  const db = await getDB();
  await db.put('games', game);
}

export async function getGames(): Promise<GameRecord[]> {
  const db = await getDB();
  const games = await db.getAll('games');
  return games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getGameById(id: string): Promise<GameRecord | undefined> {
  const db = await getDB();
  return db.get('games', id);
}

export async function getGamesByPlayer(playerId: string): Promise<GameRecord[]> {
  const db = await getDB();
  const all = await db.getAll('games');
  return all
    .filter(g => g.playerIds.includes(playerId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getGamesByDate(from: Date, to: Date): Promise<GameRecord[]> {
  const db = await getDB();
  const all = await db.getAll('games');
  return all
    .filter(g => {
      const d = new Date(g.date);
      return d >= from && d <= to;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Paused games
export async function savePausedGame(state: ActiveGameState): Promise<void> {
  const db = await getDB();
  await db.put('pausedGames', { ...state, pausedAt: new Date().toISOString() });
}

export async function getPausedGames(): Promise<ActiveGameState[]> {
  const db = await getDB();
  return db.getAll('pausedGames');
}

export async function getPausedGame(gameId: string): Promise<ActiveGameState | undefined> {
  const db = await getDB();
  return db.get('pausedGames', gameId);
}

export async function deletePausedGame(gameId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pausedGames', gameId);
}
