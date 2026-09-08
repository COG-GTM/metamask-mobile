# Session D — UI components

**Slice:** `app/components/UI/**`, excluding `app/components/UI/Swaps/**` (owned by slice E)
**Files:** 80
**Branch:** `devin/ts-migration-d-components-ui`
**File list (authoritative):** `docs/ts-migration/filelists/D.txt`

## Slice-specific notes

- Largest slice (80 files). Suggested order: `UI/Notification*` (5), `UI/TransactionElement`
  (4), `UI/StyledButton` (3), then the `~55` single-file component directories. Land commits
  incrementally so review stays tractable.
- **Platform pair — convert in one commit:** `app/components/UI/StyledButton/index.android.js`
  and `index.ios.js` (plus `index.js` in the same directory). Renaming only one half breaks
  Metro platform resolution.
- 6 snapshot files must be renamed with their tests: `AddressInputs/index.test.jsx.snap`,
  `BasicFunctionality/BasicFunctionality.test.js.snap`,
  `BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js.snap`,
  `ManageNetworks/ManageNetworks.test.js.snap`, `NavbarTitle/index.test.js.snap`,
  `Notification/BaseNotification/index.test.jsx.snap`.
- For `connect()`ed components, import store-state types from `app/reducers`/`app/actions`
  (slice A) rather than redeclaring them. If slice A has not landed yet, defer those specific
  files, do the rest, then rebase onto `origin/main` and finish them.
- Typed prop interfaces for each component; `StyleSheet` objects and theme usage should follow
  the conventions in the neighboring already-TS components.

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

## Files in this slice (80)

```
app/components/UI/AccountApproval/index.js
app/components/UI/AccountInfoCard/index.js
app/components/UI/AccountOverview/index.js
app/components/UI/ActionModal/ActionContent/index.js
app/components/UI/ActionModal/index.js
app/components/UI/ActionView/index.js
app/components/UI/AddCustomToken/index.js
app/components/UI/AddressInputs/index.js
app/components/UI/AddressInputs/index.test.jsx
app/components/UI/AnimatedSpinner/index.js
app/components/UI/AnimatedTransactionModal/index.js
app/components/UI/AssetList/index.js
app/components/UI/BasicFunctionality/BasicFunctionality.test.js
app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js
app/components/UI/BrowserBottomBar/index.js
app/components/UI/Button/index.js
app/components/UI/CollectibleContractElement/index.js
app/components/UI/CollectibleContractInformation/index.js
app/components/UI/CollectibleContractOverview/index.js
app/components/UI/CollectibleContracts/index.js
app/components/UI/CollectibleOverview/index.js
app/components/UI/Collectibles/index.js
app/components/UI/Confetti/index.js
app/components/UI/CustomAlert/index.js
app/components/UI/DrawerView/index.js
app/components/UI/EditGasFee1559/index.js
app/components/UI/EditGasFeeLegacy/index.js
app/components/UI/EthereumAddress/index.js
app/components/UI/FadeAnimationView/index.js
app/components/UI/FadeOutOverlay/index.js
app/components/UI/FoxScreen/index.js
app/components/UI/GlobalAlert/index.js
app/components/UI/HintModal/index.js
app/components/UI/ManageNetworks/ManageNetworks.test.js
app/components/UI/Navbar/index.js
app/components/UI/Navbar/index.test.jsx
app/components/UI/NavbarBrowserTitle/index.js
app/components/UI/NavbarTitle/index.js
app/components/UI/NavbarTitle/index.test.js
app/components/UI/NetworkMainAssetLogo/index.js
app/components/UI/Notification/BaseNotification/index.js
app/components/UI/Notification/BaseNotification/index.test.jsx
app/components/UI/Notification/SimpleNotification/index.js
app/components/UI/Notification/TransactionNotification/index.js
app/components/UI/Notification/index.js
app/components/UI/OnboardingWizard/Coachmark/index.js
app/components/UI/OptinMetrics/index.js
app/components/UI/PaymentRequest/index.js
app/components/UI/PaymentRequestSuccess/index.js
app/components/UI/PhishingModal/index.js
app/components/UI/ProtectYourWalletModal/index.js
app/components/UI/ReceiveRequest/index.js
app/components/UI/Screen/index.js
app/components/UI/SeedphraseModal/index.js
app/components/UI/SelectComponent/index.js
app/components/UI/SettingsDrawer/index.js
app/components/UI/SettingsNotification/index.js
app/components/UI/SkipAccountSecurityModal/index.js
app/components/UI/SliderButton/index.js
app/components/UI/SlippageSlider/index.js
app/components/UI/StyledButton/index.android.js
app/components/UI/StyledButton/index.ios.js
app/components/UI/StyledButton/index.js
app/components/UI/SwitchCustomNetwork/index.js
app/components/UI/Tabs/TabCountIcon/index.js
app/components/UI/Tabs/index.js
app/components/UI/TimeEstimateInfoModal/index.js
app/components/UI/TokenImage/index.js
app/components/UI/TransactionActionModal/TransactionActionContent/index.js
app/components/UI/TransactionActionModal/index.js
app/components/UI/TransactionElement/TransactionDetails/index.js
app/components/UI/TransactionElement/index.js
app/components/UI/TransactionElement/utils.js
app/components/UI/TransactionElement/utils.test.js
app/components/UI/TransactionHeader/index.js
app/components/UI/Transactions/index.js
app/components/UI/WarningExistingUserModal/index.js
app/components/UI/WebsiteIcon/index.js
app/components/UI/WebviewError/index.js
app/components/UI/WebviewProgressBar/index.js
```
