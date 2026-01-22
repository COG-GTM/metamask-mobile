# TypeScript Migration Audit - Phase 1

## Executive Summary

This document provides a comprehensive audit of the remaining JavaScript files in the MetaMask Mobile codebase, along with TypeScript configuration improvements and build script verification results.

**Current Migration Status:**
- TypeScript files in `app/`: 3,932 files (~92%)
- JavaScript files in `app/`: 333 files (~8%)

## 1. Remaining JavaScript Files

### 1.1 File Inventory by Category

#### Mocks (6 files) - Simple
| File | Complexity | Notes |
|------|------------|-------|
| `app/__mocks__/pngMock.js` | Simple | Asset mock |
| `app/__mocks__/react-native-device-info.js` | Simple | Library mock |
| `app/__mocks__/react-native-splash-screen.js` | Simple | Library mock |
| `app/__mocks__/react-native-view-shot.js` | Simple | Library mock |
| `app/__mocks__/rn-fetch-blob.js` | Simple | Library mock |
| `app/__mocks__/svgMock.js` | Simple | Asset mock |

#### Redux Actions (11 files) - Simple
| File | Complexity | Notes |
|------|------------|-------|
| `app/actions/alert/index.js` | Simple | Action creators |
| `app/actions/bookmarks/index.js` | Simple | Action creators |
| `app/actions/browser/index.js` | Simple | Action creators |
| `app/actions/collectibles/index.js` | Simple | Action creators |
| `app/actions/infuraAvailability/index.js` | Simple | Action creators |
| `app/actions/modals/index.js` | Simple | Action creators |
| `app/actions/notification/index.js` | Simple | Action creators |
| `app/actions/privacy/index.js` | Simple | Action creators |
| `app/actions/settings/index.js` | Simple | Action creators |
| `app/actions/transaction/index.js` | Simple | Action creators |
| `app/actions/wizard/index.js` | Simple | Action creators |

#### Redux Reducers (14 files) - Medium
| File | Complexity | Notes |
|------|------------|-------|
| `app/reducers/alert/index.js` | Medium | Redux reducer |
| `app/reducers/bookmarks/index.js` | Medium | Redux reducer |
| `app/reducers/browser/index.js` | Medium | Redux reducer |
| `app/reducers/browser/index.test.js` | Medium | Test file |
| `app/reducers/collectibles/index.js` | Medium | Redux reducer |
| `app/reducers/infuraAvailability/index.js` | Medium | Redux reducer |
| `app/reducers/modals/index.js` | Medium | Redux reducer |
| `app/reducers/notification/index.js` | Medium | Redux reducer |
| `app/reducers/notification/notification.test.js` | Medium | Test file |
| `app/reducers/privacy/index.js` | Medium | Redux reducer |
| `app/reducers/settings/index.js` | Medium | Redux reducer |
| `app/reducers/swaps/index.js` | Medium | Redux reducer |
| `app/reducers/transaction/index.js` | Medium | Redux reducer |
| `app/reducers/wizard/index.js` | Medium | Redux reducer |

#### Store Migrations (28 files) - Simple
| File | Complexity | Notes |
|------|------------|-------|
| `app/store/migrations/000.js` - `027.js` | Simple | Data migrations |
| `app/store/migrations/019.test.js` - `028.test.js` | Simple | Migration tests |

#### Constants (3 files) - Simple
| File | Complexity | Notes |
|------|------------|-------|
| `app/constants/navigation.js` | Simple | Navigation constants |
| `app/constants/network.js` | Simple | Network constants |
| `app/constants/onboarding.js` | Simple | Onboarding constants |

#### Base Components (9 files) - Medium
| File | Complexity | Notes |
|------|------------|-------|
| `app/components/Base/DetailsModal.js` | Medium | Modal component |
| `app/components/Base/Keypad/*.js` | Medium | Keypad components (6 files) |
| `app/components/Base/RangeInput.js` | Medium | Input component |
| `app/components/Base/RemoteImage/index.js` | Medium | Image component |
| `app/components/Base/StatusText.js` | Medium | Text component |
| `app/components/Base/TabBar.js` | Medium | Navigation component |

