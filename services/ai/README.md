# BCIP AI service

FastAPI + Celery worker for computer vision and scientific jobs.

Phase 0 exposes health endpoints and a typed color-analysis **queue placeholder** only.

## Endpoints

| Method | Path                | Notes                                                  |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/health/live`      | Liveness                                               |
| GET    | `/health/ready`     | Redis readiness                                        |
| POST   | `/v1/color/analyze` | Bearer service token; returns queued job contract only |
| GET    | `/docs`             | FastAPI Swagger UI (OpenAPI)                           |
| GET    | `/openapi.json`     | OpenAPI schema                                         |

## OpenAPI → TypeScript workflow

1. Run the AI API locally (`uvicorn bcip_ai.main:app --port 8000`).
2. Fetch the schema: `curl -s http://localhost:8000/openapi.json -o /tmp/bcip-ai.openapi.json`.
3. Generate or hand-align TypeScript contracts in `packages/contracts` (Phase 0 keeps Zod schemas as the browser-facing source of truth; OpenAPI is the Python boundary).
4. The Next.js app must call AI only via server-side clients (`apps/web/src/lib/ai-client.ts`), never from the browser.

## Local Python

Use **Python 3.12** (also used in Docker):

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e ".[dev]"
pytest
```
