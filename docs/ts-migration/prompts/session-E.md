# Session E — Legacy confirmations & Swaps

**Slice:** `app/components/Views/confirmations/**` (37 files, all but one under `legacy/`) and `app/components/UI/Swaps/**` (23 files)
**Files:** 60
**Branch:** `devin/ts-migration-e-confirmations-swaps`
**File list (authoritative):** `docs/ts-migration/filelists/E.txt`

## Slice-specific notes

- Highest `.jsx` density (9 files) — those become `.tsx`.
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
- This is legacy code slated for replacement: convert types only, do not modernize or refactor.

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

## Files in this slice (60)

```
app/components/UI/Swaps/QuotesView.js
app/components/UI/Swaps/components/ActionAlert.js
app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js
app/components/UI/Swaps/components/AssetSwapButton.js
app/components/UI/Swaps/components/GasEditModal.js
app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js
app/components/UI/Swaps/components/LoadingAnimation/index.js
app/components/UI/Swaps/components/Onboarding.js
app/components/UI/Swaps/components/QuotesModal.js
app/components/UI/Swaps/components/QuotesSummary.js
app/components/UI/Swaps/components/SlippageModal.js
app/components/UI/Swaps/components/TokenIcon.js
app/components/UI/Swaps/components/TokenIcon.test.js
app/components/UI/Swaps/components/TokenImportModal.js
app/components/UI/Swaps/components/TokenSelectButton.js
app/components/UI/Swaps/components/TokenSelectButton.test.js
app/components/UI/Swaps/components/TokenSelectModal.js
app/components/UI/Swaps/index.js
app/components/UI/Swaps/utils/index.js
app/components/UI/Swaps/utils/index.test.js
app/components/UI/Swaps/utils/useBalance.js
app/components/UI/Swaps/utils/useBlockExplorer.js
app/components/UI/Swaps/utils/useFetchTokenMetadata.js
app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js
app/components/Views/confirmations/legacy/Approval/index.js
app/components/Views/confirmations/legacy/Approve/index.js
app/components/Views/confirmations/legacy/ApproveView/Approve/index.js
app/components/Views/confirmations/legacy/Send/index.js
app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx
app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js
app/components/Views/confirmations/legacy/SendFlow/Amount/index.js
app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx
app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js
app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js
app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js
app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js
app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js
app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js
app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js
app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx
app/components/Views/confirmations/legacy/components/CustomNonce/index.js
app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx
app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx
app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js
app/components/Views/confirmations/legacy/components/SignatureRequest/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx
app/components/Views/confirmations/legacy/components/TypedSign/index.js
app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx
app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js
app/components/Views/confirmations/mock-data.js
```
