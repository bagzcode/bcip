from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "bcip-ai"
    environment: str = "development"
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://bcip:change-me@localhost:5432/bcip"
    ai_service_token: str = "replace-me"
    s3_endpoint: str = "http://localhost:9000"
    celery_task_always_eager: bool = False  # env: CELERY_TASK_ALWAYS_EAGER


def load_settings() -> Settings:
    return Settings()
