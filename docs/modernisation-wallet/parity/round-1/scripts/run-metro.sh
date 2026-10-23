#!/bin/bash
side=$1; wt=~/parity/$side; out=~/parity/out/$side; log=~/parity/logs
source ~/.nvm/nvm.sh >/dev/null; nvm use 20 >/dev/null
cd $wt
# gitignored generated files stubbed identically on both sides (no network ppom build)
[ -f app/lib/ppom/ppom.html.js ] || echo "export default '';" > app/lib/ppom/ppom.html.js
[ -f app/util/termsOfUse/termsOfUseContent.ts ] || echo "export default '';" > app/util/termsOfUse/termsOfUseContent.ts
[ -f .js.env ] || cp .js.env.example .js.env
rm -f $out/android.bundle
start=$(date +%s)
PARITY_WT=$wt timeout 1500 npx react-native bundle --config ~/parity/tools/metro.parity.config.js --platform android --dev false --entry-file index.js --bundle-output $out/android.bundle --reset-cache > $log/metro-$side.log 2>&1
echo "exit $? wall $(( $(date +%s)-start ))s" >> $log/metro-$side.log
ls -l $out/android.bundle >> $log/metro-$side.log 2>&1
