# TypeScript Migration Audit Report

> **Generated**: 2026-02-25 21:22 UTC
> **Repository**: `COG-GTM/metamask-mobile`
> **TypeScript version**: 5.4.5
> **tsconfig**: `strict: true`, `allowJs: true`
> **Scope**: All `.js` and `.jsx` files under `app/` (excludes `e2e/` and `.github/scripts/`)

---

## Summary

| Category | Count | Percentage |
|----------|------:|----------:|
| Zero errors (ready for immediate conversion) | 40 | 12% |
| Few errors (1–5, easy conversions) | 94 | 28% |
| Medium errors (6–20) | 99 | 29% |
| High errors (21–50) | 63 | 18% |
| Very high errors (51+) | 37 | 11% |
| **Total files audited** | **333** | **100%** |

### Methodology

Each `.js`/`.jsx` file was temporarily renamed to `.ts`/`.tsx` (based on whether it contains JSX syntax), then `npx tsc --noEmit` was run against the full project. Errors were counted per file. Files were then restored to their original names. The error counts represent the number of TypeScript diagnostics emitted for that specific file under `strict: true`.

---

## Zero Errors — Ready for Immediate Conversion (40 files)

These files compile cleanly as TypeScript and can be renamed with no code changes.

| File | Target |
|------|--------|
| `app/__mocks__/pngMock.js` | `.ts` |
| `app/__mocks__/react-native-device-info.js` | `.ts` |
| `app/__mocks__/react-native-splash-screen.js` | `.ts` |
| `app/__mocks__/react-native-view-shot.js` | `.ts` |
| `app/__mocks__/rn-fetch-blob.js` | `.ts` |
| `app/__mocks__/svgMock.js` | `.ts` |
| `app/actions/infuraAvailability/index.js` | `.ts` |
| `app/components/Base/Keypad/createKeypadRule.test.js` | `.ts` |
| `app/components/UI/AddressInputs/index.test.jsx` | `.tsx` |
| `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` | `.ts` |
| `app/components/UI/Swaps/components/TokenIcon.test.js` | `.tsx` |
| `app/components/UI/Swaps/components/TokenSelectButton.test.js` | `.tsx` |
| `app/components/UI/TransactionElement/utils.test.js` | `.ts` |
| `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` | `.ts` |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` | `.ts` |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js` | `.tsx` |
| `app/components/Views/confirmations/mock-data.js` | `.ts` |
| `app/constants/navigation.js` | `.ts` |
| `app/constants/network.js` | `.ts` |
| `app/constants/onboarding.js` | `.ts` |
| `app/core/PreventScreenshot.js` | `.ts` |
| `app/core/RPCMethods/handlers/index.js` | `.ts` |
| `app/core/TransactionTypes.js` | `.ts` |
| `app/images/image-icons.js` | `.ts` |
| `app/lib/ens-ipfs/contracts/registry.js` | `.ts` |
| `app/lib/ens-ipfs/contracts/resolver.js` | `.ts` |
| `app/store/migrations/019.test.js` | `.ts` |
| `app/store/migrations/022.test.js` | `.ts` |
| `app/store/migrations/023.test.js` | `.ts` |
| `app/store/migrations/024.test.js` | `.ts` |
| `app/store/migrations/025.test.js` | `.ts` |
| `app/store/migrations/026.test.js` | `.ts` |
| `app/store/migrations/027.test.js` | `.ts` |
| `app/store/migrations/028.test.js` | `.ts` |
| `app/util/conversions.test.js` | `.ts` |
| `app/util/dapp-url-list.js` | `.ts` |
| `app/util/device/index.js` | `.ts` |
| `app/util/gasUtils.js` | `.ts` |
| `app/util/test/smart-contracts.js` | `.ts` |
| `app/util/walletconnect.js` | `.ts` |

---

## Few Errors (1–5) — Easy Conversions (94 files)

These files have minor type issues (typically implicit `any` parameters) and can be converted with minimal effort.

