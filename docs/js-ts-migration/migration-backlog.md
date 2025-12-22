# JavaScript to TypeScript Migration Backlog

## Prioritized Migration Plan

**Generated:** December 2024  
**Repository:** metamask-mobile  
**Total Files:** 333 JavaScript files in app/ directory

---

## Migration Phases Overview

| Phase | Category | Files | Effort | Priority |
|-------|----------|-------|--------|----------|
| 1 | Quick Wins (Mocks, Constants, Test Utils) | 49 | S | Highest |
| 2 | Utilities | 32 | S-M | High |
| 3 | Actions & Reducers | 25 | S | High |
| 4 | Base Components | 12 | S-M | High |
| 5 | Store Migrations | 38 | M | Medium |
| 6 | UI Components | 103 | M-L | Medium |
| 7 | Views | 83 | M-L | Medium |
| 8 | Core Systems | 25 | L | Lower |
| 9 | Navigation | 3 | L | Lower |

---

## Phase 1: Quick Wins (49 files)

**Estimated Effort:** 1-2 days  
**Risk Level:** Low  
**Dependencies:** None

### Batch 1.1: Mock Files (6 files) - Size: S

| File | Lines | Dependents | Status |
|------|-------|------------|--------|
| `__mocks__/pngMock.js` | ~5 | 0 | Pending |
| `__mocks__/react-native-device-info.js` | ~10 | 0 | Pending |
| `__mocks__/react-native-splash-screen.js` | ~5 | 0 | Pending |
| `__mocks__/react-native-view-shot.js` | ~5 | 0 | Pending |
| `__mocks__/rn-fetch-blob.js` | ~10 | 0 | Pending |
| `__mocks__/svgMock.js` | ~5 | 0 | Pending |

### Batch 1.2: Constants (3 files) - Size: S

| File | Lines | Dependents | Status |
|------|-------|------------|--------|
| `constants/navigation.js` | ~50 | Multiple | Pending |
| `constants/network.js` | ~100 | Multiple | Pending |
| `constants/onboarding.js` | ~30 | Few | Pending |

### Batch 1.3: Test Files (40 files) - Size: S

Test files should be migrated alongside their source files. See inventory for complete list.

**Key test files to migrate early:**
- `util/conversions.test.js`
- `components/Base/Keypad/Keypad.test.js`
- `components/Base/Keypad/createKeypadRule.test.js`

---

## Phase 2: Utilities (32 files)

**Estimated Effort:** 3-5 days  
**Risk Level:** Low-Medium  
**Dependencies:** Phase 1 constants

### Batch 2.1: Simple Utilities (12 files) - Size: S

| File | Lines | Complexity | Dependents | Status |
|------|-------|------------|------------|--------|
| `util/blockies.js` | ~50 | S | Few | Pending |
| `util/scaling.js` | ~30 | S | Few | Pending |
| `util/dapp-url-list.js` | ~100 | S | Few | Pending |
| `util/payment-link-generator.js` | ~80 | S | Few | Pending |
| `util/etherscan.js` | ~60 | S | Few | Pending |
| `util/middlewares.js` | ~40 | S | Few | Pending |
| `util/streams.js` | ~50 | S | Few | Pending |
| `util/date/index.js` | ~100 | S | Multiple | Pending |
| `util/general/index.js` | ~150 | S | Multiple | Pending |
| `util/device/index.js` | ~100 | S | Multiple | Pending |
| `util/number/index.js` | ~200 | S | Multiple | Pending |
| `util/confusables/index.js` | ~50 | S | Few | Pending |

### Batch 2.2: Medium Utilities (12 files) - Size: M

| File | Lines | Complexity | Dependents | Status |
|------|-------|------------|------------|--------|
| `util/ENSUtils.js` | ~200 | M | Multiple | Pending |
| `util/conversions.js` | ~300 | M | Multiple | Pending |
| `util/conversion/index.js` | ~250 | M | Multiple | Pending |
| `util/gasUtils.js` | ~200 | M | Multiple | Pending |
| `util/custom-gas/index.js` | ~300 | M | Multiple | Pending |
| `util/confirm-tx.js` | ~150 | M | Multiple | Pending |
| `util/confirmation/signatureUtils.js` | ~100 | M | Few | Pending |
| `util/walletconnect.js` | ~200 | M | Multiple | Pending |
| `util/sentry/utils.js` | ~150 | M | Multiple | Pending |

### Batch 2.3: Complex Utilities (8 files) - Size: M-L

| File | Lines | Complexity | Dependents | Status |
|------|-------|------------|------------|--------|
| `util/networks/index.js` | ~500 | L | Many | Pending |
| `util/transactions/index.js` | ~600 | L | Many | Pending |

