'use client';

import { useEffect, useId, useState } from 'react';
import {
  DYE_PRESET_COLORS,
  clampByte,
  hexToRgb,
  parseRgbChannel,
  rgbToHex,
  type Rgb,
} from '@bcip/domain';

export type HueSeerColorPickerLabels = {
  picker: string;
  presets: string;
  rgbValues: string;
  channelR: string;
  channelG: string;
  channelB: string;
  currentRgb: string;
  selectPreset: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  labels: HueSeerColorPickerLabels;
  presets?: readonly string[];
  id?: string;
};

function rgbFromHex(hex: string): Rgb {
  return hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
}

export function HueSeerColorPicker({
  label,
  value,
  onChange,
  labels,
  presets = DYE_PRESET_COLORS,
  id,
}: Props) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const rgb = rgbFromHex(value);
  const [draft, setDraft] = useState({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });

  useEffect(() => {
    const next = rgbFromHex(value);
    setDraft({ r: String(next.r), g: String(next.g), b: String(next.b) });
  }, [value]);

  const commitChannel = (channel: keyof Rgb, raw: string) => {
    setDraft((prev) => ({ ...prev, [channel]: raw }));
    const parsed = parseRgbChannel(raw);
    if (parsed == null) return;
    const next = { ...rgbFromHex(value), [channel]: parsed };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  const blurChannel = (channel: keyof Rgb) => {
    const parsed = parseRgbChannel(draft[channel]);
    const safe = parsed ?? clampByte(rgb[channel]);
    setDraft((prev) => ({ ...prev, [channel]: String(safe) }));
    const next = { ...rgbFromHex(value), [channel]: safe };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  return (
    <fieldset className="hs-color-picker">
      <legend className="hs-color-picker__legend">{label}</legend>

      <div className="hs-color-picker__row">
        <label className="hs-color-picker__native" htmlFor={`${baseId}-native`}>
          <span className="sr-only">{labels.picker}</span>
          <input
            id={`${baseId}-native`}
            type="color"
            value={value.startsWith('#') ? value.slice(0, 7) : `#${value}`.slice(0, 7)}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            aria-label={`${label}: ${labels.picker}`}
          />
          <span aria-hidden className="hs-color-picker__swatch" style={{ background: value }} />
        </label>

        <div className="hs-color-picker__presets" role="group" aria-label={labels.presets}>
          {presets.map((hex) => {
            const selected = hex.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                className={selected ? 'hs-preset is-selected' : 'hs-preset'}
                style={{ background: hex }}
                aria-label={`${labels.selectPreset} ${hex}`}
                aria-pressed={selected}
                onClick={() => onChange(hex.toLowerCase())}
              />
            );
          })}
        </div>
      </div>

      <div className="hs-color-picker__rgb">
        <p className="hs-color-picker__rgb-heading" id={`${baseId}-rgb-heading`}>
          {labels.rgbValues}
        </p>
        <div className="hs-color-picker__channels" role="group" aria-labelledby={`${baseId}-rgb-heading`}>
          {(
            [
              ['r', labels.channelR],
              ['g', labels.channelG],
              ['b', labels.channelB],
            ] as const
          ).map(([channel, channelLabel]) => (
            <label key={channel} className={`hs-channel hs-channel--${channel}`} htmlFor={`${baseId}-${channel}`}>
              <span>{channelLabel}</span>
              <input
                id={`${baseId}-${channel}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={255}
                step={1}
                value={draft[channel]}
                onChange={(e) => commitChannel(channel, e.target.value)}
                onBlur={() => blurChannel(channel)}
              />
            </label>
          ))}
        </div>
        <p className="hs-color-picker__current" aria-live="polite">
          {labels.currentRgb}: RGB({rgb.r}, {rgb.g}, {rgb.b})
        </p>
      </div>
    </fieldset>
  );
}
