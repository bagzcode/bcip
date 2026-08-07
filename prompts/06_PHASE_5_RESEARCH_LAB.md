# Cursor Prompt — Phase 5: Research Lab Pilot

Implement the minimum governed research-experiment module required for a pilot publication dataset.

## Scope

- Study and versioned protocol records.
- Instruments and item bank.
- Conditions and stimulus sets based on immutable design/sample versions.
- Pseudonymous participants and consent linkage.
- Random assignment with stored seed and algorithm version.
- Attention checks and completion status.
- Response collection.
- Codebook, CSV, JSON, and reproducibility-manifest exports.
- Researcher dashboard with data-quality checks.

## Governance

- Participant identity/consent data is separated from response data.
- Usage analytics are not research data unless the study explicitly enables them.
- Exports require approved purpose and are audited.
- Withdrawn participants are handled according to the protocol and release status.

## Pilot target

Support a controlled experiment comparing several colorways of the same motif and measuring authenticity, cultural identity, aesthetic appeal, emotion, premium perception, memorability, cultural appropriateness, and purchase intention.

Do not implement statistical inference in the production app beyond descriptive quality checks. Provide an analysis-ready export and a reproducible notebook template instead. Finish with a Phase-5 report.
