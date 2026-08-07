# Phase 3 Report — Lasem Guru MVP

**Date:** 2026-08-07  
**Tip commit (cumulative):** `8ff34da`  
**Stack commit:** `107fe68` (`pr/7-lasem-guru`)

## Delivered

| Area | Status |
| ---- | ------ |
| Chat sessions / messages / runs / citations / feedback persistence | Done (schema + web actions) |
| Access-filtered retrieval of approved source fragments | Done — domain `knowledge` helpers |
| `AI_PROVIDER=mock` (and local stub) grounded answers / refusal | Done |
| Restricted + prompt-injection seed fixtures | Done — never leaked without grant |
| `/lasem-guru` bilingual surface with confidence/citations | Done (MVP) |

## Cultural safety

- All Phase 3 seed Q&A is `DEMO / FICTIONAL — NOT RESEARCH DATA`
- No real Batik Lasem meanings are seeded as facts
- Admin role alone cannot retrieve `culturally_restricted` fragments

## Tests present

- Domain: `knowledge.test.ts` (access filtering, grounding refusal, leakage, injection fixture behaviour)
- Contracts: `knowledge.test.ts`

## Honest gaps

1. Keyword-overlap retrieval only — not hybrid pgvector ranking.
2. Mock/local providers only; remote production provider not wired.
3. Browser must never call AI service directly (BFF/domain path) — keep enforcing this on new endpoints.
4. Playwright coverage for chat happy-path may still be missing from smoke suite.

## Acceptance

- [x] Grounded answers cite retrieved demo fragments only
- [x] Refusal when evidence missing
- [x] Restricted token fixture does not leak without grant
- [x] Demo sources labelled fictional
