#### Build Troubleshooting

Unfortunately, the build system may fail to pick up local changes, such as installing new NPM packages or `yarn link`ing a dependency.
If the app is behaving strangely or not picking up your local changes, it may be due to build issues.
To ensure that you're starting with a clean slate, close all emulators/simulators, stop the `yarn watch` process, and run:

```bash
yarn clean

# if you're going to `yarn link` any packages,
# do that here, before the next command

yarn watch:clean

# ...and then, in another terminal

yarn start:ios

# or

yarn start:android
```

If `yarn link` fails after going through these steps, try directly `yarn add`ing the local files instead.

#### Setup fails at "Nodeify npm packages"

`yarn setup:expo` and `yarn setup` currently stop at the **Nodeify npm packages** step with:

```text
Error: Command failed: npm install --save react-native-tcp@^3.2.1
npm error ERESOLVE could not resolve
```

The setup script asks `rn-nodeify` to shim `net`, and `rn-nodeify` still maps `net` to `react-native-tcp`, which is no longer a dependency of this repo (`net` now maps to `react-native-tcp-socket` in `package.json`). `rn-nodeify` then runs `npm install` for it, which fails on an unrelated peer dependency conflict. Before it fails, it also adds `react-native-tcp` to `package.json`.

Until the setup script is fixed, finish the remaining setup steps by hand from the repo root. Run the commands one at a time and stop if any of them fails.

1. Undo the `react-native-tcp` entry that `rn-nodeify` added. Check `git diff package.json` first. If the only change is the `react-native-tcp` line, restore the file:

   ```bash
   git checkout package.json
   ```

   If you had your own unstaged edits in `package.json`, delete just the `react-native-tcp` line by hand instead, so your edits are kept.

2. Finish the remaining "Prepare dependencies" steps, in the same order as `scripts/setup.mjs`, without the `net` shim:

   ```bash
   node_modules/.bin/rn-nodeify --install crypto,buffer,react-native-randombytes,vm,stream,http,https,os,url,fs --hack
   # native Android (`yarn setup`) only: uncomment the next line. `yarn setup:expo` skips it.
   # yarn jetify
   yarn allow-scripts
   yarn patch-package --error-on-fail
   ```

3. Build PPOM, and check that it produced `app/lib/ppom/ppom.html.js` (Metro cannot bundle the app without it):

   ```bash
   (cd ppom && yarn clean && yarn && yarn lint && yarn build)
   ls app/lib/ppom/ppom.html.js
   ```

4. Generate the Terms of Use:

   ```bash
   curl --fail -o ./docs/assets/termsOfUse.html https://legal.consensys.io/plain/terms-of-use/
   mkdir -p app/util/termsOfUse
   node -e "const fs=require('fs');fs.writeFileSync('app/util/termsOfUse/termsOfUseContent.ts','export default '+JSON.stringify(fs.readFileSync('docs/assets/termsOfUse.html','utf8'))+';','utf8')"
   ```

5. If your setup command builds iOS (`yarn setup` on macOS, or `yarn setup --build-ios` as in the [Docker setup](../../scripts/docker/README.md)), also run the iOS steps that `yarn setup:expo` skips:

   ```bash
   gem install bundler -v 2.5.8
   yarn gem:bundle:install
   touch ios/debug.xcconfig ios/release.xcconfig
   yarn pod:install
   ```

Then continue with `yarn watch`.
