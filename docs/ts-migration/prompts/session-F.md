# Session F — Views, Base, util and remaining leaf modules

**Slice:** all remaining `app/**` files: `app/util/**` (32), `app/components/Views/**` non-confirmations (43), `app/components/Base/**` (12), `app/components/Nav/**`, `app/lib/**`, `app/constants/**`, `app/__mocks__/**`
**Files:** 104
**Branch:** `devin/ts-migration-f-views-util`
**File list (authoritative):** `docs/ts-migration/filelists/F.txt`

## Slice-specific notes

- 104 files. Suggested order: `app/util/**` (leaf utilities, most reused) → `components/Base/**`
  → `components/Views/**` → `Nav/`, `lib/`, `constants/`, `__mocks__/`.
- 6 snapshot files must be renamed with their tests: `Base/Keypad/Keypad.test.js.snap`,
  `Views/Asset/index.test.js.snap`, `Views/NavigationUnitTest/TestScreen{1,2,3}.test.js.snap`,
  `Views/OnboardingSuccess/index.test.js.snap`.
- `app/util/test/**` (8 files) are test helpers imported widely by already-TS tests — typing
  them correctly gives the largest payoff, so do them early and carefully.
- Navigation params in `components/Views/**` should use the existing React Navigation types used
  by neighboring TS screens rather than untyped `route`/`navigation` props.
- For `connect()`ed views, import store-state types from slice A (rebase if it has not landed).

Repository: `COG-GTM/metamask-mobile`, base branch `main`.

You are one of several parallel sessions performing an incremental JavaScript → TypeScript
migration of an already-hybrid React Native codebase (~3,900 TS files already). You own **one
non-overlapping slice**. Read `docs/ts-migration/README.md` first — it is the coordination plan —
and your slice's file list at `docs/ts-migration/filelists/<SLICE>.txt`.

**Do not touch any file outside your list**, with the single exception of
`app/declarations/index.d.ts` (append-only) and `__snapshots__/*.snap` files belonging to your
tests. `tsconfig.json`, `.eslintrc.js`, `package.json` and `babel.config.js` are off limits.

## Environment setup

`yarn install` alone is not enough — `.yarnrc` has `ignore-scripts true`:

```bash
nvm use            # Node 20.18.x, yarn 1.22.22
yarn install --network-timeout 600000
yarn patch-package --error-on-fail          # patches/ adds controller members app code uses
# generated + gitignored; content is irrelevant for type-checking, a stub is enough
echo 'export default "<p>placeholder</p>";' > app/util/termsOfUse/termsOfUseContent.ts
# (or run `yarn setup:expo`, which does the patch + generated-file steps as part of full setup)
```

Then record your type-check baseline **before** changing anything:

```bash
yarn lint:tsc 2>&1 | tee /tmp/tsc_before.log
```

With the two steps above done, `main` type-checks clean (verified, ~24s). If your baseline is not
empty, that error set is your baseline and "no new errors" is measured against it.

## Per-file definition of done

1. `git mv` the file: `.js` → `.ts`, `.jsx` or JSX-containing `.js` → `.tsx`.
2. Add explicit types. `@typescript-eslint/no-explicit-any` is `error` for `*.{ts,tsx}` — no
   `any` and no new eslint-disable comments. Missing third-party/asset types go into
   `app/declarations/index.d.ts` as ambient `declare module` shims, appended in the existing
   style (append-only: never reorder existing entries, or you will create merge conflicts with
   the other sessions).
3. `isolatedModules` is enabled: use `export type { ... }` for type-only re-exports.
4. Preserve runtime behavior exactly. This is a typing migration, not a refactor. Keep existing
   `/* eslint-disable import/no-commonjs */` pragmas where CommonJS interop is required.
5. `yarn lint:tsc` shows no new errors vs. `/tmp/tsc_before.log`.
6. `npx eslint <changed files>` is clean.
7. `npx jest <changed dirs>` passes. Rename `__snapshots__/<test>.snap` to match renamed test
   files. Snapshot **content** must not change — if it does, your conversion changed behavior;
   fix the code rather than running `jest -u`.
8. Convert both halves of any `*.android.*` / `*.ios.*` pair in the same commit.

## Branch, commits, PR

- Branch: `devin/ts-migration-<slice letter>-<slug>` off `main` (exact name given below).
- One commit per component/module directory, using `git mv` so renames stay reviewable.
- Open **one PR** against `main`, titled `chore(ts): migrate <slice> to TypeScript`.
- In the PR description, list: files converted, ambient declarations added, and any
  **cross-slice coupling** you hit (a file outside your slice whose types break). Do not fix
  files outside your slice — report them so the orchestrator can sequence the fix.
