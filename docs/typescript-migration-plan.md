# JavaScript → TypeScript Migration Plan

Status tracker and phased plan for converting the remaining JavaScript in `app/`
to TypeScript. Update the tracking tables in this document in every migration PR.

## 1. Current state (baseline, `main`)

| Metric | Count |
|---|---|
| `.ts` / `.tsx` files in `app/` | ~3,930 |
| `.js` / `.jsx` files in `app/` (total) | 331 |
| of which `.test.js` | 34 |
| of which non-test source | ~297 |

Non-test `.js` files by top-level directory:

| Directory | Files | Notes |
|---|---|---|
| `app/components/` | 170 | `UI/` 92, `Views/` 65, `Base/` 10, `Nav/` 3 |
| `app/util/` | 31 | 23 utilities + 8 test helpers in `app/util/test/` |
| `app/store/migrations/` | 28 | `000.js` – `027.js` (028+ already TS) |
| `app/core/` | 19 | services, singletons, RPC methods, permissions |
| `app/reducers/` | 12 | |
| `app/actions/` | 11 | |
| `app/__mocks__/` | 6 | jest module mocks |
| `app/lib/` | 4 | `ens-ipfs/`, `ppom/blockaid-version.js` |
| `app/constants/` | 3 | `navigation.js`, `network.js`, `onboarding.js` |
| `app/images/` | 1 | `image-icons.js` |

JS outside `app/` (`e2e/` 356, `wdio/` 124, `scripts/`, `ppom/`, `.storybook/`,
`locales/`, root config files) is **out of scope** for this plan. `e2e/` and `wdio/`
can be migrated in a separate effort once `app/` is complete.

### Tooling already in place

| Concern | State |
|---|---|
| `tsconfig.json` | `strict: true`, `allowJs: true`, `checkJs` off, `noEmit`, `isolatedModules`, `jsx: react-native`, `skipLibCheck`. Includes `app/**/*` and `e2e/**/*`. |
| Type-check script | `yarn lint:tsc` (`tsc --project ./tsconfig.json`; `noEmit` comes from tsconfig). Runs in CI (`.github/workflows/ci.yml`, `scripts` matrix job). |
| Babel | `babel-preset-expo` — includes `@babel/preset-typescript`; `.ts`/`.tsx` already transpile for Metro and Jest. No change needed. |
| ESLint | `@typescript-eslint/parser` + `@typescript-eslint` plugin; `*.{ts,tsx}` override extends `@metamask/eslint-config-typescript` with `no-explicit-any: error`. `*.js` uses `@babel/eslint-parser`. `yarn lint` covers `**/*.{js,ts,tsx}`. |
| Jest | `babel-jest` transform for `^.+\.[jt]sx?$`; coverage collected from `{js,ts,tsx,jsx}`. No change needed. |
| Pre-commit | `husky` + `lint-staged` (eslint on staged files). |

Conclusion: **no build/tooling changes are required to begin**. Because every new
`.ts` file is immediately checked under `strict: true`, migration is purely
rename → type → validate.

Known baseline: `yarn lint:tsc` on `main` currently reports 55 pre-existing
errors in already-TS files (unrelated to this migration). Migration PRs must not
increase that count; fixing the baseline is tracked separately.

## 2. Guiding principles

1. **No behaviour changes.** Only add types. Do not refactor logic, convert
   `connect()` HOCs to hooks, or change exports.
2. **Snapshot parity.** Snapshot tests must produce identical output after a
   component migration; a changed snapshot means something broke.
3. **Preserve build preprocessor directives**
   (`///: BEGIN:ONLY_INCLUDE_IF(...)` / `///: END:ONLY_INCLUDE_IF`) verbatim.
4. **No `any`.** `@typescript-eslint/no-explicit-any` is an error. Use `unknown`
   with narrowing, or precise types from the owning package
   (`@metamask/utils`, `@metamask/transaction-controller`, etc.).
5. **Follow migrated neighbours.** Every directory has already-migrated TS files;
   copy their conventions (see the reference notes below).
6. **Rename tests with the source.** `.test.js` → `.test.ts`/`.test.tsx` in the
   same PR when a source file is migrated. Prefer `jest.mocked()` over casts.
7. **Small PRs.** 5–15 files per PR, grouped by directory / phase, so review
   stays tractable and rollbacks are cheap.

### Per-file checklist

```
[ ] git mv foo.js foo.ts   (or .tsx if it contains JSX)
[ ] add parameter + return types to every exported symbol
[ ] replace PropTypes with a Props interface; remove `prop-types` import
[ ] type refs, StyleSheet, navigation props, mapStateToProps(RootState)
[ ] rename and fix the co-located .test.js
[ ] yarn lint:tsc                       -> no new errors vs. main
[ ] yarn jest --findRelatedTests <file> -> passes, snapshots unchanged
[ ] yarn eslint <file>                  -> passes
[ ] update tracking table below
```

