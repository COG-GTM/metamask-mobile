# JavaScript to TypeScript Migration Tracker

## Summary
- Total JS files: 286
- Converted: 0
- In Progress: 0
- Remaining: 286

## Priority Legend
| Priority | Category | Rationale |
|----------|----------|-----------|
| **P0** | Core Engine & Controllers | Central business logic, high dependency count |
| **P1** | Utilities & Helpers | Pure functions, provide types for dependents |
| **P2** | Navigation & Routing | Critical for app flow |
| **P3** | UI Components | Leaf nodes, fewer dependencies |
| **P4** | Actions, Reducers, Store | Redux integration, moderate complexity |
| **P5** | Other (constants, images, lib) | Lower priority, less critical |

## File List

### P0: Core Engine & Controllers (20 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/core/BackgroundBridge/BackgroundBridge.js | Todo | | | |
| app/core/ClipboardManager.js | Todo | | | |
| app/core/DrawerStatusTracker.js | Todo | | | |
| app/core/EntryScriptWeb3.js | Todo | | | |
| app/core/InpageBridgeWeb3.js | Todo | | | |
| app/core/MobilePortStream.js | Todo | | | |
| app/core/NotificationManager.js | Todo | | | |
| app/core/Permissions/specifications.js | Todo | | | |
| app/core/PreventScreenshot.js | Todo | | | |
| app/core/RPCMethods/createEip1193MethodMiddleware/index.js | Todo | | | |
| app/core/RPCMethods/eth-request-accounts.js | Todo | | | |
| app/core/RPCMethods/handlers/index.js | Todo | | | |
| app/core/RPCMethods/index.js | Todo | | | |
| app/core/RPCMethods/lib/ethereum-chain-utils.js | Todo | | | |
| app/core/RPCMethods/wallet_addEthereumChain.js | Todo | | | |
| app/core/RPCMethods/wallet_switchEthereumChain.js | Todo | | | |
| app/core/SecureKeychain.js | Todo | | | |
| app/core/TransactionTypes.js | Todo | | | |
| app/core/Vault.js | Todo | | | |
| app/core/WalletConnect/WalletConnect.js | Todo | | | |

### P1: Utilities & Helpers (31 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/util/ENSUtils.js | Todo | | | |
| app/util/blockies.js | Todo | | | |
| app/util/confirm-tx.js | Todo | | | |
| app/util/confirmation/signatureUtils.js | Todo | | | |
| app/util/confusables/index.js | Todo | | | |
| app/util/conversion/index.js | Todo | | | |
| app/util/conversions.js | Todo | | | |
| app/util/custom-gas/index.js | Todo | | | |
| app/util/dapp-url-list.js | Todo | | | |
| app/util/date/index.js | Todo | | | |
| app/util/device/index.js | Todo | | | |
| app/util/etherscan.js | Todo | | | |
| app/util/gasUtils.js | Todo | | | |
| app/util/general/index.js | Todo | | | |
| app/util/middlewares.js | Todo | | | |
| app/util/networks/index.js | Todo | | | |
| app/util/number/index.js | Todo | | | |
| app/util/payment-link-generator.js | Todo | | | |
| app/util/scaling.js | Todo | | | |
| app/util/sentry/utils.js | Todo | | | |
| app/util/streams.js | Todo | | | |
| app/util/test/assetFileTransformer.js | Todo | | | |
| app/util/test/contract-address-registry.js | Todo | | | |
| app/util/test/ganache-seeder.js | Todo | | | |
| app/util/test/ganache.js | Todo | | | |
| app/util/test/network-store.js | Todo | | | |
| app/util/test/smart-contracts.js | Todo | | | |
| app/util/test/testSetup.js | Todo | | | |
| app/util/test/utils.js | Todo | | | |
| app/util/transactions/index.js | Todo | | | |
| app/util/walletconnect.js | Todo | | | |

### P2: Navigation & Routing (3 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/components/Nav/Main/MainNavigator.js | Todo | | | |
| app/components/Nav/Main/RootRPCMethodsUI.js | Todo | | | |
| app/components/Nav/Main/index.js | Todo | | | |

