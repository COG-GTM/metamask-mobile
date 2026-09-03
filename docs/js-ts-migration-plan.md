# JavaScript → TypeScript Migration Plan

Status: **in progress**. Inventory snapshot taken 2026-09-02 from `main` (331 files).

This document is the single source of truth for finishing the migration of the remaining
`.js` / `.jsx` files under `app/` to TypeScript. It is designed to be executed by many
independent, parallel Devin child sessions, each converting **one file** (or one tightly
coupled unit). Update the checklist in §7 as PRs merge.

Related policy and tooling:

- Policy: `.github/guidelines/CODING_GUIDELINES.md` — "New Code Should be TypeScript".
- Guardrail: `.github/scripts/fitness-functions/rules/javascript-additions.ts`
  (`preventJavaScriptFileAdditions`) blocks **new** `.js`/`.jsx` files matching
  `APP_FOLDER_JS_REGEX = /^(app).*\.(js|jsx)$/` (`common/constants.ts`). Only file
  *creations* are checked (`filterDiffFileCreations` in `common/shared.ts`), so renaming an
  existing JS file is allowed. Runs in `.github/workflows/fitness-functions.yml`.
- `tsconfig.json`: `allowJs: true`, `noEmit: true`, `isolatedModules: true`, `strict: true`;
  `checkJs` is off, so JS files are not type-checked until they are renamed.
- ESLint (`.eslintrc.js`): `*.ts`/`*.tsx` use `@metamask/eslint-config-typescript` with
  `@typescript-eslint/no-explicit-any: error`; `*.js`/`*.jsx` use the looser Babel config.

## 1. Goal & scope

Convert every remaining `.js`/`.jsx` file under `app/` to `.ts`/`.tsx` incrementally, one
small PR at a time, without changing runtime behaviour or breaking the build.

In scope: the 330 files listed in §7 (290 source files + 40 `*.test.js` files).
Out of scope: files outside `app/` (`e2e/`, `scripts/`, `wdio/`, config files), logic
refactors, converting `connect()` HOCs to hooks, changing snapshots, and generated output —
`app/lib/ppom/blockaid-version.js` is emitted by `ppom/webpack.config.version.js` during
`scripts/setup.mjs`, so renaming it would be undone on the next setup; it is excluded and
should be handled (if ever) by changing the generator, not by a migration PR.

## 2. Inventory

Regenerate the inventory at any time with:

```bash
find app -type f \( -name '*.js' -o -name '*.jsx' \) | sort
find app -type f \( -name '*.js' -o -name '*.jsx' \) | wc -l   # 331 at time of writing (330 migratable + generated blockaid-version.js)
```

Distribution at time of writing:

| Area | Files |
|------|------:|
| `app/components/UI/` | 103 |
| `app/components/Views/` | 80 |
| `app/store/migrations/` | 38 |
| `app/util/` (incl. `util/test/`) | 33 |
| `app/core/` | 25 |
| `app/reducers/` | 14 |
| `app/components/Base/` | 12 |
| `app/actions/` | 11 |
| `app/__mocks__/` | 6 |
| `app/constants/` | 3 |
| `app/components/Nav/` | 3 |
| `app/lib/` | 3 (+1 generated, excluded) |
| `app/images/` | 1 |

### Prioritisation rules

1. **Leaf / low-fan-in modules first** (utilities, constants, actions). Few importers means a
   small blast radius and a trivially reviewable PR.
2. **Files with zero or few type errors next.** Rename locally, run `yarn lint:tsc`, and if
   the error count is small, take the file.
3. **Type shared modules before their consumers** so consumers can import real types
   instead of inventing them (see §4).
4. **Defer** complex stateful/`connect()`ed components, `app/components/Views/confirmations/legacy/`,
   and anything in the "external QA required" list (§4.4) until the layers below them are typed.
5. Redux reducers are tracked separately: `app/reducers/index.ts` types many `RootState`
   slices as `any` with a TODO. Each reducer conversion must also replace its `any` slice in
   `RootState` with the exported state interface.

## 3. Child-session workflow (one file per session)

