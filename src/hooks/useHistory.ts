import { useState, useEffect, useCallback } from 'react';
import { GameRecord } from '../data/types';
import { getGames, getGamesByPlayer, getGamesByDate } from '../data/db';

export function useHistory() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const result = await getGames();
    setGames(result);
    setLoading(false);
  }, []);

  const loadByPlayer = useCallback(async (playerId: string) => {
    setLoading(true);
    const result = await getGamesByPlayer(playerId);
    setGames(result);
    setLoading(false);
  }, []);

  const loadByDate = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    const result = await getGamesByDate(from, to);
    setGames(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { games, loading, loadAll, loadByPlayer, loadByDate };
}
