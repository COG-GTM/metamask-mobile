#!/usr/bin/env bash
# Regenerates the rendered architecture diagram from its Graphviz source.
# Requires Graphviz (`dot`), e.g. `brew install graphviz` or `apt-get install graphviz`.
set -euo pipefail
cd "$(dirname "$0")"
dot -Tpng -Gdpi=110 architecture.dot -o architecture.png
dot -Tsvg architecture.dot -o architecture.svg
echo "Rendered architecture.png and architecture.svg"
