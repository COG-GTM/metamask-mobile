#!/usr/bin/env bash
# Regenerates the JS -> TS migration inventory: one file list per workstream.
# Usage: bash docs/ts-migration/classify.sh   (run from anywhere inside the repo)
set -u
cd "$(git rev-parse --show-toplevel)"
OUT=docs/ts-migration/filelists
mkdir -p "$OUT"

git ls-files '*.js' '*.jsx' > "$OUT/.raw"
grep -E '^(app|e2e)/' "$OUT/.raw" | grep -v '__snapshots__' | sort > "$OUT/all.txt"
rm -f "$OUT/.raw"

pick() { # <name> <include regex> [exclude regex]
  local name="$1" inc="$2" exc="${3:-^$}"
  grep -E "$inc" "$OUT/all.txt" | grep -Ev "$exc" | sort > "$OUT/$name.txt"
}

pick A '^app/(reducers|actions)/'
pick B '^app/store/'
pick C '^app/core/'
pick D '^app/components/UI/' '^app/components/UI/Swaps/'
pick E '^app/components/(Views/confirmations|UI/Swaps)/'
pick F '^app/' '^app/(reducers|actions|store|core|components/UI|components/Views/confirmations)/'
pick G '^e2e/(pages|selectors)/'
pick H '^e2e/' '^e2e/(pages|selectors)/'

cat "$OUT"/{A,B,C,D,E,F,G,H}.txt | sort > "$OUT/covered.txt"
for f in A B C D E F G H; do printf "%s %s\n" "$f" "$(wc -l < "$OUT/$f.txt")"; done

duplicates="$(uniq -d < "$OUT/covered.txt" | wc -l)"
unassigned="$(comm -23 "$OUT/all.txt" "$OUT/covered.txt" | wc -l)"
printf "TOTAL %s COVERED %s (duplicates: %s, unassigned: %s)\n" \
  "$(wc -l < "$OUT/all.txt")" "$(wc -l < "$OUT/covered.txt")" \
  "$duplicates" "$unassigned"
rm -f "$OUT/covered.txt"

# Overlapping or incomplete ownership must fail, not just be reported.
if [ "$duplicates" -ne 0 ] || [ "$unassigned" -ne 0 ]; then
  exit 1
fi
