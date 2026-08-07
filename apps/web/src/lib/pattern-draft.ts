import type { DesignPatternSettings, PatternDesignId } from '@bcip/contracts';
import { resolvePatternSettings } from '@bcip/domain';

export type PatternDraftResult = {
  designId: PatternDesignId;
  engine: 'freesewing' | 'garment-flat';
  svg: string;
  setName: string;
  units: DesignPatternSettings['units'];
  notes: string[];
};

/**
 * Draft a parametric pattern SVG.
 * FreeSewing runs server-side only (no browser→AI); garment-flat returns a placeholder
 * that the client replaces with the Konva garment silhouette.
 */
export async function draftPatternSvg(input: {
  designId: PatternDesignId;
  units?: DesignPatternSettings['units'];
  measurementSet: DesignPatternSettings['measurementSet'];
  options?: DesignPatternSettings['options'];
  view?: DesignPatternSettings['view'];
}): Promise<PatternDraftResult> {
  const settings = resolvePatternSettings({
    designId: input.designId,
    measurementSet: input.measurementSet,
    options: input.options ?? {},
    ...(input.units ? { units: input.units } : {}),
    ...(input.view ? { view: input.view } : {}),
  });

  if (settings.designId === 'garment-flat') {
    return {
      designId: 'garment-flat',
      engine: 'garment-flat',
      svg: garmentFlatPlaceholderSvg(settings),
      setName: settings.measurementSet.name,
      units: settings.units,
      notes: [
        'Garment-flat mode uses the BCIP garment template silhouette for batik motif placement.',
        'Switch to Aaron for a FreeSewing parametric sewing draft.',
      ],
    };
  }

  const { Aaron } = await import('@freesewing/aaron');
  const pattern = new Aaron({
    measurements: settings.measurementSet.measurements,
    units: settings.units,
    options: settings.options,
  });
  const drafted = pattern.draft();
  const svg = String(drafted.render());

  return {
    designId: 'aaron',
    engine: 'freesewing',
    svg,
    setName: settings.measurementSet.name,
    units: settings.units,
    notes: [
      'Drafted with MIT @freesewing/aaron — made-to-measure A-shirt / tank.',
      `Measurement set “${settings.measurementSet.name}” (${settings.units}).`,
    ],
  };
}

function garmentFlatPlaceholderSvg(settings: DesignPatternSettings): string {
  const label = settings.measurementSet.name.replace(/[<>&"]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480" viewBox="0 0 400 480">
  <rect width="400" height="480" fill="#f3ebe0"/>
  <path d="M80 60 L120 40 L200 50 L280 40 L320 60 L300 160 L340 220 L300 240 L280 400 L120 400 L100 240 L60 220 L100 160 Z"
    fill="rgba(255,255,255,0.7)" stroke="#1e3a5f" stroke-width="2"/>
  <text x="200" y="30" text-anchor="middle" fill="#8b4513" font-size="14" font-family="system-ui,sans-serif">
    DEMO / FICTIONAL garment flat
  </text>
  <text x="200" y="450" text-anchor="middle" fill="#57534e" font-size="12" font-family="system-ui,sans-serif">
    Set: ${label} · open Motif view to place batik
  </text>
</svg>`;
}
