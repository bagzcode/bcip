import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';

export default async function HueSeerPage() {
  const locale = await getLocale();
  return (
    <section>
      <p style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bcip-clay)' }}>
        Phase 2
      </p>
      <h1>{t(locale, 'hueSeerTitle')}</h1>
      <p style={{ maxWidth: '40rem' }}>{t(locale, 'hueSeerBlurb')}</p>
      <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'placeholderComing')}</p>
    </section>
  );
}
