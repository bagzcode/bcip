import { StatusBadge } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateGovernance } from '@/lib/governance-gate';
import {
  createAccessPolicyAction,
  updatePolicyStatusAction,
} from '@/lib/governance/actions';
import {
  DEMO_GOVERNANCE_FALLBACK,
  listAccessPolicies,
  safeQuery,
} from '@/lib/governance/queries';

export default async function GovernanceAccessPage() {
  const locale = await getLocale();
  const manage = await softGateGovernance('governance:manage');
  const policies = await safeQuery(
    async () => {
      const rows = await listAccessPolicies();
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        accessTier: row.accessTier,
        permittedPurposes: row.permittedPurposes ?? [],
        notes: row.notes,
        status: row.status,
      }));
    },
    DEMO_GOVERNANCE_FALLBACK.policies,
  );

  return (
    <div>
      <h2>{t(locale, 'governanceAccessTitle')}</h2>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '42rem' }}>
        {t(locale, 'governanceAccessIntro')}
      </p>

      <ul className="gov-list">
        {policies.map((policy) => (
          <li key={policy.id} className="gov-item">
            <div className="gov-item-head">
              <strong>{policy.name}</strong>
              <StatusBadge tone="access" label="tier">
                {policy.accessTier.replaceAll('_', ' ')}
              </StatusBadge>
              <StatusBadge tone="neutral">{policy.status}</StatusBadge>
            </div>
            <p className="gov-meta">
              Purposes: {(policy.permittedPurposes ?? []).join(', ') || '—'}
            </p>
            {policy.notes ? <p className="gov-notes">{policy.notes}</p> : null}
            {manage.allowed ? (
              <form action={updatePolicyStatusAction} className="gov-inline-form">
                <input type="hidden" name="id" value={policy.id} />
                <label>
                  Status
                  <select name="status" defaultValue={policy.status}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="embargoed">embargoed</option>
                  </select>
                </label>
                <button type="submit">Update</button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {manage.allowed ? (
        <form action={createAccessPolicyAction} className="gov-form panel">
          <h3>{t(locale, 'governanceCreatePolicy')}</h3>
          <label>
            Name
            <input name="name" required placeholder="Demo policy name" />
          </label>
          <label>
            Access tier
            <select name="accessTier" defaultValue="public">
              <option value="public">public</option>
              <option value="registered">registered</option>
              <option value="research_only">research_only</option>
              <option value="partner_only">partner_only</option>
              <option value="culturally_restricted">culturally_restricted</option>
            </select>
          </label>
          <label>
            Permitted purposes (comma-separated)
            <input name="permittedPurposes" placeholder="education, public_display" />
          </label>
          <label>
            Notes
            <input name="notes" defaultValue="DEMO / FICTIONAL — NOT RESEARCH DATA" />
          </label>
          <button type="submit">{t(locale, 'governanceCreatePolicy')}</button>
        </form>
      ) : null}
    </div>
  );
}
