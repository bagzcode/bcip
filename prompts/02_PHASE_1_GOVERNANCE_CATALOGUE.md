# Cursor Prompt — Phase 1: Governance and Motif Explorer

Read the blueprint, Phase-0 report, and all Cursor rules. Implement Phase 1 only: governance foundations and Motif Explorer.

## Required outcomes

1. Complete permissions for public visitor, designer, contributor, expert, researcher, data steward, and admin.
2. Implement contributor, rights holder, consent, permitted purpose, access policy, source, source version, collection, motif, sample, capture session, asset, and asset version models.
3. Build server-side permission services and a permission-matrix test suite.
4. Build signed direct upload/finalization flow with checksum, metadata validation, and audit events.
5. Build Motif Explorer:
   - list/grid;
   - search and filters;
   - collection/motif/sample detail;
   - compare;
   - save collection;
   - permitted CSV/JSON metadata export.
6. Build Governance Console screens for access, consent, attribution, provenance, and review status.
7. Add demo data only; label it fictional and never imply cultural accuracy.

## Critical tests

- Restricted records cannot appear in search result rows, counts, autocomplete, exports, related-items queries, or API errors for unauthorized users.
- A general admin cannot bypass culturally restricted access without an explicit recorded permission.
- Every cultural description requires at least one source/provenance record and review state.
- Withdrawing a demo asset marks it unavailable and removes it from search/export paths.

Do not implement real AI, Hue Seer calculations, Lasem Guru generation, or Dress Weaver yet. Finish with a Phase-1 report and passing tests.
