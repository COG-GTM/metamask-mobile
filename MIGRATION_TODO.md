# JavaScript → TypeScript Migration Tracker

Source of truth for the JS→TS migration. Each batch is owned by one session and must not touch files outside its batch (other than import-path fixes required by renames). Check off files as they are converted (`- [x]`). Regenerate the unchecked list with `python3 scripts/gen-migration-todo.py` if needed.

Excluded on purpose (build/tooling config, not app source): root `index.js`, `shim.js`, `app.config.js`, `babel.config*.js`, `metro.config.js`, `metro.transform.js`, `jest.config.js`, `react-native.config.js`, `ses-hermes.cjs`.

## Conventions

- `.js` → `.ts`; files containing JSX → `.tsx` (suggested target extension is listed per file, verify before renaming).
- Type props with interfaces; remove `PropTypes`. Prefer types from `@metamask/*` controllers, `@reduxjs/toolkit`, `react-redux`, `react-navigation`.
- No blanket `any`; use `unknown` + narrowing. Flag every remaining `any` / `@ts-expect-error` in the PR description.
- Rename with `git mv` so history is preserved. Convert co-located `*.test.js` and `*.stories.js` in the same PR.
- Verify: `yarn lint:tsc`, `yarn jest <paths>`, `yarn eslint <paths>`.

## Summary (819 files)

| Batch | Scope | Files |
|---|---|---|
| A | app/components/Views/confirmations | 37 |
| B | app/components/Views (everything except confirmations) | 43 |
| C | app/components/UI/Swaps | 23 |
| D1 | app/components/UI subdirs A–M | 34 |
| D2 | app/components/UI subdirs N–Z (except Swaps) + lowercase | 46 |
| E | app/components/Base + Nav + rest of app/components | 15 |
| F | app/store (migrations) | 38 |
| G | app/util + app/lib + app/constants + app/images + app/__mocks__ | 46 |
| H | app/core + app/reducers + app/actions | 49 |
| I1 | e2e/pages | 107 |
| I2 | e2e/selectors | 110 |
| J | e2e/specs | 113 |
| K | e2e (root, utils, fixtures, api-mocking, api-specs, resources) | 26 |
| L | wdio/screen-objects | 86 |
| M | wdio (step-definitions, utils, config, helpers) + scripts | 46 |

## Batch A — app/components/Views/confirmations (37 files)

### `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/`
- [ ] `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/Approval/`
- [ ] `app/components/Views/confirmations/legacy/Approval/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/Approve/`
- [ ] `app/components/Views/confirmations/legacy/Approve/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/ApproveView/Approve/`
- [ ] `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/Send/`
- [ ] `app/components/Views/confirmations/legacy/Send/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/SendFlow/AddressList/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` → `.ts`

### `app/components/Views/confirmations/legacy/SendFlow/Amount/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` → `.ts`

### `app/components/Views/confirmations/legacy/SendFlow/Confirm/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/SendFlow/SendTo/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/`
- [ ] `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/`
- [ ] `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/`
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx` → `.tsx`

### `app/components/Views/confirmations/legacy/components/CustomNonce/`
- [ ] `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/`
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx` → `.tsx`

### `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/`
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx` → `.tsx`

### `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/`
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/SignatureRequest/`
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` → `.ts`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TransactionReview/`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` → `.tsx`
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx` → `.tsx`

### `app/components/Views/confirmations/legacy/components/TypedSign/`
- [ ] `app/components/Views/confirmations/legacy/components/TypedSign/index.js` → `.tsx`

### `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/`
- [ ] `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx` → `.tsx`

### `app/components/Views/confirmations/legacy/components/WatchAssetRequest/`
- [ ] `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` → `.tsx`

### `app/components/Views/confirmations/`
- [ ] `app/components/Views/confirmations/mock-data.js` → `.ts`

## Batch B — app/components/Views (everything except confirmations) (43 files)

### `app/components/Views/AccountBackupStep1/`
- [ ] `app/components/Views/AccountBackupStep1/index.js` → `.tsx`

### `app/components/Views/AccountBackupStep1B/`
- [ ] `app/components/Views/AccountBackupStep1B/index.js` → `.tsx`

### `app/components/Views/ActivityView/`
- [ ] `app/components/Views/ActivityView/index.js` → `.tsx`

### `app/components/Views/AddBookmark/`
- [ ] `app/components/Views/AddBookmark/index.js` → `.tsx`

### `app/components/Views/AddressQRCode/`
- [ ] `app/components/Views/AddressQRCode/index.js` → `.tsx`

### `app/components/Views/Asset/`
- [ ] `app/components/Views/Asset/index.js` → `.tsx`
- [ ] `app/components/Views/Asset/index.test.js` → `.tsx`

### `app/components/Views/Browser/`
- [ ] `app/components/Views/Browser/index.js` → `.tsx`

### `app/components/Views/ChoosePassword/`
- [ ] `app/components/Views/ChoosePassword/index.js` → `.tsx`

### `app/components/Views/Collectible/`
- [ ] `app/components/Views/Collectible/index.js` → `.tsx`

### `app/components/Views/CollectibleView/`
- [ ] `app/components/Views/CollectibleView/index.js` → `.tsx`

### `app/components/Views/EnterPasswordSimple/`
- [ ] `app/components/Views/EnterPasswordSimple/index.js` → `.tsx`

### `app/components/Views/ErrorBoundary/`
- [ ] `app/components/Views/ErrorBoundary/index.js` → `.tsx`

### `app/components/Views/GasEducationCarousel/`
- [ ] `app/components/Views/GasEducationCarousel/index.js` → `.tsx`

### `app/components/Views/ImportFromSecretRecoveryPhrase/`
- [ ] `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` → `.tsx`

### `app/components/Views/ImportPrivateKeySuccess/`
- [ ] `app/components/Views/ImportPrivateKeySuccess/index.js` → `.tsx`

### `app/components/Views/LockScreen/`
- [ ] `app/components/Views/LockScreen/index.js` → `.tsx`

### `app/components/Views/ManualBackupStep1/`
- [ ] `app/components/Views/ManualBackupStep1/index.js` → `.tsx`

### `app/components/Views/ManualBackupStep2/`
- [ ] `app/components/Views/ManualBackupStep2/index.js` → `.tsx`

### `app/components/Views/ManualBackupStep3/`
- [ ] `app/components/Views/ManualBackupStep3/index.js` → `.tsx`

### `app/components/Views/MediaPlayer/`
- [ ] `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` → `.tsx`
- [ ] `app/components/Views/MediaPlayer/index.js` → `.tsx`

### `app/components/Views/NavigationUnitTest/`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen1.test.js` → `.tsx`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen2.test.js` → `.tsx`
- [ ] `app/components/Views/NavigationUnitTest/TestScreen3.test.js` → `.tsx`
- [ ] `app/components/Views/NavigationUnitTest/index.js` → `.tsx`

### `app/components/Views/OfflineMode/`
- [ ] `app/components/Views/OfflineMode/index.js` → `.tsx`

### `app/components/Views/Onboarding/`
- [ ] `app/components/Views/Onboarding/index.js` → `.tsx`

### `app/components/Views/OnboardingSuccess/`
- [ ] `app/components/Views/OnboardingSuccess/index.test.js` → `.tsx`

### `app/components/Views/ResetPassword/`
- [ ] `app/components/Views/ResetPassword/index.js` → `.tsx`

### `app/components/Views/Settings/AdvancedSettings/`
- [ ] `app/components/Views/Settings/AdvancedSettings/index.js` → `.tsx`

### `app/components/Views/Settings/AppInformation/`
- [ ] `app/components/Views/Settings/AppInformation/index.js` → `.tsx`

### `app/components/Views/Settings/Contacts/ContactForm/`
- [ ] `app/components/Views/Settings/Contacts/ContactForm/index.js` → `.tsx`

### `app/components/Views/Settings/Contacts/`
- [ ] `app/components/Views/Settings/Contacts/index.js` → `.tsx`

### `app/components/Views/Settings/GeneralSettings/`
- [ ] `app/components/Views/Settings/GeneralSettings/index.js` → `.tsx`

### `app/components/Views/Settings/NetworksSettings/NetworkSettings/`
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` → `.tsx`
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` → `.tsx`

### `app/components/Views/Settings/NetworksSettings/`
- [ ] `app/components/Views/Settings/NetworksSettings/index.js` → `.tsx`

### `app/components/Views/SimpleWebview/`
- [ ] `app/components/Views/SimpleWebview/index.js` → `.tsx`

### `app/components/Views/TermsAndConditions/`
- [ ] `app/components/Views/TermsAndConditions/index.js` → `.tsx`

### `app/components/Views/TransactionSummary/`
- [ ] `app/components/Views/TransactionSummary/index.js` → `.tsx`

