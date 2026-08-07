'use client';

import type { DesignPatternSettings, PatternDesignId, PatternUnits } from '@bcip/contracts';
import {
  MEASUREMENT_FIELDS,
  PATTERN_DESIGNS,
  formatMeasurementValue,
  parseMeasurementInput,
} from '@bcip/domain';

type PatternPanelProps = {
  pattern: DesignPatternSettings;
  onChange: (next: DesignPatternSettings) => void;
};

export function PatternPanel({ pattern, onChange }: PatternPanelProps) {
  function patch(partial: Partial<DesignPatternSettings>) {
    onChange({ ...pattern, ...partial });
  }

  function setMeasurement(key: string, displayValue: string) {
    const field = MEASUREMENT_FIELDS.find((f) => f.key === key);
    if (!field) return;
    try {
      const stored = parseMeasurementInput(displayValue, field.kind, pattern.units);
      patch({
        measurementSet: {
          ...pattern.measurementSet,
          measurements: {
            ...pattern.measurementSet.measurements,
            [key]: stored,
          },
        },
      });
    } catch {
      /* ignore non-numeric while typing */
    }
  }

  return (
    <aside className="dw-sidebar dw-pattern-panel">
      <h2>Pattern</h2>
      <p className="dw-muted">
        FreeSewing-style design + measurement sets. Batik motifs stay in Motif view.
      </p>

      <label className="dw-field">
        <span>Design</span>
        <select
          value={pattern.designId}
          onChange={(e) => patch({ designId: e.target.value as PatternDesignId })}
        >
          {PATTERN_DESIGNS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </label>
      <p className="dw-muted" style={{ fontSize: '0.8rem' }}>
        {PATTERN_DESIGNS.find((d) => d.id === pattern.designId)?.description}
      </p>

      <label className="dw-field">
        <span>Measurement set name</span>
        <input
          value={pattern.measurementSet.name}
          maxLength={80}
          onChange={(e) =>
            patch({
              measurementSet: { ...pattern.measurementSet, name: e.target.value },
            })
          }
        />
      </label>

      <label className="dw-field">
        <span>Units</span>
        <select
          value={pattern.units}
          onChange={(e) => patch({ units: e.target.value as PatternUnits })}
        >
          <option value="metric">Metric (mm stored)</option>
          <option value="imperial">Imperial (display inches)</option>
        </select>
      </label>

      <h3>Measurements</h3>
      <p className="dw-muted" style={{ fontSize: '0.8rem' }}>
        Stored in millimetres (FreeSewing). Shoulder slope is degrees. Seed set “Bogus” matches
        the public editor share URL.
      </p>
      <div className="dw-meas-grid">
        {MEASUREMENT_FIELDS.map((field) => {
          const raw = pattern.measurementSet.measurements[field.key];
          const value =
            typeof raw === 'number'
              ? formatMeasurementValue(raw, field.kind, pattern.units)
              : '';
          return (
            <label key={field.key} className="dw-field">
              <span>
                {field.label}
                {field.kind === 'angle'
                  ? ' (°)'
                  : pattern.units === 'imperial'
                    ? ' (in)'
                    : ' (mm)'}
              </span>
              <input
                type="number"
                step={field.kind === 'angle' || pattern.units === 'imperial' ? 0.1 : 1}
                value={value}
                  onChange={(e) => setMeasurement(String(field.key), e.target.value)}
              />
            </label>
          );
        })}
      </div>
    </aside>
  );
}
