# Technical references checked for this blueprint

- Next.js App Router and version 16 documentation: https://nextjs.org/docs/app and https://nextjs.org/docs/app/guides/upgrading/version-16
- Docker Compose Specification: https://docs.docker.com/reference/compose-file/
- PostgreSQL current documentation and supported versions: https://www.postgresql.org/docs/current/
- pgvector: https://github.com/pgvector/pgvector
- Turborepo: https://turborepo.com/docs
- Cursor Agent and prompting: https://cursor.com/docs/agent/overview and https://cursor.com/docs/agent/prompting
- Better Auth Next.js integration and organization access control: https://better-auth.com/docs/integrations/next and https://www.better-auth.com/docs/plugins/organization
- Drizzle pgvector guide: https://orm.drizzle.team/docs/guides/vector-similarity-search
- FastAPI: https://fastapi.tiangolo.com/
- Celery stable documentation: https://docs.celeryq.dev/en/stable/
- Redis documentation: https://redis.io/docs/latest/
- Playwright: https://playwright.dev/docs/intro
- Cloudflare R2 S3-compatible API: https://developers.cloudflare.com/r2/get-started/s3/

The implementation agent should re-check current stable versions at scaffold time and record exact dependency versions in an ADR and lockfile.
