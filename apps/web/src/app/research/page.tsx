import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { listStudies } from '@/lib/research/queries';

export default async function ResearchPage() {
  const locale = await getLocale();
  let studies: Awaited<ReturnType<typeof listStudies>> = [];
  let error: string | null = null;
  try {
    studies = await listStudies();
  } catch {
    error = t(locale, 'researchUnavailable');
  }

  return (
    <div>
      <h2>{t(locale, 'researchStudiesHeading')}</h2>
      <p className="research-muted">{t(locale, 'researchStudiesIntro')}</p>
      {error ? <p className="research-denied">{error}</p> : null}
      {!error && studies.length === 0 ? (
        <p className="research-muted">{t(locale, 'researchNoStudies')}</p>
      ) : null}
      <ul className="research-list">
        {studies.map((study) => (
          <li key={study.id} className="research-item">
            <div className="research-item-head">
              <Link href={`/research/${study.publicCode}`}>{study.title}</Link>
              <span className="research-meta">{study.status}</span>
            </div>
            <p className="research-meta">
              {study.publicCode}
              {study.versionLabel ? ` · ${study.versionLabel}` : ''}
            </p>
            {study.description ? <p className="research-notes">{study.description}</p> : null}
            {study.isDemoFictional ? (
              <p className="research-demo">{t(locale, 'demoBadge')}</p>
            ) : null}
            <p className="research-links">
              <Link href={`/research/${study.publicCode}`}>{t(locale, 'researchViewProtocol')}</Link>
              {' · '}
              <Link href={`/research/${study.publicCode}/collect`}>
                {t(locale, 'researchCollect')}
              </Link>
              {' · '}
              <Link href={`/research/${study.publicCode}/export`}>
                {t(locale, 'researchExport')}
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
