#!/bin/bash
# usage: run-transcripts.sh <side>  (run after the full Jest run of that side)
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
T=app/reducers/__parity__/transcripts
# 1. replay committed legacy recordings
npx jest app/reducers/__parity__/transcripts.parity.test.ts --ci --coverage=false --json --outputFile=$out/replay.json --forceExit > $log/replay-$side.log 2>&1
echo "exit $?" >> $log/replay-$side.log
# 2. re-record in RECORD mode (recorder writes in place) -> copy to temp dir -> restore
rm -rf $out/recorded; mkdir -p $out/recorded
RECORD_TRANSCRIPTS=1 npx jest app/reducers/__parity__/transcripts.parity.test.ts --ci --coverage=false --json --outputFile=$out/record.json --forceExit > $log/record-$side.log 2>&1
echo "exit $?" >> $log/record-$side.log
cp $T/*.json $out/recorded/
git checkout -- $T; git status --porcelain $T >> $log/record-$side.log
# 3. persisted state dump
cp ~/parity/tools/persist-dump.tmp.test.ts app/reducers/__parity__/zz-persist-dump.tmp.test.ts
rm -rf $out/persist
PERSIST_OUT_DIR=$out/persist npx jest app/reducers/__parity__/zz-persist-dump.tmp.test.ts --ci --coverage=false --json --outputFile=$out/persist.json --forceExit > $log/persist-$side.log 2>&1
echo "exit $?" >> $log/persist-$side.log
rm -f app/reducers/__parity__/zz-persist-dump.tmp.test.ts
git status --porcelain >> $log/persist-$side.log
