# Cursor Prompt — Phase 3: Lasem Guru MVP

Implement a source-grounded bilingual knowledge assistant. Do not use unreviewed internet content as knowledge.

## Scope

- Source ingestion, source versioning, fragments, claims, scope, contributor interpretation, review status, and access policy.
- Text embeddings in pgvector and PostgreSQL full-text search.
- Hybrid retrieval that filters access before ranking.
- AI-provider interface with:
  - mock deterministic provider for tests;
  - optional configured remote provider;
  - optional local provider adapter stub.
- Indonesian/English chat UI.
- Inline citations and source drawer.
- Labels for documented claim, contributor interpretation, inference, contested claim, and insufficient evidence.
- Feedback and expert correction workflow.
- Prompt-injection and restricted-data leakage tests.

## Non-negotiable behavior

- Every factual cultural statement must map to one or more retrieved permitted source fragments.
- If evidence is missing, say so rather than guessing.
- Show conflicting interpretations when approved records disagree.
- Never send restricted context to an external provider without a permitted-purpose check.
- Store provider/model, retrieval set, prompt version, policy version, and grounding result.

Finish with passing evaluation fixtures and a Phase-3 report. Do not implement learned palette recommendation yet.
