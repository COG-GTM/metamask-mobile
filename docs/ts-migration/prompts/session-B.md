# Session B — Store migrations

**Slice:** `app/store/**` (entirely `app/store/migrations/**`)
**Files:** 38
**Branch:** `devin/ts-migration-b-store-migrations`
**File list (authoritative):** `docs/ts-migration/filelists/B.txt`

## Slice-specific notes

- `app/store/migrations/index.ts` is already TypeScript and types the manifest with
  `MigrationManifest` from `redux-persist`. Each converted migration must satisfy the signature
  that manifest expects; do not change `index.ts` beyond what the manifest typing requires.
- Migrations operate on historical, loosely-shaped persisted state. Prefer narrow local
  interfaces plus type guards (`hasProperty`, `isObject` from `@metamask/utils` where already
  used in sibling TS migrations) over `any` — `no-explicit-any` is an error.
- Migration logic must not change: these run against real user state. Keep the numbering,
  the captured-exception messages, and the early-return guards byte-for-byte equivalent.
- 10 of the 38 files are tests; convert each migration together with its test.

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

## Files in this slice (38)

```
app/store/migrations/000.js
app/store/migrations/001.js
app/store/migrations/002.js
app/store/migrations/003.js
app/store/migrations/004.js
app/store/migrations/005.js
app/store/migrations/006.js
app/store/migrations/007.js
app/store/migrations/008.js
app/store/migrations/009.js
app/store/migrations/010.js
app/store/migrations/011.js
app/store/migrations/012.js
app/store/migrations/013.js
app/store/migrations/014.js
app/store/migrations/015.js
app/store/migrations/016.js
app/store/migrations/017.js
app/store/migrations/018.js
app/store/migrations/019.js
app/store/migrations/019.test.js
app/store/migrations/020.js
app/store/migrations/020.test.js
app/store/migrations/021.js
app/store/migrations/021.test.js
app/store/migrations/022.js
app/store/migrations/022.test.js
app/store/migrations/023.js
app/store/migrations/023.test.js
app/store/migrations/024.js
app/store/migrations/024.test.js
app/store/migrations/025.js
app/store/migrations/025.test.js
app/store/migrations/026.js
app/store/migrations/026.test.js
app/store/migrations/027.js
app/store/migrations/027.test.js
app/store/migrations/028.test.js
```
