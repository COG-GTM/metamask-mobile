# JS→TS Migration File Inventory

Generated: 2026-05-13 21:17 UTC

## Summary

| Area | .js/.jsx files | .ts/.tsx files | Migration % |
|------|---------------|---------------|-------------|
| app/ | 331 | 3938 | 92.2% |
| e2e/ | 356 | 4 | 1.1% |
| wdio/ | 124 | 1 | .8% |
| scripts/ | 8 | 0 | 0% |

## app/ Directory Breakdown by Workstream

### Workstream A — Redux Layer

#### A1 — Redux Store, Root Reducer, Middleware
Already TypeScript: app/store/index.ts, app/reducers/index.ts

#### A2/A3 — Redux Reducers (source files only)

| File | Type |
|------|------|
| `app/reducers/alert/index.js` | source |
| `app/reducers/bookmarks/index.js` | source |
| `app/reducers/browser/index.js` | source |
| `app/reducers/collectibles/index.js` | source |
| `app/reducers/infuraAvailability/index.js` | source |
| `app/reducers/modals/index.js` | source |
| `app/reducers/notification/index.js` | source |
| `app/reducers/privacy/index.js` | source |
| `app/reducers/settings/index.js` | source |
| `app/reducers/swaps/index.js` | source |
| `app/reducers/transaction/index.js` | source |
| `app/reducers/wizard/index.js` | source |

Reducer test files:

- `app/reducers/browser/index.test.js`
- `app/reducers/notification/notification.test.js`

#### A4 — Redux Selectors
Note: Most selectors are already .ts files.

#### A5 — Redux Actions

| File |
|------|
| `app/actions/alert/index.js` |
| `app/actions/bookmarks/index.js` |
| `app/actions/browser/index.js` |
| `app/actions/collectibles/index.js` |
| `app/actions/infuraAvailability/index.js` |
| `app/actions/modals/index.js` |
| `app/actions/notification/index.js` |
| `app/actions/privacy/index.js` |
| `app/actions/settings/index.js` |
| `app/actions/transaction/index.js` |
| `app/actions/wizard/index.js` |

**Total: 11 files**

### Workstream B — Core Engine & Services

#### B1 — Core Engine
Note: app/core/Engine/ is already TypeScript.

#### B2/B3 — Core Services, Utilities

| File | Complexity |
|------|-----------|
| `app/core/BackgroundBridge/BackgroundBridge.js` | — |
| `app/core/ClipboardManager.js` | — |
| `app/core/DrawerStatusTracker.js` | — |
| `app/core/EntryScriptWeb3.js` | — |
| `app/core/MobilePortStream.js` | — |
| `app/core/NotificationManager.js` | — |
| `app/core/Permissions/specifications.js` | — |
| `app/core/PreventScreenshot.js` | — |
| `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` | — |
| `app/core/RPCMethods/eth-request-accounts.js` | — |
| `app/core/RPCMethods/handlers/index.js` | — |
| `app/core/RPCMethods/index.js` | — |
| `app/core/RPCMethods/lib/ethereum-chain-utils.js` | — |
| `app/core/RPCMethods/wallet_addEthereumChain.js` | — |
| `app/core/RPCMethods/wallet_switchEthereumChain.js` | — |
| `app/core/SecureKeychain.js` | — |
| `app/core/TransactionTypes.js` | — |
| `app/core/Vault.js` | — |
| `app/core/WalletConnect/WalletConnect.js` | — |

Core test files:
- `app/core/BackgroundBridge/BackgroundBridge.test.js`
- `app/core/Permissions/specifications.test.js`
- `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`
- `app/core/RPCMethods/wallet_addEthereumChain.test.js`
- `app/core/RPCMethods/wallet_switchEthereumChain.test.js`

#### Utility Functions (app/util/)

| File |
|------|
| `app/util/ENSUtils.js` |
| `app/util/blockies.js` |
| `app/util/confirm-tx.js` |
| `app/util/confirmation/signatureUtils.js` |
| `app/util/confusables/index.js` |
| `app/util/conversion/index.js` |
| `app/util/conversions.js` |
| `app/util/custom-gas/index.js` |
| `app/util/dapp-url-list.js` |
| `app/util/date/index.js` |
| `app/util/device/index.js` |
| `app/util/etherscan.js` |
| `app/util/gasUtils.js` |
| `app/util/general/index.js` |
| `app/util/middlewares.js` |
| `app/util/networks/index.js` |
| `app/util/number/index.js` |
| `app/util/payment-link-generator.js` |
| `app/util/scaling.js` |
| `app/util/sentry/utils.js` |
| `app/util/streams.js` |
| `app/util/transactions/index.js` |
| `app/util/walletconnect.js` |

