# TypeScript Migration Roadmap

## Overview

This document provides a comprehensive audit of all remaining JavaScript files in the `app/` directory that need to be migrated to TypeScript. Files are categorized and ordered by recommended migration priority (leaf nodes/utilities first, then components, then reducers, then complex controllers).

**Total JavaScript files remaining:** 333

## Summary by Category

| Category | Count | Priority |
|----------|-------|----------|
| Utilities | 32 | 1 (Highest) |
| Constants | 3 | 1 (Highest) |
| Actions | 11 | 2 |
| Reducers | 14 | 3 |
| Base Components | 12 | 4 |
| UI Components | 103 | 5 |
| View Components | 80 | 6 |
| Navigation Components | 3 | 7 |
| Core/Controllers | 25 | 8 |
| Store/Migrations | 38 | 9 |
| Mocks/Test Utilities | 6 | 10 (Lowest) |
| Library Files | 5 | 10 (Lowest) |
| Image Assets | 1 | 10 (Lowest) |

---

## Phase 1: Utilities and Constants (Priority 1)

These files have minimal dependencies and are used throughout the codebase. Migrating them first provides type safety for downstream consumers.

### Utility Files (32 files)

#### Core Utilities (Migrate First)
1. `app/util/general/index.js` - General utility functions
2. `app/util/number/index.js` - Number formatting utilities
3. `app/util/date/index.js` - Date formatting utilities
4. `app/util/device/index.js` - Device detection utilities
5. `app/util/scaling.js` - UI scaling utilities
6. `app/util/blockies.js` - Blockie avatar generation
7. `app/util/streams.js` - Stream utilities

#### Conversion Utilities
8. `app/util/conversion/index.js` - Value conversion utilities
9. `app/util/conversions.js` - Legacy conversion utilities
10. `app/util/conversions.test.js` - Conversion tests

#### Network/Blockchain Utilities
11. `app/util/networks/index.js` - Network utilities
12. `app/util/etherscan.js` - Etherscan integration
13. `app/util/ENSUtils.js` - ENS resolution utilities
14. `app/util/walletconnect.js` - WalletConnect utilities

#### Transaction Utilities
15. `app/util/transactions/index.js` - Transaction utilities
16. `app/util/confirm-tx.js` - Transaction confirmation utilities
17. `app/util/gasUtils.js` - Gas estimation utilities
18. `app/util/custom-gas/index.js` - Custom gas utilities
19. `app/util/payment-link-generator.js` - Payment link generation

#### Security/Validation Utilities
20. `app/util/confusables/index.js` - Confusable character detection
21. `app/util/confirmation/signatureUtils.js` - Signature utilities
22. `app/util/dapp-url-list.js` - DApp URL whitelist

#### Middleware
23. `app/util/middlewares.js` - Redux middleware utilities

#### Sentry/Logging
24. `app/util/sentry/utils.js` - Sentry error reporting utilities

#### Test Utilities (Lower Priority)
25. `app/util/test/assetFileTransformer.js`
26. `app/util/test/contract-address-registry.js`
27. `app/util/test/ganache-seeder.js`
28. `app/util/test/ganache.js`
29. `app/util/test/network-store.js`
30. `app/util/test/smart-contracts.js`
31. `app/util/test/testSetup.js`
32. `app/util/test/utils.js`

### Constants (3 files)
1. `app/constants/navigation.js` - Navigation route constants
2. `app/constants/network.js` - Network constants
3. `app/constants/onboarding.js` - Onboarding constants

---

## Phase 2: Actions (Priority 2)

Action creators that define Redux action types. Should be migrated after utilities.

### Action Files (11 files)
1. `app/actions/alert/index.js`
2. `app/actions/bookmarks/index.js`
3. `app/actions/browser/index.js`
4. `app/actions/collectibles/index.js`
5. `app/actions/infuraAvailability/index.js`
6. `app/actions/modals/index.js`
7. `app/actions/notification/index.js`
8. `app/actions/privacy/index.js`
9. `app/actions/settings/index.js`
10. `app/actions/transaction/index.js`
11. `app/actions/wizard/index.js`

---

## Phase 3: Reducers (Priority 3)

Redux reducers that manage application state. Should be migrated after actions.

### Reducer Files (14 files)

