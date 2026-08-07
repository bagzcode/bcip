'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bcip/ui';
import {
  enqueueHueSeerAnalysis,
  fetchHueSeerJobStatus,
  type EnqueueHueSeerState,
} from '@/lib/hue-seer-actions';

type AssetOption = {
  assetVersionId: string;
  objectKey: string;
  sampleCode: string | null;
  label: string;
};

const initial: EnqueueHueSeerState = { ok: false };

export function HueSeerEnqueueForm({
  assets,
  labels,
}: {
  assets: AssetOption[];
  labels: {
    title: string;
    mode: string;
    exploratory: string;
    calibrated: string;
    calibrationTarget: string;
    paletteSize: string;
    submit: string;
    signInHint: string;
    progress: string;
    uploadHint: string;
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(enqueueHueSeerAnalysis, initial);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!state.ok || !state.colorAnalysisJobId) return;
    let cancelled = false;
    const tick = async () => {
      const status = await fetchHueSeerJobStatus(state.colorAnalysisJobId!);
      if (cancelled) return;
      setJobStatus(status.status);
      if (status.status === 'completed') {
        router.refresh();
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [state.ok, state.colorAnalysisJobId, router]);

  const defaultAsset = assets[0];

  return (
    <form action={formAction} style={{ display: 'grid', gap: '0.75rem', maxWidth: '32rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{labels.title}</h2>
      <p style={{ margin: 0, color: 'var(--bcip-muted)', fontSize: '0.9rem' }}>{labels.uploadHint}</p>
      <p style={{ margin: 0, color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>{labels.signInHint}</p>

      <label style={{ display: 'grid', gap: '0.25rem' }}>
        <span>Demo asset</span>
        <select
          name="assetVersionId"
          required
          defaultValue={defaultAsset?.assetVersionId}
          style={{ font: 'inherit', padding: '0.45rem' }}
          onChange={(e) => {
            const asset = assets.find((a) => a.assetVersionId === e.target.value);
            const keyInput = document.querySelector<HTMLInputElement>('input[name="inputObjectKey"]');
            if (asset && keyInput) keyInput.value = asset.objectKey;
          }}
        >
          {assets.map((a) => (
            <option key={a.assetVersionId} value={a.assetVersionId}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="inputObjectKey" defaultValue={defaultAsset?.objectKey ?? ''} />
      <input type="hidden" name="syntheticSeed" defaultValue={defaultAsset?.objectKey ?? ''} />

      <fieldset style={{ border: '1px solid var(--bcip-border)', padding: '0.75rem' }}>
        <legend>{labels.mode}</legend>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="radio" name="analysisMode" value="exploratory" defaultChecked />
          {labels.exploratory}
        </label>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
          <input type="radio" name="analysisMode" value="calibrated" />
          {labels.calibrated}
        </label>
        <label style={{ display: 'grid', gap: '0.25rem', marginTop: '0.5rem' }}>
          <span>{labels.calibrationTarget}</span>
          <input
            name="calibrationTargetId"
            placeholder="CC-01 (required for calibrated)"
            style={{ font: 'inherit', padding: '0.45rem' }}
          />
        </label>
      </fieldset>

      <label style={{ display: 'grid', gap: '0.25rem' }}>
        <span>{labels.paletteSize}</span>
        <input
          name="paletteSize"
          type="number"
          min={1}
          max={32}
          defaultValue={6}
          style={{ font: 'inherit', padding: '0.45rem', maxWidth: '8rem' }}
        />
      </label>

      <Button type="submit" disabled={pending || assets.length === 0}>
        {pending ? '…' : labels.submit}
      </Button>

      {state.error ? (
        <p role="alert" style={{ color: 'var(--bcip-clay)', margin: 0 }}>
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" style={{ margin: 0 }}>
          {labels.progress}: {jobStatus ?? 'queued'}
          {state.colorAnalysisJobId ? ` (${state.colorAnalysisJobId.slice(0, 8)}…)` : null}
        </p>
      ) : null}
    </form>
  );
}
