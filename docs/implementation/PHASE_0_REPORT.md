# Phase 0 Report

**Date:** 2026-08-04 (restart verification)  
**Repository:** `/Users/kerthyayana/Desktop/bcip`  
**Scope:** Foundation only (no Motif Explorer / Hue Seer / Lasem Guru / Dress Weaver / Research Lab business features).

## Architecture created

pnpm + Turborepo monorepo with:

| Path                     | Role                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `apps/web`               | Next.js 16 App Router shell (ID+EN), Better Auth, BFF to AI |
| `services/ai`            | FastAPI + Celery worker (Python 3.12)                       |
| `packages/db`            | Drizzle schema, migrations, seed                            |
| `packages/domain`        | Access-tier helpers                                         |
| `packages/contracts`     | Zod job/health/color contracts                              |
| `packages/ui`            | Shared primitives + heritage tokens                         |
| `packages/config`        | Shared TSConfig                                             |
| `infrastructure/docker`  | Dockerfiles + postgres init (pgvector)                      |
| `infrastructure/scripts` | Bootstrap / DB helpers                                      |
| `tests/e2e`              | Playwright smoke specs                                      |

Compose stack (`compose.yaml`, no obsolete `version` key): `web`, `ai-api`, `ai-worker`, `postgres` (`pgvector/pgvector:pg18`), `redis`, `object-storage` (pinned MinIO), optional `mailpit` profile. Healthchecks + named volumes + `bcip_net`.

### Application surfaces

- `/` landing (module map aligned to blueprint + ecosystem doc)
- `/explore` fictional demo catalogue
- `/workspace` server-side Better Auth session check
- `/system/health` health dashboard
- Module placeholders: `/hue-seer`, `/lasem-guru`, `/dress-weaver`, `/research`, `/governance`
- FastAPI: `GET /health/live`, `GET /health/ready`, `POST /v1/color/analyze` (queued placeholder only)
- Next BFF: `/api/health`, `/api/color/analyze`, `/api/auth/[...all]`

### Schema (Phase 0)

Better Auth tables (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`) plus BCIP tables: `organizations`, `memberships`, `access_policies`, `collections`, `motifs`, `samples`, `assets`, `asset_versions`, `jobs`, `job_events`, `audit_events`. UUID/text PKs, timestamps, status fields, indexes. `CREATE EXTENSION vector` in migration + postgres init. Seed: one demo collection + two motifs labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`.

### Ecosystem alignment

Cross-checked `Batik intelligent Ecosystem app.docx` → see `docs/implementation/ECOSYSTEM_ALIGNMENT.md` and plan section in `PHASE_0_PLAN.md`. Prototype apps map to Motif Explorer / Hue Seer / Lasem Guru / Dress Weaver; Research Lab + Governance are blueprint-only. Phase 0 does not port Vite prototypes or cultural Q&A content.

## Dependency versions

Recorded in `decisions/ADR-0004-dependency-baseline.md`. Highlights:

- Next.js `16.2.12`, React `19.2.8`, TypeScript `5.9.2`, Zod `3.25.76`
- Drizzle ORM `0.45.2`, Better Auth `1.6.25`, Tailwind `4.1.10`, Turborepo `2.10.8`, pnpm `10.14.0`
- FastAPI `0.116.1`, Celery `5.5.3`, Redis client `5.2.1` (Kombu peer ceiling), Python **3.12** (venv + Docker)

## Postgres Docker issues fixed (restart)

Root causes observed when restarting the stack:

1. **PG 18 volume path.** Official Postgres 18+ images reject mounts at `/var/lib/postgresql/data`. Mount is now `postgres_data:/var/lib/postgresql` (old volume removed and recreated).
2. **Host port vs `DATABASE_URL`.** Host maps `5433:5432` to avoid clashing with local Postgres; `.env` / seed / Playwright defaults use `localhost:5433`.
3. **Seed fallback port.** `seed.ts` previously defaulted to `5432` when `.env` was not loaded → `role "bcip" does not exist` against a different local instance. Fixed default + `tsx --env-file=../../.env`.
4. **Web healthcheck bind.** Standalone Next listened on the container hostname, so `127.0.0.1:3000` healthchecks failed while host port-forward worked. Set `HOSTNAME=0.0.0.0` and switched healthcheck to Node `http.get`.
5. **Dockerfile syntax directive.** Removed `# syntax=docker/dockerfile:1` so builds do not require resolving `docker/dockerfile` from Docker Hub when DNS is flaky.

## Commands executed (restart pass)

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
docker compose config -q
pnpm stack:up
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers BASE_URL=http://127.0.0.1:3000 pnpm test:e2e
```

## Test results (honest)

| Check                                             | Result |
| ------------------------------------------------- | ------ |
| Prettier `format:check`                           | **Pass** |
| Typecheck (turbo)                                 | **Pass** |
| Lint (tsc via turbo)                              | **Pass** |
| Vitest (`@bcip/web`, `contracts`, `domain`, `db`) | **Pass** |
| Pytest AI health + color queue                    | **Pass** (3 tests, Python 3.12.13) |
| `pnpm build` (Next 16.2.12)                       | **Pass** |
| `docker compose config`                           | **Pass** |
| `db:migrate` / `db:seed` against live Postgres    | **Pass** (demo motifs present) |
| Docker infra health (postgres/redis/minio)        | **Pass** |
| Full stack health (web/ai-api + worker started)   | **Pass** after bind/port fixes |
| `POST /v1/color/analyze` queued placeholder       | **Pass** (`Authorization: Bearer …`) |
| Playwright smoke                                  | **Pass** (1 test) against running web on :3000 |

## Known limitations

1. Full auth UI / email flows deferred; `/workspace` shows auth-required message when no session.
2. Color analyze enqueues Celery task but does not perform analysis.
3. Explore catalogue may still use in-page fictional motifs; DB seed proves schema separately.
4. Python lint/typecheck (ruff/mypy) deferred; container still targets 3.12.
5. Next.js warns that `middleware` convention is moving to `proxy` — acceptable for Phase 0; revisit in Phase 1.
6. Playwright `webServer` conflicts if something else already owns :3000 and `reuseExistingServer` is false (CI); prefer `PLAYWRIGHT_SKIP_WEBSERVER=1` against `pnpm stack:up`.

## Security / cultural-governance risks

- Demo content must remain labelled fictional; never import prototype Lasem “answers” as facts.
- `.env` is gitignored; only `.env.example` is committed.
- Service token auth on AI color endpoint is shared-secret only — rotate for any shared environment.
- Existence leakage rules for `culturally_restricted` assets are stubbed in domain helpers; not wired to queries yet.
- Restricted operational data must stay out of Git (`data/README.md`).

## Recommended next task

Begin **Phase 1 — Governance + Motif Explorer catalogue** per `prompts/02_PHASE_1_GOVERNANCE_CATALOGUE.md`, using `ECOSYSTEM_ALIGNMENT.md` for Storyboard UX intents without porting hardcoded cultural claims.

## Acceptance checklist (from plan)

- [x] `pnpm install` lockfile present
- [x] `docker compose config` validates
- [x] Stack health (postgres/redis/minio/ai/web)
- [x] Migrations + seed on live DB
- [x] `/workspace` server-side session gate implemented
- [x] `POST /v1/color/analyze` queued contract only (covered by Pytest + live curl)
- [x] Vitest + Pytest + Playwright smoke pass
- [x] CI workflow present (`.github/workflows/ci.yml`)
- [x] No secrets/restricted data intended for Git (`.env` ignored)
- [x] This Phase 0 report written with honest gaps