### P3: UI Components (172 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/components/Base/DetailsModal.js | Todo | | | |
| app/components/Base/Keypad/components.js | Todo | | | |
| app/components/Base/Keypad/constants.js | Todo | | | |
| app/components/Base/Keypad/createKeypadRule.js | Todo | | | |
| app/components/Base/Keypad/index.js | Todo | | | |
| app/components/Base/Keypad/useCurrency.js | Todo | | | |
| app/components/Base/RangeInput.js | Todo | | | |
| app/components/Base/RemoteImage/index.js | Todo | | | |
| app/components/Base/StatusText.js | Todo | | | |
| app/components/Base/TabBar.js | Todo | | | |
| app/components/UI/AccountApproval/index.js | Todo | | | |
| app/components/UI/AccountInfoCard/index.js | Todo | | | |
| app/components/UI/AccountOverview/index.js | Todo | | | |
| app/components/UI/ActionModal/ActionContent/index.js | Todo | | | |
| app/components/UI/ActionModal/index.js | Todo | | | |
| app/components/UI/ActionView/index.js | Todo | | | |
| app/components/UI/AddCustomToken/index.js | Todo | | | |
| app/components/UI/AddressInputs/index.js | Todo | | | |
| app/components/UI/AnimatedSpinner/index.js | Todo | | | |
| app/components/UI/AnimatedTransactionModal/index.js | Todo | | | |
| app/components/UI/AssetList/index.js | Todo | | | |
| app/components/UI/BrowserBottomBar/index.js | Todo | | | |
| app/components/UI/Button/index.js | Todo | | | |
| app/components/UI/CollectibleContractElement/index.js | Todo | | | |
| app/components/UI/CollectibleContractInformation/index.js | Todo | | | |
| app/components/UI/CollectibleContractOverview/index.js | Todo | | | |
| app/components/UI/CollectibleContracts/index.js | Todo | | | |
| app/components/UI/CollectibleOverview/index.js | Todo | | | |
| app/components/UI/Collectibles/index.js | Todo | | | |
| app/components/UI/Confetti/index.js | Todo | | | |
| app/components/UI/CustomAlert/index.js | Todo | | | |
| app/components/UI/DrawerView/index.js | Todo | | | |
| app/components/UI/EditGasFee1559/index.js | Todo | | | |
| app/components/UI/EditGasFeeLegacy/index.js | Todo | | | |
| app/components/UI/EthereumAddress/index.js | Todo | | | |
| app/components/UI/FadeAnimationView/index.js | Todo | | | |
| app/components/UI/FadeOutOverlay/index.js | Todo | | | |
| app/components/UI/FoxScreen/index.js | Todo | | | |
| app/components/UI/GlobalAlert/index.js | Todo | | | |
| app/components/UI/HintModal/index.js | Todo | | | |
| app/components/UI/Navbar/index.js | Todo | | | |
| app/components/UI/NavbarBrowserTitle/index.js | Todo | | | |
| app/components/UI/NavbarTitle/index.js | Todo | | | |
| app/components/UI/NetworkMainAssetLogo/index.js | Todo | | | |
| app/components/UI/Notification/BaseNotification/index.js | Todo | | | |
| app/components/UI/Notification/SimpleNotification/index.js | Todo | | | |
| app/components/UI/Notification/TransactionNotification/index.js | Todo | | | |
| app/components/UI/Notification/index.js | Todo | | | |
| app/components/UI/OnboardingWizard/Coachmark/index.js | Todo | | | |
| app/components/UI/OptinMetrics/index.js | Todo | | | |
| app/components/UI/PaymentRequest/index.js | Todo | | | |
| app/components/UI/PaymentRequestSuccess/index.js | Todo | | | |
| app/components/UI/PhishingModal/index.js | Todo | | | |
| app/components/UI/ProtectYourWalletModal/index.js | Todo | | | |
| app/components/UI/ReceiveRequest/index.js | Todo | | | |
| app/components/UI/Screen/index.js | Todo | | | |
| app/components/UI/SeedphraseModal/index.js | Todo | | | |
| app/components/UI/SelectComponent/index.js | Todo | | | |
| app/components/UI/SettingsDrawer/index.js | Todo | | | |
| app/components/UI/SettingsNotification/index.js | Todo | | | |
| app/components/UI/SkipAccountSecurityModal/index.js | Todo | | | |
| app/components/UI/SliderButton/index.js | Todo | | | |
| app/components/UI/SlippageSlider/index.js | Todo | | | |
| app/components/UI/StyledButton/index.android.js | Todo | | | |
| app/components/UI/StyledButton/index.ios.js | Todo | | | |
| app/components/UI/StyledButton/index.js | Todo | | | |
| app/components/UI/Swaps/QuotesView.js | Todo | | | |
| app/components/UI/Swaps/components/ActionAlert.js | Todo | | | |
| app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js | Todo | | | |
| app/components/UI/Swaps/components/AssetSwapButton.js | Todo | | | |
| app/components/UI/Swaps/components/GasEditModal.js | Todo | | | |
| app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js | Todo | | | |
| app/components/UI/Swaps/components/LoadingAnimation/index.js | Todo | | | |
| app/components/UI/Swaps/components/Onboarding.js | Todo | | | |
| app/components/UI/Swaps/components/QuotesModal.js | Todo | | | |
| app/components/UI/Swaps/components/QuotesSummary.js | Todo | | | |
| app/components/UI/Swaps/components/SlippageModal.js | Todo | | | |
| app/components/UI/Swaps/components/TokenIcon.js | Todo | | | |
| app/components/UI/Swaps/components/TokenImportModal.js | Todo | | | |
| app/components/UI/Swaps/components/TokenSelectButton.js | Todo | | | |
| app/components/UI/Swaps/components/TokenSelectModal.js | Todo | | | |
| app/components/UI/Swaps/index.js | Todo | | | |
| app/components/UI/Swaps/utils/index.js | Todo | | | |
| app/components/UI/Swaps/utils/useBalance.js | Todo | | | |
| app/components/UI/Swaps/utils/useBlockExplorer.js | Todo | | | |
| app/components/UI/Swaps/utils/useFetchTokenMetadata.js | Todo | | | |
| app/components/UI/SwitchCustomNetwork/index.js | Todo | | | |
| app/components/UI/Tabs/TabCountIcon/index.js | Todo | | | |
| app/components/UI/Tabs/index.js | Todo | | | |
| app/components/UI/TimeEstimateInfoModal/index.js | Todo | | | |
| app/components/UI/TokenImage/index.js | Todo | | | |
| app/components/UI/TransactionActionModal/TransactionActionContent/index.js | Todo | | | |
| app/components/UI/TransactionActionModal/index.js | Todo | | | |
| app/components/UI/TransactionElement/TransactionDetails/index.js | Todo | | | |
| app/components/UI/TransactionElement/index.js | Todo | | | |
| app/components/UI/TransactionElement/utils.js | Todo | | | |
| app/components/UI/TransactionHeader/index.js | Todo | | | |
| app/components/UI/Transactions/index.js | Todo | | | |
| app/components/UI/WarningExistingUserModal/index.js | Todo | | | |
| app/components/UI/WebsiteIcon/index.js | Todo | | | |
| app/components/UI/WebviewError/index.js | Todo | | | |
| app/components/UI/WebviewProgressBar/index.js | Todo | | | |
| app/components/Views/AccountBackupStep1/index.js | Todo | | | |
| app/components/Views/AccountBackupStep1B/index.js | Todo | | | |
| app/components/Views/ActivityView/index.js | Todo | | | |
| app/components/Views/AddBookmark/index.js | Todo | | | |
| app/components/Views/AddressQRCode/index.js | Todo | | | |
| app/components/Views/Asset/index.js | Todo | | | |
| app/components/Views/Browser/index.js | Todo | | | |
| app/components/Views/ChoosePassword/index.js | Todo | | | |
| app/components/Views/Collectible/index.js | Todo | | | |
| app/components/Views/CollectibleView/index.js | Todo | | | |
| app/components/Views/EnterPasswordSimple/index.js | Todo | | | |
| app/components/Views/ErrorBoundary/index.js | Todo | | | |
| app/components/Views/GasEducationCarousel/index.js | Todo | | | |
| app/components/Views/ImportFromSecretRecoveryPhrase/index.js | Todo | | | |
| app/components/Views/ImportPrivateKeySuccess/index.js | Todo | | | |
| app/components/Views/LockScreen/index.js | Todo | | | |
| app/components/Views/ManualBackupStep1/index.js | Todo | | | |
| app/components/Views/ManualBackupStep2/index.js | Todo | | | |
| app/components/Views/ManualBackupStep3/index.js | Todo | | | |
| app/components/Views/MediaPlayer/AndroidMediaPlayer.js | Todo | | | |
| app/components/Views/MediaPlayer/index.js | Todo | | | |
| app/components/Views/NavigationUnitTest/index.js | Todo | | | |
| app/components/Views/OfflineMode/index.js | Todo | | | |
| app/components/Views/Onboarding/index.js | Todo | | | |
| app/components/Views/ResetPassword/index.js | Todo | | | |
| app/components/Views/Settings/AdvancedSettings/index.js | Todo | | | |
| app/components/Views/Settings/AppInformation/index.js | Todo | | | |
| app/components/Views/Settings/Contacts/ContactForm/index.js | Todo | | | |
| app/components/Views/Settings/Contacts/index.js | Todo | | | |
| app/components/Views/Settings/GeneralSettings/index.js | Todo | | | |
| app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js | Todo | | | |
| app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js | Todo | | | |
| app/components/Views/Settings/NetworksSettings/index.js | Todo | | | |
| app/components/Views/SimpleWebview/index.js | Todo | | | |
| app/components/Views/TermsAndConditions/index.js | Todo | | | |
| app/components/Views/TransactionSummary/index.js | Todo | | | |
| app/components/Views/TransactionsView/index.js | Todo | | | |
| app/components/Views/WalletConnectSessions/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/Approval/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/Approve/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/ApproveView/Approve/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/Send/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/Amount/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/CustomNonce/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/SignatureRequest/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TransactionReview/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/TypedSign/index.js | Todo | | | |
| app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx | Todo | | | |
| app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js | Todo | | | |

