'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { Locale } from '@/i18n/messages';
import { t } from '@/i18n/messages';

export function AuthNav({
  locale,
  email,
}: {
  locale: Locale;
  email: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut();
    setPending(false);
    router.refresh();
  }

  if (email) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ color: 'var(--bcip-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {email}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          disabled={pending}
          style={{
            border: '1px solid var(--bcip-border)',
            background: 'transparent',
            color: 'inherit',
            padding: '0.25rem 0.55rem',
            borderRadius: 4,
            cursor: pending ? 'wait' : 'pointer',
            font: 'inherit',
          }}
        >
          {t(locale, 'navSignOut')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
      <Link href="/sign-in">{t(locale, 'navSignIn')}</Link>
      <Link href="/sign-up">{t(locale, 'navSignUp')}</Link>
    </div>
  );
}
