import { useGameStore } from '../store/gameStore';
import { useAppStore } from '../store/appStore';
import { getCheckoutSuggestion, isCheckoutPossible } from '../engine/checkoutEngine';
import { CheckoutSuggestion } from '../data/types';

export function useGame() {
  const game = useGameStore(s => s.game);
  const players = useAppStore(s => s.players);

  const currentPlayerId = game ? game.playerIds[game.currentPlayerIndex] : null;
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : null;

  const currentScore = currentPlayerId && game ? game.scores[currentPlayerId] : 0;

  let checkoutSuggestion: CheckoutSuggestion | null = null;
  if (game && currentPlayerId && game.gameType !== 'cricket') {
    const preferredDoubles = currentPlayer?.preferredDoubles ?? {};
    if (isCheckoutPossible(currentScore)) {
      checkoutSuggestion = getCheckoutSuggestion(
        currentScore,
        game.currentVisitDarts,
        preferredDoubles
      );
    }
  }

  return {
    game,
    currentPlayer,
    currentPlayerId,
    currentScore,
    checkoutSuggestion,
    isCheckoutPossible: isCheckoutPossible(currentScore),
    dartsInHand: game?.currentVisitDarts ?? [],
  };
}
