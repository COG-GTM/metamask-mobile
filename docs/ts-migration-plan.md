# JavaScript → TypeScript Migration Plan

Status: Phase 0 complete. Phases 1–3 are open for parallel execution.

Related documents:

- [`ts-migration-conventions.md`](./ts-migration-conventions.md) — how to convert a file (PropTypes, Redux, RN components, preprocessor comments, escape hatches).
- [`ts-migration-tracker.md`](./ts-migration-tracker.md) — the slice/ownership checklist. Claim a slice there before touching it.
- `scripts/ts-migration/remaining-js.sh` — prints the remaining `.js`/`.jsx` files under `app/` (optionally filtered by path).

## 1. Scope

**In scope:** every `.js`/`.jsx` file under `app/` plus the two top-level entry files `index.js` and `shim.js`.

**Out of scope (do not touch):**

- `android/`, `ios/` — native code.
- `patches/`, `node_modules/`, `ppom/` — vendored or generated.
- `app/lib/ppom/blockaid-version.js` — minified generated bundle.
- `app/util/test/assetFileTransformer.js` — Jest `transform` entry that Node loads directly (not babel-transformed).
- Node-loaded tool configs: `babel.config.js`, `babel.config.tests.js`, `metro.config.js`, `metro.transform.js`, `jest.config.js`, `react-native.config.js`, `app.config.js`, `.eslintrc.js`, `.prettierrc.js`, `.detoxrc.js`, `wdio.conf.js`.
- `e2e/` (356 JS files), `wdio/` (124), `.storybook/`, `scripts/`, `.github/` (mostly vendored action bundles). These are test harnesses/tooling and would be a separate effort.

## 2. Inventory (measured on `main` at Phase 0)

| Location              | `.js`/`.jsx` files                       | Notes                                                                    |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `app/**`              | **331** (329 in scope, 2 excluded above) | vs. 3,931 `.ts`/`.tsx` → `app/` is already ~92% TypeScript by file count |
| of which test files   | 48                                       | migrated in the same PR as their source                                  |
| Total in-scope LOC    | ~85,750                                  |                                                                          |
| `index.js`, `shim.js` | 2                                        | entry points, migrated last                                              |

Distribution of the 329 in-scope files:

| Area                                              | Files | LOC     | Character                                                                                           |
| ------------------------------------------------- | ----- | ------- | --------------------------------------------------------------------------------------------------- |
| `app/components/UI/**`                            | 103   | ~35,000 | Mostly `connect()`ed class/function components with `PropTypes`; Swaps alone is 23 files / 7.9k LOC |
| `app/components/Views/**`                         | 80    | ~28,000 | Screens; 37 files are `Views/confirmations/legacy/**` (17k LOC)                                     |
| `app/store/migrations/`                           | 38    | ~2,300  | `000.js`–`027.js` + 9 tests; `028+` already TS                                                      |
| `app/util/**`                                     | 31    | ~7,400  | Pure helpers; `util/transactions/index.js` alone is 1,658 LOC                                       |
| `app/core/**`                                     | 24    | ~4,700  | RPC methods (10), Permissions (2), singletons/services (12)                                         |
| `app/reducers/**`                                 | 14    | ~1,650  | 12 reducers + 2 tests; `RootState` currently types these slots as `any`                             |
| `app/components/Base/`                            | 12    | ~2,000  | `Keypad`, `DetailsModal`, `RangeInput`, …                                                           |
| `app/actions/**`                                  | 11    | ~600    | Action creators, mostly untyped object literals                                                     |
| `app/constants/`, `app/images/`, `app/__mocks__/` | 10    | ~230    | Leaves                                                                                              |
| `app/lib/ens-ipfs/`                               | 3     | ~450    | ABI + resolver                                                                                      |
| `app/components/Nav/Main/`                        | 3     | ~2,100  | `MainNavigator`, `RootRPCMethodsUI`, `index` — root of the component tree                           |

