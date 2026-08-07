'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DesignDocument } from '@bcip/contracts';
import { Badge, Button } from '@bcip/ui';
import type { DesignProjectDetail } from '@/lib/dress-weaver';
import {
  exportDesignPreviewAction,
  saveDesignVersionAction,
} from '@/lib/dress-weaver-actions';
import { DesignCanvas } from './design-canvas';

type PlaceableMotif = {
  id: string;
  publicCode: string;
  title: string;
  summary: string;
  isDemoFictional: boolean;
};

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
  const [mode, setMode] = useState<'edit' | 'compare'>('edit');
  const [status, setStatus] = useState<string | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);

  const workingDesign = useMemo(() => {
    const version = project.versions.find((v) => v.versionNumber === activeVersion);
    return version?.design ?? latest?.design;
  }, [project.versions, activeVersion, latest]);

  const [draft, setDraft] = useState<DesignDocument | null>(workingDesign ?? null);

  const designForCanvas = draft ?? workingDesign;
  if (!designForCanvas) {
    return <p>No design versions yet.</p>;
  }

  const versionA = project.versions.find((v) => v.versionNumber === compareA);
  const versionB = project.versions.find((v) => v.versionNumber === compareB);

  function onSave() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveDesignVersionAction({
        projectCode: project.publicCode,
        versionLabel: `v${(latest?.versionNumber ?? 0) + 1} workspace save`,
        design: {
          ...draft,
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

  function onExport() {
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
    });
  }

  return (
    <div className="dw-page">
      <header className="dw-header">
        <div>
          <Badge>DEMO / FICTIONAL — NOT RESEARCH DATA</Badge>
          <h1 style={{ margin: '0.5rem 0 0.25rem' }}>{project.title}</h1>
          <p className="dw-muted">
            {project.publicCode} · template {project.garmentTemplateCode} · review{' '}
            {latest?.reviewStatus ?? 'draft'}
          </p>
          {project.reviewNotes ? (
            <p className="dw-muted" style={{ maxWidth: '40rem' }}>
              Expert review: {project.reviewNotes}
            </p>
          ) : null}
        </div>
        <div className="dw-actions">
          <Button
            type="button"
            variant={mode === 'edit' ? 'primary' : 'ghost'}
            onClick={() => setMode('edit')}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={mode === 'compare' ? 'primary' : 'ghost'}
            onClick={() => setMode('compare')}
          >
            Compare
          </Button>
          <Button type="button" onClick={onSave} disabled={pending || mode !== 'edit'}>
            Save version
          </Button>
          <Button type="button" variant="ghost" onClick={onExport} disabled={pending}>
            Export preview metadata
          </Button>
        </div>
      </header>

      {status ? <p className="dw-status" role="status">{status}</p> : null}

      {mode === 'edit' ? (
        <>
          <label className="dw-field" style={{ maxWidth: '16rem' }}>
            <span>Working from version</span>
            <select
              value={activeVersion}
              onChange={(e) => {
                const n = Number(e.target.value);
                setActiveVersion(n);
                const v = project.versions.find((x) => x.versionNumber === n);
                if (v) setDraft(v.design);
              }}
            >
              {project.versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber} — {v.versionLabel}
                </option>
              ))}
            </select>
          </label>
          <DesignCanvas
            template={project.template}
            initialDesign={designForCanvas}
            motifs={motifs}
            onDesignChange={setDraft}
          />
        </>
      ) : (
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
      )}

      {exportJson ? (
        <section className="dw-export panel">
          <h2>Preview export metadata</h2>
          <p className="dw-muted">
            Medium-res preview metadata with attribution / watermark rules. Binary PNG upload to
            object storage can attach to the recorded object key later.
          </p>
          <pre className="dw-json">{exportJson}</pre>
        </section>
      ) : null}
    </div>
  );
}

function ComparePanel({ label, design }: { label: string; design: DesignDocument }) {
  return (
    <article className="dw-compare-panel">
      <h3>{label}</h3>
      <p className="dw-muted">{design.meta.label}</p>
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