Util test files:
- `app/util/conversions.test.js`

Test helper files (app/util/test/):
- `app/util/test/assetFileTransformer.js`
- `app/util/test/contract-address-registry.js`
- `app/util/test/ganache-seeder.js`
- `app/util/test/ganache.js`
- `app/util/test/network-store.js`
- `app/util/test/smart-contracts.js`
- `app/util/test/testSetup.js`
- `app/util/test/utils.js`

### Workstream C — UI Components

#### C1 — Base Components (app/components/Base/)

| File |
|------|
| `app/components/Base/DetailsModal.js` |
| `app/components/Base/Keypad/Keypad.test.js` |
| `app/components/Base/Keypad/components.js` |
| `app/components/Base/Keypad/constants.js` |
| `app/components/Base/Keypad/createKeypadRule.js` |
| `app/components/Base/Keypad/createKeypadRule.test.js` |
| `app/components/Base/Keypad/index.js` |
| `app/components/Base/Keypad/useCurrency.js` |
| `app/components/Base/RangeInput.js` |
| `app/components/Base/RemoteImage/index.js` |
| `app/components/Base/StatusText.js` |
| `app/components/Base/TabBar.js` |

**Total: 12 files**

#### C2/C3/C4 — UI Components (app/components/UI/)

| File |
|------|
| `app/components/UI/AccountApproval/index.js` |
| `app/components/UI/AccountInfoCard/index.js` |
| `app/components/UI/AccountOverview/index.js` |
| `app/components/UI/ActionModal/ActionContent/index.js` |
| `app/components/UI/ActionModal/index.js` |
| `app/components/UI/ActionView/index.js` |
| `app/components/UI/AddCustomToken/index.js` |
| `app/components/UI/AddressInputs/index.js` |
| `app/components/UI/AnimatedSpinner/index.js` |
| `app/components/UI/AnimatedTransactionModal/index.js` |
| `app/components/UI/AssetList/index.js` |
| `app/components/UI/BrowserBottomBar/index.js` |
| `app/components/UI/Button/index.js` |
| `app/components/UI/CollectibleContractElement/index.js` |
| `app/components/UI/CollectibleContractInformation/index.js` |
| `app/components/UI/CollectibleContractOverview/index.js` |
| `app/components/UI/CollectibleContracts/index.js` |
| `app/components/UI/CollectibleOverview/index.js` |
| `app/components/UI/Collectibles/index.js` |
| `app/components/UI/Confetti/index.js` |
| `app/components/UI/CustomAlert/index.js` |
| `app/components/UI/DrawerView/index.js` |
| `app/components/UI/EditGasFee1559/index.js` |
| `app/components/UI/EditGasFeeLegacy/index.js` |
| `app/components/UI/EthereumAddress/index.js` |
| `app/components/UI/FadeAnimationView/index.js` |
| `app/components/UI/FadeOutOverlay/index.js` |
| `app/components/UI/FoxScreen/index.js` |
| `app/components/UI/GlobalAlert/index.js` |
| `app/components/UI/HintModal/index.js` |
| `app/components/UI/Navbar/index.js` |
| `app/components/UI/NavbarBrowserTitle/index.js` |
| `app/components/UI/NavbarTitle/index.js` |
| `app/components/UI/NetworkMainAssetLogo/index.js` |
| `app/components/UI/Notification/BaseNotification/index.js` |
| `app/components/UI/Notification/SimpleNotification/index.js` |
| `app/components/UI/Notification/TransactionNotification/index.js` |
| `app/components/UI/Notification/index.js` |
| `app/components/UI/OnboardingWizard/Coachmark/index.js` |
| `app/components/UI/OptinMetrics/index.js` |
| `app/components/UI/PaymentRequest/index.js` |
| `app/components/UI/PaymentRequestSuccess/index.js` |
| `app/components/UI/PhishingModal/index.js` |
| `app/components/UI/ProtectYourWalletModal/index.js` |
| `app/components/UI/ReceiveRequest/index.js` |
| `app/components/UI/Screen/index.js` |
| `app/components/UI/SeedphraseModal/index.js` |
| `app/components/UI/SelectComponent/index.js` |
| `app/components/UI/SettingsDrawer/index.js` |
| `app/components/UI/SettingsNotification/index.js` |
| `app/components/UI/SkipAccountSecurityModal/index.js` |
| `app/components/UI/SliderButton/index.js` |
| `app/components/UI/SlippageSlider/index.js` |
| `app/components/UI/StyledButton/index.android.js` |
| `app/components/UI/StyledButton/index.ios.js` |
| `app/components/UI/StyledButton/index.js` |
| `app/components/UI/Swaps/QuotesView.js` |
| `app/components/UI/Swaps/components/ActionAlert.js` |
| `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` |
| `app/components/UI/Swaps/components/AssetSwapButton.js` |
| `app/components/UI/Swaps/components/GasEditModal.js` |
| `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` |
| `app/components/UI/Swaps/components/LoadingAnimation/index.js` |
| `app/components/UI/Swaps/components/Onboarding.js` |
| `app/components/UI/Swaps/components/QuotesModal.js` |
| `app/components/UI/Swaps/components/QuotesSummary.js` |
| `app/components/UI/Swaps/components/SlippageModal.js` |
| `app/components/UI/Swaps/components/TokenIcon.js` |
| `app/components/UI/Swaps/components/TokenImportModal.js` |
| `app/components/UI/Swaps/components/TokenSelectButton.js` |
| `app/components/UI/Swaps/components/TokenSelectModal.js` |
| `app/components/UI/Swaps/index.js` |
| `app/components/UI/Swaps/utils/index.js` |
| `app/components/UI/Swaps/utils/useBalance.js` |
| `app/components/UI/Swaps/utils/useBlockExplorer.js` |
| `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` |
| `app/components/UI/SwitchCustomNetwork/index.js` |
| `app/components/UI/Tabs/TabCountIcon/index.js` |
| `app/components/UI/Tabs/index.js` |
| `app/components/UI/TimeEstimateInfoModal/index.js` |
| `app/components/UI/TokenImage/index.js` |
| `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` |
| `app/components/UI/TransactionActionModal/index.js` |
| `app/components/UI/TransactionElement/TransactionDetails/index.js` |
| `app/components/UI/TransactionElement/index.js` |
| `app/components/UI/TransactionElement/utils.js` |
| `app/components/UI/TransactionHeader/index.js` |
| `app/components/UI/Transactions/index.js` |
| `app/components/UI/WarningExistingUserModal/index.js` |
| `app/components/UI/WebsiteIcon/index.js` |
| `app/components/UI/WebviewError/index.js` |
| `app/components/UI/WebviewProgressBar/index.js` |