- Rebase onto `origin/main` (never merge) when other slices land.
- Stop and report if the slice's remaining work would require editing shared config.

## Files in this slice (104)

```
app/__mocks__/pngMock.js
app/__mocks__/react-native-device-info.js
app/__mocks__/react-native-splash-screen.js
app/__mocks__/react-native-view-shot.js
app/__mocks__/rn-fetch-blob.js
app/__mocks__/svgMock.js
app/components/Base/DetailsModal.js
app/components/Base/Keypad/Keypad.test.js
app/components/Base/Keypad/components.js
app/components/Base/Keypad/constants.js
app/components/Base/Keypad/createKeypadRule.js
app/components/Base/Keypad/createKeypadRule.test.js
app/components/Base/Keypad/index.js
app/components/Base/Keypad/useCurrency.js
app/components/Base/RangeInput.js
app/components/Base/RemoteImage/index.js
app/components/Base/StatusText.js
app/components/Base/TabBar.js
app/components/Nav/Main/MainNavigator.js
app/components/Nav/Main/RootRPCMethodsUI.js
app/components/Nav/Main/index.js
app/components/Views/AccountBackupStep1/index.js
app/components/Views/AccountBackupStep1B/index.js
app/components/Views/ActivityView/index.js
app/components/Views/AddBookmark/index.js
app/components/Views/AddressQRCode/index.js
app/components/Views/Asset/index.js
app/components/Views/Asset/index.test.js
app/components/Views/Browser/index.js
app/components/Views/ChoosePassword/index.js
app/components/Views/Collectible/index.js
app/components/Views/CollectibleView/index.js
app/components/Views/EnterPasswordSimple/index.js
app/components/Views/ErrorBoundary/index.js
app/components/Views/GasEducationCarousel/index.js
app/components/Views/ImportFromSecretRecoveryPhrase/index.js
app/components/Views/ImportPrivateKeySuccess/index.js
app/components/Views/LockScreen/index.js
app/components/Views/ManualBackupStep1/index.js
app/components/Views/ManualBackupStep2/index.js
app/components/Views/ManualBackupStep3/index.js
app/components/Views/MediaPlayer/AndroidMediaPlayer.js
app/components/Views/MediaPlayer/index.js
app/components/Views/NavigationUnitTest/TestScreen1.test.js
app/components/Views/NavigationUnitTest/TestScreen2.test.js
app/components/Views/NavigationUnitTest/TestScreen3.test.js
app/components/Views/NavigationUnitTest/index.js
app/components/Views/OfflineMode/index.js
app/components/Views/Onboarding/index.js
app/components/Views/OnboardingSuccess/index.test.js
app/components/Views/ResetPassword/index.js
app/components/Views/Settings/AdvancedSettings/index.js
app/components/Views/Settings/AppInformation/index.js
app/components/Views/Settings/Contacts/ContactForm/index.js
app/components/Views/Settings/Contacts/index.js
app/components/Views/Settings/GeneralSettings/index.js
app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js
app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js
app/components/Views/Settings/NetworksSettings/index.js
app/components/Views/SimpleWebview/index.js
app/components/Views/TermsAndConditions/index.js
app/components/Views/TransactionSummary/index.js
app/components/Views/TransactionsView/index.js
app/components/Views/WalletConnectSessions/index.js
app/constants/navigation.js
app/constants/network.js
app/constants/onboarding.js
app/images/image-icons.js
app/lib/ens-ipfs/contracts/registry.js
app/lib/ens-ipfs/contracts/resolver.js
app/lib/ens-ipfs/resolver.js
app/lib/ppom/blockaid-version.js
app/util/ENSUtils.js
app/util/blockies.js
app/util/confirm-tx.js
app/util/confirmation/signatureUtils.js
app/util/confusables/index.js
app/util/conversion/index.js
app/util/conversions.js
app/util/conversions.test.js
app/util/custom-gas/index.js
app/util/dapp-url-list.js
app/util/date/index.js
app/util/device/index.js
app/util/etherscan.js
app/util/gasUtils.js
app/util/general/index.js
app/util/middlewares.js
app/util/networks/index.js
app/util/number/index.js
app/util/payment-link-generator.js
app/util/scaling.js
app/util/sentry/utils.js
app/util/streams.js
app/util/test/assetFileTransformer.js
app/util/test/contract-address-registry.js
app/util/test/ganache-seeder.js
app/util/test/ganache.js
app/util/test/network-store.js
app/util/test/smart-contracts.js
app/util/test/testSetup.js
app/util/test/utils.js
app/util/transactions/index.js
app/util/walletconnect.js
```
