FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./

COPY packages ./packages

COPY apps/web/package.json ./apps/web/package.json
COPY services/ai/package.json ./services/ai/package.json
COPY tests/e2e/package.json ./tests/e2e/package.json

RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/db

CMD ["pnpm", "exec", "tsx", "src/migrate.ts"]