UI test files:
- `app/components/UI/AddressInputs/index.test.jsx`
- `app/components/UI/BasicFunctionality/BasicFunctionality.test.js`
- `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js`
- `app/components/UI/ManageNetworks/ManageNetworks.test.js`
- `app/components/UI/Navbar/index.test.jsx`
- `app/components/UI/NavbarTitle/index.test.js`
- `app/components/UI/Notification/BaseNotification/index.test.jsx`
- `app/components/UI/Swaps/components/TokenIcon.test.js`
- `app/components/UI/Swaps/components/TokenSelectButton.test.js`
- `app/components/UI/Swaps/utils/index.test.js`
- `app/components/UI/TransactionElement/utils.test.js`

**Total UI source: 92 files**
**Total UI tests: 11 files**

#### C5 — Navigation (app/components/Nav/)

| File |
|------|
| `app/components/Nav/Main/MainNavigator.js` |
| `app/components/Nav/Main/RootRPCMethodsUI.js` |
| `app/components/Nav/Main/index.js` |

#### C6 — View Components (app/components/Views/)

| File |
|------|
| `app/components/Views/AccountBackupStep1/index.js` |
| `app/components/Views/AccountBackupStep1B/index.js` |
| `app/components/Views/ActivityView/index.js` |
| `app/components/Views/AddBookmark/index.js` |
| `app/components/Views/AddressQRCode/index.js` |
| `app/components/Views/Asset/index.js` |
| `app/components/Views/Browser/index.js` |
| `app/components/Views/ChoosePassword/index.js` |
| `app/components/Views/Collectible/index.js` |
| `app/components/Views/CollectibleView/index.js` |
| `app/components/Views/EnterPasswordSimple/index.js` |
| `app/components/Views/ErrorBoundary/index.js` |
| `app/components/Views/GasEducationCarousel/index.js` |
| `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` |
| `app/components/Views/ImportPrivateKeySuccess/index.js` |
| `app/components/Views/LockScreen/index.js` |
| `app/components/Views/ManualBackupStep1/index.js` |
| `app/components/Views/ManualBackupStep2/index.js` |
| `app/components/Views/ManualBackupStep3/index.js` |
| `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` |
| `app/components/Views/MediaPlayer/index.js` |
| `app/components/Views/NavigationUnitTest/index.js` |
| `app/components/Views/OfflineMode/index.js` |
| `app/components/Views/Onboarding/index.js` |
| `app/components/Views/ResetPassword/index.js` |
| `app/components/Views/Settings/AdvancedSettings/index.js` |
| `app/components/Views/Settings/AppInformation/index.js` |
| `app/components/Views/Settings/Contacts/ContactForm/index.js` |
| `app/components/Views/Settings/Contacts/index.js` |
| `app/components/Views/Settings/GeneralSettings/index.js` |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` |
| `app/components/Views/Settings/NetworksSettings/index.js` |
| `app/components/Views/SimpleWebview/index.js` |
| `app/components/Views/TermsAndConditions/index.js` |
| `app/components/Views/TransactionSummary/index.js` |
| `app/components/Views/TransactionsView/index.js` |
| `app/components/Views/WalletConnectSessions/index.js` |
| `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` |
| `app/components/Views/confirmations/legacy/Approval/index.js` |
| `app/components/Views/confirmations/legacy/Approve/index.js` |
| `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` |
| `app/components/Views/confirmations/legacy/Send/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx` |
| `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx` |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` |
| `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` |
| `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` |
| `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` |
| `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` |
| `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx` |
| `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx` |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` |
| `app/components/Views/confirmations/legacy/components/TypedSign/index.js` |
| `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx` |
| `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` |
| `app/components/Views/confirmations/mock-data.js` |

View test files:
- `app/components/Views/Asset/index.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen1.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen2.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen3.test.js`
- `app/components/Views/OnboardingSuccess/index.test.js`
- `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx`
- `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`

**Total View source: 71 files**
**Total View tests: 9 files**

### Store Migrations (app/store/migrations/)

| File | Type |
|------|------|
| `app/store/migrations/000.js` | source |
| `app/store/migrations/001.js` | source |
| `app/store/migrations/002.js` | source |
| `app/store/migrations/003.js` | source |
| `app/store/migrations/004.js` | source |
| `app/store/migrations/005.js` | source |
| `app/store/migrations/006.js` | source |
| `app/store/migrations/007.js` | source |
| `app/store/migrations/008.js` | source |
| `app/store/migrations/009.js` | source |
| `app/store/migrations/010.js` | source |
| `app/store/migrations/011.js` | source |
| `app/store/migrations/012.js` | source |
| `app/store/migrations/013.js` | source |
| `app/store/migrations/014.js` | source |
| `app/store/migrations/015.js` | source |
| `app/store/migrations/016.js` | source |
| `app/store/migrations/017.js` | source |
| `app/store/migrations/018.js` | source |
| `app/store/migrations/019.js` | source |
| `app/store/migrations/019.test.js` | test |
| `app/store/migrations/020.js` | source |
| `app/store/migrations/020.test.js` | test |
| `app/store/migrations/021.js` | source |
| `app/store/migrations/021.test.js` | test |
| `app/store/migrations/022.js` | source |
| `app/store/migrations/022.test.js` | test |
| `app/store/migrations/023.js` | source |
| `app/store/migrations/023.test.js` | test |
| `app/store/migrations/024.js` | source |
| `app/store/migrations/024.test.js` | test |
| `app/store/migrations/025.js` | source |
| `app/store/migrations/025.test.js` | test |
| `app/store/migrations/026.js` | source |
| `app/store/migrations/026.test.js` | test |
| `app/store/migrations/027.js` | source |
| `app/store/migrations/027.test.js` | test |
| `app/store/migrations/028.test.js` | test |

**Total source: 28 files**
**Total tests: 10 files**

### Other (Constants, Lib, Mocks, Images)

| File | Category |
|------|----------|
| `app/constants/navigation.js` | constants |
| `app/constants/network.js` | constants |
| `app/constants/onboarding.js` | constants |
| `app/lib/ens-ipfs/contracts/registry.js` | lib |
| `app/lib/ens-ipfs/contracts/resolver.js` | lib |
| `app/lib/ens-ipfs/resolver.js` | lib |
| `app/lib/ppom/blockaid-version.js` | lib |
| `app/__mocks__/pngMock.js` | mock |
| `app/__mocks__/react-native-device-info.js` | mock |
| `app/__mocks__/react-native-splash-screen.js` | mock |
| `app/__mocks__/react-native-view-shot.js` | mock |
| `app/__mocks__/rn-fetch-blob.js` | mock |
| `app/__mocks__/svgMock.js` | mock |
| `app/images/image-icons.js` | images |

### E2E Tests (e2e/)

**Total .js files: 356**

### WebdriverIO Tests (wdio/)

**Total .js files: 124**

### Scripts (scripts/)

| File |
|------|
| `scripts/inpage-bridge/src/MobilePortStream.js` |
| `scripts/inpage-bridge/src/ReactNativePostMessageStream.js` |
| `scripts/inpage-bridge/src/index.js` |
| `scripts/inpage-bridge/src/provider.js` |
| `scripts/inpage-bridge/webpack.config.js` |
| `scripts/metamask-bot-build-announce-bitrise.js` |
| `scripts/start-api-logging-server.js` |
| `scripts/testrail/testrail.api.js` |