| File | Target | Errors |
|------|--------|-------:|
| `app/actions/wizard/index.js` | `.ts` | 1 |
| `app/components/Base/TabBar.js` | `.tsx` | 1 |
| `app/components/UI/BasicFunctionality/BasicFunctionality.test.js` | `.tsx` | 1 |
| `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js` | `.tsx` | 1 |
| `app/components/UI/Screen/index.js` | `.tsx` | 1 |
| `app/components/UI/StyledButton/index.js` | `.tsx` | 1 |
| `app/components/Views/NavigationUnitTest/TestScreen1.test.js` | `.tsx` | 1 |
| `app/components/Views/NavigationUnitTest/TestScreen2.test.js` | `.tsx` | 1 |
| `app/components/Views/NavigationUnitTest/TestScreen3.test.js` | `.tsx` | 1 |
| `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` | `.tsx` | 1 |
| `app/core/EntryScriptWeb3.js` | `.ts` | 1 |
| `app/core/RPCMethods/index.js` | `.ts` | 1 |
| `app/reducers/alert/index.js` | `.ts` | 1 |
| `app/reducers/settings/index.js` | `.ts` | 1 |
| `app/reducers/wizard/index.js` | `.ts` | 1 |
| `app/store/migrations/005.js` | `.ts` | 1 |
| `app/store/migrations/006.js` | `.ts` | 1 |
| `app/store/migrations/009.js` | `.ts` | 1 |
| `app/store/migrations/010.js` | `.ts` | 1 |
| `app/store/migrations/011.js` | `.ts` | 1 |
| `app/store/migrations/012.js` | `.ts` | 1 |
| `app/store/migrations/014.js` | `.ts` | 1 |
| `app/store/migrations/016.js` | `.ts` | 1 |
| `app/store/migrations/017.js` | `.ts` | 1 |
| `app/store/migrations/018.js` | `.ts` | 1 |
| `app/store/migrations/019.js` | `.ts` | 1 |
| `app/store/migrations/021.js` | `.ts` | 1 |
| `app/store/migrations/021.test.js` | `.ts` | 1 |
| `app/store/migrations/022.js` | `.ts` | 1 |
| `app/store/migrations/024.js` | `.ts` | 1 |
| `app/store/migrations/025.js` | `.ts` | 1 |
| `app/util/test/utils.js` | `.ts` | 1 |
| `app/actions/bookmarks/index.js` | `.ts` | 2 |
| `app/components/UI/FoxScreen/index.js` | `.tsx` | 2 |
| `app/components/UI/Navbar/index.test.jsx` | `.tsx` | 2 |
| `app/components/UI/NavbarTitle/index.test.js` | `.tsx` | 2 |
| `app/components/UI/Notification/BaseNotification/index.test.jsx` | `.tsx` | 2 |
| `app/components/UI/Swaps/utils/index.test.js` | `.ts` | 2 |
| `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` | `.tsx` | 2 |
| `app/reducers/bookmarks/index.js` | `.ts` | 2 |
| `app/reducers/browser/index.test.js` | `.ts` | 2 |
| `app/reducers/infuraAvailability/index.js` | `.ts` | 2 |
| `app/reducers/modals/index.js` | `.ts` | 2 |
| `app/reducers/privacy/index.js` | `.ts` | 2 |
| `app/reducers/transaction/index.js` | `.ts` | 2 |
| `app/store/migrations/002.js` | `.ts` | 2 |
| `app/store/migrations/015.js` | `.ts` | 2 |
| `app/store/migrations/026.js` | `.ts` | 2 |
| `app/util/test/assetFileTransformer.js` | `.ts` | 2 |
| `app/actions/modals/index.js` | `.ts` | 3 |
| `app/actions/privacy/index.js` | `.ts` | 3 |
| `app/components/Base/Keypad/createKeypadRule.js` | `.ts` | 3 |
| `app/components/UI/SeedphraseModal/index.js` | `.tsx` | 3 |
| `app/components/UI/Swaps/components/Onboarding.js` | `.tsx` | 3 |
| `app/components/UI/TimeEstimateInfoModal/index.js` | `.tsx` | 3 |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` | `.tsx` | 3 |
| `app/components/Views/TermsAndConditions/index.js` | `.tsx` | 3 |
| `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` | `.tsx` | 3 |
| `app/core/ClipboardManager.js` | `.ts` | 3 |
| `app/core/Permissions/specifications.js` | `.ts` | 3 |
| `app/store/migrations/003.js` | `.ts` | 3 |
| `app/store/migrations/013.js` | `.ts` | 3 |
| `app/store/migrations/020.js` | `.ts` | 3 |
| `app/store/migrations/020.test.js` | `.ts` | 3 |
| `app/actions/alert/index.js` | `.ts` | 4 |
| `app/components/UI/Button/index.js` | `.tsx` | 4 |
| `app/components/UI/Confetti/index.js` | `.tsx` | 4 |
| `app/components/UI/Notification/SimpleNotification/index.js` | `.tsx` | 4 |
| `app/components/UI/Swaps/components/AssetSwapButton.js` | `.tsx` | 4 |
| `app/components/UI/SwitchCustomNetwork/index.js` | `.tsx` | 4 |
| `app/components/UI/WebviewError/index.js` | `.tsx` | 4 |
| `app/components/Views/Asset/index.test.js` | `.tsx` | 4 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx` | `.tsx` | 4 |
| `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` | `.ts` | 4 |
| `app/store/migrations/001.js` | `.ts` | 4 |
| `app/components/Base/Keypad/useCurrency.js` | `.ts` | 5 |
| `app/components/UI/FadeOutOverlay/index.js` | `.tsx` | 5 |
| `app/components/UI/SettingsNotification/index.js` | `.tsx` | 5 |
| `app/components/UI/Swaps/components/SlippageModal.js` | `.tsx` | 5 |
| `app/components/UI/Swaps/components/TokenImportModal.js` | `.tsx` | 5 |
| `app/components/UI/Swaps/components/TokenSelectButton.js` | `.tsx` | 5 |
| `app/components/UI/TokenImage/index.js` | `.tsx` | 5 |
| `app/components/Views/AccountBackupStep1B/index.js` | `.tsx` | 5 |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` | `.tsx` | 5 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` | `.tsx` | 5 |
| `app/core/DrawerStatusTracker.js` | `.ts` | 5 |
| `app/core/Permissions/specifications.test.js` | `.ts` | 5 |
| `app/lib/ppom/blockaid-version.js` | `.ts` | 5 |
| `app/lib/ppom/ppom.html.js` | `.tsx` | 5 |
| `app/reducers/browser/index.js` | `.ts` | 5 |
| `app/store/migrations/000.js` | `.ts` | 5 |
| `app/store/migrations/027.js` | `.ts` | 5 |
| `app/util/etherscan.js` | `.ts` | 5 |
| `app/util/test/contract-address-registry.js` | `.ts` | 5 |

