import React from 'react';
import { CheckoutSuggestion } from '../../data/types';
import { formatRoute, isBogeyNumber } from '../../engine/checkoutEngine';
import { AlertTriangle, Star } from 'lucide-react';

interface CheckoutBarProps {
  score: number;
  suggestion: CheckoutSuggestion | null;
}

export function CheckoutBar({ score, suggestion }: CheckoutBarProps) {
  if (score > 170 || score <= 1) return null;

  if (isBogeyNumber(score)) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-warning/20 rounded-xl text-warning text-sm">
        <AlertTriangle size={16} />
        <span>Bogey-getal! Geen uitgooi mogelijk.</span>
      </div>
    );
  }

  if (!suggestion || suggestion.primaryRoute.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/30 rounded-xl">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">
            {formatRoute(suggestion.primaryRoute)}
          </span>
          {suggestion.isPreferred && (
            <Star size={14} className="text-warning fill-warning" />
          )}
        </div>
        {suggestion.alternatives.length > 0 && (
          <span className="text-text-secondary text-xs">
            Alt: {formatRoute(suggestion.alternatives[0])}
          </span>
        )}
      </div>
    </div>
  );
}
