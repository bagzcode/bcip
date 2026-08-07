import { StatusBadge } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateGovernance } from '@/lib/governance-gate';
import { createKnowledgeClaimAction } from '@/lib/governance/actions';
import {
  listSourceFragmentOptions,
  listSourcesWithFragments,
  safeQuery,
} from '@/lib/governance/queries';

export default async function GovernanceProvenancePage() {
  const locale = await getLocale();
  const manage = await softGateGovernance('governance:manage');
  const sources = await safeQuery(listSourcesWithFragments, []);
  const fragments = await safeQuery(listSourceFragmentOptions, []);

  return (
    <div>
      <h2>{t(locale, 'governanceProvenanceTitle')}</h2>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '42rem' }}>
        {t(locale, 'governanceProvenanceIntro')}
      </p>

      <ul className="gov-list">
        {sources.map((source) => (
          <li key={source.id} className="gov-item">
            <div className="gov-item-head">
              <strong>
                {source.publicCode} — {source.title}
              </strong>
              <StatusBadge tone="review" label={t(locale, 'provenanceReview')}>
                {source.reviewStatus.replaceAll('_', ' ')}
              </StatusBadge>
            </div>
            <p className="gov-meta">
              {source.language} · {source.versions.length} version(s) ·{' '}
              {source.fragments.length} fragment(s)
            </p>
            {source.isDemoFictional ? (
              <p className="gov-notes">{t(locale, 'demoBadge')}</p>
            ) : null}
            {source.fragments.length > 0 ? (
              <ul className="gov-sublist">
                {source.fragments.map((frag) => (
                  <li key={frag.id}>
                    <code>{frag.fragmentKey}</code>
                    <span className="gov-meta"> · {frag.id.slice(0, 8)}…</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      {manage.allowed ? (
        <form action={createKnowledgeClaimAction} className="gov-form panel">
          <h3>{t(locale, 'governanceCreateClaim')}</h3>
          <p className="gov-meta">
            Requires ≥1 source fragment and a review status (assertClaimProvenance).
          </p>
          <label>
            Statement (must include DEMO / FICTIONAL label)
            <textarea
              name="statement"
              required
              rows={3}
              defaultValue="DEMO / FICTIONAL — NOT RESEARCH DATA: synthetic claim for provenance workflow tests."
            />
          </label>
          <label>
            Language
            <select name="language" defaultValue="en">
              <option value="en">en</option>
              <option value="id">id</option>
            </select>
          </label>
          <label>
            Claim type
            <select name="claimType" defaultValue="documented">
              <option value="documented">documented</option>
              <option value="contributor_interpretation">contributor_interpretation</option>
              <option value="inferred">inferred</option>
              <option value="contested">contested</option>
            </select>
          </label>
          <label>
            Confidence
            <select name="confidence" defaultValue="low">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>
            Review status
            <select name="reviewStatus" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="pending_review">pending_review</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="withdrawn">withdrawn</option>
            </select>
          </label>
          <fieldset className="gov-fieldset">
            <legend>Source fragments</legend>
            {fragments.length === 0 ? (
              <p className="gov-meta">No fragments available. Seed DEMO-SRC-001 first.</p>
            ) : (
              fragments.map((frag) => (
                <label key={frag.id} className="gov-check">
                  <input type="checkbox" name="sourceFragmentIds" value={frag.id} />
                  {frag.sourceCode} / {frag.fragmentKey}
                </label>
              ))
            )}
          </fieldset>
          <input type="hidden" name="isDemoFictional" value="true" />
          <button type="submit">{t(locale, 'governanceCreateClaim')}</button>
        </form>
      ) : null}
    </div>
  );
}
