# ADR-0006: Signed S3 upload and finalize flow

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Binary batik images must not transit the Next.js server as the system of record. Development uses MinIO; production will use R2/S3 through the same adapter.

## Decision

1. Use AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) against S3-compatible endpoints.
2. Flow:
   - Client authenticates and calls `POST /api/uploads/initiate`.
   - Server creates an `assets` row (`pending_upload`) and returns a short-lived PUT URL + object key.
   - Client uploads directly to object storage.
   - Client calls `POST /api/uploads/finalize` with checksum, mime, size.
   - Server verifies constraints, creates `asset_versions`, audits, sets asset status `verified` (or `uploaded` if checksum deferred).
3. Unit tests use a mock storage adapter; Compose MinIO is used for local integration.
4. Private bucket/prefix for restricted objects; never commit binaries to Git.

## Consequences

- Checksum mismatches reject finalize and leave audit trails.
- Withdrawal must later cover object versions; Phase 1 marks DB status `withdrawn` and excludes from catalogue queries.
