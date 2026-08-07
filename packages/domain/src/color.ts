import type { AnalysisMode } from '@bcip/contracts';
import { DEMO_FICTIONAL_LABEL } from './access';

export const COLOR_PIPELINE_NAME = 'bcip-color-pipeline';
export const COLOR_PIPELINE_VERSION = '0.2.0';

export const EXPLORATORY_WARNING =
  'EXPLORATORY: ordinary photograph / uncalibrated capture — not a calibrated scientific measurement.';

export const CALIBRATED_LABEL =
  'CALIBRATED: analysis used an explicit calibration target/profile. Still not a cultural claim.';

export type Lab = readonly [number, number, number];

export type PaletteColorView = {
  rank: number;
  proportion: number;
  displayHex: string;
  lab: Lab;
  lch: Lab;
  hsv: Lab;
  rgb: readonly [number, number, number];
};

export type ColorAnalysisView = {
  publicCode: string;
  title: string;
  analysisMode: AnalysisMode;
  isCalibrated: boolean;
  algorithmName: string;
  algorithmVersion: string;
  parameters: Record<string, unknown>;
  dependencyVersions: Record<string, string>;
  qualityWarnings: string[];
  labelNote: string;
  isDemoFictional: boolean;
  resultChecksum: string | null;
  features: {
    meanLightness: number;
    meanChroma: number;
    colorEntropy: number;
    warmCoolRatio: number;
    hueDistribution: Record<string, number>;
  } | null;
  palette: PaletteColorView[];
};

/** UI / export mode label — never silent about calibration absence. */
export function analysisModeLabel(mode: AnalysisMode, isCalibrated: boolean): string {
  if (mode === 'calibrated' && isCalibrated) return CALIBRATED_LABEL;
  if (mode === 'calibrated' && !isCalibrated) {
    return 'CALIBRATED MODE REQUESTED but calibration metadata missing — treated as exploratory.';
  }
  return EXPLORATORY_WARNING;
}

export function assertCalibratedRequiresTarget(input: {
  analysisMode: AnalysisMode;
  calibration: { target_id?: string } | null | undefined;
}): { isCalibrated: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (input.analysisMode === 'exploratory') {
    warnings.push(EXPLORATORY_WARNING);
    return { isCalibrated: false, warnings };
  }
  if (!input.calibration?.target_id) {
    warnings.push(
      'Calibration target/profile absent — result is NOT marked calibrated scientific data.',
    );
    warnings.push(EXPLORATORY_WARNING);
    return { isCalibrated: false, warnings };
  }
  return { isCalibrated: true, warnings: [CALIBRATED_LABEL] };
}

export function assertDemoAnalysisLabel(labelNote: string, isDemoFictional: boolean): void {
  if (isDemoFictional && !labelNote.includes(DEMO_FICTIONAL_LABEL)) {
    throw new Error(`Demo analysis must include label: ${DEMO_FICTIONAL_LABEL}`);
  }
}

/** CIEDE2000 ΔE (Sharma et al.) for Lab triples. */
export function ciede2000(lab1: Lab, lab2: Lab): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cab = (C1 + C2) / 2;
  const Cab7 = Cab ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const h1p = hueAngle(a1p, b1);
  const h2p = hueAngle(a2p, b2);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = h2p - h1p;
  if (C1p * C2p === 0) dhp = 0;
  else if (dhp > 180) dhp -= 360;
  else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deg2rad(dhp / 2));

  const Lbar = (L1 + L2) / 2;
  const Cpbar = (C1p + C2p) / 2;
  let hbar = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbar += h1p + h2p < 360 ? 360 : -360;
    hbar /= 2;
  }

  const T =
    1 -
    0.17 * Math.cos(deg2rad(hbar - 30)) +
    0.24 * Math.cos(deg2rad(2 * hbar)) +
    0.32 * Math.cos(deg2rad(3 * hbar + 6)) -
    0.2 * Math.cos(deg2rad(4 * hbar - 63));

  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpbar ** 7 / (Cpbar ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const Sc = 1 + 0.045 * Cpbar;
  const Sh = 1 + 0.015 * Cpbar * T;
  const Rt = -Math.sin(deg2rad(2 * dTheta)) * Rc;

  return Math.sqrt(
    (dLp / (kL * Sl)) ** 2 +
      (dCp / (kC * Sc)) ** 2 +
      (dHp / (kH * Sh)) ** 2 +
      Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)),
  );
}

function hueAngle(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  let h = rad2deg(Math.atan2(b, a));
  if (h < 0) h += 360;
  return h;
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function rad2deg(r: number): number {
  return (r * 180) / Math.PI;
}

export function comparePaletteCiede2000(
  a: PaletteColorView[],
  b: PaletteColorView[],
): { mean: number; max: number; pairs: number } {
  const n = Math.min(a.length, b.length);
  if (n === 0) return { mean: 0, max: 0, pairs: 0 };
  const sortedA = [...a].sort((x, y) => x.rank - y.rank);
  const sortedB = [...b].sort((x, y) => x.rank - y.rank);
  let sum = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const d = ciede2000(sortedA[i]!.lab, sortedB[i]!.lab);
    sum += d;
    if (d > max) max = d;
  }
  return { mean: sum / n, max, pairs: n };
}

export function exportAnalysisJson(view: ColorAnalysisView): string {
  assertDemoAnalysisLabel(view.labelNote, view.isDemoFictional);
  return `${JSON.stringify(
    {
      publicCode: view.publicCode,
      title: view.title,
      analysisMode: view.analysisMode,
      isCalibrated: view.isCalibrated,
      modeLabel: analysisModeLabel(view.analysisMode, view.isCalibrated),
      algorithm: { name: view.algorithmName, version: view.algorithmVersion },
      parameters: view.parameters,
      dependencyVersions: view.dependencyVersions,
      qualityWarnings: view.qualityWarnings,
      labelNote: view.labelNote,
      isDemoFictional: view.isDemoFictional,
      resultChecksum: view.resultChecksum,
      features: view.features,
      palette: view.palette,
      note: 'Numeric color features only. No cultural meanings or recommendations.',
    },
    null,
    2,
  )}\n`;
}

export function exportAnalysisCsv(view: ColorAnalysisView): string {
  assertDemoAnalysisLabel(view.labelNote, view.isDemoFictional);
  const header = [
    'public_code',
    'analysis_mode',
    'is_calibrated',
    'algorithm_version',
    'rank',
    'proportion',
    'hex',
    'lab_l',
    'lab_a',
    'lab_b',
    'label_note',
  ].join(',');
  const rows = view.palette.map((c) =>
    [
      csvEscape(view.publicCode),
      view.analysisMode,
      String(view.isCalibrated),
      csvEscape(view.algorithmVersion),
      String(c.rank),
      String(c.proportion),
      c.displayHex,
      String(c.lab[0]),
      String(c.lab[1]),
      String(c.lab[2]),
      csvEscape(view.labelNote),
    ].join(','),
  );
  return `${header}\n${rows.join('\n')}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function roundColor(n: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
