# 07 — Engineering Standards

## TypeScript

- Strict mode.
- Prefer server components.
- Client components must be small and interaction-specific.
- No direct database access from React components.
- Domain functions accept explicit actor and access context.
- Validate all environment variables and request boundaries.
- Do not use `any`; use `unknown` and narrow.
- Use transactions for multi-record business operations.
- Avoid generic CRUD layers for governance-critical operations.

## Python

- Python 3.12 baseline unless dependency review approves a newer version.
- Type hints and strict static checking where practical.
- Pydantic models at service boundaries.
- Pure, testable color functions separated from I/O.
- Deterministic random seeds where applicable.
- Scientific functions require reference tests and documented assumptions.
- No notebook-only production logic.

## Database

- Migrations are reviewed and committed.
- No destructive migration without backup and rollback notes.
- Every restricted table includes clear access-policy linkage.
- Use indexes based on measured queries, not speculation.
- Keep vector model/dimension metadata with every embedding.

## Testing pyramid

- Unit tests for domain rules and color functions.
- Integration tests for database, storage, jobs, and private AI API.
- Contract tests between Next.js and FastAPI.
- Playwright E2E tests for critical journeys.
- Permission-matrix tests for every protected resource.
- Regression datasets for cultural citation and restricted-data leakage.

## Definition of done

A feature is complete only when:

- acceptance criteria pass;
- authorization is enforced server-side;
- audit requirements are implemented;
- bilingual labels are added or explicitly deferred;
- tests cover success, failure, and permission cases;
- documentation and ADRs are updated;
- no secrets or real restricted data appear in source control;
- accessibility and responsive behavior are checked;
- telemetry does not expose confidential content.

## Commit conventions

Use small commits with conventional prefixes:

- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `chore:`
- `security:`

Cursor should summarize changed files, commands run, tests passed, and remaining risks after each phase.