## 3. Phases

Ordering is driven by the import graph: leaves first so that every later
migration finds typed dependencies.

| Phase | Scope | Files | Depends on | Device / external QA |
|---|---|---|---|---|
| **1** | Utilities (`app/util/`) | 23 (+8 test helpers) | — | No |
| **1** | Constants, lib, images, mocks (`app/constants/`, `app/lib/`, `app/images/`, `app/__mocks__/`) | 14 | — | No |
| **2** | Redux actions (`app/actions/`) | 11 | — | No |
| **3** | Redux reducers (`app/reducers/`) | 12 | Phase 2 | No |
| **3** | Store migrations (`app/store/migrations/000–027`) | 28 (+9 tests) | — | No |
| **4** | Core services & singletons (`app/core/*.js`, `BackgroundBridge`, `WalletConnect`) | 11 | Phases 1–3 | **Yes** — biometrics, push, Ledger, dApp connectivity |
| **4** | RPC methods & permissions (`app/core/RPCMethods/`, `app/core/Permissions/`) | 8 | Phase 1 | Build-preprocessor check |
| **5** | Simple presentational components (`app/components/Base/`, simple `UI/`) | ~30 | Phases 1–4 | No (snapshots) |
| **6** | Complex / connected UI components (`app/components/UI/`, `Nav/`) | ~65 | Phase 5 | Partial — swaps, payment requests, notifications |
| **7** | Views & legacy confirmations (`app/components/Views/`) | ~65 | Phase 6 | **Yes** — browser, onboarding, send flow, Ledger |
| **8** | Tighten config (see §5) | — | Phases 1–7 | No |

Batches within a phase are independent and can run in parallel.

## 4. Inventory & tracking

Legend: `[ ]` remaining · `[x]` converted (add batch / PR).

### Phase 1 — Utilities

| Status | File | Target | Notes |
|---|---|---|---|
| [x] | `app/util/date/index.js` | `.ts` | Batch 1 |
| [x] | `app/util/scaling.js` | `.ts` | Batch 1 |
| [x] | `app/util/confusables/index.js` | `.ts` | Batch 1 (added `unicode-confusables` declaration) |
| [x] | `app/util/etherscan.js` | `.ts` | Batch 1 |
| [x] | `app/util/payment-link-generator.js` | `.ts` | Batch 1 |
| [x] | `app/util/device/index.js` | `.ts` | Batch 1 |
| [x] | `app/util/general/index.js` | `.ts` | Batch 1 |
| [x] | `app/util/dapp-url-list.js` | `.ts` | Batch 1 |
| [ ] | `app/util/streams.js` | `.ts` | |
| [ ] | `app/util/middlewares.js` | `.ts` | |
| [ ] | `app/util/ENSUtils.js` | `.ts` | |
| [ ] | `app/util/blockies.js` | `.ts` | |
| [ ] | `app/util/confirm-tx.js` | `.ts` | |
| [ ] | `app/util/conversions.js` | `.ts` | BN.js types; rename `conversions.test.js` |
| [ ] | `app/util/gasUtils.js` | `.ts` | BN.js types |
| [ ] | `app/util/walletconnect.js` | `.ts` | |
| [ ] | `app/util/conversion/index.js` | `.ts` | |
| [ ] | `app/util/custom-gas/index.js` | `.ts` | |
| [ ] | `app/util/number/index.js` | `.ts` | large; many callers |
| [ ] | `app/util/networks/index.js` | `.ts` | large; many callers |
| [ ] | `app/util/transactions/index.js` | `.ts` | large; many callers |
| [ ] | `app/util/sentry/utils.js` | `.ts` | |
| [ ] | `app/util/confirmation/signatureUtils.js` | `.ts` | |
| [ ] | `app/util/test/*.js` (8 files) | `.ts` | `testSetup.js` is referenced from `jest.config.js` — update path when renamed |

Reference: `app/util/string/index.ts`, `app/util/mnemonic/index.ts`, `app/util/date/index.test.ts`.

### Phase 1 — Constants, lib, images, mocks

| Status | File | Target |
|---|---|---|
| [ ] | `app/constants/navigation.js` | `.ts` (`as const`) |
| [ ] | `app/constants/network.js` | `.ts` (`as const`) |
| [ ] | `app/constants/onboarding.js` | `.ts` |
| [ ] | `app/lib/ens-ipfs/contracts/registry.js` | `.ts` |
| [ ] | `app/lib/ens-ipfs/contracts/resolver.js` | `.ts` |
| [ ] | `app/lib/ens-ipfs/resolver.js` | `.ts` |
| [ ] | `app/lib/ppom/blockaid-version.js` | `.ts` |
| [ ] | `app/images/image-icons.js` | `.ts` |
| [ ] | `app/__mocks__/*.js` (6 files) | `.ts` |

