import { StatusBadge } from '@bcip/ui';
import { allowedReviewTransitions, hasPermission } from '@bcip/domain';
import type { ReviewStatus } from '@bcip/contracts';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { transitionReviewAction } from '@/lib/governance/actions';
import { listClaimsForReview, safeQuery } from '@/lib/governance/queries';

function TransitionForm({
  kind,
  id,
  from,
  canManage,
}: {
  kind: 'source' | 'claim';
  id: string;
  from: ReviewStatus;
  canManage: boolean;
}) {
  const next = allowedReviewTransitions(from);
  if (!canManage || next.length === 0) return null;
  return (
    <form action={transitionReviewAction} className="gov-inline-form">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <label>
        Advance to
        <select name="toStatus" defaultValue={next[0]}>
          {next.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
  );
}

export default async function GovernanceReviewPage() {
  const locale = await getLocale();
  const actor = await getActorContext();
  const canTransition = hasPermission(actor, 'review:manage');

  const data = await safeQuery(listClaimsForReview, { claims: [], sources: [] });

  return (
    <div>
      <h2>{t(locale, 'governanceReviewTitle')}</h2>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '42rem' }}>
        {t(locale, 'governanceReviewIntro')}
      </p>

      <h3 style={{ marginTop: '1.5rem' }}>Sources</h3>
      <ul className="gov-list">
        {data.sources.map((source) => (
          <li key={source.id} className="gov-item">
            <div className="gov-item-head">
              <strong>
                {source.publicCode} — {source.title}
              </strong>
              <StatusBadge tone="review" label={t(locale, 'provenanceReview')}>
                {source.reviewStatus.replaceAll('_', ' ')}
              </StatusBadge>
            </div>
            {source.isDemoFictional ? (
              <p className="gov-notes">{t(locale, 'demoBadge')}</p>
            ) : null}
            <TransitionForm
              kind="source"
              id={source.id}
              from={source.reviewStatus}
              canManage={canTransition}
            />
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: '2rem' }}>Knowledge claims</h3>
      <ul className="gov-list">
        {data.claims.map((claim) => (
          <li key={claim.id} className="gov-item">
            <div className="gov-item-head">
              <strong>{claim.id.slice(0, 8)}…</strong>
              <StatusBadge tone="review" label={t(locale, 'provenanceReview')}>
                {claim.reviewStatus.replaceAll('_', ' ')}
              </StatusBadge>
              <StatusBadge tone="neutral">{claim.claimType.replaceAll('_', ' ')}</StatusBadge>
            </div>
            <p>{claim.statement}</p>
            <p className="gov-meta">
              {claim.language} · confidence {claim.confidence}
            </p>
            <TransitionForm
              kind="claim"
              id={claim.id}
              from={claim.reviewStatus}
              canManage={canTransition}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
