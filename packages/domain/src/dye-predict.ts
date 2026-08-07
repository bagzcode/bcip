import { DEMO_FICTIONAL_LABEL } from './access';
import { EXPLORATORY_WARNING } from './color';

/** Exploratory dye-process preview — never calibrated scientific measurement. */
export const DYE_PREDICT_PIPELINE_NAME = 'bcip-dye-predict-exploratory';
export const DYE_PREDICT_PIPELINE_VERSION = '0.1.0';

export const DYE_PREDICT_MODE_LABEL = EXPLORATORY_WARNING;

export const DYE_PREDICT_EDUCATION_SCOPE =
  `${DEMO_FICTIONAL_LABEL}. Educational process overview only — not Lasem-specific research claims or calibrated lab data.`;

export type Rgb = { r: number; g: number; b: number };

export type DyeFabricId = 'cotton' | 'silk' | 'linen' | 'rayon';

export type DyePredictInput = {
  primaryColor: string;
  secondaryColor: string;
  fabric: DyeFabricId;
  /** 10–100 */
  concentration: number;
  /** 20–100 °C */
  temperature: number;
  /** 5–120 minutes */
  time: number;
};

export type DyeFabricOption = {
  id: DyeFabricId;
  /** Influence factor used in the exploratory blend (matches reference app prediction). */
  factor: number;
  /** UI display factor from reference fabric cards (informational). */
  displayFactor: number;
};

/** Prediction fabric multipliers from the reference Batik Dye Color Prediction Tool. */
export const DYE_FABRIC_OPTIONS: readonly DyeFabricOption[] = [
  { id: 'cotton', factor: 1, displayFactor: 1 },
  { id: 'silk', factor: 1.15, displayFactor: 1.2 },
  { id: 'linen', factor: 0.9, displayFactor: 0.9 },
  { id: 'rayon', factor: 1.05, displayFactor: 1.1 },
] as const;

export const DYE_PRESET_COLORS = [
  '#1e3a8a',
  '#92400e',
  '#ca8a04',
  '#dc2626',
  '#059669',
  '#7c2d12',
  '#4338ca',
  '#ea580c',
] as const;

export const DYE_PREDICT_DEFAULTS = {
  primaryColor: '#1e3a8a',
  secondaryColor: '#dc2626',
  fabric: 'cotton' as DyeFabricId,
  concentration: 60,
  temperature: 80,
  time: 45,
};

export function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Parse a channel string/number into 0–255, or null if empty/invalid. */
export function parseRgbChannel(value: string | number): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return clampByte(value);
  }
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return clampByte(n);
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((c) => clampByte(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function fabricFactor(fabric: DyeFabricId): number {
  return DYE_FABRIC_OPTIONS.find((f) => f.id === fabric)?.factor ?? 1;
}

/**
 * Exploratory forward dye-color prediction (reference algorithm).
 * Blends primary (60%) + secondary (40%), then scales by concentration,
 * fabric factor, temperature factor, and dye-time factor. Not calibrated science.
 */
export function predictDyeColor(input: DyePredictInput): string {
  const primary = hexToRgb(input.primaryColor);
  const secondary = hexToRgb(input.secondaryColor);
  if (!primary || !secondary) return input.primaryColor;

  const fabric = fabricFactor(input.fabric);
  const concentration = Math.max(0.1, Math.min(1, input.concentration / 100));
  const tempFactor = Math.min(1.2, 0.7 + (input.temperature / 100) * 0.5);
  const timeFactor = Math.min(1.1, 0.9 + (input.time / 120) * 0.2);
  const scale = concentration * fabric * tempFactor * timeFactor;

  const r = (primary.r * 0.6 + secondary.r * 0.4) * scale;
  const g = (primary.g * 0.6 + secondary.g * 0.4) * scale;
  const b = (primary.b * 0.6 + secondary.b * 0.4) * scale;
  return rgbToHex(r, g, b);
}

export type DyeHistoryEntry = {
  id: string;
  color: string;
  fabric: DyeFabricId;
  concentration: number;
  temperature: number;
  time: number;
  primaryColor: string;
  secondaryColor: string;
  timestamp: string;
  isDemoFictional: true;
  analysisMode: 'exploratory';
  isCalibrated: false;
  labelNote: string;
};

export function createDyeHistoryEntry(
  input: DyePredictInput & { predictedColor: string; id?: string; timestamp?: Date },
): DyeHistoryEntry {
  return {
    id: input.id ?? `dye-${Date.now()}`,
    color: input.predictedColor,
    fabric: input.fabric,
    concentration: input.concentration,
    temperature: input.temperature,
    time: input.time,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    timestamp: (input.timestamp ?? new Date()).toISOString(),
    isDemoFictional: true,
    analysisMode: 'exploratory',
    isCalibrated: false,
    labelNote: `${DEMO_FICTIONAL_LABEL}. ${DYE_PREDICT_MODE_LABEL}`,
  };
}
