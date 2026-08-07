import type { AccessTier, ReviewStatus } from '@bcip/contracts';
import {
  canAccessResource,
  type ActorContext,
  DEMO_FICTIONAL_LABEL,
} from './access';

export const LASEM_GURU_PROMPT_VERSION = 'lasem-guru-prompt-v1';
export const LASEM_GURU_POLICY_VERSION = 'lasem-guru-policy-v1';
export const MOCK_PROVIDER = 'mock';
export const MOCK_MODEL = 'bcip-mock-grounded-v1';
export const LOCAL_PROVIDER = 'local';
export const LOCAL_MODEL_STUB = 'bcip-local-stub-v0';

export type EvidenceLabel =
  | 'documented_claim'
  | 'contributor_interpretation'
  | 'inference'
  | 'contested_claim'
  | 'insufficient_evidence';

export type GroundingResult =
  | 'grounded'
  | 'insufficient_evidence'
  | 'refused'
  | 'contested';

export type ClaimType =
  | 'documented'
  | 'contributor_interpretation'
  | 'inferred'
  | 'contested';

export type RetrievableFragment = {
  id: string;
  fragmentKey: string;
  textExcerpt: string;
  language: string;
  accessTier: AccessTier;
  sourcePublicCode: string;
  sourceTitle: string;
  citation: string;
  sourceReviewStatus: ReviewStatus;
  isDemoFictional: boolean;
  claimId?: string | null;
  claimType?: ClaimType | null;
  claimConfidence?: string | null;
  claimReviewStatus?: ReviewStatus | null;
};

export type RankedFragment = RetrievableFragment & {
  rank: number;
  score: number;
};

export type AnswerCitation = {
  sourceFragmentId: string;
  sourcePublicCode: string;
  citation: string;
  fragmentKey: string;
  excerpt: string;
  evidenceLabel: EvidenceLabel;
  claimId?: string | null;
  accessTier: AccessTier;
};

export type GroundedAnswer = {
  groundingResult: GroundingResult;
  evidenceLabel: EvidenceLabel;
  confidence: 'none' | 'low' | 'medium' | 'high';
  answerText: string;
  citations: AnswerCitation[];
  retrieval: RankedFragment[];
  provider: string;
  model: string;
  promptVersion: string;
  policyVersion: string;
};

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'of',
  'in',
  'on',
  'for',
  'to',
  'and',
  'or',
  'what',
  'how',
  'about',
  'does',
  'do',
  'did',
  'dengan',
  'yang',
  'dari',
  'untuk',
  'apa',
  'bagaimana',
  'adalah',
  'ini',
  'itu',
]);

const APPROVED_REVIEW = new Set<ReviewStatus>(['approved', 'approved_with_scope', 'contested']);

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function haystackWords(fragment: RetrievableFragment): Set<string> {
  const raw = [
    fragment.fragmentKey,
    fragment.textExcerpt,
    fragment.sourcePublicCode,
    fragment.sourceTitle,
    fragment.citation,
  ]
    .join(' ')
    .toLowerCase();
  return new Set(tokenizeQuery(raw));
}

export function countFragmentQueryHits(query: string, fragment: RetrievableFragment): number {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return 0;
  const words = haystackWords(fragment);
  let hits = 0;
  for (const token of tokens) {
    // Whole-token match only (avoid "mean" matching "meaning").
    if (words.has(token)) hits += 1;
  }
  return hits;
}

export function scoreFragmentAgainstQuery(query: string, fragment: RetrievableFragment): number {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return 0;
  return countFragmentQueryHits(query, fragment) / tokens.length;
}

/**
 * Access-filter before ranking. Never expose culturally_restricted without grant.
 * Only approved (or contested-approved-scope) demo/source rows are retrievable for RAG.
 */
