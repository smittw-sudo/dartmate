import { useAppStore } from '../store/appStore';

export function usePlayers() {
  const players = useAppStore(s => s.players);
  const addPlayer = useAppStore(s => s.addPlayer);
  const updatePlayer = useAppStore(s => s.updatePlayer);
  const getPlayerById = useAppStore(s => s.getPlayerById);

  return { players, addPlayer, updatePlayer, getPlayerById };
}
