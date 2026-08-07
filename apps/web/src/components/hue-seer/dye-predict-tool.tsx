'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, StatusBadge } from '@bcip/ui';
import './hue-seer.css';
import {
  DYE_FABRIC_OPTIONS,
  DYE_PREDICT_DEFAULTS,
  DYE_PREDICT_EDUCATION_SCOPE,
  DYE_PREDICT_PIPELINE_NAME,
  DYE_PREDICT_PIPELINE_VERSION,
  createDyeHistoryEntry,
  predictDyeColor,
  type DyeFabricId,
  type DyeHistoryEntry,
} from '@bcip/domain';
import { HueSeerColorPicker, type HueSeerColorPickerLabels } from './color-picker';

const HISTORY_KEY = 'bcip.hue-seer.dye-history.v1';
const HISTORY_MAX = 12;

export type DyePredictToolLabels = {
  toolTitle: string;
  toolSubtitle: string;
  exploratoryBadge: string;
  demoBadge: string;
  aboutTitle: string;
  aboutBody: string;
  dyeColors: string;
  primaryDye: string;
  secondaryDye: string;
  fabricType: string;
  fabricCotton: string;
  fabricCottonDesc: string;
  fabricSilk: string;
  fabricSilkDesc: string;
  fabricLinen: string;
  fabricLinenDesc: string;
  fabricRayon: string;
  fabricRayonDesc: string;
  parameters: string;
  concentration: string;
  temperature: string;
  dyeTime: string;
  concentrationLight: string;
  concentrationIntense: string;
  temperatureCold: string;
  temperatureHot: string;
  timeQuick: string;
  timeDeep: string;
  prediction: string;
  saveColor: string;
  reset: string;
  clearHistory: string;
  historyTitle: string;
  historyEmpty: string;
  historyEmptyHint: string;
  historyRestore: string;
  footer: string;
  analysesLink: string;
  compareLink: string;
  pipelineNote: string;
  colorPicker: HueSeerColorPickerLabels;
};

type Props = {
  labels: DyePredictToolLabels;
  analysesHref: string;
  compareHref: string;
};

type FabricLabelKey =
  | 'fabricCotton'
  | 'fabricCottonDesc'
  | 'fabricSilk'
  | 'fabricSilkDesc'
  | 'fabricLinen'
  | 'fabricLinenDesc'
  | 'fabricRayon'
  | 'fabricRayonDesc';

const FABRIC_LABEL_KEYS: Record<DyeFabricId, { name: FabricLabelKey; desc: FabricLabelKey }> = {
  cotton: { name: 'fabricCotton', desc: 'fabricCottonDesc' },
  silk: { name: 'fabricSilk', desc: 'fabricSilkDesc' },
  linen: { name: 'fabricLinen', desc: 'fabricLinenDesc' },
  rayon: { name: 'fabricRayon', desc: 'fabricRayonDesc' },
};

function loadHistory(): DyeHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DyeHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function persistHistory(entries: DyeHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
}

