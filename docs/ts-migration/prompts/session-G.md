# Session G — e2e page objects & selectors

**Slice:** `e2e/pages/**` (107) and `e2e/selectors/**` (110)
**Files:** 217
**Branch:** `devin/ts-migration-g-e2e-pages-selectors`
**File list (authoritative):** `docs/ts-migration/filelists/G.txt`

## Slice-specific notes

- `e2e/**` is inside `tsconfig.json`'s `include`, so these files are type-checked; they are not
  out of scope.
- Mostly mechanical: selectors are constant maps (prefer `as const` plus exported literal types
  over `any`), page objects are classes wrapping Detox matchers.
- Detox globals (`element`, `by`, `waitFor`, `device`) come from `detox` types; there is a
  `patches/detox+20.33.0.patch`, so ensure `yarn patch-package` ran before trusting type errors.
- **Slice H (e2e specs) depends on your exported types** — land this PR before H finishes, and
  export the selector/page types explicitly so specs can import them.
- No unit tests here; the gates are `yarn lint:tsc` and ESLint. Do not attempt to run Detox.
- If the slice runs long, split the PR: `e2e/pages/**` first, then `e2e/selectors/**`.

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

## Files in this slice (217)

```
e2e/pages/Browser/AddBookmarkView.js
e2e/pages/Browser/BrowserView.js
e2e/pages/Browser/Confirmations/AlertSystem.js
e2e/pages/Browser/Confirmations/FooterActions.js
e2e/pages/Browser/Confirmations/PageSections.js
e2e/pages/Browser/Confirmations/RequestTypes.js
e2e/pages/Browser/ConnectBottomSheet.js
e2e/pages/Browser/ConnectedAccountsModal.js
e2e/pages/Browser/ContractApprovalBottomSheet.js
e2e/pages/Browser/NetworkConnectMultiSelector.js
e2e/pages/Browser/PermissionSummaryBottomSheet.js
e2e/pages/Browser/PortfolioHomePage.js
e2e/pages/Browser/SigningBottomSheet.js
e2e/pages/Browser/SpamFilterModal.js
e2e/pages/Browser/TestDApp.js
e2e/pages/CommonView.js
e2e/pages/Confirmation/ConfirmationView.js
e2e/pages/ErrorBoundaryView/ErrorBoundaryView.js
e2e/pages/Network/NetworkAddedBottomSheet.js
e2e/pages/Network/NetworkApprovalBottomSheet.js
e2e/pages/Network/NetworkEducationModal.js
e2e/pages/Network/NetworkListModal.js
e2e/pages/Network/NetworkNonPemittedBottomSheet.js
e2e/pages/Notifications/EnableNotificationsModal.js
e2e/pages/Notifications/NotificationDetailsView.js
e2e/pages/Notifications/NotificationMenuView.js
e2e/pages/Notifications/NotificationSettingsView.js
e2e/pages/Onboarding/CreatePasswordView.js
e2e/pages/Onboarding/EnableAutomaticSecurityChecksView.js
e2e/pages/Onboarding/EnableDeviceNotificationsAlert.js
e2e/pages/Onboarding/ExperienceEnhancerBottomSheet.js
e2e/pages/Onboarding/ImportWalletView.js
e2e/pages/Onboarding/MetaMetricsOptInView.js
e2e/pages/Onboarding/OnboardingCarouselView.js
e2e/pages/Onboarding/OnboardingSuccessView.js
e2e/pages/Onboarding/OnboardingView.js
e2e/pages/Onboarding/OnboardingWizardModal.js
e2e/pages/Onboarding/ProtectYourWalletModal.js
e2e/pages/Onboarding/ProtectYourWalletView.js
e2e/pages/Onboarding/SkipAccountSecurityModal.js
e2e/pages/Onboarding/TermsOfUseModal.js
e2e/pages/Onboarding/WhatsNewModal.js
e2e/pages/Ramps/BuildQuoteView.js
e2e/pages/Ramps/BuyGetStartedView.js
e2e/pages/Ramps/QuotesView.js
e2e/pages/Ramps/SelectCurrencyView.js
e2e/pages/Ramps/SelectPaymentMethodView.js
e2e/pages/Ramps/SelectRegionView.js
e2e/pages/Ramps/SellGetStartedView.js
e2e/pages/Ramps/TokenSelectBottomSheet.js
e2e/pages/Receive/PaymentRequestQrBottomSheet.js
e2e/pages/Receive/RequestPaymentModal.js
e2e/pages/Receive/RequestPaymentView.js
e2e/pages/Receive/SendLinkView.js
e2e/pages/Send/AddAddressModal.js
e2e/pages/Send/AmountView.js
e2e/pages/Send/SendView.js
e2e/pages/Send/TransactionConfirmView.js
e2e/pages/Settings/Advanced/FiatOnTestnetsBottomSheet.js
e2e/pages/Settings/AdvancedView.js
e2e/pages/Settings/AesCryptoTestForm.js
e2e/pages/Settings/BackupAndSyncView.js
e2e/pages/Settings/Contacts/AddContactView.js
e2e/pages/Settings/Contacts/ContactsView.js
e2e/pages/Settings/Contacts/DeleteContactBottomSheet.js
e2e/pages/Settings/GeneralView.js
e2e/pages/Settings/NetworksView.js
e2e/pages/Settings/SecurityAndPrivacy/AutoLockModal.js
e2e/pages/Settings/SecurityAndPrivacy/ChangePasswordView.js
e2e/pages/Settings/SecurityAndPrivacy/ClearPrivacyModal.js
e2e/pages/Settings/SecurityAndPrivacy/DeleteWalletModal.js
e2e/pages/Settings/SecurityAndPrivacy/RevealPrivateKeyView.js
e2e/pages/Settings/SecurityAndPrivacy/RevealSecretRecoveryPhrase.js
e2e/pages/Settings/SecurityAndPrivacy/SecurityAndPrivacyView.js
e2e/pages/Settings/SecurityAndPrivacy/SrpQuizModal.js
e2e/pages/Settings/SettingsView.js
e2e/pages/Stake/StakeConfirmView.js
e2e/pages/Stake/StakeView.js
e2e/pages/Transactions/ActivitiesView.js
e2e/pages/Transactions/AssetWatchBottomSheet.js
e2e/pages/Transactions/TransactionDetailsModal.js
e2e/pages/importAccount/ImportAccountView.js
e2e/pages/importAccount/SuccessImportAccountView.js
e2e/pages/importSrp/ImportSrpView.js
e2e/pages/swaps/OnBoarding.js
e2e/pages/swaps/QuoteView.js
e2e/pages/swaps/SwapView.js
e2e/pages/wallet/AccountActionsBottomSheet.js
e2e/pages/wallet/AccountListBottomSheet.js
e2e/pages/wallet/AddAccountBottomSheet.js
e2e/pages/wallet/DetectedTokensView.js
e2e/pages/wallet/EditAccountNameView.js
e2e/pages/wallet/ImportNFTFlow/ImportNFTView.js
e2e/pages/wallet/ImportTokenFlow/ConfirmAddAsset.js
e2e/pages/wallet/ImportTokenFlow/ImportTokensView.js
e2e/pages/wallet/LoginView.js
e2e/pages/wallet/MultiSrp/AddAccountToSrp/AddNewHdAccountComponent.js
e2e/pages/wallet/MultiSrp/Common/SRPListComponent.js
e2e/pages/wallet/MultiSrp/Common/SRPListItemComponent.js
e2e/pages/wallet/NftDetectionModal.js
e2e/pages/wallet/SelectNetworkBottomSheet.js
e2e/pages/wallet/TabBarComponent.js
e2e/pages/wallet/ToastModal.js
e2e/pages/wallet/TokenOverview.js
e2e/pages/wallet/TokenSortBottomSheet.js
e2e/pages/wallet/WalletActionsBottomSheet.js
e2e/pages/wallet/WalletView.js
e2e/selectors/Bridge/BridgeSourceNetworkSelector.selectors.js
e2e/selectors/Browser/AccountOverview.selectors.js
e2e/selectors/Browser/AddBookmarkView.selectors.js
e2e/selectors/Browser/AddFavorites.selectors.js
e2e/selectors/Browser/BrowserURLBar.selectors.js
e2e/selectors/Browser/BrowserView.selectors.js
e2e/selectors/Browser/ConnectAccountBottomSheet.selectors.js
e2e/selectors/Browser/ConnectedAccountModal.selectors.js
e2e/selectors/Browser/ContractApprovalBottomSheet.selectors.js
e2e/selectors/Browser/NetworkConnectMultiSelector.selectors.js
e2e/selectors/Browser/PermissionSummaryBottomSheet.selectors.js
e2e/selectors/Browser/PortfolioPage.selectors.js
e2e/selectors/Browser/SigningBottomSheet.selectors.js
e2e/selectors/Browser/SpamFilterModal.selectors.js
e2e/selectors/Browser/TestDapp.selectors.js
e2e/selectors/Common.selectors.js
e2e/selectors/Confirmation/ConfirmationView.selectors.js
e2e/selectors/ErrorBoundary/ErrorBoundaryView.selectors.js
e2e/selectors/ImportAccount/ImportAccountFromPrivateKey.selectors.js
e2e/selectors/ImportAccount/SuccessImportAccount.selectors.js
e2e/selectors/MultiSRP/AddHdAccount.selectors.js
e2e/selectors/MultiSRP/SRPImport.selectors.js
e2e/selectors/MultiSRP/SRPList.selectors.js
e2e/selectors/MultiSRP/SRPListItem.selectors.js
e2e/selectors/Network/NetworkAddedBottomSheet.selectors.js
e2e/selectors/Network/NetworkApprovalBottomSheet.selectors.js
e2e/selectors/Network/NetworkEducationModal.selectors.js
e2e/selectors/Network/NetworkListModal.selectors.js
e2e/selectors/Network/NetworkNonPemittedBottomSheet.selectors.js
e2e/selectors/Notifications/EnableNotificationModal.selectors.js
e2e/selectors/Notifications/NotificationDetailsView.selectors.js
e2e/selectors/Notifications/NotificationMenuView.selectors.js
e2e/selectors/Notifications/NotificationSettingsView.selectors.js
e2e/selectors/Onboarding/ChoosePassword.selectors.js
e2e/selectors/Onboarding/CustomDefaultNetwork.selectors.js
e2e/selectors/Onboarding/EnableAutomaticSecurityChecks.selectors.js
e2e/selectors/Onboarding/EnableDeviceNotificationsAlert.selectors.js
e2e/selectors/Onboarding/ExperienceEnhancerModal.selectors.js
e2e/selectors/Onboarding/ImportFromSeed.selectors.js
e2e/selectors/Onboarding/ManualBackUpSteps.selectors.js
e2e/selectors/Onboarding/MetaMetricsOptIn.selectors.js
e2e/selectors/Onboarding/Onboarding.selectors.js
e2e/selectors/Onboarding/OnboardingCarousel.selectors.js
e2e/selectors/Onboarding/OnboardingSuccess.selectors.js
e2e/selectors/Onboarding/OnboardingWizardModal.selectors.js
e2e/selectors/Onboarding/ProtectWalletModal.selectors.js
e2e/selectors/Onboarding/SkipAccountSecurityModal.selectors.js
e2e/selectors/Onboarding/TermsOfUseModal.selectors.js
e2e/selectors/Onboarding/WhatsNewModal.selectors.js
e2e/selectors/Ramps/BuildQuote.selectors.js
e2e/selectors/Ramps/GetStarted.selectors.js
e2e/selectors/Ramps/Quotes.selectors.js
e2e/selectors/Ramps/SelectPaymentMethod.selectors.js
e2e/selectors/Ramps/SelectRegion.selectors.js
e2e/selectors/Ramps/SelectToken.selectors.js
e2e/selectors/Receive/RequestPaymentModal.selectors.js
e2e/selectors/Receive/RequestPaymentView.selectors.js
e2e/selectors/Receive/SendLinkView.selectors.js
e2e/selectors/SendFlow/AddAddressModal.selectors.js
e2e/selectors/SendFlow/AmountView.selectors.js
e2e/selectors/SendFlow/ConfirmView.selectors.js
e2e/selectors/SendFlow/EditGasView.selectors.js
e2e/selectors/SendFlow/SendView.selectors.js
e2e/selectors/SendFlow/TransactionConfirmView.selectors.js
e2e/selectors/SendFlow/TransactionReview.selectors.js
e2e/selectors/Settings/AboutMetaMask.selectors.js
e2e/selectors/Settings/Advanced/FiatOnTestnetsBottomSheet.selectors.js
e2e/selectors/Settings/AdvancedView.selectors.js
e2e/selectors/Settings/AesCrypto.selectors.js
e2e/selectors/Settings/BackupAndSyncView.selectors.js
e2e/selectors/Settings/Contacts/AddContactView.selectors.js
e2e/selectors/Settings/Contacts/ContacsView.selectors.js
e2e/selectors/Settings/Contacts/DeleteContactBottomSheet.selectors.js
e2e/selectors/Settings/ExperimentalView.selectors.js
e2e/selectors/Settings/NetworksView.selectors.js
e2e/selectors/Settings/SDK.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/AutoLockModal.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/ChangePasswordView.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/ClearPrivacyModal.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/DataCollectionBottomSheet.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/DeleteWalletModal.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/RevealSeedView.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors.js
e2e/selectors/Settings/SecurityAndPrivacy/SrpQuizModal.selectors.js
e2e/selectors/Settings/SettingsView.selectors.js
e2e/selectors/Stake/StakeConfirmView.selectors.js
e2e/selectors/Stake/StakeView.selectors.js
e2e/selectors/Transactions/ActivitiesView.selectors.js
e2e/selectors/Transactions/AssetWatcher.selectors.js
e2e/selectors/Transactions/TransactionDetailsModal.selectors.js
e2e/selectors/swaps/OnBoarding.selectors.js
e2e/selectors/swaps/QuoteView.selectors.js
e2e/selectors/swaps/SwapsView.selectors.js
e2e/selectors/wallet/AccountActionsBottomSheet.selectors.js
e2e/selectors/wallet/AccountListBottomSheet.selectors.js
e2e/selectors/wallet/AddAccountBottomSheet.selectors.js
e2e/selectors/wallet/AddAssetView.selectors.js
e2e/selectors/wallet/CellComponent.selectors.js
e2e/selectors/wallet/DetectedTokensView.selectors.js
e2e/selectors/wallet/EditAccountName.selectors.js
e2e/selectors/wallet/ImportNFTView.selectors.js
e2e/selectors/wallet/ImportTokenView.selectors.js
e2e/selectors/wallet/LoginView.selectors.js
e2e/selectors/wallet/NftDetectionModal.selectors.js
e2e/selectors/wallet/NotificationsView.selectors.js
e2e/selectors/wallet/TabBar.selectors.js
e2e/selectors/wallet/ToastModal.selectors.js
e2e/selectors/wallet/TokenOverview.selectors.js
e2e/selectors/wallet/WalletActionsBottomSheet.selectors.js
e2e/selectors/wallet/WalletView.selectors.js
```
