# Phase 5 Plan — Research Lab Pilot

**Date:** 2026-08-07  
**Scope:** Governed research-experiment module for a pilot publication dataset.  
**Out of scope:** In-app statistical inference beyond descriptive quality checks; production PII collection.

## Goals

1. Study and versioned protocol records.
2. Instruments and item bank.
3. Conditions and stimulus sets based on immutable design/sample versions.
4. Pseudonymous participants and consent linkage (identity separated from responses).
5. Random assignment with stored seed and algorithm version.
6. Attention checks and completion status; response collection UI.
7. Codebook, CSV, JSON, and reproducibility-manifest exports (audited, approved purpose).
8. Researcher dashboard with data-quality checks.

## Pilot target

Controlled experiment comparing several colorways of the same motif, measuring authenticity, cultural identity, aesthetic appeal, emotion, premium perception, memorability, cultural appropriateness, and purchase intention — using **fictional DEMO stimuli only**.

## Assumptions

| ID | Assumption |
| ---- | ---------- |
| A1 | Usage analytics are not research data unless a study explicitly enables them. |
| A2 | Exports require approved purpose codes and leave an audit trail. |
| A3 | Withdrawn participants follow protocol/release status rules in domain helpers. |
| A4 | Seed study `DEMO-STUDY-COLORWAY-001` is sufficient for local/pilot demos. |

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Accidental PII in seed/logs | Pseudonyms only; do not log response bodies |
| Export leakage of restricted stimuli | Reuse catalogue/access filters on stimulus resolution |
| Parallel schema drift | Additive migrations; single migrate/seed path |

## Acceptance checks

- [ ] Pilot study configurable/runnable/exportable without direct DB editing
- [ ] Export bundle includes codebook + reproducibility manifest
- [ ] Unapproved export purposes rejected
- [ ] Demo study labelled fictional
- [ ] Domain unit tests for assignment + export shape