### Batch 2.4: Test Utilities (8 files) - Size: S

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `util/test/assetFileTransformer.js` | ~20 | S | Pending |
| `util/test/contract-address-registry.js` | ~50 | S | Pending |
| `util/test/ganache-seeder.js` | ~100 | S | Pending |
| `util/test/ganache.js` | ~80 | S | Pending |
| `util/test/network-store.js` | ~50 | S | Pending |
| `util/test/smart-contracts.js` | ~100 | S | Pending |
| `util/test/testSetup.js` | ~50 | S | Pending |
| `util/test/utils.js` | ~100 | S | Pending |

---

## Phase 3: Actions & Reducers (25 files)

**Estimated Effort:** 2-3 days  
**Risk Level:** Low  
**Dependencies:** Phase 1 constants

### Batch 3.1: Actions (11 files) - Size: S

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `actions/alert/index.js` | ~50 | S | Pending |
| `actions/bookmarks/index.js` | ~50 | S | Pending |
| `actions/browser/index.js` | ~80 | S | Pending |
| `actions/collectibles/index.js` | ~50 | S | Pending |
| `actions/infuraAvailability/index.js` | ~30 | S | Pending |
| `actions/modals/index.js` | ~100 | S | Pending |
| `actions/notification/index.js` | ~50 | S | Pending |
| `actions/privacy/index.js` | ~30 | S | Pending |
| `actions/settings/index.js` | ~100 | S | Pending |
| `actions/transaction/index.js` | ~80 | S | Pending |
| `actions/wizard/index.js` | ~50 | S | Pending |

### Batch 3.2: Reducers (14 files) - Size: S-M

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `reducers/alert/index.js` | ~50 | S | Pending |
| `reducers/bookmarks/index.js` | ~80 | S | Pending |
| `reducers/browser/index.js` | ~100 | S | Pending |
| `reducers/collectibles/index.js` | ~80 | S | Pending |
| `reducers/infuraAvailability/index.js` | ~50 | S | Pending |
| `reducers/modals/index.js` | ~100 | S | Pending |
| `reducers/notification/index.js` | ~80 | S | Pending |
| `reducers/privacy/index.js` | ~50 | S | Pending |
| `reducers/settings/index.js` | ~150 | M | Pending |
| `reducers/swaps/index.js` | ~200 | M | Pending |
| `reducers/transaction/index.js` | ~100 | S | Pending |
| `reducers/wizard/index.js` | ~50 | S | Pending |

---

## Phase 4: Base Components (12 files)

**Estimated Effort:** 2-3 days  
**Risk Level:** Low-Medium  
**Dependencies:** Phase 2 utilities

### Batch 4.1: Simple Base Components (6 files) - Size: S

| File | Lines | PropTypes | Status |
|------|-------|-----------|--------|
| `components/Base/StatusText.js` | ~50 | Yes | Pending |
| `components/Base/TabBar.js` | ~100 | Yes | Pending |
| `components/Base/RangeInput.js` | ~80 | Yes | Pending |
| `components/Base/DetailsModal.js` | ~150 | Yes | Pending |
| `components/Base/RemoteImage/index.js` | ~100 | Yes | Pending |

### Batch 4.2: Keypad Components (6 files) - Size: M

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `components/Base/Keypad/index.js` | ~200 | M | Pending |
| `components/Base/Keypad/components.js` | ~150 | M | Pending |
| `components/Base/Keypad/constants.js` | ~50 | S | Pending |
| `components/Base/Keypad/createKeypadRule.js` | ~100 | M | Pending |
| `components/Base/Keypad/useCurrency.js` | ~80 | M | Pending |

---

## Phase 5: Store Migrations (38 files)

**Estimated Effort:** 3-4 days  
**Risk Level:** Medium  
**Dependencies:** Phase 3 reducers

### Batch 5.1: Early Migrations (15 files) - Size: S-M

Migrations 000-014 - Simple state transformations

### Batch 5.2: Middle Migrations (13 files) - Size: M

Migrations 015-027 - More complex state transformations

### Batch 5.3: Recent Migrations (10 files) - Size: M

Migrations 028+ - Latest state transformations (some already TypeScript)

**Note:** Many migrations are already TypeScript. Check inventory for remaining JS files.

---

## Phase 6: UI Components (103 files)

**Estimated Effort:** 2-3 weeks  
**Risk Level:** Medium-High  
**Dependencies:** Phases 2-4

### Batch 6.1: Simple UI Components (30 files) - Size: S