### `app/components/Views/TransactionsView/`
- [ ] `app/components/Views/TransactionsView/index.js` → `.tsx`

### `app/components/Views/WalletConnectSessions/`
- [ ] `app/components/Views/WalletConnectSessions/index.js` → `.tsx`

## Batch C — app/components/UI/Swaps (23 files)

### `app/components/UI/Swaps/`
- [ ] `app/components/UI/Swaps/QuotesView.js` → `.tsx`
- [ ] `app/components/UI/Swaps/index.js` → `.tsx`

### `app/components/UI/Swaps/components/`
- [ ] `app/components/UI/Swaps/components/ActionAlert.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/AssetSwapButton.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/GasEditModal.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/Onboarding.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/QuotesModal.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/QuotesSummary.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/SlippageModal.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenIcon.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenIcon.test.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenImportModal.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.test.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/TokenSelectModal.js` → `.tsx`

### `app/components/UI/Swaps/components/LoadingAnimation/`
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` → `.tsx`
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/index.js` → `.tsx`

### `app/components/UI/Swaps/utils/`
- [ ] `app/components/UI/Swaps/utils/index.js` → `.ts`
- [ ] `app/components/UI/Swaps/utils/index.test.js` → `.ts`
- [ ] `app/components/UI/Swaps/utils/useBalance.js` → `.ts`
- [ ] `app/components/UI/Swaps/utils/useBlockExplorer.js` → `.ts`
- [ ] `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` → `.ts`

## Batch D1 — app/components/UI subdirs A–M (34 files)

### `app/components/UI/AccountApproval/`
- [ ] `app/components/UI/AccountApproval/index.js` → `.tsx`

### `app/components/UI/AccountInfoCard/`
- [ ] `app/components/UI/AccountInfoCard/index.js` → `.tsx`

### `app/components/UI/AccountOverview/`
- [ ] `app/components/UI/AccountOverview/index.js` → `.tsx`

### `app/components/UI/ActionModal/ActionContent/`
- [ ] `app/components/UI/ActionModal/ActionContent/index.js` → `.tsx`

### `app/components/UI/ActionModal/`
- [ ] `app/components/UI/ActionModal/index.js` → `.tsx`

### `app/components/UI/ActionView/`
- [ ] `app/components/UI/ActionView/index.js` → `.tsx`

### `app/components/UI/AddCustomToken/`
- [ ] `app/components/UI/AddCustomToken/index.js` → `.tsx`

### `app/components/UI/AddressInputs/`
- [ ] `app/components/UI/AddressInputs/index.js` → `.tsx`
- [ ] `app/components/UI/AddressInputs/index.test.jsx` → `.tsx`

### `app/components/UI/AnimatedSpinner/`
- [ ] `app/components/UI/AnimatedSpinner/index.js` → `.tsx`

### `app/components/UI/AnimatedTransactionModal/`
- [ ] `app/components/UI/AnimatedTransactionModal/index.js` → `.tsx`

### `app/components/UI/AssetList/`
- [ ] `app/components/UI/AssetList/index.js` → `.tsx`

### `app/components/UI/BasicFunctionality/`
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionality.test.js` → `.tsx`

### `app/components/UI/BasicFunctionality/BasicFunctionalityModal/`
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js` → `.tsx`

### `app/components/UI/BrowserBottomBar/`
- [ ] `app/components/UI/BrowserBottomBar/index.js` → `.tsx`

### `app/components/UI/Button/`
- [ ] `app/components/UI/Button/index.js` → `.tsx`

### `app/components/UI/CollectibleContractElement/`
- [ ] `app/components/UI/CollectibleContractElement/index.js` → `.tsx`

### `app/components/UI/CollectibleContractInformation/`
- [ ] `app/components/UI/CollectibleContractInformation/index.js` → `.tsx`

### `app/components/UI/CollectibleContractOverview/`
- [ ] `app/components/UI/CollectibleContractOverview/index.js` → `.tsx`

### `app/components/UI/CollectibleContracts/`
- [ ] `app/components/UI/CollectibleContracts/index.js` → `.tsx`

### `app/components/UI/CollectibleOverview/`
- [ ] `app/components/UI/CollectibleOverview/index.js` → `.tsx`

### `app/components/UI/Collectibles/`
- [ ] `app/components/UI/Collectibles/index.js` → `.tsx`

### `app/components/UI/Confetti/`
- [ ] `app/components/UI/Confetti/index.js` → `.tsx`

### `app/components/UI/CustomAlert/`
- [ ] `app/components/UI/CustomAlert/index.js` → `.tsx`

### `app/components/UI/DrawerView/`
- [ ] `app/components/UI/DrawerView/index.js` → `.tsx`

### `app/components/UI/EditGasFee1559/`
- [ ] `app/components/UI/EditGasFee1559/index.js` → `.tsx`

### `app/components/UI/EditGasFeeLegacy/`
- [ ] `app/components/UI/EditGasFeeLegacy/index.js` → `.tsx`

### `app/components/UI/EthereumAddress/`
- [ ] `app/components/UI/EthereumAddress/index.js` → `.tsx`

### `app/components/UI/FadeAnimationView/`
- [ ] `app/components/UI/FadeAnimationView/index.js` → `.tsx`

### `app/components/UI/FadeOutOverlay/`
- [ ] `app/components/UI/FadeOutOverlay/index.js` → `.tsx`

### `app/components/UI/FoxScreen/`
- [ ] `app/components/UI/FoxScreen/index.js` → `.tsx`

### `app/components/UI/GlobalAlert/`
- [ ] `app/components/UI/GlobalAlert/index.js` → `.tsx`

### `app/components/UI/HintModal/`
- [ ] `app/components/UI/HintModal/index.js` → `.tsx`

### `app/components/UI/ManageNetworks/`
- [ ] `app/components/UI/ManageNetworks/ManageNetworks.test.js` → `.tsx`

## Batch D2 — app/components/UI subdirs N–Z (except Swaps) + lowercase (46 files)

### `app/components/UI/Navbar/`
- [ ] `app/components/UI/Navbar/index.js` → `.tsx`
- [ ] `app/components/UI/Navbar/index.test.jsx` → `.tsx`

### `app/components/UI/NavbarBrowserTitle/`
- [ ] `app/components/UI/NavbarBrowserTitle/index.js` → `.tsx`

### `app/components/UI/NavbarTitle/`
- [ ] `app/components/UI/NavbarTitle/index.js` → `.tsx`
- [ ] `app/components/UI/NavbarTitle/index.test.js` → `.tsx`

### `app/components/UI/NetworkMainAssetLogo/`
- [ ] `app/components/UI/NetworkMainAssetLogo/index.js` → `.tsx`

### `app/components/UI/Notification/BaseNotification/`
- [ ] `app/components/UI/Notification/BaseNotification/index.js` → `.tsx`
- [ ] `app/components/UI/Notification/BaseNotification/index.test.jsx` → `.tsx`

### `app/components/UI/Notification/SimpleNotification/`
- [ ] `app/components/UI/Notification/SimpleNotification/index.js` → `.tsx`

### `app/components/UI/Notification/TransactionNotification/`
- [ ] `app/components/UI/Notification/TransactionNotification/index.js` → `.tsx`

### `app/components/UI/Notification/`
- [ ] `app/components/UI/Notification/index.js` → `.tsx`

### `app/components/UI/OnboardingWizard/Coachmark/`
- [ ] `app/components/UI/OnboardingWizard/Coachmark/index.js` → `.tsx`

### `app/components/UI/OptinMetrics/`
- [ ] `app/components/UI/OptinMetrics/index.js` → `.tsx`

### `app/components/UI/PaymentRequest/`
- [ ] `app/components/UI/PaymentRequest/index.js` → `.tsx`

### `app/components/UI/PaymentRequestSuccess/`
- [ ] `app/components/UI/PaymentRequestSuccess/index.js` → `.tsx`

### `app/components/UI/PhishingModal/`
- [ ] `app/components/UI/PhishingModal/index.js` → `.tsx`

### `app/components/UI/ProtectYourWalletModal/`
- [ ] `app/components/UI/ProtectYourWalletModal/index.js` → `.tsx`

### `app/components/UI/ReceiveRequest/`
- [ ] `app/components/UI/ReceiveRequest/index.js` → `.tsx`

### `app/components/UI/Screen/`
- [ ] `app/components/UI/Screen/index.js` → `.tsx`

### `app/components/UI/SeedphraseModal/`
- [ ] `app/components/UI/SeedphraseModal/index.js` → `.tsx`

### `app/components/UI/SelectComponent/`
- [ ] `app/components/UI/SelectComponent/index.js` → `.tsx`

