# Batik-first rebrand (interim)

- **Date:** 2026-08-11
- **Branch:** `feat/batik-first-rebrand`
- **Status:** Interim public naming — easy to rename via `apps/web/src/brand/identity.ts`

## Choice

| Field | Old | New (interim) |
| ----- | --- | ------------- |
| Acronym | BCIP | BCIP (unchanged technical/repo identity) |
| Expansion | Batik **Color** Intelligence Platform | Batik **Design** Intelligence Platform |
| Display name | Batik Color Intelligence Platform | **Batik Design Intelligence** |
| ID display | Platform Kecerdasan **Warna** Batik | **Kecerdasan Desain Batik** |
| Tagline focus | Heritage data + color science | Motifs, craft, color, guidance, dress design |

**Rationale:** Public surfaces were reading as a color tool. The product is a multimodal batik design-intelligence ecosystem; Hue Seer remains the color capability. “Design Intelligence” matches the product statement without inventing cultural claims. The letter **C** is no longer marketed as “Color”; BCIP stays as the stable acronym for continuity.

## Centralization

- Canonical strings: `apps/web/src/brand/identity.ts`
- User-facing EN/ID copies also live in `apps/web/src/i18n/messages.ts` (`brand`, `tagline`, `heroScope`, `footerBlurb`, module blurbs)
- Document title / meta description: `apps/web/src/app/layout.tsx` (sourced from brand identity)

## Coordination with Motif Explorer redesign

This rebrand updates **global chrome** (home, header, footer, brand tokens/copy) and marketing docs. It deliberately avoids Motif Explorer deep UI (`apps/web/src/app/explore/**`) so a parallel Motif Explorer storyboard redesign can land without commit conflicts. Shared `messages.ts` brand keys should stay aligned with Motif Explorer’s batik-first verbal identity.

## Rename later

1. Edit `apps/web/src/brand/identity.ts`
2. Mirror `brand` / `tagline` / related keys in `messages.ts`
3. Update e2e smoke regex in `tests/e2e/specs/smoke.spec.ts`
4. Update README / blueprint titles if the legal name is finalized
