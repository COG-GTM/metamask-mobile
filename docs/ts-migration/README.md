# JavaScript → TypeScript migration: Phase 0 inventory and coordination plan

This directory holds the coordination scaffolding for the incremental JS → TS migration of the
remaining `.js`/`.jsx` files in this hybrid codebase. It is documentation and tooling only; no
source files are converted here.

- `classify.sh` — regenerates the per-workstream file lists from `git ls-files`. Run
  `bash docs/ts-migration/classify.sh` at any point to refresh counts and verify that every
  remaining JS file is assigned to exactly one workstream.
- `filelists/all.txt` — every remaining `.js`/`.jsx` file under `app/` and `e2e/`
  (`__snapshots__` excluded).
- `filelists/<A..H>.txt` — the authoritative, non-overlapping file list for each workstream.
- `prompts/session-<A..H>.md` — kickoff instructions for the worker session that owns a slice.

## 1. Inventory

687 remaining `.js`/`.jsx` files (331 under `app/`, 356 under `e2e/`); 12 are `.jsx`.
For scale, the codebase already contains 3,930 `.ts`/`.tsx` files under `app/`.

| Workstream | Scope | Files | of which tests | `.jsx` | Snapshot files to rename |
|---|---|---:|---:|---:|---:|
| **A** — Redux state foundation | `app/reducers/**`, `app/actions/**` | 25 | 2 | 0 | 0 |
| **B** — Store migrations | `app/store/**` (all of it is `store/migrations/**`) | 38 | 10 | 0 | 0 |
| **C** — Core modules | `app/core/**` | 24 | 5 | 0 | 0 |
| **D** — UI components | `app/components/UI/**` except `UI/Swaps/**` | 80 | 8 | 3 | 6 |
| **E** — Confirmations (legacy) + Swaps | `app/components/Views/confirmations/**`, `app/components/UI/Swaps/**` | 60 | 7 | 9 | 6 |
| **F** — Views, Base, util, leaf modules | remaining `app/**` (`util/`, `components/Base/`, `components/Views/**` non-confirmations, `components/Nav/`, `lib/`, `constants/`, `__mocks__/`) | 104 | 8 | 0 | 6 |
| **G** — e2e page objects & selectors | `e2e/pages/**`, `e2e/selectors/**` | 217 | 0 | 0 | 0 |
| **H** — e2e specs & harness | remaining `e2e/**` (`specs/`, `fixtures/`, `utils/`, `api-mocking/`, `api-specs/`, root helpers) | 139 | 94 | 0 | 0 |

`classify.sh` asserts 687 assigned, 0 duplicates, 0 unassigned.

**Note on scope:** the task description defined slices A–F over `app/`. `e2e/` is inside
`tsconfig.json`'s `include`, so its 356 JS files are type-checked too and cannot be ignored;
they are split into G and H. G is mechanical (page objects/selectors, no test logic) and H
depends on G's exported types, so **G must land before H**.

### Sub-slice suggestions for the largest workstreams

D (80), F (104), G (217) and H (139) are large. If a worker session runs long, split on these
natural seams (each sub-slice is still non-overlapping):

- **D** → `UI/Notification*`, `UI/Transaction*`, `UI/Navbar*`/`Tabs`, then the ~55 single-file
  component dirs.
- **F** → `app/util/**` (32) | `app/components/Views/**` (43) | `app/components/Base/**` (12) +
  `Nav/`, `lib/`, `constants/`, `__mocks__/` (17).
- **G** → `e2e/pages/**` (107) | `e2e/selectors/**` (110).
- **H** → `e2e/specs/**` (113) | harness: `fixtures/`, `utils/`, `api-mocking/`, `api-specs/`,
  root helpers (26).

### Platform-specific file sets

Only one platform pair remains, and both halves are in workstream D — they must be renamed in
the same commit so Metro platform resolution keeps working:

- `app/components/UI/StyledButton/index.android.js` → `index.android.tsx`
- `app/components/UI/StyledButton/index.ios.js` → `index.ios.tsx`

(`app/components/UI/StyledButton/index.js` is the third file in that directory and is also in D.)
No `.native.js` / `.web.js` files remain.

### Snapshot files requiring a rename

18 `__snapshots__/*.snap` files are named after a `.js`/`.jsx` test file and must be renamed
alongside their test (Jest resolves `<testFileName>.snap`):

