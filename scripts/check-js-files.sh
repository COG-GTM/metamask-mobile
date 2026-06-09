#!/usr/bin/env bash
#
# check-js-files.sh
#
# Tracks progress of the JavaScript -> TypeScript migration by listing the
# remaining .js / .jsx files in the repository, grouped by top-level directory.
#
# Usage:
#   scripts/check-js-files.sh            # summary counts by top-level directory
#   scripts/check-js-files.sh --list     # also print every remaining file
#
# Exit status is always 0; this is a reporting tool, not a gate.

set -euo pipefail

cd "$(dirname "$0")/.."

# Collect remaining JS/JSX files, excluding dependencies and patch artifacts.
mapfile -t JS_FILES < <(
  find . -type f \( -name '*.js' -o -name '*.jsx' \) \
    -not -path '*/node_modules/*' \
    -not -path './patches/*' \
    | sed 's#^\./##' \
    | sort
)

TOTAL=${#JS_FILES[@]}

echo "Remaining JavaScript files (.js/.jsx): ${TOTAL}"
echo ""
echo "By top-level directory:"
printf '%s\n' "${JS_FILES[@]}" \
  | sed -E 's#/.*##' \
  | sort \
  | uniq -c \
  | sort -rn

if [[ "${1:-}" == "--list" ]]; then
  echo ""
  echo "Full file list:"
  printf '%s\n' "${JS_FILES[@]}"
fi
