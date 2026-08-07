from __future__ import annotations

from celery import Celery

from bcip_ai.settings import load_settings

settings = load_settings()

celery_app = Celery(
    "bcip_ai",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

# Alias expected by `celery -A bcip_ai.worker.app`
app = celery_app

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_always_eager=settings.celery_task_always_eager,
)


@celery_app.task(name="bcip_ai.color_analyze")
def color_analyze_task(payload: dict) -> dict:
    """
    Phase 0 placeholder worker.

    Must not invent color analysis results. Real pipeline arrives in Phase 2.
    """
    return {
        "job_id": payload.get("job_id"),
        "status": "queued",
        "message": "Phase 0 placeholder: analysis not executed.",
    }
