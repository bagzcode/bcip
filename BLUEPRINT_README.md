# BCIP Cursor Blueprint Starter Pack

## BCIP — Batik Design Intelligence Platform

**Product statement:** A multimodal, culturally grounded batik design-intelligence ecosystem connecting heritage motifs, craft knowledge, color science, explainable AI, and fashion application. (Former expansion: Batik Color Intelligence Platform — see `docs/implementation/BATIK_FIRST_REBRAND.md`.)

This pack is designed to be opened as a new project folder in Cursor. It does **not** pretend to be the completed application. It contains the architecture, product specification, data model, delivery plan, Cursor rules, and implementation prompts needed to create the platform in controlled stages.

## Recommended first use

1. Create an empty Git repository.
2. Copy this starter pack into the repository root.
3. Open the folder in Cursor.
4. Read `docs/00_EXECUTIVE_BLUEPRINT.md` and `docs/01_SYSTEM_ARCHITECTURE.md`.
5. Paste `prompts/01_MASTER_BOOTSTRAP_PROMPT.md` into Cursor Agent.
6. Let Cursor create the foundation only; review the generated plan and changes before starting feature modules.
7. Use the phase prompts in order.

## Product modules

- **Motif Explorer:** governed batik catalogue, metadata, visual/text search, and collection discovery.
- **Hue Seer:** color extraction, CIELAB analytics, comparison, recoloring, and palette recommendation.
- **Lasem Guru:** source-grounded bilingual knowledge assistant with citations and uncertainty.
- **Dress Weaver:** 2D garment visualization and batik placement workspace.
- **Research Lab:** experiments, surveys, stimuli, quantitative exports, and reproducibility records.
- **Governance Console:** consent, attribution, licensing, access tiers, expert review, and audit trails.

## Architectural principle

Start as a **modular monolith** for the web application and domain logic, with a separate Python AI service and asynchronous worker. Do not split each product module into an independent microservice during Year 1.

## Suggested technology baseline

- Next.js 16 App Router and TypeScript
- pnpm workspaces and Turborepo
- PostgreSQL 18 with pgvector
- Drizzle ORM
- Better Auth with role/organization access control
- Python FastAPI AI service
- Celery and Redis for long-running jobs
- S3-compatible object storage: local MinIO-compatible service for development; Cloudflare R2 or Amazon S3 for production
- Tailwind CSS and accessible component primitives
- Vitest, Pytest, and Playwright
- Docker Compose for local development

Resolve and pin current stable package versions when bootstrapping. Do not use canary or beta dependencies unless documented in an architecture decision record.

## Key safety rule

Never generate or publish cultural claims as facts without provenance. Every cultural interpretation must store its source, contributor, confidence, access tier, and review status.
