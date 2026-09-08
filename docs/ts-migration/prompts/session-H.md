# Session H — e2e specs & harness

**Slice:** all remaining `e2e/**`: `specs/**` (113), `fixtures/**`, `utils/**`, `api-mocking/**`, `api-specs/**` and the root helpers (`helpers.js`, `viewHelper.js`, `init.js`, `environment.js`, `tags.js`, `tenderly.js`, `create-static-server.js`, `jest.e2e.config.js`)
**Files:** 139
**Branch:** `devin/ts-migration-h-e2e-specs`
**File list (authoritative):** `docs/ts-migration/filelists/H.txt`

## Slice-specific notes

- **Blocked on slice G**: specs import page objects and selectors from `e2e/pages` and
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
  `api-specs/`, root helpers) first, then `e2e/specs/**`.

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

## Files in this slice (139)

```
e2e/api-mocking/api-monitor.js
e2e/api-mocking/mock-config/mock-events.js
e2e/api-mocking/mock-responses/auth-mocks.js
e2e/api-mocking/mock-responses/balance-mocks.js
e2e/api-mocking/mock-server.js
e2e/api-specs/ConfirmationsRejectionRule.js
e2e/api-specs/helpers.js
e2e/api-specs/json-rpc-coverage.js
e2e/api-specs/run-api-spec-tests.js
e2e/create-static-server.js
e2e/environment.js
e2e/fixtures/fixture-builder.js
e2e/fixtures/fixture-helper.js
e2e/fixtures/fixture-server.js
e2e/fixtures/utils.js
e2e/helpers.js
e2e/init.js
e2e/jest.e2e.config.js
e2e/resources/networks.e2e.js
e2e/specs/accounts/aes/encryption-with-key.spec.js
e2e/specs/accounts/aes/encryption-with-password.spec.js
e2e/specs/accounts/aes/salt-generation.spec.js
e2e/specs/accounts/auto-lock.spec.js
e2e/specs/accounts/change-account-name.spec.js
e2e/specs/accounts/error-boundary-srp-backup.spec.js
e2e/specs/accounts/import-wallet-account.spec.js
e2e/specs/accounts/imported-account-remove-and-import.spec.js
e2e/specs/accounts/reveal-private-key.spec.js
e2e/specs/accounts/reveal-secret-recovery-phrase.spec.js
e2e/specs/analytics/helpers.js
e2e/specs/analytics/onboarding.spec.js
e2e/specs/assets/import-tokens-via-asset-watcher.spec.js
e2e/specs/assets/import-tokens.spec.js
e2e/specs/assets/multichain/asset-list.spec.js
e2e/specs/assets/multichain/asset-sort.spec.js
e2e/specs/assets/nft-details.spec.js
e2e/specs/assets/nft-detection-modal.spec.js
e2e/specs/assets/token-detection-import-all.spec.js
e2e/specs/browser/browser-tests.spec.js
e2e/specs/confirmations-redesigned/signatures/alert-system.spec.js
e2e/specs/confirmations-redesigned/signatures/signatures.spec.js
e2e/specs/confirmations/advanced-gas-fees.mock.spec.js
e2e/specs/confirmations/approve-custom-erc20.spec.js
e2e/specs/confirmations/approve-default-erc20.spec.js
e2e/specs/confirmations/approve-erc721.spec.js
e2e/specs/confirmations/batch-transfer-erc1155.spec.js
e2e/specs/confirmations/increase-allowance-erc20.spec.js
e2e/specs/confirmations/security-alert-send-eth.mock.js
e2e/specs/confirmations/send-erc20-with-dapp.spec.js
e2e/specs/confirmations/send-erc721.spec.js
e2e/specs/confirmations/send-eth.spec.js
e2e/specs/confirmations/send-failing-contract.spec.js
e2e/specs/confirmations/send-to-contract-address.spec.js
e2e/specs/confirmations/set-approval-for-all-erc1155.spec.js
e2e/specs/confirmations/set-approve-for-all-erc721.spec.js
e2e/specs/confirmations/signatures/ethereum-sign.spec.js
e2e/specs/confirmations/signatures/personal-sign.spec.js
e2e/specs/confirmations/signatures/security-alert-signatures.mock.spec.js
e2e/specs/confirmations/signatures/typed-sign-v3.spec.js
e2e/specs/confirmations/signatures/typed-sign-v4.spec.js
e2e/specs/confirmations/signatures/typed-sign.spec.js
e2e/specs/identity/account-syncing/account-sync-settings-toggle.spec.js
e2e/specs/identity/account-syncing/mock-data.js
e2e/specs/identity/account-syncing/sync-after-adding-custom-name-account.spec.js
e2e/specs/identity/account-syncing/sync-after-onboarding.spec.js
e2e/specs/identity/account-syncing/sync-with-account-balances.spec.js
e2e/specs/identity/utils/constants.js
e2e/specs/identity/utils/helpers.js
e2e/specs/identity/utils/mocks.js
e2e/specs/identity/utils/user-storage/generateEncryptedData.js
e2e/specs/identity/utils/user-storage/userStorageMockttpController.js
e2e/specs/identity/utils/user-storage/userStorageMockttpController.test.js
e2e/specs/multichain/permission-system-summary-default-permissions.spec.js
e2e/specs/multichain/permissions/accounts/permission-system-revoke-multiple.spec.js
e2e/specs/multichain/permissions/accounts/permission-system-revoke-single.spec.js
e2e/specs/multichain/permissions/chains/permission-system-add-non-permitted.spec.js
e2e/specs/multichain/permissions/chains/permission-system-dapp-chain-switch-grant.spec.js
e2e/specs/multichain/permissions/chains/permission-system-discard-changes.spec.js
e2e/specs/multichain/permissions/chains/permission-system-initial-connection.spec.js
e2e/specs/multichain/permissions/chains/permission-system-remove.spec.js
e2e/specs/multichain/permissions/chains/permission-system-revoke-single.spec.js
e2e/specs/multichain/permissions/chains/permission-system-update-permissions.spec.js
e2e/specs/multisrp/add-account.spec.js
e2e/specs/multisrp/export-srp-from-account-actions.spec.js
e2e/specs/multisrp/export-srp-from-settings.spec.js
e2e/specs/multisrp/import-srp.spec.js
e2e/specs/multisrp/utils.js
e2e/specs/networks/add-custom-rpc.spec.js
e2e/specs/networks/add-popular-networks.spec.js
e2e/specs/networks/connect-test-network.spec.js
e2e/specs/networks/networks-search.spec.js
e2e/specs/notifications/enable-notifications-after-onboarding.spec.js
e2e/specs/notifications/notification-settings-flow.spec.js
e2e/specs/notifications/utils/constants.js
e2e/specs/notifications/utils/helpers.js
e2e/specs/notifications/utils/mock-user-storage-data.js
e2e/specs/notifications/utils/mocks.js
e2e/specs/onboarding/onboarding-wizard-opt-in.spec.js
e2e/specs/onboarding/term-of-use.spec.js
e2e/specs/permission-systems/permission-system-delete-wallet.spec.js
e2e/specs/quarantine/create-wallet-account.failing.js
e2e/specs/quarantine/deeplink-to-buy-flow-with-unsupported-network.failing.js
e2e/specs/quarantine/deeplink-to-buy-flow.spec.js
e2e/specs/quarantine/deeplinks.failing.js
e2e/specs/quarantine/edit-recipient-address.failing.js
e2e/specs/quarantine/permission-system-removing-imported-account.failing.js
e2e/specs/quarantine/send-to-contact.failing.js
e2e/specs/ramps/deeplink-to-buy-flow-with-unsupported-network.spec.js
e2e/specs/ramps/deeplink-to-sell-flow.spec.js
e2e/specs/ramps/offramp-cashout.spec.js
e2e/specs/ramps/offramp-token-amount.spec.js
e2e/specs/ramps/offramp.spec.js
e2e/specs/ramps/onramp-limits.spec.js
e2e/specs/ramps/onramp.spec.js
e2e/specs/settings/addressbook-relaunch-app.spec.js
e2e/specs/settings/addressbook-tests.spec.js
e2e/specs/settings/clear-privacy-data.spec.js
e2e/specs/settings/contact-us.spec.js
e2e/specs/settings/delete-wallet.spec.js
e2e/specs/settings/example-anvil-e2e.spec.js
e2e/specs/settings/fiat-on-testnets.spec.js
e2e/specs/stake/stake-action-smoke.spec.js
e2e/specs/swaps/swap-action-regression.spec.js
e2e/specs/swaps/swap-action-smoke.spec.js
e2e/specs/swaps/swap-token-chart.spec.js
e2e/specs/swaps/token-details.spec.js
e2e/specs/wallet/carousel.spec.js
e2e/specs/wallet/incoming-transactions.spec.js
e2e/specs/wallet/portfolio-connect-account.spec.js
e2e/specs/wallet/request-token-flow.spec.js
e2e/specs/wallet/send-ERC-token.spec.js
e2e/specs/wallet/start-exploring.spec.js
e2e/tags.js
e2e/tenderly.js
e2e/utils/Assertions.js
e2e/utils/Gestures.js
e2e/utils/Matchers.js
e2e/utils/Utilities.js
e2e/viewHelper.js
```
