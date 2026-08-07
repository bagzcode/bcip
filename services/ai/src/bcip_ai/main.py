from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from redis import Redis

from bcip_ai.schemas import (
    ColorAnalyzeQueuedResponse,
    ColorAnalyzeRequest,
    HealthLiveResponse,
    HealthReadyResponse,
    HealthCheck,
    new_request_id,
    problem_dict,
)
from bcip_ai.settings import Settings, load_settings
from bcip_ai.worker import color_analyze_task

logger = logging.getLogger("bcip_ai")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="BCIP AI Service", version="0.1.0")


def get_settings() -> Settings:
    return load_settings()


def require_service_token(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> None:
    expected = f"Bearer {settings.ai_service_token}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid service token")


@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request_id = new_request_id(request.headers.get("x-request-id"))
    request.state.request_id = request_id
    response: Response = await call_next(request)
    response.headers["x-request-id"] = str(request_id)
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", new_request_id())
    payload = problem_dict(
        type="https://bcip.local/problems/http",
        title=exc.detail if isinstance(exc.detail, str) else "HTTP error",
        status=exc.status_code,
        code="HTTP_ERROR",
        detail=str(exc.detail),
        request_id=request_id,
    )
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.get("/health/live", response_model=HealthLiveResponse)
def health_live() -> HealthLiveResponse:
    return HealthLiveResponse(status="ok")


@app.get("/health/ready", response_model=HealthReadyResponse)
def health_ready(settings: Settings = Depends(get_settings)) -> HealthReadyResponse:
    checks: dict[str, HealthCheck] = {}
    try:
        client = Redis.from_url(settings.redis_url, socket_connect_timeout=1)
        pong = client.ping()
        checks["redis"] = HealthCheck(ok=bool(pong), detail="pong" if pong else "no-pong")
    except Exception as exc:  # noqa: BLE001 — readiness must not crash
        checks["redis"] = HealthCheck(ok=False, detail=str(exc))

    all_ok = all(item.ok for item in checks.values())
    return HealthReadyResponse(status="ok" if all_ok else "not_ready", checks=checks)


@app.post("/v1/color/analyze", response_model=ColorAnalyzeQueuedResponse)
def color_analyze(
    body: ColorAnalyzeRequest,
    request: Request,
    _: None = Depends(require_service_token),
) -> ColorAnalyzeQueuedResponse:
    """
    Phase 0: validate and enqueue only.

    Do not return fabricated palette/feature results.
    """
    request_id = getattr(request.state, "request_id", new_request_id())
    payload = body.model_dump(mode="json")
    # Fire-and-forget enqueue; worker is a no-op placeholder in Phase 0.
    color_analyze_task.delay(payload)
    logger.info(
        "color_analyze_queued",
        extra={"job_id": str(body.job_id), "request_id": str(request_id)},
    )
    return ColorAnalyzeQueuedResponse(
        job_id=body.job_id,
        status="queued",
        message="Color analysis job accepted and queued. Results are not available in Phase 0.",
        request_id=request_id,
    )