### `app/components/UI/SettingsDrawer/`
- [ ] `app/components/UI/SettingsDrawer/index.js` → `.tsx`

### `app/components/UI/SettingsNotification/`
- [ ] `app/components/UI/SettingsNotification/index.js` → `.tsx`

### `app/components/UI/SkipAccountSecurityModal/`
- [ ] `app/components/UI/SkipAccountSecurityModal/index.js` → `.tsx`

### `app/components/UI/SliderButton/`
- [ ] `app/components/UI/SliderButton/index.js` → `.tsx`

### `app/components/UI/SlippageSlider/`
- [ ] `app/components/UI/SlippageSlider/index.js` → `.tsx`

### `app/components/UI/StyledButton/`
- [ ] `app/components/UI/StyledButton/index.android.js` → `.tsx`
- [ ] `app/components/UI/StyledButton/index.ios.js` → `.tsx`
- [ ] `app/components/UI/StyledButton/index.js` → `.ts`

### `app/components/UI/SwitchCustomNetwork/`
- [ ] `app/components/UI/SwitchCustomNetwork/index.js` → `.tsx`

### `app/components/UI/Tabs/TabCountIcon/`
- [ ] `app/components/UI/Tabs/TabCountIcon/index.js` → `.tsx`

### `app/components/UI/Tabs/`
- [ ] `app/components/UI/Tabs/index.js` → `.tsx`

### `app/components/UI/TimeEstimateInfoModal/`
- [ ] `app/components/UI/TimeEstimateInfoModal/index.js` → `.tsx`

### `app/components/UI/TokenImage/`
- [ ] `app/components/UI/TokenImage/index.js` → `.tsx`

### `app/components/UI/TransactionActionModal/TransactionActionContent/`
- [ ] `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` → `.tsx`

### `app/components/UI/TransactionActionModal/`
- [ ] `app/components/UI/TransactionActionModal/index.js` → `.tsx`

### `app/components/UI/TransactionElement/TransactionDetails/`
- [ ] `app/components/UI/TransactionElement/TransactionDetails/index.js` → `.tsx`

### `app/components/UI/TransactionElement/`
- [ ] `app/components/UI/TransactionElement/index.js` → `.tsx`
- [ ] `app/components/UI/TransactionElement/utils.js` → `.ts`
- [ ] `app/components/UI/TransactionElement/utils.test.js` → `.ts`

### `app/components/UI/TransactionHeader/`
- [ ] `app/components/UI/TransactionHeader/index.js` → `.tsx`

### `app/components/UI/Transactions/`
- [ ] `app/components/UI/Transactions/index.js` → `.tsx`

### `app/components/UI/WarningExistingUserModal/`
- [ ] `app/components/UI/WarningExistingUserModal/index.js` → `.tsx`

### `app/components/UI/WebsiteIcon/`
- [ ] `app/components/UI/WebsiteIcon/index.js` → `.tsx`

### `app/components/UI/WebviewError/`
- [ ] `app/components/UI/WebviewError/index.js` → `.tsx`

### `app/components/UI/WebviewProgressBar/`
- [ ] `app/components/UI/WebviewProgressBar/index.js` → `.tsx`

## Batch E — app/components/Base + Nav + rest of app/components (15 files)

### `app/components/Base/`
- [ ] `app/components/Base/DetailsModal.js` → `.tsx`
- [ ] `app/components/Base/RangeInput.js` → `.tsx`
- [ ] `app/components/Base/StatusText.js` → `.tsx`
- [ ] `app/components/Base/TabBar.js` → `.tsx`

### `app/components/Base/Keypad/`
- [ ] `app/components/Base/Keypad/Keypad.test.js` → `.tsx`
- [ ] `app/components/Base/Keypad/components.js` → `.tsx`
- [ ] `app/components/Base/Keypad/constants.js` → `.ts`
- [ ] `app/components/Base/Keypad/createKeypadRule.js` → `.ts`
- [ ] `app/components/Base/Keypad/createKeypadRule.test.js` → `.ts`
- [ ] `app/components/Base/Keypad/index.js` → `.tsx`
- [ ] `app/components/Base/Keypad/useCurrency.js` → `.ts`

### `app/components/Base/RemoteImage/`
- [ ] `app/components/Base/RemoteImage/index.js` → `.tsx`

### `app/components/Nav/Main/`
- [ ] `app/components/Nav/Main/MainNavigator.js` → `.tsx`
- [ ] `app/components/Nav/Main/RootRPCMethodsUI.js` → `.tsx`
- [ ] `app/components/Nav/Main/index.js` → `.tsx`

## Batch F — app/store (migrations) (38 files)

### `app/store/migrations/`
- [ ] `app/store/migrations/000.js` → `.ts`
- [ ] `app/store/migrations/001.js` → `.ts`
- [ ] `app/store/migrations/002.js` → `.ts`
- [ ] `app/store/migrations/003.js` → `.ts`
- [ ] `app/store/migrations/004.js` → `.ts`
- [ ] `app/store/migrations/005.js` → `.ts`
- [ ] `app/store/migrations/006.js` → `.ts`
- [ ] `app/store/migrations/007.js` → `.ts`
- [ ] `app/store/migrations/008.js` → `.ts`
- [ ] `app/store/migrations/009.js` → `.ts`
- [ ] `app/store/migrations/010.js` → `.ts`
- [ ] `app/store/migrations/011.js` → `.ts`
- [ ] `app/store/migrations/012.js` → `.ts`
- [ ] `app/store/migrations/013.js` → `.ts`
- [ ] `app/store/migrations/014.js` → `.ts`
- [ ] `app/store/migrations/015.js` → `.ts`
- [ ] `app/store/migrations/016.js` → `.ts`
- [ ] `app/store/migrations/017.js` → `.ts`
- [ ] `app/store/migrations/018.js` → `.ts`
- [ ] `app/store/migrations/019.js` → `.ts`
- [ ] `app/store/migrations/019.test.js` → `.ts`
- [ ] `app/store/migrations/020.js` → `.ts`
- [ ] `app/store/migrations/020.test.js` → `.ts`
- [ ] `app/store/migrations/021.js` → `.ts`
- [ ] `app/store/migrations/021.test.js` → `.ts`
- [ ] `app/store/migrations/022.js` → `.ts`
- [ ] `app/store/migrations/022.test.js` → `.ts`
- [ ] `app/store/migrations/023.js` → `.ts`
- [ ] `app/store/migrations/023.test.js` → `.ts`
- [ ] `app/store/migrations/024.js` → `.ts`
- [ ] `app/store/migrations/024.test.js` → `.ts`
- [ ] `app/store/migrations/025.js` → `.ts`
- [ ] `app/store/migrations/025.test.js` → `.ts`
- [ ] `app/store/migrations/026.js` → `.ts`
- [ ] `app/store/migrations/026.test.js` → `.ts`
- [ ] `app/store/migrations/027.js` → `.ts`
- [ ] `app/store/migrations/027.test.js` → `.ts`
- [ ] `app/store/migrations/028.test.js` → `.ts`

## Batch G — app/util + app/lib + app/constants + app/images + app/__mocks__ (46 files)

### `app/__mocks__/`
- [ ] `app/__mocks__/pngMock.js` → `.ts`
- [ ] `app/__mocks__/react-native-device-info.js` → `.ts`
- [ ] `app/__mocks__/react-native-splash-screen.js` → `.ts`
- [ ] `app/__mocks__/react-native-view-shot.js` → `.ts`
- [ ] `app/__mocks__/rn-fetch-blob.js` → `.ts`
- [ ] `app/__mocks__/svgMock.js` → `.ts`

### `app/constants/`
- [ ] `app/constants/navigation.js` → `.ts`
- [ ] `app/constants/network.js` → `.ts`
- [ ] `app/constants/onboarding.js` → `.ts`

### `app/images/`
- [ ] `app/images/image-icons.js` → `.ts`

### `app/lib/ens-ipfs/contracts/`
- [ ] `app/lib/ens-ipfs/contracts/registry.js` → `.ts`
- [ ] `app/lib/ens-ipfs/contracts/resolver.js` → `.ts`

### `app/lib/ens-ipfs/`
- [ ] `app/lib/ens-ipfs/resolver.js` → `.ts`

### `app/lib/ppom/`
- [ ] `app/lib/ppom/blockaid-version.js` → `.ts`

### `app/util/`
- [ ] `app/util/ENSUtils.js` → `.ts`
- [ ] `app/util/blockies.js` → `.ts`
- [ ] `app/util/confirm-tx.js` → `.ts`
- [ ] `app/util/conversions.js` → `.ts`
- [ ] `app/util/conversions.test.js` → `.ts`
- [ ] `app/util/dapp-url-list.js` → `.ts`
- [ ] `app/util/etherscan.js` → `.ts`
- [ ] `app/util/gasUtils.js` → `.ts`
- [ ] `app/util/middlewares.js` → `.ts`
- [ ] `app/util/payment-link-generator.js` → `.ts`
- [ ] `app/util/scaling.js` → `.ts`
- [ ] `app/util/streams.js` → `.ts`
- [ ] `app/util/walletconnect.js` → `.ts`

