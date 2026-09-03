#!/usr/bin/env bash
# Lists the JavaScript files still to be migrated under app/ (plus the two
# top-level entry files), with line counts. Pass a path prefix to filter,
# e.g. `scripts/ts-migration/remaining-js.sh app/util`.
# See docs/ts-migration-plan.md.
set -euo pipefail

cd "$(dirname "$0")/../.."

ROOT="${1:-app}"
[ -d "$ROOT" ] || { echo "remaining-js: no such directory: $ROOT" >&2; exit 1; }

# Files that intentionally stay JavaScript (see docs/ts-migration-tracker.md).
EXCLUDE_REGEX='^(app/lib/ppom/blockaid-version\.js|app/util/test/assetFileTransformer\.js)$'

candidates=$(
  {
    find "$ROOT" -type f \( -name '*.js' -o -name '*.jsx' \) -not -path '*/node_modules/*'
    if [ "$ROOT" = "app" ]; then
      for f in index.js shim.js; do [ -f "$f" ] && echo "$f"; done
    fi
  } | awk -v exclude="$EXCLUDE_REGEX" '$0 !~ exclude'
)

printf '%s\n' "$candidates" | xargs -r wc -l | awk '$2 != "total"' | sort -k2

count=$(printf '%s\n' "$candidates" | grep -c . || true)
label="$ROOT"
[ "$ROOT" = "app" ] && label="app + top-level entry files"
echo
echo "Remaining under $label: $count file(s)"
