import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';

export default async function ExploreNotFound() {
  const locale = await getLocale();
  return (
    <section>
      <h1>{t(locale, 'notFoundTitle')}</h1>
      <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'notFoundBody')}</p>
      <p>
        <Link href="/explore">{t(locale, 'exploreBack')}</Link>
      </p>
    </section>
  );
}
