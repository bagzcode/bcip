# ADR-0007: Dress Weaver canvas library (Konva)

- **Status:** Accepted
- **Date:** 2026-08-07

## Context

Phase 4 Dress Weaver needs a browser 2D workspace for garment flats with motif placement (move, scale, rotate, optional repeat) while keeping design state as deterministic declarative JSON. Candidates evaluated: **Konva / react-konva** and **Fabric.js**.

## Decision

Use **Konva 10.x** with **react-konva 19.x** (React 19 peer-compatible) for the Dress Weaver MVP canvas.

Rationale:

1. Scene-graph model maps cleanly to layer lists in design JSON (groups, transforms, clip functions).
2. `react-konva` integrates with the Next.js App Router via client-only dynamic import (`ssr: false` / lazy `import()`), avoiding canvas access during SSR.
3. Transform APIs (x/y/scale/rotation/opacity/drag) cover Fashion Designer prototype intents without Fabric’s heavier editor abstractions.
4. Smaller conceptual surface for deterministic round-trips: UI mutates layer transforms → domain `canonicalizeDesignDocument` → immutable `design_versions.design_json`.

## Rejected alternatives

- **Fabric.js** — strong object model and image filters, but heavier for our declarative JSON-first workflow; React bindings are less idiomatic than react-konva for this stack.
- **Raw Canvas 2D** — too much custom hit-testing/drag code for MVP; deferred unless Konva becomes a liability.
- **SVG-only React** — adequate for static flats; weaker for interactive drag/clip UX at garment scale.

## Consequences

- `@bcip/web` pins `konva` and `react-konva` in the lockfile; versions recorded here and in ADR-0004 amendments when upgraded.
- Canvas components must remain client-only.
- Design persistence never stores Konva node trees — only Zod-validated design documents.