### `app/util/confirmation/`
- [ ] `app/util/confirmation/signatureUtils.js` → `.ts`

### `app/util/confusables/`
- [ ] `app/util/confusables/index.js` → `.ts`

### `app/util/conversion/`
- [ ] `app/util/conversion/index.js` → `.ts`

### `app/util/custom-gas/`
- [ ] `app/util/custom-gas/index.js` → `.ts`

### `app/util/date/`
- [ ] `app/util/date/index.js` → `.ts`

### `app/util/device/`
- [ ] `app/util/device/index.js` → `.ts`

### `app/util/general/`
- [ ] `app/util/general/index.js` → `.ts`

### `app/util/networks/`
- [ ] `app/util/networks/index.js` → `.ts`

### `app/util/number/`
- [ ] `app/util/number/index.js` → `.ts`

### `app/util/sentry/`
- [ ] `app/util/sentry/utils.js` → `.ts`

### `app/util/test/`
- [ ] `app/util/test/assetFileTransformer.js` → `.ts`
- [ ] `app/util/test/contract-address-registry.js` → `.ts`
- [ ] `app/util/test/ganache-seeder.js` → `.ts`
- [ ] `app/util/test/ganache.js` → `.ts`
- [ ] `app/util/test/network-store.js` → `.ts`
- [ ] `app/util/test/smart-contracts.js` → `.ts`
- [ ] `app/util/test/testSetup.js` → `.tsx`
- [ ] `app/util/test/utils.js` → `.ts`

### `app/util/transactions/`
- [ ] `app/util/transactions/index.js` → `.ts`

## Batch H — app/core + app/reducers + app/actions (49 files)

### `app/actions/alert/`
- [ ] `app/actions/alert/index.js` → `.ts`

### `app/actions/bookmarks/`
- [ ] `app/actions/bookmarks/index.js` → `.ts`

### `app/actions/browser/`
- [ ] `app/actions/browser/index.js` → `.ts`

### `app/actions/collectibles/`
- [ ] `app/actions/collectibles/index.js` → `.ts`

### `app/actions/infuraAvailability/`
- [ ] `app/actions/infuraAvailability/index.js` → `.ts`

### `app/actions/modals/`
- [ ] `app/actions/modals/index.js` → `.ts`

### `app/actions/notification/`
- [ ] `app/actions/notification/index.js` → `.ts`

### `app/actions/privacy/`
- [ ] `app/actions/privacy/index.js` → `.ts`

### `app/actions/settings/`
- [ ] `app/actions/settings/index.js` → `.ts`

### `app/actions/transaction/`
- [ ] `app/actions/transaction/index.js` → `.ts`

### `app/actions/wizard/`
- [ ] `app/actions/wizard/index.js` → `.ts`

### `app/core/BackgroundBridge/`
- [ ] `app/core/BackgroundBridge/BackgroundBridge.js` → `.ts`
- [ ] `app/core/BackgroundBridge/BackgroundBridge.test.js` → `.ts`

### `app/core/`
- [ ] `app/core/ClipboardManager.js` → `.ts`
- [ ] `app/core/DrawerStatusTracker.js` → `.ts`
- [ ] `app/core/EntryScriptWeb3.js` → `.ts`
- [ ] `app/core/MobilePortStream.js` → `.ts`
- [ ] `app/core/NotificationManager.js` → `.ts`
- [ ] `app/core/PreventScreenshot.js` → `.ts`
- [ ] `app/core/SecureKeychain.js` → `.ts`
- [ ] `app/core/TransactionTypes.js` → `.ts`
- [ ] `app/core/Vault.js` → `.ts`

### `app/core/Permissions/`
- [ ] `app/core/Permissions/specifications.js` → `.ts`
- [ ] `app/core/Permissions/specifications.test.js` → `.ts`

### `app/core/RPCMethods/createEip1193MethodMiddleware/`
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` → `.ts`
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js` → `.ts`

### `app/core/RPCMethods/`
- [ ] `app/core/RPCMethods/eth-request-accounts.js` → `.ts`
- [ ] `app/core/RPCMethods/index.js` → `.ts`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.js` → `.ts`
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.test.js` → `.ts`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.js` → `.ts`
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.test.js` → `.ts`

### `app/core/RPCMethods/handlers/`
- [ ] `app/core/RPCMethods/handlers/index.js` → `.ts`

### `app/core/RPCMethods/lib/`
- [ ] `app/core/RPCMethods/lib/ethereum-chain-utils.js` → `.ts`

### `app/core/WalletConnect/`
- [ ] `app/core/WalletConnect/WalletConnect.js` → `.ts`

### `app/reducers/alert/`
- [ ] `app/reducers/alert/index.js` → `.ts`

### `app/reducers/bookmarks/`
- [ ] `app/reducers/bookmarks/index.js` → `.ts`

### `app/reducers/browser/`
- [ ] `app/reducers/browser/index.js` → `.ts`
- [ ] `app/reducers/browser/index.test.js` → `.ts`

### `app/reducers/collectibles/`
- [ ] `app/reducers/collectibles/index.js` → `.ts`

### `app/reducers/infuraAvailability/`
- [ ] `app/reducers/infuraAvailability/index.js` → `.ts`

### `app/reducers/modals/`
- [ ] `app/reducers/modals/index.js` → `.ts`

### `app/reducers/notification/`
- [ ] `app/reducers/notification/index.js` → `.ts`
- [ ] `app/reducers/notification/notification.test.js` → `.ts`

### `app/reducers/privacy/`
- [ ] `app/reducers/privacy/index.js` → `.ts`

### `app/reducers/settings/`
- [ ] `app/reducers/settings/index.js` → `.ts`

### `app/reducers/swaps/`
- [ ] `app/reducers/swaps/index.js` → `.ts`

### `app/reducers/transaction/`
- [ ] `app/reducers/transaction/index.js` → `.ts`

### `app/reducers/wizard/`
- [ ] `app/reducers/wizard/index.js` → `.ts`

## Batch I1 — e2e/pages (107 files)

### `e2e/pages/Browser/`
- [ ] `e2e/pages/Browser/AddBookmarkView.js` → `.ts`
- [ ] `e2e/pages/Browser/BrowserView.js` → `.ts`
- [ ] `e2e/pages/Browser/ConnectBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Browser/ConnectedAccountsModal.js` → `.ts`
- [ ] `e2e/pages/Browser/ContractApprovalBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Browser/NetworkConnectMultiSelector.js` → `.ts`
- [ ] `e2e/pages/Browser/PermissionSummaryBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Browser/PortfolioHomePage.js` → `.ts`
- [ ] `e2e/pages/Browser/SigningBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Browser/SpamFilterModal.js` → `.ts`
- [ ] `e2e/pages/Browser/TestDApp.js` → `.ts`

### `e2e/pages/Browser/Confirmations/`
- [ ] `e2e/pages/Browser/Confirmations/AlertSystem.js` → `.ts`
- [ ] `e2e/pages/Browser/Confirmations/FooterActions.js` → `.ts`
- [ ] `e2e/pages/Browser/Confirmations/PageSections.js` → `.ts`
- [ ] `e2e/pages/Browser/Confirmations/RequestTypes.js` → `.ts`

### `e2e/pages/`
- [ ] `e2e/pages/CommonView.js` → `.ts`

### `e2e/pages/Confirmation/`
- [ ] `e2e/pages/Confirmation/ConfirmationView.js` → `.ts`

### `e2e/pages/ErrorBoundaryView/`
- [ ] `e2e/pages/ErrorBoundaryView/ErrorBoundaryView.js` → `.ts`

### `e2e/pages/Network/`
- [ ] `e2e/pages/Network/NetworkAddedBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Network/NetworkApprovalBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Network/NetworkEducationModal.js` → `.ts`
- [ ] `e2e/pages/Network/NetworkListModal.js` → `.ts`
- [ ] `e2e/pages/Network/NetworkNonPemittedBottomSheet.js` → `.ts`

### `e2e/pages/Notifications/`
- [ ] `e2e/pages/Notifications/EnableNotificationsModal.js` → `.ts`
- [ ] `e2e/pages/Notifications/NotificationDetailsView.js` → `.ts`
- [ ] `e2e/pages/Notifications/NotificationMenuView.js` → `.ts`
- [ ] `e2e/pages/Notifications/NotificationSettingsView.js` → `.ts`

