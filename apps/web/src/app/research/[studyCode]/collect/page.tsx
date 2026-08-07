import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateResearch } from '@/lib/research-gate';
import { submitResearchResponsesAction } from '@/lib/research/actions';
import { getCollectContext, getStudyByCode } from '@/lib/research/queries';

type Props = {
  params: Promise<{ studyCode: string }>;
  searchParams: Promise<{ pseudonym?: string }>;
};

export default async function ResearchCollectPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const { studyCode } = await params;
  const { pseudonym: rawPseudonym } = await searchParams;
  const collectGate = await softGateResearch('research:collect');

  const detail = await getStudyByCode(studyCode).catch(() => null);
  if (!detail?.study || !detail.protocol) notFound();

  const pseudonyms = detail.protocol.participants.map((p) => p.pseudonym);
  const pseudonym = rawPseudonym && pseudonyms.includes(rawPseudonym) ? rawPseudonym : pseudonyms[0];
  const ctx = pseudonym ? await getCollectContext(studyCode, pseudonym) : null;

  if (!collectGate.allowed) {
    return (
      <div>
        <p>
          <Link href={`/research/${studyCode}`}>{t(locale, 'researchBack')}</Link>
        </p>
        <p className="research-denied">{t(locale, 'researchCollectDenied')}</p>
      </div>
    );
  }

  return (
    <div>
      <p>
        <Link href={`/research/${studyCode}`}>{t(locale, 'researchBack')}</Link>
      </p>
      <h2>{t(locale, 'researchCollect')}</h2>
      <p className="research-demo">{t(locale, 'demoBadge')}</p>
      <p className="research-muted">{t(locale, 'researchCollectIntro')}</p>

      <form method="get" className="research-form">
        <label>
          {t(locale, 'researchPseudonym')}
          <select name="pseudonym" defaultValue={pseudonym ?? ''}>
            {pseudonyms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t(locale, 'researchLoadAssignment')}</button>
      </form>

      {ctx ? (
        <div className="research-section">
          <p className="research-meta">
            {ctx.condition?.code} · {ctx.stimulus?.samplePublicCode} · {ctx.assignment.status}
          </p>
          <form
            action={async (formData) => {
              'use server';
              await submitResearchResponsesAction(formData);
            }}
            className="research-form"
          >
            <input type="hidden" name="studyCode" value={studyCode} />
            <input type="hidden" name="pseudonym" value={ctx.participant.pseudonym} />
            {ctx.items.map((item) => (
              <label key={item.id}>
                <span>
                  {item.prompt}
                  {item.isAttentionCheck ? ' *' : ''}
                </span>
                <select name={`item_${item.itemKey}`} defaultValue="3" required>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                      {item.scaleLabels?.[String(n)] ? ` — ${item.scaleLabels[String(n)]}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="submit">{t(locale, 'researchSubmitResponses')}</button>
          </form>
        </div>
      ) : (
        <p className="research-muted">{t(locale, 'researchNoAssignment')}</p>
      )}
    </div>
  );
}
