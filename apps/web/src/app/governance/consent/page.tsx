import { StatusBadge } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { listConsentBundle, safeQuery } from '@/lib/governance/queries';

export const dynamic = 'force-dynamic';

export default async function GovernanceConsentPage() {
  const locale = await getLocale();
  const data = await safeQuery(listConsentBundle, { consents: [], attributions: [] });
  const consents = data?.consents ?? [];
  const attributions = data?.attributions ?? [];

  return (
    <div>
      <h2>{t(locale, 'governanceConsentTitle')}</h2>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '42rem' }}>
        {t(locale, 'governanceConsentIntro')}
      </p>

      <h3 style={{ marginTop: '1.75rem' }}>Consent records</h3>
      {consents.length === 0 ? (
        <p className="gov-meta">No consent rows loaded. Run seed for fictional demo data.</p>
      ) : (
        <ul className="gov-list">
          {consents.map((consent) => (
            <li key={consent.id} className="gov-item">
              <div className="gov-item-head">
                <strong>{consent.versionLabel}</strong>
                <StatusBadge tone="review">{consent.status}</StatusBadge>
                {consent.accessTier ? (
                  <StatusBadge tone="access" label="tier">
                    {consent.accessTier.replaceAll('_', ' ')}
                  </StatusBadge>
                ) : null}
              </div>
              <p className="gov-meta">
                {consent.contributorName ?? '—'} · {consent.rightsHolderName ?? '—'} ·{' '}
                {consent.licenseCode ?? '—'} · {consent.accessPolicyName ?? '—'}
              </p>
              <p>{consent.summary}</p>
              <p className="gov-meta">
                Purposes:{' '}
                {(consent.purposes ?? [])
                  .map((p) => `${p.purposeCode}${p.allowed ? '' : ' (denied)'}`)
                  .join(', ') || '—'}
              </p>
              {consent.isDemoFictional ? (
                <p className="gov-notes">{t(locale, 'demoBadge')}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h3 style={{ marginTop: '2rem' }}>Attribution preferences</h3>
      {attributions.length === 0 ? (
        <p className="gov-meta">No attribution preferences loaded.</p>
      ) : (
        <ul className="gov-list">
          {attributions.map((attr) => (
            <li key={attr.id} className="gov-item">
              <div className="gov-item-head">
                <strong>{attr.contributorName ?? attr.contributorId}</strong>
                <StatusBadge tone={attr.allowPublicCredit ? 'access' : 'neutral'}>
                  {attr.allowPublicCredit ? 'public credit' : 'private credit'}
                </StatusBadge>
              </div>
              <p>{attr.preferredCredit}</p>
              {attr.notes ? <p className="gov-notes">{attr.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
