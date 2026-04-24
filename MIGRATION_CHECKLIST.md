# JS → TS Migration Work Breakdown

Generated: 2026-04-24

## Summary

| Category | Source Files | Test Files | Total |
|----------|-------------|------------|-------|
| **app/** (all) | 291 | 40 | **331** |
| **e2e/** | 356 | — | **356** |
| **wdio/** | 124 | — | **124** |
| **scripts/** | 8 | — | **8** |
| **locales/** | 2 | 1 | **3** |
| **ppom/** | 8 | 1 | **9** |
| **.storybook/** | 5 | — | **5** |
| **Root config** | 13 | — | **13** |
| **Grand Total** | | | **849** |

---

## Phase 0: Foundation (this PR)

- [x] `MIGRATION_GUIDE.md` — conventions doc
- [x] `MIGRATION_CHECKLIST.md` — this file
- [x] Verify `tsconfig.json` — `strict: true`, `allowJs: true`, `jsx: react-native` ✓

---

## Phase 1: Leaf Modules (no internal dependents) — 5 parallel Devins

### Playbook 1 — Redux Actions (11 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/actions/alert/index.js` | Simple |
| 2 | `app/actions/bookmarks/index.js` | Simple |
| 3 | `app/actions/browser/index.js` | Simple |
| 4 | `app/actions/collectibles/index.js` | Simple |
| 5 | `app/actions/infuraAvailability/index.js` | Simple |
| 6 | `app/actions/modals/index.js` | Simple |
| 7 | `app/actions/notification/index.js` | Simple |
| 8 | `app/actions/privacy/index.js` | Simple |
| 9 | `app/actions/settings/index.js` | Simple |
| 10 | `app/actions/transaction/index.js` | Simple |
| 11 | `app/actions/wizard/index.js` | Simple |

**Reference**: `app/actions/onboarding/index.ts`

### Playbook 10 — Constants, Navigation, Lib & Mocks (17 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/constants/navigation.js` | Simple |
| 2 | `app/constants/network.js` | Simple |
| 3 | `app/constants/onboarding.js` | Simple |
| 4 | `app/components/Nav/Main/MainNavigator.js` | Medium |
| 5 | `app/components/Nav/Main/index.js` | Medium |
| 6 | `app/components/Nav/Main/RootRPCMethodsUI.js` | Complex |
| 7 | `app/lib/ens-ipfs/contracts/registry.js` | Simple |
| 8 | `app/lib/ens-ipfs/contracts/resolver.js` | Simple |
| 9 | `app/lib/ens-ipfs/resolver.js` | Medium |
| 10 | `app/lib/ppom/blockaid-version.js` | Simple |
| 11 | `app/__mocks__/pngMock.js` | Simple |
| 12 | `app/__mocks__/react-native-device-info.js` | Simple |
| 13 | `app/__mocks__/react-native-splash-screen.js` | Simple |
| 14 | `app/__mocks__/react-native-view-shot.js` | Simple |
| 15 | `app/__mocks__/rn-fetch-blob.js` | Simple |
| 16 | `app/__mocks__/svgMock.js` | Simple |
| 17 | `app/images/image-icons.js` | Simple |

**Reference**: `app/constants/urls.ts`, `app/constants/bridge.ts`

---

## Phase 2: Redux Reducers (depends on Playbook 1) — 1 Devin

### Playbook 2 — Redux Reducers (12 source + 2 test files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/reducers/alert/index.js` | Simple |
| 2 | `app/reducers/bookmarks/index.js` | Simple |
| 3 | `app/reducers/browser/index.js` | Simple |
| 4 | `app/reducers/collectibles/index.js` | Simple |
| 5 | `app/reducers/infuraAvailability/index.js` | Simple |
| 6 | `app/reducers/modals/index.js` | Simple |
| 7 | `app/reducers/notification/index.js` | Simple |
| 8 | `app/reducers/privacy/index.js` | Simple |
| 9 | `app/reducers/settings/index.js` | Medium |
| 10 | `app/reducers/swaps/index.js` | Medium |
| 11 | `app/reducers/transaction/index.js` | Simple |
| 12 | `app/reducers/wizard/index.js` | Simple |
| T1 | `app/reducers/browser/index.test.js` | Simple |
| T2 | `app/reducers/notification/notification.test.js` | Simple |

**Reference**: `app/reducers/security/index.ts`

---

## Phase 3: Migrations & Utilities (parallel) — 2 Devins

### Playbook 3 — Store Migrations (28 source + 10 test files)

| # | File | Complexity |
|---|------|-----------|
| 1–18 | `app/store/migrations/000.js` through `018.js` | Simple–Medium |
| 19–27 | `app/store/migrations/019.js` through `027.js` | Medium |
| T1 | `app/store/migrations/028.test.js` | Simple |
| T2–T10 | `app/store/migrations/019.test.js` through `027.test.js` | Simple |

**Reference**: `app/store/migrations/028.ts`

### Playbook 6 — Utility Functions (23 source + 1 test file)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/util/ENSUtils.js` | Medium |
| 2 | `app/util/blockies.js` | Simple |
| 3 | `app/util/confirm-tx.js` | Medium |
| 4 | `app/util/conversions.js` | Complex |
| 5 | `app/util/dapp-url-list.js` | Simple |
| 6 | `app/util/etherscan.js` | Simple |
| 7 | `app/util/gasUtils.js` | Complex |
| 8 | `app/util/middlewares.js` | Medium |
| 9 | `app/util/payment-link-generator.js` | Medium |
| 10 | `app/util/scaling.js` | Simple |
| 11 | `app/util/streams.js` | Medium |
| 12 | `app/util/walletconnect.js` | Medium |
| 13 | `app/util/conversion/index.js` | Complex |
| 14 | `app/util/custom-gas/index.js` | Complex |
| 15 | `app/util/date/index.js` | Simple |
| 16 | `app/util/device/index.js` | Simple |
| 17 | `app/util/general/index.js` | Simple |
| 18 | `app/util/number/index.js` | Medium |
| 19 | `app/util/networks/index.js` | Medium |
| 20 | `app/util/transactions/index.js` | Complex |
| 21 | `app/util/confusables/index.js` | Simple |
| 22 | `app/util/sentry/utils.js` | Medium |
| 23 | `app/util/confirmation/signatureUtils.js` | Medium |
| T1 | `app/util/conversions.test.js` | Simple |

**Reference**: `app/util/string/index.ts`, `app/util/date/index.ts`

---

## Phase 4: Core Services (parallel) — 2 Devins

### Playbook 4 — Core Services & Singletons (11 source + 1 test file)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/core/TransactionTypes.js` | Simple |
| 2 | `app/core/DrawerStatusTracker.js` | Simple |
| 3 | `app/core/ClipboardManager.js` | Simple |
| 4 | `app/core/PreventScreenshot.js` | Medium |
| 5 | `app/core/MobilePortStream.js` | Medium |
| 6 | `app/core/EntryScriptWeb3.js` | Medium |
| 7 | `app/core/SecureKeychain.js` | Complex |
| 8 | `app/core/Vault.js` | Complex |
| 9 | `app/core/NotificationManager.js` | Complex |
| 10 | `app/core/BackgroundBridge/BackgroundBridge.js` | Complex |
| 11 | `app/core/WalletConnect/WalletConnect.js` | Complex |
| T1 | `app/core/BackgroundBridge/BackgroundBridge.test.js` | Medium |

**Reference**: `app/core/Authentication/Authentication.ts`

### Playbook 5 — RPC Methods & Permissions (8 source + 4 test files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/core/RPCMethods/index.js` | Medium |
| 2 | `app/core/RPCMethods/eth-request-accounts.js` | Simple |
| 3 | `app/core/RPCMethods/wallet_addEthereumChain.js` | Complex |
| 4 | `app/core/RPCMethods/wallet_switchEthereumChain.js` | Complex |
| 5 | `app/core/RPCMethods/handlers/index.js` | Simple |
| 6 | `app/core/RPCMethods/lib/ethereum-chain-utils.js` | Medium |
| 7 | `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` | Complex |
| 8 | `app/core/RPCMethods/createEthAccountsMethodMiddleware.js` | Medium |
| 9 | `app/core/Permissions/specifications.js` | Complex |
| T1 | `app/core/RPCMethods/wallet_addEthereumChain.test.js` | Medium |
| T2 | `app/core/RPCMethods/wallet_switchEthereumChain.test.js` | Medium |
| T3 | `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js` | Medium |
| T4 | `app/core/Permissions/specifications.test.js` | Medium |

**Reference**: `app/core/RPCMethods/RPCMethodMiddleware.ts`

---

## Phase 5: Simple UI Components — 1 Devin

### Playbook 7 — Simple UI Components (~30 source files)

Presentational components in `app/components/UI/` and `app/components/Base/`:

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/components/UI/AnimatedSpinner/index.js` | Simple |
| 2 | `app/components/UI/Button/index.js` | Simple |
| 3 | `app/components/UI/Screen/index.js` | Simple |
| 4 | `app/components/UI/SliderButton/index.js` | Simple |
| 5 | `app/components/UI/FadeOutOverlay/index.js` | Simple |
| 6 | `app/components/UI/FoxScreen/index.js` | Simple |
| 7 | `app/components/UI/WebviewProgressBar/index.js` | Simple |
| 8 | `app/components/UI/EthereumAddress/index.js` | Simple |
| 9 | `app/components/UI/FadeAnimationView/index.js` | Simple |
| 10 | `app/components/UI/WebsiteIcon/index.js` | Simple |
| 11 | `app/components/UI/WebviewError/index.js` | Simple |
| 12 | `app/components/UI/Confetti/index.js` | Simple |
| 13 | `app/components/UI/CustomAlert/index.js` | Simple |
| 14 | `app/components/UI/HintModal/index.js` | Simple |
| 15 | `app/components/UI/TokenImage/index.js` | Simple |
| 16 | `app/components/UI/NetworkMainAssetLogo/index.js` | Simple |
| 17 | `app/components/UI/NavbarBrowserTitle/index.js` | Simple |
| 18 | `app/components/UI/NavbarTitle/index.js` | Simple |
| 19 | `app/components/UI/SettingsDrawer/index.js` | Simple |
| 20 | `app/components/UI/SettingsNotification/index.js` | Simple |
| 21 | `app/components/UI/ActionView/index.js` | Simple |
| 22 | `app/components/UI/SelectComponent/index.js` | Medium |
| 23 | `app/components/UI/PhishingModal/index.js` | Simple |
| 24 | `app/components/UI/ProtectYourWalletModal/index.js` | Simple |
| 25 | `app/components/UI/SeedphraseModal/index.js` | Simple |
| 26 | `app/components/UI/SkipAccountSecurityModal/index.js` | Simple |
| 27 | `app/components/UI/WarningExistingUserModal/index.js` | Simple |
| 28 | `app/components/UI/StyledButton/index.js` | Simple |
| 29 | `app/components/UI/StyledButton/index.android.js` | Simple |
| 30 | `app/components/UI/StyledButton/index.ios.js` | Simple |
| 31 | `app/components/UI/TransactionHeader/index.js` | Simple |
| 32 | `app/components/UI/OnboardingWizard/Coachmark/index.js` | Medium |
| 33 | `app/components/UI/SlippageSlider/index.js` | Simple |
| 34 | `app/components/UI/TimeEstimateInfoModal/index.js` | Simple |
| 35 | `app/components/UI/BrowserBottomBar/index.js` | Simple |
| 36 | `app/components/UI/AddressInputs/index.js` | Simple |
| 37 | `app/components/UI/AnimatedTransactionModal/index.js` | Medium |
| 38 | `app/components/UI/AssetList/index.js` | Simple |
| 39 | `app/components/UI/Tabs/TabCountIcon/index.js` | Simple |
| 40 | `app/components/UI/SwitchCustomNetwork/index.js` | Simple |
| 41 | `app/components/Base/DetailsModal.js` | Simple |
| 42 | `app/components/Base/Keypad/components.js` | Simple |
| 43 | `app/components/Base/Keypad/constants.js` | Simple |
| 44 | `app/components/Base/Keypad/createKeypadRule.js` | Simple |
| 45 | `app/components/Base/Keypad/index.js` | Medium |
| 46 | `app/components/Base/Keypad/useCurrency.js` | Medium |
| 47 | `app/components/Base/RangeInput.js` | Simple |
| 48 | `app/components/Base/RemoteImage/index.js` | Medium |
| 49 | `app/components/Base/StatusText.js` | Simple |
| 50 | `app/components/Base/TabBar.js` | Simple |

---

## Phase 6: Complex UI Components — 2 Devins

### Playbook 8A — Complex UI Components Part 1 (~25 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/components/UI/AccountApproval/index.js` | Complex |
| 2 | `app/components/UI/AccountInfoCard/index.js` | Medium |
| 3 | `app/components/UI/AccountOverview/index.js` | Complex |
| 4 | `app/components/UI/ActionModal/index.js` | Medium |
| 5 | `app/components/UI/ActionModal/ActionContent/index.js` | Simple |
| 6 | `app/components/UI/AddCustomToken/index.js` | Complex |
| 7 | `app/components/UI/CollectibleContractElement/index.js` | Medium |
| 8 | `app/components/UI/CollectibleContractInformation/index.js` | Simple |
| 9 | `app/components/UI/CollectibleContractOverview/index.js` | Medium |
| 10 | `app/components/UI/CollectibleContracts/index.js` | Complex |
| 11 | `app/components/UI/CollectibleOverview/index.js` | Medium |
| 12 | `app/components/UI/Collectibles/index.js` | Medium |
| 13 | `app/components/UI/DrawerView/index.js` | Complex |
| 14 | `app/components/UI/EditGasFee1559/index.js` | Complex |
| 15 | `app/components/UI/EditGasFeeLegacy/index.js` | Complex |
| 16 | `app/components/UI/GlobalAlert/index.js` | Simple |
| 17 | `app/components/UI/Navbar/index.js` | Complex |
| 18 | `app/components/UI/Notification/BaseNotification/index.js` | Medium |
| 19 | `app/components/UI/Notification/SimpleNotification/index.js` | Simple |
| 20 | `app/components/UI/Notification/TransactionNotification/index.js` | Complex |
| 21 | `app/components/UI/Notification/index.js` | Medium |
| 22 | `app/components/UI/OptinMetrics/index.js` | Complex |
| 23 | `app/components/UI/PaymentRequest/index.js` | Complex |
| 24 | `app/components/UI/PaymentRequestSuccess/index.js` | Medium |
| 25 | `app/components/UI/ReceiveRequest/index.js` | Complex |

### Playbook 8B — Swaps & Transactions (~20 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/components/UI/Swaps/index.js` | Complex |
| 2 | `app/components/UI/Swaps/QuotesView.js` | Complex |
| 3 | `app/components/UI/Swaps/utils/index.js` | Medium |
| 4 | `app/components/UI/Swaps/utils/useBalance.js` | Simple |
| 5 | `app/components/UI/Swaps/utils/useBlockExplorer.js` | Simple |
| 6 | `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` | Medium |
| 7 | `app/components/UI/Swaps/components/ActionAlert.js` | Simple |
| 8 | `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` | Medium |
| 9 | `app/components/UI/Swaps/components/AssetSwapButton.js` | Simple |
| 10 | `app/components/UI/Swaps/components/GasEditModal.js` | Medium |
| 11 | `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` | Simple |
| 12 | `app/components/UI/Swaps/components/LoadingAnimation/index.js` | Simple |
| 13 | `app/components/UI/Swaps/components/Onboarding.js` | Simple |
| 14 | `app/components/UI/Swaps/components/QuotesModal.js` | Medium |
| 15 | `app/components/UI/Swaps/components/QuotesSummary.js` | Simple |
| 16 | `app/components/UI/Swaps/components/SlippageModal.js` | Medium |
| 17 | `app/components/UI/Swaps/components/TokenIcon.js` | Simple |
| 18 | `app/components/UI/Swaps/components/TokenImportModal.js` | Medium |
| 19 | `app/components/UI/Swaps/components/TokenSelectButton.js` | Simple |
| 20 | `app/components/UI/Swaps/components/TokenSelectModal.js` | Complex |
| 21 | `app/components/UI/Tabs/index.js` | Medium |
| 22 | `app/components/UI/TransactionActionModal/index.js` | Medium |
| 23 | `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` | Simple |
| 24 | `app/components/UI/TransactionElement/index.js` | Complex |
| 25 | `app/components/UI/TransactionElement/TransactionDetails/index.js` | Complex |
| 26 | `app/components/UI/TransactionElement/utils.js` | Medium |
| 27 | `app/components/UI/Transactions/index.js` | Complex |

---

## Phase 7: View Components — 2 Devins

### Playbook 9A — Standalone Views (~30 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/components/Views/Browser/index.js` | Complex |
| 2 | `app/components/Views/Asset/index.js` | Complex |
| 3 | `app/components/Views/Onboarding/index.js` | Complex |
| 4 | `app/components/Views/ChoosePassword/index.js` | Complex |
| 5 | `app/components/Views/LockScreen/index.js` | Complex |
| 6 | `app/components/Views/AccountBackupStep1/index.js` | Medium |
| 7 | `app/components/Views/AccountBackupStep1B/index.js` | Medium |
| 8 | `app/components/Views/ManualBackupStep1/index.js` | Medium |
| 9 | `app/components/Views/ManualBackupStep2/index.js` | Medium |
| 10 | `app/components/Views/ManualBackupStep3/index.js` | Medium |
| 11 | `app/components/Views/Settings/GeneralSettings/index.js` | Complex |
| 12 | `app/components/Views/Settings/AdvancedSettings/index.js` | Complex |
| 13 | `app/components/Views/Settings/Contacts/index.js` | Medium |
| 14 | `app/components/Views/Settings/Contacts/ContactForm/index.js` | Medium |
| 15 | `app/components/Views/Settings/NetworksSettings/index.js` | Complex |
| 16 | `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` | Complex |
| 17 | `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` | Simple |
| 18 | `app/components/Views/Settings/AppInformation/index.js` | Simple |
| 19 | `app/components/Views/ActivityView/index.js` | Medium |
| 20 | `app/components/Views/Collectible/index.js` | Medium |
| 21 | `app/components/Views/CollectibleView/index.js` | Medium |
| 22 | `app/components/Views/AddBookmark/index.js` | Simple |
| 23 | `app/components/Views/AddressQRCode/index.js` | Simple |
| 24 | `app/components/Views/EnterPasswordSimple/index.js` | Simple |
| 25 | `app/components/Views/ErrorBoundary/index.js` | Medium |
| 26 | `app/components/Views/GasEducationCarousel/index.js` | Simple |
| 27 | `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` | Complex |
| 28 | `app/components/Views/ImportPrivateKeySuccess/index.js` | Simple |
| 29 | `app/components/Views/MediaPlayer/index.js` | Medium |
| 30 | `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` | Medium |
| 31 | `app/components/Views/NavigationUnitTest/index.js` | Simple |
| 32 | `app/components/Views/OfflineMode/index.js` | Simple |
| 33 | `app/components/Views/ResetPassword/index.js` | Complex |
| 34 | `app/components/Views/SimpleWebview/index.js` | Simple |
| 35 | `app/components/Views/TermsAndConditions/index.js` | Simple |
| 36 | `app/components/Views/TransactionSummary/index.js` | Medium |
| 37 | `app/components/Views/TransactionsView/index.js` | Medium |
| 38 | `app/components/Views/WalletConnectSessions/index.js` | Medium |

### Playbook 9B — Legacy Confirmations (~25 files)

| # | File | Complexity |
|---|------|-----------|
| 1 | `app/components/Views/confirmations/legacy/Approval/index.js` | Complex |
| 2 | `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` | Complex |
| 3 | `app/components/Views/confirmations/legacy/Approve/index.js` | Complex |
| 4 | `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` | Complex |
| 5 | `app/components/Views/confirmations/legacy/Send/index.js` | Complex |
| 6 | `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx` | Complex |
| 7 | `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` | Simple |
| 8 | `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` | Complex |
| 9 | `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` | Complex |
| 10 | `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx` | Complex |
| 11 | `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` | Simple |
| 12 | `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` | Simple |
| 13 | `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` | Complex |
| 14 | `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` | Medium |
| 15 | `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` | Simple |
| 16 | `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` | Complex |
| 17 | `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` | Simple |
| 18 | `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx` | Complex |
| 19 | `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx` | Complex |
| 20 | `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` | Complex |
| 21 | `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` | Medium |
| 22 | `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` | Complex |
| 23 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` | Medium |
| 24 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` | Medium |
| 25 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` | Complex |
| 26 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` | Complex |
| 27 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` | Simple |
| 28 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` | Complex |
| 29 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` | Simple |
| 30 | `app/components/Views/confirmations/legacy/components/TypedSign/index.js` | Complex |
| 31 | `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx` | Complex |
| 32 | `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` | Medium |
| 33 | `app/components/Views/confirmations/mock-data.js` | Simple |

---

## Phase 8: Test Files & Test Utilities — 3 Devins

### Devin R: e2e/ — Detox tests (356 files)
### Devin S: wdio/ — WebDriverIO tests (124 files)
### Devin T: app/ test files + test utilities (40 + 8 = 48 files)

Test utility files in `app/util/test/`:

| # | File |
|---|------|
| 1 | `app/util/test/assetFileTransformer.js` |
| 2 | `app/util/test/contract-address-registry.js` |
| 3 | `app/util/test/ganache-seeder.js` |
| 4 | `app/util/test/ganache.js` |
| 5 | `app/util/test/network-store.js` |
| 6 | `app/util/test/smart-contracts.js` |
| 7 | `app/util/test/testSetup.js` |
| 8 | `app/util/test/utils.js` |

---

## Phase 9: External Files — 2 Devins

### scripts/ (8 files)

| # | File |
|---|------|
| 1 | `scripts/inpage-bridge/src/MobilePortStream.js` |
| 2 | `scripts/inpage-bridge/src/ReactNativePostMessageStream.js` |
| 3 | `scripts/inpage-bridge/src/index.js` |
| 4 | `scripts/inpage-bridge/src/provider.js` |
| 5 | `scripts/inpage-bridge/webpack.config.js` |
| 6 | `scripts/metamask-bot-build-announce-bitrise.js` |
| 7 | `scripts/start-api-logging-server.js` |
| 8 | `scripts/testrail/testrail.api.js` |

### locales/, ppom/, .storybook/ (17 files)

| # | File |
|---|------|
| 1 | `locales/i18n.js` |
| 2 | `locales/i18n.test.js` |
| 3 | `locales/update-script.js` |
| 4 | `ppom/.eslintrc.js` |
| 5 | `ppom/src/blockaid-version.js` |
| 6 | `ppom/src/index.js` |
| 7 | `ppom/src/invoke-lib.js` |
| 8 | `ppom/src/ppom.html.js` |
| 9 | `ppom/src/ppom.js` |
| 10 | `ppom/webpack.config.html-js.js` |
| 11 | `ppom/webpack.config.html.js` |
| 12 | `ppom/webpack.config.version.js` |
| 13 | `.storybook/index.js` |
| 14 | `.storybook/main.js` |
| 15 | `.storybook/preview.js` |
| 16 | `.storybook/storybook-store.js` |
| 17 | `.storybook/storybook.requires.js` |

---

## Phase 10: Root Config & Finalization — 1 Devin

### Root config files (13 files — may remain JS for tooling compatibility)

| # | File | Notes |
|---|------|-------|
| 1 | `.detoxrc.js` | Detox config — keep JS |
| 2 | `.eslintrc.js` | ESLint config — keep JS |
| 3 | `.prettierrc.js` | Prettier config — keep JS |
| 4 | `app.config.js` | Expo config — keep JS |
| 5 | `babel.config.js` | Babel config — keep JS |
| 6 | `babel.config.tests.js` | Babel config — keep JS |
| 7 | `index.js` | RN entrypoint — keep JS |
| 8 | `jest.config.js` | Jest config — keep JS |
| 9 | `metro.config.js` | Metro bundler — keep JS |
| 10 | `metro.transform.js` | Metro transform — keep JS |
| 11 | `react-native.config.js` | RN config — keep JS |
| 12 | `shim.js` | Polyfills — keep JS |
| 13 | `wdio.conf.js` | WebDriverIO config — keep JS |

> **Note**: Root config files are typically required to remain `.js` for tooling compatibility. These should be reviewed individually.

### Finalization tasks
- [ ] Remove `"allowJs": true` from `tsconfig.json`
- [ ] Run `tsc --noEmit` across entire project
- [ ] Run full test suite
- [ ] Remove leftover `PropTypes` imports
- [ ] Audit remaining `any` usage
- [ ] Update `.eslintrc` to enforce `.ts`/`.tsx` for new files

---

## Estimated Parallelism

| Phase | Parallel Devins | Files | Description |
|-------|----------------|-------|-------------|
| 0 | 1 | 2 new | Foundation (this PR) |
| 1 | 2 | 28 | Actions + Constants/Nav/Mocks |
| 2 | 1 | 14 | Reducers |
| 3 | 2 | 62 | Migrations + Utilities |
| 4 | 2 | 24 | Core Services + RPC Methods |
| 5 | 1 | 50 | Simple UI Components |
| 6 | 2 | 52 | Complex UI Components |
| 7 | 2 | 71 | View Components |
| 8 | 3 | 528 | Test files (e2e + wdio + app tests) |
| 9 | 2 | 25 | Scripts + locales/ppom/storybook |
| 10 | 1 | 13 | Root config review + finalization |
| **Total** | ~15-20 | **849** | |
