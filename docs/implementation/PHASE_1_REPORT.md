# Phase 1 Report — Governance + Motif Explorer

**Date:** 2026-08-07  
**Tip commit (cumulative):** `8ff34da` (`main` / `pr/9-research-lab`)  
**Stack commits:** `dfd798a` (schema/seed), `d6dc694` (domain/contracts), `af170a5` (auth/uploads), `982d130` (Explorer + Governance UI)

## Delivered

| Area | Status |
| ---- | ------ |
| Role/permission matrix (`packages/domain` access helpers) | Done — Vitest coverage in `access.test.ts` |
| Governance schema (contributors, consent, sources, claims, capture, personal collections) | Done — Drizzle migrations + seed |
| Signed S3 upload initiate/finalize | Done — ADR-0006; web `uploads` + storage helpers |
| Motif Explorer list/search/detail/compare/export with access filtering | Done — `/explore` routes |
| Governance Console (access, consent, provenance, review, audit) | Done — `/governance/*` |
| Demo users + fictional catalogue | Done — labelled `DEMO / FICTIONAL — NOT RESEARCH DATA` |

## Surfaces

- `/explore`, `/explore/motifs/[code]`, `/explore/samples/[code]`, `/explore/collections/[code]`, `/explore/compare`
- `/governance`, `/governance/access|consent|provenance|review|audit`
- `/sign-in`, `/sign-up`, `/workspace`
- Auth: Better Auth email/password; actor resolved from BCIP `memberships`

## Demo logins (local seed)

Password for all: `DemoPass123!`

| Email | Role intent |
| ----- | ----------- |
| `visitor@demo.bcip.local` | Visitor |
| `designer@demo.bcip.local` | Designer / uploads |
| `researcher@demo.bcip.local` | Researcher (+ research_only grant) |
| `steward@demo.bcip.local` | Data steward (+ restricted grant fixture) |
| `admin@demo.bcip.local` | Admin (still cannot bypass culturally_restricted without grant) |

## Tests present

- Domain: `access`, `catalogue`, `claims`, `governance`, `audit`
- Contracts: catalogue schemas
- Web: `actor`, `uploads`, `storage`, `env`
- DB: schema smoke

## Honest gaps / risks

1. Explore/governance UIs are MVP — not full WCAG audit or bilingual polish for every control.
2. Live MinIO upload path is unit-tested with mocks in CI; full upload e2e against MinIO is local-only.
3. Existence-leakage rules are enforced in domain filters; every new query path must keep calling them.
4. Dual org tables (Better Auth vs BCIP) remain — ADR-0005 documents preference for BCIP memberships.
5. Playwright smoke at tip still covers landing/health primarily; module-route smoke may lag UI delivery.

## Acceptance (plan checklist)

- [x] Restricted records filtered from unauthorized search/export/detail (domain tests)
- [x] Admin cannot view culturally_restricted without explicit grant
- [x] Cultural claims require source + review status
- [x] Withdrawn assets excluded from search/export helpers
- [x] Demo data labelled fictional
- [~] Full lint/typecheck/e2e green on every machine — depends on local stack; CI workflow present