| Workstream | Snapshot files |
|---|---|
| D | `UI/AddressInputs/__snapshots__/index.test.jsx.snap`, `UI/BasicFunctionality/__snapshots__/BasicFunctionality.test.js.snap`, `UI/BasicFunctionality/BasicFunctionalityModal/__snapshots__/BasicFunctionalityModal.test.js.snap`, `UI/ManageNetworks/__snapshots__/ManageNetworks.test.js.snap`, `UI/NavbarTitle/__snapshots__/index.test.js.snap`, `UI/Notification/BaseNotification/__snapshots__/index.test.jsx.snap` |
| E | `UI/Swaps/components/__snapshots__/TokenIcon.test.js.snap`, `UI/Swaps/components/__snapshots__/TokenSelectButton.test.js.snap`, `Views/confirmations/legacy/components/ApproveTransactionReview/__snapshots__/index.test.jsx.snap`, `Views/confirmations/legacy/components/TransactionReview/__snapshots__/index.test.jsx.snap`, `Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/__snapshots__/index.test.js.snap`, `Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/__snapshots__/index.test.jsx.snap` |
| F | `Base/Keypad/__snapshots__/Keypad.test.js.snap`, `Views/Asset/__snapshots__/index.test.js.snap`, `Views/NavigationUnitTest/__snapshots__/TestScreen{1,2,3}.test.js.snap`, `Views/OnboardingSuccess/__snapshots__/index.test.js.snap` |

Paths above are relative to `app/components/`.

## 2. Tooling (reuse, do not rebuild)

Existing infrastructure is sufficient; no build changes are needed. `babel-preset-expo` strips
types at transpile time, so renaming a file is runtime-neutral.

| Gate | Command |
|---|---|
| Type check | `yarn lint:tsc` |
| Lint (TS rules apply once renamed) | `yarn lint` — scope with `npx eslint <paths>` |
| Unit tests | `yarn test:unit` — scope with `npx jest <path>` |
| Formatting | `yarn format` |

### Local setup that the gates depend on

Two steps are easy to miss and produce type errors that look like conversion regressions:

1. `.yarnrc` sets `ignore-scripts true`, so `yarn install` does **not** apply `patches/`.
   Run `yarn patch-package --error-on-fail` after installing — several patches add
   `PreferencesController` / assets-controller members that app code references.
2. `app/util/termsOfUse/termsOfUseContent.ts` is generated (gitignored) by `scripts/setup.mjs`,
   which downloads the Terms of Use HTML into `docs/assets/`. Without it,
   `app/util/termsOfUse/termsOfUse.ts` reports `TS2307: Cannot find module`. For a type-check-only
   environment the file's *content* is irrelevant — a one-line stub
   (`export default "<p>placeholder</p>";`) satisfies the compiler.

`yarn setup` does both (plus iOS/Android builds); `node scripts/setup.mjs --no-build-ios --no-build-android`
(`yarn setup:expo`) is the faster path for a type-check-only environment.

### `yarn lint:tsc` baseline

Measured on `main` at `687645507a`:

| Environment | `yarn lint:tsc` |
|---|---|
| bare `yarn install` | 55 errors (mostly `PreferencesController` / assets-controller members added by `patches/`) |
| + `yarn patch-package` | 1 error (missing generated `termsOfUseContent`) |
| + generated `termsOfUseContent.ts` stub | **clean, exit 0** (~24s) |

So the gate is genuinely green and "no new errors" can be enforced strictly — but only after both
setup steps. Each worker session should still record its own baseline before touching files:

```bash
yarn lint:tsc 2>&1 | tee /tmp/tsc_before.log   # on the untouched branch point
```

and compare against it after conversion.

## 3. Definition of done (per file)

1. Renamed with `git mv`: `.js` → `.ts`, or `.jsx`/JSX-containing `.js` → `.tsx`
   (`tsconfig.json` sets `"jsx": "react-native"`).
2. Explicit types added. `@typescript-eslint/no-explicit-any` is `error` for `*.{ts,tsx}`:
   no `any`, and no new eslint-disable suppressions. Missing third-party or asset types go into
   `app/declarations/index.d.ts` as ambient `declare module` shims (follow the existing style).
3. `isolatedModules` is on: re-exported types need `export type { ... }`, and enums/const
   patterns that rely on cross-file type-only elision must be adjusted.