---

## Medium Errors (6–20) — Moderate Conversions (99 files)

These files require adding type annotations, fixing implicit `any` types, and potentially defining interfaces.

| File | Target | Errors |
|------|--------|-------:|
| `app/actions/collectibles/index.js` | `.ts` | 6 |
| `app/components/UI/ManageNetworks/ManageNetworks.test.js` | `.tsx` | 6 |
| `app/components/UI/Tabs/TabCountIcon/index.js` | `.tsx` | 6 |
| `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` | `.tsx` | 6 |
| `app/components/UI/TransactionHeader/index.js` | `.tsx` | 6 |
| `app/components/Views/ImportPrivateKeySuccess/index.js` | `.tsx` | 6 |
| `app/components/Views/NavigationUnitTest/index.js` | `.tsx` | 6 |
| `app/components/Views/OfflineMode/index.js` | `.tsx` | 6 |
| `app/components/Views/SimpleWebview/index.js` | `.tsx` | 6 |
| `app/components/UI/FadeAnimationView/index.js` | `.tsx` | 7 |
| `app/components/UI/HintModal/index.js` | `.tsx` | 7 |
| `app/components/UI/NetworkMainAssetLogo/index.js` | `.tsx` | 7 |
| `app/components/UI/SettingsDrawer/index.js` | `.tsx` | 7 |
| `app/components/UI/SkipAccountSecurityModal/index.js` | `.tsx` | 7 |
| `app/components/UI/Swaps/utils/useBalance.js` | `.ts` | 7 |
| `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` | `.ts` | 7 |
| `app/components/Views/OnboardingSuccess/index.test.js` | `.tsx` | 7 |
| `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` | `.tsx` | 7 |
| `app/core/RPCMethods/wallet_switchEthereumChain.js` | `.ts` | 7 |
| `app/util/scaling.js` | `.ts` | 7 |
| `app/util/test/ganache.js` | `.ts` | 7 |
| `app/components/UI/AnimatedSpinner/index.js` | `.tsx` | 8 |
| `app/components/UI/CollectibleContractInformation/index.js` | `.tsx` | 8 |
| `app/components/UI/PhishingModal/index.js` | `.tsx` | 8 |
| `app/components/UI/Swaps/components/QuotesSummary.js` | `.tsx` | 8 |
| `app/components/Views/EnterPasswordSimple/index.js` | `.tsx` | 8 |
| `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` | `.tsx` | 8 |
| `app/util/confusables/index.js` | `.ts` | 8 |
| `app/components/UI/AssetList/index.js` | `.tsx` | 9 |
| `app/components/UI/Swaps/utils/useBlockExplorer.js` | `.ts` | 9 |
| `app/components/UI/WebviewProgressBar/index.js` | `.tsx` | 9 |
| `app/components/Views/Settings/AppInformation/index.js` | `.tsx` | 9 |
| `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js` | `.ts` | 9 |
| `app/core/RPCMethods/eth-request-accounts.js` | `.ts` | 9 |
| `app/store/migrations/007.js` | `.ts` | 9 |
| `app/store/migrations/008.js` | `.ts` | 9 |
| `app/util/date/index.js` | `.ts` | 9 |
| `app/util/payment-link-generator.js` | `.ts` | 9 |
| `app/components/Base/StatusText.js` | `.tsx` | 10 |
| `app/components/UI/EthereumAddress/index.js` | `.tsx` | 10 |
| `app/components/UI/Notification/index.js` | `.tsx` | 10 |
| `app/components/UI/PaymentRequestSuccess/index.js` | `.tsx` | 10 |
| `app/components/UI/SliderButton/index.js` | `.tsx` | 10 |
| `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` | `.tsx` | 10 |
| `app/components/Views/AccountBackupStep1/index.js` | `.tsx` | 10 |
| `app/components/Views/MediaPlayer/index.js` | `.tsx` | 10 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` | `.tsx` | 10 |
| `app/reducers/notification/index.js` | `.ts` | 10 |
| `app/util/streams.js` | `.ts` | 10 |
| `app/actions/settings/index.js` | `.ts` | 11 |
| `app/components/Base/DetailsModal.js` | `.tsx` | 11 |
| `app/components/Base/RemoteImage/index.js` | `.tsx` | 11 |
| `app/components/UI/AddressInputs/index.js` | `.tsx` | 11 |
| `app/components/UI/CustomAlert/index.js` | `.tsx` | 11 |
| `app/components/UI/WarningExistingUserModal/index.js` | `.tsx` | 11 |
| `app/lib/ens-ipfs/resolver.js` | `.ts` | 11 |
| `app/components/Base/Keypad/components.js` | `.tsx` | 12 |
| `app/components/UI/TransactionActionModal/index.js` | `.tsx` | 12 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` | `.tsx` | 12 |
| `app/util/middlewares.js` | `.ts` | 12 |
| `app/components/UI/WebsiteIcon/index.js` | `.tsx` | 13 |
| `app/components/Views/AddressQRCode/index.js` | `.tsx` | 13 |
| `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx` | `.tsx` | 13 |
| `app/util/test/ganache-seeder.js` | `.ts` | 13 |
| `app/actions/browser/index.js` | `.ts` | 14 |
| `app/components/UI/NavbarBrowserTitle/index.js` | `.tsx` | 14 |
| `app/components/UI/StyledButton/index.ios.js` | `.tsx` | 14 |
| `app/components/UI/Swaps/components/ActionAlert.js` | `.tsx` | 14 |
| `app/components/Views/GasEducationCarousel/index.js` | `.tsx` | 14 |
| `app/core/BackgroundBridge/BackgroundBridge.test.js` | `.ts` | 14 |
| `app/store/migrations/004.js` | `.ts` | 14 |
| `app/components/UI/Notification/BaseNotification/index.js` | `.tsx` | 15 |
| `app/components/UI/Swaps/components/TokenIcon.js` | `.tsx` | 15 |
| `app/components/Views/ActivityView/index.js` | `.tsx` | 15 |
| `app/components/Views/ManualBackupStep1/index.js` | `.tsx` | 15 |
| `app/core/RPCMethods/wallet_switchEthereumChain.test.js` | `.ts` | 15 |
| `app/util/general/index.js` | `.ts` | 15 |
| `app/components/UI/SlippageSlider/index.js` | `.tsx` | 16 |
| `app/components/Views/AddBookmark/index.js` | `.tsx` | 16 |
| `app/components/Views/LockScreen/index.js` | `.tsx` | 16 |
| `app/util/custom-gas/index.js` | `.ts` | 16 |
| `app/components/UI/ActionView/index.js` | `.tsx` | 17 |
| `app/components/UI/BrowserBottomBar/index.js` | `.tsx` | 17 |
| `app/components/UI/ProtectYourWalletModal/index.js` | `.tsx` | 17 |
| `app/components/Views/CollectibleView/index.js` | `.tsx` | 17 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` | `.tsx` | 17 |
| `app/actions/notification/index.js` | `.ts` | 18 |
| `app/actions/transaction/index.js` | `.ts` | 18 |
| `app/components/UI/Notification/TransactionNotification/index.js` | `.tsx` | 18 |
| `app/components/UI/Swaps/components/QuotesModal.js` | `.tsx` | 18 |
| `app/components/Views/Collectible/index.js` | `.tsx` | 18 |
| `app/components/UI/ActionModal/ActionContent/index.js` | `.tsx` | 19 |
| `app/components/UI/CollectibleContractOverview/index.js` | `.tsx` | 19 |
| `app/core/Vault.js` | `.ts` | 19 |
| `app/util/confirmation/signatureUtils.js` | `.ts` | 19 |
| `app/components/UI/AccountInfoCard/index.js` | `.tsx` | 20 |
| `app/components/UI/NavbarTitle/index.js` | `.tsx` | 20 |
| `app/core/RPCMethods/wallet_addEthereumChain.js` | `.ts` | 20 |
| `app/reducers/collectibles/index.js` | `.ts` | 20 |

---

## High Errors (21–50) — Complex Conversions (63 files)

These files need significant type work including interface definitions, generic types, and potentially refactoring.

| File | Target | Errors |
|------|--------|-------:|
| `app/components/UI/OnboardingWizard/Coachmark/index.js` | `.tsx` | 21 |
| `app/components/UI/SelectComponent/index.js` | `.tsx` | 21 |
| `app/core/MobilePortStream.js` | `.ts` | 21 |
| `app/components/UI/ActionModal/index.js` | `.tsx` | 22 |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx` | `.tsx` | 22 |
| `app/core/RPCMethods/lib/ethereum-chain-utils.js` | `.ts` | 22 |
| `app/core/SecureKeychain.js` | `.ts` | 22 |
| `app/util/ENSUtils.js` | `.ts` | 22 |
| `app/util/test/network-store.js` | `.ts` | 22 |
| `app/components/UI/Collectibles/index.js` | `.tsx` | 23 |
| `app/components/UI/Swaps/utils/index.js` | `.ts` | 23 |
| `app/components/Views/ErrorBoundary/index.js` | `.tsx` | 23 |
| `app/components/Views/Settings/Contacts/index.js` | `.tsx` | 23 |
| `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx` | `.tsx` | 23 |
| `app/components/Views/ManualBackupStep3/index.js` | `.tsx` | 24 |
| `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` | `.tsx` | 24 |
| `app/components/Views/TransactionSummary/index.js` | `.tsx` | 24 |
| `app/store/migrations/023.js` | `.ts` | 24 |
| `app/components/UI/StyledButton/index.android.js` | `.tsx` | 25 |
| `app/components/Views/WalletConnectSessions/index.js` | `.tsx` | 25 |
| `app/reducers/swaps/index.js` | `.ts` | 25 |
| `app/util/test/testSetup.js` | `.tsx` | 25 |
| `app/components/Nav/Main/index.js` | `.tsx` | 26 |
| `app/components/Views/TransactionsView/index.js` | `.tsx` | 26 |
| `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx` | `.tsx` | 26 |
| `app/components/UI/ReceiveRequest/index.js` | `.tsx` | 27 |
| `app/components/Views/ManualBackupStep2/index.js` | `.tsx` | 27 |
| `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx` | `.tsx` | 27 |
| `app/util/confirm-tx.js` | `.ts` | 27 |
| `app/components/UI/AnimatedTransactionModal/index.js` | `.tsx` | 28 |
| `app/components/UI/GlobalAlert/index.js` | `.tsx` | 29 |
| `app/util/sentry/utils.js` | `.ts` | 29 |
| `app/core/BackgroundBridge/BackgroundBridge.js` | `.ts` | 30 |
| `app/components/Nav/Main/RootRPCMethodsUI.js` | `.tsx` | 31 |
| `app/components/Base/Keypad/Keypad.test.js` | `.tsx` | 32 |
| `app/components/UI/CollectibleContractElement/index.js` | `.tsx` | 33 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx` | `.tsx` | 33 |
| `app/reducers/notification/notification.test.js` | `.ts` | 34 |
| `app/components/UI/CollectibleOverview/index.js` | `.tsx` | 35 |
| `app/components/UI/Tabs/index.js` | `.tsx` | 37 |
| `app/components/Views/Settings/AdvancedSettings/index.js` | `.tsx` | 37 |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` | `.tsx` | 37 |
| `app/components/UI/Swaps/components/TokenSelectModal.js` | `.tsx` | 38 |
| `app/components/Views/Onboarding/index.js` | `.tsx` | 39 |
| `app/components/UI/TransactionElement/utils.js` | `.ts` | 40 |
| `app/components/Views/Browser/index.js` | `.tsx` | 40 |
| `app/components/Views/confirmations/legacy/components/TypedSign/index.js` | `.tsx` | 40 |
| `app/components/Views/ResetPassword/index.js` | `.tsx` | 41 |
| `app/components/UI/CollectibleContracts/index.js` | `.tsx` | 42 |
| `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` | `.tsx` | 42 |
| `app/components/Views/Settings/Contacts/ContactForm/index.js` | `.tsx` | 42 |
| `app/components/UI/Swaps/components/LoadingAnimation/index.js` | `.tsx` | 43 |
| `app/components/Base/Keypad/index.js` | `.tsx` | 44 |
| `app/components/Views/Settings/GeneralSettings/index.js` | `.tsx` | 44 |
| `app/components/Base/RangeInput.js` | `.tsx` | 45 |
| `app/components/UI/AccountOverview/index.js` | `.tsx` | 45 |
| `app/components/UI/OptinMetrics/index.js` | `.tsx` | 46 |
| `app/core/RPCMethods/wallet_addEthereumChain.test.js` | `.ts` | 46 |
| `app/components/UI/EditGasFeeLegacy/index.js` | `.tsx` | 47 |
| `app/components/UI/AccountApproval/index.js` | `.tsx` | 49 |
| `app/components/UI/AddCustomToken/index.js` | `.tsx` | 49 |
| `app/util/networks/index.js` | `.ts` | 49 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` | `.tsx` | 50 |

---

## Very High Errors (51+) — Major Conversions (37 files)

These files are the most complex to convert and may benefit from incremental migration or refactoring first.

| File | Target | Errors |
|------|--------|-------:|
| `app/components/Base/Keypad/constants.js` | `.ts` | 51 |
| `app/components/Views/ChoosePassword/index.js` | `.tsx` | 53 |
| `app/util/conversions.js` | `.ts` | 54 |
| `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx` | `.tsx` | 59 |
| `app/components/UI/Swaps/components/GasEditModal.js` | `.tsx` | 60 |
| `app/components/Views/Settings/NetworksSettings/index.js` | `.tsx` | 63 |
| `app/util/conversion/index.js` | `.ts` | 63 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` | `.tsx` | 64 |
| `app/components/UI/EditGasFee1559/index.js` | `.tsx` | 67 |
| `app/components/UI/TransactionElement/TransactionDetails/index.js` | `.tsx` | 70 |
| `app/components/Views/Asset/index.js` | `.tsx` | 71 |
| `app/components/UI/Swaps/index.js` | `.tsx` | 72 |
| `app/components/UI/TransactionElement/index.js` | `.tsx` | 72 |
| `app/components/Nav/Main/MainNavigator.js` | `.tsx` | 75 |
| `app/core/NotificationManager.js` | `.ts` | 76 |
| `app/components/UI/PaymentRequest/index.js` | `.tsx` | 79 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` | `.tsx` | 79 |
| `app/core/WalletConnect/WalletConnect.js` | `.ts` | 81 |
| `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` | `.tsx` | 85 |
| `app/components/Views/confirmations/legacy/Approval/index.js` | `.tsx` | 88 |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` | `.tsx` | 90 |
| `app/util/blockies.js` | `.ts` | 113 |
| `app/components/UI/Swaps/QuotesView.js` | `.tsx` | 118 |
| `app/util/number/index.js` | `.ts` | 121 |
| `app/components/Views/confirmations/legacy/Send/index.js` | `.tsx` | 122 |
| `app/components/UI/Transactions/index.js` | `.tsx` | 124 |
| `app/components/UI/DrawerView/index.js` | `.tsx` | 132 |
| `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` | `.tsx` | 150 |
| `app/components/Views/confirmations/legacy/Approve/index.js` | `.tsx` | 152 |
| `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` | `.tsx` | 152 |
| `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` | `.tsx` | 154 |
| `app/components/UI/Navbar/index.js` | `.tsx` | 160 |
| `app/util/transactions/index.js` | `.ts` | 164 |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` | `.tsx` | 170 |
| `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` | `.tsx` | 171 |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` | `.tsx` | 209 |
| `app/core/InpageBridgeWeb3.js` | `.tsx` | 9085 |

