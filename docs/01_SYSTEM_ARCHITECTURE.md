# 01 — System Architecture

## 1. Recommended architectural style

Use a **modular monolith plus AI service**:

- One Next.js application for the user interface, server-rendered pages, authenticated domain operations, administration, and public APIs.
- One Python FastAPI service for computer vision, color computation, embeddings, retrieval support, recommendation inference, and later model serving.
- One asynchronous Python worker for image analysis, embedding, export, and other long tasks.
- Shared PostgreSQL database with explicit module schemas or table prefixes.
- S3-compatible object storage for images and generated artifacts.
- Redis as the task broker, result/cache store, and short-lived coordination layer.

This structure keeps deployment and transactions manageable while allowing CPU/GPU workloads to evolve independently.

## 2. High-level topology

```text
Browser / PWA
      |
      v
Next.js Web + BFF
  |       |         \
  |       |          \ signed upload/download
  |       v           v
  |    PostgreSQL   Object Storage
  |    + pgvector     RAW / calibrated / derived
  |
  +----> FastAPI AI Service ----> Redis/Celery ----> AI Worker(s)
                  |                    |
                  +--------------------+
                         job results
```

## 3. Monorepo structure

```text
bcip/
├── apps/
│   └── web/                      # Next.js 16 App Router
├── services/
│   └── ai/                       # FastAPI + Celery worker
├── packages/
│   ├── db/                       # Drizzle schema, migrations, queries
│   ├── ui/                       # shared accessible UI components
│   ├── contracts/                # Zod and generated OpenAPI types
│   ├── config/                   # eslint, tsconfig, environment validation
│   └── domain/                   # framework-light TypeScript domain services
├── infrastructure/
│   ├── docker/
│   ├── migrations/
│   ├── scripts/
│   └── observability/
├── data/
│   ├── seed-public/
│   └── README.md                 # no restricted production data in Git
├── docs/
├── decisions/                    # architecture decision records
├── .cursor/rules/
├── compose.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 4. Technology choices

### Web and user experience

- **Next.js 16 App Router:** server components by default, client components only for interaction-heavy experiences.
- **TypeScript strict mode:** no implicit `any`, typed boundaries, validated environment variables.
- **Tailwind CSS:** styling and design tokens.
- **Accessible component primitives:** use shadcn/ui or equivalent components based on Radix primitives, but keep BCIP design tokens and semantics independent from the library.
- **Konva or Fabric.js:** 2D canvas for Dress Weaver. Evaluate both in an ADR before selection; Konva is a reasonable first candidate for React integration.
- **Internationalization:** Indonesian and English from the beginning. Store content language explicitly.

### Data and search

- **PostgreSQL 18:** relational source of truth.
- **pgvector:** image/text embeddings and nearest-neighbor search.
- **PostgreSQL full-text search:** exact and lexical search.
- **Hybrid retrieval:** combine lexical score, vector similarity, filters, and review/access constraints.
- **Drizzle ORM:** schema, migrations, typed queries, and explicit SQL when needed.

### Authentication and authorization

- **Better Auth:** self-hosted authentication integrated with Next.js 16.
- Use organization membership and explicit permissions.
- Validate authorization inside every protected server action, route handler, and domain service. Proxy checks are only an early redirect optimization.

### AI and scientific processing

- **FastAPI:** typed Python service and OpenAPI contract.
- **OpenCV, Pillow, scikit-image, NumPy:** image and color operations.
- **colour-science:** consider for standards-based color calculations; pin and validate implementation against known test cases.
- **scikit-learn:** baseline clustering and classical models.
- **PyTorch:** later multimodal embedding and learned recommendation models.
- **Celery + Redis:** durable background jobs for image processing and model tasks.
- **Provider interfaces:** support remote APIs and local models without coupling domain code to one vendor.

### Storage

- Store metadata in PostgreSQL and binary files in S3-compatible object storage.
- Development may use a local S3-compatible container.
- Production may use Cloudflare R2, Amazon S3, or an institutionally controlled S3-compatible service.
- Use checksums, object versioning where available, signed URLs, encryption, and explicit access policies.

### Quality and operations

- **Vitest + Testing Library:** TypeScript unit/component tests.
- **Pytest:** Python tests and scientific regression fixtures.
- **Playwright:** end-to-end browser and API tests.
- **OpenTelemetry:** traces, metrics, and log correlation.
- **Structured JSON logs:** include request ID, user/project ID where appropriate, job ID, model version, and dataset version; never log confidential content or secrets.
- **GitHub Actions or equivalent:** lint, type check, tests, migration check, container build, and dependency/security scanning.

## 5. Module boundaries

### Catalogue domain

Owns collections, motifs, samples, media assets, capture sessions, techniques, producers, and descriptive metadata.

### Color domain

Owns image-analysis jobs, calibrated and uncalibrated modes, palettes, color measurements, comparisons, recoloring operations, and algorithm versions.

### Knowledge domain

Owns sources, source fragments, claims, interpretations, expert reviews, provenance, embeddings, and knowledge-assistant citations.

### Design domain

Owns garment templates, design projects, layers, motif transformations, palette mappings, versions, previews, comments, and reviews.

### Research domain

Owns studies, instruments, conditions, stimuli, assignments, responses, exports, codebooks, randomization, and study versions.

### Governance domain

Owns consent, rights holders, licenses, permitted purposes, access tiers, embargoes, withdrawal, attribution preferences, and release approvals.

### Identity domain

Owns users, organizations, membership, roles, permissions, and sessions through the auth integration.

### Audit domain

Owns immutable records of important reads, writes, approvals, exports, model runs, and policy decisions.

Avoid cross-module table writes. A module exposes domain functions and events rather than allowing arbitrary updates from another module.

## 6. Key workflows

### Image upload and analysis

1. Web validates session, permissions, consent reference, and metadata minimums.
2. Web creates an asset record in `pending_upload` state.
3. Web issues a short-lived signed upload URL.
4. Client uploads directly to object storage.
5. Web verifies checksum and content metadata, then creates an analysis job.
6. Celery worker downloads the object using service credentials.
7. Worker validates image, performs analysis, writes derived artifacts, and posts signed result metadata.
8. Web/domain service stores palette and feature records with algorithm version and parameters.
9. User sees progress and can approve, review, or request recapture.

### Lasem Guru question

1. Validate user and access context.
2. Normalize language and query intent.
3. Retrieve only permitted, approved sources using hybrid search.
4. Build a context set with claim IDs, source fragment IDs, contributor permissions, and uncertainty.
5. Generate an answer through the configured provider.
6. Validate that every factual cultural statement is linked to one or more retrieved sources.
7. Return answer, citations, confidence, conflicting interpretations, and a feedback action.
8. Store an auditable record without exposing restricted text to unauthorized logs or analytics.

### Dress Weaver design

1. User creates a project and selects a garment template.
2. User selects a governed motif/sample asset.
3. Canvas stores transformations as declarative JSON: scale, position, rotation, repeat, crop, clipping region, and palette mapping.
4. Browser renders an interactive preview.
5. Background service creates reproducible high-resolution previews when exported.
6. Each saved version references exact asset versions, palette IDs, renderer version, and settings.

## 7. Deployment stages

### Local development

Docker Compose services:

- `web`
- `ai-api`
- `ai-worker`
- `postgres` with pgvector
- `redis`
- `object-storage`
- optional `mailpit`
- optional observability collector/profile

### Pilot deployment

Single Linux server or institutional VM using Docker Compose, reverse proxy, TLS, backups, and externally managed DNS. Suitable for controlled research pilots.

### Production growth

Move database and object storage to managed or institutionally supported services, separate workers by workload, use GPU nodes only when needed, and add autoscaling after measured demand. Kubernetes is not a Year-1 requirement.
