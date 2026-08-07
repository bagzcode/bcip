# ADR-0001: Modular monolith plus Python AI service

- **Status:** Proposed
- **Date:** 2026-08-03

## Context

BCIP contains several product modules but begins with a small research and development team. Splitting every module into separate microservices would increase deployment, authorization, transaction, observability, and data-consistency complexity before usage patterns are known.

Computer vision and scientific Python processing should remain separate from the TypeScript web runtime.

## Decision

Use one modular Next.js application for web and domain operations, one FastAPI AI service, and one Celery worker. Share PostgreSQL and object storage while enforcing code and schema ownership by domain module.

## Consequences

- Faster Year-1 delivery.
- Easier local Docker environment.
- Strong relational transactions.
- Python ML ecosystem remains available.
- Module boundaries must be enforced in code review.
- A module may be extracted later only after measured scaling or ownership need.
