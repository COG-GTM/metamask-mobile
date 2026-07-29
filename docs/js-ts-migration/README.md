# JS → TypeScript migration — working agreement

`app/` is partway through an incremental JavaScript → TypeScript migration. The build tooling
already supports mixed JS/TS (`allowJs: true`, Babel strips types, Jest transforms both), so the
only thing left is to rename and type the remaining files.

[`inventory.md`](./inventory.md) is the **single source of truth**: it lists every remaining
`.js`/`.jsx` file under `app/`, whether it becomes `.ts` or `.tsx`, its fan-in/fan-out, how many
`tsc` errors it produces today, and which workstream owns it. `inventory.json` is the same data in
machine-readable form.

This document defines how many sessions work through that inventory in parallel without stepping
on each other.

---

## 1. Ground rules

| Rule | Why |
| --- | --- |
| **One file has exactly one owner.** Two sessions must never edit the same file at the same time. | Git renames conflict badly; a rename + edit on both sides is unmergeable. |
| **Claim a whole workstream, not individual files.** Workstream *file* sets are strictly disjoint, and so are their directories apart from `app/constants` (WS-01/WS-12) and `app/store/migrations` (WS-05/06/07). | No two sessions ever own the same file, so their PRs cannot conflict. In the two shared directories, stay inside your own file list. |
| **One PR per file** (or per small cohesive folder — e.g. `Component.js` + `Component.test.js` + `styles.js`). | PR [#11214](https://github.com/MetaMask/metamask-mobile/pull/11214) migrated 37 files at once and was reverted by [#11418](https://github.com/MetaMask/metamask-mobile/pull/11418). Big undifferentiated batches get reverted. |
| **Types only — no logic refactors.** No `class` → hooks, no `connect()` → `useSelector`, no restructuring. | Snapshot and unit tests are the proof the change is safe. If behaviour changes, that proof disappears. |
| **Rebase before every push.** Many small PRs land concurrently. | `git pull --rebase origin main` keeps the diff minimal. |
| **Hub files are serialized.** WS-01 and WS-02 convert one file at a time and wait for each PR to land. | These files have 50–194 dependents; two in flight at once will conflict with everything. |
| **Update `inventory.md` when you claim and when you land.** | It is the only shared coordination state. |

### Claiming a workstream

1. Open `docs/js-ts-migration/inventory.md`.
2. In the **Workstreams** table, put your session URL in the `Owner` column and set `Status` to
   `in progress`.
3. Commit that single-line change on its own and push it early (a tiny PR, or fold it into your
   first conversion PR) so other sessions see the claim.
4. As each file lands, flip its row in your workstream's file table from `todo` to `done`.

Only the `Owner` and `Status` columns are hand-edited — everything else in `inventory.md` is
regenerated (see [§5](#5-refreshing-the-inventory)).

---

## 2. Per-file conversion procedure

Run this loop for every file in your workstream, **in the order given by the `#` column** (leaf
first: lowest fan-in first, so a newly-typed file surfaces errors in as few consumers as possible).

### Step 1 — Claim the file

Mark it `in progress` in your workstream table in `inventory.md`.

### Step 2 — Rename with `git mv`

```bash
git mv app/components/UI/Foo/index.js app/components/UI/Foo/index.tsx
```

- Use the `Target` column: `.tsx` if the file contains JSX, otherwise `.ts`.
- Use `git mv` (not `mv`) so Git records a rename and the diff stays reviewable.
- Rename the co-located test in the same PR: `Foo.test.js` → `Foo.test.tsx`.
- If the file is marked 📌, its path is hard-coded outside `app/` (`jest.config.js`,
  `.eslintignore`, `index.js`, …). Update those references in the same commit — see the
  **Config-referenced files** table in `inventory.md`.
- When splitting a component up, follow the co-location convention from
  [`.github/guidelines/CODING_GUIDELINES.md`](../../.github/guidelines/CODING_GUIDELINES.md):
  `Foo.tsx`, `Foo.types.ts`, `Foo.styles.ts`, `Foo.test.tsx`, `index.ts`. Do **not** restructure an
  existing folder just for the sake of it — that is a separate PR.

### Step 3 — Add types

`strict: true` is on, so the compiler will demand explicit types for anything it cannot infer.

- **Prefer inference over annotations.** Annotate function/class signatures, props, and module
  boundaries; let TypeScript infer the rest. See the
  [MetaMask TypeScript guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/typescript.md).
- **Replace `PropTypes` with an `interface`** and delete the `prop-types` import:

  | PropTypes | TypeScript |
  | --- | --- |
  | `PropTypes.string` | `string` |
  | `PropTypes.number` | `number` |
  | `PropTypes.bool` | `boolean` |
  | `PropTypes.func` | a real signature, e.g. `(address: string) => void` |
  | `PropTypes.node` | `React.ReactNode` |
  | `PropTypes.element` | `React.ReactElement` |
  | `PropTypes.arrayOf(PropTypes.string)` | `string[]` |
  | `PropTypes.shape({...})` | a named `interface` |
  | `.isRequired` | required property; otherwise mark it `?` |

- **Use `interface` for props and state**, `StyleProp<ViewStyle>` for style props, and
  `React.ReactNode` for children.
- **For `connect()`ed components**, keep `connect()` and split the props:

  ```ts
  interface OwnProps { /* passed by the parent */ }
  interface StateProps { /* from mapStateToProps */ }
  interface DispatchProps { /* from mapDispatchToProps */ }
  type Props = OwnProps & StateProps & DispatchProps;

  const mapStateToProps = (state: RootState): StateProps => ({ /* … */ });
  ```

- **Never use a bare `any`.** Where the type is genuinely unknown, prefer `unknown`; if that is not
  workable, use the repo convention (see `app/store/migrations/index.test.ts`):

  ```ts
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any = something;
  ```

- **Untyped or asset imports** — extend the ambient declarations in
  [`app/declarations/index.d.ts`](../../app/declarations/index.d.ts) rather than sprinkling
  `@ts-expect-error`. It already covers `*.svg`, `*.png`, `images/image-icons`, and friends.

### Step 4 — Type-check

```bash
yarn lint:tsc
```

Must be **zero errors**, not "no new errors" — `main` type-checks clean today.

Two things to watch for:

- `isolatedModules` is on, so re-export a type with `export type { Foo }`, not `export { Foo }`.
- `checkJs` is off, so `.js` files are not type-checked — but a `.js` consumer of your newly typed
  module *can* still break the build through the `.ts` files it feeds. The `Errors` column in
  `inventory.md` is measured with that in mind (a single file renamed against an otherwise clean
  tree), so it is a realistic estimate of what you are signing up for.

### Step 5 — Lint

```bash
yarn lint
```

The rename moves the file from the loose `*.js` ESLint override to the strict `*.{ts,tsx}` one, so
rules that were previously off now fail the build:

- `@typescript-eslint/no-explicit-any: 'error'`
- `@typescript-eslint/no-unused-vars: 'error'` (`no-unused-vars` is `off` for `.js`)
- everything in `@metamask/eslint-config-typescript`

Expect the first lint run after a rename to surface unused imports and variables that nobody has
been looking at.

### Step 6 — Test

```bash
yarn test:unit --findRelatedTests <renamed file>
```

Jest transforms `.js`, `.jsx`, `.ts` and `.tsx` through the same `babel-jest` entry
(`'^.+\\.[jt]sx?$'` in `jest.config.js`) — there is no `ts-jest`, so renaming alone never changes
how a test runs. **Snapshots must not change.** A changed snapshot means the conversion altered
behaviour; fix the code rather than updating the snapshot.

For WS-09 (test infrastructure) run the full `yarn test:unit` — those files are loaded by every
other suite.

### Step 7 — Open the PR

- Title: `chore(js-ts): Convert <path> to TypeScript` (matches the existing convention in
  `CHANGELOG.md`).
- Body: what was renamed, whether any consumer needed a fix, and confirmation that snapshots are
  unchanged.
- Never mix directories from two workstreams in one PR.
- Mark the row `done` in `inventory.md` once the PR merges.

---

## 3. Workstream map

27 workstreams cover all 331 remaining files; see `inventory.md` for the per-file breakdown.

| Group | Workstreams | Parallelism |
| --- | --- | --- |
| Hubs (≥ 50 dependents) | WS-01 `app/util` + `app/constants/network.js`, WS-02 `Navbar`/`StyledButton` | **Serialized inside each workstream.** Start these first — everything downstream gets easier once they are typed. |
| Redux | WS-03 actions, WS-04 reducers | WS-04 consumes the action union types from WS-03, so start WS-04 second. |
| Store migrations | WS-05 `000–013`, WS-06 `014–020`, WS-07 `021–028` | Fully parallel. `app/store/migrations/index.ts` imports without extensions, so renames need no change there. |
| Utilities & core | WS-08 utils, WS-09 test infra, WS-10 core services, WS-11 RPC/permissions, WS-12 constants/lib/mocks | Fully parallel. |
| Components | WS-13 Base, WS-14 Nav, WS-15 Swaps, WS-16–WS-19 UI components (disjoint folder sets) | Fully parallel; easier after WS-01/WS-02 land. |
| Views | WS-20–WS-22 legacy confirmations, WS-23 Settings, WS-24–WS-27 screens | Fully parallel. Highest QA risk — see below. |

### Suggested wave order

1. **Wave 1** — WS-01, WS-02 (hubs, serialized) plus WS-03, WS-05, WS-06, WS-07, WS-12 (leaves,
   fully parallel).
2. **Wave 2** — WS-04, WS-08, WS-09, WS-10, WS-11, WS-14.
3. **Wave 3** — WS-13, WS-15, WS-16 – WS-19.
4. **Wave 4** — WS-20 – WS-27.

Waves are a scheduling hint, not a hard gate: nothing except WS-04 (needs WS-03) and WS-22 (needs
WS-20) actually blocks on another workstream. A dozen or more sessions can run at once from wave 1.

### Areas that need manual QA beyond CI

| Workstream | What to exercise on a device |
| --- | --- |
| WS-10 (`SecureKeychain`, `PreventScreenshot`, `NotificationManager`, `Vault`, `BackgroundBridge`) | Biometric unlock, Android screenshot blocking, push notifications, WalletConnect/SDK dApp connectivity |
| WS-15 (Swaps) | End-to-end swap quote → approve → execute |
| WS-20 – WS-22 (legacy confirmations) | Send flow, token approvals, signature requests; Ledger hardware if available |
| WS-23 (NetworksSettings) | Adding and switching custom networks |
| WS-24 – WS-27 (Browser, Onboarding) | dApp browsing and signing, seed-phrase and biometric onboarding |

---

## 4. Conflict-avoidance checklist

Before you push:

- [ ] Every file you touched belongs to your workstream in `inventory.md`.
- [ ] You did not edit a file marked 🔒 unless you own WS-01/WS-02.
- [ ] You rebased on `main` (`git pull --rebase origin main`) within the last few commits.
- [ ] `yarn lint:tsc`, `yarn lint`, and the related tests all pass.
- [ ] Snapshots are unchanged.
- [ ] `inventory.md` rows for the files in this PR are updated.

Shared files that many workstreams may want to touch — coordinate before editing:

- `app/declarations/index.d.ts` (ambient declarations) — append, never reorder, to keep merges clean.
- `app/store/migrations/index.ts`, `app/reducers/index.ts`, `app/components/Nav/Main/MainNavigator`
  — only the owning workstream edits these.
- `jest.config.js`, `.eslintignore`, `.prettierignore` — only for the 📌 files listed in
  `inventory.md`.

---

## 5. Refreshing the inventory

```bash
# structure + import graph only (fast, no build needed)
node scripts/js-ts-inventory.js

# with per-file tsc error counts merged in
node scripts/js-ts-inventory.js --probe <results.tsv>
```

The script walks `app/`, rebuilds the import graph, re-derives the `.ts`/`.tsx` target from a JSX
scan, re-assigns workstreams from the rules at the top of the script, and rewrites both
`inventory.md` and `inventory.json`. **It overwrites the `Owner`/`Status` columns**, so re-apply
them (or regenerate only when the file list has drifted materially).

`--probe` expects a TSV of `path<TAB>errorsInThatFile<TAB>errorsRepoWide`, produced by renaming
each file on its own in a scratch copy of the tree and running `tsc --project ./tsconfig.json`
against it.

---

## 6. Known environment gotchas

Get these out of the way before you trust any number in `inventory.md` — each one produces errors
that look like they came from your conversion.

**`yarn install` fails.** `package.json` pins `react-native-tcp` to the GitHub tarball
`aprock/react-native-tcp#98fbc801…`, and that repository no longer exists (HTTP 404). Repoint it at
the published npm package for the duration of the install, then restore the pin:

```bash
cp package.json /tmp/pkg.orig
sed -i 's|aprock/react-native-tcp#98fbc801f0586297f16730b2f4c75eef15dfabcd|4.0.0|' package.json
yarn install --network-timeout 600000
cp /tmp/pkg.orig package.json && git checkout -- yarn.lock
```

**Run `yarn patch-package` after any install.** The repo carries 38 patches under `patches/`, and
they are applied by `yarn setup` only — there is no `postinstall` hook. Skip it and `yarn lint:tsc`
reports ~54 phantom errors (missing `displayNftMedia`, `setTokenNetworkFilter`,
`showMultiRpcModal`, … from `@metamask/preferences-controller`) that have nothing to do with your
rename.

**Two generated files are gitignored** and produced by `yarn setup`:

| File | Symptom if missing |
| --- | --- |
| `app/util/termsOfUse/termsOfUseContent.ts` | `yarn lint:tsc` → `TS2307: Cannot find module './termsOfUseContent'` |
| `app/lib/ppom/ppom.html.js` | `Engine.test.ts` and `NetworkSelector.test.tsx` fail to run |

**Always capture a baseline before you conclude anything.** Run the same `yarn lint:tsc` /
`yarn test:unit` command on the untouched tree first and diff the two results. Running a large
related-test set can exit `133` (V8 `Fatal JavaScript invalid size error`) on its own, which is
environmental, not a regression.
