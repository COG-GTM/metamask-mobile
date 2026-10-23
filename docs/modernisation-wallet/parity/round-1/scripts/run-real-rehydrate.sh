#!/bin/bash
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
cp ~/parity/tools/real-rehydrate.tmp.test.ts app/reducers/__parity__/zz-real-rehydrate.tmp.test.ts
rm -rf $out/real-rehydrate
REAL_REHYDRATE_OUT_DIR=$out/real-rehydrate npx jest app/reducers/__parity__/zz-real-rehydrate.tmp.test.ts --ci --coverage=false --forceExit > $log/real-rehydrate-$side.log 2>&1
echo "exit $?" >> $log/real-rehydrate-$side.log
rm -f app/reducers/__parity__/zz-real-rehydrate.tmp.test.ts
git status --porcelain >> $log/real-rehydrate-$side.log
