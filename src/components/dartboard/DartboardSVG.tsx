import React, { useState } from 'react';
import { DartThrow } from '../../data/types';

// Segment order on a dartboard (clockwise from top)
const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

// Board dimensions (in SVG units)
const CX = 200;
const CY = 200;
const R_BULL = 12;        // Bullseye (50)
const R_OUTER_BULL = 28;  // Outer bull (25)
const R_TRIPLE_INNER = 96;
const R_TRIPLE_OUTER = 112;
const R_DOUBLE_INNER = 158;
const R_DOUBLE_OUTER = 174;
const R_WIRE = 180;

// Alternating colors
const SINGLE_COLORS = ['#1a1a1a', '#f5f0e0']; // black, cream
const DOUBLE_TRIPLE_COLORS = ['#c8102e', '#00863c']; // red, green

interface HitSegment {
  segment: number;
  multiplier: number;
}

interface DartboardSVGProps {
  onDartThrown: (dart: DartThrow) => void;
  lastHit?: HitSegment | null;
  disabled?: boolean;
  dartsThrown?: number; // 0-3
}

function segmentPath(
  cx: number, cy: number,
  r1: number, r2: number,
  startAngle: number, endAngle: number
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r1 * Math.sin(toRad(startAngle));
  const y1 = cy - r1 * Math.cos(toRad(startAngle));
  const x2 = cx + r2 * Math.sin(toRad(startAngle));
  const y2 = cy - r2 * Math.cos(toRad(startAngle));
  const x3 = cx + r2 * Math.sin(toRad(endAngle));
  const y3 = cy - r2 * Math.cos(toRad(endAngle));
  const x4 = cx + r1 * Math.sin(toRad(endAngle));
  const y4 = cy - r1 * Math.cos(toRad(endAngle));
  return `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
}

function labelPos(cx: number, cy: number, r: number, angle: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(toRad(angle)),
    y: cy - r * Math.cos(toRad(angle)),
  };
}

export function DartboardSVG({ onDartThrown, lastHit, disabled, dartsThrown = 0 }: DartboardSVGProps) {
  const [pressed, setPressed] = useState<string | null>(null);

  const segmentAngle = 360 / 20;
  const halfAngle = segmentAngle / 2;

  function handleHit(segment: number, multiplier: number) {
    if (disabled) return;
    const score = segment * multiplier;
    const key = `${segment}-${multiplier}`;
    setPressed(key);
    setTimeout(() => setPressed(null), 200);
    onDartThrown({ segment, multiplier, score });
  }

  function isHighlighted(segment: number, multiplier: number) {
    if (!lastHit) return false;
    return lastHit.segment === segment && lastHit.multiplier === multiplier;
  }

  const segments = SEGMENT_ORDER.map((num, idx) => {
    const midAngle = idx * segmentAngle;
    const startAngle = midAngle - halfAngle;
    const endAngle = midAngle + halfAngle;
    const colorIdx = idx % 2;

    return { num, idx, midAngle, startAngle, endAngle, colorIdx };
  });

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto select-none">
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{ touchAction: 'none' }}
      >
        {/* Background */}
        <circle cx={CX} cy={CY} r={R_WIRE + 10} fill="#0a0a0a" />

        {segments.map(({ num, idx, startAngle, endAngle, colorIdx }) => {
          const sColor = SINGLE_COLORS[colorIdx];
          const dtColor = DOUBLE_TRIPLE_COLORS[colorIdx];

          const singleKey = `${num}-1`;
          const tripleKey = `${num}-3`;
          const doubleKey = `${num}-2`;

          return (
            <g key={num}>
              {/* Single (outer) */}
              <path
                d={segmentPath(CX, CY, R_TRIPLE_OUTER, R_DOUBLE_INNER, startAngle, endAngle)}
                fill={isHighlighted(num, 1) || pressed === singleKey ? '#00C853' : sColor}
                stroke="#333"
                strokeWidth="0.5"
                onPointerDown={() => handleHit(num, 1)}
                style={{ cursor: 'pointer' }}
              />
              {/* Triple ring */}
              <path
                d={segmentPath(CX, CY, R_TRIPLE_INNER, R_TRIPLE_OUTER, startAngle, endAngle)}
                fill={isHighlighted(num, 3) || pressed === tripleKey ? '#00C853' : dtColor}
                stroke="#333"
                strokeWidth="0.5"
                onPointerDown={() => handleHit(num, 3)}
                style={{ cursor: 'pointer' }}
              />
              {/* Single (inner) */}
              <path
                d={segmentPath(CX, CY, R_OUTER_BULL, R_TRIPLE_INNER, startAngle, endAngle)}
                fill={isHighlighted(num, 1) || pressed === singleKey ? '#00C853' : sColor}
                stroke="#333"
                strokeWidth="0.5"
                onPointerDown={() => handleHit(num, 1)}
                style={{ cursor: 'pointer' }}
              />
              {/* Double ring */}
              <path
                d={segmentPath(CX, CY, R_DOUBLE_INNER, R_DOUBLE_OUTER, startAngle, endAngle)}
                fill={isHighlighted(num, 2) || pressed === doubleKey ? '#00C853' : dtColor}
                stroke="#333"
                strokeWidth="0.5"
                onPointerDown={() => handleHit(num, 2)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        {/* Outer bull (25) */}
        <circle
          cx={CX} cy={CY} r={R_OUTER_BULL}
          fill={isHighlighted(25, 1) || pressed === '25-1' ? '#00C853' : '#00863c'}
          stroke="#333" strokeWidth="1"
          onPointerDown={() => handleHit(25, 1)}
          style={{ cursor: 'pointer' }}
        />

        {/* Bullseye (50) */}
        <circle
          cx={CX} cy={CY} r={R_BULL}
          fill={isHighlighted(50, 1) || pressed === '50-1' ? '#00C853' : '#c8102e'}
          stroke="#333" strokeWidth="1"
          onPointerDown={() => handleHit(50, 1)}
          style={{ cursor: 'pointer' }}
        />

        {/* Number labels */}
        {segments.map(({ num, midAngle }) => {
          const pos = labelPos(CX, CY, R_DOUBLE_OUTER + 12, midAngle);
          return (
            <text
              key={`label-${num}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
              pointerEvents="none"
            >
              {num}
            </text>
          );
        })}

        {/* Bull labels */}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="8" fontWeight="bold" pointerEvents="none">
          50
        </text>
      </svg>

      {/* Darts indicator */}
      <div className="absolute top-2 right-2 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i < dartsThrown ? 'bg-accent' : 'bg-surface2'}`}
          />
        ))}
      </div>
    </div>
  );
}