Files containing `///: BEGIN:ONLY_INCLUDE_IF` preprocessor comments: 8 (see conventions doc).

## 3. Current tooling (what Phase 0 found and changed)

| Concern            | State on `main`                                                                                                                                                                                                                           | Phase 0 action                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `tsconfig.json`    | `allowJs: true`, `checkJs` off, **`strict: true`**, `isolatedModules`, `noEmit`, `skipLibCheck`; `include` covers `app/**/*` and `e2e/**/*`                                                                                               | Kept as-is (see §3.1)                                                                      |
| Typecheck script   | `yarn lint:tsc` (`tsc --project ./tsconfig.json`), runs in CI (`.github/workflows/ci.yml` `scripts` matrix)                                                                                                                               | Added `yarn typecheck` alias for `lint:tsc` so the name in this plan matches; CI unchanged |
| Typecheck baseline | `main` typechecks clean after `yarn setup` (which applies `patches/` and generates `app/util/termsOfUse/termsOfUseContent.ts`). A fresh clone without patches shows ~55 spurious errors — run `npx patch-package` first. ~25 s wall time. | none                                                                                       |
| Babel / Metro      | `babel-preset-expo` handles TS; no config change needed to rename files                                                                                                                                                                   | none                                                                                       |
| Jest               | `transform: '^.+\\.[jt]sx?$' → babel-jest`; `collectCoverageFrom` already includes ts/tsx                                                                                                                                                 | none                                                                                       |
| ESLint             | `@typescript-eslint/parser`; `*.{ts,tsx}` → `@metamask/eslint-config-typescript`; `*.js` → `@babel/eslint-parser`                                                                                                                         | none — renamed files automatically pick up the stricter TS rule set                        |
| Fitness function   | `.github/scripts/fitness-functions/rules/javascript-additions.ts` fails CI if a PR **adds** a new `.js`/`.jsx` under `app/`                                                                                                               | none — already prevents regressions                                                        |
| Path aliases       | `images/*` → `app/images/*`, one declaration alias                                                                                                                                                                                        | none                                                                                       |
| Shared types       | `RootState` exists in `app/reducers/index.ts` but 15 slots are `any`                                                                                                                                                                      | filled by slice B1                                                                         |

### 3.1 Why `strict` stays `true`

The request suggested starting non-strict (`strict: false`) and ramping later. The repository is _already_ strict and has ~3,900 TS files compiling under it, so downgrading would loosen checks on all existing code and produce a large, noisy "re-tighten" phase later. Instead, per-file escape hatches (`any` with a `TODO(ts-migration)` tag, `@ts-expect-error` with a reason) are the pressure valve, and Phase 3 removes them. This achieves the same "renaming never blocks the build" property without a global regression. If a slice genuinely cannot be landed strict, escalate rather than editing `tsconfig.json`.

## 4. Phases

```
Phase 0  Foundation (done, single agent)
Phase 1  Wave A  — leaves: actions, constants, util, migrations, core/RPC   (11 slices, fully parallel)
         Wave B  — reducers, core services, Base + UI components         (11 slices, parallel once deps land)
         Wave C  — Views, legacy confirmations, Nav/Main                  (8 slices, parallel once deps land)
         Wave D  — index.js, shim.js                                      (1 slice, last)
Phase 2  Type-debt burn-down: remove TODO(ts-migration) any / ts-expect-error   (parallel by directory)
Phase 3  Additional compiler checks (noUnusedLocals, noImplicitReturns, …)      (sequential flag flips, parallel fallout fixes)
```

### Phase 0 — Foundation (complete)

- Verified `tsconfig.json` supports incremental migration (`allowJs`, `checkJs` off). Kept `strict: true` (§3.1).
- Added `yarn typecheck` as an alias of `lint:tsc` (`tsc --project ./tsconfig.json`, `noEmit` comes from tsconfig). CI already runs `lint:tsc`.
- Wrote `docs/ts-migration-conventions.md`.
- Wrote `docs/ts-migration-tracker.md` with every in-scope file assigned to a slice.
- Added `scripts/ts-migration/remaining-js.sh`.