---

## Recommended Migration Order

1. **Start with zero-error files** — pure renames, no risk
2. **Tackle few-error files next** — mostly adding parameter types
3. **Group medium-error files by directory** — migrate related files together (e.g., all `actions/`, all `reducers/`, all `store/migrations/`)
4. **Address high-error UI components** — these often share patterns; solving one unblocks many
5. **Leave very-high-error files for last** — consider refactoring before migrating

### Common Error Patterns

| Pattern | Description | Fix |
|---------|-------------|-----|
| `TS7006` | Parameter implicitly has `any` type | Add explicit type annotations |
| `TS7031` | Binding element implicitly has `any` type | Type destructured parameters |
| `TS2339` | Property does not exist on type | Define interfaces / extend types |
| `TS2345` | Argument not assignable | Fix type mismatches |
| `TS2322` | Type not assignable | Correct return types / props |

### PR Naming Convention

Use: `chore(js-ts): Convert [filename] to TypeScript`

---

## Notes

- Error counts are based on a **batch rename** approach (all files renamed simultaneously), so counts include cascading errors from cross-file imports.
- Some files (especially test files) may have fewer errors when converted individually.
- `app/core/InpageBridgeWeb3.js` shows 9,085 errors — this is a generated/bundled file and should likely be excluded from migration.
- Migration should be validated with the full test suite after each batch of conversions.
