# Phase 1 Implementation Plan

**Date:** 2026-08-04  
**Scope:** Governance foundations + Motif Explorer catalogue.  
**Out of scope:** Hue Seer calculations, Lasem Guru generation, Dress Weaver, Research Lab.

## Goals

1. Role/permission matrix for visitor through admin; culturally_restricted never via admin rank alone.
2. Governance schema: contributors, consent, sources, claims, capture sessions, personal collections.
3. Server-side permission services + permission-matrix tests.
4. Signed S3 upload initiate/finalize with checksum and audit.
5. Motif Explorer: list/search/filters/detail/compare/save/export with access filtering.
6. Governance Console: access, consent, attribution, provenance, review, audit.
7. Fictional demo data only (`DEMO / FICTIONAL — NOT RESEARCH DATA`).

## Assumptions

| ID | Assumption |
| ---- | ---------- |
| A1 | BCIP `memberships.role` is the source of truth for permissions; Better Auth `member` remains for org plugin compatibility. |
| A2 | Permission matrix is code-defined (declarative) rather than DB-editable in Phase 1. |
| A3 | Cultural descriptions are `knowledge_claims` requiring ≥1 source link and a review status. |
| A4 | Existence of culturally_restricted records must not leak to unauthorized actors. |
| A5 | MinIO remains the local S3 target; AWS SDK v3 is the client. |
| A6 | Demo users use known email/password for local and Playwright tests. |

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Dual org tables (Better Auth vs BCIP) | Actor resolution prefers BCIP memberships; ADR-0005. |
| Permission-matrix size | Table-driven Vitest. |
| MinIO flaky in CI | Mock storage in unit tests; live MinIO local only. |
| Accidental real cultural claims | Demo labels + claim guard requiring provenance. |

## Acceptance checks

- [ ] Restricted records absent from unauthorized search/count/export/detail
- [ ] Admin cannot bypass culturally_restricted without explicit grant
- [ ] Cultural descriptions require source + review status
- [ ] Withdrawn assets excluded from search/export
- [ ] Demo data labelled fictional
- [ ] Lint, typecheck, unit tests, migrate/seed, Playwright pass
