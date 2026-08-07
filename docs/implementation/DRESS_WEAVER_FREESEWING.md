# Dress Weaver × FreeSewing — MVP plan note

**Date:** 2026-08-07  
**ADR:** `decisions/ADR-0008-freesewing-pattern-editor.md`

## Mirrored behaviors (FreeSewing editor → Dress Weaver)

| FreeSewing editor | Dress Weaver MVP |
| ----------------- | ---------------- |
| Design picker (`aaron`) | Pattern design: Aaron (FreeSewing) or garment-flat (BCIP template) |
| Measurement set name (`Bogus`) | Named set editor; seed Bogus + Aaron mm from share URL |
| Measurements panel | Measurements view / sidebar fields (mm store; imperial display) |
| Units metric/imperial | Units toggle |
| Draft view + pan/zoom | Draft view with wheel zoom + drag pan |
| Export | SVG download + existing preview metadata export |
| (settings / inspect extras) | Deferred |

Batik motif placement remains the differentiator (Motif view, Konva, DEMO/FICTIONAL labels).

## Integration approach

- Optional `pattern` block on `DesignDocument` (contracts) → canonicalize in `@bcip/domain`.
- Server action `draftPatternAction` runs `@freesewing/aaron` (MIT) and audits `pattern.draft`.
- Save versions via existing `saveDesignVersionAction` (design JSON includes `pattern`).
- No Motif Explorer route/permission forks.

## How to try

1. `pnpm install` (includes `@freesewing/*` 4.10.0).
2. Migrate + seed if needed; open http://localhost:3000/dress-weaver/DEMO-DESIGN-001
3. Use **Draft** / **Measurements** — edit Bogus set, watch SVG update.
4. **Motif** — place demo batik on the kaftan flat; **Save version**.
5. **Export** — download SVG and/or preview metadata.

## Deferred

- Full FreeSewing design catalogue beyond Aaron
- Option ease UI, paperless/cut layout, PDF print
- Binary PNG upload for motif preview export
- Imperial as storage unit (display-only for now)