export function filterRetrievableFragments(
  actor: ActorContext,
  fragments: RetrievableFragment[],
): RetrievableFragment[] {
  return fragments.filter((fragment) => {
    if (!APPROVED_REVIEW.has(fragment.sourceReviewStatus)) return false;
    if (fragment.claimReviewStatus && !APPROVED_REVIEW.has(fragment.claimReviewStatus)) {
      return false;
    }
    return canAccessResource(actor, fragment.accessTier).allowed;
  });
}

export function retrieveGroundedFragments(
  actor: ActorContext,
  fragments: RetrievableFragment[],
  query: string,
  limit = 5,
  minScore = 0.4,
): RankedFragment[] {
  const tokens = tokenizeQuery(query);
  const minHits = Math.min(2, Math.max(1, tokens.length));
  const permitted = filterRetrievableFragments(actor, fragments);
  const scored = permitted
    .map((fragment) => {
      const hits = countFragmentQueryHits(query, fragment);
      const score = tokens.length ? hits / tokens.length : 0;
      return { fragment, score, hits };
    })
    .filter((row) => row.score >= minScore && row.hits >= minHits)
    .sort((a, b) => b.score - a.score || b.hits - a.hits)
    .slice(0, limit);

  return scored.map((row, index) => ({
    ...row.fragment,
    score: row.score,
    rank: index + 1,
  }));
}

function claimTypeToEvidenceLabel(claimType: ClaimType | null | undefined): EvidenceLabel {
  switch (claimType) {
    case 'contributor_interpretation':
      return 'contributor_interpretation';
    case 'inferred':
      return 'inference';
    case 'contested':
      return 'contested_claim';
    case 'documented':
    default:
      return 'documented_claim';
  }
}

function mapConfidence(
  grounding: GroundingResult,
  top?: RankedFragment,
): GroundedAnswer['confidence'] {
  if (grounding !== 'grounded' && grounding !== 'contested') return 'none';
  if (!top) return 'low';
  if (top.claimConfidence === 'high' || top.score >= 0.75) return 'high';
  if (top.claimConfidence === 'medium' || top.score >= 0.5) return 'medium';
  return 'low';
}

function refuseText(locale: 'en' | 'id'): string {
  if (locale === 'id') {
    return `${DEMO_FICTIONAL_LABEL}. Tidak ada bukti sumber yang disetujui untuk menjawab pertanyaan ini. Saya tidak akan menebak makna budaya.`;
  }
  return `${DEMO_FICTIONAL_LABEL}. There is insufficient approved source evidence to answer this question. I will not invent cultural meanings.`;
}

function groundedText(locale: 'en' | 'id', fragments: RankedFragment[]): string {
  const body = fragments
    .map((f, i) => `[${i + 1}] ${f.textExcerpt}`)
    .join('\n\n');
  if (locale === 'id') {
    return `${DEMO_FICTIONAL_LABEL}. Jawaban berikut hanya merangkum fragmen sumber yang diizinkan:\n\n${body}`;
  }
  return `${DEMO_FICTIONAL_LABEL}. The following answer is grounded only in permitted source fragments:\n\n${body}`;
}

function contestedText(locale: 'en' | 'id', fragments: RankedFragment[]): string {
  const body = fragments
    .map((f, i) => `[${i + 1}] (${f.claimType ?? 'documented'}) ${f.textExcerpt}`)
    .join('\n\n');
  if (locale === 'id') {
    return `${DEMO_FICTIONAL_LABEL}. Catatan: sumber yang disetujui menunjukkan interpretasi yang berbeda:\n\n${body}`;
  }
  return `${DEMO_FICTIONAL_LABEL}. Note: approved sources show differing interpretations:\n\n${body}`;
}

function toCitations(fragments: RankedFragment[]): AnswerCitation[] {
  return fragments.map((f) => ({
    sourceFragmentId: f.id,
    sourcePublicCode: f.sourcePublicCode,
    citation: f.citation,
    fragmentKey: f.fragmentKey,
    excerpt: f.textExcerpt,
    evidenceLabel: claimTypeToEvidenceLabel(f.claimType),
    claimId: f.claimId ?? null,
    accessTier: f.accessTier,
  }));
}