### `e2e/pages/Onboarding/`
- [ ] `e2e/pages/Onboarding/CreatePasswordView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/EnableAutomaticSecurityChecksView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/EnableDeviceNotificationsAlert.js` → `.ts`
- [ ] `e2e/pages/Onboarding/ExperienceEnhancerBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Onboarding/ImportWalletView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/MetaMetricsOptInView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/OnboardingCarouselView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/OnboardingSuccessView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/OnboardingView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/OnboardingWizardModal.js` → `.ts`
- [ ] `e2e/pages/Onboarding/ProtectYourWalletModal.js` → `.ts`
- [ ] `e2e/pages/Onboarding/ProtectYourWalletView.js` → `.ts`
- [ ] `e2e/pages/Onboarding/SkipAccountSecurityModal.js` → `.ts`
- [ ] `e2e/pages/Onboarding/TermsOfUseModal.js` → `.ts`
- [ ] `e2e/pages/Onboarding/WhatsNewModal.js` → `.ts`

### `e2e/pages/Ramps/`
- [ ] `e2e/pages/Ramps/BuildQuoteView.js` → `.ts`
- [ ] `e2e/pages/Ramps/BuyGetStartedView.js` → `.ts`
- [ ] `e2e/pages/Ramps/QuotesView.js` → `.ts`
- [ ] `e2e/pages/Ramps/SelectCurrencyView.js` → `.ts`
- [ ] `e2e/pages/Ramps/SelectPaymentMethodView.js` → `.ts`
- [ ] `e2e/pages/Ramps/SelectRegionView.js` → `.ts`
- [ ] `e2e/pages/Ramps/SellGetStartedView.js` → `.ts`
- [ ] `e2e/pages/Ramps/TokenSelectBottomSheet.js` → `.ts`

### `e2e/pages/Receive/`
- [ ] `e2e/pages/Receive/PaymentRequestQrBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Receive/RequestPaymentModal.js` → `.ts`
- [ ] `e2e/pages/Receive/RequestPaymentView.js` → `.ts`
- [ ] `e2e/pages/Receive/SendLinkView.js` → `.ts`

### `e2e/pages/Send/`
- [ ] `e2e/pages/Send/AddAddressModal.js` → `.ts`
- [ ] `e2e/pages/Send/AmountView.js` → `.ts`
- [ ] `e2e/pages/Send/SendView.js` → `.ts`
- [ ] `e2e/pages/Send/TransactionConfirmView.js` → `.ts`

### `e2e/pages/Settings/Advanced/`
- [ ] `e2e/pages/Settings/Advanced/FiatOnTestnetsBottomSheet.js` → `.ts`

### `e2e/pages/Settings/`
- [ ] `e2e/pages/Settings/AdvancedView.js` → `.ts`
- [ ] `e2e/pages/Settings/AesCryptoTestForm.js` → `.ts`
- [ ] `e2e/pages/Settings/BackupAndSyncView.js` → `.ts`
- [ ] `e2e/pages/Settings/GeneralView.js` → `.ts`
- [ ] `e2e/pages/Settings/NetworksView.js` → `.ts`
- [ ] `e2e/pages/Settings/SettingsView.js` → `.ts`

### `e2e/pages/Settings/Contacts/`
- [ ] `e2e/pages/Settings/Contacts/AddContactView.js` → `.ts`
- [ ] `e2e/pages/Settings/Contacts/ContactsView.js` → `.ts`
- [ ] `e2e/pages/Settings/Contacts/DeleteContactBottomSheet.js` → `.ts`

### `e2e/pages/Settings/SecurityAndPrivacy/`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/AutoLockModal.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/ChangePasswordView.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/ClearPrivacyModal.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/DeleteWalletModal.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/RevealPrivateKeyView.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/RevealSecretRecoveryPhrase.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/SecurityAndPrivacyView.js` → `.ts`
- [ ] `e2e/pages/Settings/SecurityAndPrivacy/SrpQuizModal.js` → `.ts`

### `e2e/pages/Stake/`
- [ ] `e2e/pages/Stake/StakeConfirmView.js` → `.ts`
- [ ] `e2e/pages/Stake/StakeView.js` → `.ts`

### `e2e/pages/Transactions/`
- [ ] `e2e/pages/Transactions/ActivitiesView.js` → `.ts`
- [ ] `e2e/pages/Transactions/AssetWatchBottomSheet.js` → `.ts`
- [ ] `e2e/pages/Transactions/TransactionDetailsModal.js` → `.ts`

### `e2e/pages/importAccount/`
- [ ] `e2e/pages/importAccount/ImportAccountView.js` → `.ts`
- [ ] `e2e/pages/importAccount/SuccessImportAccountView.js` → `.ts`

### `e2e/pages/importSrp/`
- [ ] `e2e/pages/importSrp/ImportSrpView.js` → `.ts`

### `e2e/pages/swaps/`
- [ ] `e2e/pages/swaps/OnBoarding.js` → `.ts`
- [ ] `e2e/pages/swaps/QuoteView.js` → `.ts`
- [ ] `e2e/pages/swaps/SwapView.js` → `.ts`

### `e2e/pages/wallet/`
- [ ] `e2e/pages/wallet/AccountActionsBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/AccountListBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/AddAccountBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/DetectedTokensView.js` → `.ts`
- [ ] `e2e/pages/wallet/EditAccountNameView.js` → `.ts`
- [ ] `e2e/pages/wallet/LoginView.js` → `.ts`
- [ ] `e2e/pages/wallet/NftDetectionModal.js` → `.ts`
- [ ] `e2e/pages/wallet/SelectNetworkBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/TabBarComponent.js` → `.ts`
- [ ] `e2e/pages/wallet/ToastModal.js` → `.ts`
- [ ] `e2e/pages/wallet/TokenOverview.js` → `.ts`
- [ ] `e2e/pages/wallet/TokenSortBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/WalletActionsBottomSheet.js` → `.ts`
- [ ] `e2e/pages/wallet/WalletView.js` → `.ts`

### `e2e/pages/wallet/ImportNFTFlow/`
- [ ] `e2e/pages/wallet/ImportNFTFlow/ImportNFTView.js` → `.ts`

### `e2e/pages/wallet/ImportTokenFlow/`
- [ ] `e2e/pages/wallet/ImportTokenFlow/ConfirmAddAsset.js` → `.ts`
- [ ] `e2e/pages/wallet/ImportTokenFlow/ImportTokensView.js` → `.ts`

### `e2e/pages/wallet/MultiSrp/AddAccountToSrp/`
- [ ] `e2e/pages/wallet/MultiSrp/AddAccountToSrp/AddNewHdAccountComponent.js` → `.ts`

### `e2e/pages/wallet/MultiSrp/Common/`
- [ ] `e2e/pages/wallet/MultiSrp/Common/SRPListComponent.js` → `.ts`
- [ ] `e2e/pages/wallet/MultiSrp/Common/SRPListItemComponent.js` → `.ts`

## Batch I2 — e2e/selectors (110 files)

### `e2e/selectors/Bridge/`
- [ ] `e2e/selectors/Bridge/BridgeSourceNetworkSelector.selectors.js` → `.ts`

### `e2e/selectors/Browser/`
- [ ] `e2e/selectors/Browser/AccountOverview.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/AddBookmarkView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/AddFavorites.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/BrowserURLBar.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/BrowserView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/ConnectAccountBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/ConnectedAccountModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/ContractApprovalBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/NetworkConnectMultiSelector.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/PermissionSummaryBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/PortfolioPage.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/SigningBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/SpamFilterModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Browser/TestDapp.selectors.js` → `.ts`

### `e2e/selectors/`
- [ ] `e2e/selectors/Common.selectors.js` → `.ts`

### `e2e/selectors/Confirmation/`
- [ ] `e2e/selectors/Confirmation/ConfirmationView.selectors.js` → `.ts`

### `e2e/selectors/ErrorBoundary/`
- [ ] `e2e/selectors/ErrorBoundary/ErrorBoundaryView.selectors.js` → `.ts`

### `e2e/selectors/ImportAccount/`
- [ ] `e2e/selectors/ImportAccount/ImportAccountFromPrivateKey.selectors.js` → `.ts`
- [ ] `e2e/selectors/ImportAccount/SuccessImportAccount.selectors.js` → `.ts`

### `e2e/selectors/MultiSRP/`
- [ ] `e2e/selectors/MultiSRP/AddHdAccount.selectors.js` → `.ts`
- [ ] `e2e/selectors/MultiSRP/SRPImport.selectors.js` → `.ts`
- [ ] `e2e/selectors/MultiSRP/SRPList.selectors.js` → `.ts`
- [ ] `e2e/selectors/MultiSRP/SRPListItem.selectors.js` → `.ts`

