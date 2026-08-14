'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@bcip/ui';
import { BrandLogo } from '@/components/brand-logo';
import { authClient } from '@/lib/auth-client';
import type { Locale } from '@/i18n/messages';
import { t } from '@/i18n/messages';

export function SignUpForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      name: name.trim() || email.split('@')[0] || 'BCIP User',
      email,
      password,
    });
    setPending(false);
    if (err) {
      setError(err.message ?? t(locale, 'authFailed'));
      return;
    }
    router.push('/workspace');
    router.refresh();
  }

  return (
    <section className="panel" style={{ maxWidth: 420 }}>
      <p className="auth-brand">
        <BrandLogo size="auth" />
      </p>
      <h1>{t(locale, 'signUpTitle')}</h1>
      <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'authDemoHint')}</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          {t(locale, 'authName')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>
        <label>
          {t(locale, 'authEmail')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>
        <label>
          {t(locale, 'authPassword')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>
        {error ? (
          <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? t(locale, 'authSigningUp') : t(locale, 'authSubmitSignUp')}
        </Button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        {t(locale, 'authHaveAccount')}{' '}
        <Link href="/sign-in">{t(locale, 'navSignIn')}</Link>
      </p>
    </section>
  );
}
