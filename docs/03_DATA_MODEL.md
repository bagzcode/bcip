# 03 — Data Model Blueprint

## 1. Modelling principles

- Use UUIDv7 or another sortable UUID strategy for primary IDs.
- Use human-readable persistent public codes separately from database IDs.
- Version research-critical records instead of overwriting history.
- Store timestamps in UTC and display in user locale.
- Store language tags using BCP 47 values such as `id`, `en`, and regional variants where needed.
- Store access and permitted-use decisions at the most specific applicable resource, with inherited policy made explicit.
- Do not store binary images in PostgreSQL.
- All AI outputs must record model/provider, version, parameters, source IDs, and policy/prompt version.

## 2. Core entities

### Identity and organizations

- `users`
- `organizations`
- `memberships`
- `roles`
- `permissions`
- `membership_roles`

Suggested roles: `public`, `learner`, `designer`, `contributor`, `expert`, `researcher`, `data_steward`, `admin`.

### Contributors and governance

- `contributors`
- `communities`
- `rights_holders`
- `consent_records`
- `consent_purposes`
- `licenses`
- `access_policies`
- `attribution_preferences`
- `withdrawal_requests`
- `release_approvals`

### Catalogue

- `collections`
- `motifs`
- `motif_names`
- `motif_relations`
- `samples`
- `sample_motifs`
- `techniques`
- `materials`
- `dyes`
- `occasions`
- `capture_sessions`
- `assets`
- `asset_versions`
- `asset_checksums`

### Color

- `color_analysis_jobs`
- `color_analyses`
- `analysis_masks`
- `palettes`
- `palette_colors`
- `color_features`
- `color_comparisons`
- `recoloring_projects`
- `recoloring_versions`
- `palette_constraints`
- `palette_recommendations`
- `recommendation_feedback`

### Knowledge and provenance

- `sources`
- `source_versions`
- `source_fragments`
- `knowledge_claims`
- `claim_scopes`
- `claim_sources`
- `claim_contributors`
- `claim_reviews`
- `interpretations`
- `embeddings`
- `knowledge_policies`

A claim must contain:

- statement;
- language;
- scope: region, motif, community, period, occasion, or other context;
- claim type: documented, contributor interpretation, inferred, contested;
- confidence;
- review status;
- source/provenance links;
- access policy.

### Knowledge assistant

- `chat_sessions`
- `chat_messages`
- `assistant_runs`
- `retrieval_results`
- `answer_citations`
- `answer_feedback`

### Design

- `garment_templates`
- `garment_regions`
- `design_projects`
- `design_versions`
- `design_layers`
- `design_palette_mappings`
- `design_previews`
- `design_comments`
- `design_reviews`

The version payload should include deterministic canvas JSON and references to immutable asset versions.

### Research

- `studies`
- `study_versions`
- `instruments`
- `instrument_items`
- `conditions`
- `stimulus_sets`
- `stimuli`
- `participants`
- `study_assignments`
- `responses`
- `task_events`
- `dataset_exports`
- `reproducibility_manifests`

### Operations and audit

- `jobs`
- `job_events`
- `webhooks`
- `notifications`
- `audit_events`
- `feature_flags`

## 3. Important enums

### Access tier

- `public`
- `registered`
- `research_only`
- `partner_only`
- `culturally_restricted`

### Review status

- `draft`
- `pending_review`
- `approved`
- `approved_with_scope`
- `contested`
- `rejected`
- `withdrawn`

### Asset type

- `raw_photo`
- `calibrated_image`
- `display_derivative`
- `mask`
- `motif_drawing`
- `garment_template`
- `design_preview`
- `survey_stimulus`
- `document`
- `audio`

### Analysis mode

- `calibrated`
- `exploratory`

### Permitted purpose

Represent as records rather than one packed enum when possible:

- public display;
- education;
- noncommercial research;
- retrieval/RAG;
- model evaluation;
- model training;
- commercial design;
- publication;
- derivative creation.

## 4. Search and embeddings

Use separate embedding records so multiple models and dimensions can coexist:

```text
embeddings
- id
- entity_type
- entity_id
- field_or_asset_version
- modality: text | image | palette
- model_name
- model_version
- dimension
- vector
- content_checksum
- access_policy_snapshot
- created_at
```

Never use a public vector index that contains restricted records. Enforce policy before retrieval and again before response construction.

## 5. Audit design

Important actions must write append-only audit events:

- consent creation/change/withdrawal;
- access-policy change;
- source or claim approval;
- restricted asset view/download;
- dataset export;
- AI retrieval and answer generation;
- recommendation generation and acceptance;
- design export;
- administrator permission change.

The audit payload should reference IDs and decision metadata, not unnecessarily duplicate confidential content.
