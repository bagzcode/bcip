# ADR-0004: Phase 0 dependency baseline

- **Status:** Accepted
- **Date:** 2026-08-03

## Context

Phase 0 requires pinning current stable dependencies compatible with Next.js 16. Canary/beta packages are forbidden unless justified here.

Versions were resolved from the npm registry on 2026-08-03 against Node 22.

## Decision

| Package                                       | Version                                    | Notes                                                                                   |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| pnpm                                          | 10.14.0                                    | Package manager                                                                         |
| turbo                                         | 2.10.8                                     | Monorepo task runner                                                                    |
| next                                          | 16.2.12                                    | App Router LTS line                                                                     |
| react / react-dom                             | 19.2.8                                     | Peer of Next 16                                                                         |
| typescript                                    | 5.9.2                                      | Strict mode; TypeScript 7 exists but tooling peers still prefer 5.x                     |
| zod                                           | 3.25.76                                    | Prefer Zod 3 for Better Auth / ecosystem peer compatibility (Zod 4 available; deferred) |
| drizzle-orm                                   | 0.45.2                                     | PostgreSQL + pgvector                                                                   |
| drizzle-kit                                   | 0.31.4                                     | Migrations                                                                              |
| better-auth                                   | 1.6.25                                     | Self-hosted auth                                                                        |
| tailwindcss                                   | 4.1.10                                     | Via `@tailwindcss/postcss`                                                              |
| vitest                                        | 3.2.4                                      | Unit tests (stable 3.x; avoid bleeding-edge if peers conflict)                          |
| @playwright/test                              | 1.54.2                                     | E2E smoke                                                                               |
| eslint                                        | 9.32.0                                     | Flat config era with Next                                                               |
| prettier                                      | 3.6.2                                      | Formatting                                                                              |
| postgres (js)                                 | 3.4.7                                      | Drizzle driver                                                                          |
| Python                                        | 3.12                                       | FastAPI service (container)                                                             |
| fastapi / uvicorn / celery / redis / pydantic | pinned in `services/ai/pyproject.toml`     | Redis `5.2.1` (Kombu/Celery broker peer ceiling); FastAPI `0.116.1`                     |
| PostgreSQL image                              | `pgvector/pgvector:pg18`                   | PG 18 + pgvector                                                                        |
| Redis image                                   | `redis:8.2-alpine`                         | Pinned minor                                                                            |
| MinIO image                                   | `minio/minio:RELEASE.2025-07-23T15-54-02Z` | S3-compatible; not `latest`                                                             |

Exact lockfile versions may float within the ranges declared in `package.json` / `pyproject.toml` after `pnpm install` / `uv`/`pip` freeze; the lockfiles are the source of truth.

### Amendment 2026-08-07 — FreeSewing (Dress Weaver)

`@bcip/web` pins MIT FreeSewing 4.10.0 packages for server-side Aaron drafts: `@freesewing/core`, `@freesewing/aaron`, `@freesewing/brian`, `@freesewing/plugin-bust`, plus peers required under pnpm (`@freesewing/plugin-transform`, `@freesewing/config`, `@freesewing/models`, `@freesewing/i18n`). See ADR-0008.

## Consequences

- Install and CI are reproducible.
- Upgrades require a new ADR or amendment when crossing major lines.
- If a pinned MinIO release tag is unavailable on a registry mirror, update this ADR with the substitute tag.

## Rejected alternatives

- Next.js canary / 16.3 preview — unstable for foundation.
- TypeScript 7 as default — deferred until ESLint/Next peer matrix settles.
- Zod 4 as default — deferred for auth/ORM peer safety.
- Floating `latest` container tags — non-reproducible local stacks.
