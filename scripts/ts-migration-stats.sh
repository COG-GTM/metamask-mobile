#!/bin/bash
# TypeScript Migration Progress Stats
# Counts JS vs TS files in app/ and prints a progress percentage.

set -euo pipefail

APP_DIR="app"

js_count=$(find "$APP_DIR" -type f \( -name '*.js' -o -name '*.jsx' \) | grep -v node_modules | grep -v __mocks__ | wc -l)
ts_count=$(find "$APP_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) | grep -v node_modules | grep -v __mocks__ | grep -v '.d.ts' | wc -l)

total=$((js_count + ts_count))

if [ "$total" -eq 0 ]; then
  echo "No source files found in $APP_DIR"
  exit 0
fi

ts_percentage=$(awk "BEGIN { printf \"%.1f\", ($ts_count / $total) * 100 }")

echo "=== TypeScript Migration Progress ==="
echo "Directory: $APP_DIR/"
echo ""
echo "  JS/JSX files:  $js_count"
echo "  TS/TSX files:  $ts_count"
echo "  Total:         $total"
echo ""
echo "  Progress:      ${ts_percentage}% TypeScript"
echo "====================================="
