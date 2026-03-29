import { DartThrow, DartTarget, CheckoutSuggestion, BOGEY_NUMBERS } from '../data/types';
import { checkoutTable } from '../data/checkoutTable';

export function isBogeyNumber(score: number): boolean {
  return BOGEY_NUMBERS.has(score);
}

export function getRemainingAfterDart(
  current: number,
  dart: DartThrow
): number | 'bust' {
  const newScore = current - dart.score;
  if (newScore < 0) return 'bust';
  if (newScore === 1) return 'bust'; // can't finish on 1
  if (newScore === 0) {
    // Must finish on double or bullseye
    if (dart.multiplier === 2) return 0;
    if (dart.segment === 50 && dart.multiplier === 1) return 0; // Bull
    return 'bust';
  }
  return newScore;
}

function getDoubleFromRoute(route: DartTarget[]): number | null {
  const last = route[route.length - 1];
  if (!last) return null;
  if (last.multiplier === 2) return last.segment;
  if (last.segment === 50) return 50; // bullseye as double
  return null;
}

export function getCheckoutSuggestion(
  score: number,
  dartsThrown: DartThrow[],
  preferredDoubles: Record<number, number>
): CheckoutSuggestion {
  if (isBogeyNumber(score)) {
    return {
      score,
      primaryRoute: [],
      alternatives: [],
      isBogey: true,
      isPreferred: false,
    };
  }

  // Adjust score for darts already thrown this visit
  let remaining = score;
  for (const dart of dartsThrown) {
    const res = getRemainingAfterDart(remaining, dart);
    if (res === 'bust') {
      return {
        score,
        primaryRoute: [],
        alternatives: [],
        isBogey: false,
        isPreferred: false,
      };
    }
    remaining = res;
  }

  const dartsLeft = 3 - dartsThrown.length;
  if (dartsLeft <= 0 || remaining <= 0) {
    return {
      score,
      primaryRoute: [],
      alternatives: [],
      isBogey: false,
      isPreferred: false,
    };
  }

  // Find routes that fit within dartsLeft
  const routes = checkoutTable[remaining];
  if (!routes || routes.length === 0) {
    return {
      score,
      primaryRoute: [],
      alternatives: [],
      isBogey: isBogeyNumber(remaining),
      isPreferred: false,
    };
  }

  const validRoutes = routes.filter(r => r.length <= dartsLeft);
  if (validRoutes.length === 0) {
    // Show setup suggestion: best route would need more darts
    const fullRoutes = routes.filter(r => r.length <= 3);
    return {
      score,
      primaryRoute: fullRoutes[0] ?? routes[0],
      alternatives: [],
      isBogey: false,
      setupSuggestion: remaining <= 170 && !isBogeyNumber(remaining)
        ? `Zet op ${remaining}`
        : undefined,
      isPreferred: false,
    };
  }

  // Sort routes by preferred doubles
  const totalPreferred = Object.values(preferredDoubles).reduce((s, v) => s + v, 0);
  const sorted = [...validRoutes].sort((a, b) => {
    const da = getDoubleFromRoute(a);
    const db = getDoubleFromRoute(b);
    const pa = da ? (preferredDoubles[da] ?? 0) : 0;
    const pb = db ? (preferredDoubles[db] ?? 0) : 0;
    return pb - pa;
  });

  const primary = sorted[0];
  const alternatives = sorted.slice(1);

  // Check if preferred (>30% of checkouts)
  const primaryDouble = getDoubleFromRoute(primary);
  const preferredCount = primaryDouble ? (preferredDoubles[primaryDouble] ?? 0) : 0;
  const isPreferred = totalPreferred > 0 && preferredCount / totalPreferred > 0.3;

  return {
    score,
    primaryRoute: primary,
    alternatives,
    isBogey: false,
    isPreferred,
  };
}

export function formatRoute(route: DartTarget[]): string {
  return route.map(d => d.label).join(' → ');
}

export function isCheckoutPossible(score: number): boolean {
  if (score < 2 || score > 170) return false;
  if (isBogeyNumber(score)) return false;
  return !!checkoutTable[score];
}
