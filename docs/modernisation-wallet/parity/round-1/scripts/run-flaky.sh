#!/bin/bash
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
export NODE_OPTIONS=--max-old-space-size=6144
for r in 1 2 3; do
  npx jest $(cat $out/failing-suites.txt) --ci --coverage=false --json --outputFile=$out/rerun$r.json --maxWorkers=3 --forceExit > $log/rerun-$side-$r.log 2>&1
  echo "exit $?" >> $log/rerun-$side-$r.log
  npx jest app/components/Snaps/SnapUIAddressInput --ci --coverage=false --forceExit > $log/rerun-$side-snapui-$r.log 2>&1
  echo "exit snapui $?" >> $log/rerun-$side-snapui-$r.log
done
