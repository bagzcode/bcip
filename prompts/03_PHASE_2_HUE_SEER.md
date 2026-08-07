# Cursor Prompt — Phase 2: Hue Seer Baseline

Implement the publication-grade baseline of Hue Seer using the existing architecture.

## Scope

- Calibrated and exploratory analysis modes.
- Signed asset access and asynchronous Celery job.
- Image validation and quality warnings.
- Baseline foreground segmentation with manual-mask override support.
- Convert and report display RGB/HEX plus CIELAB, LCh, HSV.
- Dominant palette with proportions.
- Mean lightness/chroma, hue distribution, color entropy, warm/cool ratio, and CIEDE2000 comparisons.
- Store source asset version, mask, algorithm version, parameters, dependency versions, warnings, and derived object checksums.
- Analysis detail, compare, review, and CSV/JSON export pages.

## Scientific constraints

- Clearly label non-calibrated output.
- Do not silently assume calibration if the target/profile is absent.
- Add known-color regression fixtures and document conversion assumptions.
- Same input, parameters, and version must produce stable results within documented tolerance.
- Do not invent cultural meanings or recommendations in this phase.

## Completion

Add tests, benchmark notes, UI screenshots through Playwright where practical, and `PHASE_2_REPORT.md`. Stop before palette recommendation or AI-generated cultural interpretation.
