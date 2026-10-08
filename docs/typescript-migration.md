# TypeScript migration conventions

This is the rulebook for converting the remaining `.js` / `.jsx` files under `app/` to TypeScript. Every migration ticket and PR follows it. If a ticket says something different, the ticket wins for that PR; raise the conflict so this doc gets updated.

Scope at the start of the migration (main@6876455): 331 JS files under `app/`. The per-file inventory (path, group, LOC, sibling test/snapshot, JS importers, `ONLY_INCLUDE_IF` usage, owning plan step) and the baseline gate results live on the board's inventory ticket.

## 1. Before you start: setup

Run setup once on a fresh clone, before running lint, tsc or Jest:

```bash
yarn setup
```

If the full setup is too heavy (it also does iOS/Android work), these are the steps the gates need:

- `yarn patch-package --error-on-fail` (patched `@typescript-eslint` and other packages)
- generate `app/util/termsOfUse/termsOfUseContent.ts` (the _Generate Terms of Use_ step in `scripts/setup.mjs`)
- build `ppom/` so `app/lib/ppom/ppom.html.js` exists (the _Build PPOM_ step)

Without these artifacts, `yarn lint` shows about 3,900 errors (for example `Definition for rule '@typescript-eslint/no-parameter-properties' was not found`), `tsc` about 55 errors and two Jest suites fail. None of them are caused by your change.

Baseline after setup on main@6876455: lint 0 errors / 74 warnings, `tsc` 0 errors, Jest 10/10 shards green (1,213 suites).

## 2. Mechanics

- **Use `git mv`** so history follows the file: `git mv Foo.js Foo.ts`. Do the rename in its own commit, before editing, when the file changes a lot; otherwise git may record a delete and an add.
- **Extension**: files that contain JSX become `.tsx`; everything else becomes `.ts`. Don't use `.tsx` for files without JSX.
- **Tests move with their subject**: `Foo.test.js` becomes `Foo.test.ts(x)` in the same PR as `Foo.js`.
- **Snapshots**: Jest names snapshot files after the test file, so `git mv __snapshots__/Foo.test.js.snap __snapshots__/Foo.test.tsx.snap` together with the test. Run the tests with `--ci` so Jest fails instead of silently writing a new snapshot. Only regenerate (`-u`) when the resulting diff is limited to the rename/header line. Any change to the rendered output is a behaviour change: fix the types, not the snapshot.
- **Imports**: imports are extensionless, so callers usually need no change. Fix any import that spells out `.js`.
- **No new JS in `app/`**: the TS app gate fails a PR that _creates_ a `.js`/`.jsx` file under `app/` (`APP_FOLDER_JS_REGEX` in `.github/scripts/fitness-functions/common/constants.ts`). A rename to `.ts` is fine.
- **No new enzyme imports**: the same gate's _blacklisted code blocks_ rule (`prevent-code-blocks.ts`) fails a PR when a newly created file (outside `.github/`, docs included) adds imports from the `enzyme` package. It only looks at new files, so imports added to existing files are not caught. Treat it as a rule anyway: don't add enzyme imports anywhere. Moving an existing enzyme test counts as a new file when git can't detect the rename, so keep the rename detectable (`git mv`, small diff) or port the test to `@testing-library/react-native`.

## 3. Behaviour: types only

- **No refactors.** No renamed variables, reordered logic, changed defaults, dependency bumps or "while I'm here" fixes. If you find a bug, note it in the PR and file a ticket.
- **Keep `connect()` HOCs and class components** as they are. Type them, don't convert them to hooks or function components. For `connect`, type `mapStateToProps` with `RootState` and derive props from it where neighbours do.
- **PropTypes become an `interface Props`** (or `<ComponentName>Props`, matching neighbours). Delete the `propTypes` / `defaultProps` blocks that the interface replaces, and drop the `prop-types` import. Keep runtime defaults by moving `defaultProps` values into default parameters or destructuring defaults with the same values.
- **Preserve build-time code fences verbatim.** `///: BEGIN:ONLY_INCLUDE_IF(...)` and `///: END:ONLY_INCLUDE_IF` lines are read by the build preprocessor. Don't move, reformat, merge or re-indent them, and don't let an auto-import or Prettier change shift code across a fence. Check them in the diff before you push.
- **Runtime output must be identical.** Same exports (named vs default), same module side effects, same rendered tree.

## 4. Typing

Reuse existing types before inventing new ones, in this order:

1. **Redux state**: `RootState` from `app/reducers` (`import { RootState } from '../../reducers'`). Use existing selectors' return types rather than re-describing state slices.
2. **Controller and Engine types**: from the `@metamask/*` packages (e.g. `TransactionMeta` from `@metamask/transaction-controller`, `NetworkState` from `@metamask/network-controller`) and from `app/core/Engine/types.ts`. Don't hand-write a copy of a controller's state.
3. **Neighbour types**: types already exported by migrated files next to yours (`*.types.ts`, component `Props` interfaces, `app/util/*` typings).
4. Only then add a new type, next to the code that owns it (`Foo.types.ts` for components that already use that pattern).