The orchestrating (parent) session hands each unchecked **work unit** in §7 to a child
session. A work unit is a source file **plus its co-located `*.test.js`** (same directory,
same basename, e.g. `foo.js` + `foo.test.js`, or `index.js` + `index.test.js` /
`<Dir>.test.js`); test files that pair with a source file in the checklist are never assigned
separately. Only test files with no JS source sibling (e.g. `app/store/migrations/028.test.js`,
whose source is already `028.ts`) are standalone units. Pairing is deterministic:
(a) matching basename in the same directory; otherwise (b) the module under test is the
**same-directory** `./` import (`rg "(from|require\()\s*['\"]\./" <test>`, `import` or
`require`, either quote style) — `../` imports are helpers, never the paired source, and if a
test has zero or more than one `./` JS import it falls through to (c) or is a standalone unit;
and (c) if a directory contains exactly **one** JS source, every `*.test.js` in it pairs with
that source regardless of name — e.g.
`app/reducers/notification/index.js` + `notification.test.js`, and
`app/components/Views/NavigationUnitTest/index.js` + `TestScreen1/2/3.test.js`. In
multi-source directories (e.g. `app/components/UI/Swaps/components/`) only rules (a)/(b)
apply, so unrelated sources are never bundled. Before launching a batch, the parent must
dedupe assignments so no two concurrent children touch the same file. Use a Devin workflow /
batch of child sessions; each child gets a prompt of the form:

> Convert `<path>` from JavaScript to TypeScript in `COG-GTM/metamask-mobile` following
> `docs/js-ts-migration-plan.md` §3. Open a PR titled
> `chore(js-ts): Convert <path> to TypeScript` against the fork `COG-GTM/metamask-mobile`.

Every child session MUST:

1. **Branch** from up-to-date `main`.
2. **Rename with git** so history is preserved:
   ```bash
   git mv app/path/file.js  app/path/file.ts    # no JSX
   git mv app/path/file.jsx app/path/file.tsx   # contains JSX
   ```
   Files with JSX that are named `.js` must become `.tsx`. If a co-located `*.test.js`
   exists, rename it in the same PR (`.test.ts` / `.test.tsx`).
3. **Add explicit types.** Remove `any` — `@typescript-eslint/no-explicit-any` is an error
   for TS files. Prefer `unknown` + narrowing, existing exported types from `@metamask/*`
   packages, `RootState`, `StackNavigationProp`, etc. Replace `PropTypes` with a `Props`
   interface (use `interface`, `ReactNode` for children, `StyleProp<ViewStyle>` for styles).
   Only add types — do not refactor logic, do not convert `connect()` to hooks, and keep
   `///: BEGIN:ONLY_INCLUDE_IF(...)` preprocessor directives byte-for-byte intact.
4. **Fix importers.** Module imports are extension-less, so renames usually need no import
   changes. Check anyway:
   ```bash
   rg "<basename>\.jsx?'" app          # explicit-extension imports
   rg "jest.mock\(.*<basename>" app    # mocks referencing the path
   ```
   Also check `jest.config.js` `moduleNameMapper` and `.eslintrc.js` overrides for
   path-specific entries.
5. **Validate locally** — all three must pass:
   ```bash
   yarn lint:tsc                              # tsc --project ./tsconfig.json (strict)
   yarn lint                                  # eslint '**/*.{js,ts,tsx}'
   yarn jest --findRelatedTests <new-path>    # or the file's own test
   ```
   Snapshot tests must produce **identical** output; a changed snapshot means behaviour
   changed. Never run `yarn test:unit:update` to "fix" a snapshot.
6. **Commit / PR title**: `chore(js-ts): Convert <original path> to TypeScript`.
   PR body: what was typed, any `unknown`/assertion hot spots, and the three validation
   commands with their results. Follow the repo PR template.
7. **Keep it small.** One file (plus its test and its `RootState` slice if a reducer). The
   37-file batch PR #11214 was reverted in #11418; do not batch unrelated files.
8. **Add a `CHANGELOG.md` entry** linking the PR, as required by `.github/CONTRIBUTING.md`
   (match the existing `chore(js-ts): Convert … to TypeScript` entries).
9. **Update this doc** in the same PR: tick the checkbox for every file in the work unit in §7.

If a file cannot be typed without a refactor (e.g. dynamic shapes, missing upstream types),
the child should stop, leave the file unchecked, and report back with the blocker instead of
introducing `any` casts or `// @ts-expect-error` sprinkled through the file. Localised
`// @ts-expect-error` with a justification comment is acceptable for at most a handful of
lines per file.

## 4. Parallelization & sequencing

Fan-in counts below are the number of files under `app/` importing the module (excluding
snapshots) as of the inventory date. Low fan-in = safe to convert independently and in
parallel.

### 4.1 Wave 1 — fully independent leaves (run all in parallel)

No shared type dependencies between these; each can be its own child session.