### P4: Actions, Reducers, Store (51 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/actions/alert/index.js | Todo | | | |
| app/actions/bookmarks/index.js | Todo | | | |
| app/actions/browser/index.js | Todo | | | |
| app/actions/collectibles/index.js | Todo | | | |
| app/actions/infuraAvailability/index.js | Todo | | | |
| app/actions/modals/index.js | Todo | | | |
| app/actions/notification/index.js | Todo | | | |
| app/actions/privacy/index.js | Todo | | | |
| app/actions/settings/index.js | Todo | | | |
| app/actions/transaction/index.js | Todo | | | |
| app/actions/wizard/index.js | Todo | | | |
| app/reducers/alert/index.js | Todo | | | |
| app/reducers/bookmarks/index.js | Todo | | | |
| app/reducers/browser/index.js | Todo | | | |
| app/reducers/collectibles/index.js | Todo | | | |
| app/reducers/infuraAvailability/index.js | Todo | | | |
| app/reducers/modals/index.js | Todo | | | |
| app/reducers/notification/index.js | Todo | | | |
| app/reducers/privacy/index.js | Todo | | | |
| app/reducers/settings/index.js | Todo | | | |
| app/reducers/swaps/index.js | Todo | | | |
| app/reducers/transaction/index.js | Todo | | | |
| app/reducers/wizard/index.js | Todo | | | |
| app/store/migrations/000.js | Todo | | | |
| app/store/migrations/001.js | Todo | | | |
| app/store/migrations/002.js | Todo | | | |
| app/store/migrations/003.js | Todo | | | |
| app/store/migrations/004.js | Todo | | | |
| app/store/migrations/005.js | Todo | | | |
| app/store/migrations/006.js | Todo | | | |
| app/store/migrations/007.js | Todo | | | |
| app/store/migrations/008.js | Todo | | | |
| app/store/migrations/009.js | Todo | | | |
| app/store/migrations/010.js | Todo | | | |
| app/store/migrations/011.js | Todo | | | |
| app/store/migrations/012.js | Todo | | | |
| app/store/migrations/013.js | Todo | | | |
| app/store/migrations/014.js | Todo | | | |
| app/store/migrations/015.js | Todo | | | |
| app/store/migrations/016.js | Todo | | | |
| app/store/migrations/017.js | Todo | | | |
| app/store/migrations/018.js | Todo | | | |
| app/store/migrations/019.js | Todo | | | |
| app/store/migrations/020.js | Todo | | | |
| app/store/migrations/021.js | Todo | | | |
| app/store/migrations/022.js | Todo | | | |
| app/store/migrations/023.js | Todo | | | |
| app/store/migrations/024.js | Todo | | | |
| app/store/migrations/025.js | Todo | | | |
| app/store/migrations/026.js | Todo | | | |
| app/store/migrations/027.js | Todo | | | |

### P5: Other (constants, images, lib) (9 files)
| File Path | Status | Assigned | PR Link | Notes |
|-----------|--------|----------|---------|-------|
| app/constants/navigation.js | Todo | | | |
| app/constants/network.js | Todo | | | |
| app/constants/onboarding.js | Todo | | | |
| app/images/image-icons.js | Todo | | | |
| app/lib/ens-ipfs/contracts/registry.js | Todo | | | |
| app/lib/ens-ipfs/contracts/resolver.js | Todo | | | |
| app/lib/ens-ipfs/resolver.js | Todo | | | |
| app/lib/ppom/blockaid-version.js | Todo | | | |
| app/lib/ppom/ppom.html.js | Todo | | | |
