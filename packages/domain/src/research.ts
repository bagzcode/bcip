import { DEMO_FICTIONAL_LABEL } from './access';

export const RESEARCH_SOFTWARE_VERSION = 'bcip-research-0.1.0';
export const RESEARCH_RANDOMIZATION_ALGORITHM = 'balanced-block-v1';

export type ResearchConstruct =
  | 'authenticity'
  | 'cultural_identity'
  | 'aesthetic_appeal'
  | 'emotion'
  | 'premium_perception'
  | 'memorability'
  | 'cultural_appropriateness'
  | 'purchase_intention'
  | 'attention';

export type CodebookVariable = {
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'number';
  description: string;
  construct?: ResearchConstruct | string;
  values?: Record<string, string>;
};

export type ExportResponseRow = {
  participant_pseudonym: string;
  condition_code: string;
  stimulus_sample_code: string;
  stimulus_motif_code: string | null;
  item_key: string;
  construct: string | null;
  value_numeric: number | null;
  value_text: string | null;
  assignment_status: string;
  attention_check_passed: boolean | null;
  responded_at: string;
};

export type StudyExportInput = {
  studyCode: string;
  studyTitle: string;
  studyVersionLabel: string;
  studyVersionNumber: number;
  softwareVersion: string;
  datasetVersion: string;
  algorithmVersion: string;
  randomizationSeed: string;
  exportPurpose: string;
  isDemoFictional: boolean;
  codebookVariables: CodebookVariable[];
  rows: ExportResponseRow[];
  /** Consent linkage metadata — never include identifiable vault fields. */
  consentSummary?: {
    consentVersionLabel: string | null;
    participantsWithApprovedPurpose: number;
    participantsWithdrawn: number;
  };
  exportedAt?: string;
};

export type ReproducibilityManifest = {
  software_version: string;
  dataset_version: string;
  algorithm_version: string;
  model_version: string | null;
  prompt_policy_version: string | null;
  randomization_seed: string;
  study_code: string;
  study_version_label: string;
  study_version_number: number;
  export_purpose: string;
  row_count: number;
  exported_at: string;
  label: string;
  parameters: Record<string, unknown>;
};

export type StudyExportBundle = {
  label: string;
  study_code: string;
  study_title: string;
  study_version_label: string;
  exported_at: string;
  export_purpose: string;
  codebook: {
    variables: CodebookVariable[];
    notes: string;
  };
  responses: ExportResponseRow[];
  reproducibility_manifest: ReproducibilityManifest;
  consent_linkage: {
    note: string;
    consent_version_label: string | null;
    participants_with_approved_purpose: number;
    participants_withdrawn: number;
  };
  quality_checks: ResearchQualityChecks;
};

export type ResearchQualityChecks = {
  response_row_count: number;
  distinct_participants: number;
  completed_assignments: number;
  failed_attention_count: number;
  missing_numeric_count: number;
  constructs_present: string[];
};

