import {
  assertApprovedExportPurpose,
  assertCan,
  buildDefaultPerceptionCodebook,
  buildStudyExportBundle,
  studyExportResponsesToCsv,
  studyExportToJson,
  type ActorContext,
  type ExportResponseRow,
} from '@bcip/domain';
import { auditEvents, datasetExports, reproducibilityManifests } from '@bcip/db';
import { buildAuditEvent } from '@bcip/domain';
import { getDb } from '../db';
import { loadExportRows } from './queries';

export async function buildStudyExportForActor(
  actor: ActorContext,
  studyCode: string,
  format: 'json' | 'csv',
  exportPurpose = 'pilot_publication',
) {
  assertCan(actor, 'research:export');
  assertApprovedExportPurpose(exportPurpose);

  const loaded = await loadExportRows(studyCode);
  if (!loaded?.detail.version) {
    throw new Error('STUDY_NOT_FOUND');
  }
  const { detail, rows } = loaded;
  const { study, version, protocol } = detail;

  const exportRows: ExportResponseRow[] = rows.map((r) => ({
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

  const participants = protocol?.participants ?? [];
  const bundle = buildStudyExportBundle({
    studyCode: study.publicCode,
    studyTitle: study.title,
    studyVersionLabel: version.versionLabel,
    studyVersionNumber: version.versionNumber,
    softwareVersion: version.softwareVersion,
    datasetVersion: version.datasetVersion,
    algorithmVersion: version.randomizationAlgorithmVersion,
    randomizationSeed: version.randomizationSeed,
    exportPurpose,
    isDemoFictional: study.isDemoFictional,
    codebookVariables: buildDefaultPerceptionCodebook(),
    rows: exportRows,
    consentSummary: {
      consentVersionLabel: participants[0]?.consentVersionLabel ?? null,
      participantsWithApprovedPurpose: participants.filter((p) => p.consentPurposeApproved).length,
      participantsWithdrawn: participants.filter(
        (p) => p.status === 'withdrawn' || p.consentStatus === 'withdrawn',
      ).length,
    },
  });

  const db = getDb();
  const [exportRow] = await db
    .insert(datasetExports)
    .values({
      studyVersionId: version.id,
      exportPurpose,
      format: format === 'csv' ? 'csv' : 'json',
      status: 'ready',
      codebookJson: bundle.codebook,
      rowCount: exportRows.length,
      approvedByUserId: actor.userId,
      auditedAt: new Date(),
      isDemoFictional: study.isDemoFictional,
    })
    .returning();

  await db.insert(reproducibilityManifests).values({
    datasetExportId: exportRow!.id,
    studyVersionId: version.id,
    softwareVersion: bundle.reproducibility_manifest.software_version,
    datasetVersion: bundle.reproducibility_manifest.dataset_version,
    algorithmVersion: bundle.reproducibility_manifest.algorithm_version,
    modelVersion: bundle.reproducibility_manifest.model_version,
    promptPolicyVersion: bundle.reproducibility_manifest.prompt_policy_version,
    parametersJson: bundle.reproducibility_manifest.parameters,
    randomizationSeed: bundle.reproducibility_manifest.randomization_seed,
    exportedAt: new Date(bundle.reproducibility_manifest.exported_at),
  });

  const audit = buildAuditEvent({
    actorUserId: actor.userId,
    action: 'research.export',
    entityType: 'study',
    entityId: study.id,
    metadata: {
      studyCode: study.publicCode,
      format,
      exportPurpose,
      rowCount: exportRows.length,
      exportId: exportRow!.id,
      isDemoFictional: study.isDemoFictional,
    },
  });
  await db.insert(auditEvents).values(audit);

  if (format === 'csv') {
    const codebookJson = JSON.stringify(
      {
        codebook: bundle.codebook,
        reproducibility_manifest: bundle.reproducibility_manifest,
        quality_checks: bundle.quality_checks,
        consent_linkage: bundle.consent_linkage,
        label: bundle.label,
      },
      null,
      2,
    );
    // CSV body is responses; sidecar metadata prepended as comment header block is awkward —
    // ship responses CSV; JSON format carries full bundle. Also attach manifest as second part via JSON.
    const body = [
      `# ${bundle.label}`,
      `# codebook+manifest available via format=json`,
      `# software_version=${bundle.reproducibility_manifest.software_version}`,
      `# dataset_version=${bundle.reproducibility_manifest.dataset_version}`,
      studyExportResponsesToCsv(exportRows).trimEnd(),
      '',
      '# --- reproducibility_manifest_json ---',
      codebookJson,
    ].join('\n');
    return {
      body,
      contentType: 'text/csv; charset=utf-8',
      filename: `${study.publicCode}-responses.csv`,
    };
  }

  return {
    body: studyExportToJson(bundle),
    contentType: 'application/json; charset=utf-8',
    filename: `${study.publicCode}-export.json`,
  };
}
