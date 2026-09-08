# Session C — Core modules

**Slice:** `app/core/**`
**Files:** 24
**Branch:** `devin/ts-migration-c-core`
**File list (authoritative):** `docs/ts-migration/filelists/C.txt`

## Slice-specific notes

- No dependency on slices A or B; you can start immediately.
- Includes `BackgroundBridge/BackgroundBridge.js`, `Vault.js`, `NotificationManager.js` and the
  10 files under `core/RPCMethods/`.
- `app/core/BackgroundBridge/BackgroundBridge.js` starts with
  `/* eslint-disable import/no-commonjs */` — preserve that pragma; CommonJS interop is
  deliberate. Where a `require()` needs typing, add an ambient `declare module` shim to
  `app/declarations/index.d.ts` rather than switching to ESM imports.
- Engine/controller types come from `@metamask/*-controller` packages that are already typed —
  import their types instead of hand-writing shapes. Note that `patches/` adds members to some
  controller types, so make sure `yarn patch-package` ran before you trust a type error.

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

## Files in this slice (24)

```
app/core/BackgroundBridge/BackgroundBridge.js
app/core/BackgroundBridge/BackgroundBridge.test.js
app/core/ClipboardManager.js
app/core/DrawerStatusTracker.js
app/core/EntryScriptWeb3.js
app/core/MobilePortStream.js
app/core/NotificationManager.js
app/core/Permissions/specifications.js
app/core/Permissions/specifications.test.js
app/core/PreventScreenshot.js
app/core/RPCMethods/createEip1193MethodMiddleware/index.js
app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js
app/core/RPCMethods/eth-request-accounts.js
app/core/RPCMethods/handlers/index.js
app/core/RPCMethods/index.js
app/core/RPCMethods/lib/ethereum-chain-utils.js
app/core/RPCMethods/wallet_addEthereumChain.js
app/core/RPCMethods/wallet_addEthereumChain.test.js
app/core/RPCMethods/wallet_switchEthereumChain.js
app/core/RPCMethods/wallet_switchEthereumChain.test.js
app/core/SecureKeychain.js
app/core/TransactionTypes.js
app/core/Vault.js
app/core/WalletConnect/WalletConnect.js
```
