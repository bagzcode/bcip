# Phase 2 Report — Hue Seer Baseline

**Date:** 2026-08-07  
**Tip commit (cumulative):** `8ff34da`  
**Stack commit:** `9f11ece` (`pr/6-hue-seer`)

## Delivered

| Area | Status |
| ---- | ------ |
| Calibrated vs exploratory modes with UI/API labels | Done |
| Async FastAPI → Celery color job + internal callback | Done (deterministic stub pipeline) |
| Schema: jobs, analyses, masks, palettes, features, comparisons | Done (`0004_*` migration shared with later phases) |
| Web list/detail/compare/export | Done — `/hue-seer`, `/hue-seer/[code]`, `/hue-seer/compare` |
| Seeded fictional analyses | Done — `DEMO-ANALYSIS-*` |

## Pipeline honesty

- Algorithm label: `bcip-color-pipeline@0.2.0`
- MVP uses a **deterministic stub** from object key + parameters — not full image decode/GPU segmentation
- Calibrated flag is false unless `analysis_mode=calibrated` **and** `calibration.target_id` is present
- HTTP analyze endpoints acknowledge/queue only; palettes come from persisted results

## Tests present

- Domain: `color.test.ts` (labels, CIEDE2000 smoke, export shape, demo labels)
- Contracts: `color-analyze.test.ts`
- Pytest: `services/ai/tests/test_health_and_color.py`

## Honest gaps

1. Not publication-grade scientific colorimetry for arbitrary phone photos — exploratory path must stay labelled.
2. No Year-2 palette recommendation or dye-process prediction.
3. Real camera/target calibration workflow is stubbed (`CC-01` seed target only).
4. Worker/callback integration depends on service token + running Redis/Celery.

## Acceptance

- [x] Exploratory vs calibrated distinction in domain + UI copy
- [x] Reproducibility fields (algorithm/params versions) on stored analyses
- [x] Demo analyses seed without GPU
- [~] Full live Celery round-trip verified in this report pass — covered by unit/pytest; stack e2e optional
