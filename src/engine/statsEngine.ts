import { GameRecord, PlayerProfile, PlayerStats, defaultStats } from '../data/types';

export function calculateAverage(totalScored: number, totalDarts: number): number {
  if (totalDarts === 0) return 0;
  return Math.round((totalScored / (totalDarts / 3)) * 10) / 10;
}

export function updateStatsAfterGame(
  player: PlayerProfile,
  game: GameRecord
): PlayerProfile {
  if (!game.isComplete) return player;

  const isCricket = game.gameType === 'cricket';
  const isWinner = game.winnerId === player.id;
  const stats = { ...player.stats };

  stats.gamesPlayed += 1;

  if (isWinner) {
    stats.gamesWon += 1;
    stats.currentWinStreak += 1;
    if (stats.currentWinStreak > stats.longestWinStreak) {
      stats.longestWinStreak = stats.currentWinStreak;
    }
  } else {
    stats.currentWinStreak = 0;
  }

  if (isCricket) {
    stats.cricketGamesPlayed += 1;
    if (isWinner) stats.cricketGamesWon += 1;
    return { ...player, stats };
  }

  // X01 stats
  let dartsThisGame = 0;
  let scoredThisGame = 0;
  let checkoutAttempts = 0;
  let checkoutHit = false;

  for (const leg of game.legs) {
    const playerVisits = leg.visits.filter(v => v.playerId === player.id);
    const dartsThisLeg = playerVisits.reduce((s, v) => s + v.darts.length, 0);

    for (const visit of playerVisits) {
      const score = visit.totalScore;
      dartsThisGame += visit.darts.length;
      if (!visit.isBust) {
        scoredThisGame += score;
        if (score === 180) stats.oneEighties += 1;
        if (score >= 140) stats.hundredFortyPlus += 1;
        else if (score >= 100) stats.hundredPlus += 1;
      }
      if (visit.isBust) stats.busts += 1;
    }

    // Check if player won this leg (checkout attempt tracking)
    if (leg.winnerId !== null) {
      const lastVisit = playerVisits[playerVisits.length - 1];
      if (lastVisit && !lastVisit.isBust) {
        const remaining = lastVisit.remainingAfter;
        if (remaining === 0 && leg.winnerId === player.id) {
          checkoutHit = true;
          checkoutAttempts += 1;
          const checkout = lastVisit.totalScore;
          if (checkout > stats.highestCheckout) stats.highestCheckout = checkout;
          if (leg.checkoutDouble) {
            player = {
              ...player,
              preferredDoubles: {
                ...player.preferredDoubles,
                [leg.checkoutDouble]: (player.preferredDoubles[leg.checkoutDouble] ?? 0) + 1,
              },
            };
          }
        } else if (lastVisit.remainingAfter <= 170 && !lastVisit.isBust) {
          // Was in checkout range but didn't finish
          checkoutAttempts += 1;
        }
      }
    }

    if (leg.winnerId === player.id && dartsThisLeg > 0) {
      if (stats.bestLegDarts === 0 || dartsThisLeg < stats.bestLegDarts) {
        stats.bestLegDarts = dartsThisLeg;
      }
    }
  }

  stats.totalDartsThrown += dartsThisGame;
  stats.totalScored += scoredThisGame;
  stats.checkoutAttempts += checkoutAttempts;
  if (checkoutHit) stats.checkoutHits += 1;

  // Broken check: was this player firstPlayerThisGame but lost?
  if (game.legs.length > 0) {
    const firstPlayer = game.legs[0].startingPlayerId;
    if (firstPlayer === player.id && !isWinner) {
      stats.timesFirstAndBroke += 1;
    }
  }

  return { ...player, stats };
}

export function getCheckoutPercentage(stats: PlayerStats): number {
  if (stats.checkoutAttempts === 0) return 0;
  return Math.round((stats.checkoutHits / stats.checkoutAttempts) * 1000) / 10;
}

export function getWinPercentage(stats: PlayerStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 1000) / 10;
}

export function getAverageFromStats(stats: PlayerStats): number {
  return calculateAverage(stats.totalScored, stats.totalDartsThrown);
}

export function getTopDoubles(
  preferredDoubles: Record<number, number>,
  count = 3
): Array<{ double: number; hits: number }> {
  return Object.entries(preferredDoubles)
    .map(([d, hits]) => ({ double: Number(d), hits }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, count);
}

export function initPlayerProfile(name: string): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    stats: defaultStats(),
    preferredDoubles: {},
  };
}