Other rules:

- `tsconfig.json` is `strict`. Don't loosen compiler options or add files to an exclude list to make a PR pass.
- Prefer `unknown` plus narrowing over `any`; prefer `as const` and union literals over widening to `string`.
- Non-null assertions (`!`) are a lint error. Narrow with a check instead.

## 5. Suppressions

Plan decision: **suppressions are allowed, but every one must carry a `TODO(ts-migration)` tag**, and they are burned down in Phase 6.

Allowed forms (both pass `@typescript-eslint/ban-ts-comment`, which rejects `@ts-ignore` and an undescribed `@ts-expect-error`):

```ts
// @ts-expect-error TODO(ts-migration): <why, e.g. app/util/foo is still JS>
const value = legacyFn();

// TODO(ts-migration): <why this cannot be typed yet>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const payload: any = message.data;
```

Not allowed: `@ts-ignore`, `@ts-nocheck`, file-wide `/* eslint-disable */`, and untagged suppressions. The repo's older `// TODO: Replace "any" with type` comments are not counted towards the migration; don't add new ones.

Every PR lists its new suppressions in the description (file, line, reason). To count them:

```bash
git diff origin/main...HEAD | grep -c '^+.*TODO(ts-migration)'
```

## 6. PR shape

- **Batch size** (plan decision): one PR per folder group, **at most ~15 files** (a file plus its test and snapshot count as one). Split larger groups into numbered PRs.
- **Title**: `chore(js-ts): migrate <area> to TypeScript`, for example `chore(js-ts): migrate app/actions to TypeScript`. The PR-title check (`amannn/action-semantic-pull-request`) needs a Conventional Commit type; `chore(js-ts):` is the prefix the earlier migration PRs and this board use.
- **Branch from `main` on the fork and open the PR against `COG-GTM/metamask-mobile`, never against upstream `MetaMask/metamask-mobile`.**
- **Description**: link the ticket; list the files migrated; list new `TODO(ts-migration)` suppressions; paste the validation output from section 7; say whether the device-QA rule applies.
- **CI**: only `lint`, `lint:tsc`, the PR-title check and Fitness Functions need to be green. About ten other jobs already fail on `main` and on merged PRs for infrastructure reasons: `check-diff` (no Ruby on the macOS runner), `check-pr-labels` and the label bots (missing `LABEL_TOKEN`/`GH_TOKEN`), CLA, `audit:ci`, `js-bundle-size-check`, `docker`. Because of these, the aggregate `Check all jobs pass` job is red on every PR, and the fork's `main` does not require it for merge. Don't try to fix those in a migration PR; just say in the PR description that the remaining failures are the known infrastructure ones.

## 7. Validation for every PR

Run these after setup (section 1) and paste the results in the PR:

```bash
# Types: 0 errors
npx tsc --noEmit

# Lint: 0 errors (74 warnings is the baseline)
yarn lint

# Tests touching the migrated files
yarn test --findRelatedTests <file> [<file> ...] --ci

# TS app gate, exactly as CI runs it
git diff "$(git merge-base origin/main HEAD)" HEAD > .github/scripts/diff
(cd .github/scripts && yarn --immutable && yarn run fitness-functions -- ci ./diff)
rm .github/scripts/diff
```

Notes:

- `.github/scripts` has **no** `test` or `check-ts-app-gate` script, despite what older notes say. The gate is `yarn run fitness-functions -- ci ./diff`, as in `.github/workflows/fitness-functions.yml`.
- **Shard the full Jest suite.** When a ticket asks for the whole suite, run it in shards; a single run crashes Node (V8 out of memory) on a 16 GB machine:

  ```bash
  for i in $(seq 1 10); do yarn jest ./app --shard=$i/10 --maxWorkers=7 || break; done
  ```

### Device QA for flagged areas

Plan decision: **Devin runs an Android-emulator smoke test, plus human sign-off on flagged PRs.**

- A PR is **flagged** when it touches biometrics or keychain (`SecureKeychain`, `Authentication`, onboarding/login biometrics), Ledger or other hardware wallets, iOS-only code paths, or other device-sensitive services (push notifications, screenshot prevention, the in-app browser and `BackgroundBridge`).
- For a flagged PR: run the affected flow on the Android emulator, attach the recording to the PR and the ticket, and add the `needs-device-qa` label. A human signs off (iOS and real-device checks included) before merge.
- For other device-sensitive PRs that are not flagged, the emulator smoke test with a recording is enough.
