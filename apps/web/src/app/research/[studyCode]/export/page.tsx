import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateResearch } from '@/lib/research-gate';
import { getStudyByCode, loadExportRows } from '@/lib/research/queries';
import { computeQualityChecks, type ExportResponseRow } from '@bcip/domain';

type Props = { params: Promise<{ studyCode: string }> };

export default async function ResearchExportPage({ params }: Props) {
  const locale = await getLocale();
  const { studyCode } = await params;
  const exportGate = await softGateResearch('research:export');
  const detail = await getStudyByCode(studyCode).catch(() => null);
  if (!detail?.study || !detail.version) notFound();

  let quality = null as ReturnType<typeof computeQualityChecks> | null;
  if (exportGate.allowed) {
    const loaded = await loadExportRows(studyCode).catch(() => null);
    if (loaded) {
      const rows: ExportResponseRow[] = loaded.rows.map((r) => ({
        participant_pseudonym: r.participantPseudonym,
        condition_code: r.conditionCode,
        stimulus_sample_code: r.samplePublicCode ?? '',
        stimulus_motif_code: r.motifPublicCode,
        item_key: r.itemKey,
        construct: r.construct,
        value_numeric: r.valueNumeric,
        value_text: r.valueText,
        assignment_status: r.assignmentStatus,
        attention_check_passed: r.attentionCheckPassed,
        responded_at: r.respondedAt.toISOString(),
      }));
      quality = computeQualityChecks(rows);
    }
  }

  return (
    <div>
      <p>
        <Link href={`/research/${studyCode}`}>{t(locale, 'researchBack')}</Link>
      </p>
      <h2>{t(locale, 'researchExport')}</h2>
      <p className="research-demo">{t(locale, 'demoBadge')}</p>
      <p className="research-muted">{t(locale, 'researchExportIntro')}</p>

      <dl className="research-dl">
        <div>
          <dt>{t(locale, 'researchSoftwareVersion')}</dt>
          <dd>{detail.version.softwareVersion}</dd>
        </div>
        <div>
          <dt>{t(locale, 'researchDatasetVersion')}</dt>
          <dd>{detail.version.datasetVersion}</dd>
        </div>
        <div>
          <dt>{t(locale, 'researchAlgorithmVersion')}</dt>
          <dd>{detail.version.randomizationAlgorithmVersion}</dd>
        </div>
      </dl>

      {quality ? (
        <section className="research-section">
          <h3>{t(locale, 'researchQuality')}</h3>
          <ul className="research-sublist">
            <li>
              rows: {quality.response_row_count} · participants: {quality.distinct_participants}
            </li>
            <li>
              completed: {quality.completed_assignments} · failed attention:{' '}
              {quality.failed_attention_count}
            </li>
            <li>constructs: {quality.constructs_present.join(', ') || '—'}</li>
          </ul>
        </section>
      ) : null}

      {!exportGate.allowed ? (
        <p className="research-denied">{t(locale, 'researchExportDenied')}</p>
      ) : (
        <p className="research-links">
          <a href={`/api/research/${studyCode}/export?format=json&purpose=pilot_publication`}>
            {t(locale, 'researchExportJson')}
          </a>
          {' · '}
          <a href={`/api/research/${studyCode}/export?format=csv&purpose=pilot_publication`}>
            {t(locale, 'researchExportCsv')}
          </a>
        </p>
      )}
    </div>
  );
}
