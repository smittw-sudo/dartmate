import { useState, useEffect, useCallback } from 'react';
import { GameRecord } from '../data/types';
import { fetchGames } from '../lib/supabase';

export function useHistory() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const result = await fetchGames().catch(() => [] as GameRecord[]);
    setGames(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { games, loading, loadAll };
}
