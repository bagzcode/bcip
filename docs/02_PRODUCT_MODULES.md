# 02 — Product Modules and Feature Specification

## 1. Shared platform shell

### Navigation

- Home
- Explore Motifs
- Analyze Color
- Ask Lasem Guru
- Design Garment
- Research Lab
- My Workspace
- Governance/Admin, permission controlled

### Shared capabilities

- Indonesian/English language switch.
- Search bar with filters and saved queries.
- Notifications for job completion, reviews, invitations, and consent actions.
- Persistent identifiers and version labels on every research object.
- Citation/provenance drawer available from all modules.
- Accessibility target: WCAG 2.2 AA.
- Mobile-responsive public pages; desktop-first design workspace.

## 2. Motif Explorer

### MVP features

- Public/restricted catalogue views.
- Collection, motif, and sample detail pages.
- Filters: motif, isen-isen, color family, technique, dye type, period, producer, occasion, language, review status, and access tier.
- Text search using PostgreSQL full-text search.
- Palette-based filtering.
- Related samples based on metadata and basic visual embeddings.
- Save to personal collection.
- Compare up to four samples.
- Export permitted metadata as CSV/JSON.
- Contributor and source attribution.
- Expert review status and known uncertainty.

### Later features

- Upload-to-search visual similarity.
- Region-aware comparison.
- Timeline and network visualizations.
- Educational story paths and quizzes.

### Acceptance criteria

- A sample uses one persistent ID across all modules.
- Restricted records never appear in unauthorized search results, counts, snippets, or embeddings.
- Every cultural description shows source and review status.

## 3. Hue Seer

### Analysis modes

1. **Scientific/calibrated mode:** requires capture metadata and calibration target; suitable for publication datasets.
2. **Exploratory/photo mode:** accepts ordinary images; results are clearly labelled non-calibrated and must not be presented as laboratory-accurate measurements.

### MVP features

- Upload and job-progress interface.
- Image quality checks: file type, resolution, focus warning, clipping, glare/shadow warning, and calibration-target presence where required.
- Background/fabric segmentation with manual mask correction.
- Dominant palette extraction with proportions.
- RGB/HEX for display plus CIELAB, LCh, HSV, and algorithm metadata.
- Hue distribution, lightness/chroma, color entropy, warm/cool ratio, contrast summary, and CIEDE2000 comparison.
- Save an analysis version.
- Compare two samples.
- Export analysis JSON/CSV and palette swatch.

### Year-2 features

- Controlled recoloring while preserving luminance/texture constraints.
- Artisan-defined palette constraints.
- Palette recommendation with explanation, confidence, and alternatives.
- Natural-dye feasibility knowledge where documented.
- Human feedback and recommendation outcome logging.

### Scientific requirements

- Store source image, calibrated derivative, mask, parameters, algorithm version, and dependency/model versions.
- Maintain regression fixtures with known expected colors.
- Do not silently convert between white points or profiles.
- Report uncertainty and calibrated/non-calibrated status.

## 4. Lasem Guru

### MVP features

- Bilingual chat.
- Questions about motifs, colors, production, history, occasions, and sources.
- Answers grounded only in approved knowledge records.
- Inline citations linked to source fragments.
- Labels for documented claim, contributor interpretation, model inference, and uncertainty.
- Show conflicting interpretations when valid.
- Feedback: useful, incorrect, incomplete, culturally inappropriate, or permission concern.
- Expert correction workflow.

### Guardrails

- Refuse to invent a meaning when no approved evidence is available.
- Never expose restricted source text to a user without permission.
- Avoid universal wording such as “red always means…” unless a source explicitly supports the exact scope.
- Maintain answer records with retrieval set, model/provider, prompt version, and policy version.

### Later features

- Ask about the currently viewed motif/image.
- Guided education mode and quizzes.
- Audio narration where consent permits.
- Research comparison of explanation styles.

## 5. Dress Weaver

### MVP features

- Curated 2D garment templates: shirt, dress, outerwear, skirt, scarf, and accessory.
- Select a motif/sample from Motif Explorer.
- Apply motif to named clipping regions.
- Move, scale, rotate, repeat, and mirror where culturally/design appropriate.
- Adjust background/plain fabric.
- Apply saved Hue Seer palettes using reversible mappings.
- Save versions and side-by-side compare.
- Export a medium-resolution preview with attribution/watermark rules.

### Year-2/3 features

- Collaborative comments and expert cultural review.
- Higher-resolution deterministic server rendering.
- Pattern alignment and border placement assistance.
- Product/consumer evaluation experiments.
- Production specification export.
- Optional 3D visualization only after 2D workflow value is validated.

### Acceptance criteria

- Design JSON is deterministic and versioned.
- Export records exact motif asset version and palette mapping.
- Original motif image is never destructively modified.

## 6. Research Lab

### MVP features

- Study and protocol records.
- Consent linkage and participant pseudonymous IDs.
- Instrument and item bank.
- Stimulus sets generated from governed assets.
- Randomized assignment and attention checks.
- Response collection and completion status.
- CSV/JSON export with codebook.
- Dataset/software/model version manifest.

### Later features

- Repeated-measures and conjoint/choice tasks.
- Designer task telemetry.
- Pre/post tests and learning outcomes.
- Field-use analytics with explicit consent.
- Reproducible analysis notebooks and DOI/release workflow.

## 7. Governance Console

### MVP features

- Rights holder and contributor records.
- Consent version and status.
- Attribution preference.
- Permitted purposes: education, noncommercial research, public display, AI retrieval, model training, commercial design, and other explicit purposes.
- Access tiers: public, registered, research-only, partner-only, culturally restricted.
- Embargo and withdrawal.
- Expert review workflow.
- Release approval checklist.
- Audit search and export.

### Non-negotiable behavior

A general administrator role cannot override cultural/data restrictions without a recorded policy-approved process. Deletion and withdrawal must address database records, search indexes, embeddings, caches, generated derivatives, and future dataset releases.
