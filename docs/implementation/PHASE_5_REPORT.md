# Phase 5 Report — Research Lab Pilot

**Date:** 2026-08-07  
**Tip commit (cumulative):** `8ff34da` (`main` / `pr/9-research-lab`)

## Delivered

| Area | Status |
| ---- | ------ |
| Study / protocol / instruments / conditions / stimuli schema | Done (shared late migrations + seed) |
| Pseudonymous collect flow | Done — `/research/[studyCode]/collect` |
| Researcher study dashboard | Done — `/research`, `/research/[studyCode]` |
| Export JSON/CSV + codebook + reproducibility manifest | Done — `/api/research/[studyCode]/export` + domain helpers |
| Seed pilot `DEMO-STUDY-COLORWAY-001` | Done — fictional colorway perception pilot |
| Approved export purpose checks | Done — domain rejects unapproved purposes |

## Key URLs (local)

| Surface | URL |
| ------- | --- |
| Research index | http://localhost:3000/research |
| Pilot study | http://localhost:3000/research/DEMO-STUDY-COLORWAY-001 |
| Collect | http://localhost:3000/research/DEMO-STUDY-COLORWAY-001/collect |
| Export JSON | `/api/research/DEMO-STUDY-COLORWAY-001/export?format=json` |
| Export CSV | `/api/research/DEMO-STUDY-COLORWAY-001/export?format=csv` |

Recommended demo actor: `researcher@demo.bcip.local` / `DemoPass123!`

## Tests present

- Domain: `research.test.ts` (export shape, CSV header, deterministic assignment, unapproved purpose rejection)

## Honest gaps

1. No in-app inferential statistics — analysis-ready export + notebook template expectation remains.
2. Playwright smoke may not yet hit `/research` collect/export paths.
3. Consent/identity separation is modelled; do not treat analytics events as study responses.
4. Production IRB/protocol approval workflow is out of band — app stores demo/fictional protocol only.

## Acceptance

- [x] Seeded pilot study runnable via UI routes without hand-editing DB rows
- [x] Export includes codebook + reproducibility manifest (domain tests)
- [x] Unapproved purposes rejected
- [x] Study labelled `DEMO / FICTIONAL — NOT RESEARCH DATA`
- [~] Full researcher UX polish and e2e remain follow-ups
