#!/bin/bash
# TypeScript Migration Progress Tracker
# Reports the count and percentage of .js/.jsx vs .ts/.tsx files under app/

set -euo pipefail

APP_DIR="${1:-app}"

js_count=$(find "$APP_DIR" -type f \( -name '*.js' -o -name '*.jsx' \) ! -path '*/node_modules/*' ! -path '*/__snapshots__/*' | wc -l)
ts_count=$(find "$APP_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' ! -path '*/__snapshots__/*' | wc -l)

total=$((js_count + ts_count))

if [ "$total" -eq 0 ]; then
  echo "No source files found under $APP_DIR"
  exit 1
fi

ts_pct=$((ts_count * 100 / total))
js_pct=$((js_count * 100 / total))

echo "=== TypeScript Migration Progress ($APP_DIR/) ==="
echo ""
echo "  TypeScript (.ts/.tsx): $ts_count files ($ts_pct%)"
echo "  JavaScript (.js/.jsx): $js_count files ($js_pct%)"
echo "  Total:                 $total files"
echo ""

if [ "$js_count" -gt 0 ]; then
  echo "--- Remaining JS/JSX files by directory ---"
  find "$APP_DIR" -type f \( -name '*.js' -o -name '*.jsx' \) ! -path '*/node_modules/*' ! -path '*/__snapshots__/*' \
    | sed 's|/[^/]*$||' \
    | sort \
    | uniq -c \
    | sort -rn \
    | head -30
fi
