# BCIP — Batik Design Intelligence Platform

Multimodal, culturally grounded **batik** design-intelligence ecosystem connecting heritage motifs, craft knowledge, color science, explainable guidance, and fashion application. Pilot domain: **Batik Lasem**.

> **Naming note:** BCIP formerly expanded as “Batik Color Intelligence Platform.” Public surfaces now use **Batik Design Intelligence** (color remains the Hue Seer module). See `docs/implementation/BATIK_FIRST_REBRAND.md` and `apps/web/src/brand/identity.ts`.

Phases 0–5 MVP surfaces are on `main` (Motif Explorer, Hue Seer, Lasem Guru, Dress Weaver, Research Lab, Governance Console). Demo cultural content is labelled fictional — never treat it as heritage fact.

## Prerequisites

- Node.js 22+
- pnpm 10.14 (`corepack prepare pnpm@10.14.0 --activate` or install under `~/.local`)
- Docker Compose v2
- Python 3.12 (containers always use 3.12; host 3.11 may work for local pytest)

## Quick start

```bash
cp .env.example .env
export PATH="$HOME/.local/bin:$PATH"

# Install workspace dependencies
pnpm install

# Python AI service (editable + dev extras)
python3.12 -m venv services/ai/.venv   # or: python3 -m venv ...
source services/ai/.venv/bin/activate
pip install -U pip
pip install -e "services/ai[dev]"

# Infrastructure (Postgres/pgvector, Redis, MinIO)
pnpm infra:up

# Schema + fictional demo seeds
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Application processes (separate terminals)
pnpm --filter @bcip/web dev
# AI API
cd services/ai && source .venv/bin/activate && uvicorn bcip_ai.main:app --reload --port 8000
# AI worker
cd services/ai && source .venv/bin/activate && celery -A bcip_ai.worker.app worker --loglevel=INFO
```

Full stack via Compose:

```bash
pnpm stack:config   # validate compose file
pnpm stack:up       # build and start all services
pnpm stack:down
```

## Demo logins

After `pnpm db:seed`, sign in at http://localhost:3000/sign-in

| Email | Notes |
| ----- | ----- |
| `visitor@demo.bcip.local` | Public catalogue |
| `designer@demo.bcip.local` | Uploads / Hue Seer enqueue |
| `researcher@demo.bcip.local` | Research Lab + research_only tier |
| `steward@demo.bcip.local` | Governance + restricted grant fixture |
| `admin@demo.bcip.local` | Admin (still needs explicit grant for culturally_restricted) |

Password for all demo users: `DemoPass123!`

## Seed inventory (fictional)

All cultural/demo rows are labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`. Use these codes for manual testing after `pnpm db:migrate && pnpm db:seed`:

| Module | Seed codes / entry points |
| ------ | ------------------------- |
| Motif Explorer | `DEMO-MOTIF-A/B` (public), `DEMO-MOTIF-R` (research), `DEMO-MOTIF-X` (restricted); samples `DEMO-SAMPLE-A1/B1/R1/X1`, withdrawn `DEMO-SAMPLE-W1`; collection `DEMO-COL-001` |
| Hue Seer | Exploratory `DEMO-ANALYSIS-EXPL-A/B`, calibrated `DEMO-ANALYSIS-CAL-A`; UI `/hue-seer`, `/hue-seer/compare` |
| Lasem Guru | Sources `DEMO-SRC-LG-001/002/R/X/INJ` (grounded Q&A; restricted/injection fixtures must not leak) |
| Dress Weaver | Templates `DEMO-GARMENT-KAFTAN`, `DEMO-GARMENT-TUNIC`; project `/dress-weaver/DEMO-DESIGN-001` |
| Research Lab | Study `/research/DEMO-STUDY-COLORWAY-001` (+ `/collect`, export JSON/CSV under `/api/research/.../export`) |
| Governance | Access policies, consent, provenance sources/claims, review queue — open `/governance` as steward |

Recommended walkthrough: sign in as `steward@demo.bcip.local` for governance/restricted fixtures; use `researcher@demo.bcip.local` for Research Lab; `designer@demo.bcip.local` for Hue Seer enqueue and Dress Weaver edits.

## Module URLs (local)

| Module | URL |
| ------ | --- |
| Landing | http://localhost:3000/ |
| Motif Explorer | http://localhost:3000/explore |
| Hue Seer | http://localhost:3000/hue-seer |
| Lasem Guru | http://localhost:3000/lasem-guru |
| Dress Weaver | http://localhost:3000/dress-weaver |
| Research Lab | http://localhost:3000/research |
| Pilot study | http://localhost:3000/research/DEMO-STUDY-COLORWAY-001 |
| Governance | http://localhost:3000/governance |
| Workspace (auth) | http://localhost:3000/workspace |
| Health dashboard | http://localhost:3000/system/health |
| AI live | http://localhost:8000/health/live |
| AI ready | http://localhost:8000/health/ready |
| Postgres (host) | localhost:5433 |
| MinIO console | http://localhost:9001 |

## Quality commands

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm ai:test          # or: pytest services/ai/tests
pnpm build
pnpm test:e2e
```

## Cultural safety

Demo motifs, sources, analyses, designs, and studies are labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`. Do not invent Batik Lasem cultural meanings. Restricted operational data must never be committed — see `data/README.md`.

## Documentation

- Architecture and product docs: `docs/`
- ADRs: `decisions/`
- Phase plans/reports: `docs/implementation/` (`PHASE_0` … `PHASE_5`)
- Cursor rules: `.cursor/rules/`