#### UI Components (80+ files) - Complex
Files in `app/components/UI/` including:
- Account-related components (AccountApproval, AccountInfoCard, AccountOverview)
- Modal components (ActionModal, HintModal, PhishingModal, etc.)
- Navigation components (Navbar, NavbarTitle, BrowserBottomBar)
- Transaction components (TransactionElement, TransactionHeader, Transactions)
- Swaps components (QuotesView, various sub-components)
- Notification components
- Onboarding components

#### View Components (50+ files) - Complex
Files in `app/components/Views/` including:
- Account backup views
- Browser view
- Collectible views
- Settings views
- Confirmation/legacy views
- SendFlow components

#### Core Modules (18 files) - Complex
| File | Complexity | Notes |
|------|------------|-------|
| `app/core/BackgroundBridge/BackgroundBridge.js` | Complex | Bridge implementation |
| `app/core/ClipboardManager.js` | Medium | Clipboard utilities |
| `app/core/DrawerStatusTracker.js` | Simple | Status tracking |
| `app/core/EntryScriptWeb3.js` | Complex | Web3 injection |
| `app/core/InpageBridgeWeb3.js` | Complex | Web3 bridge |
| `app/core/MobilePortStream.js` | Medium | Stream handling |
| `app/core/NotificationManager.js` | Complex | Notification handling |
| `app/core/Permissions/specifications.js` | Complex | Permission specs |
| `app/core/PreventScreenshot.js` | Simple | Screenshot prevention |
| `app/core/RPCMethods/*.js` | Complex | RPC method handlers |
| `app/core/SecureKeychain.js` | Complex | Keychain management |
| `app/core/TransactionTypes.js` | Simple | Type definitions |
| `app/core/Vault.js` | Complex | Vault management |
| `app/core/WalletConnect/WalletConnect.js` | Complex | WalletConnect integration |

#### Utility Modules (24 files) - Simple/Medium
Files in `app/util/` including:
- ENSUtils.js, blockies.js, confirm-tx.js
- Conversion utilities
- Date/device/network utilities
- Transaction utilities

#### Library Files (5 files) - Medium
| File | Complexity | Notes |
|------|------------|-------|
| `app/lib/ens-ipfs/contracts/registry.js` | Medium | ENS registry |
| `app/lib/ens-ipfs/contracts/resolver.js` | Medium | ENS resolver |
| `app/lib/ens-ipfs/resolver.js` | Medium | IPFS resolver |
| `app/lib/ppom/blockaid-version.js` | Simple | Version constant |
| `app/lib/ppom/ppom.html.js` | Simple | HTML template |

#### Test Utilities (8 files) - Simple
Files in `app/util/test/` - test setup and utilities

#### Images (1 file) - Simple
| File | Complexity | Notes |
|------|------------|-------|
| `app/images/image-icons.js` | Simple | Image icon mappings |

### 1.2 Complexity Summary

| Complexity | Count | Percentage |
|------------|-------|------------|
| Simple | ~120 | 36% |
| Medium | ~80 | 24% |
| Complex | ~133 | 40% |

### 1.3 Priority Order for Migration

**Priority 1 - Quick Wins (Simple files with no dependencies):**
1. Constants files (`app/constants/*.js`)
2. Mock files (`app/__mocks__/*.js`)
3. Image mappings (`app/images/image-icons.js`)
4. Store migrations (`app/store/migrations/*.js`)
5. Test utilities (`app/util/test/*.js`)

**Priority 2 - Redux Layer:**
1. Action creators (`app/actions/*/index.js`)
2. Reducers (`app/reducers/*/index.js`)

**Priority 3 - Utility Functions:**
1. Pure utility functions (`app/util/*.js`)
2. Library files (`app/lib/*.js`)

**Priority 4 - Base Components:**
1. Simple base components (`app/components/Base/*.js`)

