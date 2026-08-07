import { asc, eq } from 'drizzle-orm';
import {
  conditions,
  instrumentItems,
  instruments,
  participants,
  responses,
  stimuli,
  stimulusSets,
  studies,
  studyAssignments,
  studyVersions,
} from '@bcip/db';
import { getDb } from '../db';

export type StudyListItem = {
  id: string;
  publicCode: string;
  title: string;
  description: string | null;
  status: string;
  isDemoFictional: boolean;
  versionLabel: string | null;
  versionNumber: number | null;
};

export async function listStudies(): Promise<StudyListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: studies.id,
      publicCode: studies.publicCode,
      title: studies.title,
      description: studies.description,
      status: studies.status,
      isDemoFictional: studies.isDemoFictional,
      versionLabel: studyVersions.versionLabel,
      versionNumber: studyVersions.versionNumber,
    })
    .from(studies)
    .leftJoin(studyVersions, eq(studyVersions.studyId, studies.id))
    .orderBy(asc(studies.publicCode));

  const byCode = new Map<string, StudyListItem>();
  for (const row of rows) {
    const prev = byCode.get(row.publicCode);
    if (!prev || (row.versionNumber ?? 0) > (prev.versionNumber ?? 0)) {
      byCode.set(row.publicCode, row);
    }
  }
  return [...byCode.values()];
}

export async function getStudyByCode(publicCode: string) {
  const db = getDb();
  const [study] = await db
    .select()
    .from(studies)
    .where(eq(studies.publicCode, publicCode))
    .limit(1);
  if (!study) return null;

  const versions = await db
    .select()
    .from(studyVersions)
    .where(eq(studyVersions.studyId, study.id))
    .orderBy(asc(studyVersions.versionNumber));
  const version = versions[versions.length - 1];
  if (!version) return { study, version: null, protocol: null };

  const [instrumentRows, conditionRows, setRows, participantRows] = await Promise.all([
    db
      .select()
      .from(instruments)
      .where(eq(instruments.studyVersionId, version.id))
      .orderBy(asc(instruments.sortOrder)),
    db
      .select()
      .from(conditions)
      .where(eq(conditions.studyVersionId, version.id))
      .orderBy(asc(conditions.sortOrder)),
    db.select().from(stimulusSets).where(eq(stimulusSets.studyVersionId, version.id)),
    db
      .select({
        id: participants.id,
        pseudonym: participants.pseudonym,
        consentVersionLabel: participants.consentVersionLabel,
        consentStatus: participants.consentStatus,
        consentPurposeApproved: participants.consentPurposeApproved,
        status: participants.status,
        identifiableVaultRef: participants.identifiableVaultRef,
      })
      .from(participants)
      .where(eq(participants.studyId, study.id))
      .orderBy(asc(participants.pseudonym)),
  ]);

  const instrumentIds = instrumentRows.map((i) => i.id);
  const items =
    instrumentIds.length === 0
      ? []
      : await db
          .select()
          .from(instrumentItems)
          .where(eq(instrumentItems.instrumentId, instrumentIds[0]!))
          .orderBy(asc(instrumentItems.sortOrder));

  // If multiple instruments, load all items
  let allItems = items;
  if (instrumentIds.length > 1) {
    allItems = [];
    for (const id of instrumentIds) {
      const rows = await db
        .select()
        .from(instrumentItems)
        .where(eq(instrumentItems.instrumentId, id))
        .orderBy(asc(instrumentItems.sortOrder));
      allItems.push(...rows);
    }
  }

  const stimulusRows =
    setRows.length === 0
      ? []
      : await db
          .select({
            id: stimuli.id,
            label: stimuli.label,
            samplePublicCode: stimuli.samplePublicCode,
            motifPublicCode: stimuli.motifPublicCode,
            conditionId: stimuli.conditionId,
            conditionCode: conditions.code,
            sortOrder: stimuli.sortOrder,
          })
          .from(stimuli)
          .innerJoin(conditions, eq(stimuli.conditionId, conditions.id))
          .where(eq(stimuli.stimulusSetId, setRows[0]!.id))
          .orderBy(asc(stimuli.sortOrder));

  const assignments = await db
    .select({
      id: studyAssignments.id,
      participantId: studyAssignments.participantId,
      conditionId: studyAssignments.conditionId,
      status: studyAssignments.status,
      attentionCheckPassed: studyAssignments.attentionCheckPassed,
      conditionCode: conditions.code,
      participantPseudonym: participants.pseudonym,
    })
    .from(studyAssignments)
    .innerJoin(conditions, eq(studyAssignments.conditionId, conditions.id))
    .innerJoin(participants, eq(studyAssignments.participantId, participants.id))
    .where(eq(studyAssignments.studyVersionId, version.id))
    .orderBy(asc(participants.pseudonym));

  return {
    study,
    version,
    protocol: {
      instruments: instrumentRows,
      items: allItems,
      conditions: conditionRows,
      stimulusSets: setRows,
      stimuli: stimulusRows,
      participants: participantRows.map((p) => ({
        ...p,
        // Never surface vault refs in UI lists (should be null in demo).
        identifiableVaultRef: p.identifiableVaultRef ? '[redacted]' : null,
      })),
      assignments,
    },
  };
}

export async function getCollectContext(publicCode: string, pseudonym: string) {
  const detail = await getStudyByCode(publicCode);
  if (!detail?.version || !detail.protocol) return null;

  const participant = detail.protocol.participants.find((p) => p.pseudonym === pseudonym);
  if (!participant) return null;

  const assignment = detail.protocol.assignments.find((a) => a.participantId === participant.id);
  if (!assignment) return null;

  const stimulus = detail.protocol.stimuli.find((s) => s.conditionId === assignment.conditionId);

  return {
    study: detail.study,
    version: detail.version,
    items: detail.protocol.items,
    participant,
    assignment,
    stimulus,
    condition: detail.protocol.conditions.find((c) => c.id === assignment.conditionId),
  };
}

export async function loadExportRows(studyCode: string) {
  const detail = await getStudyByCode(studyCode);
  if (!detail?.version || !detail.protocol) return null;

  const db = getDb();
  const rows = await db
    .select({
      participantPseudonym: participants.pseudonym,
      conditionCode: conditions.code,
      samplePublicCode: stimuli.samplePublicCode,
      motifPublicCode: stimuli.motifPublicCode,
      itemKey: instrumentItems.itemKey,
      construct: instrumentItems.construct,
      valueNumeric: responses.valueNumeric,
      valueText: responses.valueText,
      assignmentStatus: studyAssignments.status,
      attentionCheckPassed: studyAssignments.attentionCheckPassed,
      respondedAt: responses.respondedAt,
      consentVersionLabel: participants.consentVersionLabel,
      consentStatus: participants.consentStatus,
      consentPurposeApproved: participants.consentPurposeApproved,
      participantStatus: participants.status,
    })
    .from(responses)
    .innerJoin(studyAssignments, eq(responses.studyAssignmentId, studyAssignments.id))
    .innerJoin(participants, eq(responses.participantId, participants.id))
    .innerJoin(conditions, eq(studyAssignments.conditionId, conditions.id))
    .innerJoin(instrumentItems, eq(responses.instrumentItemId, instrumentItems.id))
    .leftJoin(stimuli, eq(studyAssignments.stimulusId, stimuli.id))
    .where(eq(studyAssignments.studyVersionId, detail.version.id))
    .orderBy(asc(participants.pseudonym), asc(instrumentItems.sortOrder));

  return { detail, rows };
}