### `e2e/selectors/Network/`
- [ ] `e2e/selectors/Network/NetworkAddedBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Network/NetworkApprovalBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Network/NetworkEducationModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Network/NetworkListModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Network/NetworkNonPemittedBottomSheet.selectors.js` → `.ts`

### `e2e/selectors/Notifications/`
- [ ] `e2e/selectors/Notifications/EnableNotificationModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Notifications/NotificationDetailsView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Notifications/NotificationMenuView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Notifications/NotificationSettingsView.selectors.js` → `.ts`

### `e2e/selectors/Onboarding/`
- [ ] `e2e/selectors/Onboarding/ChoosePassword.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/CustomDefaultNetwork.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/EnableAutomaticSecurityChecks.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/EnableDeviceNotificationsAlert.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/ExperienceEnhancerModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/ImportFromSeed.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/ManualBackUpSteps.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/MetaMetricsOptIn.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/Onboarding.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/OnboardingCarousel.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/OnboardingSuccess.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/OnboardingWizardModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/ProtectWalletModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/SkipAccountSecurityModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/TermsOfUseModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Onboarding/WhatsNewModal.selectors.js` → `.ts`

### `e2e/selectors/Ramps/`
- [ ] `e2e/selectors/Ramps/BuildQuote.selectors.js` → `.ts`
- [ ] `e2e/selectors/Ramps/GetStarted.selectors.js` → `.ts`
- [ ] `e2e/selectors/Ramps/Quotes.selectors.js` → `.ts`
- [ ] `e2e/selectors/Ramps/SelectPaymentMethod.selectors.js` → `.ts`
- [ ] `e2e/selectors/Ramps/SelectRegion.selectors.js` → `.ts`
- [ ] `e2e/selectors/Ramps/SelectToken.selectors.js` → `.ts`

### `e2e/selectors/Receive/`
- [ ] `e2e/selectors/Receive/RequestPaymentModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Receive/RequestPaymentView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Receive/SendLinkView.selectors.js` → `.ts`

### `e2e/selectors/SendFlow/`
- [ ] `e2e/selectors/SendFlow/AddAddressModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/AmountView.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/ConfirmView.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/EditGasView.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/SendView.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/TransactionConfirmView.selectors.js` → `.ts`
- [ ] `e2e/selectors/SendFlow/TransactionReview.selectors.js` → `.ts`

### `e2e/selectors/Settings/`
- [ ] `e2e/selectors/Settings/AboutMetaMask.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/AdvancedView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/AesCrypto.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/BackupAndSyncView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/ExperimentalView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/NetworksView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SDK.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SettingsView.selectors.js` → `.ts`

### `e2e/selectors/Settings/Advanced/`
- [ ] `e2e/selectors/Settings/Advanced/FiatOnTestnetsBottomSheet.selectors.js` → `.ts`

### `e2e/selectors/Settings/Contacts/`
- [ ] `e2e/selectors/Settings/Contacts/AddContactView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/Contacts/ContacsView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/Contacts/DeleteContactBottomSheet.selectors.js` → `.ts`

### `e2e/selectors/Settings/SecurityAndPrivacy/`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/AutoLockModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/ChangePasswordView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/ClearPrivacyModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/DataCollectionBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/DeleteWalletModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/RevealSeedView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Settings/SecurityAndPrivacy/SrpQuizModal.selectors.js` → `.ts`

### `e2e/selectors/Stake/`
- [ ] `e2e/selectors/Stake/StakeConfirmView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Stake/StakeView.selectors.js` → `.ts`

### `e2e/selectors/Transactions/`
- [ ] `e2e/selectors/Transactions/ActivitiesView.selectors.js` → `.ts`
- [ ] `e2e/selectors/Transactions/AssetWatcher.selectors.js` → `.ts`
- [ ] `e2e/selectors/Transactions/TransactionDetailsModal.selectors.js` → `.ts`

### `e2e/selectors/swaps/`
- [ ] `e2e/selectors/swaps/OnBoarding.selectors.js` → `.ts`
- [ ] `e2e/selectors/swaps/QuoteView.selectors.js` → `.ts`
- [ ] `e2e/selectors/swaps/SwapsView.selectors.js` → `.ts`

### `e2e/selectors/wallet/`
- [ ] `e2e/selectors/wallet/AccountActionsBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/AccountListBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/AddAccountBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/AddAssetView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/CellComponent.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/DetectedTokensView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/EditAccountName.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/ImportNFTView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/ImportTokenView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/LoginView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/NftDetectionModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/NotificationsView.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/TabBar.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/ToastModal.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/TokenOverview.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/WalletActionsBottomSheet.selectors.js` → `.ts`
- [ ] `e2e/selectors/wallet/WalletView.selectors.js` → `.ts`

## Batch J — e2e/specs (113 files)

### `e2e/specs/accounts/aes/`
- [ ] `e2e/specs/accounts/aes/encryption-with-key.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/aes/encryption-with-password.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/aes/salt-generation.spec.js` → `.ts`

### `e2e/specs/accounts/`
- [ ] `e2e/specs/accounts/auto-lock.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/change-account-name.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/error-boundary-srp-backup.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/import-wallet-account.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/imported-account-remove-and-import.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/reveal-private-key.spec.js` → `.ts`
- [ ] `e2e/specs/accounts/reveal-secret-recovery-phrase.spec.js` → `.ts`

### `e2e/specs/analytics/`
- [ ] `e2e/specs/analytics/helpers.js` → `.ts`
- [ ] `e2e/specs/analytics/onboarding.spec.js` → `.ts`

### `e2e/specs/assets/`
- [ ] `e2e/specs/assets/import-tokens-via-asset-watcher.spec.js` → `.ts`
- [ ] `e2e/specs/assets/import-tokens.spec.js` → `.ts`
- [ ] `e2e/specs/assets/nft-details.spec.js` → `.ts`
- [ ] `e2e/specs/assets/nft-detection-modal.spec.js` → `.ts`
- [ ] `e2e/specs/assets/token-detection-import-all.spec.js` → `.ts`

### `e2e/specs/assets/multichain/`
- [ ] `e2e/specs/assets/multichain/asset-list.spec.js` → `.ts`
- [ ] `e2e/specs/assets/multichain/asset-sort.spec.js` → `.ts`

### `e2e/specs/browser/`
- [ ] `e2e/specs/browser/browser-tests.spec.js` → `.ts`

### `e2e/specs/confirmations-redesigned/signatures/`
- [ ] `e2e/specs/confirmations-redesigned/signatures/alert-system.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations-redesigned/signatures/signatures.spec.js` → `.ts`

### `e2e/specs/confirmations/`
- [ ] `e2e/specs/confirmations/advanced-gas-fees.mock.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/approve-custom-erc20.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/approve-default-erc20.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/approve-erc721.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/batch-transfer-erc1155.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/increase-allowance-erc20.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/security-alert-send-eth.mock.js` → `.ts`
- [ ] `e2e/specs/confirmations/send-erc20-with-dapp.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/send-erc721.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/send-eth.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/send-failing-contract.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/send-to-contract-address.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/set-approval-for-all-erc1155.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/set-approve-for-all-erc721.spec.js` → `.ts`

### `e2e/specs/confirmations/signatures/`
- [ ] `e2e/specs/confirmations/signatures/ethereum-sign.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/signatures/personal-sign.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/signatures/security-alert-signatures.mock.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/signatures/typed-sign-v3.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/signatures/typed-sign-v4.spec.js` → `.ts`
- [ ] `e2e/specs/confirmations/signatures/typed-sign.spec.js` → `.ts`

### `e2e/specs/identity/account-syncing/`
- [ ] `e2e/specs/identity/account-syncing/account-sync-settings-toggle.spec.js` → `.ts`
- [ ] `e2e/specs/identity/account-syncing/mock-data.js` → `.ts`
- [ ] `e2e/specs/identity/account-syncing/sync-after-adding-custom-name-account.spec.js` → `.ts`
- [ ] `e2e/specs/identity/account-syncing/sync-after-onboarding.spec.js` → `.ts`
- [ ] `e2e/specs/identity/account-syncing/sync-with-account-balances.spec.js` → `.ts`

### `e2e/specs/identity/utils/`
- [ ] `e2e/specs/identity/utils/constants.js` → `.ts`
- [ ] `e2e/specs/identity/utils/helpers.js` → `.ts`
- [ ] `e2e/specs/identity/utils/mocks.js` → `.ts`

### `e2e/specs/identity/utils/user-storage/`
- [ ] `e2e/specs/identity/utils/user-storage/generateEncryptedData.js` → `.ts`
- [ ] `e2e/specs/identity/utils/user-storage/userStorageMockttpController.js` → `.ts`
- [ ] `e2e/specs/identity/utils/user-storage/userStorageMockttpController.test.js` → `.ts`