**Priority 5 - Complex Components (requires careful migration):**
1. UI components (`app/components/UI/*.js`)
2. View components (`app/components/Views/*.js`)
3. Core modules (`app/core/*.js`)

## 2. TypeScript Configuration Changes

### 2.1 Options Enabled

The following strict TypeScript options have been enabled in `tsconfig.json`:

| Option | Status | Error Count | Notes |
|--------|--------|-------------|-------|
| `noImplicitAny` | Enabled | 0 | No errors, safe to enable |
| `strictNullChecks` | Enabled | 0 | No errors, safe to enable |

### 2.2 Options Kept Disabled

The following options were tested but kept disabled due to error counts:

| Option | Status | Error Count | Notes |
|--------|--------|-------------|-------|
| `noUnusedLocals` | Disabled | 18 | Manageable errors, recommend enabling in Phase 2 |
| `noUnusedParameters` | Disabled | (included above) | Same as noUnusedLocals |

### 2.3 Errors for noUnusedLocals/noUnusedParameters

The 18 errors found when enabling these options are in the following files:

1. `app/component-library/components-temp/SegmentedControl/SegmentedControl.stories.tsx` - `_unusedComponents`
2. `app/components/UI/OnboardingWizard/Step2/index.tsx` - `useCallback`, `useEffect`, `useState`
3. `app/components/UI/OnboardingWizard/Step3/index.tsx` - `useCallback`, `useEffect`, `useState`
4. `app/components/UI/Ramp/utils/index.ts` - `buyOrSellQuotes`, `quote`
5. `app/components/Views/confirmations/legacy/components/Approval/TemplateConfirmation/Templates/SmartTransactionStatus.ts` - `strings`
6. `app/core/Engine/Engine.ts` - `options`
7. `app/core/RPCMethods/RPCMethodMiddleware.ts` - `setApprovalFlowLoadingText`
8. `app/core/SDKConnect/BatchRPCManager.ts` - `channelId`
9. `app/core/SDKConnect/SDKConnect.ts` - `SDKConnect`
10. `app/util/notifications/notification-states/index.test.tsx` - `n`
11. `app/util/smart-transactions/smart-publish-hook.ts` - `#isNativeTokenTransferred`

**Recommendation:** These errors are straightforward to fix (remove unused imports/variables or prefix with underscore). Consider enabling these options in Phase 2 after fixing the 18 errors.

## 3. Build Script Verification

### 3.1 TypeScript-Related Scripts

| Script | Command | Status |
|--------|---------|--------|
| `lint:tsc` | `tsc --project ./tsconfig.json` | Passing |
| `lint` | `eslint '**/*.{js,ts,tsx}'` | Configured |

### 3.2 Build Scripts

All build scripts use `./scripts/build.sh` which handles both JavaScript and TypeScript files through Babel/Metro bundler:

| Script | Purpose | TypeScript Support |
|--------|---------|-------------------|
| `start:ios` | iOS development build | Yes |
| `start:android` | Android development build | Yes |
| `build:android:release` | Android production build | Yes |
| `build:ios:release` | iOS production build | Yes |
| `start:ios:flask` | Flask variant iOS | Yes |
| `start:android:flask` | Flask variant Android | Yes |

### 3.3 Jest Configuration

The Jest configuration in `jest.config.js` is properly set up for TypeScript:

- **Transform:** Uses `babel-jest` for `.js`, `.ts`, `.tsx`, `.jsx` files
- **Coverage:** Collects from `<rootDir>/app/**/*.{js,ts,tsx,jsx}`
- **Module Extensions:** Uses default Jest order (js, jsx, ts, tsx, json, node)

**Note:** The default `moduleFileExtensions` order prioritizes `.js` over `.ts`, but this is acceptable since files should not have duplicate extensions. No changes needed.

### 3.4 Issues Found

No issues were found with the build scripts. All variants properly handle TypeScript files through the existing Babel/Metro configuration.

## 4. Fitness Function

The repository already has a fitness function that prevents new JavaScript files from being added to the `app/` directory:

