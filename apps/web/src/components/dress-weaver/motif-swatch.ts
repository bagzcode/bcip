/** Deterministic demo motif fill colors — fictional display only. */
export function motifFill(publicCode: string): { fill: string; stroke: string; pattern: 'lattice' | 'wave' | 'dots' } {
  if (publicCode.includes('MOTIF-B')) {
    return { fill: 'rgba(30, 58, 95, 0.35)', stroke: '#1e3a5f', pattern: 'wave' };
  }
  if (publicCode.includes('MOTIF-R')) {
    return { fill: 'rgba(15, 118, 110, 0.3)', stroke: '#0f766e', pattern: 'dots' };
  }
  return { fill: 'rgba(139, 69, 19, 0.3)', stroke: '#8b4513', pattern: 'lattice' };
}