4. Preserve existing runtime behavior exactly — this is a typing migration, not a refactor.
   Keep `/* eslint-disable import/no-commonjs */` where CommonJS interop is required
   (e.g. `app/core/BackgroundBridge/BackgroundBridge.js`).
5. `yarn lint:tsc` reports no new errors vs. the recorded baseline.
6. ESLint clean for the converted paths: `npx eslint <changed files>`.
7. Affected tests pass: `npx jest <changed dirs>`. Snapshot `.snap` filenames renamed to match
   renamed test files; snapshot **content** must not need regeneration — if a snapshot changes,
   the conversion changed behavior and must be corrected rather than `-u`'d.
8. Both halves of a platform pair (`*.android.*` / `*.ios.*`) converted in the same commit.

## 4. Branch and PR strategy

Each workstream owns a branch off `main` and one PR per workstream (or per sub-slice for the
large ones). Because the slices are file-disjoint, the only expected conflicts are in shared
files, which are handled by the rules below.

```
main
 ├── devin/ts-migration-a-redux-state
 ├── devin/ts-migration-b-store-migrations
 ├── devin/ts-migration-c-core
 ├── devin/ts-migration-d-components-ui
 ├── devin/ts-migration-e-confirmations-swaps
 ├── devin/ts-migration-f-views-util
 ├── devin/ts-migration-g-e2e-pages-selectors
 └── devin/ts-migration-h-e2e-specs
```

Rules:

- **One PR per workstream**, based on `main`, titled `chore(ts): migrate <slice> to TypeScript`.
- **Commit granularity:** one commit per component/module directory, using `git mv` so renames
  stay reviewable. Do not mix conversions with unrelated refactors.
- **`app/declarations/index.d.ts` is shared.** Append-only, one `declare module` block per
  addition, in the existing alphabetical-ish grouping. Never reorder or reformat existing
  entries — that turns a 3-line append into a conflict.
- **`tsconfig.json`, `.eslintrc.js`, `package.json`, `babel.config.js` are off limits** to
  worker sessions. Only the main session edits them (Phase 2).
- **No cross-slice edits.** If a file outside your list must change (e.g. a consumer's typing
  breaks), do **not** convert it: leave the JS as-is, or add a minimal typed export in your own
  file, and report the coupling in the PR description for the main session to sequence.
- **Rebase, don't merge**, onto `main` when the main session lands another workstream:
  `git fetch origin && git rebase origin/main`.
- Do not enable `checkJs` or remove `allowJs` in any workstream PR (Phase 2 step, once the JS
  count hits zero).

## 5. Ordering constraints

Foundations first, consumers after. Slices with no arrow between them are fully parallel.

```
A (reducers/actions)  ──┐
                        ├──►  D, E, F   (consumers of store state / action creator types)
B (store migrations)  ──┘

C (core)                 ── parallel, no dependency on A/B

G (e2e pages+selectors) ──►  H (e2e specs)
```

- **A first** (or at least its shared state/action types exposed early): D, E and F contain
  `connect()`ed components and selectors that consume store state. A is small (25 files) and
  should be completed and merged before D/E/F reach their Redux-touching files.
- **B** is independent of A in practice: `app/store/migrations/index.ts` is already TS and typed
  via `MigrationManifest` from `redux-persist`; converted migrations must align with it.
- **C** has no dependency on A/B and can start immediately.
- **D/E/F** can run concurrently with each other from the start, deferring Redux-typed
  boundaries until A is merged (rebase to pick it up).
- **G before H**: specs import page objects and selectors, so H's typing depends on G's exports.

## 6. Phase 2 (main session, after slices land)

1. Merge workstream PRs in dependency order (A, B, C → D, E, F → G → H), running
   `yarn lint:tsc`, `yarn lint` and `yarn test:unit` after each merge.
2. Once `bash docs/ts-migration/classify.sh` reports 0 remaining files, set `"checkJs": true`
   (or drop `allowJs`) in `tsconfig.json` to lock in coverage, and remove the now-unneeded
   `*.js`/`*.jsx` override block in `.eslintrc.js` if nothing else matches it.
3. Verify no orphaned `.js` references remain (imports with explicit `.js` extensions, Metro
   platform resolution for the StyledButton pair) and that the app still bundles via Babel.
