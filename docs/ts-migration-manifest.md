# TypeScript Migration Manifest

> Generated audit of all `.js`/`.jsx` files remaining in `app/` that need migration to `.ts`/`.tsx`.
> **Total: 331 files** (out of ~4,262 total files in `app/`)

## Summary by Category

| Category | Directory | File Count |
|----------|-----------|------------|
| Mocks | `app/__mocks__/` | 6 |
| Redux Actions | `app/actions/*/` | 11 |
| Redux Reducers | `app/reducers/*/` | 14 |
| Store Migrations | `app/store/migrations/` | 38 |
| Core Services | `app/core/` | 9 |
| Core RPCMethods | `app/core/RPCMethods/` | 8 |
| Core Permissions | `app/core/Permissions/` | 2 |
| Core BackgroundBridge | `app/core/BackgroundBridge/` | 2 |
| Core WalletConnect | `app/core/WalletConnect/` | 1 |
| Constants | `app/constants/` | 3 |
| Navigation | `app/components/Nav/Main/` | 3 |
| Base Components | `app/components/Base/` | 10 |
| UI Components | `app/components/UI/` | ~100 |
| View Components | `app/components/Views/` | ~60 |
| Utilities | `app/util/` | ~25 |
| Lib/ENS | `app/lib/` | 4 |
| Images | `app/images/` | 1 |

## Detailed File List

### `app/__mocks__/` (6 files)
  - `pngMock.js`
  - `react-native-device-info.js`
  - `react-native-splash-screen.js`
  - `react-native-view-shot.js`
  - `rn-fetch-blob.js`
  - `svgMock.js`

### `app/actions/` (11 files)
  - `alert/index.js`
  - `bookmarks/index.js`
  - `browser/index.js`
  - `collectibles/index.js`
  - `infuraAvailability/index.js`
  - `modals/index.js`
  - `notification/index.js`
  - `privacy/index.js`
  - `settings/index.js`
  - `transaction/index.js`
  - `wizard/index.js`

### `app/reducers/` (14 files)
  - `alert/index.js`
  - `bookmarks/index.js`
  - `browser/index.js`
  - `browser/index.test.js`
  - `collectibles/index.js`
  - `infuraAvailability/index.js`
  - `modals/index.js`
  - `notification/index.js`
  - `notification/notification.test.js`
  - `privacy/index.js`
  - `settings/index.js`
  - `swaps/index.js`
  - `transaction/index.js`
  - `wizard/index.js`

### `app/store/migrations/` (38 files)
  - `000.js` through `027.js` (28 source files)
  - `019.test.js` through `028.test.js` (10 test files)

### `app/core/` (9 files, excluding subdirectories)
  - `ClipboardManager.js`
  - `DrawerStatusTracker.js`
  - `EntryScriptWeb3.js`
  - `MobilePortStream.js`
  - `NotificationManager.js`
  - `PreventScreenshot.js`
  - `SecureKeychain.js`
  - `TransactionTypes.js`
  - `Vault.js`

### `app/core/RPCMethods/` (8 files)
  - `createEip1193MethodMiddleware/index.js`
  - `createEip1193MethodMiddleware/index.test.js`
  - `eth-request-accounts.js`
  - `handlers/index.js`
  - `index.js`
  - `lib/ethereum-chain-utils.js`
  - `wallet_addEthereumChain.js`
  - `wallet_switchEthereumChain.js`

### `app/core/Permissions/` (2 files)
  - `specifications.js`
  - `specifications.test.js`

### `app/core/BackgroundBridge/` (2 files)
  - `BackgroundBridge.js`
  - `BackgroundBridge.test.js`

### `app/core/WalletConnect/` (1 file)
  - `WalletConnect.js`

### `app/constants/` (3 files)
  - `navigation.js`
  - `network.js`
  - `onboarding.js`

### `app/components/Nav/Main/` (3 files)
  - `MainNavigator.js`
  - `RootRPCMethodsUI.js`
  - `index.js`

### `app/components/Base/` (10 files)
  - `DetailsModal.js`
  - `Keypad/Keypad.test.js`
  - `Keypad/components.js`
  - `Keypad/constants.js`
  - `Keypad/createKeypadRule.js`
  - `Keypad/createKeypadRule.test.js`
  - `Keypad/index.js`
  - `Keypad/useCurrency.js`
  - `RangeInput.js`
  - `RemoteImage/index.js`
  - `StatusText.js`
  - `TabBar.js`

### `app/components/UI/` (~100 files)
  - Includes: AccountApproval, AccountInfoCard, AccountOverview, ActionModal, ActionView, AddCustomToken, AddressInputs, AnimatedSpinner, AnimatedTransactionModal, AssetList, BasicFunctionality (tests), BrowserBottomBar, Button, CollectibleContract*, Collectibles, Confetti, CustomAlert, DrawerView, EditGasFee*, EthereumAddress, FadeAnimationView, FadeOutOverlay, FoxScreen, GlobalAlert, HintModal, ManageNetworks (test), Navbar, NavbarBrowserTitle, NavbarTitle, NetworkMainAssetLogo, Notification/*, OnboardingWizard/Coachmark, OptinMetrics, PaymentRequest*, PhishingModal, ProtectYourWalletModal, ReceiveRequest, Screen, SeedphraseModal, SelectComponent, SettingsDrawer, SettingsNotification, SkipAccountSecurityModal, SliderButton, SlippageSlider, StyledButton/*, Swaps/*, SwitchCustomNetwork, Tabs/*, TimeEstimateInfoModal, TokenImage, TransactionActionModal/*, TransactionElement/*, TransactionHeader, Transactions, WarningExistingUserModal, WebsiteIcon, WebviewError, WebviewProgressBar

### `app/components/Views/` (~60 files)
  - Includes: AccountBackupStep1, AccountBackupStep1B, ActivityView, AddBookmark, AddressQRCode, Asset, Browser, ChoosePassword, Collectible, CollectibleView, EnterPasswordSimple, ErrorBoundary, GasEducationCarousel, ImportFromSecretRecoveryPhrase, ImportPrivateKeySuccess, LockScreen, ManualBackupStep1-3, MediaPlayer/*, NavigationUnitTest/*, OfflineMode, Onboarding, ResetPassword, Settings/* (AdvancedSettings, AppInformation, Contacts, GeneralSettings, NetworksSettings), SimpleWebview, TermsAndConditions, TransactionSummary, TransactionsView, WalletConnectSessions, confirmations/legacy/* (~25 files)

### `app/util/` (~25 files)
  - `ENSUtils.js`, `blockies.js`, `confirm-tx.js`, `conversions.js`, `dapp-url-list.js`, `etherscan.js`, `gasUtils.js`, `middlewares.js`, `payment-link-generator.js`, `scaling.js`, `streams.js`, `walletconnect.js`
  - `conversion/index.js`, `custom-gas/index.js`, `date/index.js`, `device/index.js`, `general/index.js`, `number/index.js`, `networks/index.js`, `transactions/index.js`, `confusables/index.js`, `sentry/utils.js`, `confirmation/signatureUtils.js`
  - Test utilities: `test/assetFileTransformer.js`, `test/contract-address-registry.js`, `test/ganache-seeder.js`, `test/ganache.js`, `test/network-store.js`, `test/smart-contracts.js`, `test/testSetup.js`, `test/utils.js`

### `app/lib/` (4 files)
  - `ens-ipfs/contracts/registry.js`
  - `ens-ipfs/contracts/resolver.js`
  - `ens-ipfs/resolver.js`
  - `ppom/blockaid-version.js`

### `app/images/` (1 file)
  - `image-icons.js`
