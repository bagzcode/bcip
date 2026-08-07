# Ecosystem App Alignment (Prototype Doc ↔ BCIP Blueprint)

**Source document:** `/Users/kerthyayana/Desktop/Batik intelligent Ecosystem app.docx`  
**Date reviewed:** 2026-08-03  
**Purpose:** Map existing prototype apps to BCIP product modules so Phase 1+ work preserves proven UX intents without importing prototype architecture (Vite islands, hardcoded knowledge, purple dashboards, or fabricated cultural facts).

## Module mapping

| Prototype (docx)                                                                                                              | BCIP module            | Phase          | Alignment notes                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batik Storyboard** (motif gallery, detail, AR room viewer, artisan blocks)                                                  | **Motif Explorer**     | 1 (+ later AR) | Keep catalogue/discovery UX intent. Replace hardcoded motifs with governed catalogue + provenance. AR / 3D room viewer is **Could** / later — Year-1 non-goal for photorealistic try-on; defer AR until 2D catalogue value is proven.                                                                                               |
| **Batik Dye Color Prediction Tool** (primary/secondary dye blend, fabric factors, concentration/temp/time, preview + history) | **Hue Seer**           | 2              | Prototype is **forward dye prediction** under process parameters. Blueprint Hue Seer starts with **image analysis** (palette extraction, CIELAB, calibrated vs exploratory). Both belong under Hue Seer: analysis first (Phase 2), process-parameter prediction as a later Hue Seer capability with scientific regression fixtures. |
| **Batik Lasem Expert** (chat, keyword RAG over 6 topics, quick chips)                                                         | **Lasem Guru**         | 3              | Keep bilingual chat UX. Replace local keyword KB with source-grounded retrieval, citations, confidence, access filtering. **Do not** port the prototype’s hardcoded Lasem “meanings” as facts.                                                                                                                                      |
| **Batik Fashion Designer** (dress flat + textile upload, canvas multiply tiling, opacity/scale)                               | **Dress Weaver**       | 4              | Keep 2D garment + motif placement intent. Upgrade to deterministic design JSON, governed assets, palette mapping, versioned exports. Pattern-scale wiring and true garment warping remain Phase 4+ work.                                                                                                                            |
| _(not in docx)_                                                                                                               | **Research Lab**       | 5              | Blueprint-only; quantitative studies/exports.                                                                                                                                                                                                                                                                                       |
| _(not in docx)_                                                                                                               | **Governance Console** | 1              | Blueprint-only; consent, licensing, access tiers, audit.                                                                                                                                                                                                                                                                            |

## Shared shell (Phase 0)

Navigation exposes all six BCIP modules plus workspace/health. Prototype-only nav items that are not Year-1 modules (**Artisans**, **Linen Library**, **Interactive Map** as top-level apps) are absorbed as Motif Explorer filters/entities later rather than separate Phase 0 routes.

## Explicit non-carryovers from prototypes

- Purple/indigo generic SaaS styling → BCIP heritage/research aesthetic.
- Hardcoded cultural Q&A answers → forbidden without provenance (project rule).
- Simulated generate/export delays without persistence → async jobs + versioned artifacts.
- Base64-in-browser uploads as system of record → signed S3 uploads + asset versions.
- Separate Vite micro-frontends → modular monolith (`apps/web`) + Python AI service.

## Feature backlog seeds for later phases

1. Hue Seer: dye-process prediction (fabric × concentration × temperature × time) with uncertainty labels.
2. Motif Explorer: artisan profiles, symbolism tags as **reviewed claims**, region/era filters.
3. Dress Weaver: opacity/scale/offset controls already prototyped; wire into design JSON.
4. Lasem Guru: quick-question chips UX pattern (content must come from approved sources).
5. Optional later: AR preview — only after Motif Explorer + Dress Weaver 2D stability.

## Phase 0 impact

Phase 0 does **not** implement prototype business features. It does:

- Name modules consistently with BCIP + this mapping.
- Surface them in the landing/nav shell as placeholders.
- Record gaps here and in `PHASE_0_PLAN.md` / `PHASE_0_REPORT.md`.
