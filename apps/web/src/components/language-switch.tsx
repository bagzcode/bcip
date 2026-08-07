'use client';

import { useRouter } from 'next/navigation';

export function LanguageSwitch({ locale }: { locale: 'en' | 'id' }) {
  const router = useRouter();

  function setLocale(next: 'en' | 'id') {
    document.cookie = `bcip_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div aria-label="Language" style={{ display: 'inline-flex', gap: '0.35rem' }}>
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
        style={{
          border: '1px solid var(--bcip-border)',
          background: locale === 'en' ? 'var(--bcip-indigo)' : 'transparent',
          color: locale === 'en' ? '#fff' : 'inherit',
          padding: '0.25rem 0.55rem',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === 'id'}
        onClick={() => setLocale('id')}
        style={{
          border: '1px solid var(--bcip-border)',
          background: locale === 'id' ? 'var(--bcip-indigo)' : 'transparent',
          color: locale === 'id' ? '#fff' : 'inherit',
          padding: '0.25rem 0.55rem',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        ID
      </button>
    </div>
  );
}