| File | Fan-in | Notes |
|------|-------:|-------|
| `app/util/dapp-url-list.js` | 1 | data list; `as const` |
| `app/core/DrawerStatusTracker.js` | 1 | tiny state holder |
| `app/util/middlewares.js` | 2 | |
| `app/util/payment-link-generator.js` | 2 | |
| `app/util/streams.js` | 2 | `Duplex` from `stream` |
| `app/util/conversion/index.js` | 3 | BN.js types |
| `app/util/blockies.js` | 4 | |
| `app/util/confirm-tx.js` | 4 | |
| `app/util/confusables/index.js` | 4 | |
| `app/util/gasUtils.js` | 4 | BN.js types |
| `app/util/etherscan.js` | 6 | |
| `app/util/confirmation/signatureUtils.js` | 6 | |
| `app/util/scaling.js` | 7 | |
| `app/util/custom-gas/index.js` | 8 | |
| `app/constants/navigation.js` | 12 | `as const` |
| `app/constants/onboarding.js` | 16 | `as const` |
| `app/core/TransactionTypes.js` | 19 | pure constants |
| `app/images/image-icons.js` | 19 | |
| `app/util/date/index.js` | 20 | reference: `app/util/date/index.test.ts` |
| `app/lib/ens-ipfs/contracts/registry.js`, `resolver.js` | low | ABI constants |
| `app/__mocks__/*.js` (6 files) | jest only | type to the mocked module's API |
| `app/util/test/*.js` (8 files) | jest only | check `jest.config.js` `transform` for `assetFileTransformer.js` before renaming |
| `app/actions/*/index.js` (11 files) | per slice | export `Action` union + `as const` types; reference `app/actions/onboarding/index.ts` |
| `app/store/migrations/000.js`–`027.js` (28 + 9 tests) | `index.ts` only | signature `migrate(state: unknown)`; reference `028.ts` |
| `app/components/Base/*.js` and simple presentational `app/components/UI/*` (AnimatedSpinner, Button, Screen, SliderButton, FadeOutOverlay, FoxScreen, WebviewProgressBar, EthereumAddress, StatusText, TabBar, DetailsModal, RangeInput, RemoteImage, Confetti, HintModal, NetworkMainAssetLogo, TokenImage, WebsiteIcon, …) | UI only | PropTypes → `Props` interface; snapshots must not change |

### 4.2 Wave 2 — high fan-in shared modules (one session each, land before Wave 3)

These are imported by dozens–hundreds of files. They are still single-file PRs, but their
exported types unblock the consumers, so land them early and rebase consumers on top.

| File | Fan-in |
|------|-------:|
| `app/util/sentry/utils.js` | 487 |
| `app/util/networks/index.js` | 198 |
| `app/util/device/index.js` | 181 |
| `app/util/number/index.js` | 107 |
| `app/constants/network.js` | 103 |
| `app/util/transactions/index.js` | 73 |
| `app/util/general/index.js` | 50 |
| `app/core/ClipboardManager.js` | 31 |
| `app/util/conversions.js` (+ `.test.js`) | 28 |
| `app/util/ENSUtils.js` | 26 |
| `app/util/walletconnect.js` | 12 |

### 4.3 Sequenced chains (must be ordered)

