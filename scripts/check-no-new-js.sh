#!/bin/bash
# Prevent new .js/.jsx files from being added under app/
# Run this in CI to enforce TypeScript-only policy for new files.
#
# Usage: scripts/check-no-new-js.sh [base_branch]
#   base_branch: the branch to compare against (default: origin/main)

set -euo pipefail

BASE_BRANCH="${1:-origin/main}"

# Legacy JS files that existed before the migration policy.
# These are allowed until they are converted.
LEGACY_ALLOWLIST_FILE="scripts/ts-migration-legacy-allowlist.txt"

new_js_files=$(git diff --name-only --diff-filter=A "$BASE_BRANCH" -- 'app/**/*.js' 'app/**/*.jsx' || true)

if [ -z "$new_js_files" ]; then
  echo "No new .js/.jsx files added under app/."
  exit 0
fi

# Filter out files that are in the legacy allowlist (if it exists)
if [ -f "$LEGACY_ALLOWLIST_FILE" ]; then
  violations=""
  while IFS= read -r file; do
    if ! grep -qxF "$file" "$LEGACY_ALLOWLIST_FILE"; then
      violations="${violations}${file}"$'\n'
    fi
  done <<< "$new_js_files"
else
  violations="$new_js_files"
fi

if [ -z "$violations" ]; then
  echo "No new .js/.jsx files added under app/ (all matched legacy allowlist)."
  exit 0
fi

echo "ERROR: New .js/.jsx files were added under app/."
echo "Please use .ts/.tsx instead:"
echo ""
echo "$violations"
exit 1
