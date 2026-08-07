# ADR-0002: Self-hosted authentication with Better Auth

- **Status:** Proposed
- **Date:** 2026-08-03

## Decision

Use Better Auth integrated with Next.js 16 and PostgreSQL. Implement organization membership plus explicit permission checks. Do not rely only on route proxy redirects for authorization.

## Rationale

The research platform needs self-hosted control, organization roles, and permission-aware access to cultural and research data without requiring a SaaS identity dependency for the pilot.

## Revisit when

Institutional single sign-on becomes a formal requirement or the deployment environment mandates an external identity provider such as Keycloak.
