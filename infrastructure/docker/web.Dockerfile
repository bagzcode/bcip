FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json .npmrc ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
COPY services/ai/package.json ./services/ai/package.json
COPY tests/e2e/package.json ./tests/e2e/package.json
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder env for build-time module evaluation
ENV DATABASE_URL=postgresql://bcip:change-me@postgres:5432/bcip \
    BETTER_AUTH_SECRET=0123456789abcdef0123456789abcdef \
    BETTER_AUTH_URL=http://localhost:3000 \
    AI_SERVICE_URL=http://ai-api:8000 \
    AI_SERVICE_TOKEN=replace-me \
    S3_ACCESS_KEY=change-me \
    S3_SECRET_KEY=change-me-change-me \
    APP_URL=http://localhost:3000
RUN pnpm --filter @bcip/web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN useradd -m nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