/** Deterministic condition index from seed + participant key (balanced block). */
export function assignConditionIndex(
  seed: string,
  participantKey: string,
  conditionCount: number,
): number {
  if (conditionCount <= 0) {
    throw new Error('CONDITION_COUNT_INVALID');
  }
  let hash = 2166136261;
  const material = `${seed}:${participantKey}`;
  for (let i = 0; i < material.length; i += 1) {
    hash ^= material.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % conditionCount;
}

export function buildDefaultPerceptionCodebook(): CodebookVariable[] {
  const likert = (construct: ResearchConstruct, name: string, description: string) =>
    ({
      name,
      type: 'integer' as const,
      description,
      construct,
      values: {
        '1': 'Strongly disagree',
        '2': 'Disagree',
        '3': 'Neutral',
        '4': 'Agree',
        '5': 'Strongly agree',
      },
    }) satisfies CodebookVariable;

  return [
    {
      name: 'participant_pseudonym',
      type: 'string',
      description: 'Pseudonymous participant ID (no PII).',
    },
    {
      name: 'condition_code',
      type: 'string',
      description: 'Assigned experimental condition / colorway code.',
    },
    {
      name: 'stimulus_sample_code',
      type: 'string',
      description: 'Immutable catalogue sample public code used as stimulus.',
    },
    {
      name: 'stimulus_motif_code',
      type: 'string',
      description: 'Immutable catalogue motif public code.',
    },
    {
      name: 'item_key',
      type: 'string',
      description: 'Instrument item key.',
    },
    {
      name: 'construct',
      type: 'string',
      description: 'Measured construct.',
    },
    {
      name: 'value_numeric',
      type: 'integer',
      description: 'Likert or attention numeric response.',
    },
    {
      name: 'value_text',
      type: 'string',
      description: 'Optional free-text response.',
    },
    {
      name: 'assignment_status',
      type: 'string',
      description: 'Assignment completion status.',
    },
    {
      name: 'attention_check_passed',
      type: 'boolean',
      description: 'Whether attention checks passed for the assignment.',
    },
    {
      name: 'responded_at',
      type: 'string',
      description: 'ISO-8601 response timestamp.',
    },
    likert('authenticity', 'authenticity', 'Perceived authenticity of the colorway.'),
    likert('cultural_identity', 'cultural_identity', 'Perceived cultural identity fit.'),
    likert('aesthetic_appeal', 'aesthetic_appeal', 'Aesthetic appeal rating.'),
    likert('emotion', 'emotion', 'Positive emotional response.'),
    likert('premium_perception', 'premium_perception', 'Premium / quality perception.'),
    likert('memorability', 'memorability', 'Memorability of the colorway.'),
    likert(
      'cultural_appropriateness',
      'cultural_appropriateness',
      'Perceived cultural appropriateness.',
    ),
    likert('purchase_intention', 'purchase_intention', 'Purchase intention.'),
    {
      name: 'attention_select_4',
      type: 'integer',
      description: 'Attention check — expected value 4.',
      construct: 'attention',
      values: { '4': 'Expected selection' },
    },
  ];
}

export function computeQualityChecks(rows: ExportResponseRow[]): ResearchQualityChecks {
  const participants = new Set(rows.map((r) => r.participant_pseudonym));
  const completed = new Set(
    rows.filter((r) => r.assignment_status === 'completed').map((r) => r.participant_pseudonym),
  );
  const failedAttention = new Set(
    rows
      .filter((r) => r.attention_check_passed === false)
      .map((r) => r.participant_pseudonym),
  );
  const constructs = [
    ...new Set(rows.map((r) => r.construct).filter((c): c is string => Boolean(c))),
  ].sort();

  return {
    response_row_count: rows.length,
    distinct_participants: participants.size,
    completed_assignments: completed.size,
    failed_attention_count: failedAttention.size,
    missing_numeric_count: rows.filter((r) => r.value_numeric === null && !r.value_text).length,
    constructs_present: constructs,
  };
}

export function buildReproducibilityManifest(input: StudyExportInput): ReproducibilityManifest {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  return {
    software_version: input.softwareVersion,
    dataset_version: input.datasetVersion,
    algorithm_version: input.algorithmVersion,
    model_version: null,
    prompt_policy_version: null,
    randomization_seed: input.randomizationSeed,
    study_code: input.studyCode,
    study_version_label: input.studyVersionLabel,
    study_version_number: input.studyVersionNumber,
    export_purpose: input.exportPurpose,
    row_count: input.rows.length,
    exported_at: exportedAt,
    label: input.isDemoFictional
      ? DEMO_FICTIONAL_LABEL
      : 'Research export reproducibility manifest',
    parameters: {
      include_identifiable_fields: false,
      usage_analytics_included: false,
      response_shape: 'long',
    },
  };
}

export function buildStudyExportBundle(input: StudyExportInput): StudyExportBundle {
  if (input.isDemoFictional) {
    // Enforce demo labelling for fictional pilot studies.
    if (!input.studyTitle.includes('DEMO') && !input.studyTitle.includes('FICTIONAL')) {
      throw new Error(`Demo study title must carry fictional label marker`);
    }
  }

  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const manifest = buildReproducibilityManifest({ ...input, exportedAt });
  const consent = input.consentSummary ?? {
    consentVersionLabel: null,
    participantsWithApprovedPurpose: 0,
    participantsWithdrawn: 0,
  };

  return {
    label: input.isDemoFictional ? DEMO_FICTIONAL_LABEL : 'Research export',
    study_code: input.studyCode,
    study_title: input.studyTitle,
    study_version_label: input.studyVersionLabel,
    exported_at: exportedAt,
    export_purpose: input.exportPurpose,
    codebook: {
      variables: input.codebookVariables,
      notes:
        'Response exports use pseudonyms only. Identifiable identity-store references and consent document bodies are excluded.',
    },
    responses: input.rows,
    reproducibility_manifest: manifest,
    consent_linkage: {
      note: 'Consent status is summarized separately from response rows; no PII is included.',
      consent_version_label: consent.consentVersionLabel,
      participants_with_approved_purpose: consent.participantsWithApprovedPurpose,
      participants_withdrawn: consent.participantsWithdrawn,
    },
    quality_checks: computeQualityChecks(input.rows),
  };
}

export function studyExportToJson(bundle: StudyExportBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

const CSV_COLUMNS: (keyof ExportResponseRow)[] = [
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
];

function csvEscape(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Long-format response CSV (codebook and manifest shipped alongside in JSON/bundle). */
export function studyExportResponsesToCsv(rows: ExportResponseRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((col) => csvEscape(row[col] as string | number | boolean | null)).join(','),
  );
  return `${[header, ...lines].join('\n')}\n`;
}

export function assertApprovedExportPurpose(purpose: string): void {
  const allowed = new Set([
    'noncommercial_research',
    'education',
    'pilot_publication',
    'data_quality_review',
  ]);
  if (!allowed.has(purpose)) {
    throw new Error(`EXPORT_PURPOSE_NOT_APPROVED:${purpose}`);
  }
}
