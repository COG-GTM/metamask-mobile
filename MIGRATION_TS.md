# JavaScript → TypeScript Migration Plan & Tracker

> **Status:** Planning / in-progress. This is the single source of truth for the
> incremental migration of the remaining `.js`/`.jsx` files in `metamask-mobile`
> to `.ts`/`.tsx`. It is designed so that **many independent agents (Devins) can
> work in parallel** without stepping on each other.
>
> The repository is already **partially TypeScript** (3,900+ `.ts`/`.tsx` files vs.
> **331** remaining `.js`/`.jsx` files under `app/`), so this is an incremental
> conversion, not a greenfield setup.

---

## Table of contents

1. [How to use this document (for parallel agents)](#how-to-use-this-document-for-parallel-agents)
2. [Step 1 — Discovery & Inventory](#step-1--discovery--inventory)
   - [Inventory summary](#inventory-summary)
   - [TypeScript config (`tsconfig.json`)](#typescript-config-tsconfigjson)
   - [Lint / format / build config](#lint--format--build-config)
   - [Existing TypeScript conventions](#existing-typescript-conventions)
   - [`app/` directory structure & module boundaries](#app-directory-structure--module-boundaries)
3. [Step 2 — Parallelization strategy](#step-2--parallelization-strategy)
   - [Dependency tiers](#dependency-tiers)
   - [Batch / ownership map](#batch--ownership-map)
4. [Step 3 — Per-file conversion rules (shared standard)](#step-3--per-file-conversion-rules-shared-standard)
5. [Step 4 — Config & CI considerations](#step-4--config--ci-considerations)
6. [Progress checklist (every file)](#progress-checklist-every-file)

---

## How to use this document (for parallel agents)

1. **Pick an unclaimed batch** from the [Batch / ownership map](#batch--ownership-map).
   A batch == one owning directory/subsystem. Prefer the **lowest available
   dependency tier** so shared modules are typed before their consumers.
2. **Claim it** by opening a branch named `devin/ts-migration/<batch-slug>` (e.g.
   `devin/ts-migration/app-util`) and putting your owner handle in the batch row.
3. **Only touch files inside your owned directory.** The *one* allowed cross-batch
   edit is updating `import`/`export` sites that reference a file you renamed
   (extensions usually resolve automatically — see rules below — so this is rare).
4. Follow the [Per-file conversion rules](#step-3--per-file-conversion-rules-shared-standard)
   exactly.
5. **Verify** with `yarn lint:tsc`, `yarn lint`, and the relevant `yarn test:unit`
   before opening a PR. One PR per batch.
6. Tick the boxes in the [Progress checklist](#progress-checklist-every-file) for
   the files you converted, and open the PR against `main`.

Tiers are ordered bottom-up by dependency. **All batches within the same tier are
independent and can run fully in parallel.** Higher tiers should generally wait for
lower tiers, but do not have to — where a precise type depends on a not-yet-migrated
module, use a marked placeholder (see rules) instead of blocking.

---

## Step 1 — Discovery & Inventory

### Inventory summary

Files remaining to convert (everything under `app/`, excluding `node_modules`):

| Extension | Count |
| --- | --- |
| `.js` | 319 |
| `.jsx` | 12 |
| **Total** | **331** |

By top-level area under `app/`:

| Area | `.js`/`.jsx` files |
| --- | --- |
| `app/components` | 198 |
| `app/store` (migrations) | 38 |
| `app/util` | 32 |
| `app/core` | 24 |
| `app/reducers` | 14 |
| `app/actions` | 11 |
| `app/__mocks__` | 6 |
| `app/lib` | 4 |
| `app/constants` | 3 |
| `app/images` | 1 |

Of the 331, **46** are test/spec/mock/story files (`*.test.js`, `*.spec.js`,
`__mocks__`, etc.) and **285** are production source. Test files should be
converted **together with the source file they cover**, inside the same batch.

#### Out of scope (do **not** convert in this effort)

These contain `.js` but are config / build / E2E / tooling infrastructure and are
deliberately excluded (they are also excluded from `tsc` and/or are Detox/WDIO E2E
suites that run outside the unit-test pipeline):

- Root configs: `babel.config.js`, `babel.config.tests.js`, `metro.config.js`,
  `jest.config.js`, `.eslintrc.js`, `.prettierrc.js`, `app.config.js`, `*.config.js`.
- `.storybook/**` (Storybook config).
- `e2e/**` (Detox E2E specs, fixtures, mocks — separate test runner).
- `wdio/**` (WebdriverIO E2E config/specs).
- `scripts/**` (Node build/automation scripts).
- `android/**`, `ios/**` native projects, `patches/**`, `ppom/**`, `docs/**`.

> If a future phase wants to migrate `e2e/` / `scripts/`, treat it as its own
> separate tracker — it has a different runtime, lint override, and test pipeline.

### TypeScript config (`tsconfig.json`)

Key settings already in place (good news — mixed JS/TS already compiles):

| Option | Value | Implication for migration |
| --- | --- | --- |
| `allowJs` | `true` | ✅ Mixed `.js` + `.ts` already compile. Keep `true` until the **last** file is migrated. |
| `checkJs` | _(commented, off)_ | `.js` files are not type-checked, so converting a file is where type errors first surface. |
| `strict` | `true` | All strict flags on — new `.ts` files must satisfy `strictNullChecks`, `noImplicitAny`, etc. |
| `isolatedModules` | `true` | Use `export type` / `import type` for type-only re-exports. |
| `jsx` | `react-native` | `.tsx` for any file containing JSX. |
| `esModuleInterop` / `allowSyntheticDefaultImports` | `true` | Default imports from CJS modules are fine. |
| `resolveJsonModule` | `true` | JSON imports are typed. |
| `moduleResolution` | `node` | Extension-less imports resolve `.ts`/`.tsx` automatically. |
| `baseUrl` | `.` | — |
| `paths` | `images/*` → `app/images/*`, `@keystonehq/ur-decoder` | Preserve these aliases. |
| `skipLibCheck` | `true` | Third-party `.d.ts` issues won't block you. |

`include`: `app/declarations/index.d.ts`, `app/**/*`, `e2e/**/*`, and two
`expect-webdriverio` paths. `exclude`: `node_modules`, `babel.config.js`,
`metro.config.js`, `jest.config.js`.

Type-check command: **`yarn lint:tsc`** (`tsc --project ./tsconfig.json`, `noEmit`).

### Lint / format / build config

- **ESLint** (`.eslintrc.js`): parser `@typescript-eslint/parser` with
  `parserOptions.project: ./tsconfig.json`.
  - `*.ts`/`*.tsx` files extend `@metamask/eslint-config-typescript` and enable
    **`@typescript-eslint/no-explicit-any: 'error'`** → **`any` is banned**; you
    must provide real types (or a marked placeholder, never raw `any`).
  - `*.js`/`*.jsx` use `@babel/eslint-parser` with relaxed rules (`no-unused-vars`
    off). Converting a file therefore **tightens** the rules applied to it — expect
    new lint errors (unused vars/args, explicit-any) to surface and fix them.
  - Several path-specific overrides exist (e.g. confirmations network-selector
    restrictions for `app/components/Views/confirmations/**`,
    `app/components/UI/Name/**`, `app/components/UI/SimulationDetails/**`,
    `app/components/hooks/DisplayName/**`). Respect them when working in those dirs.
  - Run: **`yarn lint`** (`eslint '**/*.{js,ts,tsx}'`), autofix `yarn lint:fix`.
- **Prettier** (`.prettierrc.js`): `singleQuote: true`, `trailingComma: 'all'`,
  `tabWidth: 2`, `quoteProps: 'as-needed'`. (Applied via ESLint/Prettier integration.)
- **Babel** (`babel.config.js`): `babel-preset-expo` — handles TS/TSX transpilation
  natively, so no Babel change is needed when renaming files.
- **Metro** (`metro.config.js`): default `sourceExts` plus `svg`, `cjs`, `mjs`.
  TS/TSX are in Metro's default `sourceExts`, so no Metro change is needed.
- **Node**: `.nvmrc` pins **20.18.0**. Install deps with `yarn setup` (or
  `yarn setup:expo` to skip native builds).

### Existing TypeScript conventions

Sampled from existing `.ts`/`.tsx` (e.g. `app/core/AppConstants.ts`, selectors,
util modules). Follow these patterns:

- **Imports**: ES module `import`/`export`; default exports allowed
  (`import/prefer-default-export` is off; `import/no-commonjs` is **error**, so no
  `require`/`module.exports` in migrated files). Use `import type { X }` for
  type-only imports (helps `isolatedModules`).
- **Quotes / formatting**: single quotes, trailing commas, 2-space indent.
- **Types organization**: co-locate component prop/state types in the same file
  (`interface FooProps { ... }`), or in a sibling `types.ts` / `*.types.ts` when
  shared. Many subsystems already have a local `types.ts` — extend it rather than
  inventing a new pattern.
- **Redux**: prefer the repo's existing typed `RootState` / action types in
  `app/reducers` & `app/actions` (several already `.ts`); reducers should be typed
  `(state: XState, action: XAction): XState`.
- **React Native components**: function components typed as
  `React.FC<Props>` or `({ ... }: Props) => JSX.Element`; `StyleSheet.create`
  output is inferred — no explicit style typing needed.
- **No `any`**: banned by lint. Use `unknown` + narrowing, generics, or a
  `// TODO(ts-migration)` placeholder type (see rules) when a precise type depends
  on a not-yet-migrated module.

### `app/` directory structure & module boundaries

Top-level source dirs (those containing files to migrate are starred):

```
app/
├── actions/*        Redux action creators (one folder per domain)
├── components/*      React Native UI
│   ├── Base/*        Low-level primitives (Keypad, RangeInput, TabBar, ...)
│   ├── Nav/*         Navigators (Main)
│   ├── UI/*          Reusable feature components (one folder per component)
│   └── Views/*       Screens (one folder per screen) + Views/confirmations/legacy
├── constants/*       App-wide constants
├── core/*            Engine-adjacent singletons (Vault, RPCMethods, BackgroundBridge, ...)
├── images/*          Image icon registry
├── lib/*             Standalone libs (ens-ipfs, ppom)
├── reducers/*        Redux reducers (one folder per domain)
├── store/migrations/* Redux-persist state migrations (000.js … 028)
├── util/*            Shared utilities (number, networks, transactions, device, ...)
└── __mocks__/*       Jest module mocks
```

Module boundaries used for batching: **each leaf directory / subsystem is an
independent unit of ownership.** A converting agent owns one such directory.

---

## Step 2 — Parallelization strategy

### Dependency tiers

Convert **bottom-up** so shared modules are typed before their consumers. This
minimizes the number of `any`/placeholder types needed.

| Tier | Theme | Batches | Files | Rationale |
| --- | --- | --- | --- | --- |
| **0** | Leaf utils, constants, Redux actions/reducers, mocks | 8 | 71 | No (or few) intra-`app` deps; everything else imports these. Do these **first**. |
| **1** | Core singletons, store migrations, Base primitives | 3 | 74 | Depend on Tier 0 utils/constants; consumed by UI. |
| **2** | `components/UI/*` reusable components | 65 | 103 | Depend on Tiers 0–1; consumed by screens. |
| **3** | `components/Views/*` screens + `Nav` | 33 | 83 | Top of the tree; depend on everything below. |
| | **Total** | **109** | **331** | |

Within a tier, **all batches are mutually independent** and can be run by separate
agents simultaneously. Cross-tier ordering is a *preference*, not a hard block:
when a precise type needs a higher-tier or sibling module that isn't migrated yet,
use a marked placeholder rather than waiting.

### Batch / ownership map

Each row is one PR / one branch / one owning agent. `Owner` and `PR` are filled in
as work is claimed. Tier 2/3 single-file batches can be safely grouped by an agent
that wants a larger chunk (e.g. take all single-file `components/UI/*` modals at
once) **as long as a different agent isn't already in them**.

| Tier | Batch (owning dir) | Files | Owner | PR | Done |
| --- | --- | --- | --- | --- | --- |
| 0 | `app/__mocks__/` | 6 | | | ☐ |
| 0 | `app/actions/` | 11 | | | ☐ |
| 0 | `app/constants/` | 3 | | | ☐ |
| 0 | `app/images/` | 1 | | | ☐ |
| 0 | `app/lib/` | 4 | | | ☐ |
| 0 | `app/reducers/` | 14 | | | ☐ |
| 0 | `app/util/` | 24 | | | ☐ |
| 0 | `app/util/test/` | 8 | | | ☐ |
| 1 | `app/components/Base/` | 12 | | | ☐ |
| 1 | `app/core/` | 24 | | | ☐ |
| 1 | `app/store/migrations/` | 38 | | | ☐ |
| 2 | `app/components/UI/AccountApproval/` | 1 | | | ☐ |
| 2 | `app/components/UI/AccountInfoCard/` | 1 | | | ☐ |
| 2 | `app/components/UI/AccountOverview/` | 1 | | | ☐ |
| 2 | `app/components/UI/ActionModal/` | 2 | | | ☐ |
| 2 | `app/components/UI/ActionView/` | 1 | | | ☐ |
| 2 | `app/components/UI/AddCustomToken/` | 1 | | | ☐ |
| 2 | `app/components/UI/AddressInputs/` | 2 | | | ☐ |
| 2 | `app/components/UI/AnimatedSpinner/` | 1 | | | ☐ |
| 2 | `app/components/UI/AnimatedTransactionModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/AssetList/` | 1 | | | ☐ |
| 2 | `app/components/UI/BasicFunctionality/` | 2 | | | ☐ |
| 2 | `app/components/UI/BrowserBottomBar/` | 1 | | | ☐ |
| 2 | `app/components/UI/Button/` | 1 | | | ☐ |
| 2 | `app/components/UI/CollectibleContractElement/` | 1 | | | ☐ |
| 2 | `app/components/UI/CollectibleContractInformation/` | 1 | | | ☐ |
| 2 | `app/components/UI/CollectibleContractOverview/` | 1 | | | ☐ |
| 2 | `app/components/UI/CollectibleContracts/` | 1 | | | ☐ |
| 2 | `app/components/UI/CollectibleOverview/` | 1 | | | ☐ |
| 2 | `app/components/UI/Collectibles/` | 1 | | | ☐ |
| 2 | `app/components/UI/Confetti/` | 1 | | | ☐ |
| 2 | `app/components/UI/CustomAlert/` | 1 | | | ☐ |
| 2 | `app/components/UI/DrawerView/` | 1 | | | ☐ |
| 2 | `app/components/UI/EditGasFee1559/` | 1 | | | ☐ |
| 2 | `app/components/UI/EditGasFeeLegacy/` | 1 | | | ☐ |
| 2 | `app/components/UI/EthereumAddress/` | 1 | | | ☐ |
| 2 | `app/components/UI/FadeAnimationView/` | 1 | | | ☐ |
| 2 | `app/components/UI/FadeOutOverlay/` | 1 | | | ☐ |
| 2 | `app/components/UI/FoxScreen/` | 1 | | | ☐ |
| 2 | `app/components/UI/GlobalAlert/` | 1 | | | ☐ |
| 2 | `app/components/UI/HintModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/ManageNetworks/` | 1 | | | ☐ |
| 2 | `app/components/UI/Navbar/` | 2 | | | ☐ |
| 2 | `app/components/UI/NavbarBrowserTitle/` | 1 | | | ☐ |
| 2 | `app/components/UI/NavbarTitle/` | 2 | | | ☐ |
| 2 | `app/components/UI/NetworkMainAssetLogo/` | 1 | | | ☐ |
| 2 | `app/components/UI/Notification/` | 5 | | | ☐ |
| 2 | `app/components/UI/OnboardingWizard/` | 1 | | | ☐ |
| 2 | `app/components/UI/OptinMetrics/` | 1 | | | ☐ |
| 2 | `app/components/UI/PaymentRequest/` | 1 | | | ☐ |
| 2 | `app/components/UI/PaymentRequestSuccess/` | 1 | | | ☐ |
| 2 | `app/components/UI/PhishingModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/ProtectYourWalletModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/ReceiveRequest/` | 1 | | | ☐ |
| 2 | `app/components/UI/Screen/` | 1 | | | ☐ |
| 2 | `app/components/UI/SeedphraseModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/SelectComponent/` | 1 | | | ☐ |
| 2 | `app/components/UI/SettingsDrawer/` | 1 | | | ☐ |
| 2 | `app/components/UI/SettingsNotification/` | 1 | | | ☐ |
| 2 | `app/components/UI/SkipAccountSecurityModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/SliderButton/` | 1 | | | ☐ |
| 2 | `app/components/UI/SlippageSlider/` | 1 | | | ☐ |
| 2 | `app/components/UI/StyledButton/` | 3 | | | ☐ |
| 2 | `app/components/UI/Swaps/` (incl. `components/`, `utils/`) | 23 | | | ☐ |
| 2 | `app/components/UI/SwitchCustomNetwork/` | 1 | | | ☐ |
| 2 | `app/components/UI/Tabs/` | 2 | | | ☐ |
| 2 | `app/components/UI/TimeEstimateInfoModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/TokenImage/` | 1 | | | ☐ |
| 2 | `app/components/UI/TransactionActionModal/` | 2 | | | ☐ |
| 2 | `app/components/UI/TransactionElement/` | 4 | | | ☐ |
| 2 | `app/components/UI/TransactionHeader/` | 1 | | | ☐ |
| 2 | `app/components/UI/Transactions/` | 1 | | | ☐ |
| 2 | `app/components/UI/WarningExistingUserModal/` | 1 | | | ☐ |
| 2 | `app/components/UI/WebsiteIcon/` | 1 | | | ☐ |
| 2 | `app/components/UI/WebviewError/` | 1 | | | ☐ |
| 2 | `app/components/UI/WebviewProgressBar/` | 1 | | | ☐ |
| 3 | `app/components/Nav/` | 3 | | | ☐ |
| 3 | `app/components/Views/AccountBackupStep1/` | 1 | | | ☐ |
| 3 | `app/components/Views/AccountBackupStep1B/` | 1 | | | ☐ |
| 3 | `app/components/Views/ActivityView/` | 1 | | | ☐ |
| 3 | `app/components/Views/AddBookmark/` | 1 | | | ☐ |
| 3 | `app/components/Views/AddressQRCode/` | 1 | | | ☐ |
| 3 | `app/components/Views/Asset/` | 2 | | | ☐ |
| 3 | `app/components/Views/Browser/` | 1 | | | ☐ |
| 3 | `app/components/Views/ChoosePassword/` | 1 | | | ☐ |
| 3 | `app/components/Views/Collectible/` | 1 | | | ☐ |
| 3 | `app/components/Views/CollectibleView/` | 1 | | | ☐ |
| 3 | `app/components/Views/EnterPasswordSimple/` | 1 | | | ☐ |
| 3 | `app/components/Views/ErrorBoundary/` | 1 | | | ☐ |
| 3 | `app/components/Views/GasEducationCarousel/` | 1 | | | ☐ |
| 3 | `app/components/Views/ImportFromSecretRecoveryPhrase/` | 1 | | | ☐ |
| 3 | `app/components/Views/ImportPrivateKeySuccess/` | 1 | | | ☐ |
| 3 | `app/components/Views/LockScreen/` | 1 | | | ☐ |
| 3 | `app/components/Views/ManualBackupStep1/` | 1 | | | ☐ |
| 3 | `app/components/Views/ManualBackupStep2/` | 1 | | | ☐ |
| 3 | `app/components/Views/ManualBackupStep3/` | 1 | | | ☐ |
| 3 | `app/components/Views/MediaPlayer/` | 2 | | | ☐ |
| 3 | `app/components/Views/NavigationUnitTest/` | 4 | | | ☐ |
| 3 | `app/components/Views/OfflineMode/` | 1 | | | ☐ |
| 3 | `app/components/Views/Onboarding/` | 1 | | | ☐ |
| 3 | `app/components/Views/OnboardingSuccess/` | 1 | | | ☐ |
| 3 | `app/components/Views/ResetPassword/` | 1 | | | ☐ |
| 3 | `app/components/Views/Settings/` (all subdirs) | 8 | | | ☐ |
| 3 | `app/components/Views/SimpleWebview/` | 1 | | | ☐ |
| 3 | `app/components/Views/TermsAndConditions/` | 1 | | | ☐ |
| 3 | `app/components/Views/TransactionSummary/` | 1 | | | ☐ |
| 3 | `app/components/Views/TransactionsView/` | 1 | | | ☐ |
| 3 | `app/components/Views/WalletConnectSessions/` | 1 | | | ☐ |
| 3 | `app/components/Views/confirmations/` (incl. `legacy/**`) | 37 | | | ☐ |

> **Note on `confirmations/`**: its 37 files live in many nested `legacy/**`
> subfolders and have a lint override restricting global network selectors. It is
> large enough to split among several agents by sub-subsystem (e.g.
> `legacy/SendFlow/*`, `legacy/components/TransactionReview/*`,
> `legacy/components/ApproveTransactionReview/*`) — coordinate so two agents don't
> share a leaf folder.

---

## Step 3 — Per-file conversion rules (shared standard)

Every agent **must** follow this exact procedure for each file in its batch:

1. **Rename** `*.js` → `*.ts` and `*.jsx`/`*.js`-containing-JSX → `*.tsx`.
   - Use `git mv` to preserve history.
   - Platform-specific files keep their suffix: `index.ios.js` → `index.ios.tsx`,
     `index.android.js` → `index.android.tsx`.
2. **Add explicit types** to:
   - Function signatures (params + return types).
   - React component **props** and **state** — create an `interface FooProps` /
     `interface FooState` (co-located, or in a sibling `types.ts` if shared).
   - Exported constants/values (let inference handle obvious literals; type public
     API surfaces explicitly).
   - Redux reducers/actions — type `state`, `action`, and the returned state.
3. **No raw `any`** (ESLint `@typescript-eslint/no-explicit-any` is an error).
   - Prefer `unknown` + narrowing, generics, or precise types.
   - When a precise type genuinely requires a **not-yet-migrated** module, define a
     minimal local type and mark it:
     ```ts
     // TODO(ts-migration): replace with imported type once <module> is migrated
     type FooFromUnmigratedModule = { /* known fields */ };
     ```
     Do **not** silence with `any` or blanket `// eslint-disable`.
4. **Update imports/exports** that reference the renamed file:
   - Extension-less imports (the norm here) resolve automatically under
     `moduleResolution: node` — usually **no consumer edits needed**.
   - Fix any import that hard-codes a `.js` extension, and any change in
     default-vs-named export shape you introduce.
   - These consumer edits are the only permitted edits outside your owned dir;
     keep them mechanical.
5. **Verify locally before PR**:
   - `yarn lint:tsc` — must pass (0 new errors).
   - `yarn lint` (or scope to changed files) — must pass.
   - `yarn test:unit <changed paths>` — run the tests covering your files; convert
     and keep their `.test.js` → `.test.ts(x)` in the same batch.
6. **Stay in your lane**: keep each batch's changes scoped to its owned directory
   (plus mechanical consumer-import fixes) to avoid merge conflicts. One PR per batch.

**Anti-patterns to avoid:** introducing `any`, `@ts-ignore`/`@ts-nocheck` to mute
errors, broadening behavior, editing unrelated files, or converting test files
without converting/maintaining their assertions.

---

## Step 4 — Config & CI considerations

### tsconfig

- **`allowJs: true` is already set** — keep it for the entire migration so mixed
  JS/TS keeps compiling. **Do not** flip to `false` until the very last `.js`/`.jsx`
  in scope is converted (tracked here).
- After all files are converted (final cleanup PR):
  - Set `allowJs: false` (and consider removing now-unneeded JS-only excludes).
  - Optionally tighten further (`checkJs` is moot once no JS remains;
    `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns` are good follow-ups).
  - Keep the `paths` aliases (`images/*`, `@keystonehq/ur-decoder`).

### CI (already enforces per-PR verification — no new pipeline needed)

`.github/workflows/ci.yml` already runs, on every PR, a `scripts` matrix that
includes **`lint`** and **`lint:tsc`**, plus a 10-shard **`unit-tests`** job
(`test:unit`). Bitrise additionally runs `test:unit --silent`. This means **each
parallel batch PR is independently verifiable** by existing CI:

- `yarn lint` — ESLint over `**/*.{js,ts,tsx}`.
- `yarn lint:tsc` — `tsc --noEmit` over the whole project (catches type errors a
  newly-converted file introduces *and* any consumer it breaks).
- `yarn test:unit` — Jest unit tests.
- Detox (`e2e/`) and WDIO (`wdio/`) run separately and are unaffected by these
  source renames; no per-batch E2E run is required, but smoke-check screens touched
  in Tier 3 if feasible.

No CI changes are strictly required. *Optional* hardening once the migration is well
underway: add a guard step that fails if the count of in-scope `.js`/`.jsx` files
increases (prevents regressions / new JS), e.g.

```bash
# fails if any new in-scope JS/JSX is added under app/
test "$(find app \( -name '*.js' -o -name '*.jsx' \) | wc -l)" -le 331
```

### Local setup reminder

```bash
nvm use            # 20.18.0 per .nvmrc
yarn setup:expo    # installs JS deps without native iOS/Android builds
yarn lint:tsc && yarn lint && yarn test:unit <paths>
```

---

## Progress checklist (every file)

All 331 in-scope files, grouped by directory. Tick a box when the file is converted,
typed, lint-clean, and its tests pass. (Counts in headers are per-directory.)

<!-- Generated from `find app \( -name '*.js' -o -name '*.jsx' \)`; keep in sync. -->

##### `app/__mocks__/` (6)
- [ ] `app/__mocks__/pngMock.js`
- [ ] `app/__mocks__/react-native-device-info.js`
- [ ] `app/__mocks__/react-native-splash-screen.js`
- [ ] `app/__mocks__/react-native-view-shot.js`
- [ ] `app/__mocks__/rn-fetch-blob.js`
- [ ] `app/__mocks__/svgMock.js`

##### `app/actions/alert/` (1)
- [ ] `app/actions/alert/index.js`

##### `app/actions/bookmarks/` (1)
- [ ] `app/actions/bookmarks/index.js`

##### `app/actions/browser/` (1)
- [ ] `app/actions/browser/index.js`

##### `app/actions/collectibles/` (1)
- [ ] `app/actions/collectibles/index.js`

##### `app/actions/infuraAvailability/` (1)
- [ ] `app/actions/infuraAvailability/index.js`

##### `app/actions/modals/` (1)
- [ ] `app/actions/modals/index.js`

##### `app/actions/notification/` (1)
- [ ] `app/actions/notification/index.js`

##### `app/actions/privacy/` (1)
- [ ] `app/actions/privacy/index.js`

##### `app/actions/settings/` (1)
- [ ] `app/actions/settings/index.js`

##### `app/actions/transaction/` (1)
- [ ] `app/actions/transaction/index.js`

##### `app/actions/wizard/` (1)
- [ ] `app/actions/wizard/index.js`

##### `app/components/Base/` (4)
- [ ] `app/components/Base/DetailsModal.js`
- [ ] `app/components/Base/RangeInput.js`
- [ ] `app/components/Base/StatusText.js`
- [ ] `app/components/Base/TabBar.js`

##### `app/components/Base/Keypad/` (7)
- [ ] `app/components/Base/Keypad/Keypad.test.js`
- [ ] `app/components/Base/Keypad/components.js`
- [ ] `app/components/Base/Keypad/constants.js`
- [ ] `app/components/Base/Keypad/createKeypadRule.js`
- [ ] `app/components/Base/Keypad/createKeypadRule.test.js`
- [ ] `app/components/Base/Keypad/index.js`
- [ ] `app/components/Base/Keypad/useCurrency.js`

##### `app/components/Base/RemoteImage/` (1)
- [ ] `app/components/Base/RemoteImage/index.js`

##### `app/components/Nav/Main/` (3)
- [ ] `app/components/Nav/Main/MainNavigator.js`
- [ ] `app/components/Nav/Main/RootRPCMethodsUI.js`
- [ ] `app/components/Nav/Main/index.js`

##### `app/components/UI/AccountApproval/` (1)
- [ ] `app/components/UI/AccountApproval/index.js`

##### `app/components/UI/AccountInfoCard/` (1)
- [ ] `app/components/UI/AccountInfoCard/index.js`

##### `app/components/UI/AccountOverview/` (1)
- [ ] `app/components/UI/AccountOverview/index.js`

##### `app/components/UI/ActionModal/` (1)
- [ ] `app/components/UI/ActionModal/index.js`

##### `app/components/UI/ActionModal/ActionContent/` (1)
- [ ] `app/components/UI/ActionModal/ActionContent/index.js`

##### `app/components/UI/ActionView/` (1)
- [ ] `app/components/UI/ActionView/index.js`

##### `app/components/UI/AddCustomToken/` (1)
- [ ] `app/components/UI/AddCustomToken/index.js`

##### `app/components/UI/AddressInputs/` (2)
- [ ] `app/components/UI/AddressInputs/index.js`
- [ ] `app/components/UI/AddressInputs/index.test.jsx`

##### `app/components/UI/AnimatedSpinner/` (1)
- [ ] `app/components/UI/AnimatedSpinner/index.js`

##### `app/components/UI/AnimatedTransactionModal/` (1)
- [ ] `app/components/UI/AnimatedTransactionModal/index.js`

##### `app/components/UI/AssetList/` (1)
- [ ] `app/components/UI/AssetList/index.js`

##### `app/components/UI/BasicFunctionality/` (1)
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionality.test.js`

##### `app/components/UI/BasicFunctionality/BasicFunctionalityModal/` (1)
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js`

##### `app/components/UI/BrowserBottomBar/` (1)
- [ ] `app/components/UI/BrowserBottomBar/index.js`

##### `app/components/UI/Button/` (1)
- [ ] `app/components/UI/Button/index.js`

##### `app/components/UI/CollectibleContractElement/` (1)
- [ ] `app/components/UI/CollectibleContractElement/index.js`

##### `app/components/UI/CollectibleContractInformation/` (1)
- [ ] `app/components/UI/CollectibleContractInformation/index.js`

##### `app/components/UI/CollectibleContractOverview/` (1)
- [ ] `app/components/UI/CollectibleContractOverview/index.js`

##### `app/components/UI/CollectibleContracts/` (1)
- [ ] `app/components/UI/CollectibleContracts/index.js`

##### `app/components/UI/CollectibleOverview/` (1)
- [ ] `app/components/UI/CollectibleOverview/index.js`

##### `app/components/UI/Collectibles/` (1)
- [ ] `app/components/UI/Collectibles/index.js`

##### `app/components/UI/Confetti/` (1)
- [ ] `app/components/UI/Confetti/index.js`

##### `app/components/UI/CustomAlert/` (1)
- [ ] `app/components/UI/CustomAlert/index.js`

##### `app/components/UI/DrawerView/` (1)
- [ ] `app/components/UI/DrawerView/index.js`

##### `app/components/UI/EditGasFee1559/` (1)
- [ ] `app/components/UI/EditGasFee1559/index.js`

##### `app/components/UI/EditGasFeeLegacy/` (1)
- [ ] `app/components/UI/EditGasFeeLegacy/index.js`

##### `app/components/UI/EthereumAddress/` (1)
- [ ] `app/components/UI/EthereumAddress/index.js`

##### `app/components/UI/FadeAnimationView/` (1)
- [ ] `app/components/UI/FadeAnimationView/index.js`

##### `app/components/UI/FadeOutOverlay/` (1)
- [ ] `app/components/UI/FadeOutOverlay/index.js`

##### `app/components/UI/FoxScreen/` (1)
- [ ] `app/components/UI/FoxScreen/index.js`

##### `app/components/UI/GlobalAlert/` (1)
- [ ] `app/components/UI/GlobalAlert/index.js`

##### `app/components/UI/HintModal/` (1)
- [ ] `app/components/UI/HintModal/index.js`

##### `app/components/UI/ManageNetworks/` (1)
- [ ] `app/components/UI/ManageNetworks/ManageNetworks.test.js`

##### `app/components/UI/Navbar/` (2)
- [ ] `app/components/UI/Navbar/index.js`
- [ ] `app/components/UI/Navbar/index.test.jsx`

##### `app/components/UI/NavbarBrowserTitle/` (1)
- [ ] `app/components/UI/NavbarBrowserTitle/index.js`

##### `app/components/UI/NavbarTitle/` (2)
- [ ] `app/components/UI/NavbarTitle/index.js`
- [ ] `app/components/UI/NavbarTitle/index.test.js`

##### `app/components/UI/NetworkMainAssetLogo/` (1)
- [ ] `app/components/UI/NetworkMainAssetLogo/index.js`

##### `app/components/UI/Notification/` (1)
- [ ] `app/components/UI/Notification/index.js`

##### `app/components/UI/Notification/BaseNotification/` (2)
- [ ] `app/components/UI/Notification/BaseNotification/index.js`
- [ ] `app/components/UI/Notification/BaseNotification/index.test.jsx`

##### `app/components/UI/Notification/SimpleNotification/` (1)
- [ ] `app/components/UI/Notification/SimpleNotification/index.js`

##### `app/components/UI/Notification/TransactionNotification/` (1)
- [ ] `app/components/UI/Notification/TransactionNotification/index.js`

##### `app/components/UI/OnboardingWizard/Coachmark/` (1)
- [ ] `app/components/UI/OnboardingWizard/Coachmark/index.js`

##### `app/components/UI/OptinMetrics/` (1)
- [ ] `app/components/UI/OptinMetrics/index.js`

##### `app/components/UI/PaymentRequest/` (1)
- [ ] `app/components/UI/PaymentRequest/index.js`

##### `app/components/UI/PaymentRequestSuccess/` (1)
- [ ] `app/components/UI/PaymentRequestSuccess/index.js`

##### `app/components/UI/PhishingModal/` (1)
- [ ] `app/components/UI/PhishingModal/index.js`

##### `app/components/UI/ProtectYourWalletModal/` (1)
- [ ] `app/components/UI/ProtectYourWalletModal/index.js`

##### `app/components/UI/ReceiveRequest/` (1)
- [ ] `app/components/UI/ReceiveRequest/index.js`

##### `app/components/UI/Screen/` (1)
- [ ] `app/components/UI/Screen/index.js`

##### `app/components/UI/SeedphraseModal/` (1)
- [ ] `app/components/UI/SeedphraseModal/index.js`

##### `app/components/UI/SelectComponent/` (1)
- [ ] `app/components/UI/SelectComponent/index.js`

##### `app/components/UI/SettingsDrawer/` (1)
- [ ] `app/components/UI/SettingsDrawer/index.js`

##### `app/components/UI/SettingsNotification/` (1)
- [ ] `app/components/UI/SettingsNotification/index.js`

##### `app/components/UI/SkipAccountSecurityModal/` (1)
- [ ] `app/components/UI/SkipAccountSecurityModal/index.js`

##### `app/components/UI/SliderButton/` (1)
- [ ] `app/components/UI/SliderButton/index.js`

##### `app/components/UI/SlippageSlider/` (1)
- [ ] `app/components/UI/SlippageSlider/index.js`

##### `app/components/UI/StyledButton/` (3)
- [ ] `app/components/UI/StyledButton/index.android.js`
- [ ] `app/components/UI/StyledButton/index.ios.js`
- [ ] `app/components/UI/StyledButton/index.js`

##### `app/components/UI/Swaps/` (2)
- [ ] `app/components/UI/Swaps/QuotesView.js`
- [ ] `app/components/UI/Swaps/index.js`

##### `app/components/UI/Swaps/components/` (14)
- [ ] `app/components/UI/Swaps/components/ActionAlert.js`
- [ ] `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js`
- [ ] `app/components/UI/Swaps/components/AssetSwapButton.js`
- [ ] `app/components/UI/Swaps/components/GasEditModal.js`
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

##### `app/components/UI/Swaps/components/LoadingAnimation/` (2)
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js`
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/index.js`

##### `app/components/UI/Swaps/utils/` (5)
- [ ] `app/components/UI/Swaps/utils/index.js`
- [ ] `app/components/UI/Swaps/utils/index.test.js`
- [ ] `app/components/UI/Swaps/utils/useBalance.js`
- [ ] `app/components/UI/Swaps/utils/useBlockExplorer.js`
- [ ] `app/components/UI/Swaps/utils/useFetchTokenMetadata.js`

##### `app/components/UI/SwitchCustomNetwork/` (1)
- [ ] `app/components/UI/SwitchCustomNetwork/index.js`

##### `app/components/UI/Tabs/` (1)
- [ ] `app/components/UI/Tabs/index.js`

##### `app/components/UI/Tabs/TabCountIcon/` (1)
- [ ] `app/components/UI/Tabs/TabCountIcon/index.js`

##### `app/components/UI/TimeEstimateInfoModal/` (1)
- [ ] `app/components/UI/TimeEstimateInfoModal/index.js`

##### `app/components/UI/TokenImage/` (1)
- [ ] `app/components/UI/TokenImage/index.js`

##### `app/components/UI/TransactionActionModal/` (1)
- [ ] `app/components/UI/TransactionActionModal/index.js`

##### `app/components/UI/TransactionActionModal/TransactionActionContent/` (1)
- [ ] `app/components/UI/TransactionActionModal/TransactionActionContent/index.js`

##### `app/components/UI/TransactionElement/` (3)
- [ ] `app/components/UI/TransactionElement/index.js`
- [ ] `app/components/UI/TransactionElement/utils.js`
- [ ] `app/components/UI/TransactionElement/utils.test.js`

##### `app/components/UI/TransactionElement/TransactionDetails/` (1)
- [ ] `app/components/UI/TransactionElement/TransactionDetails/index.js`

##### `app/components/UI/TransactionHeader/` (1)
- [ ] `app/components/UI/TransactionHeader/index.js`

##### `app/components/UI/Transactions/` (1)
- [ ] `app/components/UI/Transactions/index.js`

##### `app/components/UI/WarningExistingUserModal/` (1)
- [ ] `app/components/UI/WarningExistingUserModal/index.js`

##### `app/components/UI/WebsiteIcon/` (1)
- [ ] `app/components/UI/WebsiteIcon/index.js`

##### `app/components/UI/WebviewError/` (1)
- [ ] `app/components/UI/WebviewError/index.js`

##### `app/components/UI/WebviewProgressBar/` (1)
- [ ] `app/components/UI/WebviewProgressBar/index.js`

##### `app/components/Views/AccountBackupStep1/` (1)
- [ ] `app/components/Views/AccountBackupStep1/index.js`

##### `app/components/Views/AccountBackupStep1B/` (1)
- [ ] `app/components/Views/AccountBackupStep1B/index.js`

##### `app/components/Views/ActivityView/` (1)
- [ ] `app/components/Views/ActivityView/index.js`

##### `app/components/Views/AddBookmark/` (1)
- [ ] `app/components/Views/AddBookmark/index.js`

##### `app/components/Views/AddressQRCode/` (1)
- [ ] `app/components/Views/AddressQRCode/index.js`

##### `app/components/Views/Asset/` (2)
- [ ] `app/components/Views/Asset/index.js`
- [ ] `app/components/Views/Asset/index.test.js`

##### `app/components/Views/Browser/` (1)
- [ ] `app/components/Views/Browser/index.js`

##### `app/components/Views/ChoosePassword/` (1)
- [ ] `app/components/Views/ChoosePassword/index.js`

##### `app/components/Views/Collectible/` (1)
- [ ] `app/components/Views/Collectible/index.js`

##### `app/components/Views/CollectibleView/` (1)
- [ ] `app/components/Views/CollectibleView/index.js`

##### `app/components/Views/EnterPasswordSimple/` (1)
- [ ] `app/components/Views/EnterPasswordSimple/index.js`

##### `app/components/Views/ErrorBoundary/` (1)
- [ ] `app/components/Views/ErrorBoundary/index.js`

##### `app/components/Views/GasEducationCarousel/` (1)
- [ ] `app/components/Views/GasEducationCarousel/index.js`

##### `app/components/Views/ImportFromSecretRecoveryPhrase/` (1)
- [ ] `app/components/Views/ImportFromSecretRecoveryPhrase/index.js`

##### `app/components/Views/ImportPrivateKeySuccess/` (1)
- [ ] `app/components/Views/ImportPrivateKeySuccess/index.js`

##### `app/components/Views/LockScreen/` (1)
- [ ] `app/components/Views/LockScreen/index.js`

##### `app/components/Views/ManualBackupStep1/` (1)
- [ ] `app/components/Views/ManualBackupStep1/index.js`

##### `app/components/Views/ManualBackupStep2/` (1)
- [ ] `app/components/Views/ManualBackupStep2/index.js`

##### `app/components/Views/ManualBackupStep3/` (1)
- [ ] `app/components/Views/ManualBackupStep3/index.js`

##### `app/components/Views/MediaPlayer/` (2)
- [ ] `app/components/Views/MediaPlayer/AndroidMediaPlayer.js`
- [ ] `app/components/Views/MediaPlayer/index.js`

##### `app/components/Views/NavigationUnitTest/` (4)
- [ ] `app/components/Views/NavigationUnitTest/TestScreen1.test.js`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen2.test.js`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen3.test.js`
- [ ] `app/components/Views/NavigationUnitTest/index.js`

##### `app/components/Views/OfflineMode/` (1)
- [ ] `app/components/Views/OfflineMode/index.js`

##### `app/components/Views/Onboarding/` (1)
- [ ] `app/components/Views/Onboarding/index.js`

##### `app/components/Views/OnboardingSuccess/` (1)
- [ ] `app/components/Views/OnboardingSuccess/index.test.js`

##### `app/components/Views/ResetPassword/` (1)
- [ ] `app/components/Views/ResetPassword/index.js`

##### `app/components/Views/Settings/AdvancedSettings/` (1)
- [ ] `app/components/Views/Settings/AdvancedSettings/index.js`

##### `app/components/Views/Settings/AppInformation/` (1)
- [ ] `app/components/Views/Settings/AppInformation/index.js`

##### `app/components/Views/Settings/Contacts/` (1)
- [ ] `app/components/Views/Settings/Contacts/index.js`

##### `app/components/Views/Settings/Contacts/ContactForm/` (1)
- [ ] `app/components/Views/Settings/Contacts/ContactForm/index.js`

##### `app/components/Views/Settings/GeneralSettings/` (1)
- [ ] `app/components/Views/Settings/GeneralSettings/index.js`

##### `app/components/Views/Settings/NetworksSettings/` (1)
- [ ] `app/components/Views/Settings/NetworksSettings/index.js`

##### `app/components/Views/Settings/NetworksSettings/NetworkSettings/` (2)
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js`
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js`

##### `app/components/Views/SimpleWebview/` (1)
- [ ] `app/components/Views/SimpleWebview/index.js`

##### `app/components/Views/TermsAndConditions/` (1)
- [ ] `app/components/Views/TermsAndConditions/index.js`

##### `app/components/Views/TransactionSummary/` (1)
- [ ] `app/components/Views/TransactionSummary/index.js`

##### `app/components/Views/TransactionsView/` (1)
- [ ] `app/components/Views/TransactionsView/index.js`

##### `app/components/Views/WalletConnectSessions/` (1)
- [ ] `app/components/Views/WalletConnectSessions/index.js`

##### `app/components/Views/confirmations/` (1)
- [ ] `app/components/Views/confirmations/mock-data.js`

##### `app/components/Views/confirmations/legacy/Approval/` (1)
- [ ] `app/components/Views/confirmations/legacy/Approval/index.js`

##### `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/` (1)
- [ ] `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js`

##### `app/components/Views/confirmations/legacy/Approve/` (1)
- [ ] `app/components/Views/confirmations/legacy/Approve/index.js`

##### `app/components/Views/confirmations/legacy/ApproveView/Approve/` (1)
- [ ] `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js`

##### `app/components/Views/confirmations/legacy/Send/` (1)
- [ ] `app/components/Views/confirmations/legacy/Send/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/AddressList/` (2)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/Amount/` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/Confirm/` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/` (2)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/SendTo/` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js`

##### `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js`

##### `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js`

##### `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/` (2)
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx`

##### `app/components/Views/confirmations/legacy/components/CustomNonce/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/CustomNonce/index.js`

##### `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx`

##### `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx`

##### `app/components/Views/confirmations/legacy/components/SignatureRequest/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js`

##### `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/` (2)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/` (2)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/` (3)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js`

##### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js`

##### `app/components/Views/confirmations/legacy/components/TypedSign/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/TypedSign/index.js`

##### `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx`

##### `app/components/Views/confirmations/legacy/components/WatchAssetRequest/` (1)
- [ ] `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js`

##### `app/constants/` (3)
- [ ] `app/constants/navigation.js`
- [ ] `app/constants/network.js`
- [ ] `app/constants/onboarding.js`

##### `app/core/` (9)
- [ ] `app/core/ClipboardManager.js`
- [ ] `app/core/DrawerStatusTracker.js`
- [ ] `app/core/EntryScriptWeb3.js`
- [ ] `app/core/MobilePortStream.js`
- [ ] `app/core/NotificationManager.js`
- [ ] `app/core/PreventScreenshot.js`
- [ ] `app/core/SecureKeychain.js`
- [ ] `app/core/TransactionTypes.js`
- [ ] `app/core/Vault.js`

##### `app/core/BackgroundBridge/` (2)
- [ ] `app/core/BackgroundBridge/BackgroundBridge.js`
- [ ] `app/core/BackgroundBridge/BackgroundBridge.test.js`

##### `app/core/Permissions/` (2)
- [ ] `app/core/Permissions/specifications.js`
- [ ] `app/core/Permissions/specifications.test.js`

##### `app/core/RPCMethods/` (6)
- [ ] `app/core/RPCMethods/eth-request-accounts.js`
- [ ] `app/core/RPCMethods/index.js`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.js`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.test.js`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.js`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.test.js`

##### `app/core/RPCMethods/createEip1193MethodMiddleware/` (2)
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.js`
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`

##### `app/core/RPCMethods/handlers/` (1)
- [ ] `app/core/RPCMethods/handlers/index.js`

##### `app/core/RPCMethods/lib/` (1)
- [ ] `app/core/RPCMethods/lib/ethereum-chain-utils.js`

##### `app/core/WalletConnect/` (1)
- [ ] `app/core/WalletConnect/WalletConnect.js`

##### `app/images/` (1)
- [ ] `app/images/image-icons.js`

##### `app/lib/ens-ipfs/` (1)
- [ ] `app/lib/ens-ipfs/resolver.js`

##### `app/lib/ens-ipfs/contracts/` (2)
- [ ] `app/lib/ens-ipfs/contracts/registry.js`
- [ ] `app/lib/ens-ipfs/contracts/resolver.js`

##### `app/lib/ppom/` (1)
- [ ] `app/lib/ppom/blockaid-version.js`

##### `app/reducers/alert/` (1)
- [ ] `app/reducers/alert/index.js`

##### `app/reducers/bookmarks/` (1)
- [ ] `app/reducers/bookmarks/index.js`

##### `app/reducers/browser/` (2)
- [ ] `app/reducers/browser/index.js`
- [ ] `app/reducers/browser/index.test.js`

##### `app/reducers/collectibles/` (1)
- [ ] `app/reducers/collectibles/index.js`

##### `app/reducers/infuraAvailability/` (1)
- [ ] `app/reducers/infuraAvailability/index.js`

##### `app/reducers/modals/` (1)
- [ ] `app/reducers/modals/index.js`

##### `app/reducers/notification/` (2)
- [ ] `app/reducers/notification/index.js`
- [ ] `app/reducers/notification/notification.test.js`

##### `app/reducers/privacy/` (1)
- [ ] `app/reducers/privacy/index.js`

##### `app/reducers/settings/` (1)
- [ ] `app/reducers/settings/index.js`

##### `app/reducers/swaps/` (1)
- [ ] `app/reducers/swaps/index.js`

##### `app/reducers/transaction/` (1)
- [ ] `app/reducers/transaction/index.js`

##### `app/reducers/wizard/` (1)
- [ ] `app/reducers/wizard/index.js`

##### `app/store/migrations/` (38)
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

##### `app/util/` (13)
- [ ] `app/util/ENSUtils.js`
- [ ] `app/util/blockies.js`
- [ ] `app/util/confirm-tx.js`
- [ ] `app/util/conversions.js`
- [ ] `app/util/conversions.test.js`
- [ ] `app/util/dapp-url-list.js`
- [ ] `app/util/etherscan.js`
- [ ] `app/util/gasUtils.js`
- [ ] `app/util/middlewares.js`
- [ ] `app/util/payment-link-generator.js`
- [ ] `app/util/scaling.js`
- [ ] `app/util/streams.js`
- [ ] `app/util/walletconnect.js`

##### `app/util/confirmation/` (1)
- [ ] `app/util/confirmation/signatureUtils.js`

##### `app/util/confusables/` (1)
- [ ] `app/util/confusables/index.js`

##### `app/util/conversion/` (1)
- [ ] `app/util/conversion/index.js`

##### `app/util/custom-gas/` (1)
- [ ] `app/util/custom-gas/index.js`

##### `app/util/date/` (1)
- [ ] `app/util/date/index.js`

##### `app/util/device/` (1)
- [ ] `app/util/device/index.js`

##### `app/util/general/` (1)
- [ ] `app/util/general/index.js`

##### `app/util/networks/` (1)
- [ ] `app/util/networks/index.js`

##### `app/util/number/` (1)
- [ ] `app/util/number/index.js`

##### `app/util/sentry/` (1)
- [ ] `app/util/sentry/utils.js`

##### `app/util/test/` (8)
- [ ] `app/util/test/assetFileTransformer.js`
- [ ] `app/util/test/contract-address-registry.js`
- [ ] `app/util/test/ganache-seeder.js`
- [ ] `app/util/test/ganache.js`
- [ ] `app/util/test/network-store.js`
- [ ] `app/util/test/smart-contracts.js`
- [ ] `app/util/test/testSetup.js`
- [ ] `app/util/test/utils.js`

##### `app/util/transactions/` (1)
- [ ] `app/util/transactions/index.js`

<!-- TOTAL: 331 -->