#### Simple Reducers (Migrate First)
1. `app/reducers/alert/index.js` - Alert state
2. `app/reducers/bookmarks/index.js` - Bookmarks state
3. `app/reducers/wizard/index.js` - Onboarding wizard state
4. `app/reducers/infuraAvailability/index.js` - Infura availability state
5. `app/reducers/privacy/index.js` - Privacy settings state
6. `app/reducers/modals/index.js` - Modal visibility state

#### Medium Complexity Reducers
7. `app/reducers/settings/index.js` - App settings state
8. `app/reducers/browser/index.js` - Browser state
9. `app/reducers/browser/index.test.js` - Browser reducer tests
10. `app/reducers/collectibles/index.js` - NFT favorites state

#### Complex Reducers
11. `app/reducers/notification/index.js` - Notification queue state
12. `app/reducers/notification/notification.test.js` - Notification tests
13. `app/reducers/transaction/index.js` - Transaction state
14. `app/reducers/swaps/index.js` - Swaps state (most complex)

---

## Phase 4: Base Components (Priority 4)

Foundational UI components used by other components.

### Base Component Files (12 files)
1. `app/components/Base/DetailsModal.js`
2. `app/components/Base/RangeInput.js`
3. `app/components/Base/StatusText.js`
4. `app/components/Base/TabBar.js`
5. `app/components/Base/RemoteImage/index.js`
6. `app/components/Base/Keypad/index.js`
7. `app/components/Base/Keypad/components.js`
8. `app/components/Base/Keypad/constants.js`
9. `app/components/Base/Keypad/createKeypadRule.js`
10. `app/components/Base/Keypad/createKeypadRule.test.js`
11. `app/components/Base/Keypad/Keypad.test.js`
12. `app/components/Base/Keypad/useCurrency.js`

---

## Phase 5: UI Components (Priority 5)

Reusable UI components. Migrate in order of dependency (leaf components first).

### Simple UI Components (Migrate First - 40 files)
1. `app/components/UI/AnimatedSpinner/index.js`
2. `app/components/UI/Button/index.js`
3. `app/components/UI/Confetti/index.js`
4. `app/components/UI/CustomAlert/index.js`
5. `app/components/UI/EthereumAddress/index.js`
6. `app/components/UI/FadeAnimationView/index.js`
7. `app/components/UI/FadeOutOverlay/index.js`
8. `app/components/UI/FoxScreen/index.js`
9. `app/components/UI/GlobalAlert/index.js`
10. `app/components/UI/HintModal/index.js`
11. `app/components/UI/NetworkMainAssetLogo/index.js`
12. `app/components/UI/Screen/index.js`
13. `app/components/UI/SelectComponent/index.js`
14. `app/components/UI/SettingsDrawer/index.js`
15. `app/components/UI/SettingsNotification/index.js`
16. `app/components/UI/SliderButton/index.js`
17. `app/components/UI/SlippageSlider/index.js`
18. `app/components/UI/TimeEstimateInfoModal/index.js`
19. `app/components/UI/TokenImage/index.js`
20. `app/components/UI/WebsiteIcon/index.js`
21. `app/components/UI/WebviewError/index.js`
22. `app/components/UI/WebviewProgressBar/index.js`

### StyledButton (Platform-specific - 3 files)
23. `app/components/UI/StyledButton/index.js`
24. `app/components/UI/StyledButton/index.android.js`
25. `app/components/UI/StyledButton/index.ios.js`

### Notification Components (4 files)
26. `app/components/UI/Notification/index.js`
27. `app/components/UI/Notification/BaseNotification/index.js`
28. `app/components/UI/Notification/BaseNotification/index.test.jsx`
29. `app/components/UI/Notification/SimpleNotification/index.js`
30. `app/components/UI/Notification/TransactionNotification/index.js`

### Modal Components (8 files)
31. `app/components/UI/ActionModal/index.js`
32. `app/components/UI/ActionModal/ActionContent/index.js`
33. `app/components/UI/ActionView/index.js`
34. `app/components/UI/PhishingModal/index.js`
35. `app/components/UI/ProtectYourWalletModal/index.js`
36. `app/components/UI/SeedphraseModal/index.js`
37. `app/components/UI/SkipAccountSecurityModal/index.js`
38. `app/components/UI/WarningExistingUserModal/index.js`

