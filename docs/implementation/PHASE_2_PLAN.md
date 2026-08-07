# Phase 2 Plan — Hue Seer Baseline (MVP)

**Status:** Implemented (MVP)  
**Scope:** Publication-grade *baseline* color workflow — not Year-2 palette recommendation or dye-process prediction.

## Goals

- Calibrated vs exploratory analysis modes with unmistakable UI/API labels.
- Async FastAPI → Celery path that records algorithm version, parameters, dependency versions, warnings, and result checksums.
- Web surfaces to list/view/compare/export demo analyses and enqueue jobs against seeded (or uploaded) assets.
- Seeded fictional analyses so the DB is usable without GPU/image decode.

## Non-goals

- Cultural meanings, Lasem symbolism, or palette recommendations.
- Real image decode / GPU segmentation (Phase 2 MVP uses a **deterministic stub** seeded from object key + parameters).
- Dye-process prediction (later Hue Seer capability — see `ECOSYSTEM_ALIGNMENT.md`).

## Schema (additive)

| Table                 | Role                                              |
| --------------------- | ------------------------------------------------- |
| `color_analysis_jobs` | Job tracking + algorithm/parameter versions       |
| `color_analyses`      | Stored results (`is_calibrated`, warnings, label) |
| `analysis_masks`      | Baseline / manual mask metadata                   |
| `palettes`            | Palette container per analysis                    |
| `palette_colors`      | RGB/HEX + Lab/LCh/HSV swatches + proportions      |
| `color_features`      | Mean L/C, entropy, warm/cool, hue distribution    |
| `color_comparisons`   | CIEDE2000 pair summaries                          |

Migration: `packages/db/drizzle/0004_wet_loners.sql` (also includes Research Lab tables already present in the shared schema from parallel agents).

## Pipeline

- Algorithm: `bcip-color-pipeline@0.2.0`
- Worker: `bcip_ai.color_analyze` → `run_color_analysis`
- Conversion assumptions: sRGB → XYZ → CIELAB (D65 / 2°); CIEDE2000 (Sharma 2005)
- Calibrated flag is **false** unless `analysis_mode=calibrated` **and** `calibration.target_id` is present
- HTTP `POST /v1/color/analyze` remains acknowledgement-only (no palette in response body)
- Callback: `POST /api/internal/jobs/result` (service token) persists results

## Seed keys

- `DEMO-ANALYSIS-EXPL-A` / `DEMO-ANALYSIS-EXPL-B` (exploratory)
- `DEMO-ANALYSIS-CAL-A` (calibrated, target `CC-01`)
- Assets: `demo/fictional/hue-seer-a.png`, `demo/fictional/hue-seer-b.png`

## Web routes

| Route                                         | Purpose                |
| --------------------------------------------- | ---------------------- |
| `/hue-seer`                                   | List + enqueue         |
| `/hue-seer/[code]`                            | Detail + palette       |
| `/hue-seer/compare`                           | Two-sample CIEDE2000   |
| `/api/hue-seer/export/[code]?format=json\|csv` | Export                 |
| `/api/color/analyze`                          | BFF enqueue (session)  |
| `/api/internal/jobs/result`                   | Worker callback        |

## Demo

1. `pnpm --filter @bcip/db migrate && pnpm --filter @bcip/db seed`
2. Open `http://localhost:3000/hue-seer`
3. Inspect `DEMO-ANALYSIS-EXPL-A` vs `DEMO-ANALYSIS-CAL-A` labels
4. Compare at `/hue-seer/compare?a=DEMO-ANALYSIS-EXPL-A&b=DEMO-ANALYSIS-EXPL-B`
5. Export as designer: sign in `designer@demo.bcip.local` / `DemoPass123!`
6. Optional live job: start AI + Redis/Celery, enqueue from UI (callback persists new `DEMO-ANALYSIS-*` row)

## Tests

- Domain: `packages/domain/tests/color.test.ts` (labels, CIEDE2000, export)
- AI: `services/ai/tests/test_color_pipeline.py` (known-color Lab, stability, calibrated gate)
- DB schema: Phase 2 table names in `packages/db/tests/schema.test.ts`
