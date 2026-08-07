'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DesignDocument, DesignPatternSettings, PatternViewMode } from '@bcip/contracts';
import { resolvePatternSettings } from '@bcip/domain';
import { Badge, Button } from '@bcip/ui';
import type { DesignProjectDetail } from '@/lib/dress-weaver';
import {
  draftPatternAction,
  exportDesignPreviewAction,
  saveDesignVersionAction,
} from '@/lib/dress-weaver-actions';
import { DesignCanvas } from './design-canvas';
import { DraftViewer } from './draft-viewer';
import { PatternPanel } from './pattern-panel';

type PlaceableMotif = {
  id: string;
  publicCode: string;
  title: string;
  summary: string;
  isDemoFictional: boolean;
};

const VIEW_MODES: Array<{ id: PatternViewMode; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'motif', label: 'Motif' },
  { id: 'compare', label: 'Compare' },
  { id: 'export', label: 'Export' },
];

export function DressWeaverWorkspaceClient({
  project,
  motifs,
}: {
  project: DesignProjectDetail;
  motifs: PlaceableMotif[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const latest = project.versions[project.versions.length - 1];
  const [activeVersion, setActiveVersion] = useState(latest?.versionNumber ?? 1);
  const [compareA, setCompareA] = useState(project.versions[0]?.versionNumber ?? 1);
  const [compareB, setCompareB] = useState(
    project.versions[project.versions.length - 1]?.versionNumber ?? 1,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [draftSvg, setDraftSvg] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string[]>([]);
  const [drafting, setDrafting] = useState(false);

  const workingDesign = useMemo(() => {
    const version = project.versions.find((v) => v.versionNumber === activeVersion);
    return version?.design ?? latest?.design;
  }, [project.versions, activeVersion, latest]);

  const [draft, setDraft] = useState<DesignDocument | null>(() => {
    if (!workingDesign) return null;
    return withResolvedPattern(workingDesign);
  });

  const designForCanvas = draft ?? (workingDesign ? withResolvedPattern(workingDesign) : null);
  const pattern = designForCanvas
    ? resolvePatternSettings(designForCanvas.pattern)
    : resolvePatternSettings(undefined);
  const [view, setView] = useState<PatternViewMode>(pattern.view ?? 'draft');

  useEffect(() => {
    if (workingDesign) {
      setDraft(withResolvedPattern(workingDesign));
    }
  }, [workingDesign]);

  useEffect(() => {
    if (view !== 'draft' && view !== 'measurements' && view !== 'export') return;
    let cancelled = false;
    setDrafting(true);
    void draftPatternAction({
      designId: pattern.designId,
      units: pattern.units,
      measurementSet: pattern.measurementSet,
      options: pattern.options,
    }).then((result) => {
      if (cancelled) return;
      setDrafting(false);
      if (!result.ok || !result.data) {
        setStatus(result.message);
        return;
      }
      setDraftSvg(result.data.svg);
      setDraftNotes(result.data.notes);
    });
    return () => {
      cancelled = true;
    };
    // Re-draft when measurement set / design / units change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional pattern fingerprint
  }, [
    view,
    pattern.designId,
    pattern.units,
    pattern.measurementSet.name,
    JSON.stringify(pattern.measurementSet.measurements),
    JSON.stringify(pattern.options),
  ]);

  if (!designForCanvas) {
    return <p>No design versions yet.</p>;
  }

  const versionA = project.versions.find((v) => v.versionNumber === compareA);
  const versionB = project.versions.find((v) => v.versionNumber === compareB);

  function updatePattern(next: DesignPatternSettings) {
    if (!draft && !designForCanvas) return;
    const base = draft ?? designForCanvas!;
    setDraft({
      ...base,
      pattern: { ...next, view },
    });
  }

  function changeView(next: PatternViewMode) {
    setView(next);
    if (!designForCanvas) return;
    const base = draft ?? designForCanvas;
    setDraft({
      ...base,
      pattern: { ...resolvePatternSettings(base.pattern), view: next },
    });
  }

  function onSave() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveDesignVersionAction({
        projectCode: project.publicCode,
        versionLabel: `v${(latest?.versionNumber ?? 0) + 1} workspace save`,
        design: {
          ...draft,
          pattern: {
            ...resolvePatternSettings(draft.pattern),
            view,
          },
          meta: {
            ...draft.meta,
            label: `v${(latest?.versionNumber ?? 0) + 1} workspace save`,
          },
        },
        parentVersionNumber: activeVersion,
      });
      if (!result.ok) {
        setStatus(result.message);
        return;
      }
      setStatus(`Saved version ${result.data?.versionNumber} · ${result.data?.checksum.slice(0, 12)}…`);
      router.refresh();
    });
  }

  function onExportMetadata() {
    startTransition(async () => {
      const result = await exportDesignPreviewAction({
        projectCode: project.publicCode,
        versionNumber: activeVersion,
        width: 800,
        height: 1000,
      });
      if (!result.ok || !result.data) {
        setStatus(result.message);
        return;
      }
      setExportJson(JSON.stringify(result.data.exportMetadata, null, 2));
      setStatus(`Export metadata ready · ${result.data.attributionText}`);
      changeView('export');
    });
  }

  function onDownloadSvg() {
    if (!draftSvg) return;
    const blob = new Blob([draftSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.publicCode}-${pattern.designId}-${pattern.measurementSet.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="dw-page">
      <header className="dw-header">
        <div>
          <Badge>DEMO / FICTIONAL — NOT RESEARCH DATA</Badge>
          <h1 style={{ margin: '0.5rem 0 0.25rem' }}>{project.title}</h1>
          <p className="dw-muted">
            {project.publicCode} · template {project.garmentTemplateCode} · pattern{' '}
            {pattern.designId} · set “{pattern.measurementSet.name}” · review{' '}
            {latest?.reviewStatus ?? 'draft'}
          </p>
          {project.reviewNotes ? (
            <p className="dw-muted" style={{ maxWidth: '40rem' }}>
              Expert review: {project.reviewNotes}
            </p>
          ) : null}
        </div>
        <div className="dw-actions">
          {VIEW_MODES.map((mode) => (
            <Button
              key={mode.id}
              type="button"
              variant={view === mode.id ? 'primary' : 'ghost'}
              onClick={() => changeView(mode.id)}
            >
              {mode.label}
            </Button>
          ))}
          <Button type="button" onClick={onSave} disabled={pending || view === 'compare'}>
            Save version
          </Button>
        </div>
      </header>

      {status ? (
        <p className="dw-status" role="status">
          {status}
        </p>
      ) : null}

      {view !== 'compare' ? (
        <label className="dw-field" style={{ maxWidth: '16rem', marginBottom: '0.75rem' }}>
          <span>Working from version</span>
          <select
            value={activeVersion}
            onChange={(e) => {
              const n = Number(e.target.value);
              setActiveVersion(n);
              const v = project.versions.find((x) => x.versionNumber === n);
              if (v) setDraft(withResolvedPattern(v.design));
            }}
          >
            {project.versions.map((v) => (
              <option key={v.id} value={v.versionNumber}>
                v{v.versionNumber} — {v.versionLabel}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {view === 'draft' || view === 'measurements' ? (
        <div className="dw-workspace">
          <PatternPanel pattern={pattern} onChange={updatePattern} />
          <DraftViewer
            svg={draftSvg}
            loading={drafting}
            notes={draftNotes}
            setName={pattern.measurementSet.name}
            onExportSvg={onDownloadSvg}
          />
        </div>
      ) : null}

      {view === 'motif' ? (
        <DesignCanvas
          template={project.template}
          initialDesign={designForCanvas}
          motifs={motifs}
          onDesignChange={(next) =>
            setDraft({
              ...next,
              pattern: { ...pattern, view: 'motif' },
            })
          }
        />
      ) : null}

      {view === 'compare' ? (
        <div className="dw-compare">
          <div className="dw-compare-controls">
            <label className="dw-field">
              <span>Left</span>
              <select value={compareA} onChange={(e) => setCompareA(Number(e.target.value))}>
                {project.versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    v{v.versionNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="dw-field">
              <span>Right</span>
              <select value={compareB} onChange={(e) => setCompareB(Number(e.target.value))}>
                {project.versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    v{v.versionNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dw-compare-grid">
            {versionA ? (
              <ComparePanel label={`v${versionA.versionNumber}`} design={versionA.design} />
            ) : null}
            {versionB ? (
              <ComparePanel label={`v${versionB.versionNumber}`} design={versionB.design} />
            ) : null}
          </div>
        </div>
      ) : null}

      {view === 'export' ? (
        <section className="dw-export panel">
          <h2>Export</h2>
          <p className="dw-muted">
            Download the parametric draft SVG, or persist medium-res preview metadata with
            attribution / watermark rules (batik motif differentiator unchanged).
          </p>
          <div className="dw-actions" style={{ marginBottom: '1rem' }}>
            <Button type="button" onClick={onDownloadSvg} disabled={!draftSvg}>
              Download pattern SVG
            </Button>
            <Button type="button" variant="ghost" onClick={onExportMetadata} disabled={pending}>
              Export preview metadata
            </Button>
          </div>
          <DraftViewer
            svg={draftSvg}
            loading={drafting}
            notes={draftNotes}
            setName={pattern.measurementSet.name}
          />
          {exportJson ? <pre className="dw-json">{exportJson}</pre> : null}
        </section>
      ) : null}
    </div>
  );
}

function withResolvedPattern(design: DesignDocument): DesignDocument {
  return {
    ...design,
    pattern: resolvePatternSettings(design.pattern),
  };
}

function ComparePanel({ label, design }: { label: string; design: DesignDocument }) {
  const pattern = resolvePatternSettings(design.pattern);
  return (
    <article className="dw-compare-panel">
      <h3>{label}</h3>
      <p className="dw-muted">{design.meta.label}</p>
      <p className="dw-muted" style={{ fontSize: '0.85rem' }}>
        Pattern {pattern.designId} · set “{pattern.measurementSet.name}” · chest{' '}
        {pattern.measurementSet.measurements.chest}mm
      </p>
      <ul>
        {design.layers.map((layer) => (
          <li key={layer.id}>
            <strong>{layer.motifPublicCode}</strong> @ {layer.regionKey}
            <br />
            <span className="dw-muted">
              x={layer.transform.x} y={layer.transform.y} scale={layer.transform.scaleX} rot=
              {layer.transform.rotation}°
            </span>
          </li>
        ))}
      </ul>
      <p className="dw-muted" style={{ fontSize: '0.8rem' }}>
        {design.layers.length} layer(s) · watermark{' '}
        {design.attribution.watermarkRequired ? 'required' : 'optional'}
      </p>
    </article>
  );
}
