# MetaMask Mobile: JavaScript to TypeScript Migration Plan

> **Repository**: `chase-cog-ai/metamask-mobile`
> **Current State**: ~319 `.js` files remaining out of ~4,250 total in `app/` (~3,931 already `.ts`/`.tsx`)
> **Goal**: 100% TypeScript coverage with `strict: true` enabled
> **Approach**: Parent-child session management — parent tracks overall progress, child sessions handle individual module migrations

---

## Table of Contents

- [1. Parent Session: Overall Migration Tracker](#1-parent-session-overall-migration-tracker)
  - [1.1 Migration Phases Overview](#11-migration-phases-overview)
  - [1.2 Phase 1 — Foundation (Constants & Utilities)](#12-phase-1--foundation-constants--utilities)
  - [1.3 Phase 2 — State Management (Redux Actions & Reducers)](#13-phase-2--state-management-redux-actions--reducers)
  - [1.4 Phase 3 — Core Modules](#14-phase-3--core-modules)
  - [1.5 Phase 4 — UI Components](#15-phase-4--ui-components)
  - [1.6 Phase 5 — Store Migrations](#16-phase-5--store-migrations)
  - [1.7 Phase 6 — Miscellaneous](#17-phase-6--miscellaneous)
  - [1.8 Parent Session Responsibilities](#18-parent-session-responsibilities)
  - [1.9 Phase Gating Rules](#19-phase-gating-rules)
- [2. Child Sessions: Per-Module Migration Tasks](#2-child-sessions-per-module-migration-tasks)
  - [2.1 Child Session Template](#21-child-session-template)
  - [2.2 Child Session Naming Convention](#22-child-session-naming-convention)
- [3. Shared Configuration & Conventions](#3-shared-configuration--conventions)
- [4. Risk Management](#4-risk-management)
- [5. Success Metrics](#5-success-metrics)

---

## 1. Parent Session: Overall Migration Tracker

The parent session is the top-level orchestrator responsible for tracking completion status across all phases, managing shared type definitions, and gating phase transitions.

### 1.1 Migration Phases Overview

| Phase | Name | File Count | Dependencies | Parallelizable With |
|-------|------|-----------|--------------|---------------------|
| 1 | Foundation (Constants & Utilities) | ~28 files | None | — |
| 2 | State Management (Redux Actions & Reducers) | ~23 files | Phase 1 (utils imported by reducers) | — |
| 3 | Core Modules | ~14 files | Phases 1–2 | — |
| 4 | UI Components | ~90+ files | Phases 1–3 | — |
| 5 | Store Migrations | ~37 files | None (can run parallel with Phase 1–3) | Phases 1, 2, 3 |
| 6 | Miscellaneous | ~10 files | None (can run parallel with Phase 5) | Phase 5 |

```
Execution Timeline:

Phase 1 ─────────┐
                  ├──> Phase 2 ──> Phase 3 ──> Phase 4
Phase 5 ─────────┤
Phase 6 ─────────┘
```

> **Note**: Phase 5 (Store Migrations) and Phase 6 (Miscellaneous) have no upstream dependencies and can run in parallel with Phases 1–3.

---

### 1.2 Phase 1 — Foundation (Constants & Utilities)

**Priority**: Highest — these modules are widely imported and have the most downstream impact.

#### 1.2.1 Constants

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/constants/navigation.js` | Not Started | | Navigation route constants |
| 2 | `app/constants/network.js` | Not Started | | Chain IDs, network configs |
| 3 | `app/constants/onboarding.js` | Not Started | | Onboarding step constants |

**Reference**: `app/constants/urls.ts`, `app/constants/bridge.ts` (already migrated)

#### 1.2.2 Utility Modules (Top-Level)

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 4 | `app/util/ENSUtils.js` | Not Started | | ENS name resolution |
| 5 | `app/util/blockies.js` | Not Started | | Blocky avatar generation |
| 6 | `app/util/confirm-tx.js` | Not Started | | Transaction confirmation helpers |
| 7 | `app/util/conversions.js` | Not Started | | BN.js conversions |
| 8 | `app/util/dapp-url-list.js` | Not Started | | DApp URL whitelist |
| 9 | `app/util/etherscan.js` | Not Started | | Etherscan API helpers |
| 10 | `app/util/gasUtils.js` | Not Started | | Gas estimation utilities |
| 11 | `app/util/middlewares.js` | Not Started | | JSON-RPC middlewares |
| 12 | `app/util/payment-link-generator.js` | Not Started | | EIP-681 payment links |
| 13 | `app/util/scaling.js` | Not Started | | Responsive scaling |
| 14 | `app/util/streams.js` | Not Started | | Stream utilities |
| 15 | `app/util/walletconnect.js` | Not Started | | WalletConnect helpers |

**Reference**: `app/util/string/index.ts`, `app/util/mnemonic/index.ts` (already migrated)

#### 1.2.3 Utility Subdirectories

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 16 | `app/util/confusables/index.js` | Not Started | | Unicode confusable detection |
| 17 | `app/util/conversion/index.js` | Not Started | | Currency/unit conversion |
| 18 | `app/util/custom-gas/index.js` | Not Started | | Custom gas price logic |
| 19 | `app/util/date/index.js` | Not Started | | Date formatting |
| 20 | `app/util/device/index.js` | Not Started | | Device/platform detection |
| 21 | `app/util/general/index.js` | Not Started | | General-purpose helpers |
| 22 | `app/util/networks/index.js` | Not Started | | Network definitions & utilities |
| 23 | `app/util/number/index.js` | Not Started | | Number formatting |
| 24 | `app/util/transactions/index.js` | Not Started | | Transaction decoding/encoding |
| 25 | `app/util/sentry/utils.js` | Not Started | | Sentry error reporting |
| 26 | `app/util/confirmation/signatureUtils.js` | Not Started | | Signature request helpers |

**Reference**: `app/util/date/index.test.ts` (already typed test)

#### 1.2.4 Test Utilities

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 27 | `app/util/test/testSetup.js` | Not Started | | Jest test setup |
| 28 | `app/util/test/utils.js` | Not Started | | Test helper functions |
| 29 | `app/util/test/ganache.js` | Not Started | | Ganache server for tests |
| 30 | `app/util/test/ganache-seeder.js` | Not Started | | Test data seeding |
| 31 | `app/util/test/network-store.js` | Not Started | | Network fixture store |
| 32 | `app/util/test/smart-contracts.js` | Not Started | | Smart contract test fixtures |
| 33 | `app/util/test/contract-address-registry.js` | Not Started | | Contract address registry |
| 34 | `app/util/test/assetFileTransformer.js` | Not Started | | Jest asset transformer |

---

### 1.3 Phase 2 — State Management (Redux Actions & Reducers)

**Priority**: High — Redux modules define the state shape used across all connected components.

#### 1.3.1 Redux Actions

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/actions/alert/index.js` | Not Started | | Alert visibility actions |
| 2 | `app/actions/bookmarks/index.js` | Not Started | | Browser bookmark CRUD |
| 3 | `app/actions/browser/index.js` | Not Started | | Browser tab/history actions |
| 4 | `app/actions/collectibles/index.js` | Not Started | | NFT favorites actions |
| 5 | `app/actions/infuraAvailability/index.js` | Not Started | | Infura status actions |
| 6 | `app/actions/modals/index.js` | Not Started | | Modal visibility actions |
| 7 | `app/actions/notification/index.js` | Not Started | | Notification actions |
| 8 | `app/actions/privacy/index.js` | Not Started | | Privacy mode actions |
| 9 | `app/actions/settings/index.js` | Not Started | | App settings actions |
| 10 | `app/actions/transaction/index.js` | Not Started | | Transaction UI actions |
| 11 | `app/actions/wizard/index.js` | Not Started | | Onboarding wizard actions |

**Reference**: `app/actions/onboarding/index.ts` (already migrated — follow its pattern)

#### 1.3.2 Redux Reducers

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 12 | `app/reducers/alert/index.js` | Not Started | | Alert state |
| 13 | `app/reducers/bookmarks/index.js` | Not Started | | Bookmarks state |
| 14 | `app/reducers/browser/index.js` | Not Started | | Browser tabs state |
| 15 | `app/reducers/collectibles/index.js` | Not Started | | NFT favorites state |
| 16 | `app/reducers/infuraAvailability/index.js` | Not Started | | Infura availability state |
| 17 | `app/reducers/modals/index.js` | Not Started | | Modal visibility state |
| 18 | `app/reducers/notification/index.js` | Not Started | | Notification state |
| 19 | `app/reducers/privacy/index.js` | Not Started | | Privacy mode state |
| 20 | `app/reducers/settings/index.js` | Not Started | | App settings state |
| 21 | `app/reducers/swaps/index.js` | Not Started | | Swaps feature state |
| 22 | `app/reducers/transaction/index.js` | Not Started | | Transaction UI state |
| 23 | `app/reducers/wizard/index.js` | Not Started | | Onboarding wizard state |

**Reference**: `app/reducers/security/index.ts` (already migrated — follow its pattern)

**Test files to also migrate**:
- `app/reducers/browser/index.test.js`
- `app/reducers/notification/notification.test.js`

---

### 1.4 Phase 3 — Core Modules

**Priority**: High — core business logic consumed by UI components and services.

#### 1.4.1 Core Services & Singletons

| # | Module Path | Status | Child Session ID | Complexity | Notes |
|---|-------------|--------|------------------|------------|-------|
| 1 | `app/core/TransactionTypes.js` | Not Started | | Simple | Pure constants |
| 2 | `app/core/DrawerStatusTracker.js` | Not Started | | Simple | Simple state tracker |
| 3 | `app/core/ClipboardManager.js` | Not Started | | Simple | Clipboard wrapper |
| 4 | `app/core/PreventScreenshot.js` | Not Started | | Medium | Native module bridge |
| 5 | `app/core/MobilePortStream.js` | Not Started | | Medium | Duplex stream |
| 6 | `app/core/EntryScriptWeb3.js` | Not Started | | Medium | Web3 injection script |
| 7 | `app/core/SecureKeychain.js` | Not Started | | Complex | Biometric auth singleton |
| 8 | `app/core/Vault.js` | Not Started | | Complex | Keyring vault management |
| 9 | `app/core/NotificationManager.js` | Not Started | | Complex | Push notification singleton |
| 10 | `app/core/BackgroundBridge/BackgroundBridge.js` | Not Started | | Complex | Middleware stack bridge |

**Reference**: `app/core/Authentication/Authentication.ts`, `app/core/Encryptor/Encryptor.ts` (already migrated)

**Test files to also migrate**:
- `app/core/BackgroundBridge/BackgroundBridge.test.js`

#### 1.4.2 WalletConnect

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 11 | `app/core/WalletConnect/WalletConnect.js` | Not Started | | WalletConnect v2 session manager |

#### 1.4.3 Permissions & RPC Methods

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 12 | `app/core/Permissions/specifications.js` | Not Started | | Permission caveat/spec definitions |
| 13 | `app/core/RPCMethods/index.js` | Not Started | | RPC method registry |
| 14 | `app/core/RPCMethods/eth-request-accounts.js` | Not Started | | eth_requestAccounts handler |
| 15 | `app/core/RPCMethods/wallet_addEthereumChain.js` | Not Started | | wallet_addEthereumChain handler |
| 16 | `app/core/RPCMethods/wallet_switchEthereumChain.js` | Not Started | | wallet_switchEthereumChain handler |
| 17 | `app/core/RPCMethods/handlers/index.js` | Not Started | | Handler aggregator |
| 18 | `app/core/RPCMethods/lib/ethereum-chain-utils.js` | Not Started | | Chain validation utilities |
| 19 | `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` | Not Started | | EIP-1193 middleware factory |
| 20 | `app/core/RPCMethods/createEthAccountsMethodMiddleware.js` | Not Started | | eth_accounts middleware |

**Reference**: `app/core/RPCMethods/RPCMethodMiddleware.ts` (already migrated)

**Test files to also migrate**:
- `app/core/Permissions/specifications.test.js`
- `app/core/RPCMethods/wallet_addEthereumChain.test.js`
- `app/core/RPCMethods/wallet_switchEthereumChain.test.js`
- `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`

> **Important**: Preserve `///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)` preprocessor directives exactly as-is in all RPC method files.

---

### 1.5 Phase 4 — UI Components

**Priority**: Medium — largest phase by file count, split into sub-phases.

#### 1.5.1 Phase 4A — Simple Presentational Components (~30 files)

Stateless or minimally stateful components with `PropTypes` to replace.

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/components/UI/AnimatedSpinner/index.js` | Not Started | | |
| 2 | `app/components/UI/Button/index.js` | Not Started | | |
| 3 | `app/components/UI/Screen/index.js` | Not Started | | |
| 4 | `app/components/UI/SliderButton/index.js` | Not Started | | |
| 5 | `app/components/UI/FadeOutOverlay/index.js` | Not Started | | |
| 6 | `app/components/UI/FadeAnimationView/index.js` | Not Started | | |
| 7 | `app/components/UI/FoxScreen/index.js` | Not Started | | |
| 8 | `app/components/UI/WebviewProgressBar/index.js` | Not Started | | |
| 9 | `app/components/UI/EthereumAddress/index.js` | Not Started | | |
| 10 | `app/components/UI/TokenImage/index.js` | Not Started | | |
| 11 | `app/components/UI/WebsiteIcon/index.js` | Not Started | | |
| 12 | `app/components/UI/WebviewError/index.js` | Not Started | | |
| 13 | `app/components/UI/ActionView/index.js` | Not Started | | |
| 14 | `app/components/UI/SelectComponent/index.js` | Not Started | | |
| 15 | `app/components/UI/SettingsDrawer/index.js` | Not Started | | |
| 16 | `app/components/UI/SettingsNotification/index.js` | Not Started | | |
| 17 | `app/components/UI/SlippageSlider/index.js` | Not Started | | |
| 18 | `app/components/UI/CustomAlert/index.js` | Not Started | | |
| 19 | `app/components/UI/Confetti/index.js` | Not Started | | |
| 20 | `app/components/UI/HintModal/index.js` | Not Started | | |
| 21 | `app/components/UI/NetworkMainAssetLogo/index.js` | Not Started | | |
| 22 | `app/components/UI/NavbarTitle/index.js` | Not Started | | |
| 23 | `app/components/UI/NavbarBrowserTitle/index.js` | Not Started | | |
| 24 | `app/components/UI/BrowserBottomBar/index.js` | Not Started | | |
| 25 | `app/components/UI/AccountInfoCard/index.js` | Not Started | | |
| 26 | `app/components/UI/AddressInputs/index.js` | Not Started | | |
| 27 | `app/components/UI/AssetList/index.js` | Not Started | | |
| 28 | `app/components/UI/TimeEstimateInfoModal/index.js` | Not Started | | |
| 29 | `app/components/UI/AnimatedTransactionModal/index.js` | Not Started | | |
| 30 | `app/components/UI/StyledButton/index.js` | Not Started | | Platform-split: also `.android.js`, `.ios.js` |
| 31 | `app/components/UI/StyledButton/index.android.js` | Not Started | | |
| 32 | `app/components/UI/StyledButton/index.ios.js` | Not Started | | |

**Reference**: `app/component-library/components/` (consistent pattern: `Component.tsx`, `Component.types.ts`, `Component.styles.ts`)

#### 1.5.2 Phase 4B — Complex Stateful/Connected Components (~35 files)

Redux-connected components, components with complex state, or significant business logic.

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/components/UI/DrawerView/index.js` | Not Started | | Side menu, Redux connected |
| 2 | `app/components/UI/Navbar/index.js` | Not Started | | Navigation bar |
| 3 | `app/components/UI/Notification/index.js` | Not Started | | Notification container |
| 4 | `app/components/UI/Notification/BaseNotification/index.js` | Not Started | | |
| 5 | `app/components/UI/Notification/SimpleNotification/index.js` | Not Started | | |
| 6 | `app/components/UI/Notification/TransactionNotification/index.js` | Not Started | | |
| 7 | `app/components/UI/Swaps/index.js` | Not Started | | SwapsAmountView |
| 8 | `app/components/UI/Swaps/QuotesView.js` | Not Started | | Quote display & execution |
| 9 | `app/components/UI/Swaps/components/ActionAlert.js` | Not Started | | |
| 10 | `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` | Not Started | | |
| 11 | `app/components/UI/Swaps/components/AssetSwapButton.js` | Not Started | | |
| 12 | `app/components/UI/Swaps/components/GasEditModal.js` | Not Started | | |
| 13 | `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` | Not Started | | |
| 14 | `app/components/UI/Swaps/components/LoadingAnimation/index.js` | Not Started | | |
| 15 | `app/components/UI/Swaps/components/Onboarding.js` | Not Started | | |
| 16 | `app/components/UI/Swaps/components/QuotesModal.js` | Not Started | | |
| 17 | `app/components/UI/Swaps/components/QuotesSummary.js` | Not Started | | |
| 18 | `app/components/UI/Swaps/components/SlippageModal.js` | Not Started | | |
| 19 | `app/components/UI/Swaps/components/TokenIcon.js` | Not Started | | |
| 20 | `app/components/UI/Swaps/components/TokenImportModal.js` | Not Started | | |
| 21 | `app/components/UI/Swaps/components/TokenSelectButton.js` | Not Started | | |
| 22 | `app/components/UI/Swaps/components/TokenSelectModal.js` | Not Started | | |
| 23 | `app/components/UI/Swaps/utils/index.js` | Not Started | | Swap utility functions |
| 24 | `app/components/UI/Swaps/utils/useBalance.js` | Not Started | | Custom hook |
| 25 | `app/components/UI/Swaps/utils/useBlockExplorer.js` | Not Started | | Custom hook |
| 26 | `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` | Not Started | | Custom hook |
| 27 | `app/components/UI/TransactionElement/index.js` | Not Started | | |
| 28 | `app/components/UI/TransactionElement/TransactionDetails/index.js` | Not Started | | |
| 29 | `app/components/UI/TransactionElement/utils.js` | Not Started | | |
| 30 | `app/components/UI/Transactions/index.js` | Not Started | | Transaction list |
| 31 | `app/components/UI/CollectibleContracts/index.js` | Not Started | | NFT contract list |
| 32 | `app/components/UI/CollectibleContractElement/index.js` | Not Started | | |
| 33 | `app/components/UI/CollectibleContractInformation/index.js` | Not Started | | |
| 34 | `app/components/UI/CollectibleContractOverview/index.js` | Not Started | | |
| 35 | `app/components/UI/CollectibleOverview/index.js` | Not Started | | |
| 36 | `app/components/UI/Collectibles/index.js` | Not Started | | |
| 37 | `app/components/UI/PaymentRequest/index.js` | Not Started | | EIP-681 payment request |
| 38 | `app/components/UI/PaymentRequestSuccess/index.js` | Not Started | | |
| 39 | `app/components/UI/ReceiveRequest/index.js` | Not Started | | QR code receive |
| 40 | `app/components/UI/AccountApproval/index.js` | Not Started | | DApp connection approval |
| 41 | `app/components/UI/AccountOverview/index.js` | Not Started | | |
| 42 | `app/components/UI/ActionModal/index.js` | Not Started | | |
| 43 | `app/components/UI/ActionModal/ActionContent/index.js` | Not Started | | |
| 44 | `app/components/UI/TransactionActionModal/index.js` | Not Started | | |
| 45 | `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` | Not Started | | |
| 46 | `app/components/UI/TransactionHeader/index.js` | Not Started | | |
| 47 | `app/components/UI/GlobalAlert/index.js` | Not Started | | |
| 48 | `app/components/UI/OptinMetrics/index.js` | Not Started | | Analytics opt-in |
| 49 | `app/components/UI/AddCustomToken/index.js` | Not Started | | |
| 50 | `app/components/UI/EditGasFee1559/index.js` | Not Started | | EIP-1559 gas editor |
| 51 | `app/components/UI/EditGasFeeLegacy/index.js` | Not Started | | Legacy gas editor |
| 52 | `app/components/UI/OnboardingWizard/Coachmark/index.js` | Not Started | | |
| 53 | `app/components/UI/PhishingModal/index.js` | Not Started | | |
| 54 | `app/components/UI/ProtectYourWalletModal/index.js` | Not Started | | |
| 55 | `app/components/UI/SeedphraseModal/index.js` | Not Started | | |
| 56 | `app/components/UI/SkipAccountSecurityModal/index.js` | Not Started | | |
| 57 | `app/components/UI/SwitchCustomNetwork/index.js` | Not Started | | |
| 58 | `app/components/UI/Tabs/index.js` | Not Started | | Browser tabs |
| 59 | `app/components/UI/Tabs/TabCountIcon/index.js` | Not Started | | |
| 60 | `app/components/UI/WarningExistingUserModal/index.js` | Not Started | | |

**Reference**: `app/components/UI/Tokens/index.tsx`, `app/components/UI/ManageNetworks/ManageNetworks.tsx` (already migrated)

#### 1.5.3 Phase 4C — View Components (~40 files)

Full-screen views with navigation, complex state, and often Redux connections.

**Standalone Views**:

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/components/Views/Browser/index.js` | Not Started | | DApp browser |
| 2 | `app/components/Views/Asset/index.js` | Not Started | | Asset detail screen |
| 3 | `app/components/Views/Onboarding/index.js` | Not Started | | Onboarding flow entry |
| 4 | `app/components/Views/ChoosePassword/index.js` | Not Started | | Password setup |
| 5 | `app/components/Views/LockScreen/index.js` | Not Started | | Lock/unlock screen |
| 6 | `app/components/Views/AccountBackupStep1/index.js` | Not Started | | Seed phrase backup |
| 7 | `app/components/Views/AccountBackupStep1B/index.js` | Not Started | | |
| 8 | `app/components/Views/ManualBackupStep1/index.js` | Not Started | | |
| 9 | `app/components/Views/ManualBackupStep2/index.js` | Not Started | | |
| 10 | `app/components/Views/ManualBackupStep3/index.js` | Not Started | | |
| 11 | `app/components/Views/Settings/GeneralSettings/index.js` | Not Started | | |
| 12 | `app/components/Views/Settings/AdvancedSettings/index.js` | Not Started | | |
| 13 | `app/components/Views/Settings/AppInformation/index.js` | Not Started | | |
| 14 | `app/components/Views/Settings/Contacts/index.js` | Not Started | | |
| 15 | `app/components/Views/Settings/Contacts/ContactForm/index.js` | Not Started | | |
| 16 | `app/components/Views/Settings/NetworksSettings/index.js` | Not Started | | |
| 17 | `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` | Not Started | | |
| 18 | `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` | Not Started | | HOC |
| 19 | `app/components/Views/ActivityView/index.js` | Not Started | | |
| 20 | `app/components/Views/Collectible/index.js` | Not Started | | |
| 21 | `app/components/Views/CollectibleView/index.js` | Not Started | | |
| 22 | `app/components/Views/AddBookmark/index.js` | Not Started | | |
| 23 | `app/components/Views/AddressQRCode/index.js` | Not Started | | |
| 24 | `app/components/Views/EnterPasswordSimple/index.js` | Not Started | | |
| 25 | `app/components/Views/ErrorBoundary/index.js` | Not Started | | |
| 26 | `app/components/Views/GasEducationCarousel/index.js` | Not Started | | |
| 27 | `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` | Not Started | | |
| 28 | `app/components/Views/ImportPrivateKeySuccess/index.js` | Not Started | | |
| 29 | `app/components/Views/MediaPlayer/index.js` | Not Started | | |
| 30 | `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` | Not Started | | |
| 31 | `app/components/Views/NavigationUnitTest/index.js` | Not Started | | |
| 32 | `app/components/Views/OfflineMode/index.js` | Not Started | | |
| 33 | `app/components/Views/ResetPassword/index.js` | Not Started | | |
| 34 | `app/components/Views/SimpleWebview/index.js` | Not Started | | |
| 35 | `app/components/Views/TermsAndConditions/index.js` | Not Started | | |
| 36 | `app/components/Views/TransactionSummary/index.js` | Not Started | | |
| 37 | `app/components/Views/TransactionsView/index.js` | Not Started | | |
| 38 | `app/components/Views/WalletConnectSessions/index.js` | Not Started | | |

**Reference**: `app/components/Views/Wallet/index.tsx`, `app/components/Views/Login/index.tsx` (already migrated)

**Legacy Confirmation Views**:

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 39 | `app/components/Views/confirmations/legacy/Approval/index.js` | Not Started | | |
| 40 | `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` | Not Started | | |
| 41 | `app/components/Views/confirmations/legacy/Approve/index.js` | Not Started | | |
| 42 | `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` | Not Started | | |
| 43 | `app/components/Views/confirmations/legacy/Send/index.js` | Not Started | | |
| 44 | `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` | Not Started | | |
| 45 | `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` | Not Started | | |
| 46 | `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` | Not Started | | |
| 47 | `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` | Not Started | | |
| 48 | `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` | Not Started | | |
| 49 | `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` | Not Started | | |
| 50 | `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` | Not Started | | |
| 51 | `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` | Not Started | | |
| 52 | `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` | Not Started | | |
| 53 | `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` | Not Started | | |
| 54 | `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` | Not Started | | |
| 55 | `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` | Not Started | | |
| 56 | `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` | Not Started | | |
| 57 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` | Not Started | | |
| 58 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` | Not Started | | |
| 59 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` | Not Started | | |
| 60 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` | Not Started | | Styles-only file |
| 61 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` | Not Started | | |
| 62 | `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` | Not Started | | |
| 63 | `app/components/Views/confirmations/legacy/components/TypedSign/index.js` | Not Started | | |
| 64 | `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` | Not Started | | |
| 65 | `app/components/Views/confirmations/mock-data.js` | Not Started | | Test mock data |

#### 1.5.4 Phase 4D — Navigation Components

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/components/Nav/Main/MainNavigator.js` | Not Started | | Root tab navigator |
| 2 | `app/components/Nav/Main/index.js` | Not Started | | Main nav entry |
| 3 | `app/components/Nav/Main/RootRPCMethodsUI.js` | Not Started | | RPC method handler UI |

---

### 1.6 Phase 5 — Store Migrations

**Priority**: Medium — independent of other phases, can run in parallel with Phases 1–3.

#### 1.6.1 Migration Source Files

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/store/migrations/000.js` | Not Started | | AddressBook migration |
| 2 | `app/store/migrations/001.js` | Not Started | | |
| 3 | `app/store/migrations/002.js` | Not Started | | |
| 4 | `app/store/migrations/003.js` | Not Started | | |
| 5 | `app/store/migrations/004.js` | Not Started | | |
| 6 | `app/store/migrations/005.js` | Not Started | | |
| 7 | `app/store/migrations/006.js` | Not Started | | |
| 8 | `app/store/migrations/007.js` | Not Started | | |
| 9 | `app/store/migrations/008.js` | Not Started | | |
| 10 | `app/store/migrations/009.js` | Not Started | | |
| 11 | `app/store/migrations/010.js` | Not Started | | |
| 12 | `app/store/migrations/011.js` | Not Started | | |
| 13 | `app/store/migrations/012.js` | Not Started | | |
| 14 | `app/store/migrations/013.js` | Not Started | | |
| 15 | `app/store/migrations/014.js` | Not Started | | |
| 16 | `app/store/migrations/015.js` | Not Started | | |
| 17 | `app/store/migrations/016.js` | Not Started | | |
| 18 | `app/store/migrations/017.js` | Not Started | | |
| 19 | `app/store/migrations/018.js` | Not Started | | |
| 20 | `app/store/migrations/019.js` | Not Started | | |
| 21 | `app/store/migrations/020.js` | Not Started | | |
| 22 | `app/store/migrations/021.js` | Not Started | | |
| 23 | `app/store/migrations/022.js` | Not Started | | |
| 24 | `app/store/migrations/023.js` | Not Started | | |
| 25 | `app/store/migrations/024.js` | Not Started | | |
| 26 | `app/store/migrations/025.js` | Not Started | | |
| 27 | `app/store/migrations/026.js` | Not Started | | |
| 28 | `app/store/migrations/027.js` | Not Started | | |

**Reference**: `app/store/migrations/028.ts` (already migrated — uses `hasProperty`, `isObject`, `captureException`)

#### 1.6.2 Migration Test Files

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 29 | `app/store/migrations/019.test.js` | Not Started | | |
| 30 | `app/store/migrations/020.test.js` | Not Started | | |
| 31 | `app/store/migrations/021.test.js` | Not Started | | |
| 32 | `app/store/migrations/022.test.js` | Not Started | | |
| 33 | `app/store/migrations/023.test.js` | Not Started | | |
| 34 | `app/store/migrations/024.test.js` | Not Started | | |
| 35 | `app/store/migrations/025.test.js` | Not Started | | |
| 36 | `app/store/migrations/026.test.js` | Not Started | | |
| 37 | `app/store/migrations/027.test.js` | Not Started | | |

---

### 1.7 Phase 6 — Miscellaneous

**Priority**: Low — leaf files with minimal downstream impact.

| # | Module Path | Status | Child Session ID | Notes |
|---|-------------|--------|------------------|-------|
| 1 | `app/lib/ens-ipfs/contracts/registry.js` | Not Started | | ENS registry ABI |
| 2 | `app/lib/ens-ipfs/contracts/resolver.js` | Not Started | | ENS resolver ABI |
| 3 | `app/lib/ens-ipfs/resolver.js` | Not Started | | ENS-IPFS resolution |
| 4 | `app/lib/ppom/blockaid-version.js` | Not Started | | Blockaid version constant |
| 5 | `app/images/image-icons.js` | Not Started | | Image icon registry |
| 6 | `app/__mocks__/pngMock.js` | Not Started | | Jest mock |
| 7 | `app/__mocks__/react-native-device-info.js` | Not Started | | Jest mock |
| 8 | `app/__mocks__/react-native-splash-screen.js` | Not Started | | Jest mock |
| 9 | `app/__mocks__/react-native-view-shot.js` | Not Started | | Jest mock |
| 10 | `app/__mocks__/rn-fetch-blob.js` | Not Started | | Jest mock |
| 11 | `app/__mocks__/svgMock.js` | Not Started | | Jest mock |

---

### 1.8 Parent Session Responsibilities

The parent session is responsible for:

1. **Progress Tracking**: Maintain the tables above with current status for every module
2. **Shared Type Definitions**: Coordinate creation of shared types before child sessions start (see [Section 3](#3-shared-configuration--conventions))
3. **Dependency Management**: Ensure child sessions don't start until their dependencies are complete
4. **Conflict Resolution**: If two child sessions modify the same file (e.g., shared imports), the parent resolves merge conflicts
5. **Quality Gate Enforcement**: Verify each child session's PR passes the validation pipeline before merging
6. **Status Reporting**: Maintain a summary dashboard:

```
=== Migration Progress Dashboard ===
Phase 1 — Foundation:        0/34 files (0%)
Phase 2 — State Management:  0/23 files (0%)
Phase 3 — Core Modules:      0/20 files (0%)
Phase 4 — UI Components:     0/93 files (0%)
Phase 5 — Store Migrations:  0/37 files (0%)
Phase 6 — Miscellaneous:     0/11 files (0%)
─────────────────────────────────────
Total:                        0/218 files (0%)
```

### 1.9 Phase Gating Rules

| Gate | Condition | Blocks |
|------|-----------|--------|
| Gate 1→2 | Phase 1 >80% complete | Phase 2 start |
| Gate 2→3 | Phase 2 >80% complete | Phase 3 start |
| Gate 3→4 | Phase 3 >80% complete | Phase 4 start |
| Gate 5 | No gate | Runs parallel with Phase 1–3 |
| Gate 6 | No gate | Runs parallel with Phase 5 |

> **Exception**: Within Phase 4, sub-phases must be sequential: 4A → 4B → 4C → 4D.

---

## 2. Child Sessions: Per-Module Migration Tasks

### 2.1 Child Session Template

Each child session handles the migration of one module or a small group of related modules. Copy this template for each new migration task.

---

#### Child Session: `migration/phase-{N}/{module-name}`

**Module(s)**: `app/path/to/module.js`
**Phase**: {N}
**Dependencies**: {list any modules that must be migrated first}
**Assignee**: {session ID or developer}

##### Pre-Migration Checklist

- [ ] Identify all imports/exports of the target `.js` file
  ```bash
  # Find all files that import from this module
  rg "from.*['\"].*{module-name}" app/ --type ts --type js
  rg "require\(.*{module-name}" app/ --type ts --type js
  ```
- [ ] Identify all callers/consumers of the module
- [ ] Check for existing `@ts-ignore` or `@ts-expect-error` comments referencing this module
  ```bash
  rg "@ts-ignore|@ts-expect-error" app/ -l | xargs rg "{module-name}"
  ```
- [ ] Review existing JSDoc comments that can inform type definitions
- [ ] Check if a `.d.ts` declaration file already exists for this module
- [ ] Identify the reference pattern (find an already-migrated neighbor file)

##### Migration Steps

1. **Rename** the file:
   - `.js` → `.ts` for pure logic modules
   - `.js` → `.tsx` for React components (files containing JSX)
   - `.test.js` → `.test.ts` or `.test.tsx` for corresponding test files

2. **Add explicit type annotations**:
   - All function parameters
   - All function return types
   - All exported variables and constants
   - Class properties and method signatures

3. **For React components — replace `PropTypes` with TypeScript interfaces**:
   ```typescript
   // Use interfaces (not type aliases) per project convention
   interface ComponentProps {
     title: string;
     onPress: () => void;
     children?: React.ReactNode;
     style?: StyleProp<ViewStyle>;
     isVisible?: boolean;
   }
   ```

   **PropTypes → TypeScript mapping**:

   | PropTypes | TypeScript |
   |-----------|------------|
   | `PropTypes.string` | `string` |
   | `PropTypes.number` | `number` |
   | `PropTypes.bool` | `boolean` |
   | `PropTypes.func` | `() => void` (or specific signature) |
   | `PropTypes.node` | `React.ReactNode` |
   | `PropTypes.element` | `React.ReactElement` |
   | `PropTypes.arrayOf(PropTypes.string)` | `string[]` |
   | `PropTypes.shape({...})` | Named interface |
   | `PropTypes.oneOf([...])` | String literal union |
   | `.isRequired` | Non-optional (no `?`) |

4. **For Redux-connected components**, define three interfaces:
   ```typescript
   interface OwnProps {
     // Props passed by parent component
   }

   interface StateProps {
     // Props from mapStateToProps
   }

   interface DispatchProps {
     // Props from mapDispatchToProps
   }

   type Props = OwnProps & StateProps & DispatchProps;
   ```

   Type `mapStateToProps` and `mapDispatchToProps`:
   ```typescript
   const mapStateToProps = (state: RootState): StateProps => ({
     /* ... */
   });
   ```

   > **Important**: Keep `connect()` HOCs — do NOT convert to hooks during migration.

5. **Add proper typing for Redux hooks** (if the component uses hooks instead of `connect()`):
   ```typescript
   const value = useSelector((state: RootState) => state.someSlice.value);
   const dispatch = useDispatch();
   ```

6. **Resolve all TypeScript compiler errors**:
   ```bash
   npx tsc --noEmit
   ```

7. **Run existing tests and fix any test failures**:
   ```bash
   yarn test --findRelatedTests <migrated-file>
   ```

8. **Add/update type exports** so downstream consumers can import types:
   ```typescript
   export type { ComponentProps, SomeType };
   ```

9. **Update any `require()` calls** to ES module `import` syntax where applicable:
   ```typescript
   // Before
   const module = require('./module');
   // After
   import module from './module';
   ```

##### Post-Migration Checklist

- [ ] No `any` types unless explicitly justified with a `// TODO: type this properly` comment
- [ ] All tests pass: `yarn test --findRelatedTests <migrated-file>`
- [ ] Lint passes: `yarn lint`
- [ ] Type-check passes: `npx tsc --noEmit`
- [ ] No regressions in dependent modules (run tests for importing files)
- [ ] Snapshot tests produce identical output (if applicable)
- [ ] All `PropTypes` imports removed
- [ ] Preprocessor directives preserved (if applicable): `///: BEGIN:ONLY_INCLUDE_IF(...)`
- [ ] PR created with naming convention: `chore(js-ts): Convert {module-name} to TypeScript`
- [ ] Parent session tracker updated with completion status

##### Validation Pipeline

```bash
# 1. Type check — must pass with zero errors
npx tsc --noEmit

# 2. Related tests — must pass
yarn test --findRelatedTests <migrated-file>

# 3. Lint — must pass
yarn lint
```

---

### 2.2 Child Session Naming Convention

```
migration/phase-{N}/{module-name}
```

**Examples**:
- `migration/phase-1/constants-navigation`
- `migration/phase-1/util-gasUtils`
- `migration/phase-1/util-networks`
- `migration/phase-2/actions-alert`
- `migration/phase-2/reducers-swaps`
- `migration/phase-3/core-SecureKeychain`
- `migration/phase-3/core-BackgroundBridge`
- `migration/phase-3/rpc-wallet_addEthereumChain`
- `migration/phase-4a/ui-AnimatedSpinner`
- `migration/phase-4b/ui-Swaps`
- `migration/phase-4c/views-Browser`
- `migration/phase-4d/nav-MainNavigator`
- `migration/phase-5/migration-000`
- `migration/phase-6/lib-ens-ipfs`

**PR Naming Convention**: `chore(js-ts): Convert {module-name} to TypeScript`

**Branch Naming Convention**: `devin/{timestamp}-migrate-{module-name}`

---

## 3. Shared Configuration & Conventions

### 3.1 TypeScript Configuration

The repository already has a well-configured `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Key points**:
- `"strict": true` is already enabled — all strict checks are active
- `"allowJs": true` allows incremental migration (`.js` and `.ts` coexist)
- No build config changes needed — just rename, type, and validate
- `jest.config.js` already transforms both `.js` and `.ts` via `babel-jest`

### 3.2 ESLint TypeScript Rules

The repository already uses `@typescript-eslint` (visible in `app/core/Engine/Engine.ts` which has `/* eslint-disable @typescript-eslint/no-shadow */`). Key rules to follow:

- Do not add `/* eslint-disable */` comments unless the existing code already has them
- Prefer fixing lint errors over disabling rules
- Common `@typescript-eslint` rules in effect:
  - `@typescript-eslint/no-shadow`
  - `@typescript-eslint/no-unused-vars`
  - `@typescript-eslint/no-explicit-any`

### 3.3 Naming Conventions

| Convention | Rule | Example |
|-----------|------|---------|
| **Interfaces** | Use `interface` keyword (not `type` alias) for object shapes | `interface ComponentProps { ... }` |
| **Interface naming** | No `I` prefix — use descriptive names | `ComponentProps`, not `IComponentProps` |
| **Type files** | Named `*.types.ts` when types are complex enough to warrant a separate file | `Component.types.ts` |
| **Children prop** | Use `React.ReactNode` | `children?: React.ReactNode` |
| **Style props** | Use `StyleProp<ViewStyle>` | `style?: StyleProp<ViewStyle>` |
| **Animated values** | Properly type React Native Animated API | `Animated.Value`, `Animated.ValueXY` |
| **Enum-like constants** | Use `as const` assertions | `export const ACTION = 'ACTION' as const;` |
| **Discriminated unions** | For Redux actions | `type Action = ShowAlert \| HideAlert;` |

### 3.4 Shared Types Directory

Create `app/types/` for shared type definitions used across multiple modules:

```
app/types/
├── redux.ts          # RootState, AppDispatch, store-related types
├── navigation.ts     # RootStackParamList, screen param types
├── network.ts        # ChainId, NetworkConfiguration, RPC types
├── transaction.ts    # Transaction-related shared types
└── index.ts          # Re-exports for convenience
```

**Priority**: Create these shared type files as part of Phase 1, before child sessions begin, so all modules have consistent types to import.

**Example `app/types/redux.ts`**:
```typescript
import type { store } from '../store';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Example `app/types/navigation.ts`**:
```typescript
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

export interface RootStackParamList {
  [key: string]: undefined | Record<string, unknown>;
  // Populate with actual screen params during Phase 4D
}

export type NavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

export type RouteProps<T extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, T>;
```

### 3.5 Reference Patterns by Module Type

When migrating a file, first examine an already-migrated neighbor to understand conventions:

| Module Type | Reference Pattern |
|-------------|-------------------|
| Constants | `app/constants/urls.ts`, `app/constants/bridge.ts` |
| Actions | `app/actions/onboarding/index.ts` |
| Reducers | `app/reducers/security/index.ts` |
| Utilities | `app/util/string/index.ts`, `app/util/mnemonic/index.ts` |
| Core services | `app/core/Authentication/Authentication.ts`, `app/core/Encryptor/Encryptor.ts` |
| RPC methods | `app/core/RPCMethods/RPCMethodMiddleware.ts` |
| Store migrations | `app/store/migrations/028.ts` |
| Simple UI components | `app/component-library/components/` (pattern: `.tsx` + `.types.ts` + `.styles.ts`) |
| Complex UI components | `app/components/UI/Tokens/index.tsx`, `app/components/UI/ManageNetworks/ManageNetworks.tsx` |
| View components | `app/components/Views/Wallet/index.tsx`, `app/components/Views/Login/index.tsx` |

---

## 4. Risk Management

### 4.1 Incremental Approach

- **One file (or small group of related files) per PR** to minimize merge conflicts
- **PR naming**: `chore(js-ts): Convert {module-name} to TypeScript`
- **Each PR must pass CI**: unit tests, lint, and type-check
- **Merge PRs promptly** to avoid long-lived branches diverging from `main`

### 4.2 Backward Compatibility

- During migration, `.js` files can still import from newly converted `.ts` files (enabled by `"allowJs": true`)
- Module resolution works transparently — no path changes needed when renaming `.js` → `.ts`
- `require()` calls from `.js` files resolve `.ts` files correctly via Metro bundler

### 4.3 Behavioral Preservation

- **No logic changes**: Only add types — do not refactor logic during migration
- **Keep `connect()` HOCs**: Do not convert to hooks during migration
- **Preserve preprocessor directives**: `///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)` must remain intact
- **Snapshot parity**: Snapshot tests must produce identical output before and after migration
- **Maintain all existing functionality**: No behavioral regressions

### 4.4 Testing Requirements

Every migration PR must include:

| Check | Command | Must Pass |
|-------|---------|-----------|
| TypeScript compilation | `npx tsc --noEmit` | Zero errors |
| Related unit tests | `yarn test --findRelatedTests <file>` | All pass |
| Lint | `yarn lint` | No new errors |
| Snapshot tests | Automatic via Jest | Identical output |

### 4.5 External QA Requirements

Some modules require manual testing on physical devices or with external services:

| Phase | Module | External QA Needed |
|-------|--------|--------------------|
| Phase 3 | `SecureKeychain.js` | Biometric auth on physical device |
| Phase 3 | `PreventScreenshot.js` | Android device testing |
| Phase 3 | `NotificationManager.js` | Push notification delivery |
| Phase 3 | `Vault.js` | Ledger hardware wallet |
| Phase 3 | `BackgroundBridge.js` | DApp connectivity via WalletConnect/SDK |
| Phase 4B | Swaps components | Full swap flow on device |
| Phase 4B | PaymentRequest/ReceiveRequest | QR code / payment flow |
| Phase 4C | Browser view | DApp browsing & tx signing |
| Phase 4C | ChoosePassword/Onboarding | Biometric setup & SRP flows |
| Phase 4C | Legacy confirmations | Send flow, approvals, Ledger HW |
| Phase 4C | NetworksSettings | Network add/switch (Infura API) |

### 4.6 Rollback Strategy

- If a migration causes issues, **revert the specific PR** — each PR is isolated to one module
- The `"allowJs": true` setting means partial migration is always valid
- No build configuration changes are required, so reverting a rename is always safe
- Git history preserves the original `.js` file for easy recovery

---

## 5. Success Metrics

### 5.1 Primary Metrics

| Metric | Current | Target | Tracking Method |
|--------|---------|--------|-----------------|
| `.js` files in `app/` | ~319 | 0 | `find app -name '*.js' \| wc -l` |
| `.ts`/`.tsx` files in `app/` | ~3,931 | ~4,250 | `find app -name '*.ts' -o -name '*.tsx' \| wc -l` |
| TypeScript coverage | ~92.5% | 100% | `(ts_count / total_count) * 100` |
| `strict: true` | Enabled | Enabled | `tsconfig.json` |

### 5.2 Quality Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| `any` type usage | Minimize — justified only | `rg ":\s*any[^_]" app/ --type ts -c` |
| `@ts-ignore` usage | Zero new additions | `rg "@ts-ignore" app/ --type ts -c` |
| `@ts-expect-error` usage | Zero new additions | `rg "@ts-expect-error" app/ --type ts -c` |
| `tsc --noEmit` errors | 0 | CI pipeline |
| Test pass rate | 100% | CI pipeline |
| Lint errors | 0 new | CI pipeline |

### 5.3 Progress Tracking Script

Run this script to generate a progress report at any time:

```bash
#!/bin/bash
# migration-progress.sh — Run from repo root

JS_COUNT=$(find app -name '*.js' -not -path '*node_modules*' -not -path '*__snapshots__*' | wc -l)
TS_COUNT=$(find app \( -name '*.ts' -o -name '*.tsx' \) -not -path '*node_modules*' | wc -l)
TOTAL=$((JS_COUNT + TS_COUNT))
PCT=$(echo "scale=1; $TS_COUNT * 100 / $TOTAL" | bc)

echo "=== MetaMask Mobile: JS → TS Migration Progress ==="
echo "TypeScript files:  $TS_COUNT"
echo "JavaScript files:  $JS_COUNT"
echo "Total:             $TOTAL"
echo "Coverage:          ${PCT}%"
echo ""
echo "Remaining JS files by directory:"
find app -name '*.js' -not -path '*node_modules*' -not -path '*__snapshots__*' \
  | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20
```

### 5.4 Milestone Targets

| Milestone | Definition | Target Date |
|-----------|-----------|-------------|
| M1: Foundation Complete | Phase 1 + Phase 5 done | TBD |
| M2: State & Core Complete | Phases 2 + 3 done | TBD |
| M3: UI Migration Complete | Phase 4 done | TBD |
| M4: 100% TypeScript | All phases done, 0 `.js` files | TBD |
| M5: Quality Hardened | Zero `any`, zero `@ts-ignore` | TBD |

---

## Appendix A: Full File Inventory

<details>
<summary>Click to expand: All remaining .js files in app/ (319 files)</summary>

```
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
app/constants/navigation.js
app/constants/network.js
app/constants/onboarding.js
app/core/BackgroundBridge/BackgroundBridge.js
app/core/ClipboardManager.js
app/core/DrawerStatusTracker.js
app/core/EntryScriptWeb3.js
app/core/MobilePortStream.js
app/core/NotificationManager.js
app/core/Permissions/specifications.js
app/core/PreventScreenshot.js
app/core/RPCMethods/createEip1193MethodMiddleware/index.js
app/core/RPCMethods/createEthAccountsMethodMiddleware.js
app/core/RPCMethods/eth-request-accounts.js
app/core/RPCMethods/handlers/index.js
app/core/RPCMethods/index.js
app/core/RPCMethods/lib/ethereum-chain-utils.js
app/core/RPCMethods/wallet_addEthereumChain.js
app/core/RPCMethods/wallet_switchEthereumChain.js
app/core/SecureKeychain.js
app/core/TransactionTypes.js
app/core/Vault.js
app/core/WalletConnect/WalletConnect.js
app/images/image-icons.js
app/lib/ens-ipfs/contracts/registry.js
app/lib/ens-ipfs/contracts/resolver.js
app/lib/ens-ipfs/resolver.js
app/lib/ppom/blockaid-version.js
app/reducers/alert/index.js
app/reducers/bookmarks/index.js
app/reducers/browser/index.js
app/reducers/collectibles/index.js
app/reducers/infuraAvailability/index.js
app/reducers/modals/index.js
app/reducers/notification/index.js
app/reducers/privacy/index.js
app/reducers/settings/index.js
app/reducers/swaps/index.js
app/reducers/transaction/index.js
app/reducers/wizard/index.js
app/store/migrations/000.js ... 027.js (28 files)
app/util/ENSUtils.js
app/util/blockies.js
app/util/confirm-tx.js
app/util/confirmation/signatureUtils.js
app/util/confusables/index.js
app/util/conversion/index.js
app/util/conversions.js
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
app/util/transactions/index.js
app/util/walletconnect.js
app/components/Nav/Main/MainNavigator.js
app/components/Nav/Main/RootRPCMethodsUI.js
app/components/Nav/Main/index.js
app/components/UI/ (~90 files — see Phase 4 tables)
app/components/Views/ (~65 files — see Phase 4 tables)
app/__mocks__/ (6 files)
app/util/test/ (8 files)
```

</details>

---

## Appendix B: Child Session Quick Reference Card

Copy-paste checklist for each child session:

```markdown
## Migration: {module-name}

**Branch**: `devin/{timestamp}-migrate-{module-name}`
**PR Title**: `chore(js-ts): Convert {module-name} to TypeScript`
**Phase**: {N}

### Pre-flight
- [ ] Read reference pattern: {already-migrated-neighbor}
- [ ] Map imports/exports: `rg "from.*{module}" app/`
- [ ] Check @ts-ignore refs: `rg "@ts-ignore|@ts-expect-error" app/ | rg "{module}"`

### Execute
- [ ] Rename .js → .ts/.tsx
- [ ] Add type annotations (params, returns, variables)
- [ ] Replace PropTypes with interfaces (if React component)
- [ ] Type Redux connections (if connected)
- [ ] Resolve tsc errors: `npx tsc --noEmit`

### Validate
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `yarn test --findRelatedTests <file>` → all pass
- [ ] `yarn lint` → no new errors
- [ ] Snapshots unchanged (if applicable)
- [ ] No `any` types (or justified with comment)
- [ ] Preprocessor directives intact (if applicable)

### Ship
- [ ] Create PR
- [ ] CI passes
- [ ] Update parent tracker
```