### `e2e/specs/multichain/`
- [ ] `e2e/specs/multichain/permission-system-summary-default-permissions.spec.js` → `.ts`

### `e2e/specs/multichain/permissions/accounts/`
- [ ] `e2e/specs/multichain/permissions/accounts/permission-system-revoke-multiple.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/accounts/permission-system-revoke-single.spec.js` → `.ts`

### `e2e/specs/multichain/permissions/chains/`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-add-non-permitted.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-dapp-chain-switch-grant.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-discard-changes.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-initial-connection.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-remove.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-revoke-single.spec.js` → `.ts`
- [ ] `e2e/specs/multichain/permissions/chains/permission-system-update-permissions.spec.js` → `.ts`

### `e2e/specs/multisrp/`
- [ ] `e2e/specs/multisrp/add-account.spec.js` → `.ts`
- [ ] `e2e/specs/multisrp/export-srp-from-account-actions.spec.js` → `.ts`
- [ ] `e2e/specs/multisrp/export-srp-from-settings.spec.js` → `.ts`
- [ ] `e2e/specs/multisrp/import-srp.spec.js` → `.ts`
- [ ] `e2e/specs/multisrp/utils.js` → `.ts`

### `e2e/specs/networks/`
- [ ] `e2e/specs/networks/add-custom-rpc.spec.js` → `.ts`
- [ ] `e2e/specs/networks/add-popular-networks.spec.js` → `.ts`
- [ ] `e2e/specs/networks/connect-test-network.spec.js` → `.ts`
- [ ] `e2e/specs/networks/networks-search.spec.js` → `.ts`

### `e2e/specs/notifications/`
- [ ] `e2e/specs/notifications/enable-notifications-after-onboarding.spec.js` → `.ts`
- [ ] `e2e/specs/notifications/notification-settings-flow.spec.js` → `.ts`

### `e2e/specs/notifications/utils/`
- [ ] `e2e/specs/notifications/utils/constants.js` → `.ts`
- [ ] `e2e/specs/notifications/utils/helpers.js` → `.ts`
- [ ] `e2e/specs/notifications/utils/mock-user-storage-data.js` → `.ts`
- [ ] `e2e/specs/notifications/utils/mocks.js` → `.ts`

### `e2e/specs/onboarding/`
- [ ] `e2e/specs/onboarding/onboarding-wizard-opt-in.spec.js` → `.ts`
- [ ] `e2e/specs/onboarding/term-of-use.spec.js` → `.ts`

### `e2e/specs/permission-systems/`
- [ ] `e2e/specs/permission-systems/permission-system-delete-wallet.spec.js` → `.ts`

### `e2e/specs/quarantine/`
- [ ] `e2e/specs/quarantine/create-wallet-account.failing.js` → `.ts`
- [ ] `e2e/specs/quarantine/deeplink-to-buy-flow-with-unsupported-network.failing.js` → `.ts`
- [ ] `e2e/specs/quarantine/deeplink-to-buy-flow.spec.js` → `.ts`
- [ ] `e2e/specs/quarantine/deeplinks.failing.js` → `.ts`
- [ ] `e2e/specs/quarantine/edit-recipient-address.failing.js` → `.ts`
- [ ] `e2e/specs/quarantine/permission-system-removing-imported-account.failing.js` → `.ts`
- [ ] `e2e/specs/quarantine/send-to-contact.failing.js` → `.ts`

### `e2e/specs/ramps/`
- [ ] `e2e/specs/ramps/deeplink-to-buy-flow-with-unsupported-network.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/deeplink-to-sell-flow.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/offramp-cashout.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/offramp-token-amount.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/offramp.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/onramp-limits.spec.js` → `.ts`
- [ ] `e2e/specs/ramps/onramp.spec.js` → `.ts`

### `e2e/specs/settings/`
- [ ] `e2e/specs/settings/addressbook-relaunch-app.spec.js` → `.ts`
- [ ] `e2e/specs/settings/addressbook-tests.spec.js` → `.ts`
- [ ] `e2e/specs/settings/clear-privacy-data.spec.js` → `.ts`
- [ ] `e2e/specs/settings/contact-us.spec.js` → `.ts`
- [ ] `e2e/specs/settings/delete-wallet.spec.js` → `.ts`
- [ ] `e2e/specs/settings/example-anvil-e2e.spec.js` → `.ts`
- [ ] `e2e/specs/settings/fiat-on-testnets.spec.js` → `.ts`

### `e2e/specs/stake/`
- [ ] `e2e/specs/stake/stake-action-smoke.spec.js` → `.ts`

### `e2e/specs/swaps/`
- [ ] `e2e/specs/swaps/swap-action-regression.spec.js` → `.ts`
- [ ] `e2e/specs/swaps/swap-action-smoke.spec.js` → `.ts`
- [ ] `e2e/specs/swaps/swap-token-chart.spec.js` → `.ts`
- [ ] `e2e/specs/swaps/token-details.spec.js` → `.ts`

### `e2e/specs/wallet/`
- [ ] `e2e/specs/wallet/carousel.spec.js` → `.ts`
- [ ] `e2e/specs/wallet/incoming-transactions.spec.js` → `.ts`
- [ ] `e2e/specs/wallet/portfolio-connect-account.spec.js` → `.ts`
- [ ] `e2e/specs/wallet/request-token-flow.spec.js` → `.ts`
- [ ] `e2e/specs/wallet/send-ERC-token.spec.js` → `.ts`
- [ ] `e2e/specs/wallet/start-exploring.spec.js` → `.ts`

## Batch K — e2e (root, utils, fixtures, api-mocking, api-specs, resources) (26 files)

### `e2e/api-mocking/`
- [ ] `e2e/api-mocking/api-monitor.js` → `.ts`
- [ ] `e2e/api-mocking/mock-server.js` → `.ts`

### `e2e/api-mocking/mock-config/`
- [ ] `e2e/api-mocking/mock-config/mock-events.js` → `.ts`

### `e2e/api-mocking/mock-responses/`
- [ ] `e2e/api-mocking/mock-responses/auth-mocks.js` → `.ts`
- [ ] `e2e/api-mocking/mock-responses/balance-mocks.js` → `.ts`

### `e2e/api-specs/`
- [ ] `e2e/api-specs/ConfirmationsRejectionRule.js` → `.ts`
- [ ] `e2e/api-specs/helpers.js` → `.ts`
- [ ] `e2e/api-specs/json-rpc-coverage.js` → `.ts`
- [ ] `e2e/api-specs/run-api-spec-tests.js` → `.ts`

### `e2e/`
- [ ] `e2e/create-static-server.js` → `.ts`
- [ ] `e2e/environment.js` → `.ts`
- [ ] `e2e/helpers.js` → `.ts`
- [ ] `e2e/init.js` → `.ts`
- [ ] `e2e/jest.e2e.config.js` → `.ts`
- [ ] `e2e/tags.js` → `.ts`
- [ ] `e2e/tenderly.js` → `.ts`
- [ ] `e2e/viewHelper.js` → `.ts`

### `e2e/fixtures/`
- [ ] `e2e/fixtures/fixture-builder.js` → `.ts`
- [ ] `e2e/fixtures/fixture-helper.js` → `.ts`
- [ ] `e2e/fixtures/fixture-server.js` → `.ts`
- [ ] `e2e/fixtures/utils.js` → `.ts`

### `e2e/resources/`
- [ ] `e2e/resources/networks.e2e.js` → `.ts`

### `e2e/utils/`
- [ ] `e2e/utils/Assertions.js` → `.ts`
- [ ] `e2e/utils/Gestures.js` → `.ts`
- [ ] `e2e/utils/Matchers.js` → `.ts`
- [ ] `e2e/utils/Utilities.js` → `.ts`

## Batch L — wdio/screen-objects (86 files)