| Order | Then | Why |
|-------|------|-----|
| `app/actions/<slice>/index.js` | `app/reducers/<slice>/index.js` | reducer imports the `Action` union; reducer PR also replaces the `any` slice in `app/reducers/index.ts` `RootState`. Different slices are independent of each other and can run in parallel. |
| `app/reducers/*` (RootState fully typed) | `connect()`ed UI/Views components | `mapStateToProps(state: RootState)` needs typed slices |
| `app/core/RPCMethods/lib/ethereum-chain-utils.js`, `handlers/index.js` | `wallet_addEthereumChain.js`, `wallet_switchEthereumChain.js`, `eth-request-accounts.js`, `createEthAccountsMethodMiddleware.js`, `createEip1193MethodMiddleware/index.js` | then `app/core/RPCMethods/index.js` last |
| `app/core/Permissions/specifications.js` | `app/core/BackgroundBridge/BackgroundBridge.js` | |
| `app/core/MobilePortStream.js`, `EntryScriptWeb3.js` | `BackgroundBridge.js` | |
| `app/components/UI/Swaps/utils/index.js` → `useBalance.js`, `useBlockExplorer.js`, `useFetchTokenMetadata.js` | `Swaps/components/*.js` | `QuotesView.js`, `Swaps/index.js` |
| `app/components/UI/Notification/BaseNotification` | `SimpleNotification`, `TransactionNotification` | `Notification/index.js` |
| `app/components/UI/ActionModal/ActionContent` | `ActionModal/index.js` | |
| `app/components/UI/TransactionActionModal/TransactionActionContent` | `TransactionActionModal/index.js` | |
| `app/components/UI/TransactionElement/utils.js`, `TransactionDetails` | `TransactionElement/index.js` | `Transactions/index.js` |
| `app/components/UI/Navbar/index.js`, `NavbarTitle`, `NavbarBrowserTitle` | `app/components/Nav/Main/MainNavigator.js` | `Nav/Main/index.js`, `RootRPCMethodsUI.js` |
| `app/components/UI/StyledButton/index.ios.js` + `index.android.js` + `index.js` | — | convert the three together (one cohesive unit) |
| `.../SendFlow/AddressList/AddressList.jsx` + `index.js`, `.../CustomGasModal/CustomGasModal.jsx` + `index.js` | — | convert the pair together |
| `.../legacy/components/TransactionReview/*` sub-components | `TransactionReview/index.js` | then `Approval/`, `Approve/`, `SendFlow/Confirm/` |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` | `NetworkSettings/index.js` | `NetworksSettings/index.js` |

### 4.4 Defer / needs manual device QA

Convert last, one at a time, and request manual QA in the PR: `app/core/SecureKeychain.js`
(biometrics), `app/core/PreventScreenshot.js` (Android native module — needs a `.d.ts`),
`app/core/NotificationManager.js` (push), `app/core/Vault.js` (Ledger), `BackgroundBridge.js`
(dApp connectivity), `app/core/WalletConnect/WalletConnect.js`, `app/components/Views/Browser/index.js`,
`Onboarding/`, `ChoosePassword/`, `ManualBackupStep*/`, `Settings/NetworksSettings/`, and
everything under `app/components/Views/confirmations/legacy/`.

### 4.5 Suggested concurrency

- Waves 1 and 2 can run ~20–30 child sessions concurrently; conflicts are limited to the two
  shared files every child touches — this doc's checklist and `CHANGELOG.md` — and are
  trivial to rebase (each child adds one checkbox tick and one changelog line). The parent
  should merge finished PRs one at a time and have each remaining child rebase on `main`
  before merge, rather than merging in bulk.
- Sequenced chains in §4.3: one session per chain link, started when the predecessor merges.
- Cap in-flight PRs touching `app/reducers/index.ts` to a few at a time to avoid churn on
  the shared `RootState` type.

## 5. Verification & guardrails

- **No regressions**: the `preventJavaScriptFileAdditions` fitness function
  (`.github/workflows/fitness-functions.yml`) fails CI if a PR *creates* a `.js`/`.jsx` under
  `app/`. Renames are allowed.
- **Type safety**: `yarn lint:tsc` runs `tsc` in `strict` mode over the whole project; a
  renamed file joins the type-checked set immediately.
- **Lint**: `yarn lint` applies the strict TS ESLint config (no explicit `any`) to renamed files.
- **Tests**: `yarn jest --findRelatedTests <file>` locally; full unit suite in CI.
- **Snapshots**: unchanged snapshots are the behavioural regression test for component PRs.
- **Definition of done for a child PR**: all CI checks green, snapshot files untouched,
  no new `any`, checklist ticked in this document.

Progress can be measured at any time with:

```bash
find app -type f \( -name '*.js' -o -name '*.jsx' \) | wc -l
```

## 6. Reference conversions

Already-migrated neighbours to copy patterns from:

- Actions/reducers: `app/actions/onboarding/index.ts`, `app/reducers/security/index.ts`
- Migrations: `app/store/migrations/028.ts`
- Utils: `app/util/string/index.ts`, `app/util/date/index.test.ts`, `app/util/transaction-reducer-helpers.ts`
- Core: `app/core/Authentication/Authentication.ts`, `app/core/Encryptor/Encryptor.ts`, `app/core/RPCMethods/RPCMethodMiddleware.ts`
- Components: `app/component-library/components/**`, `app/components/Base/HorizontalSelector/`,
  `app/components/UI/ManageNetworks/ManageNetworks.tsx`, `app/components/Views/Wallet/index.tsx`,
  `app/components/Views/Login/index.tsx`, `app/components/Views/AndroidBackHandler/index.tsx`
- Prior single-file PRs: #11546, #11629, #11661, #11650 (see `CHANGELOG.md`)

## 7. Tracking checklist

Tick a file when its `chore(js-ts)` PR merges. A source file and its co-located `*.test.js`
are one work unit (see §3) and are ticked together. Grouped by area; letters map to the
playbook groups referenced in §4.

### A. Redux actions (`app/actions/`) — Playbook 1 (11 files)

- [ ] `app/actions/alert/index.js`
- [ ] `app/actions/bookmarks/index.js`
- [ ] `app/actions/browser/index.js`
- [ ] `app/actions/collectibles/index.js`
- [ ] `app/actions/infuraAvailability/index.js`
- [ ] `app/actions/modals/index.js`
- [ ] `app/actions/notification/index.js`
- [ ] `app/actions/privacy/index.js`
- [ ] `app/actions/settings/index.js`
- [ ] `app/actions/transaction/index.js`
- [ ] `app/actions/wizard/index.js`

### B. Constants, mocks, lib, images (`app/constants/`, `app/__mocks__/`, `app/lib/`, `app/images/`) — Playbook 10 (13 files + 1 excluded)

- [ ] `app/__mocks__/pngMock.js`
- [ ] `app/__mocks__/react-native-device-info.js`
- [ ] `app/__mocks__/react-native-splash-screen.js`
- [ ] `app/__mocks__/react-native-view-shot.js`
- [ ] `app/__mocks__/rn-fetch-blob.js`
- [ ] `app/__mocks__/svgMock.js`
- [ ] `app/constants/navigation.js`
- [ ] `app/constants/network.js`
- [ ] `app/constants/onboarding.js`
- [ ] `app/images/image-icons.js`
- [ ] `app/lib/ens-ipfs/contracts/registry.js`
- [ ] `app/lib/ens-ipfs/contracts/resolver.js`
- [ ] `app/lib/ens-ipfs/resolver.js`
- ~~`app/lib/ppom/blockaid-version.js`~~ — generated by `ppom/webpack.config.version.js`; excluded

### C. Redux reducers (`app/reducers/`) — Playbook 2 (after A) (14 files)

- [ ] `app/reducers/alert/index.js`
- [ ] `app/reducers/bookmarks/index.js`
- [ ] `app/reducers/browser/index.js`
- [ ] `app/reducers/browser/index.test.js`
- [ ] `app/reducers/collectibles/index.js`
- [ ] `app/reducers/infuraAvailability/index.js`
- [ ] `app/reducers/modals/index.js`
- [ ] `app/reducers/notification/index.js`
- [ ] `app/reducers/notification/notification.test.js`
- [ ] `app/reducers/privacy/index.js`
- [ ] `app/reducers/settings/index.js`
- [ ] `app/reducers/swaps/index.js`
- [ ] `app/reducers/transaction/index.js`
- [ ] `app/reducers/wizard/index.js`

### D. Store migrations (`app/store/migrations/`) — Playbook 3 (38 files)

- [ ] `app/store/migrations/000.js`
- [ ] `app/store/migrations/001.js`
- [ ] `app/store/migrations/002.js`
- [ ] `app/store/migrations/003.js`
- [ ] `app/store/migrations/004.js`
- [ ] `app/store/migrations/005.js`
- [ ] `app/store/migrations/006.js`
- [ ] `app/store/migrations/007.js`
- [ ] `app/store/migrations/008.js`
- [ ] `app/store/migrations/009.js`
- [ ] `app/store/migrations/010.js`
- [ ] `app/store/migrations/011.js`
- [ ] `app/store/migrations/012.js`
- [ ] `app/store/migrations/013.js`
- [ ] `app/store/migrations/014.js`
- [ ] `app/store/migrations/015.js`
- [ ] `app/store/migrations/016.js`
- [ ] `app/store/migrations/017.js`
- [ ] `app/store/migrations/018.js`
- [ ] `app/store/migrations/019.js`
- [ ] `app/store/migrations/019.test.js`
- [ ] `app/store/migrations/020.js`
- [ ] `app/store/migrations/020.test.js`
- [ ] `app/store/migrations/021.js`
- [ ] `app/store/migrations/021.test.js`
- [ ] `app/store/migrations/022.js`
- [ ] `app/store/migrations/022.test.js`
- [ ] `app/store/migrations/023.js`
- [ ] `app/store/migrations/023.test.js`
- [ ] `app/store/migrations/024.js`
- [ ] `app/store/migrations/024.test.js`
- [ ] `app/store/migrations/025.js`
- [ ] `app/store/migrations/025.test.js`
- [ ] `app/store/migrations/026.js`
- [ ] `app/store/migrations/026.test.js`
- [ ] `app/store/migrations/027.js`
- [ ] `app/store/migrations/027.test.js`
- [ ] `app/store/migrations/028.test.js`

### E. Utilities (`app/util/`, excluding `app/util/test/`) — Playbook 6 (24 files)

- [ ] `app/util/ENSUtils.js`
- [ ] `app/util/blockies.js`
- [ ] `app/util/confirm-tx.js`
- [ ] `app/util/confirmation/signatureUtils.js`
- [ ] `app/util/confusables/index.js`
- [ ] `app/util/conversion/index.js`
- [ ] `app/util/conversions.js`
- [ ] `app/util/conversions.test.js`
- [ ] `app/util/custom-gas/index.js`
- [ ] `app/util/dapp-url-list.js`
- [ ] `app/util/date/index.js`
- [ ] `app/util/device/index.js`
- [ ] `app/util/etherscan.js`
- [ ] `app/util/gasUtils.js`
- [ ] `app/util/general/index.js`
- [ ] `app/util/middlewares.js`
- [ ] `app/util/networks/index.js`
- [ ] `app/util/number/index.js`
- [ ] `app/util/payment-link-generator.js`
- [ ] `app/util/scaling.js`
- [ ] `app/util/sentry/utils.js`
- [ ] `app/util/streams.js`
- [ ] `app/util/transactions/index.js`
- [ ] `app/util/walletconnect.js`

### F. Test helpers (`app/util/test/`) (8 files)

- [ ] `app/util/test/assetFileTransformer.js`
- [ ] `app/util/test/contract-address-registry.js`
- [ ] `app/util/test/ganache-seeder.js`
- [ ] `app/util/test/ganache.js`
- [ ] `app/util/test/network-store.js`
- [ ] `app/util/test/smart-contracts.js`
- [ ] `app/util/test/testSetup.js`
- [ ] `app/util/test/utils.js`

### G. Core services (`app/core/*`, excluding RPCMethods/Permissions) — Playbook 4 (12 files)

- [ ] `app/core/BackgroundBridge/BackgroundBridge.js`
- [ ] `app/core/BackgroundBridge/BackgroundBridge.test.js`
- [ ] `app/core/ClipboardManager.js`
- [ ] `app/core/DrawerStatusTracker.js`
- [ ] `app/core/EntryScriptWeb3.js`
- [ ] `app/core/MobilePortStream.js`
- [ ] `app/core/NotificationManager.js`
- [ ] `app/core/PreventScreenshot.js`
- [ ] `app/core/SecureKeychain.js`
- [ ] `app/core/TransactionTypes.js`
- [ ] `app/core/Vault.js`
- [ ] `app/core/WalletConnect/WalletConnect.js`

### H. RPC methods & permissions (`app/core/RPCMethods/`, `app/core/Permissions/`) — Playbook 5 (12 files)

- [ ] `app/core/Permissions/specifications.js`
- [ ] `app/core/Permissions/specifications.test.js`
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.js`
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`
- [ ] `app/core/RPCMethods/eth-request-accounts.js`
- [ ] `app/core/RPCMethods/handlers/index.js`
- [ ] `app/core/RPCMethods/index.js`
- [ ] `app/core/RPCMethods/lib/ethereum-chain-utils.js`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.js`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.test.js`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.js`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.test.js`

### I. Base components (`app/components/Base/`) — Playbook 7 (12 files)

- [ ] `app/components/Base/DetailsModal.js`
- [ ] `app/components/Base/Keypad/Keypad.test.js`
- [ ] `app/components/Base/Keypad/components.js`
- [ ] `app/components/Base/Keypad/constants.js`
- [ ] `app/components/Base/Keypad/createKeypadRule.js`
- [ ] `app/components/Base/Keypad/createKeypadRule.test.js`
- [ ] `app/components/Base/Keypad/index.js`
- [ ] `app/components/Base/Keypad/useCurrency.js`
- [ ] `app/components/Base/RangeInput.js`
- [ ] `app/components/Base/RemoteImage/index.js`
- [ ] `app/components/Base/StatusText.js`
- [ ] `app/components/Base/TabBar.js`

### J. UI components (`app/components/UI/`) — Playbooks 7 & 8 (103 files)

- [ ] `app/components/UI/AccountApproval/index.js`
- [ ] `app/components/UI/AccountInfoCard/index.js`
- [ ] `app/components/UI/AccountOverview/index.js`
- [ ] `app/components/UI/ActionModal/ActionContent/index.js`
- [ ] `app/components/UI/ActionModal/index.js`
- [ ] `app/components/UI/ActionView/index.js`
- [ ] `app/components/UI/AddCustomToken/index.js`
- [ ] `app/components/UI/AddressInputs/index.js`
- [ ] `app/components/UI/AddressInputs/index.test.jsx`
- [ ] `app/components/UI/AnimatedSpinner/index.js`
- [ ] `app/components/UI/AnimatedTransactionModal/index.js`
- [ ] `app/components/UI/AssetList/index.js`
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionality.test.js`
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js`
- [ ] `app/components/UI/BrowserBottomBar/index.js`
- [ ] `app/components/UI/Button/index.js`
- [ ] `app/components/UI/CollectibleContractElement/index.js`
- [ ] `app/components/UI/CollectibleContractInformation/index.js`
- [ ] `app/components/UI/CollectibleContractOverview/index.js`
- [ ] `app/components/UI/CollectibleContracts/index.js`
- [ ] `app/components/UI/CollectibleOverview/index.js`
- [ ] `app/components/UI/Collectibles/index.js`
- [ ] `app/components/UI/Confetti/index.js`
- [ ] `app/components/UI/CustomAlert/index.js`
- [ ] `app/components/UI/DrawerView/index.js`
- [ ] `app/components/UI/EditGasFee1559/index.js`
- [ ] `app/components/UI/EditGasFeeLegacy/index.js`
- [ ] `app/components/UI/EthereumAddress/index.js`
- [ ] `app/components/UI/FadeAnimationView/index.js`
- [ ] `app/components/UI/FadeOutOverlay/index.js`
- [ ] `app/components/UI/FoxScreen/index.js`
- [ ] `app/components/UI/GlobalAlert/index.js`
- [ ] `app/components/UI/HintModal/index.js`
- [ ] `app/components/UI/ManageNetworks/ManageNetworks.test.js`
- [ ] `app/components/UI/Navbar/index.js`
- [ ] `app/components/UI/Navbar/index.test.jsx`
- [ ] `app/components/UI/NavbarBrowserTitle/index.js`
- [ ] `app/components/UI/NavbarTitle/index.js`
- [ ] `app/components/UI/NavbarTitle/index.test.js`
- [ ] `app/components/UI/NetworkMainAssetLogo/index.js`
- [ ] `app/components/UI/Notification/BaseNotification/index.js`
- [ ] `app/components/UI/Notification/BaseNotification/index.test.jsx`
- [ ] `app/components/UI/Notification/SimpleNotification/index.js`
- [ ] `app/components/UI/Notification/TransactionNotification/index.js`
- [ ] `app/components/UI/Notification/index.js`
- [ ] `app/components/UI/OnboardingWizard/Coachmark/index.js`
- [ ] `app/components/UI/OptinMetrics/index.js`
- [ ] `app/components/UI/PaymentRequest/index.js`
- [ ] `app/components/UI/PaymentRequestSuccess/index.js`
- [ ] `app/components/UI/PhishingModal/index.js`
- [ ] `app/components/UI/ProtectYourWalletModal/index.js`
- [ ] `app/components/UI/ReceiveRequest/index.js`
- [ ] `app/components/UI/Screen/index.js`
- [ ] `app/components/UI/SeedphraseModal/index.js`
- [ ] `app/components/UI/SelectComponent/index.js`
- [ ] `app/components/UI/SettingsDrawer/index.js`
- [ ] `app/components/UI/SettingsNotification/index.js`
- [ ] `app/components/UI/SkipAccountSecurityModal/index.js`
- [ ] `app/components/UI/SliderButton/index.js`
- [ ] `app/components/UI/SlippageSlider/index.js`
- [ ] `app/components/UI/StyledButton/index.android.js`
- [ ] `app/components/UI/StyledButton/index.ios.js`
- [ ] `app/components/UI/StyledButton/index.js`
- [ ] `app/components/UI/Swaps/QuotesView.js`
- [ ] `app/components/UI/Swaps/components/ActionAlert.js`
- [ ] `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js`
- [ ] `app/components/UI/Swaps/components/AssetSwapButton.js`
- [ ] `app/components/UI/Swaps/components/GasEditModal.js`
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js`
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/index.js`
- [ ] `app/components/UI/Swaps/components/Onboarding.js`
- [ ] `app/components/UI/Swaps/components/QuotesModal.js`
- [ ] `app/components/UI/Swaps/components/QuotesSummary.js`
- [ ] `app/components/UI/Swaps/components/SlippageModal.js`
- [ ] `app/components/UI/Swaps/components/TokenIcon.js`
- [ ] `app/components/UI/Swaps/components/TokenIcon.test.js`
- [ ] `app/components/UI/Swaps/components/TokenImportModal.js`
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.js`
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.test.js`
- [ ] `app/components/UI/Swaps/components/TokenSelectModal.js`
- [ ] `app/components/UI/Swaps/index.js`
- [ ] `app/components/UI/Swaps/utils/index.js`
- [ ] `app/components/UI/Swaps/utils/index.test.js`
- [ ] `app/components/UI/Swaps/utils/useBalance.js`
- [ ] `app/components/UI/Swaps/utils/useBlockExplorer.js`
- [ ] `app/components/UI/Swaps/utils/useFetchTokenMetadata.js`
- [ ] `app/components/UI/SwitchCustomNetwork/index.js`
- [ ] `app/components/UI/Tabs/TabCountIcon/index.js`
- [ ] `app/components/UI/Tabs/index.js`
- [ ] `app/components/UI/TimeEstimateInfoModal/index.js`
- [ ] `app/components/UI/TokenImage/index.js`
- [ ] `app/components/UI/TransactionActionModal/TransactionActionContent/index.js`
- [ ] `app/components/UI/TransactionActionModal/index.js`
- [ ] `app/components/UI/TransactionElement/TransactionDetails/index.js`
- [ ] `app/components/UI/TransactionElement/index.js`
- [ ] `app/components/UI/TransactionElement/utils.js`
- [ ] `app/components/UI/TransactionElement/utils.test.js`
- [ ] `app/components/UI/TransactionHeader/index.js`
- [ ] `app/components/UI/Transactions/index.js`
- [ ] `app/components/UI/WarningExistingUserModal/index.js`
- [ ] `app/components/UI/WebsiteIcon/index.js`
- [ ] `app/components/UI/WebviewError/index.js`
- [ ] `app/components/UI/WebviewProgressBar/index.js`

### K. Navigation (`app/components/Nav/`) — Playbook 10 (3 files)

- [ ] `app/components/Nav/Main/MainNavigator.js`
- [ ] `app/components/Nav/Main/RootRPCMethodsUI.js`
- [ ] `app/components/Nav/Main/index.js`

### L. Views (`app/components/Views/`, excluding confirmations) — Playbook 9A (43 files)

- [ ] `app/components/Views/AccountBackupStep1/index.js`
- [ ] `app/components/Views/AccountBackupStep1B/index.js`
- [ ] `app/components/Views/ActivityView/index.js`
- [ ] `app/components/Views/AddBookmark/index.js`
- [ ] `app/components/Views/AddressQRCode/index.js`
- [ ] `app/components/Views/Asset/index.js`
- [ ] `app/components/Views/Asset/index.test.js`
- [ ] `app/components/Views/Browser/index.js`
- [ ] `app/components/Views/ChoosePassword/index.js`
- [ ] `app/components/Views/Collectible/index.js`
- [ ] `app/components/Views/CollectibleView/index.js`
- [ ] `app/components/Views/EnterPasswordSimple/index.js`
- [ ] `app/components/Views/ErrorBoundary/index.js`
- [ ] `app/components/Views/GasEducationCarousel/index.js`
- [ ] `app/components/Views/ImportFromSecretRecoveryPhrase/index.js`
- [ ] `app/components/Views/ImportPrivateKeySuccess/index.js`
- [ ] `app/components/Views/LockScreen/index.js`
- [ ] `app/components/Views/ManualBackupStep1/index.js`
- [ ] `app/components/Views/ManualBackupStep2/index.js`
- [ ] `app/components/Views/ManualBackupStep3/index.js`
- [ ] `app/components/Views/MediaPlayer/AndroidMediaPlayer.js`
- [ ] `app/components/Views/MediaPlayer/index.js`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen1.test.js`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen2.test.js`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen3.test.js`
- [ ] `app/components/Views/NavigationUnitTest/index.js`
- [ ] `app/components/Views/OfflineMode/index.js`
- [ ] `app/components/Views/Onboarding/index.js`
- [ ] `app/components/Views/OnboardingSuccess/index.test.js`
- [ ] `app/components/Views/ResetPassword/index.js`
- [ ] `app/components/Views/Settings/AdvancedSettings/index.js`
- [ ] `app/components/Views/Settings/AppInformation/index.js`
- [ ] `app/components/Views/Settings/Contacts/ContactForm/index.js`
- [ ] `app/components/Views/Settings/Contacts/index.js`
- [ ] `app/components/Views/Settings/GeneralSettings/index.js`
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js`
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js`
- [ ] `app/components/Views/Settings/NetworksSettings/index.js`
- [ ] `app/components/Views/SimpleWebview/index.js`
- [ ] `app/components/Views/TermsAndConditions/index.js`
- [ ] `app/components/Views/TransactionSummary/index.js`
- [ ] `app/components/Views/TransactionsView/index.js`
- [ ] `app/components/Views/WalletConnectSessions/index.js`

### M. Legacy confirmations (`app/components/Views/confirmations/`) — Playbook 9B (37 files)

- [ ] `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js`
- [ ] `app/components/Views/confirmations/legacy/Approval/index.js`
- [ ] `app/components/Views/confirmations/legacy/Approve/index.js`
- [ ] `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js`
- [ ] `app/components/Views/confirmations/legacy/Send/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/CustomNonce/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/TypedSign/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js`
- [ ] `app/components/Views/confirmations/mock-data.js`
