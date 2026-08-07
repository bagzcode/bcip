import { describe, expect, it } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  accessPolicies,
  answerCitations,
  answerFeedback,
  artisans,
  assets,
  assistantRuns,
  auditEvents,
  chatMessages,
  chatSessions,
  claimSources,
  collections,
  colorAnalyses,
  colorAnalysisJobs,
  colorComparisons,
  colorFeatures,
  conditions,
  consentRecords,
  contributors,
  datasetExports,
  designLayers,
  designPaletteMappings,
  designPreviews,
  designProjects,
  designVersions,
  garmentRegions,
  garmentTemplates,
  instrumentItems,
  instruments,
  knowledgeClaims,
  linenItems,
  memberships,
  motifs,
  participants,
  personalCollections,
  reproducibilityManifests,
  responses,
  retrievalResults,
  samples,
  sources,
  stimuli,
  stimulusSets,
  studies,
  studyAssignments,
  studyVersions,
  tierGrants,
} from '../src/schema/index';

describe('schema', () => {
  it('exposes Phase 0 catalogue tables', () => {
    expect(getTableName(collections)).toBe('collections');
    expect(getTableName(motifs)).toBe('motifs');
    expect(getTableName(samples)).toBe('samples');
    expect(getTableName(assets)).toBe('assets');
  });

  it('exposes Motif Explorer Storyboard tables', () => {
    expect(getTableName(artisans)).toBe('artisans');
    expect(getTableName(linenItems)).toBe('linen_items');
  });

  it('exposes Phase 1 governance tables', () => {
    expect(getTableName(accessPolicies)).toBe('access_policies');
    expect(getTableName(tierGrants)).toBe('tier_grants');
    expect(getTableName(contributors)).toBe('contributors');
    expect(getTableName(consentRecords)).toBe('consent_records');
    expect(getTableName(sources)).toBe('sources');
    expect(getTableName(knowledgeClaims)).toBe('knowledge_claims');
    expect(getTableName(claimSources)).toBe('claim_sources');
    expect(getTableName(personalCollections)).toBe('personal_collections');
    expect(getTableName(memberships)).toBe('memberships');
    expect(getTableName(auditEvents)).toBe('audit_events');
  });

  it('exposes Phase 3 Lasem Guru chat tables', () => {
    expect(getTableName(chatSessions)).toBe('chat_sessions');
    expect(getTableName(chatMessages)).toBe('chat_messages');
    expect(getTableName(assistantRuns)).toBe('assistant_runs');
    expect(getTableName(retrievalResults)).toBe('retrieval_results');
    expect(getTableName(answerCitations)).toBe('answer_citations');
    expect(getTableName(answerFeedback)).toBe('answer_feedback');
  });

  it('exposes Phase 4 Dress Weaver tables', () => {
    expect(getTableName(garmentTemplates)).toBe('garment_templates');
    expect(getTableName(garmentRegions)).toBe('garment_regions');
    expect(getTableName(designProjects)).toBe('design_projects');
    expect(getTableName(designVersions)).toBe('design_versions');
    expect(getTableName(designLayers)).toBe('design_layers');
    expect(getTableName(designPaletteMappings)).toBe('design_palette_mappings');
    expect(getTableName(designPreviews)).toBe('design_previews');
  });

  it('exposes Phase 5 research lab tables', () => {
    expect(getTableName(studies)).toBe('studies');
    expect(getTableName(studyVersions)).toBe('study_versions');
    expect(getTableName(instruments)).toBe('instruments');
    expect(getTableName(instrumentItems)).toBe('instrument_items');
    expect(getTableName(conditions)).toBe('conditions');
    expect(getTableName(stimulusSets)).toBe('stimulus_sets');
    expect(getTableName(stimuli)).toBe('stimuli');
    expect(getTableName(participants)).toBe('participants');
    expect(getTableName(studyAssignments)).toBe('study_assignments');
    expect(getTableName(responses)).toBe('responses');
    expect(getTableName(datasetExports)).toBe('dataset_exports');
    expect(getTableName(reproducibilityManifests)).toBe('reproducibility_manifests');
  });
});