### Navbar Components (5 files)
39. `app/components/UI/Navbar/index.js`
40. `app/components/UI/Navbar/index.test.jsx`
41. `app/components/UI/NavbarBrowserTitle/index.js`
42. `app/components/UI/NavbarTitle/index.js`
43. `app/components/UI/NavbarTitle/index.test.js`

### Account Components (3 files)
44. `app/components/UI/AccountApproval/index.js`
45. `app/components/UI/AccountInfoCard/index.js`
46. `app/components/UI/AccountOverview/index.js`

### Collectible/NFT Components (6 files)
47. `app/components/UI/Collectibles/index.js`
48. `app/components/UI/CollectibleContracts/index.js`
49. `app/components/UI/CollectibleContractElement/index.js`
50. `app/components/UI/CollectibleContractInformation/index.js`
51. `app/components/UI/CollectibleContractOverview/index.js`
52. `app/components/UI/CollectibleOverview/index.js`

### Transaction Components (8 files)
53. `app/components/UI/TransactionElement/index.js`
54. `app/components/UI/TransactionElement/utils.js`
55. `app/components/UI/TransactionElement/utils.test.js`
56. `app/components/UI/TransactionElement/TransactionDetails/index.js`
57. `app/components/UI/TransactionHeader/index.js`
58. `app/components/UI/Transactions/index.js`
59. `app/components/UI/TransactionActionModal/index.js`
60. `app/components/UI/TransactionActionModal/TransactionActionContent/index.js`

### Gas Fee Components (4 files)
61. `app/components/UI/EditGasFee1559/index.js`
62. `app/components/UI/EditGasFeeLegacy/index.js`
63. `app/components/UI/AnimatedTransactionModal/index.js`

### Swaps Components (20 files)
64. `app/components/UI/Swaps/index.js`
65. `app/components/UI/Swaps/QuotesView.js`
66. `app/components/UI/Swaps/components/ActionAlert.js`
67. `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js`
68. `app/components/UI/Swaps/components/AssetSwapButton.js`
69. `app/components/UI/Swaps/components/GasEditModal.js`
70. `app/components/UI/Swaps/components/LoadingAnimation/index.js`
71. `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js`
72. `app/components/UI/Swaps/components/Onboarding.js`
73. `app/components/UI/Swaps/components/QuotesModal.js`
74. `app/components/UI/Swaps/components/QuotesSummary.js`
75. `app/components/UI/Swaps/components/SlippageModal.js`
76. `app/components/UI/Swaps/components/TokenIcon.js`
77. `app/components/UI/Swaps/components/TokenIcon.test.js`
78. `app/components/UI/Swaps/components/TokenImportModal.js`
79. `app/components/UI/Swaps/components/TokenSelectButton.js`
80. `app/components/UI/Swaps/components/TokenSelectButton.test.js`
81. `app/components/UI/Swaps/components/TokenSelectModal.js`
82. `app/components/UI/Swaps/utils/index.js`
83. `app/components/UI/Swaps/utils/index.test.js`
84. `app/components/UI/Swaps/utils/useBalance.js`
85. `app/components/UI/Swaps/utils/useBlockExplorer.js`
86. `app/components/UI/Swaps/utils/useFetchTokenMetadata.js`

### Other UI Components (18 files)
87. `app/components/UI/AddCustomToken/index.js`
88. `app/components/UI/AddressInputs/index.js`
89. `app/components/UI/AddressInputs/index.test.jsx`
90. `app/components/UI/AssetList/index.js`
91. `app/components/UI/BasicFunctionality/BasicFunctionality.test.js`
92. `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js`
93. `app/components/UI/BrowserBottomBar/index.js`
94. `app/components/UI/DrawerView/index.js`
95. `app/components/UI/ManageNetworks/ManageNetworks.test.js`
96. `app/components/UI/OnboardingWizard/Coachmark/index.js`
97. `app/components/UI/OptinMetrics/index.js`
98. `app/components/UI/PaymentRequest/index.js`
99. `app/components/UI/PaymentRequestSuccess/index.js`
100. `app/components/UI/ReceiveRequest/index.js`
101. `app/components/UI/SwitchCustomNetwork/index.js`
102. `app/components/UI/Tabs/index.js`
103. `app/components/UI/Tabs/TabCountIcon/index.js`