Reference: `app/constants/urls.ts`, `app/constants/bridge.ts`.

### Phase 2 — Redux actions (11)

`alert`, `bookmarks`, `browser`, `collectibles`, `infuraAvailability`, `modals`,
`notification`, `privacy`, `settings`, `transaction`, `wizard` — all
`app/actions/<name>/index.js` → `.ts`. Define action-type constants with
`as const`, a discriminated `Action` union, and export it for the reducer.
Reference: `app/actions/onboarding/index.ts`.

### Phase 3 — Redux reducers (12)

`alert`, `bookmarks`, `browser`, `collectibles`, `infuraAvailability`, `modals`,
`notification`, `privacy`, `settings`, `swaps`, `transaction`, `wizard` —
`app/reducers/<name>/index.js` → `.ts`. Export a `State` interface, consume the
`Action` union from Phase 2, verify `RootState` still compiles.
Reference: `app/reducers/security/index.ts`.

### Phase 3 — Store migrations (28 + 9 tests)

`app/store/migrations/000.js`–`027.js` → `.ts` with signature
`export default function migrate(state: unknown)`; narrow with `isObject` /
`hasProperty` from `@metamask/utils`. Rename `019.test.js`–`027.test.js`.
Reference: `app/store/migrations/028.ts`.

### Phase 4 — Core services (11) and RPC/permissions (8)

Core (ordered simplest → hardest): `TransactionTypes`, `DrawerStatusTracker`,
`ClipboardManager`, `PreventScreenshot` (needs `.d.ts` for the native module),
`MobilePortStream`, `EntryScriptWeb3`, `SecureKeychain`, `Vault`,
`NotificationManager`, `BackgroundBridge/BackgroundBridge`,
`WalletConnect/WalletConnect`.

RPC: `RPCMethods/index`, `eth-request-accounts`, `wallet_addEthereumChain`,
`wallet_switchEthereumChain`, `handlers/index`, `lib/ethereum-chain-utils`,
`createEip1193MethodMiddleware/index`, `Permissions/specifications`. Use
`JsonRpcRequest` / `PendingJsonRpcResponse` from `@metamask/utils`; keep
`ONLY_INCLUDE_IF` directives intact.

Reference: `app/core/Authentication/Authentication.ts`,
`app/core/RPCMethods/RPCMethodMiddleware.ts`.

### Phases 5–7 — Components (~170)

Generate the current list with:

```bash
find app/components -name '*.js' -not -name '*.test.js' | sort
```

Split: `Base/` and stateless `UI/` first (Phase 5), Redux-connected `UI/` and
`Nav/` next (Phase 6), `Views/` and `Views/confirmations/legacy/` last (Phase 7).
PropTypes → `Props` interface mapping:

| PropTypes | TypeScript |
|---|---|
| `string` / `number` / `bool` | `string` / `number` / `boolean` |
| `func` | explicit signature, e.g. `(id: string) => void` |
| `node` / `element` | `React.ReactNode` / `React.ReactElement` |
| `arrayOf(x)` | `X[]` |
| `shape({...})` | named interface |
| `.isRequired` | non-optional; otherwise `?` |

For `connect()` components define `OwnProps`, `StateProps`, `DispatchProps`,
type `mapStateToProps = (state: RootState): StateProps`.
Reference: `app/components/UI/Tokens/index.tsx`, `app/components/Views/Wallet/index.tsx`.

## 5. Phase 8 — Final strictness target

`strict: true` is already on for TS files. Once no `.js` remains in `app/`:

1. Remove `allowJs` from `tsconfig.json` (or set `false`) so a stray `.js` in
   `app/` fails `lint:tsc`.
2. Narrow `include` to `app/**/*` + declarations (drop `e2e/**/*` if it is still
   JS, or migrate `e2e/` separately).
3. Enable additional checks one at a time, fixing fallout per PR:
   `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`,
   `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
4. Change `yarn lint` glob to `'**/*.{ts,tsx}'` for `app/` and remove the
   `@babel/eslint-parser` override once no JS remains.
5. Add a CI guard that fails if `find app -name '*.js' -o -name '*.jsx'` returns
   anything, to prevent regressions.

## 6. Verification & CI gating

Already enforced on every PR by `.github/workflows/ci.yml`:

- `yarn lint:tsc` — full type-check (`strict`)
- `yarn lint` — ESLint over `**/*.{js,ts,tsx}`
- unit tests (Jest, babel-jest handles TS)

Per migration PR, additionally run locally:

```bash
yarn lint:tsc
yarn jest --findRelatedTests <each migrated file>
yarn eslint <each migrated file>
```

## 7. Effort estimate

Roughly one focused session per batch of 10–15 leaf-module files, and one
session per 5–8 connected components/views. Phases 4, 6 and 7 additionally
require device QA (biometrics, push notifications, Ledger, dApp browser) before
merge, which is the main external wait.
