import { useState } from 'react';
import { NumericPad } from '../ui/NumericPad';
import { useGameStore } from '../../store/gameStore';
import { isValidX01Score } from '../../engine/x01Logic';
import { DartThrow } from '../../data/types';
import { haptics } from '../../utils/haptics';

// Dubbels-pad: D1-D20 + Bull
const DOUBLES = [
  { label: 'D1',  seg: 1,  score: 2  }, { label: 'D2',  seg: 2,  score: 4  },
  { label: 'D3',  seg: 3,  score: 6  }, { label: 'D4',  seg: 4,  score: 8  },
  { label: 'D5',  seg: 5,  score: 10 }, { label: 'D6',  seg: 6,  score: 12 },
  { label: 'D7',  seg: 7,  score: 14 }, { label: 'D8',  seg: 8,  score: 16 },
  { label: 'D9',  seg: 9,  score: 18 }, { label: 'D10', seg: 10, score: 20 },
  { label: 'D11', seg: 11, score: 22 }, { label: 'D12', seg: 12, score: 24 },
  { label: 'D13', seg: 13, score: 26 }, { label: 'D14', seg: 14, score: 28 },
  { label: 'D15', seg: 15, score: 30 }, { label: 'D16', seg: 16, score: 32 },
  { label: 'D17', seg: 17, score: 34 }, { label: 'D18', seg: 18, score: 36 },
  { label: 'D19', seg: 19, score: 38 }, { label: 'D20', seg: 20, score: 40 },
  { label: 'Bull', seg: 50, score: 50 },
];

interface DoublePickerProps {
  remaining: number;
  title: string;
  onPick: (seg: number) => void;
  onCancel?: () => void;
}

function DoublePicker({ remaining, title, onPick, onCancel }: DoublePickerProps) {
  return (
    <div className="w-full">
      <p className="text-text-secondary text-sm text-center mb-3">{title}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {DOUBLES.filter(d => d.score <= remaining).map(d => (
          <button
            key={d.seg}
            onPointerDown={() => onPick(d.seg)}
            className={`h-11 rounded-xl text-sm font-bold touch-manipulation active:scale-95 transition-transform
              ${d.seg === 50 ? 'col-span-5 bg-accent/20 text-accent border border-accent/50' : 'bg-surface2 text-text-primary active:bg-accent active:text-black'}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {onCancel && (
        <button
          onPointerDown={onCancel}
          className="w-full mt-2 py-2 text-text-secondary text-sm touch-manipulation"
        >
          Annuleren
        </button>
      )}
    </div>
  );
}

function DartsCountPicker({ onPick, onCancel }: { onPick: (n: number) => void; onCancel: () => void }) {
  return (
    <div className="w-full">
      <p className="text-text-secondary text-sm text-center mb-3">Hoeveel pijlen gebruikt?</p>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onPointerDown={() => onPick(n)}
            className="h-16 rounded-xl text-2xl font-black bg-surface2 text-text-primary active:bg-accent active:text-black touch-manipulation active:scale-95 transition-transform"
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onPointerDown={onCancel}
        className="w-full mt-2 py-2 text-text-secondary text-sm touch-manipulation"
      >
        Annuleren
      </button>
    </div>
  );
}

type Step = 'none' | 'askDouble' | 'askDarts';

export function TotalScoreInput() {
  const [value, setValue] = useState('0');
  const [step, setStep] = useState<Step>('none');
  const [pendingScore, setPendingScore] = useState(0);
  const [pendingDouble, setPendingDouble] = useState<number | null>(null);

  const submitVisit = useGameStore(s => s.submitVisit);
  const bustCurrentVisit = useGameStore(s => s.bustCurrentVisit);
  const game = useGameStore(s => s.game);

  if (!game) return null;

  const currentPlayerId = game.playerIds[game.currentPlayerIndex];
  const remaining = game.scores[currentPlayerId];
  const numVal = parseInt(value || '0', 10);
  const isInCheckoutRange = remaining >= 2 && remaining <= 170;

  const doSubmit = (score: number, checkoutDouble: number | undefined, dartsCount: number) => {
    haptics.confirm();
    const dart: DartThrow = { segment: score, multiplier: checkoutDouble ? 2 : 1, score };
    submitVisit([dart], { dartsCount, checkoutDouble });
    setValue('0');
    setStep('none');
    setPendingDouble(null);
  };

  const handleConfirm = () => {
    const score = parseInt(value, 10);
    if (!score || score === 0) return;
    if (!isValidX01Score(score)) return;

    if (score > remaining) {
      // Automatische bust
      bustCurrentVisit();
      setValue('0');
      return;
    }

    if (score === remaining) {
      // Uitgooi — vraag welke dubbel
      setPendingScore(score);
      setStep('askDouble');
      return;
    }

    // Gewone beurt (altijd 3 pijlen in totaalmodus)
    doSubmit(score, undefined, 3);
  };

  const handleBust = () => {
    bustCurrentVisit();
    setValue('0');
    setStep('none');
    setPendingDouble(null);
  };

  const isInvalid = numVal > 0 && !isValidX01Score(numVal);

  // Stap 2: hoeveel pijlen?
  if (step === 'askDarts') {
    return (
      <div className="w-full flex flex-col items-center gap-4 px-2">
        <div className="bg-surface2 rounded-2xl px-6 py-3 text-center">
          <span className="text-4xl font-black text-accent tabular">{pendingScore}</span>
          <span className="text-text-secondary text-sm ml-2">uitgegooid</span>
        </div>
        <DartsCountPicker
          onPick={(n) => doSubmit(pendingScore, pendingDouble ?? undefined, n)}
          onCancel={() => { setStep('none'); setValue('0'); setPendingDouble(null); }}
        />
      </div>
    );
  }

  // Stap 1: op welke dubbel?
  if (step === 'askDouble') {
    return (
      <div className="w-full flex flex-col items-center gap-4 px-2">
        <div className="bg-surface2 rounded-2xl px-6 py-3 text-center">
          <span className="text-4xl font-black text-accent tabular">{pendingScore}</span>
          <span className="text-text-secondary text-sm ml-2">uitgoooien</span>
        </div>
        <DoublePicker
          remaining={remaining}
          title="Op welke dubbel uitgegooid?"
          onPick={(seg) => { setPendingDouble(seg); setStep('askDarts'); }}
          onCancel={() => { setStep('none'); setValue('0'); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {isInvalid && (
        <p className="text-warning text-sm text-center">Ongeldige score</p>
      )}

      <NumericPad
        value={value}
        onChange={setValue}
        onConfirm={handleConfirm}
        onBust={handleBust}
        maxValue={180}
        confirmLabel={numVal === remaining && isInCheckoutRange ? 'Uitgoooien ✓' : 'Bevestig'}
      />

      {/* Dubbels-pad — altijd zichtbaar in checkout-bereik */}
      {isInCheckoutRange && (
        <div className="w-full max-w-xs">
          <p className="text-text-secondary text-xs text-center mb-2 uppercase tracking-wider">
            Direct uitgoooien op dubbel
          </p>
          <DoublePicker
            remaining={remaining}
            title=""
            onPick={(seg) => {
              const dScore = seg === 50 ? 50 : seg * 2;
              setPendingScore(dScore);
              setPendingDouble(seg);
              setStep('askDarts');
            }}
          />
        </div>
      )}
    </div>
  );
}
