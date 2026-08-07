from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ProblemDetails(BaseModel):
    type: str
    title: str
    status: int
    code: str
    detail: str
    request_id: UUID


class ColorAnalyzeParameters(BaseModel):
    palette_size: int | None = Field(default=None, ge=1, le=32)
    segmentation_method: str | None = None
    clustering_method: str | None = None


class ColorAnalyzeCallback(BaseModel):
    url: str
    token_reference: str


class ColorAnalyzeRequest(BaseModel):
    job_id: UUID
    asset_version_id: UUID
    input_object_key: str = Field(min_length=1)
    analysis_mode: str = Field(pattern="^(calibrated|exploratory)$")
    parameters: ColorAnalyzeParameters = Field(default_factory=ColorAnalyzeParameters)
    callback: ColorAnalyzeCallback | None = None


class ColorAnalyzeQueuedResponse(BaseModel):
    """Phase 0: queued acknowledgement only — never fabricated analysis results."""

    job_id: UUID
    status: str = Field(pattern="^queued$")
    message: str
    request_id: UUID


class HealthLiveResponse(BaseModel):
    status: str = "ok"


class HealthCheck(BaseModel):
    ok: bool
    detail: str | None = None


class HealthReadyResponse(BaseModel):
    status: str
    checks: dict[str, HealthCheck]


def new_request_id(existing: str | None = None) -> UUID:
    if existing:
        try:
            return UUID(existing)
        except ValueError:
            pass
    return uuid4()


def problem_dict(**kwargs: Any) -> dict[str, Any]:
    return ProblemDetails(**kwargs).model_dump(mode="json")