Components with minimal PropTypes and no Redux connection:
- `components/UI/AnimatedSpinner/index.js`
- `components/UI/Button/index.js`
- `components/UI/Confetti/index.js`
- `components/UI/CustomAlert/index.js`
- `components/UI/EthereumAddress/index.js`
- `components/UI/FadeAnimationView/index.js`
- `components/UI/FadeOutOverlay/index.js`
- `components/UI/FoxScreen/index.js`
- `components/UI/GlobalAlert/index.js`
- `components/UI/HintModal/index.js`
- `components/UI/NetworkMainAssetLogo/index.js`
- `components/UI/Screen/index.js`
- `components/UI/SettingsNotification/index.js`
- `components/UI/SliderButton/index.js`
- `components/UI/SlippageSlider/index.js`
- `components/UI/TokenImage/index.js`
- `components/UI/WebsiteIcon/index.js`
- `components/UI/WebviewError/index.js`
- `components/UI/WebviewProgressBar/index.js`

### Batch 6.2: Medium UI Components (40 files) - Size: M

Components with PropTypes and some Redux connection:
- `components/UI/AccountApproval/index.js`
- `components/UI/AccountInfoCard/index.js`
- `components/UI/AccountOverview/index.js`
- `components/UI/ActionModal/index.js`
- `components/UI/ActionView/index.js`
- `components/UI/AddCustomToken/index.js`
- `components/UI/AddressInputs/index.js`
- `components/UI/BrowserBottomBar/index.js`
- `components/UI/CollectibleContractElement/index.js`
- `components/UI/CollectibleContractInformation/index.js`
- `components/UI/CollectibleContractOverview/index.js`
- `components/UI/CollectibleContracts/index.js`
- `components/UI/CollectibleOverview/index.js`
- `components/UI/Collectibles/index.js`
- `components/UI/DrawerView/index.js`
- `components/UI/EditGasFee1559/index.js`
- `components/UI/EditGasFeeLegacy/index.js`
- `components/UI/Navbar/index.js`
- `components/UI/NavbarBrowserTitle/index.js`
- `components/UI/NavbarTitle/index.js`
- `components/UI/Notification/*`
- `components/UI/OnboardingWizard/Coachmark/index.js`
- `components/UI/OptinMetrics/index.js`
- `components/UI/PaymentRequest/index.js`
- `components/UI/PaymentRequestSuccess/index.js`
- `components/UI/PhishingModal/index.js`
- `components/UI/ProtectYourWalletModal/index.js`
- `components/UI/ReceiveRequest/index.js`
- `components/UI/SeedphraseModal/index.js`
- `components/UI/SelectComponent/index.js`
- `components/UI/SettingsDrawer/index.js`
- `components/UI/SkipAccountSecurityModal/index.js`
- `components/UI/StyledButton/*`
- `components/UI/SwitchCustomNetwork/index.js`
- `components/UI/Tabs/*`
- `components/UI/TimeEstimateInfoModal/index.js`
- `components/UI/TransactionActionModal/*`
- `components/UI/TransactionHeader/index.js`
- `components/UI/Transactions/index.js`
- `components/UI/WarningExistingUserModal/index.js`

### Batch 6.3: Complex UI Components (33 files) - Size: L

Components with heavy PropTypes, Redux, and complex logic:
- `components/UI/Swaps/*` (15+ files)
- `components/UI/TransactionElement/*` (4 files)
- `components/UI/AssetList/index.js`

---

## Phase 7: Views (83 files)

**Estimated Effort:** 2-3 weeks  
**Risk Level:** Medium-High  
**Dependencies:** Phases 2-6

### Batch 7.1: Simple Views (25 files) - Size: S-M

- `components/Views/AddBookmark/index.js`
- `components/Views/AddressQRCode/index.js`
- `components/Views/ActivityView/index.js`
- `components/Views/CollectibleView/index.js`
- `components/Views/Collectible/index.js`
- `components/Views/EnterPasswordSimple/index.js`
- `components/Views/ErrorBoundary/index.js`
- `components/Views/GasEducationCarousel/index.js`
- `components/Views/ImportPrivateKeySuccess/index.js`
- `components/Views/LockScreen/index.js`
- `components/Views/ManualBackupStep1/index.js`
- `components/Views/ManualBackupStep2/index.js`
- `components/Views/ManualBackupStep3/index.js`
- `components/Views/MediaPlayer/*`
- `components/Views/NavigationUnitTest/*`
- `components/Views/OfflineMode/index.js`
- `components/Views/SimpleWebview/index.js`
- `components/Views/TermsAndConditions/index.js`
- `components/Views/TransactionSummary/index.js`
- `components/Views/TransactionsView/index.js`
- `components/Views/WalletConnectSessions/index.js`

### Batch 7.2: Medium Views (30 files) - Size: M

- `components/Views/AccountBackupStep1/index.js`
- `components/Views/AccountBackupStep1B/index.js`
- `components/Views/Asset/index.js`
- `components/Views/ChoosePassword/index.js`
- `components/Views/ImportFromSecretRecoveryPhrase/index.js`
- `components/Views/Onboarding/index.js`
- `components/Views/ResetPassword/index.js`
- `components/Views/Settings/*` (multiple files)

