#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgresql://bcip:change-me@localhost:5432/bcip}"

pnpm db:migrate
pnpm db:seed
echo "==> Database ready"
