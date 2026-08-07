# Phase 3 Implementation Plan — Lasem Guru MVP

**Date:** 2026-08-07  
**Scope:** Source-grounded bilingual knowledge assistant (mock/local provider).  
**Out of scope:** Learned palette recommendation, remote provider production wiring, e2e suite ownership, full pgvector hybrid ranking.

## Goals

1. Persist chat sessions, messages, assistant runs, retrieval results, citations, and feedback.
2. Retrieve only access-permitted, approved source fragments before answering.
3. Deterministic `AI_PROVIDER=mock` (and `local` stub) answers grounded solely in retrieved excerpts; refuse when evidence is missing.
4. Never expose `culturally_restricted` fragments without an explicit tier grant.
5. Seed fictional DEMO Q&A sources labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`.
6. Surface confidence, evidence labels, citations, and feedback actions in `/lasem-guru`.

## Assumptions

| ID | Assumption |
| ---- | ---------- |
| A1 | Phase 1 sources/fragments/claims/access policies are the retrieval corpus. |
| A2 | Mock provider runs inside the Next.js BFF / domain layer — browser never calls the AI service. |
| A3 | Keyword overlap scoring is sufficient for MVP; embeddings/rerank can extend later. |
| A4 | Demo questions exercise fixtures only; no real Batik Lasem meanings are seeded as facts. |

## Seed content keys

| Key | Purpose |
| ---- | ---- |
| `DEMO-SRC-LG-001` | Public lattice process + colour demo notes |
| `DEMO-SRC-LG-002` | Public wave production contributor interpretation |
| `DEMO-SRC-LG-R` | Research-only retrieval fixture |
| `DEMO-SRC-LG-X` | Culturally restricted leakage fixture (`RESTRICTED-DEMO-TOKEN-DO-NOT-LEAK`) |
| `DEMO-SRC-LG-INJ` | Prompt-injection fixture (`IGNORE-INSTRUCTIONS-FIXTURE`) |
| Fragments | `lg-lattice-process`, `lg-lattice-color`, `lg-wave-production`, `lg-research-note`, `lg-restricted-secret`, `lg-injection` |

## Demo questions that work

1. **Grounded:** “What is Fictional Lattice A used for in the demo?”
2. **Grounded (interpretation):** “How was Fictional Wave B produced according to the demo source?”
3. **Grounded:** “What colour notes exist for Fictional Lattice A in the demo?”
4. **Refuse:** “What does the mythical phoenix symbol mean in Lasem batik?”

## Routes

| Route | Role |
| ---- | ---- |
| `/lasem-guru` | Bilingual chat UI, chips, citations drawer, feedback |
| Server actions `askLasemGuru` / `submitAnswerFeedback` | Authenticated BFF entry (anonymous ask allowed for public fragments) |

## Acceptance checks

- [x] Schema + migration for chat/assistant tables
- [x] Access filter before ranking; restricted never without grant
- [x] Mock grounded answers + insufficient-evidence refusal
- [x] Domain tests for grounding refusal / leakage / injection fixture
- [x] DEMO seeds labelled fictional
- [x] Confidence + evidence labels + feedback actions in UI

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Parallel Phase 1 UI agents touch sources | Additive seed keys only (`DEMO-SRC-LG-*`) |
| Keyword false positives | Min score threshold + approved-status gate |
| Accidental cultural fabrication | Refuse path + DEMO labels on every answer |