export function HueSeerDyePredictTool({ labels, analysesHref, compareHref }: Props) {
  const [primaryColor, setPrimaryColor] = useState(DYE_PREDICT_DEFAULTS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(DYE_PREDICT_DEFAULTS.secondaryColor);
  const [fabric, setFabric] = useState<DyeFabricId>(DYE_PREDICT_DEFAULTS.fabric);
  const [concentration, setConcentration] = useState(DYE_PREDICT_DEFAULTS.concentration);
  const [temperature, setTemperature] = useState(DYE_PREDICT_DEFAULTS.temperature);
  const [time, setTime] = useState(DYE_PREDICT_DEFAULTS.time);
  const [history, setHistory] = useState<DyeHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setHydrated(true);
  }, []);

  const predictedColor = useMemo(
    () =>
      predictDyeColor({
        primaryColor,
        secondaryColor,
        fabric,
        concentration,
        temperature,
        time,
      }),
    [primaryColor, secondaryColor, fabric, concentration, temperature, time],
  );

  const saveColor = () => {
    const entry = createDyeHistoryEntry({
      primaryColor,
      secondaryColor,
      fabric,
      concentration,
      temperature,
      time,
      predictedColor,
    });
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_MAX);
      persistHistory(next);
      return next;
    });
  };

  const resetControls = () => {
    setPrimaryColor(DYE_PREDICT_DEFAULTS.primaryColor);
    setSecondaryColor(DYE_PREDICT_DEFAULTS.secondaryColor);
    setFabric(DYE_PREDICT_DEFAULTS.fabric);
    setConcentration(DYE_PREDICT_DEFAULTS.concentration);
    setTemperature(DYE_PREDICT_DEFAULTS.temperature);
    setTime(DYE_PREDICT_DEFAULTS.time);
  };

  const clearHistory = () => {
    setHistory([]);
    persistHistory([]);
  };

  const restoreEntry = (entry: DyeHistoryEntry) => {
    setFabric(entry.fabric);
    setConcentration(entry.concentration);
    if (entry.temperature != null) setTemperature(entry.temperature);
    if (entry.time != null) setTime(entry.time);
    if (entry.primaryColor) setPrimaryColor(entry.primaryColor);
    if (entry.secondaryColor) setSecondaryColor(entry.secondaryColor);
  };

  return (
    <div className="hs-dye">
      <header className="hs-dye__header">
        <div className="hs-dye__header-inner">
          <div>
            <p className="hs-dye__eyebrow">Hue Seer</p>
            <h1>{labels.toolTitle}</h1>
            <p className="hs-dye__subtitle">{labels.toolSubtitle}</p>
          </div>
          <div className="hs-dye__badges">
            <StatusBadge tone="demo">{labels.demoBadge}</StatusBadge>
            <StatusBadge tone="access">{labels.exploratoryBadge}</StatusBadge>
          </div>
          <nav className="hs-dye__nav" aria-label="Hue Seer">
            <a href="#hs-dye-tool">{labels.prediction}</a>
            <a href={analysesHref}>{labels.analysesLink}</a>
            <a href={compareHref}>{labels.compareLink}</a>
          </nav>
        </div>
      </header>

      <div className="hs-dye__body">
        <aside className="hs-dye__banner" role="note">
          <h2>{labels.aboutTitle}</h2>
          <p>{labels.aboutBody}</p>
          <p className="hs-dye__scope">{DYE_PREDICT_EDUCATION_SCOPE}</p>
        </aside>

        <div className="hs-dye__layout" id="hs-dye-tool">
          <div className="hs-dye__controls">
            <section className="hs-panel" aria-labelledby="hs-dye-colors">
              <h2 id="hs-dye-colors">{labels.dyeColors}</h2>
              <div className="hs-dye__pickers">
                <HueSeerColorPicker
                  id="hs-primary"
                  label={labels.primaryDye}
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  labels={labels.colorPicker}
                />
                <HueSeerColorPicker
                  id="hs-secondary"
                  label={labels.secondaryDye}
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  labels={labels.colorPicker}
                />
              </div>
            </section>

            <section className="hs-panel" aria-labelledby="hs-fabric">
              <h2 id="hs-fabric">{labels.fabricType}</h2>
              <div className="hs-fabric-grid" role="radiogroup" aria-labelledby="hs-fabric">
                {DYE_FABRIC_OPTIONS.map((opt) => {
                  const keys = FABRIC_LABEL_KEYS[opt.id];
                  const selected = fabric === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={selected ? 'hs-fabric is-selected' : 'hs-fabric'}
                      onClick={() => setFabric(opt.id)}
                    >
                      <span className="hs-fabric__name">{labels[keys.name]}</span>
                      <span className="hs-fabric__desc">{labels[keys.desc]}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="hs-panel" aria-labelledby="hs-params">
              <h2 id="hs-params">{labels.parameters}</h2>
              <label className="hs-slider">
                <span>
                  {labels.concentration}: {concentration}%
                </span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={concentration}
                  onChange={(e) => setConcentration(Number(e.target.value))}
                  aria-valuemin={10}
                  aria-valuemax={100}
                  aria-valuenow={concentration}
                  aria-valuetext={`${concentration}%`}
                />
                <span className="hs-slider__ends">
                  <span>{labels.concentrationLight}</span>
                  <span>{labels.concentrationIntense}</span>
                </span>
              </label>
              <label className="hs-slider">
                <span>
                  {labels.temperature}: {temperature}°C
                </span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  aria-valuemin={20}
                  aria-valuemax={100}
                  aria-valuenow={temperature}
                  aria-valuetext={`${temperature}°C`}
                />
                <span className="hs-slider__ends">
                  <span>{labels.temperatureCold}</span>
                  <span>{labels.temperatureHot}</span>
                </span>
              </label>
              <label className="hs-slider">
                <span>
                  {labels.dyeTime}: {time} min
                </span>
                <input
                  type="range"
                  min={5}
                  max={120}
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  aria-valuemin={5}
                  aria-valuemax={120}
                  aria-valuenow={time}
                  aria-valuetext={`${time} minutes`}
                />
                <span className="hs-slider__ends">
                  <span>{labels.timeQuick}</span>
                  <span>{labels.timeDeep}</span>
                </span>
              </label>
            </section>
          </div>

          <div className="hs-dye__aside">
            <section className="hs-panel hs-preview" aria-labelledby="hs-prediction">
              <h2 id="hs-prediction">{labels.prediction}</h2>
              <div
                className="hs-preview__swatch"
                style={{ background: predictedColor }}
                role="img"
                aria-label={`${labels.prediction} ${predictedColor}`}
              >
                <span>{predictedColor.toUpperCase()}</span>
              </div>
              <p className="hs-preview__note">{labels.pipelineNote}</p>
              <p className="hs-preview__meta">
                {DYE_PREDICT_PIPELINE_NAME}@{DYE_PREDICT_PIPELINE_VERSION}
              </p>
              <div className="hs-preview__actions">
                <Button type="button" onClick={saveColor}>
                  {labels.saveColor}
                </Button>
                <Button type="button" variant="ghost" onClick={resetControls}>
                  {labels.reset}
                </Button>
              </div>
            </section>

            <section className="hs-panel" aria-labelledby="hs-history">
              <div className="hs-history__head">
                <h2 id="hs-history">{labels.historyTitle}</h2>
                {history.length > 0 ? (
                  <Button type="button" variant="ghost" onClick={clearHistory}>
                    {labels.clearHistory}
                  </Button>
                ) : null}
              </div>
              {!hydrated ? (
                <p className="hs-muted">{labels.historyEmptyHint}</p>
              ) : history.length === 0 ? (
                <div className="hs-history__empty">
                  <p>{labels.historyEmpty}</p>
                  <p className="hs-muted">{labels.historyEmptyHint}</p>
                </div>
              ) : (
                <ul className="hs-history__list">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="hs-history__item"
                        onClick={() => restoreEntry(entry)}
                        aria-label={`${labels.historyRestore} ${entry.color}`}
                      >
                        <span className="hs-history__chip" style={{ background: entry.color }} aria-hidden />
                        <span>
                          <strong>{entry.color.toUpperCase()}</strong>
                          <span className="hs-muted">
                            {labels[FABRIC_LABEL_KEYS[entry.fabric].name]} · {entry.concentration}%
                            {entry.temperature != null ? ` · ${entry.temperature}°C` : ''}
                            {entry.time != null ? ` · ${entry.time} min` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      <footer className="hs-dye__footer">
        <p>{labels.footer}</p>
      </footer>
    </div>
  );
}
