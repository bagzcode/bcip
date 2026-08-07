import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getStudyByCode } from '@/lib/research/queries';

type Props = { params: Promise<{ studyCode: string }> };

export default async function ResearchStudyPage({ params }: Props) {
  const locale = await getLocale();
  const { studyCode } = await params;
  const detail = await getStudyByCode(studyCode).catch(() => null);
  if (!detail?.study || !detail.version || !detail.protocol) notFound();

  const { study, version, protocol } = detail;
  const completed = protocol.assignments.filter((a) => a.status === 'completed').length;
  const failedAttention = protocol.assignments.filter(
    (a) => a.status === 'failed_attention',
  ).length;

  return (
    <div>
      <p>
        <Link href="/research">{t(locale, 'researchBack')}</Link>
      </p>
      <h2>{study.title}</h2>
      <p className="research-meta">
        {study.publicCode} · {version.versionLabel} · {study.status}
      </p>
      {study.isDemoFictional ? <p className="research-demo">{t(locale, 'demoBadge')}</p> : null}
      <p>{study.description}</p>

      <section className="research-section">
        <h3>{t(locale, 'researchProtocolHeading')}</h3>
        <p>{version.protocolSummary}</p>
        <dl className="research-dl">
          <div>
            <dt>{t(locale, 'researchSoftwareVersion')}</dt>
            <dd>{version.softwareVersion}</dd>
          </div>
          <div>
            <dt>{t(locale, 'researchDatasetVersion')}</dt>
            <dd>{version.datasetVersion}</dd>
          </div>
          <div>
            <dt>{t(locale, 'researchAlgorithmVersion')}</dt>
            <dd>{version.randomizationAlgorithmVersion}</dd>
          </div>
          <div>
            <dt>{t(locale, 'researchRandomSeed')}</dt>
            <dd>
              <code>{version.randomizationSeed}</code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="research-section">
        <h3>{t(locale, 'researchConditionsHeading')}</h3>
        <ul className="research-sublist">
          {protocol.conditions.map((c) => (
            <li key={c.id}>
              <strong>{c.code}</strong> — {c.label}
              {c.description ? ` · ${c.description}` : ''}
            </li>
          ))}
        </ul>
        <h4>{t(locale, 'researchStimuliHeading')}</h4>
        <ul className="research-sublist">
          {protocol.stimuli.map((s) => (
            <li key={s.id}>
              {s.conditionCode}: {s.samplePublicCode}
              {s.motifPublicCode ? ` (${s.motifPublicCode})` : ''} — {s.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="research-section">
        <h3>{t(locale, 'researchInstrumentHeading')}</h3>
        {protocol.instruments.map((inst) => (
          <div key={inst.id}>
            <p>
              <strong>{inst.code}</strong> — {inst.title}
            </p>
            <ul className="research-sublist">
              {protocol.items
                .filter((item) => item.instrumentId === inst.id)
                .map((item) => (
                  <li key={item.id}>
                    <code>{item.itemKey}</code>
                    {item.construct ? ` [${item.construct}]` : ''}: {item.prompt}
                    {item.isAttentionCheck ? ' · attention' : ''}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="research-section">
        <h3>{t(locale, 'researchParticipantsHeading')}</h3>
        <p className="research-muted">{t(locale, 'researchConsentNote')}</p>
        <p className="research-meta">
          {t(locale, 'researchQuality')}: {completed} completed · {failedAttention} failed
          attention · {protocol.participants.length} participants
        </p>
        <ul className="research-sublist">
          {protocol.assignments.map((a) => (
            <li key={a.id}>
              <code>{a.participantPseudonym}</code> → {a.conditionCode} · {a.status}
              {a.attentionCheckPassed === false ? ' · attention fail' : ''}
            </li>
          ))}
        </ul>
      </section>

      <p className="research-links">
        <Link href={`/research/${study.publicCode}/collect`}>{t(locale, 'researchCollect')}</Link>
        {' · '}
        <Link href={`/research/${study.publicCode}/export`}>{t(locale, 'researchExport')}</Link>
      </p>
    </div>
  );
}
