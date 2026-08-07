# 05 — Security, Ethics, and Cultural Governance

## 1. Security principles

- Deny by default.
- Authenticate at the web boundary and authorize inside every protected operation.
- Separate public and restricted object prefixes/buckets.
- Use signed URLs with short expiry and purpose-specific permissions.
- Validate MIME type, extension, magic bytes, size, dimensions, and checksums.
- Add malware scanning before broad external upload is enabled.
- Keep AI service private and authenticate service-to-service calls.
- Encrypt traffic and production storage.
- Back up PostgreSQL and object storage; test restoration.
- Rotate secrets and never commit `.env` files.
- Rate-limit authentication, upload, search, and assistant endpoints.
- Add CSRF, secure cookies, security headers, and content-security policy.

## 2. Cultural governance principles

- Participation must be informed and voluntary.
- Traditional or community knowledge is not assumed to be ownerless.
- Attribution must follow contributor preference.
- Multiple interpretations may coexist.
- Restrictions must apply to search, embeddings, generation, exports, caches, and model training.
- Withdrawal must be operationally possible.
- Commercial use requires separate explicit permission where applicable.
- Community benefit should be defined before commercial pilots.

## 3. Data classification

### Public

Approved public descriptions, thumbnails, palettes, and educational content.

### Registered

Low-risk content available to authenticated users under terms of use.

### Research-only

Available only for approved studies and named researchers.

### Partner-only

Available to participating community or institutional partners.

### Culturally restricted

May require specific people, purposes, locations, dates, or community approval. The system may need to hide even the existence of the record.

## 4. AI-specific controls

- Provider abstraction must support a “no external API” deployment.
- Before sending context to an external model provider, evaluate source permissions and data-processing agreements.
- Do not use assistant conversations or uploaded batik images for model training by default.
- Prompt and retrieval versions must be stored.
- Grounding validator must reject unsupported cultural statements.
- Recommendations must show they are suggestions and identify constraints/evidence.
- Add red-team tests for cultural stereotyping, invented meanings, restricted-data leakage, and prompt injection from source documents.

## 5. Research data separation

Keep identifiable participant/consent data separate from response data. Use pseudonymous participant IDs. Export only the variables approved in the study protocol. Usage analytics must not silently become research data; obtain explicit study consent.

## 6. Minimum governance checks before Year-1 collection

- Named community/artisan liaison.
- Approved participant and contributor information sheets.
- Consent version and withdrawal route.
- Rights-holder and attribution fields.
- Permitted-use matrix.
- Access-tier definitions.
- Data-retention schedule.
- Incident-response contact.
- Dataset-release approval workflow.
