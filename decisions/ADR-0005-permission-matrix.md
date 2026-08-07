# ADR-0005: Role permission matrix and culturally restricted access

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

BCIP must authorize catalogue and governance operations by role while ensuring culturally restricted heritage records do not leak through search, counts, exports, or error messages. Better Auth provides organization membership; BCIP also stores `memberships` with domain roles.

## Decision

1. Treat **BCIP `memberships.role`** as the authorization source of truth for Phase 1 permissions.
2. Keep Better Auth `organization` / `member` for session/org UX compatibility; map via `organizations.auth_organization_id` when present.
3. Encode a declarative permission matrix in `@bcip/domain` (not DB-editable yet).
4. Access tiers use explicit grants and rank **except** `culturally_restricted`, which requires an **explicit recorded tier grant**. Platform `admin` rank alone does **not** unlock culturally restricted content.
5. Unauthorized access to restricted IDs returns generic not-found / empty results — never confirming existence.

## Consequences

- Permission checks live in domain services called by every server action/route handler.
- Seed must create explicit restricted grants for test stewards who need them.
- Middleware redirects remain optional UX only and are never sufficient authorization.
