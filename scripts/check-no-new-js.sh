#!/bin/bash
# CI guardrail: Fail if any new .js/.jsx files are added in app/
# This prevents regression during the TypeScript migration.

set -euo pipefail

BASE_BRANCH="${1:-origin/main}"

new_js_files=$(git diff --name-only --diff-filter=A "$BASE_BRANCH"...HEAD | grep -E '^app/.*\.(js|jsx)$' || true)

if [ -n "$new_js_files" ]; then
  echo "ERROR: New .js/.jsx files were added in app/. Please use .ts/.tsx instead."
  echo ""
  echo "The following new JS files were detected:"
  echo "$new_js_files"
  echo ""
  echo "As part of the TypeScript migration, all new files in app/ must be TypeScript."
  exit 1
fi

echo "OK: No new .js/.jsx files added in app/."
