# Phase 0 Implementation Plan

**Date:** 2026-08-03  
**Scope:** Foundation only — monorepo, infra, schema, health surfaces, bilingual shell.  
**Out of scope:** Motif Explorer business features, Hue Seer calculations, Lasem Guru generation, Dress Weaver canvas, Research Lab.

## Goals

1. Reproducible pnpm + Turborepo monorepo matching the architecture blueprint.
2. Docker Compose stack: web, AI API, AI worker, PostgreSQL 18 + pgvector, Redis, MinIO.
3. Minimum Phase 0 Drizzle schema with migrations and fictional demo seeds.
4. Next.js 16 App Router pages: `/`, `/explore`, `/workspace` (server-auth), `/system/health`.
5. FastAPI health + queued color-analysis placeholder (no fabricated results).
6. Env validation, request IDs, structured errors, bilingual messages, CI, tests.

## Assumptions

| ID  | Assumption                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Host has Node ≥ 22, Docker Compose v2, and can run Python 3.12 in containers; local Python may be 3.11 for host-side pytest if 3.12 is unavailable.                  |
| A2  | Better Auth core tables (`user`, `session`, `account`, `verification`) plus organization tables are sufficient for Phase 0; full permission matrix lands in Phase 1. |
| A3  | Workspace protection uses server-side session lookup; unauthenticated users see a sign-in placeholder (full auth UI deferred to Phase 1).                            |
| A4  | MinIO is the pinned local S3-compatible store; production adapter remains interface-shaped only.                                                                     |
| A5  | Demo motifs are explicitly fictional; no Lasem cultural meanings are invented.                                                                                       |
| A6  | Stable package versions resolved at scaffold time are recorded in ADR-0004 and lockfiles.                                                                            |
| A7  | Zod 4 is used if peer-compatible; otherwise Zod 3 is pinned with ADR note.                                                                                           |

## Dependency choices

See `decisions/ADR-0004-dependency-baseline.md`.

Baseline targets (confirm at install):

- Next.js `16.2.12`, React `19.x`, TypeScript strict
- Tailwind CSS `4.x`, Turborepo `2.x`, pnpm `10.x`
- Drizzle ORM `0.45.x`, Better Auth `1.6.x`
- PostgreSQL image `pgvector/pgvector:pg18`, Redis `8-alpine`
- MinIO release tag (not `latest`)
- Python 3.12, FastAPI, Celery, Redis, Pytest in `services/ai`

## Work packages

1. **Repo skeleton** — workspaces, turbo, shared tsconfig/eslint/prettier via `packages/config`.
2. **Contracts & domain** — Zod contracts for health/jobs/color queue; domain helpers for access-tier checks.
3. **Database** — Drizzle schema, pgvector extension migration, seed script.
4. **Web app** — App Router shell, i18n (id/en), Better Auth stub, health page, protected workspace.
5. **AI service** — FastAPI live/ready, color analyze enqueue placeholder, Celery worker stub.
6. **Infrastructure** — Compose Specification (no `version`), Dockerfiles, healthchecks, volumes, scripts.
7. **Quality** — Vitest, Pytest, Playwright smoke, GitHub Actions CI.
8. **Docs** — root README, `.env.example`, `data/README.md`, Phase 0 report.

## Risks

| Risk                                         | Mitigation                                                          |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Better Auth schema drift vs plugin versions  | Pin version; follow official Drizzle adapter tables; smoke migrate. |
| pgvector image tag availability              | Use `pgvector/pgvector:pg18`; document fallback if pull fails.      |
| Host Python ≠ 3.12                           | Prefer Docker for AI tests; document host pytest on 3.11 if needed. |
| Peer dependency conflicts (Zod/ESLint/TS)    | Resolve in ADR-0004; prefer stable peers over canary.               |
| Docker resource limits on developer machines | Make infra-only compose profile; document memory needs.             |
| Accidental real cultural content in seeds    | Hard-coded `DEMO / FICTIONAL` labels + review checklist.            |

## Acceptance checks

- [x] `pnpm install` succeeds with lockfile committed
- [x] `docker compose config` validates
- [ ] Stack health: postgres, redis, object-storage, ai-api `/health/live`, web `/system/health` _(blocked locally: Docker daemon unavailable during Phase 0 verification)_
- [ ] Migrations apply; seed creates 1 collection + 2 fictional motifs _(scripts ready; live DB not available without Docker)_
- [x] `/workspace` rejects unauthenticated access via server-side session check
- [x] `POST /v1/color/analyze` returns queued job contract only
- [x] Vitest + Pytest pass; Playwright smoke authored (`pnpm test:e2e` — Chromium download blocked in agent sandbox)
- [x] CI workflow present for format/lint/typecheck/test/build
- [x] No secrets or restricted data in Git
- [x] Phase 0 report documents honest verification results

See `docs/implementation/PHASE_0_REPORT.md` for command-level results.

## Ecosystem alignment (prototype docx ↔ blueprint)

Reviewed `Batik intelligent Ecosystem app.docx` against the BCIP blueprint. Full mapping: `docs/implementation/ECOSYSTEM_ALIGNMENT.md`.

| Prototype                 | BCIP module                    | Phase 0 treatment                |
| ------------------------- | ------------------------------ | -------------------------------- |
| Batik Storyboard          | Motif Explorer (`/explore`)    | Demo catalogue shell only        |
| Dye Color Prediction Tool | Hue Seer (`/hue-seer`)         | Placeholder page; queue API stub |
| Batik Lasem Expert        | Lasem Guru (`/lasem-guru`)     | Placeholder page; no KB port     |
| Batik Fashion Designer    | Dress Weaver (`/dress-weaver`) | Placeholder page                 |
| _(docx absent)_           | Research Lab / Governance      | Placeholder pages                |

**Gap to carry forward:** Hue Seer must eventually cover both image analysis (blueprint) and dye-process prediction (prototype). Lasem Guru must not import hardcoded cultural answers. AR/3D Storyboard features are deferred.

## Explicit non-goals (this phase)

Motif search/filters, color science calculations, RAG/knowledge answers, garment canvas, research instruments, full governance console UI, AR viewers, and porting prototype Vite apps as separate micro-frontends.
