import { createClient } from '@supabase/supabase-js';
import { PlayerProfile, GameRecord, ActiveGameState } from '../data/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ── Player profiles ─────────────────────────────────────────────────────────

export async function fetchProfiles(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToProfile);
}

export async function upsertProfile(profile: PlayerProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  const { error } = await supabase.from('player_profiles').upsert({
    id: profile.id,
    user_id: user.id,
    name: profile.name,
    nickname: profile.nickname ?? null,
    bio: profile.bio ?? null,
    avatar_url: profile.avatarUrl ?? null,
    created_at: profile.createdAt,
    stats: profile.stats,
    preferred_doubles: profile.preferredDoubles,
  });
  if (error) throw error;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('player_profiles').delete().eq('id', id);
  if (error) throw error;
}

function rowToProfile(row: Record<string, unknown>): PlayerProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    nickname: (row.nickname as string | null) ?? undefined,
    bio: (row.bio as string | null) ?? undefined,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    createdAt: row.created_at as string,
    stats: (row.stats as PlayerProfile['stats']) ?? {},
    preferredDoubles: (row.preferred_doubles as Record<number, number>) ?? {},
  };
}

// ── Games ────────────────────────────────────────────────────────────────────

export async function fetchGames(): Promise<GameRecord[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToGame);
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertGame(game: GameRecord): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  const { error } = await supabase.from('games').upsert({
    id: game.id,
    user_id: user.id,
    game_type: game.gameType,
    format: game.format,
    starting_score: game.startingScore,
    date: game.date,
    duration: game.duration,
    player_ids: game.playerIds,
    teams: game.teams,
    legs: game.legs,
    winner_id: game.winnerId,
    is_complete: game.isComplete,
    legs_to_win_set: game.legsToWinSet,
    sets_to_win: game.setsToWin,
  });
  if (error) throw error;
}

function rowToGame(row: Record<string, unknown>): GameRecord {
  return {
    id: row.id as string,
    gameType: row.game_type as GameRecord['gameType'],
    format: row.format as GameRecord['format'],
    startingScore: row.starting_score as number,
    date: row.date as string,
    duration: row.duration as number,
    playerIds: row.player_ids as string[],
    teams: row.teams as string[][] | null,
    legs: (row.legs as GameRecord['legs']) ?? [],
    winnerId: row.winner_id as string | null,
    isComplete: row.is_complete as boolean,
    pausedState: null,
    legsToWinSet: row.legs_to_win_set as number,
    setsToWin: row.sets_to_win as number,
  };
}

// ── Paused games ─────────────────────────────────────────────────────────────

export async function fetchPausedGames(): Promise<ActiveGameState[]> {
  const { data, error } = await supabase
    .from('paused_games')
    .select('*')
    .order('paused_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => r.state as ActiveGameState);
}

export async function upsertPausedGame(state: ActiveGameState): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  const { error } = await supabase.from('paused_games').upsert({
    game_id: state.gameId,
    user_id: user.id,
    state,
    paused_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removePausedGame(gameId: string): Promise<void> {
  const { error } = await supabase.from('paused_games').delete().eq('game_id', gameId);
  if (error) throw error;
}
