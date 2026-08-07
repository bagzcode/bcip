# ADR-0003: PostgreSQL metadata and S3-compatible binary storage

- **Status:** Proposed
- **Date:** 2026-08-03

## Decision

Store structured metadata, governance, results, and vectors in PostgreSQL. Store RAW images, calibrated derivatives, masks, documents, and generated previews in S3-compatible object storage.

Development uses a local S3-compatible service. Production uses Cloudflare R2, Amazon S3, or an approved institutional service through the same adapter interface.

## Consequences

- Large media does not burden PostgreSQL backups.
- Signed uploads/downloads are possible.
- Checksums and object keys become essential.
- Deletion/withdrawal workflows must cover object versions and derivatives.