### `wdio/screen-objects/`
- [ ] `wdio/screen-objects/AccountListComponent.js` → `.ts`
- [ ] `wdio/screen-objects/ActivityScreen.js` → `.ts`
- [ ] `wdio/screen-objects/AddContact.js` → `.ts`
- [ ] `wdio/screen-objects/AddCustomImportTokensScreen.js` → `.ts`
- [ ] `wdio/screen-objects/AmountScreen.js` → `.ts`
- [ ] `wdio/screen-objects/ChangePasswordScreens.js` → `.ts`
- [ ] `wdio/screen-objects/CommonScreen.js` → `.ts`
- [ ] `wdio/screen-objects/Contacts.js` → `.ts`
- [ ] `wdio/screen-objects/DrawerViewScreen.js` → `.ts`
- [ ] `wdio/screen-objects/EnableSecurityChecksScreen.js` → `.ts`
- [ ] `wdio/screen-objects/ImportAccountScreen.js` → `.ts`
- [ ] `wdio/screen-objects/ImportSuccessScreen.js` → `.ts`
- [ ] `wdio/screen-objects/LoginScreen.js` → `.ts`
- [ ] `wdio/screen-objects/NetworksScreen.js` → `.ts`
- [ ] `wdio/screen-objects/OnboardingSucessScreen.js` → `.ts`
- [ ] `wdio/screen-objects/RequestTokenScreen.js` → `.ts`
- [ ] `wdio/screen-objects/RevealSecretRecoveryPhraseScreen.js` → `.ts`
- [ ] `wdio/screen-objects/SecurityAndPrivacyScreen.js` → `.ts`
- [ ] `wdio/screen-objects/SendLinkScreen.js` → `.ts`
- [ ] `wdio/screen-objects/SendScreen.js` → `.ts`
- [ ] `wdio/screen-objects/SettingsScreen.js` → `.ts`
- [ ] `wdio/screen-objects/TokenOverviewScreen.js` → `.ts`
- [ ] `wdio/screen-objects/TransactionConfirmScreen.js` → `.ts`
- [ ] `wdio/screen-objects/WalletMainScreen.js` → `.ts`

### `wdio/screen-objects/BrowserObject/`
- [ ] `wdio/screen-objects/BrowserObject/AddFavoriteScreen.js` → `.ts`
- [ ] `wdio/screen-objects/BrowserObject/AddressBarScreen.js` → `.ts`
- [ ] `wdio/screen-objects/BrowserObject/BrowserScreen.js` → `.ts`
- [ ] `wdio/screen-objects/BrowserObject/ExternalWebsitesScreen.js` → `.ts`
- [ ] `wdio/screen-objects/BrowserObject/MultiTabScreen.js` → `.ts`
- [ ] `wdio/screen-objects/BrowserObject/OptionMenuModal.js` → `.ts`

### `wdio/screen-objects/Modals/`
- [ ] `wdio/screen-objects/Modals/AccountApprovalModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/AddAccountModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/AddressBookModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/AndroidNativeModals.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/ConnectedAccountsModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/DeleteContactModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/DeleteWalletModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/ExperienceEnhancerModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/NetworkApprovalModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/NetworkEducationModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/NetworkListModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/NotificationModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/OnboardingWizardModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/SkipAccountSecurityModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/TabBarModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/TermOfUseScreen.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/WalletAccountModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/WalletActionModal.js` → `.ts`
- [ ] `wdio/screen-objects/Modals/WhatsNewModal.js` → `.ts`

### `wdio/screen-objects/Onboarding/`
- [ ] `wdio/screen-objects/Onboarding/CreateNewWalletScreen.js` → `.ts`
- [ ] `wdio/screen-objects/Onboarding/ImportFromSeedScreen.js` → `.ts`
- [ ] `wdio/screen-objects/Onboarding/MetaMetricsScreen.js` → `.ts`
- [ ] `wdio/screen-objects/Onboarding/OnboardingCarousel.js` → `.ts`
- [ ] `wdio/screen-objects/Onboarding/OnboardingScreen.js` → `.ts`

### `wdio/screen-objects/testIDs/BrowserScreen/`
- [ ] `wdio/screen-objects/testIDs/BrowserScreen/AddressBar.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/BrowserScreen/ExternalWebsites.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/BrowserScreen/OptionMenu.testIds.js` → `.ts`

### `wdio/screen-objects/testIDs/Components/`
- [ ] `wdio/screen-objects/testIDs/Components/AccountSelector.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/AndroidNativeModals.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/ConnectQRHardware.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/DeleteContactModal.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/DeleteWalletModal.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/MetaMaskAnimation.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/NetworkEducationModalTestIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/NetworkListModal.TestIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/SimpleWebView.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/TermsAndConditions.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Components/Tokens.testIds.js` → `.ts`

### `wdio/screen-objects/testIDs/Screens/`
- [ ] `wdio/screen-objects/testIDs/Screens/AddContact.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/AddressBook.testids.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/AmountScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/ChangePasswordScreensIDs.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/Contacts.testids.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/DrawerView.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/EditGasFeeScreen.testids.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/ImportFromSeedScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/NetworksScreen.testids.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/OptinMetricsScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/SecurityPrivacy.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/SendScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/Settings.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/TransactionConfirm.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/TransactionSummaryScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/WalletSetupScreen.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/WalletView.testIds.js` → `.ts`
- [ ] `wdio/screen-objects/testIDs/Screens/WelcomeScreen.testIds.js` → `.ts`

## Batch M — wdio (step-definitions, utils, config, helpers) + scripts (46 files)

### `scripts/inpage-bridge/src/`
- [ ] `scripts/inpage-bridge/src/MobilePortStream.js` → `.ts`
- [ ] `scripts/inpage-bridge/src/ReactNativePostMessageStream.js` → `.ts`
- [ ] `scripts/inpage-bridge/src/index.js` → `.ts`
- [ ] `scripts/inpage-bridge/src/provider.js` → `.ts`

### `scripts/inpage-bridge/`
- [ ] `scripts/inpage-bridge/webpack.config.js` → `.ts`

### `scripts/`
- [ ] `scripts/metamask-bot-build-announce-bitrise.js` → `.ts`
- [ ] `scripts/start-api-logging-server.js` → `.ts`

### `scripts/testrail/`
- [ ] `scripts/testrail/testrail.api.js` → `.ts`

### `wdio/config/`
- [ ] `wdio/config/android.config.browserstack.js` → `.ts`
- [ ] `wdio/config/android.config.debug.js` → `.ts`
- [ ] `wdio/config/ios.config.browserstack.js` → `.ts`
- [ ] `wdio/config/ios.config.debug.js` → `.ts`

### `wdio/helpers/`
- [ ] `wdio/helpers/Accounts.js` → `.ts`
- [ ] `wdio/helpers/Gestures.js` → `.ts`
- [ ] `wdio/helpers/Selectors.js` → `.ts`

### `wdio/step-definitions/`
- [ ] `wdio/step-definitions/activity-steps.js` → `.ts`
- [ ] `wdio/step-definitions/add-networks.steps.js` → `.ts`
- [ ] `wdio/step-definitions/app-launch-times.steps.js` → `.ts`
- [ ] `wdio/step-definitions/browser-steps.js` → `.ts`
- [ ] `wdio/step-definitions/change-password.steps.js` → `.ts`
- [ ] `wdio/step-definitions/common-steps.js` → `.ts`
- [ ] `wdio/step-definitions/connect-test-network.step.js` → `.ts`
- [ ] `wdio/step-definitions/contacts.steps.js` → `.ts`
- [ ] `wdio/step-definitions/create-new-wallet-account.steps.js` → `.ts`
- [ ] `wdio/step-definitions/delete-wallet-modal-view.steps.js` → `.ts`
- [ ] `wdio/step-definitions/drawer-view.steps.js` → `.ts`
- [ ] `wdio/step-definitions/enable-automatic-security-checks.steps.js` → `.ts`
- [ ] `wdio/step-definitions/import-tokens.steps.js` → `.ts`
- [ ] `wdio/step-definitions/import-wallet-via-private-key.steps.js` → `.ts`
- [ ] `wdio/step-definitions/lock-reset-wallet.steps.js` → `.ts`
- [ ] `wdio/step-definitions/login-view.steps.js` → `.ts`
- [ ] `wdio/step-definitions/onboarding.steps.js` → `.ts`
- [ ] `wdio/step-definitions/request-token.steps.js` → `.ts`
- [ ] `wdio/step-definitions/reveal-private-credential.steps.js` → `.ts`
- [ ] `wdio/step-definitions/revoke-single-account.steps.js` → `.ts`
- [ ] `wdio/step-definitions/security-and-privacy-delete-wallet.steps.js` → `.ts`
- [ ] `wdio/step-definitions/security-and-privacy-remember-me.steps.js` → `.ts`
- [ ] `wdio/step-definitions/security-and-privacy.steps.js` → `.ts`
- [ ] `wdio/step-definitions/send-flow.steps.js` → `.ts`
- [ ] `wdio/step-definitions/start-exploring.steps.js` → `.ts`
- [ ] `wdio/step-definitions/terms-of-use.steps.js` → `.ts`
- [ ] `wdio/step-definitions/wallet-view.steps.js` → `.ts`

### `wdio/utils/`
- [ ] `wdio/utils/ganache.js` → `.ts`
- [ ] `wdio/utils/generateTestId.js` → `.ts`
- [ ] `wdio/utils/generateTestReports.js` → `.ts`
- [ ] `wdio/utils/mocks.js` → `.ts`