### Phase 1 — Parallel slices

Slices are cut along directory boundaries so no two slices share a file. Waves express _dependency order_ (leaves first) so downstream slices can import real types instead of `any`; within a wave, every slice is independent. A slice may start as soon as the slices in its "Depends on" column are merged — an agent that wants to start early can, at the cost of more temporary `any`.

| Slice | Wave | Scope                                                                                                                                                                 | Files | LOC   | Depends on     |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----- | -------------- |
| A1    | A    | Redux actions (`app/actions/**`)                                                                                                                                      | 11    | 618   | –              |
| A2    | A    | Constants, images, `__mocks__`                                                                                                                                        | 10    | 232   | –              |
| A3    | A    | `lib/ens-ipfs`                                                                                                                                                        | 3     | 448   | –              |
| A4    | A    | `util/*.js` flat helpers                                                                                                                                              | 13    | 1,819 | –              |
| A5    | A    | `util/<subdir>/` (conversion, custom-gas, date, device, general, number, networks, confusables, sentry, confirmation)                                                 | 10    | 3,131 | –              |
| A6    | A    | `util/transactions/index.js`                                                                                                                                          | 1     | 1,658 | –              |
| A7    | A    | `util/test/` (jest setup + fixtures)                                                                                                                                  | 7     | 842   | –              |
| A8    | A    | `store/migrations/000–027` + tests                                                                                                                                    | 38    | 2,338 | –              |
| A9    | A    | Simple core singletons (TransactionTypes, DrawerStatusTracker, ClipboardManager, PreventScreenshot, MobilePortStream, EntryScriptWeb3)                                | 6     | 202   | –              |
| A10   | A    | `core/Permissions`                                                                                                                                                    | 2     | 340   | –              |
| A11   | A    | `core/RPCMethods/**`                                                                                                                                                  | 10    | 1,956 | –              |
| B1    | B    | Redux reducers + fill `RootState` `any` slots                                                                                                                         | 14    | 1,657 | A1             |
| B2    | B    | Complex core services (SecureKeychain, Vault, NotificationManager, BackgroundBridge, WalletConnect)                                                                   | 6     | 2,189 | A9             |
| B3    | B    | `components/Base/**`                                                                                                                                                  | 12    | 2,007 | A4, A5         |
| B4    | B    | Small presentational UI components (39 files, see tracker)                                                                                                            | 39    | 4,569 | A4, A5         |
| B5a   | B    | `UI/Swaps/components/**`                                                                                                                                              | 16    | 3,394 | A4, A5, A6     |
| B5b   | B    | `UI/Swaps/{index,QuotesView,utils}`                                                                                                                                   | 7     | 4,494 | B5a            |
| B6    | B    | UI: Transactions, TransactionElement, TransactionHeader, Notification                                                                                                 | 11    | 4,708 | A6, B1         |
| B7    | B    | UI: Navbar, NavbarTitle, NavbarBrowserTitle, DrawerView, Tabs, BrowserBottomBar                                                                                       | 9     | 4,416 | A4, A5, B1     |
| B8    | B    | UI: Collectible\* family, AddCustomToken, AccountOverview, AccountInfoCard                                                                                            | 9     | 3,642 | A4, A5         |
| B9    | B    | UI: EditGasFee1559/Legacy, PaymentRequest\*, ReceiveRequest, AccountApproval, OptinMetrics, OnboardingWizard, AddressInputs, AnimatedTransactionModal, SlippageSlider | 12    | 6,193 | A4, A5, A6, B1 |
| C1    | C    | `Views/Settings/**`                                                                                                                                                   | 8     | 5,280 | B4, B7         |
| C2    | C    | Views: onboarding / backup / password / import flows                                                                                                                  | 15    | 5,499 | B4             |
| C3    | C    | Legacy confirmations: Approval, Approve, ApproveView, Send containers                                                                                                 | 5     | 4,623 | B6, B9         |
| C4    | C    | Legacy confirmations: `SendFlow/**`                                                                                                                                   | 9     | 4,771 | B6, B9         |
| C5a   | C    | Legacy confirmations: `components/TransactionReview/**`                                                                                                               | 11    | 3,551 | B6, B9         |
| C5b   | C    | Legacy confirmations: remaining shared components + `mock-data.js`                                                                                                    | 12    | 4,481 | B6, B9         |
| C6    | C    | Views: Browser, Asset, Collectible\*, ActivityView, TransactionsView, MediaPlayer, ErrorBoundary, misc                                                                | 20    | 4,616 | B6, B7, B8     |
| C7    | C    | `components/Nav/Main/**`                                                                                                                                              | 3     | 2,079 | C1–C6          |
| D1    | D    | `index.js`, `shim.js`                                                                                                                                                 | 2     | –     | everything     |

