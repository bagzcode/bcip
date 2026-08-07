# Master Cursor Bootstrap Prompt

Paste the text below into Cursor Agent at the repository root.

---

You are the lead software architect and senior full-stack engineer for the **Batik Color Intelligence Platform (BCIP)**.

BCIP is a multimodal, culturally grounded batik design-intelligence ecosystem connecting heritage data, color science, explainable AI, and fashion application. Its modules are:

1. Motif Explorer — governed catalogue and visual/text discovery.
2. Hue Seer — calibrated and exploratory color analysis.
3. Lasem Guru — source-grounded bilingual knowledge assistant.
4. Dress Weaver — reproducible 2D garment and motif design workspace.
5. Research Lab — quantitative experiments, surveys, and publication exports.
6. Governance Console — consent, attribution, access tier, licensing, expert review, and audit.

The pilot domain is Batik Lasem. Do not fabricate cultural information. Any seed cultural content must be obviously labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`.

## Your first task

Create the **Phase 0 foundation only**. Do not implement all business features yet.

Before editing:

1. Read every file under `docs/`, `decisions/`, and `.cursor/rules/`.
2. Inspect the existing repository.
3. Write a concise implementation plan to `docs/implementation/PHASE_0_PLAN.md`, including assumptions, risks, and acceptance checks.
4. Record current stable dependency choices in `decisions/ADR-0004-dependency-baseline.md`. Use stable releases compatible with Next.js 16. Do not use canary or beta dependencies unless unavoidable and explicitly justified.

Then scaffold this monorepo:

```text
apps/web
services/ai
packages/db
packages/domain
packages/contracts
packages/ui
packages/config
infrastructure/docker
infrastructure/scripts
tests/e2e
```

## Required stack

- pnpm workspaces and Turborepo.
- Next.js 16 App Router, React, TypeScript strict mode.
- Tailwind CSS and accessible UI primitives.
- PostgreSQL 18 with pgvector.
- Drizzle ORM and migrations.
- Better Auth prepared for PostgreSQL, but Phase 0 may include only the basic integration and one protected placeholder page.
- Python 3.12, FastAPI, Pydantic, Pytest.
- Celery and Redis.
- S3-compatible object-storage adapter; local development service in Docker Compose.
- Vitest for TypeScript tests and Playwright for one smoke E2E test.
- Environment validation in TypeScript and Python.

## Docker requirements

Create a Compose Specification file without the obsolete top-level `version` key. Include:

- `web`
- `ai-api`
- `ai-worker`
- `postgres` with pgvector
- `redis`
- local S3-compatible object storage
- optional `mailpit` profile

Add health checks, named volumes, an internal network, and sensible development ports. Avoid floating `latest` tags when a stable tag can be pinned. Add `.env.example`, never `.env`.

Provide these commands through the root scripts or Makefile/task runner:

- install dependencies
- start infrastructure
- start all development services
- stop services
- lint
- typecheck
- test
- test:e2e
- database generate/migrate/seed
- format

## Phase-0 data schema

Implement only the minimum schema needed to prove foundations:

- user/auth tables required by Better Auth
- organizations and memberships
- access policies
- collections
- motifs
- samples
- assets and asset versions
- jobs and job events
- audit events

Include pgvector extension migration but do not yet build production embedding features.

Use UUID primary keys, created/updated timestamps, explicit status fields, and clear indexes. Add one demo collection and two demo motifs clearly marked fictional.

## Application pages

Create a refined but minimal shell:

- `/` product landing page
- `/explore` demo catalogue
- `/workspace` protected placeholder
- `/system/health` development health dashboard

Use Indonesian and English message files, with a basic language switch. Do not build a generic corporate dashboard style; use an understated heritage/research aesthetic with excellent readability and accessible contrast.

## Service contracts

FastAPI must expose:

- `GET /health/live`
- `GET /health/ready`
- `POST /v1/color/analyze` as a typed placeholder returning a queued job contract, not fake analysis results

Generate or document an OpenAPI-to-TypeScript workflow. The browser must not call FastAPI directly; provide a typed server-side client from Next.js.

## Quality requirements

- TypeScript strict mode; no `any`.
- Python type hints.
- Zod/Pydantic boundary validation.
- Structured error objects and request IDs.
- Unit tests for at least one permission rule, environment validation, and a domain entity.
- Pytest for AI health and placeholder color request validation.
- Playwright smoke test for landing page and health route.
- Docker health checks must pass.
- Add a CI workflow that runs formatting check, lint, typecheck, unit tests, Python tests, and build.

## Cultural and security requirements

- No real cultural claims in demo data.
- Add comments and types showing where provenance, review status, access tier, and permitted purpose will be enforced.
- Never place uploaded files or secrets in Git.
- Add a `data/README.md` explaining public seed data versus restricted operational data.
- Authorization must be checked server-side for `/workspace`; route redirection alone is not sufficient.

## Completion procedure

Work in small coherent commits/steps. Do not implement Phases 1–5.

When complete:

1. Run all available checks.
2. Run `docker compose config` and, when possible, start the stack and verify health endpoints.
3. Update the root README with exact setup commands.
4. Create `docs/implementation/PHASE_0_REPORT.md` containing:
   - architecture created;
   - dependency versions;
   - files/modules added;
   - commands executed;
   - test results;
   - known limitations;
   - security/cultural-governance risks;
   - recommended next task.
5. In your final response, summarize changes, tests, and anything you could not verify. Do not claim success for commands that were not run.

Make reasonable implementation decisions without interrupting for minor preferences. Document assumptions in ADRs. Stop after a clean, tested Phase-0 foundation.