/**
 * Deterministic mock provider: answers only from retrieved permitted fragments.
 * Never fabricates beyond quoting/summarizing those excerpts.
 */
export function mockAnswerFromRetrieval(input: {
  query: string;
  locale: 'en' | 'id';
  retrieval: RankedFragment[];
  provider?: string;
  model?: string;
}): GroundedAnswer {
  const provider = input.provider ?? MOCK_PROVIDER;
  const model = input.model ?? MOCK_MODEL;
  const base = {
    provider,
    model,
    promptVersion: LASEM_GURU_PROMPT_VERSION,
    policyVersion: LASEM_GURU_POLICY_VERSION,
  };

  if (!input.retrieval.length) {
    return {
      ...base,
      groundingResult: 'insufficient_evidence',
      evidenceLabel: 'insufficient_evidence',
      confidence: 'none',
      answerText: refuseText(input.locale),
      citations: [],
      retrieval: [],
    };
  }

  const hasContested =
    input.retrieval.some((r) => r.claimType === 'contested') ||
    input.retrieval.some((r) => r.claimReviewStatus === 'contested');

  if (hasContested) {
    return {
      ...base,
      groundingResult: 'contested',
      evidenceLabel: 'contested_claim',
      confidence: mapConfidence('contested', input.retrieval[0]),
      answerText: contestedText(input.locale, input.retrieval),
      citations: toCitations(input.retrieval),
      retrieval: input.retrieval,
    };
  }

  // Prefer the top-ranked fragment for the primary evidence label.
  const topLabel = claimTypeToEvidenceLabel(input.retrieval[0]?.claimType);
  return {
    ...base,
    groundingResult: 'grounded',
    evidenceLabel: topLabel,
    confidence: mapConfidence('grounded', input.retrieval[0]),
    answerText: groundedText(input.locale, input.retrieval),
    citations: toCitations(input.retrieval),
    retrieval: input.retrieval,
  };
}

/**
 * End-to-end grounded answer for a provider mode.
 * `local` is a stub that reuses mock grounding (no external network).
 */
export function answerWithProvider(input: {
  actor: ActorContext;
  fragments: RetrievableFragment[];
  query: string;
  locale: 'en' | 'id';
  aiProvider: 'mock' | 'local' | string;
}): GroundedAnswer {
  const retrieval = retrieveGroundedFragments(input.actor, input.fragments, input.query);
  if (input.aiProvider === 'local') {
    return mockAnswerFromRetrieval({
      query: input.query,
      locale: input.locale,
      retrieval,
      provider: LOCAL_PROVIDER,
      model: LOCAL_MODEL_STUB,
    });
  }
  // Default and explicit mock — never call remote providers from domain.
  return mockAnswerFromRetrieval({
    query: input.query,
    locale: input.locale,
    retrieval,
  });
}

/** Guard used by tests: answer text must not include denied fragment excerpts. */
export function assertNoRestrictedLeakage(
  answer: GroundedAnswer,
  deniedFragments: RetrievableFragment[],
): void {
  for (const denied of deniedFragments) {
    if (denied.textExcerpt && answer.answerText.includes(denied.textExcerpt)) {
      throw new Error(`RESTRICTED_LEAK: fragment ${denied.fragmentKey}`);
    }
    if (answer.citations.some((c) => c.sourceFragmentId === denied.id)) {
      throw new Error(`RESTRICTED_LEAK_CITATION: fragment ${denied.fragmentKey}`);
    }
    if (answer.retrieval.some((r) => r.id === denied.id)) {
      throw new Error(`RESTRICTED_LEAK_RETRIEVAL: fragment ${denied.fragmentKey}`);
    }
  }
}