Exact file lists per slice are in the tracker. Slices are sized to roughly 2–8k LOC so each is one agent-session; the two 8k-ish slices (B5b, C5b) may be split further by their owner if desired, as long as the tracker is updated first.

#### Per-file procedure (every slice)

1. `git mv foo.js foo.ts` (or `.tsx` if the file contains JSX). Keep the file in place — no moves/renames beyond the extension.
2. Convert `PropTypes` → `interface Props`; type exported function signatures; type `mapStateToProps(state: RootState)`. See conventions doc.
3. Fix imports only where an extension is written literally (`require('./foo.js')`) — rare.
4. Run `yarn typecheck` until zero errors. Use escape hatches only where the correct type would require touching another slice's files.
5. Rename the co-located `*.test.js[x]` → `*.test.ts[x]` and fix its type errors. Snapshots must not change (`yarn jest <path>` with **no** `-u`).
6. `yarn jest --findRelatedTests <files>` and `yarn lint <files>` must pass.
7. Tick the files in the tracker and set the slice status in the same PR.

#### Slice-specific notes

- **A1/B1:** follow `app/actions/onboarding/index.ts` and `app/reducers/security/index.ts`. B1 also replaces the `any` slots in `RootState` (`app/reducers/index.ts`) with the exported `*State` interfaces — this is the shared-types deliverable that unblocks typed `mapStateToProps` for waves B/C.
- **A7:** `testSetup.js` is loaded through babel-jest (`setupFilesAfterEnv`) so it can become `.ts`; update the path in `jest.config.js`. `assetFileTransformer.js` stays JS.
- **A8:** `000–018` have no tests; add a minimal "passes a mock state through" test per file. Use `isObject`/`hasProperty` from `@metamask/utils` as `028.ts` does.
- **A11 / A10:** contain `///: ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)` blocks — preserve byte-for-byte.
- **B2:** `PreventScreenshot` needs a `declare module`/`NativeModules` typing; `BackgroundBridge` types come from `@metamask/json-rpc-engine`; `Vault` from `@metamask/keyring-controller`.
- **B4–B9, C1–C6:** keep `connect()`; do not convert to hooks. Type navigation via `StackNavigationProp` / `RouteProp`. Snapshot parity is the acceptance test.
- **C7:** `MainNavigator.js` is the natural home for a shared `RootStackParamList`; downstream slices may temporarily type `navigation` as `NavigationProp<ParamListBase>` until C7 lands and then tighten in Phase 2.
- **D1:** Metro resolves `index.ts`; `shim.js` mutates globals and should become `shim.ts` with `declare global` blocks. Verify `yarn watch` boots the app on both platforms.

#### Manual QA needs (cannot be verified in CI)

| Slice       | Why                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| B2          | biometrics (SecureKeychain), Android screenshot prevention, push notifications, Ledger (Vault), DApp connectivity (BackgroundBridge/WalletConnect) |
| B5a/B5b, B9 | Swaps flow, payment requests                                                                                                                       |
| C2          | biometric setup, seed phrase flows                                                                                                                 |
| C3–C5       | send flow, approvals, signatures; Ledger                                                                                                           |
| C1          | adding/switching networks                                                                                                                          |
| C6          | DApp browser                                                                                                                                       |
| D1          | cold start on iOS + Android                                                                                                                        |

