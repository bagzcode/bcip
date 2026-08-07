import { describe, expect, it } from 'vitest';
import {
  DEMO_FICTIONAL_LABEL,
  RESEARCH_SOFTWARE_VERSION,
  assertApprovedExportPurpose,
  assignConditionIndex,
  buildDefaultPerceptionCodebook,
  buildStudyExportBundle,
  studyExportResponsesToCsv,
  studyExportToJson,
  type ExportResponseRow,
} from '../src/index';

const sampleRows: ExportResponseRow[] = [
  {
    participant_pseudonym: 'DEMO-P-001',
    condition_code: 'CW-A',
    stimulus_sample_code: 'DEMO-SAMPLE-A1',
    stimulus_motif_code: 'DEMO-MOTIF-A',
    item_key: 'authenticity',
    construct: 'authenticity',
    value_numeric: 4,
    value_text: null,
    assignment_status: 'completed',
    attention_check_passed: true,
    responded_at: '2026-08-07T00:00:00.000Z',
  },
  {
    participant_pseudonym: 'DEMO-P-001',
    condition_code: 'CW-A',
    stimulus_sample_code: 'DEMO-SAMPLE-A1',
    stimulus_motif_code: 'DEMO-MOTIF-A',
    item_key: 'attention_select_4',
    construct: 'attention',
    value_numeric: 4,
    value_text: null,
    assignment_status: 'completed',
    attention_check_passed: true,
    responded_at: '2026-08-07T00:00:01.000Z',
  },
  {
    participant_pseudonym: 'DEMO-P-002',
    condition_code: 'CW-B',
    stimulus_sample_code: 'DEMO-SAMPLE-A2',
    stimulus_motif_code: 'DEMO-MOTIF-A',
    item_key: 'purchase_intention',
    construct: 'purchase_intention',
    value_numeric: 2,
    value_text: null,
    assignment_status: 'failed_attention',
    attention_check_passed: false,
    responded_at: '2026-08-07T00:00:02.000Z',
  },
];

describe('research export shape', () => {
  it('builds JSON bundle with codebook, responses, and reproducibility manifest', () => {
    const bundle = buildStudyExportBundle({
      studyCode: 'DEMO-STUDY-COLORWAY-001',
      studyTitle: `${DEMO_FICTIONAL_LABEL}: Colorway perception pilot`,
      studyVersionLabel: 'v1.0.0',
      studyVersionNumber: 1,
      softwareVersion: RESEARCH_SOFTWARE_VERSION,
      datasetVersion: 'demo-dataset-v0',
      algorithmVersion: 'balanced-block-v1',
      randomizationSeed: 'demo-seed-colorway-001',
      exportPurpose: 'pilot_publication',
      isDemoFictional: true,
      codebookVariables: buildDefaultPerceptionCodebook(),
      rows: sampleRows,
      consentSummary: {
        consentVersionLabel: 'demo-consent-v1',
        participantsWithApprovedPurpose: 2,
        participantsWithdrawn: 0,
      },
      exportedAt: '2026-08-07T12:00:00.000Z',
    });

    expect(bundle.label).toBe(DEMO_FICTIONAL_LABEL);
    expect(bundle.study_code).toBe('DEMO-STUDY-COLORWAY-001');
    expect(bundle.codebook.variables.some((v) => v.name === 'authenticity')).toBe(true);
    expect(bundle.responses).toHaveLength(3);
    expect(bundle.reproducibility_manifest).toMatchObject({
      software_version: RESEARCH_SOFTWARE_VERSION,
      dataset_version: 'demo-dataset-v0',
      algorithm_version: 'balanced-block-v1',
      randomization_seed: 'demo-seed-colorway-001',
      study_code: 'DEMO-STUDY-COLORWAY-001',
      study_version_label: 'v1.0.0',
      row_count: 3,
      exported_at: '2026-08-07T12:00:00.000Z',
    });
    expect(bundle.reproducibility_manifest.parameters).toMatchObject({
      include_identifiable_fields: false,
      usage_analytics_included: false,
    });
    expect(bundle.consent_linkage.participants_with_approved_purpose).toBe(2);
    expect(bundle.quality_checks.distinct_participants).toBe(2);
    expect(bundle.quality_checks.failed_attention_count).toBe(1);

    const json = JSON.parse(studyExportToJson(bundle)) as typeof bundle;
    expect(json.reproducibility_manifest.software_version).toBe(RESEARCH_SOFTWARE_VERSION);
    expect(json.responses[0]?.participant_pseudonym).toBe('DEMO-P-001');
    expect(JSON.stringify(json)).not.toMatch(/@|vault|email|phone/i);
  });

  it('emits long-format CSV with stable header', () => {
    const csv = studyExportResponsesToCsv(sampleRows);
    const [header, ...lines] = csv.trim().split('\n');
    expect(header).toBe(
      [
        'participant_pseudonym',
        'condition_code',
        'stimulus_sample_code',
        'stimulus_motif_code',
        'item_key',
        'construct',
        'value_numeric',
        'value_text',
        'assignment_status',
        'attention_check_passed',
        'responded_at',
      ].join(','),
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('DEMO-P-001');
    expect(lines[0]).toContain('DEMO-SAMPLE-A1');
  });

  it('assigns conditions deterministically', () => {
    const a = assignConditionIndex('seed', 'DEMO-P-001', 3);
    const b = assignConditionIndex('seed', 'DEMO-P-001', 3);
    const c = assignConditionIndex('seed', 'DEMO-P-002', 3);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(3);
    expect([0, 1, 2]).toContain(c);
  });

  it('rejects unapproved export purposes', () => {
    expect(() => assertApprovedExportPurpose('model_training')).toThrow(
      /EXPORT_PURPOSE_NOT_APPROVED/,
    );
    expect(() => assertApprovedExportPurpose('pilot_publication')).not.toThrow();
  });
});
