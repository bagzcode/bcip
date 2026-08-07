#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/bin:$PATH"

echo "==> Installing JS dependencies"
pnpm install

echo "==> Installing Python AI dependencies"
python3.12 -m venv services/ai/.venv 2>/dev/null || python3 -m venv services/ai/.venv
# shellcheck disable=SC1091
source services/ai/.venv/bin/activate
pip install -U pip
pip install -e "services/ai[dev]"

echo "==> Bootstrap complete"
