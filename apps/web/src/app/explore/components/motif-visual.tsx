/** Deterministic batik-style fabric/sketch/linen thumbnails (SVG; no binary assets). */

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function paletteFromSeed(seed: string, colors?: string[]): string[] {
  if (colors && colors.length >= 2) return colors;
  const h = hashSeed(seed);
  const a = `hsl(${h % 360} 35% 28%)`;
  const b = `hsl(${(h + 40) % 360} 42% 48%)`;
  const c = `hsl(${(h + 90) % 360} 28% 72%)`;
  return [a, b, c];
}

type Variant = 'fabric' | 'sketch' | 'linen' | 'portrait';
type PatternKind = 'floral' | 'parang' | 'cloud' | 'kawung' | 'lattice';

function patternKind(seed: string): PatternKind {
  const s = seed.toLowerCase();
  if (s.includes('sekar') || s.includes('flora') || s.includes('bloom')) return 'floral';
  if (s.includes('parang')) return 'parang';
  if (s.includes('mega') || s.includes('cloud')) return 'cloud';
  if (s.includes('kawung')) return 'kawung';
  const kinds: PatternKind[] = ['floral', 'parang', 'cloud', 'kawung', 'lattice'];
  return kinds[hashSeed(seed) % kinds.length]!;
}

function FabricPattern({
  kind,
  c0,
  c1,
  c2,
  sketch,
}: {
  kind: PatternKind;
  c0: string;
  c1: string;
  c2: string;
  sketch: boolean;
}) {
  const stroke = sketch ? '#1c1917' : c2;
  const fillA = sketch ? 'transparent' : c0;
  const fillB = sketch ? 'transparent' : c1;

  if (kind === 'parang') {
    return (
      <g>
        <rect width="120" height="120" fill={sketch ? '#f7f3ec' : c0} />
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M ${-20 + i * 22} 120 L ${40 + i * 22} 0`}
            stroke={i % 2 === 0 ? stroke : c1}
            strokeWidth={sketch ? 1.2 : 10}
            fill="none"
            opacity={sketch ? 0.7 : 0.95}
          />
        ))}
        {!sketch
          ? Array.from({ length: 6 }, (_, i) => (
              <ellipse
                key={`d-${i}`}
                cx={15 + i * 20}
                cy={20 + ((i * 17) % 90)}
                rx="3"
                ry="7"
                fill={c2}
                opacity="0.55"
                transform={`rotate(-35 ${15 + i * 20} ${20 + ((i * 17) % 90)})`}
              />
            ))
          : null}
      </g>
    );
  }

  if (kind === 'cloud') {
    return (
      <g>
        <rect width="120" height="120" fill={sketch ? '#f7f3ec' : c0} />
        {[20, 50, 80].map((y, row) =>
          [10, 40, 70, 100].map((x, col) => (
            <path
              key={`${row}-${col}`}
              d={`M ${x - 18} ${y} q 18 -${14 + (col % 2) * 4} 36 0 q -8 10 -18 10 q -10 0 -18 -10 z`}
              fill={sketch ? 'none' : col % 2 === 0 ? c1 : c2}
              stroke={stroke}
              strokeWidth={sketch ? 1.1 : 0.6}
              opacity={sketch ? 0.75 : 0.9}
            />
          )),
        )}
      </g>
    );
  }

  if (kind === 'kawung') {
    const cells = [
      [30, 30],
      [90, 30],
      [30, 90],
      [90, 90],
      [60, 60],
    ] as const;
    return (
      <g>
        <rect width="120" height="120" fill={sketch ? '#f7f3ec' : c0} />
        {cells.map(([cx, cy], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="22"
              fill={sketch ? 'none' : i % 2 === 0 ? c1 : c2}
              stroke={stroke}
              strokeWidth={sketch ? 1.2 : 1}
              opacity={0.92}
            />
            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill={sketch ? 'none' : c0}
              stroke={stroke}
              strokeWidth={sketch ? 1 : 0.8}
            />
          </g>
        ))}
      </g>
    );
  }

  if (kind === 'floral') {
    return (
      <g>
        <rect width="120" height="120" fill={sketch ? '#f7f3ec' : fillA} />
        {!sketch ? <rect width="120" height="120" fill={fillB} opacity="0.25" /> : null}
        {[
          [30, 28],
          [90, 34],
          [24, 88],
          [92, 86],
          [60, 58],
        ].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            {Array.from({ length: 6 }, (_, p) => (
              <ellipse
                key={p}
                cx="0"
                cy="-10"
                rx="5"
                ry="11"
                fill={sketch ? 'none' : i === 4 ? c2 : c1}
                stroke={stroke}
                strokeWidth={sketch ? 1.1 : 0.7}
                transform={`rotate(${p * 60})`}
                opacity={0.95}
              />
            ))}
            <circle cx="0" cy="0" r="4" fill={sketch ? 'none' : c2} stroke={stroke} strokeWidth="1" />
          </g>
        ))}
        {!sketch
          ? Array.from({ length: 12 }, (_, i) => (
              <circle
                key={`dot-${i}`}
                cx={8 + (i % 6) * 20}
                cy={12 + Math.floor(i / 6) * 96}
                r="1.6"
                fill={c2}
                opacity="0.5"
              />
            ))
          : null}
      </g>
    );
  }

  return (
    <g>
      <rect width="120" height="120" fill={sketch ? '#f7f3ec' : c0} />
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={10 + i * 16}
          y1="0"
          x2={10 + i * 16}
          y2="120"
          stroke={stroke}
          strokeWidth={sketch ? 1 : 2.5}
          opacity={0.55}
        />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          y1={10 + i * 16}
          x2="120"
          y2={10 + i * 16}
          stroke={c1}
          strokeWidth={sketch ? 1 : 2.5}
          opacity={0.55}
        />
      ))}
      {[
        [28, 28],
        [60, 44],
        [92, 28],
        [44, 76],
        [76, 92],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="6"
          fill={sketch ? 'none' : c2}
          stroke={stroke}
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

export function MotifVisual({
  seed,
  colors,
  variant = 'fabric',
  label,
  className = '',
}: {
  seed: string;
  colors?: string[];
  variant?: Variant;
  label?: string;
  className?: string;
}) {
  const palette = paletteFromSeed(seed, colors);
  const c0 = palette[0] ?? '#1e3a5f';
  const c1 = palette[1] ?? '#c4a35a';
  const c2 = palette[2] ?? '#8b4513';
  const kind = patternKind(seed);
  const h = hashSeed(seed);
  const aria = label ?? `${variant} preview for ${seed}`;

  if (variant === 'portrait') {
    return (
      <div className={`me-visual me-visual--portrait ${className}`.trim()} role="img" aria-label={aria}>
        <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id={`p-${h}`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor={c2} />
              <stop offset="55%" stopColor={c1} />
              <stop offset="100%" stopColor={c0} />
            </radialGradient>
          </defs>
          <rect width="120" height="120" fill={`url(#p-${h})`} />
          <circle cx="60" cy="42" r="18" fill={c2} opacity="0.85" />
          <ellipse cx="60" cy="88" rx="32" ry="22" fill={c0} opacity="0.9" />
        </svg>
      </div>
    );
  }

  if (variant === 'linen') {
    return (
      <div className={`me-visual me-visual--linen ${className}`.trim()} role="img" aria-label={aria}>
        <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="120" height="120" fill={c2} />
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={`w-${i}`}
              x1="0"
              y1={i * 5}
              x2="120"
              y2={i * 5}
              stroke={c1}
              strokeWidth="1"
              opacity="0.35"
            />
          ))}
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={`weft-${i}`}
              x1={i * 5}
              y1="0"
              x2={i * 5}
              y2="120"
              stroke={c0}
              strokeWidth="1"
              opacity="0.28"
            />
          ))}
          <rect x="18" y="18" width="84" height="84" fill="none" stroke={c0} strokeWidth="2" opacity="0.35" />
        </svg>
      </div>
    );
  }

  const sketch = variant === 'sketch';

  return (
    <div
      className={`me-visual me-visual--${variant} me-visual--${kind} ${className}`.trim()}
      role="img"
      aria-label={aria}
    >
      <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <FabricPattern kind={kind} c0={c0} c1={c1} c2={c2} sketch={sketch} />
      </svg>
    </div>
  );
}
