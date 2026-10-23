#!/bin/bash
# usage: run-jest.sh <side>
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
export NODE_OPTIONS=--max-old-space-size=6144
start=$(date +%s)
for i in 1 2 3 4; do
  npx jest ./app/ ./locales/ --ci --coverage=false --json --outputFile=$out/shard$i.json \
    --shard=$i/4 --maxWorkers=2 --forceExit \
    --testPathIgnorePatterns /node_modules/ SnapUIAddressInput > $log/jest-$side-shard$i.log 2>&1 &
done
wait
npx jest app/components/Snaps/SnapUIAddressInput --ci --coverage=false --json --outputFile=$out/snapui.json --forceExit > $log/jest-$side-snapui.log 2>&1
echo "exit snapui $?" >> $log/jest-$side-snapui.log
end=$(date +%s); echo "$side wall $((end-start))s" > $log/jest-$side-wall.txt
