# 04 — API and Job Contracts

## 1. API strategy

- The browser communicates primarily with the Next.js application.
- Next.js acts as the backend-for-frontend and enforces user/session and domain authorization.
- The Python AI service is private to the application network; do not expose it directly to the public internet during the pilot.
- Generate TypeScript clients from the FastAPI OpenAPI schema.
- Validate all external input with Zod in TypeScript and Pydantic in Python.
- Use idempotency keys for job creation, upload finalization, and export actions.

## 2. Suggested Next.js route groups

```text
/api/catalog/*
/api/color/*
/api/knowledge/*
/api/design/*
/api/research/*
/api/governance/*
/api/uploads/*
/api/jobs/*
/api/auth/*
```

Prefer server actions for tightly coupled UI mutations and route handlers for external/integration APIs. Both must call the same domain services and permission checks.

## 3. Private AI service endpoints

### Health

- `GET /health/live`
- `GET /health/ready`

### Color

- `POST /v1/color/analyze`
- `POST /v1/color/compare`
- `POST /v1/color/validate-capture`
- `POST /v1/color/recolor`
- `POST /v1/color/recommend`

### Embeddings and search support

- `POST /v1/embeddings/text`
- `POST /v1/embeddings/image`
- `POST /v1/embeddings/palette`

### Knowledge

- `POST /v1/knowledge/rerank`
- `POST /v1/knowledge/answer`
- `POST /v1/knowledge/validate-grounding`

### Design rendering

- `POST /v1/design/render`

## 4. Example color-analysis request

```json
{
  "job_id": "uuid",
  "asset_version_id": "uuid",
  "input_object_key": "restricted/raw/...",
  "analysis_mode": "calibrated",
  "calibration": {
    "target_id": "CC-01",
    "illuminant": "D65",
    "observer": "2_degree"
  },
  "parameters": {
    "palette_size": 6,
    "segmentation_method": "baseline-v1",
    "clustering_method": "kmeans-lab-v1"
  },
  "callback": {
    "url": "http://web:3000/api/internal/jobs/result",
    "token_reference": "short-lived-service-token"
  }
}
```

## 5. Example analysis result

```json
{
  "job_id": "uuid",
  "status": "completed",
  "algorithm": {
    "name": "bcip-color-pipeline",
    "version": "0.1.0",
    "git_commit": "commit-sha"
  },
  "quality": {
    "calibrated": true,
    "warnings": [],
    "mask_confidence": 0.94
  },
  "palette": [
    {
      "rank": 1,
      "proportion": 0.38,
      "lab": [42.1, 35.0, 22.4],
      "lch": [42.1, 41.6, 32.6],
      "display_hex": "#8D4B3B"
    }
  ],
  "features": {
    "color_entropy": 0.64,
    "warm_cool_ratio": 0.72,
    "mean_lightness": 48.2,
    "mean_chroma": 39.8
  },
  "derived_objects": [
    {"type": "mask", "object_key": "restricted/derived/..."},
    {"type": "palette_swatch", "object_key": "public-or-restricted/..."}
  ]
}
```

## 6. Asynchronous job states

- `queued`
- `claimed`
- `running`
- `awaiting_review`
- `completed`
- `failed_retryable`
- `failed_terminal`
- `cancelled`

Store job events separately to maintain a timeline. Workers must be idempotent and should not overwrite completed scientific results without creating a new analysis version.

## 7. Error model

Use a consistent problem-details shape:

```json
{
  "type": "https://bcip.example/problems/forbidden-purpose",
  "title": "Use is not permitted",
  "status": 403,
  "code": "GOVERNANCE_PURPOSE_FORBIDDEN",
  "detail": "The asset may be used for research retrieval but not model training.",
  "request_id": "uuid"
}
```

Do not leak whether a culturally restricted record exists when the user has no permission to know it exists.
