'use client';

import { useState, useTransition } from 'react';
import { Button } from '@bcip/ui';
import {
  saveMotifToCollection,
  saveSampleToCollection,
  type ActionResult,
} from '@/lib/explore-actions';

type Props = {
  kind: 'motif' | 'sample';
  id: string;
  label: string;
  successLabel: string;
  errorLabel: string;
  forbiddenLabel: string;
};

export function SaveButton({
  kind,
  id,
  label,
  successLabel,
  errorLabel,
  forbiddenLabel,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      const result: ActionResult =
        kind === 'motif' ? await saveMotifToCollection(id) : await saveSampleToCollection(id);
      if (result.ok) {
        setMessage(successLabel);
        return;
      }
      if (result.message === 'FORBIDDEN' || result.message === 'AUTH_REQUIRED') {
        setMessage(forbiddenLabel);
        return;
      }
      setMessage(errorLabel);
    });
  }

  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <Button type="button" onClick={onClick} disabled={pending}>
        {pending ? '…' : label}
      </Button>
      {message ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--bcip-focus)' }} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
