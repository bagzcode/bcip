# Phase 4 Implementation Plan — Dress Weaver MVP

**Date:** 2026-08-07  
**Scope:** Reproducible 2D garment + motif placement workspace.  
**Out of scope:** Photorealistic try-on, 3D/AR, true garment warping, pattern-grade CAD.

## Goals

1. Additive schema for garment templates/regions, design projects/versions/layers/palette mappings/previews, plus comments and expert-review rows.
2. Deterministic design JSON (canonicalize → checksum → immutable versions).
3. Seed fictional templates (`DEMO-GARMENT-*`) and demo project `DEMO-DESIGN-001`.
4. `/dress-weaver` workspace: template selection, place public demo motifs, transform controls, save versions, side-by-side compare, medium-res preview export metadata with attribution/watermark rules.
5. Konva selected over Fabric.js (`decisions/ADR-0007-canvas-library.md`).

## Assumptions

| ID | Assumption |
| ---- | ---------- |
| A1 | Motif Explorer catalogue helpers (`listMotifs`) remain the source of placeable public demo motifs; Dress Weaver does not fork catalogue access rules. |
| A2 | Design JSON is canonical; `design_layers` / `design_palette_mappings` are denormalized query helpers written at save time. |
| A3 | Demo projects are publicly readable; saving versions is allowed without governance elevation for local MVP. |
| A4 | Preview “export” in MVP persists attribution metadata (+ object key placeholder); binary PNG upload may attach later. |
| A5 | No Motif Explorer core file edits — import APIs/domain helpers only. |

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Parallel phase migrations collide | Dress Weaver migration `0003_*` is additive Dress Weaver tables only; Phase 3 chat stays in `0002_*`. |
| Non-deterministic floats across browsers | Domain quantizes transforms to 4 decimal places before checksum. |
| Accidental heritage claims in UI | All seed titles/summaries carry `DEMO / FICTIONAL` labels. |

## Acceptance checks

- [ ] `DEMO-DESIGN-001` opens at `/dress-weaver/DEMO-DESIGN-001`
- [ ] Loading a saved version reproduces layer transforms from design JSON
- [ ] Unit tests cover design JSON round-trip + checksum stability
- [ ] Export metadata includes attribution text and watermark flag
- [ ] Migrate + seed succeed; lint/typecheck/unit tests pass for touched packages