---

## Phase 6: View Components (Priority 6)

Screen-level components. Migrate after UI components they depend on.

### Simple View Components (20 files)
1. `app/components/Views/AddBookmark/index.js`
2. `app/components/Views/AddressQRCode/index.js`
3. `app/components/Views/ActivityView/index.js`
4. `app/components/Views/Collectible/index.js`
5. `app/components/Views/CollectibleView/index.js`
6. `app/components/Views/EnterPasswordSimple/index.js`
7. `app/components/Views/ErrorBoundary/index.js`
8. `app/components/Views/GasEducationCarousel/index.js`
9. `app/components/Views/ImportPrivateKeySuccess/index.js`
10. `app/components/Views/LockScreen/index.js`
11. `app/components/Views/OfflineMode/index.js`
12. `app/components/Views/SimpleWebview/index.js`
13. `app/components/Views/TermsAndConditions/index.js`
14. `app/components/Views/TransactionSummary/index.js`
15. `app/components/Views/TransactionsView/index.js`
16. `app/components/Views/WalletConnectSessions/index.js`

### Onboarding Views (6 files)
17. `app/components/Views/Onboarding/index.js`
18. `app/components/Views/OnboardingSuccess/index.test.js`
19. `app/components/Views/AccountBackupStep1/index.js`
20. `app/components/Views/AccountBackupStep1B/index.js`
21. `app/components/Views/ManualBackupStep1/index.js`
22. `app/components/Views/ManualBackupStep2/index.js`
23. `app/components/Views/ManualBackupStep3/index.js`

### Password/Security Views (3 files)
24. `app/components/Views/ChoosePassword/index.js`
25. `app/components/Views/ResetPassword/index.js`
26. `app/components/Views/ImportFromSecretRecoveryPhrase/index.js`

### Asset Views (2 files)
27. `app/components/Views/Asset/index.js`
28. `app/components/Views/Asset/index.test.js`

### Media Views (2 files)
29. `app/components/Views/MediaPlayer/index.js`
30. `app/components/Views/MediaPlayer/AndroidMediaPlayer.js`

### Settings Views (7 files)
31. `app/components/Views/Settings/AdvancedSettings/index.js`
32. `app/components/Views/Settings/AppInformation/index.js`
33. `app/components/Views/Settings/Contacts/index.js`
34. `app/components/Views/Settings/Contacts/ContactForm/index.js`
35. `app/components/Views/Settings/GeneralSettings/index.js`
36. `app/components/Views/Settings/NetworksSettings/index.js`
37. `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js`
38. `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js`

### Browser View (1 file)
39. `app/components/Views/Browser/index.js`

### Navigation Test Views (4 files)
40. `app/components/Views/NavigationUnitTest/index.js`
41. `app/components/Views/NavigationUnitTest/TestScreen1.test.js`
42. `app/components/Views/NavigationUnitTest/TestScreen2.test.js`
43. `app/components/Views/NavigationUnitTest/TestScreen3.test.js`

### Confirmations/Legacy Views (37 files)
44. `app/components/Views/confirmations/mock-data.js`
45. `app/components/Views/confirmations/legacy/Approval/index.js`
46. `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js`
47. `app/components/Views/confirmations/legacy/Approve/index.js`
48. `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js`
49. `app/components/Views/confirmations/legacy/Send/index.js`
50. `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js`
51. `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx`
52. `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js`
53. `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js`
54. `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js`
55. `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx`
56. `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js`
57. `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js`
58. `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js`
59. `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js`
60. `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js`
61. `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx`
62. `app/components/Views/confirmations/legacy/components/CustomNonce/index.js`
63. `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx`
64. `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx`
65. `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js`
66. `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js`
67. `app/components/Views/confirmations/legacy/components/TransactionReview/index.js`
68. `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`
69. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js`
70. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js`
71. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js`
72. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js`
73. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx`
74. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx`
75. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js`
76. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js`
77. `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js`
78. `app/components/Views/confirmations/legacy/components/TypedSign/index.js`
79. `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx`
80. `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js`

---

## Phase 7: Navigation Components (Priority 7)

