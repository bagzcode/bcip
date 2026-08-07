#!/usr/bin/env bash
# Push the current branch (or first arg / BRANCH env) to both github and local remotes.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BRANCH="${1:-${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}}"
if [[ -z "$BRANCH" || "$BRANCH" == "HEAD" ]]; then
  echo "error: detached HEAD; pass a branch name: $0 <branch>"
  exit 1
fi

REMOTES=(github local)
FAILED=0

echo "==> Dual push: branch '${BRANCH}' → ${REMOTES[*]}"
echo

for remote in "${REMOTES[@]}"; do
  if ! git remote get-url "$remote" >/dev/null 2>&1; then
    echo "[FAIL] remote '${remote}' is not configured"
    FAILED=1
    continue
  fi
  url="$(git remote get-url "$remote")"
  echo "--- pushing to ${remote} (${url}) ---"
  if git push -u "$remote" "$BRANCH"; then
    echo "[OK]   ${remote}"
  else
    status=$?
    echo "[FAIL] ${remote} (exit ${status})"
    FAILED=1
  fi
  echo
done

if [[ "$FAILED" -ne 0 ]]; then
  echo "==> Dual push finished with failures"
  exit 1
fi

echo "==> Dual push succeeded for both remotes"
exit 0
