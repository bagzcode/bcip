/** Deterministic CSS fabric/sketch/linen placeholders (no binary assets). */

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
  const h = hashSeed(seed);
  const angle = h % 180;

  let background: string;
  if (variant === 'sketch') {
    background = `
      repeating-linear-gradient(${angle}deg, #1c1917 0 1px, transparent 1px 10px),
      repeating-linear-gradient(${angle + 90}deg, rgba(28,25,23,0.35) 0 1px, transparent 1px 14px),
      #f7f3ec
    `;
  } else if (variant === 'linen') {
    background = `
      repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px),
      linear-gradient(135deg, ${palette[2] ?? '#e8d5b7'}, ${palette[1] ?? '#c4a35a'})
    `;
  } else if (variant === 'portrait') {
    background = `
      radial-gradient(circle at 35% 30%, ${palette[2] ?? '#f7f3ec'} 0 18%, transparent 42%),
      linear-gradient(160deg, ${palette[0] ?? '#1e3a5f'}, ${palette[1] ?? '#8b4513'})
    `;
  } else {
    background = `
      repeating-linear-gradient(${angle}deg, ${palette[0]} 0 8px, ${palette[1]} 8px 16px),
      radial-gradient(circle at 70% 30%, ${palette[2]} 0 20%, transparent 45%)
    `;
  }

  return (
    <div
      className={`me-visual me-visual--${variant} ${className}`.trim()}
      style={{ background }}
      role="img"
      aria-label={label ?? `${variant} placeholder for ${seed}`}
    />
  );
}