Everything else is fully covered by `yarn typecheck` + jest.

### Phase 2 — Type-debt burn-down (parallel by directory)

After ≥90% of Wave A–C slices are merged:

1. `git grep -n "TODO(ts-migration)"` → group by top-level directory → one agent per directory.
2. Replace each `any`/`@ts-expect-error` with the real type; the dependency is now available.
3. Tighten `RootState` (`app/reducers/index.ts`) so no slot is `any`, and tighten `NavigationProp<ParamListBase>` to `RootStackParamList` types.
4. Gate: `git grep -c "TODO(ts-migration)"` returns 0.

### Phase 3 — Additional compiler checks (sequential flips, parallel fixes)

`strict` is already on, so the ramp is the non-`strict` checks, one flag per PR, each preceded by a fan-out of fix PRs partitioned by directory:

1. `noFallthroughCasesInSwitch`
2. `noImplicitReturns`
3. `noUnusedLocals`, `noUnusedParameters`
4. `noUncheckedIndexedAccess` (largest fallout; optional, decide after measuring with a dry run: `yarn tsc --noEmit --noUncheckedIndexedAccess | grep -c error`)
5. Once no `.js` remains under `app/`: set `allowJs: false`, remove `*.js` from the ESLint override and from `jest` `collectCoverageFrom`, and tighten the fitness function to forbid `.js` anywhere under `app/`.

Each flag flip PR is small and sequential; the fallout fixes for a flag are parallelizable by directory exactly like Phase 1.

## 5. Coordination rules

1. **One slice = one agent = one branch = one PR.** Branch name `devin/<timestamp>-ts-<slice-id>` (e.g. `devin/1712345678-ts-a4`). PR title follows the existing repo convention `chore(js-ts): Convert <slice-id> <scope> to TypeScript` (e.g. `chore(js-ts): Convert A4 util helpers to TypeScript`). Progress is also mirrored on the Jira board https://cog-gtm.atlassian.net/jira/software/projects/PRIYA/boards/397 (one ticket per slice).
2. **Claim before you touch.** Set the slice to `claimed` with your handle in `docs/ts-migration-tracker.md` and push that change first. If a slice is already `claimed`, pick another.
3. **Never edit a file outside your slice.** If you need a type that lives in another slice's file, use a `TODO(ts-migration)` escape hatch and move on. The single exception is the tracker file and `RootState` (owned by B1 while B1 is open; free-for-all afterwards).
4. **Do not change behaviour.** No hook conversions, no refactors, no dependency bumps. Snapshot diffs are a red flag.
5. **Do not touch `tsconfig.json`, `babel.config.js`, `jest.config.js`, `.eslintrc.js`** in slice PRs (except the `testSetup` path in A7).
6. **Keep PRs mergeable:** rebase on `main` before requesting review; slice PRs touch disjoint files, so conflicts should be limited to the tracker file — resolve by keeping both sides' status changes.
7. **Verification per PR:** `yarn typecheck`, `yarn jest --findRelatedTests <changed files>`, `yarn lint <changed files>`; CI additionally runs the fitness function and the full unit suite.
8. Commit messages must include the word `feature` or `bug` (repo convention), e.g. `feature(ts-migration): migrate A4 util helpers`.

## 6. Throughput estimate

With the slicing above, Wave A (11 slices) can run fully in parallel immediately; Wave B unblocks progressively as A1/A4/A5/A6/A9 land (typically within the first round); Wave C after B. With ~11 concurrent agents the whole of Phase 1 is roughly three rounds of sessions (A → B → C/D), gated mostly by review and merge latency rather than agent time. Phase 2 is one parallel round; Phase 3 is one sequential PR per flag plus a parallel fix round each.
