import React from 'react';
import { Button } from './Button';
import { Delete } from 'lucide-react';

interface NumericPadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onBust?: () => void;
  maxValue?: number;
  confirmLabel?: string;
  disabled?: boolean;
}

export function NumericPad({
  value,
  onChange,
  onConfirm,
  onBust,
  maxValue = 180,
  confirmLabel = 'Bevestig',
  disabled = false,
}: NumericPadProps) {
  const numVal = parseInt(value || '0', 10);
  const isValid = !isNaN(numVal) && numVal >= 0 && numVal <= maxValue;

  const handleDigit = (d: string) => {
    const next = value === '0' ? d : value + d;
    const n = parseInt(next, 10);
    if (n <= maxValue) onChange(next);
  };

  const handleDelete = () => {
    if (value.length <= 1) onChange('0');
    else onChange(value.slice(0, -1));
  };

  const keys = ['1','2','3','4','5','6','7','8','9','0'];

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
      {/* Display */}
      <div className="bg-surface2 rounded-2xl p-4 text-center">
        <span className="text-5xl font-bold tabular text-text-primary">{value || '0'}</span>
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map(k => (
          <button
            key={k}
            onPointerDown={() => handleDigit(k)}
            disabled={disabled}
            className="h-14 bg-surface2 rounded-xl text-2xl font-bold text-text-primary active:bg-inactive touch-manipulation select-none"
          >
            {k}
          </button>
        ))}
        <button
          onPointerDown={handleDelete}
          disabled={disabled}
          className="h-14 bg-surface2 rounded-xl flex items-center justify-center active:bg-inactive touch-manipulation"
        >
          <Delete className="text-text-secondary" size={22} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        {onBust && (
          <Button variant="danger" size="lg" className="flex-1" onPointerDown={onBust} disabled={disabled}>
            BUST
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onPointerDown={onConfirm}
          disabled={disabled || !isValid || numVal === 0}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
