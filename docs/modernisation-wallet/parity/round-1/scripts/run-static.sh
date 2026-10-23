#!/bin/bash
# usage: run-static.sh <side>
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
# tsc
npx tsc --noEmit -p tsconfig.json > $log/tsc-$side.log 2>&1; echo "exit $?" >> $log/tsc-$side.log
# eslint on changed files (files from legacy..migrated diff that exist on this side)
: > $out/eslint-files.txt
for f in $(cat ~/parity/out/changed-files-all.txt); do [ -f "$f" ] && echo "$f" >> $out/eslint-files.txt; done
npx eslint --format json -o $out/eslint.json $(cat $out/eslint-files.txt) > $log/eslint-$side.log 2>&1; echo "exit $?" >> $log/eslint-$side.log
npx eslint $(cat $out/eslint-files.txt) >> $log/eslint-$side.log 2>&1; echo "exit(stylish) $?" >> $log/eslint-$side.log
# TS app gate
(cd .github/scripts && if grep -q '"check-ts-app-gate"' package.json; then yarn run check-ts-app-gate 86884c59947115d264b49475870f47dc58df7404; else echo "NO check-ts-app-gate script in .github/scripts/package.json"; git -C .. diff 86884c59947115d264b49475870f47dc58df7404 HEAD > /tmp/gate-$side.diff; npx ts-node fitness-functions/index.ts ci /tmp/gate-$side.diff; fi) > $log/ts-app-gate-$side.log 2>&1; echo "exit $?" >> $log/ts-app-gate-$side.log
