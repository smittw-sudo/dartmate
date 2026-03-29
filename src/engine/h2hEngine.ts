import { GameRecord } from '../data/types';
import { calculateAverage } from './statsEngine';

export interface StandingsRow {
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number; // geen winnaar
  winPct: number;
  average: number;
}

export interface H2HRecord {
  player1Id: string;
  player2Id: string;
  gamesPlayed: number;
  player1Wins: number;
  player2Wins: number;
  player1Avg: number;
  player2Avg: number;
  player1BestLeg: number; // minste pijlen in een gewonnen leg
  player2BestLeg: number;
  lastPlayed: string;
}

function statsFromGames(games: GameRecord[], playerId: string) {
  let darts = 0;
  let scored = 0;
  for (const game of games) {
    for (const leg of game.legs) {
      for (const visit of leg.visits) {
        if (visit.playerId !== playerId) continue;
        darts += visit.dartsCount ?? visit.darts.length;
        if (!visit.isBust) scored += visit.totalScore;
      }
    }
  }
  return { darts, scored };
}

function bestLeg(games: GameRecord[], playerId: string): number {
  let best = 0;
  for (const game of games) {
    for (const leg of game.legs) {
      if (leg.winnerId !== playerId) continue;
      const myDarts = leg.visits
        .filter(v => v.playerId === playerId)
        .reduce((s, v) => s + (v.dartsCount ?? v.darts.length), 0);
      if (myDarts > 0 && (best === 0 || myDarts < best)) best = myDarts;
    }
  }
  return best;
}

/** Ranglijst over alle X01-potjes voor de gegeven spelers-IDs.
 *  Solo-potjes (1 speler) tellen NIET mee voor W/V/rangschikking,
 *  maar wel voor het gemiddelde. */
export function getStandings(
  games: GameRecord[],
  playerIds: string[],
): StandingsRow[] {
  const x01 = games.filter(g => g.gameType !== 'cricket' && g.isComplete);

  return playerIds
    .map(pid => {
      const allPg  = x01.filter(g => g.playerIds.includes(pid));
      // Alleen potjes met 2+ spelers tellen mee voor de ranglijst
      const multiPg = allPg.filter(g => g.playerIds.length >= 2);
      const wins   = multiPg.filter(g => g.winnerId === pid).length;
      const draws  = multiPg.filter(g => g.winnerId === null).length;
      const losses = multiPg.length - wins - draws;
      // Gemiddelde berekend over álle potjes (ook solo)
      const { darts, scored } = statsFromGames(allPg, pid);
      return {
        playerId: pid,
        gamesPlayed: multiPg.length,
        wins,
        losses,
        draws,
        winPct: multiPg.length > 0 ? Math.round((wins / multiPg.length) * 1000) / 10 : 0,
        average: calculateAverage(scored, darts),
      };
    })
    .filter(r => r.gamesPlayed > 0)
    .sort((a, b) =>
      b.wins - a.wins ||
      b.winPct - a.winPct ||
      b.average - a.average,
    );
}

/** Alle unieke 1-op-1 matchups uit de spellenlijst */
export function getH2HRecords(
  games: GameRecord[],
  playerIds: string[],
): H2HRecord[] {
  const x01 = games.filter(g => g.gameType !== 'cricket' && g.isComplete);
  const records: H2HRecord[] = [];

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const p1 = playerIds[i];
      const p2 = playerIds[j];
      const h2h = x01.filter(g => g.playerIds.includes(p1) && g.playerIds.includes(p2));
      if (h2h.length === 0) continue;

      const p1w = h2h.filter(g => g.winnerId === p1).length;
      const p2w = h2h.filter(g => g.winnerId === p2).length;
      const s1 = statsFromGames(h2h, p1);
      const s2 = statsFromGames(h2h, p2);
      const sorted = [...h2h].sort((a, b) => b.date.localeCompare(a.date));

      records.push({
        player1Id: p1,
        player2Id: p2,
        gamesPlayed: h2h.length,
        player1Wins: p1w,
        player2Wins: p2w,
        player1Avg: calculateAverage(s1.scored, s1.darts),
        player2Avg: calculateAverage(s2.scored, s2.darts),
        player1BestLeg: bestLeg(h2h, p1),
        player2BestLeg: bestLeg(h2h, p2),
        lastPlayed: sorted[0]?.date ?? '',
      });
    }
  }

  // Sorteer: meest gespeeld bovenaan
  return records.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}
