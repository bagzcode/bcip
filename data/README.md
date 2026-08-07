# Restricted operational data must never be committed.

This directory holds guidance and **public** seed placeholders only.

## Allowed in Git

- `data/seed-public/` — clearly fictional or openly licensed public fixtures
- Documentation describing schemas and access rules

## Never commit

- Contributor consent documents or personal data
- Culturally restricted images, audio, or manuscripts
- Research participant responses or re-identification keys
- Production `.env` files, service tokens, or private object-storage credentials
- Derived embeddings/indexes that contain restricted content

Use private object storage and access-tiered database records for operational data.
If a file would be harmful if published, it does not belong in this repository.
