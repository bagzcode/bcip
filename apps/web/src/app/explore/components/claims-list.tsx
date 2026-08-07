import { ProvenanceStrip } from '@bcip/ui';
import type { ClaimView } from '@/lib/catalogue';
import { t, type Locale } from '@/i18n/messages';

export function ClaimsList({ claims, locale }: { claims: ClaimView[]; locale: Locale }) {
  if (!claims.length) {
    return (
      <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'culturalDescriptionsEmpty')}</p>
    );
  }

  return (
    <ul className="motif-list">
      {claims.map((claim) => (
        <li key={claim.id} className="motif-item">
          <p style={{ margin: 0 }}>{claim.statement}</p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
            {claim.claimType.replaceAll('_', ' ')} · {claim.confidence} · {claim.language}
          </p>
          <ProvenanceStrip
            reviewStatus={claim.reviewStatus}
            accessTier={claim.accessTier}
            sourceCodes={claim.sourceCodes}
            isDemoFictional={claim.isDemoFictional}
            demoLabel={t(locale, 'demoBadge')}
            reviewLabel={t(locale, 'provenanceReview')}
            accessLabel={t(locale, 'provenanceAccess')}
            sourcesLabel={t(locale, 'provenanceSources')}
          />
          {claim.sourceCitations.length > 0 ? (
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', color: 'var(--bcip-muted)' }}>
              {claim.sourceCitations.map((citation) => (
                <li key={citation} style={{ fontSize: '0.85rem' }}>
                  {citation}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