Main navigation structure. Migrate after view components.

### Navigation Files (3 files)
1. `app/components/Nav/Main/index.js`
2. `app/components/Nav/Main/MainNavigator.js`
3. `app/components/Nav/Main/RootRPCMethodsUI.js`

---

## Phase 8: Core/Controllers (Priority 8)

Core business logic and controllers. Most complex, migrate last.

### Core Files (25 files)

#### Simple Core Files
1. `app/core/ClipboardManager.js`
2. `app/core/DrawerStatusTracker.js`
3. `app/core/PreventScreenshot.js`
4. `app/core/TransactionTypes.js`

#### Security/Keychain
5. `app/core/SecureKeychain.js`
6. `app/core/Vault.js`

#### Web3/Bridge
7. `app/core/EntryScriptWeb3.js`
8. `app/core/InpageBridgeWeb3.js`
9. `app/core/MobilePortStream.js`
10. `app/core/BackgroundBridge/BackgroundBridge.js`
11. `app/core/BackgroundBridge/BackgroundBridge.test.js`

#### Notifications
12. `app/core/NotificationManager.js`

#### Permissions
13. `app/core/Permissions/specifications.js`
14. `app/core/Permissions/specifications.test.js`

#### RPC Methods
15. `app/core/RPCMethods/index.js`
16. `app/core/RPCMethods/handlers/index.js`
17. `app/core/RPCMethods/eth-request-accounts.js`
18. `app/core/RPCMethods/lib/ethereum-chain-utils.js`
19. `app/core/RPCMethods/wallet_addEthereumChain.js`
20. `app/core/RPCMethods/wallet_addEthereumChain.test.js`
21. `app/core/RPCMethods/wallet_switchEthereumChain.js`
22. `app/core/RPCMethods/wallet_switchEthereumChain.test.js`
23. `app/core/RPCMethods/createEip1193MethodMiddleware/index.js`
24. `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`

#### WalletConnect
25. `app/core/WalletConnect/WalletConnect.js`

---

## Phase 9: Store/Migrations (Priority 9)

State migrations. Can be migrated independently.

### Migration Files (38 files)
1. `app/store/migrations/000.js` through `app/store/migrations/028.test.js`

---

## Phase 10: Supporting Files (Priority 10 - Lowest)

Files that can be migrated last or may not need migration.

### Mock Files (6 files)
1. `app/__mocks__/pngMock.js`
2. `app/__mocks__/react-native-device-info.js`
3. `app/__mocks__/react-native-splash-screen.js`
4. `app/__mocks__/react-native-view-shot.js`
5. `app/__mocks__/rn-fetch-blob.js`
6. `app/__mocks__/svgMock.js`

### Library Files (5 files)
1. `app/lib/ens-ipfs/contracts/registry.js`
2. `app/lib/ens-ipfs/contracts/resolver.js`
3. `app/lib/ens-ipfs/resolver.js`
4. `app/lib/ppom/blockaid-version.js`
5. `app/lib/ppom/ppom.html.js`

### Image Assets (1 file)
1. `app/images/image-icons.js`

---

## Dependency Considerations

When migrating files, consider these dependency relationships:

1. **Utilities** are imported by almost everything - migrate first
2. **Constants** are imported by actions, reducers, and components
3. **Actions** are imported by reducers and components
4. **Reducers** are imported by the root reducer and selectors
5. **Base Components** are imported by UI Components
6. **UI Components** are imported by View Components
7. **View Components** are imported by Navigation
8. **Core/Controllers** have complex interdependencies - migrate carefully

## Recommended Migration Strategy

1. Start with leaf nodes (utilities, constants) that have no internal dependencies
2. Work up the dependency tree
3. For each file:
   - Create TypeScript interfaces for props/state
   - Add proper type annotations
   - Export types for consumers
   - Update imports in consuming files as needed
4. Run `yarn lint:tsc` after each migration to catch type errors
5. Follow the PR naming convention: `chore(js-ts): Convert [filename] to TypeScript`

## Notes

- Test files (`.test.js`, `.test.jsx`) should be migrated alongside their source files
- Platform-specific files (`.android.js`, `.ios.js`) should be migrated together
- Some files may have complex dependencies that require migrating multiple files together
