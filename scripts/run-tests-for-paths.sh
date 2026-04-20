#!/usr/bin/env bash
# Run Jest with --findRelatedTests for a list of source paths and emit
# coverage in text-summary and json form. Used by the ci-coverage-delta
# workflow to run only the tests related to files changed in a PR.
#
# Usage: scripts/run-tests-for-paths.sh <path> [<path> ...]

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <path> [<path> ...]" >&2
  exit 1
fi

exec yarn jest \
  --findRelatedTests "$@" \
  --coverage \
  --coverageReporters=text-summary \
  --coverageReporters=json
