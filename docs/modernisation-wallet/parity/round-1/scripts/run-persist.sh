#!/bin/bash
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
cp ~/parity/tools/persist-dump.tmp.test.ts app/reducers/__parity__/zz-persist-dump.tmp.test.ts
rm -rf $out/persist
PERSIST_OUT_DIR=$out/persist npx jest app/reducers/__parity__/zz-persist-dump.tmp.test.ts --ci --coverage=false --json --outputFile=$out/persist.json --forceExit > $log/persist-$side.log 2>&1
echo "exit $?" >> $log/persist-$side.log
rm -f app/reducers/__parity__/zz-persist-dump.tmp.test.ts
git status --porcelain >> $log/persist-$side.log
