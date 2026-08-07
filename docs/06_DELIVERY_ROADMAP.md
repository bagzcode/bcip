# 06 — Delivery Roadmap

## Phase 0 — Foundation sprint, weeks 1–2

### Goal

Create a reproducible development foundation and confirm architectural boundaries.

### Deliverables

- Monorepo with pnpm and Turborepo.
- Next.js web application.
- FastAPI service and Celery worker.
- PostgreSQL/pgvector, Redis, and S3-compatible development storage in Docker Compose.
- Environment validation.
- Health checks.
- CI workflow.
- Architecture decision records.
- Seed demo data explicitly labelled fictional/demo.

### Exit criteria

- One command starts the development stack.
- Web, AI API, database, Redis, and object storage report healthy.
- Lint, type check, unit tests, and a smoke E2E test pass.
- No real cultural claims are fabricated in seeds.

## Phase 1 — Governance and catalogue, weeks 3–6

### Goal

Build the single source of truth before advanced AI.

### Features

- Better Auth integration.
- Organizations, roles, and permissions.
- Contributor, consent, access-policy, source, collection, motif, sample, and asset schemas.
- Admin/governance forms.
- Motif Explorer list, filters, detail, and metadata export.
- Signed upload workflow.
- Audit events.

### Exit criteria

- Public and restricted samples behave correctly in UI, API, search, and export tests.
- Every cultural statement requires provenance and review status.

## Phase 2 — Hue Seer baseline, weeks 7–10

### Goal

Deliver a reproducible baseline color workflow.

### Features

- Image quality checks and background job flow.
- Manual or baseline segmentation.
- Palette extraction and Lab/HSV metrics.
- Calibrated versus exploratory modes.
- Analysis review, compare, save, and export.
- Scientific regression fixtures.

### Exit criteria

- Same image and parameters produce stable stored results.
- Every result records algorithm and parameter version.
- Exploratory results cannot be mistaken for calibrated data.

## Phase 3 — Lasem Guru MVP, weeks 11–14

### Goal

Provide source-grounded knowledge access.

### Features

- Source ingestion and fragment review.
- Hybrid retrieval with access filtering.
- Provider interface plus a mock/local mode.
- Bilingual chat.
- Citation rendering and feedback.
- Grounding and restricted-data leakage tests.

### Exit criteria

- Unsupported questions receive an honest evidence-gap response.
- All factual cultural statements cite permitted source fragments.

## Phase 4 — Dress Weaver MVP, weeks 15–18

### Goal

Create a reproducible 2D design workspace.

### Features

- Garment templates and regions.
- Motif placement, scale, rotation, repeat, and palette mapping.
- Version saving and comparison.
- Deterministic design JSON.
- Preview export and attribution.

### Exit criteria

- Reloading a saved version reproduces the same design.
- All exported previews reference asset and palette versions.

## Phase 5 — Research Lab pilot, weeks 19–24

### Goal

Turn interactions into governed publication data.

### Features

- Study and instrument setup.
- Stimulus sets and random assignment.
- Participant pseudonyms and consent linkage.
- Response collection.
- Codebook and CSV/JSON export.
- Reproducibility manifest.

### Exit criteria

- A complete pilot study can be configured, run, and exported without direct database editing.

## Three-year program alignment

### Year 1

Complete Phases 0–5, validate the color protocol, enrich the 102 Isen-Isen collection, and produce Dataset v1 and initial publications.

### Year 2

Add controlled recoloring, culturally constrained palette recommendation, explanation experiments, designer evaluation, and expanded perception studies.

### Year 3

Deploy longitudinally with artisans/SMEs, add selected regional comparison, establish governed releases, training, IP/HKI, and maintenance ownership.

## Backlog priorities

Use MoSCoW prioritization:

- **Must:** governance, catalogue IDs, permissions, provenance, analysis reproducibility, citations, export.
- **Should:** visual similarity, controlled recoloring, collaborative review, experiment randomization.
- **Could:** 3D garment view, mobile capture assistant, audio narration.
- **Not yet:** autonomous motif generation, virtual try-on, blockchain provenance, Kubernetes.
