#!/usr/bin/env python3
"""Generates docs/ts-migration/prompts/session-<X>.md from _shared.md + per-slice notes."""
import subprocess
from pathlib import Path

ROOT = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
BASE = ROOT / 'docs/ts-migration'
PROMPTS = BASE / 'prompts'

SLICES = {
    'A': dict(
        title='Redux state foundation',
        branch='devin/ts-migration-a-redux-state',
        scope='`app/reducers/**` and `app/actions/**`',
        notes="""- This slice is the **typed foundation** other slices consume, so it is the highest priority:
  finish and get the PR up before the UI slices reach their Redux-touching files.
- `app/reducers/` and `app/actions/` are already partly TS (31 and 24 TS files respectively) —
  follow the typing conventions there instead of inventing new ones, and reuse the existing
  root-state and action types rather than redeclaring them.
- Type action creators with discriminated-union action types and give each reducer an explicit
  state interface plus a typed initial state. Export the state types so consumers in slices
  D/E/F can import them instead of re-deriving shapes.
- Do not change any action string constants or reducer behavior — consumers depend on both.""",
    ),
    'B': dict(
        title='Store migrations',
        branch='devin/ts-migration-b-store-migrations',
        scope='`app/store/**` (entirely `app/store/migrations/**`)',
        notes="""- `app/store/migrations/index.ts` is already TypeScript and types the manifest with
  `MigrationManifest` from `redux-persist`. Each converted migration must satisfy the signature
  that manifest expects; do not change `index.ts` beyond what the manifest typing requires.
- Migrations operate on historical, loosely-shaped persisted state. Prefer narrow local
  interfaces plus type guards (`hasProperty`, `isObject` from `@metamask/utils` where already
  used in sibling TS migrations) over `any` — `no-explicit-any` is an error.
- Migration logic must not change: these run against real user state. Keep the numbering,
  the captured-exception messages, and the early-return guards byte-for-byte equivalent.
- 10 of the 38 files are tests; convert each migration together with its test.""",
    ),
    'C': dict(
        title='Core modules',
        branch='devin/ts-migration-c-core',
        scope='`app/core/**`',
        notes="""- No dependency on slices A or B; you can start immediately.
- Includes `BackgroundBridge/BackgroundBridge.js`, `Vault.js`, `NotificationManager.js` and the
  10 files under `core/RPCMethods/`.
- `app/core/BackgroundBridge/BackgroundBridge.js` starts with
  `/* eslint-disable import/no-commonjs */` — preserve that pragma; CommonJS interop is
  deliberate. Where a `require()` needs typing, add an ambient `declare module` shim to
  `app/declarations/index.d.ts` rather than switching to ESM imports.
- Engine/controller types come from `@metamask/*-controller` packages that are already typed —
  import their types instead of hand-writing shapes. Note that `patches/` adds members to some
  controller types, so make sure `yarn patch-package` ran before you trust a type error.""",
    ),
    'D': dict(
        title='UI components',
        branch='devin/ts-migration-d-components-ui',
        scope='`app/components/UI/**`, excluding `app/components/UI/Swaps/**` (owned by slice E)',
        notes="""- Largest slice (80 files). Suggested order: `UI/Notification*` (5), `UI/TransactionElement`
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
  the conventions in the neighboring already-TS components.""",
    ),
    'E': dict(
        title='Legacy confirmations & Swaps',
        branch='devin/ts-migration-e-confirmations-swaps',
        scope='`app/components/Views/confirmations/**` (37 files, all but one under `legacy/`) and `app/components/UI/Swaps/**` (23 files)',
        notes="""- Highest `.jsx` density (9 files) — those become `.tsx`.
- `.eslintrc.js` has an extra override block for `app/components/Views/confirmations/**`; make
  sure `npx eslint` is clean under those stricter rules, not just under the default TS config.
- 6 snapshot files must be renamed with their tests: `UI/Swaps/components/TokenIcon.test.js.snap`,
  `UI/Swaps/components/TokenSelectButton.test.js.snap`,
  `Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx.snap`,
  `.../TransactionReview/index.test.jsx.snap`,
  `.../TransactionReview/TransactionReviewDetailsCard/index.test.js.snap`,
  `.../TransactionReview/TransactionReviewEIP1559Update/index.test.jsx.snap`.
- Transaction and gas objects should be typed from `@metamask/transaction-controller` /
  `@metamask/gas-fee-controller` types where they already exist, not from hand-rolled shapes.
- Swaps hooks (`utils/useBalance.js`, `useBlockExplorer.js`, `useFetchTokenMetadata.js`) are
  consumed by the Swaps views in this same slice — type them first, then the views.
- This is legacy code slated for replacement: convert types only, do not modernize or refactor.""",
    ),
    'F': dict(
        title='Views, Base, util and remaining leaf modules',
        branch='devin/ts-migration-f-views-util',
        scope='all remaining `app/**` files: `app/util/**` (32), `app/components/Views/**` non-confirmations (43), `app/components/Base/**` (12), `app/components/Nav/**`, `app/lib/**`, `app/constants/**`, `app/__mocks__/**`',
        notes="""- 104 files. Suggested order: `app/util/**` (leaf utilities, most reused) → `components/Base/**`
  → `components/Views/**` → `Nav/`, `lib/`, `constants/`, `__mocks__/`.
- 6 snapshot files must be renamed with their tests: `Base/Keypad/Keypad.test.js.snap`,
  `Views/Asset/index.test.js.snap`, `Views/NavigationUnitTest/TestScreen{1,2,3}.test.js.snap`,
  `Views/OnboardingSuccess/index.test.js.snap`.
- `app/util/test/**` (8 files) are test helpers imported widely by already-TS tests — typing
  them correctly gives the largest payoff, so do them early and carefully.
- Navigation params in `components/Views/**` should use the existing React Navigation types used
  by neighboring TS screens rather than untyped `route`/`navigation` props.
- For `connect()`ed views, import store-state types from slice A (rebase if it has not landed).""",
    ),
    'G': dict(
        title='e2e page objects & selectors',
        branch='devin/ts-migration-g-e2e-pages-selectors',
        scope='`e2e/pages/**` (107) and `e2e/selectors/**` (110)',
        notes="""- `e2e/**` is inside `tsconfig.json`'s `include`, so these files are type-checked; they are not
  out of scope.
- Mostly mechanical: selectors are constant maps (prefer `as const` plus exported literal types
  over `any`), page objects are classes wrapping Detox matchers.
- Detox globals (`element`, `by`, `waitFor`, `device`) come from `detox` types; there is a
  `patches/detox+20.33.0.patch`, so ensure `yarn patch-package` ran before trusting type errors.
- **Slice H (e2e specs) depends on your exported types** — land this PR before H finishes, and
  export the selector/page types explicitly so specs can import them.
- No unit tests here; the gates are `yarn lint:tsc` and ESLint. Do not attempt to run Detox.
- If the slice runs long, split the PR: `e2e/pages/**` first, then `e2e/selectors/**`.""",
    ),
    'H': dict(
        title='e2e specs & harness',
        branch='devin/ts-migration-h-e2e-specs',
        scope='all remaining `e2e/**`: `specs/**` (113), `fixtures/**`, `utils/**`, `api-mocking/**`, `api-specs/**` and the root helpers (`helpers.js`, `viewHelper.js`, `init.js`, `environment.js`, `tags.js`, `tenderly.js`, `create-static-server.js`, `jest.e2e.config.js`)',
        notes="""- **Blocked on slice G**: specs import page objects and selectors from `e2e/pages` and
  `e2e/selectors`. Start only after G's PR is merged (or rebase onto it), and import G's exported
  types instead of redeclaring them.
- `e2e/jest.e2e.config.js` is a config file consumed by Detox — verify the Detox config still
  resolves it after renaming (it is referenced by path in `package.json` scripts and
  `.detoxrc.js`); if the rename would require editing those shared configs, leave the file as
  `.js` and report it instead.
- Fixtures and API mocks carry the most valuable types (mock response shapes); type those first,
  then the specs that consume them.
- No unit tests here; the gates are `yarn lint:tsc` and ESLint. Do not attempt to run Detox.
- If the slice runs long, split the PR: harness (`fixtures/`, `utils/`, `api-mocking/`,
  `api-specs/`, root helpers) first, then `e2e/specs/**`.""",
    ),
}

shared = (PROMPTS / '_shared.md').read_text().split('\n', 2)[2].strip()

for letter, s in SLICES.items():
    files = (BASE / f'filelists/{letter}.txt').read_text().strip().splitlines()
    body = f"""# Session {letter} — {s['title']}

**Slice:** {s['scope']}
**Files:** {len(files)}
**Branch:** `{s['branch']}`
**File list (authoritative):** `docs/ts-migration/filelists/{letter}.txt`

## Slice-specific notes

{s['notes']}

{shared}

## Files in this slice ({len(files)})

```
{chr(10).join(files)}
```
"""
    (PROMPTS / f'session-{letter}.md').write_text(body)
    print(f'session-{letter}.md  {len(files)} files')
