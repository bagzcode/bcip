# Batik Color Intelligence Platform (BCIP)

Multimodal, culturally grounded batik design-intelligence ecosystem connecting heritage data, color science, explainable AI, and fashion application. Pilot domain: **Batik Lasem**.

Phase 0 delivers the monorepo foundation only. Product modules are scaffolded, not fully implemented.

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

## Key URLs

| Surface                   | URL                                 |
| ------------------------- | ----------------------------------- |
| Web                       | http://localhost:3000               |
| Explore (demo)            | http://localhost:3000/explore       |
| Workspace (auth required) | http://localhost:3000/workspace     |
| Health dashboard          | http://localhost:3000/system/health |
| AI live                   | http://localhost:8000/health/live   |
| AI ready                  | http://localhost:8000/health/ready  |
| Postgres (host)           | localhost:5433                      |
| MinIO console             | http://localhost:9001               |

## Cultural safety

Demo motifs are labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`. Do not invent Batik Lasem cultural meanings. Restricted operational data must never be committed — see `data/README.md`.

## Documentation

- Architecture and product docs: `docs/`
- ADRs: `decisions/`
- Phase 0 plan/report: `docs/implementation/`
- Cursor rules: `.cursor/rules/`