### Batch 7.3: Complex Views - Confirmations (28 files) - Size: L

All files in `components/Views/confirmations/legacy/*`:
- `Approval/*`
- `Approve/*`
- `ApproveView/*`
- `Send/*`
- `SendFlow/*`
- `components/*`

---

## Phase 8: Core Systems (25 files)

**Estimated Effort:** 1-2 weeks  
**Risk Level:** High  
**Dependencies:** All previous phases

### Batch 8.1: Simple Core Files (10 files) - Size: S-M

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `core/ClipboardManager.js` | ~50 | S | Pending |
| `core/DrawerStatusTracker.js` | ~30 | S | Pending |
| `core/PreventScreenshot.js` | ~50 | S | Pending |
| `core/TransactionTypes.js` | ~100 | S | Pending |
| `core/MobilePortStream.js` | ~80 | M | Pending |
| `core/EntryScriptWeb3.js` | ~100 | M | Pending |
| `core/InpageBridgeWeb3.js` | ~150 | M | Pending |

### Batch 8.2: Medium Core Files (8 files) - Size: M

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `core/Vault.js` | ~200 | M | Pending |
| `core/SecureKeychain.js` | ~300 | M | Pending |
| `core/Permissions/specifications.js` | ~200 | M | Pending |
| `core/RPCMethods/eth-request-accounts.js` | ~100 | M | Pending |
| `core/RPCMethods/handlers/index.js` | ~150 | M | Pending |
| `core/RPCMethods/index.js` | ~100 | M | Pending |
| `core/RPCMethods/lib/ethereum-chain-utils.js` | ~200 | M | Pending |

### Batch 8.3: Complex Core Files (7 files) - Size: L

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `core/NotificationManager.js` | ~400 | L | Pending |
| `core/BackgroundBridge/BackgroundBridge.js` | ~600 | L | Pending |
| `core/WalletConnect/WalletConnect.js` | ~500 | L | Pending |
| `core/RPCMethods/wallet_addEthereumChain.js` | ~300 | L | Pending |
| `core/RPCMethods/wallet_switchEthereumChain.js` | ~250 | L | Pending |
| `core/RPCMethods/createEip1193MethodMiddleware/index.js` | ~200 | L | Pending |

---

## Phase 9: Navigation (3 files)

**Estimated Effort:** 3-5 days  
**Risk Level:** High  
**Dependencies:** All previous phases

| File | Lines | Complexity | Status |
|------|-------|------------|--------|
| `components/Nav/Main/MainNavigator.js` | ~500 | L | Pending |
| `components/Nav/Main/RootRPCMethodsUI.js` | ~400 | L | Pending |
| `components/Nav/Main/index.js` | ~300 | L | Pending |

---

## Effort Estimation Guide

### Size Definitions

| Size | Lines | Complexity Factors | Estimated Time |
|------|-------|-------------------|----------------|
| S (Small) | <100 | Simple types, few dependencies | 0.5-1 hour |
| M (Medium) | 100-300 | PropTypes, some Redux, moderate logic | 1-3 hours |
| L (Large) | >300 | Complex types, heavy Redux, many dependencies | 3-8 hours |

### Total Effort Estimate

| Phase | Files | Effort (days) |
|-------|-------|---------------|
| Phase 1 | 49 | 1-2 |
| Phase 2 | 32 | 3-5 |
| Phase 3 | 25 | 2-3 |
| Phase 4 | 12 | 2-3 |
| Phase 5 | 38 | 3-4 |
| Phase 6 | 103 | 10-15 |
| Phase 7 | 83 | 10-15 |
| Phase 8 | 25 | 5-10 |
| Phase 9 | 3 | 3-5 |
| **Total** | **333** | **39-62 days** |

---

## Tracking Status

### Status Legend

- **Pending** - Not started
- **In Progress** - Currently being migrated
- **Review** - PR submitted, awaiting review
- **Completed** - Merged to main

### Progress Tracking

Use the `js-files-inventory.json` file to track progress. Update the status field for each file as migration progresses.

### PR Naming Convention

Use the established pattern: `chore(js-ts): Convert [filename] to TypeScript`

Example: `chore(js-ts): Convert util/blockies.js to TypeScript`

---

## Dependencies Graph

### Critical Path

```
Phase 1 (Constants/Mocks)
    ↓
Phase 2 (Utilities) ←→ Phase 3 (Actions/Reducers)
    ↓                      ↓
Phase 4 (Base Components)  Phase 5 (Migrations)
    ↓
Phase 6 (UI Components)
    ↓
Phase 7 (Views)
    ↓
Phase 8 (Core Systems)
    ↓
Phase 9 (Navigation)
```

### Parallel Work Opportunities

- Phase 2 and Phase 3 can be done in parallel
- Within each phase, batches can be parallelized across team members
- Test files can be migrated alongside their source files