**Location:** `.github/scripts/fitness-functions/rules/javascript-additions.test.ts`

This function:
- Passes when no new `.js` or `.jsx` files are added to `app/`
- Fails when new `.js` or `.jsx` files are created in `app/`
- Allows modifications to existing JavaScript files

## 5. Recommendations for Phase 2

1. **Enable `noUnusedLocals` and `noUnusedParameters`:** Fix the 18 identified errors and enable these options.

2. **Migrate Priority 1 files first:** Start with constants, mocks, and simple utility files that can be renamed with minimal changes.

3. **Create migration tickets:** For each category of files, create tickets to track migration progress.

4. **Address `any` types in reducers:** The `app/reducers/index.ts` file uses `any` types (lines 56-127) that should be properly typed.

5. **Consider enabling additional strict options:**
   - `strictFunctionTypes`
   - `strictPropertyInitialization`
   - `noImplicitThis`
   - `noImplicitReturns`
   - `noFallthroughCasesInSwitch`

## 6. Appendix: Complete File List

### All JavaScript Files in app/ Directory

```
app/__mocks__/pngMock.js
app/__mocks__/react-native-device-info.js
app/__mocks__/react-native-splash-screen.js
app/__mocks__/react-native-view-shot.js
app/__mocks__/rn-fetch-blob.js
app/__mocks__/svgMock.js
app/actions/alert/index.js
app/actions/bookmarks/index.js
app/actions/browser/index.js
app/actions/collectibles/index.js
app/actions/infuraAvailability/index.js
app/actions/modals/index.js
app/actions/notification/index.js
app/actions/privacy/index.js
app/actions/settings/index.js
app/actions/transaction/index.js
app/actions/wizard/index.js
app/components/Base/DetailsModal.js
app/components/Base/Keypad/Keypad.test.js
app/components/Base/Keypad/components.js
app/components/Base/Keypad/constants.js
app/components/Base/Keypad/createKeypadRule.js
app/components/Base/Keypad/createKeypadRule.test.js
app/components/Base/Keypad/index.js
app/components/Base/Keypad/useCurrency.js
app/components/Base/RangeInput.js
app/components/Base/RemoteImage/index.js
app/components/Base/StatusText.js
app/components/Base/TabBar.js
app/components/Nav/Main/MainNavigator.js
app/components/Nav/Main/RootRPCMethodsUI.js
app/components/Nav/Main/index.js
app/components/UI/AccountApproval/index.js
app/components/UI/AccountInfoCard/index.js
app/components/UI/AccountOverview/index.js
app/components/UI/ActionModal/ActionContent/index.js
app/components/UI/ActionModal/index.js
app/components/UI/ActionView/index.js
app/components/UI/AddCustomToken/index.js
app/components/UI/AddressInputs/index.js
app/components/UI/AddressInputs/index.test.jsx
app/components/UI/AnimatedSpinner/index.js
app/components/UI/AnimatedTransactionModal/index.js
app/components/UI/AssetList/index.js
app/components/UI/BasicFunctionality/BasicFunctionality.test.js
app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js
app/components/UI/BrowserBottomBar/index.js
app/components/UI/Button/index.js
app/components/UI/CollectibleContractElement/index.js
app/components/UI/CollectibleContractInformation/index.js
app/components/UI/CollectibleContractOverview/index.js
app/components/UI/CollectibleContracts/index.js
app/components/UI/CollectibleOverview/index.js
app/components/UI/Collectibles/index.js
app/components/UI/Confetti/index.js
app/components/UI/CustomAlert/index.js
app/components/UI/DrawerView/index.js
app/components/UI/EditGasFee1559/index.js
app/components/UI/EditGasFeeLegacy/index.js
app/components/UI/EthereumAddress/index.js
app/components/UI/FadeAnimationView/index.js
app/components/UI/FadeOutOverlay/index.js
app/components/UI/FoxScreen/index.js
app/components/UI/GlobalAlert/index.js
app/components/UI/HintModal/index.js
app/components/UI/ManageNetworks/ManageNetworks.test.js
app/components/UI/Navbar/index.js
app/components/UI/Navbar/index.test.jsx
app/components/UI/NavbarBrowserTitle/index.js
app/components/UI/NavbarTitle/index.js
app/components/UI/NavbarTitle/index.test.js
app/components/UI/NetworkMainAssetLogo/index.js
app/components/UI/Notification/BaseNotification/index.js
app/components/UI/Notification/BaseNotification/index.test.jsx
app/components/UI/Notification/SimpleNotification/index.js
app/components/UI/Notification/TransactionNotification/index.js
app/components/UI/Notification/index.js
app/components/UI/OnboardingWizard/Coachmark/index.js
app/components/UI/OptinMetrics/index.js
app/components/UI/PaymentRequest/index.js
app/components/UI/PaymentRequestSuccess/index.js
app/components/UI/PhishingModal/index.js
app/components/UI/ProtectYourWalletModal/index.js
app/components/UI/ReceiveRequest/index.js
app/components/UI/Screen/index.js
app/components/UI/SeedphraseModal/index.js
app/components/UI/SelectComponent/index.js
app/components/UI/SettingsDrawer/index.js
app/components/UI/SettingsNotification/index.js
app/components/UI/SkipAccountSecurityModal/index.js
app/components/UI/SliderButton/index.js
app/components/UI/SlippageSlider/index.js
app/components/UI/StyledButton/index.android.js
app/components/UI/StyledButton/index.ios.js
app/components/UI/StyledButton/index.js
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
app/components/UI/SwitchCustomNetwork/index.js
app/components/UI/Tabs/TabCountIcon/index.js
app/components/UI/Tabs/index.js
app/components/UI/TimeEstimateInfoModal/index.js
app/components/UI/TokenImage/index.js
app/components/UI/TransactionActionModal/TransactionActionContent/index.js
app/components/UI/TransactionActionModal/index.js
app/components/UI/TransactionElement/TransactionDetails/index.js
app/components/UI/TransactionElement/index.js
app/components/UI/TransactionElement/utils.js
app/components/UI/TransactionElement/utils.test.js
app/components/UI/TransactionHeader/index.js
app/components/UI/Transactions/index.js
app/components/UI/WarningExistingUserModal/index.js
app/components/UI/WebsiteIcon/index.js
app/components/UI/WebviewError/index.js
app/components/UI/WebviewProgressBar/index.js
app/components/Views/AccountBackupStep1/index.js
app/components/Views/AccountBackupStep1B/index.js
app/components/Views/ActivityView/index.js
app/components/Views/AddBookmark/index.js
app/components/Views/AddressQRCode/index.js
app/components/Views/Asset/index.js
app/components/Views/Asset/index.test.js
app/components/Views/Browser/index.js
app/components/Views/ChoosePassword/index.js
app/components/Views/Collectible/index.js
app/components/Views/CollectibleView/index.js
app/components/Views/EnterPasswordSimple/index.js
app/components/Views/ErrorBoundary/index.js
app/components/Views/GasEducationCarousel/index.js
app/components/Views/ImportFromSecretRecoveryPhrase/index.js
app/components/Views/ImportPrivateKeySuccess/index.js
app/components/Views/LockScreen/index.js
app/components/Views/ManualBackupStep1/index.js
app/components/Views/ManualBackupStep2/index.js
app/components/Views/ManualBackupStep3/index.js
app/components/Views/MediaPlayer/AndroidMediaPlayer.js
app/components/Views/MediaPlayer/index.js
app/components/Views/NavigationUnitTest/TestScreen1.test.js
app/components/Views/NavigationUnitTest/TestScreen2.test.js
app/components/Views/NavigationUnitTest/TestScreen3.test.js
app/components/Views/NavigationUnitTest/index.js
app/components/Views/OfflineMode/index.js
app/components/Views/Onboarding/index.js
app/components/Views/OnboardingSuccess/index.test.js
app/components/Views/ResetPassword/index.js
app/components/Views/Settings/AdvancedSettings/index.js
app/components/Views/Settings/AppInformation/index.js
app/components/Views/Settings/Contacts/ContactForm/index.js
app/components/Views/Settings/Contacts/index.js
app/components/Views/Settings/GeneralSettings/index.js
app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js
app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js
app/components/Views/Settings/NetworksSettings/index.js
app/components/Views/SimpleWebview/index.js
app/components/Views/TermsAndConditions/index.js
app/components/Views/TransactionSummary/index.js
app/components/Views/TransactionsView/index.js
app/components/Views/WalletConnectSessions/index.js
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
app/constants/navigation.js
app/constants/network.js
app/constants/onboarding.js
app/core/BackgroundBridge/BackgroundBridge.js
app/core/BackgroundBridge/BackgroundBridge.test.js
app/core/ClipboardManager.js
app/core/DrawerStatusTracker.js
app/core/EntryScriptWeb3.js
app/core/InpageBridgeWeb3.js
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
app/images/image-icons.js
app/lib/ens-ipfs/contracts/registry.js
app/lib/ens-ipfs/contracts/resolver.js
app/lib/ens-ipfs/resolver.js
app/lib/ppom/blockaid-version.js
app/lib/ppom/ppom.html.js
app/reducers/alert/index.js
app/reducers/bookmarks/index.js
app/reducers/browser/index.js
app/reducers/browser/index.test.js
app/reducers/collectibles/index.js
app/reducers/infuraAvailability/index.js
app/reducers/modals/index.js
app/reducers/notification/index.js
app/reducers/notification/notification.test.js
app/reducers/privacy/index.js
app/reducers/settings/index.js
app/reducers/swaps/index.js
app/reducers/transaction/index.js
app/reducers/wizard/index.js
app/store/migrations/000.js
app/store/migrations/001.js
app/store/migrations/002.js
app/store/migrations/003.js
app/store/migrations/004.js
app/store/migrations/005.js
app/store/migrations/006.js
app/store/migrations/007.js
app/store/migrations/008.js
app/store/migrations/009.js
app/store/migrations/010.js
app/store/migrations/011.js
app/store/migrations/012.js
app/store/migrations/013.js
app/store/migrations/014.js
app/store/migrations/015.js
app/store/migrations/016.js
app/store/migrations/017.js
app/store/migrations/018.js
app/store/migrations/019.js
app/store/migrations/019.test.js
app/store/migrations/020.js
app/store/migrations/020.test.js
app/store/migrations/021.js
app/store/migrations/021.test.js
app/store/migrations/022.js
app/store/migrations/022.test.js
app/store/migrations/023.js
app/store/migrations/023.test.js
app/store/migrations/024.js
app/store/migrations/024.test.js
app/store/migrations/025.js
app/store/migrations/025.test.js
app/store/migrations/026.js
app/store/migrations/026.test.js
app/store/migrations/027.js
app/store/migrations/027.test.js
app/store/migrations/028.test.js
app/util/ENSUtils.js
app/util/blockies.js
app/util/confirm-tx.js
app/util/confirmation/signatureUtils.js
app/util/confusables/index.js
app/util/conversion/index.js
app/util/conversions.js
app/util/conversions.test.js
app/util/custom-gas/index.js
app/util/dapp-url-list.js
app/util/date/index.js
app/util/device/index.js
app/util/etherscan.js
app/util/gasUtils.js
app/util/general/index.js
app/util/middlewares.js
app/util/networks/index.js
app/util/number/index.js
app/util/payment-link-generator.js
app/util/scaling.js
app/util/sentry/utils.js
app/util/streams.js
app/util/test/assetFileTransformer.js
app/util/test/contract-address-registry.js
app/util/test/ganache-seeder.js
app/util/test/ganache.js
app/util/test/network-store.js
app/util/test/smart-contracts.js
app/util/test/testSetup.js
app/util/test/utils.js
app/util/transactions/index.js
app/util/walletconnect.js
```
