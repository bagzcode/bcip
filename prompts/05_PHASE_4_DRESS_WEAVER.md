# Cursor Prompt — Phase 4: Dress Weaver MVP

Implement a reproducible 2D batik garment-design workspace.

## Scope

- Evaluate Konva versus Fabric.js and record the selection in an ADR.
- Add garment templates and named clipping regions.
- Select governed motif/sample assets from Motif Explorer.
- Move, scale, rotate, repeat, crop, and map saved palettes.
- Save immutable design versions as deterministic declarative JSON.
- Side-by-side version comparison.
- Browser preview plus server-side deterministic export job.
- Attribution and watermark/access rules in exported previews.
- Comments and a simple expert-review state.

## Constraints

- Never destructively edit the original asset.
- Every version references immutable asset and palette versions.
- Loading the same version must reproduce the design.
- No photorealistic try-on or 3D work in this phase.

Add tests for serialization, access restrictions, export reproducibility, and a complete Playwright design journey. Finish with a Phase-4 report.
