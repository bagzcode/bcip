from fastapi.testclient import TestClient

from bcip_ai.main import app
from bcip_ai.settings import load_settings


def test_health_live() -> None:
    client = TestClient(app)
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "x-request-id" in response.headers


def test_color_analyze_requires_auth() -> None:
    client = TestClient(app)
    response = client.post(
        "/v1/color/analyze",
        json={
            "job_id": "11111111-1111-4111-8111-111111111111",
            "asset_version_id": "22222222-2222-4222-8222-222222222222",
            "input_object_key": "restricted/raw/demo.png",
            "analysis_mode": "exploratory",
            "parameters": {},
        },
    )
    assert response.status_code == 401


def test_color_analyze_queues_without_fabricated_results(monkeypatch) -> None:
    settings = load_settings()

    class ImmediateResult:
        def delay(self, payload):  # noqa: ANN001
            return payload

    monkeypatch.setattr("bcip_ai.main.color_analyze_task", ImmediateResult())

    client = TestClient(app)
    response = client.post(
        "/v1/color/analyze",
        headers={"Authorization": f"Bearer {settings.ai_service_token}"},
        json={
            "job_id": "11111111-1111-4111-8111-111111111111",
            "asset_version_id": "22222222-2222-4222-8222-222222222222",
            "input_object_key": "restricted/raw/demo.png",
            "analysis_mode": "exploratory",
            "parameters": {"palette_size": 6},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert "palette" not in body
    assert "features" not in body
