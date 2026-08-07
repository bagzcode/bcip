# ADR-0008: FreeSewing-inspired pattern editor in Dress Weaver

- **Status:** Accepted
- **Date:** 2026-08-07

## Context

Dress Weaver already provides Konva motif placement on fictional garment flats (`DEMO-GARMENT-*`) with immutable design JSON. Product direction is to adopt the **interaction model** of the [FreeSewing online editor](https://freesewing.eu/editor) (design selection, named measurement sets, draft/view modes, units, pan/zoom, export) while keeping batik motif application as BCIP’s differentiator.

FreeSewing publishes MIT-licensed packages (`@freesewing/core`, `@freesewing/aaron`, plugins). Installing a minimal set works for Node drafting, but the v4 package graph declares incomplete transitive peers for pnpm (`plugin-transform`, `config`, …) and uses JSON import attributes — fine in Node 22 / Next server actions, fragile if bundled into the browser.

## Decision

1. **Adopt FreeSewing packages for Aaron drafts** on the server via `draftPatternAction` → `draftPatternSvg` (`@freesewing/aaron` 4.10.0 + required peers). No browser→AI calls; authz/audit through existing server actions.
2. **Mirror editor UX in Dress Weaver**, not FreeSewing branding: view modes `draft | measurements | motif | compare | export`, pattern design picker (`aaron` | `garment-flat`), named measurement sets (seed **Bogus** + Aaron mm values from the public editor share URL), metric storage with imperial display, SVG pan/zoom + download.
3. **Persist** optional `design.pattern` on schemaVersion 1 design JSON (backward compatible). Legacy versions resolve Aaron/Bogus defaults in domain.
4. **Keep Konva motif workspace** as the Motif view; do not fork Motif Explorer catalogue permission rules.
5. Document incomplete FreeSewing peer installs in this ADR; pin explicit `@freesewing/*` packages in `@bcip/web`.

## Consequences

- `@bcip/web` depends on MIT `@freesewing/*` 4.10.0 packages listed in `package.json`.
- Draft SVG is generated server-side; clients display trusted SVG from our action.
- Full FreeSewing option UI, multi-design catalogue, and paperless/layout views remain deferred.
- If FreeSewing packaging regresses under pnpm, fall back to `garment-flat` placeholder drafts without removing the interaction model.

## Rejected alternatives

- **Brand-clone FreeSewing UI** — out of scope; BCIP keeps its own shell and batik workflow.
- **Client-only FreeSewing** — heavier bundle + JSON import attribute risk; server draft is enough for MVP.
- **Parametric-only without FreeSewing** — rejected while Aaron packages draft successfully under Node 22.
