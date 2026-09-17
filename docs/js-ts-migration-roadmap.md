# MetaMask Mobile JS→TS Migration Roadmap

> Tracking document for finishing the incremental JavaScript→TypeScript migration of the `app/` directory.

> Convention for every conversion PR: `chore(js-ts): Convert <path> to TypeScript` (see #11546, #11629, #11661; batch example #11214).

## Baseline (Step 0)

- **Remaining source `.js`/`.jsx` under `app/` (non-test): 291**
- Remaining `.test.js`/`.test.jsx` under `app/`: 40
- Total remaining JS/JSX in `app/`: 331

### CI compatibility — the JS-additions fitness function

The migration approach (rename `.js`→`.ts`/`.tsx` + add types) is **compatible** with the CI gate:
- `.github/scripts/fitness-functions/rules/javascript-additions.ts` → `preventJavaScriptFileAdditions` calls `filterDiffFileCreations(diff)`, which only inspects diff blocks whose second line starts with `new file mode`. It then checks them against `restrictedFilePresent(..., APP_FOLDER_JS_REGEX)`.
- `.github/scripts/fitness-functions/common/constants.ts` → `APP_FOLDER_JS_REGEX = /^(app).*\.(js|jsx)$/`.
- `.github/scripts/fitness-functions/rules/index.ts` → rule registered as *"Check for js or jsx file being added"*.
- **Implication:** the gate only blocks *newly created* `app/**` `.js`/`.jsx` files. Renaming an existing `.js` to `.ts` does not create a new `.js`, so conversions pass cleanly. Do **not** create any new `.js`/`.jsx` under `app/` during this work.
- Note: the blueprint's test script references `yarn run check-ts-app-gate` in `.github/scripts`, but **no such script currently exists** in `.github/scripts/package.json` (scripts present: `fitness-functions`, etc.). Verify before relying on it in Step 4.

### Config baseline

- `tsconfig.json`: `allowJs: true`, `checkJs` commented out, `strict: true`, `isolatedModules: true`, `noEmit: true`. `include: ["app/**/*", ...]`.
- `.eslintrc.js`: `*.{ts,tsx}` extend `@metamask/eslint-config-typescript` with **`@typescript-eslint/no-explicit-any: 'error'`**; `*.js`/`*.jsx` use the looser `@babel/eslint-parser` ruleset. **Converted files must have zero explicit `any`.**
- `app/reducers/index.ts`: `RootState` still declares many reducers as `any` with `TODO: Convert all reducers to valid TypeScript Redux reducers` (see Step 3).

## Validation pipeline (run for every converted file/batch)

```bash
yarn tsc --noEmit          # or: tsc --noEmit
yarn test --findRelatedTests <file>
yarn lint
```

## Remaining-file inventory by area (Steps 1 & 2)

Phases mirror the Master Playbook dependency graph. Convert leaf/util modules before their consumers.

## Phase 1 — Leaf nodes (no deps, start immediately, parallel)

### Playbook 1 — Redux Actions

- **Files: 11 source**
- **Dependency order:** None (leaf). Blocks Playbook 2.
- **Risk:** Low. Define `as const` action-type constants + discriminated union `Action`; export for reducers.

<details><summary>Source files</summary>

- `app/actions/alert/index.js`
- `app/actions/bookmarks/index.js`
- `app/actions/browser/index.js`
- `app/actions/collectibles/index.js`
- `app/actions/infuraAvailability/index.js`
- `app/actions/modals/index.js`
- `app/actions/notification/index.js`
- `app/actions/privacy/index.js`
- `app/actions/settings/index.js`
- `app/actions/transaction/index.js`
- `app/actions/wizard/index.js`

</details>

### Playbook 10 — Constants, Navigation, Lib, Images & Mocks

- **Files: 17 source**
- **Dependency order:** None (leaf). Consumed by component playbooks.
- **Risk:** Low–Med. Navigation needs `RootStackParamList`; mocks must match mocked module types (wrong types break test suite).

<details><summary>Source files</summary>

- `app/constants/navigation.js`
- `app/constants/network.js`
- `app/constants/onboarding.js`
- `app/components/Nav/Main/MainNavigator.js`
- `app/components/Nav/Main/RootRPCMethodsUI.js`
- `app/components/Nav/Main/index.js`
- `app/lib/ens-ipfs/contracts/registry.js`
- `app/lib/ens-ipfs/contracts/resolver.js`
- `app/lib/ens-ipfs/resolver.js`
- `app/lib/ppom/blockaid-version.js`
- `app/images/image-icons.js`
- `app/__mocks__/pngMock.js`
- `app/__mocks__/react-native-device-info.js`
- `app/__mocks__/react-native-splash-screen.js`
- `app/__mocks__/react-native-view-shot.js`
- `app/__mocks__/rn-fetch-blob.js`
- `app/__mocks__/svgMock.js`

</details>

## Phase 2 — Redux Reducers (depends on Playbook 1)

### Playbook 2 — Redux Reducers

- **Files: 12 source** + 2 test
- **Dependency order:** After Playbook 1. Blocks Playbooks 8/9 (RootState consumers) and Step 3.
- **Risk:** Med. Define `State` interface per reducer, import `Action` union from matching action module, export `State` for `RootState`.

<details><summary>Source files</summary>

- `app/reducers/alert/index.js`
- `app/reducers/bookmarks/index.js`
- `app/reducers/browser/index.js`
- `app/reducers/collectibles/index.js`
- `app/reducers/infuraAvailability/index.js`
- `app/reducers/modals/index.js`
- `app/reducers/notification/index.js`
- `app/reducers/privacy/index.js`
- `app/reducers/settings/index.js`
- `app/reducers/swaps/index.js`
- `app/reducers/transaction/index.js`
- `app/reducers/wizard/index.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/reducers/browser/index.test.js`
- `app/reducers/notification/notification.test.js`

</details>

## Phase 3 — Store Migrations & Utilities (parallel)

### Playbook 3 — Store Migrations

- **Files: 28 source** + 10 test
- **Dependency order:** None. Parallel with Playbook 6.
- **Risk:** Med. Type as `migrate(state: unknown): Record<string, unknown>`; use `isObject`/`hasProperty` from `@metamask/utils` (see `028.ts`). Early migrations (000–018) touch `state.engine.backgroundState.*` directly — narrow or assert.

<details><summary>Source files</summary>

- `app/store/migrations/000.js`
- `app/store/migrations/001.js`
- `app/store/migrations/002.js`
- `app/store/migrations/003.js`
- `app/store/migrations/004.js`
- `app/store/migrations/005.js`
- `app/store/migrations/006.js`
- `app/store/migrations/007.js`
- `app/store/migrations/008.js`
- `app/store/migrations/009.js`
- `app/store/migrations/010.js`
- `app/store/migrations/011.js`
- `app/store/migrations/012.js`
- `app/store/migrations/013.js`
- `app/store/migrations/014.js`
- `app/store/migrations/015.js`
- `app/store/migrations/016.js`
- `app/store/migrations/017.js`
- `app/store/migrations/018.js`
- `app/store/migrations/019.js`
- `app/store/migrations/020.js`
- `app/store/migrations/021.js`
- `app/store/migrations/022.js`
- `app/store/migrations/023.js`
- `app/store/migrations/024.js`
- `app/store/migrations/025.js`
- `app/store/migrations/026.js`
- `app/store/migrations/027.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/store/migrations/019.test.js`
- `app/store/migrations/020.test.js`
- `app/store/migrations/021.test.js`
- `app/store/migrations/022.test.js`
- `app/store/migrations/023.test.js`
- `app/store/migrations/024.test.js`
- `app/store/migrations/025.test.js`
- `app/store/migrations/026.test.js`
- `app/store/migrations/027.test.js`
- `app/store/migrations/028.test.js`

</details>

### Playbook 6 — Utility Functions

- **Files: 23 source** + 1 test
- **Dependency order:** None. Parallel with Playbook 3. Consumed by component playbooks.
- **Risk:** Low–Med. Add param/return types; BN.js typing in `conversions`/`gasUtils`; `device/index` uses `Platform.OS` literals.

<details><summary>Source files</summary>

- `app/util/ENSUtils.js`
- `app/util/blockies.js`
- `app/util/confirm-tx.js`
- `app/util/confirmation/signatureUtils.js`
- `app/util/confusables/index.js`
- `app/util/conversion/index.js`
- `app/util/conversions.js`
- `app/util/custom-gas/index.js`
- `app/util/dapp-url-list.js`
- `app/util/date/index.js`
- `app/util/device/index.js`
- `app/util/etherscan.js`
- `app/util/gasUtils.js`
- `app/util/general/index.js`
- `app/util/middlewares.js`
- `app/util/networks/index.js`
- `app/util/number/index.js`
- `app/util/payment-link-generator.js`
- `app/util/scaling.js`
- `app/util/sentry/utils.js`
- `app/util/streams.js`
- `app/util/transactions/index.js`
- `app/util/walletconnect.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/util/conversions.test.js`

</details>

### Playbook 6b — Test infrastructure utilities (`app/util/test/*`)

- **Files: 8 source**
- **Dependency order:** None. Low priority but blocks strict typing of test helpers used everywhere.
- **Risk:** Med. `testSetup.js`, `network-store.js`, `ganache*` etc. are imported by the whole test suite — type carefully.

<details><summary>Source files</summary>

- `app/util/test/assetFileTransformer.js`
- `app/util/test/contract-address-registry.js`
- `app/util/test/ganache-seeder.js`
- `app/util/test/ganache.js`
- `app/util/test/network-store.js`
- `app/util/test/smart-contracts.js`
- `app/util/test/testSetup.js`
- `app/util/test/utils.js`

</details>

## Phase 4 — Core Services & RPC (parallel; after Playbooks 1,2)

### Playbook 4 — Core Services & Singletons

- **Files: 11 source** + 1 test
- **Dependency order:** After Playbooks 1,2. Consumed by Playbooks 8/9.
- **Risk:** High for SecureKeychain/Vault/NotificationManager/BackgroundBridge (native modules, biometrics, KeyringController, middleware stack). Start with TransactionTypes/DrawerStatusTracker/ClipboardManager.

<details><summary>Source files</summary>

- `app/core/BackgroundBridge/BackgroundBridge.js`
- `app/core/ClipboardManager.js`
- `app/core/DrawerStatusTracker.js`
- `app/core/EntryScriptWeb3.js`
- `app/core/MobilePortStream.js`
- `app/core/NotificationManager.js`
- `app/core/PreventScreenshot.js`
- `app/core/SecureKeychain.js`
- `app/core/TransactionTypes.js`
- `app/core/Vault.js`
- `app/core/WalletConnect/WalletConnect.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/core/BackgroundBridge/BackgroundBridge.test.js`

</details>

### Playbook 5 — RPC Methods & Permissions

- **Files: 8 source** + 4 test
- **Dependency order:** Parallel with Playbook 4.
- **Risk:** Med–High. Use `@metamask/utils` JSON-RPC types + per-handler `Hooks` interfaces; `specifications` uses `@metamask/permission-controller`. **Preserve `///: BEGIN:ONLY_INCLUDE_IF(...)` directives exactly.**

<details><summary>Source files</summary>

- `app/core/RPCMethods/createEip1193MethodMiddleware/index.js`
- `app/core/RPCMethods/eth-request-accounts.js`
- `app/core/RPCMethods/handlers/index.js`
- `app/core/RPCMethods/index.js`
- `app/core/RPCMethods/lib/ethereum-chain-utils.js`
- `app/core/RPCMethods/wallet_addEthereumChain.js`
- `app/core/RPCMethods/wallet_switchEthereumChain.js`
- `app/core/Permissions/specifications.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js`
- `app/core/RPCMethods/wallet_addEthereumChain.test.js`
- `app/core/RPCMethods/wallet_switchEthereumChain.test.js`
- `app/core/Permissions/specifications.test.js`

</details>

## Phase 5 — Simple UI Components

Playbook 7 covers simple presentational components in `app/components/UI/*` and `app/components/Base/*` (PropTypes → `Props` interface). Playbook 8 covers the stateful/`connect()`-based UI components. Because `app/components/UI` has 92 source files, split into subfolder-sized child-session batches (see Batch plan below).

### Playbook 7/8 — `app/components/Base`

- **Files: 10 source** + 2 test
- **Dependency order:** After Playbooks 4,5,6,10.
- **Risk:** Low (presentational). Snapshot parity expected.

<details><summary>Source files</summary>

- `app/components/Base/DetailsModal.js`
- `app/components/Base/Keypad/components.js`
- `app/components/Base/Keypad/constants.js`
- `app/components/Base/Keypad/createKeypadRule.js`
- `app/components/Base/Keypad/index.js`
- `app/components/Base/Keypad/useCurrency.js`
- `app/components/Base/RangeInput.js`
- `app/components/Base/RemoteImage/index.js`
- `app/components/Base/StatusText.js`
- `app/components/Base/TabBar.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/components/Base/Keypad/Keypad.test.js`
- `app/components/Base/Keypad/createKeypadRule.test.js`

</details>

## Phase 6 — `app/components/UI` (Playbooks 7 & 8)

### `app/components/UI` (all remaining)

- **Files: 92 source** + 11 test
- **Dependency order:** After Base + leaf playbooks. Split into batches by subfolder.
- **Risk:** Mixed. Presentational = low; `connect()`-based (Swaps, Transactions, Notification, DrawerView, CollectibleContracts, PaymentRequest, OptinMetrics, AccountApproval) = med–high, define OwnProps/StateProps/DispatchProps, type `mapStateToProps(state: RootState)`.

<details><summary>Source files</summary>

- `app/components/UI/AccountApproval/index.js`
- `app/components/UI/AccountInfoCard/index.js`
- `app/components/UI/AccountOverview/index.js`
- `app/components/UI/ActionModal/ActionContent/index.js`
- `app/components/UI/ActionModal/index.js`
- `app/components/UI/ActionView/index.js`
- `app/components/UI/AddCustomToken/index.js`
- `app/components/UI/AddressInputs/index.js`
- `app/components/UI/AnimatedSpinner/index.js`
- `app/components/UI/AnimatedTransactionModal/index.js`
- `app/components/UI/AssetList/index.js`
- `app/components/UI/BrowserBottomBar/index.js`
- `app/components/UI/Button/index.js`
- `app/components/UI/CollectibleContractElement/index.js`
- `app/components/UI/CollectibleContractInformation/index.js`
- `app/components/UI/CollectibleContractOverview/index.js`
- `app/components/UI/CollectibleContracts/index.js`
- `app/components/UI/CollectibleOverview/index.js`
- `app/components/UI/Collectibles/index.js`
- `app/components/UI/Confetti/index.js`
- `app/components/UI/CustomAlert/index.js`
- `app/components/UI/DrawerView/index.js`
- `app/components/UI/EditGasFee1559/index.js`
- `app/components/UI/EditGasFeeLegacy/index.js`
- `app/components/UI/EthereumAddress/index.js`
- `app/components/UI/FadeAnimationView/index.js`
- `app/components/UI/FadeOutOverlay/index.js`
- `app/components/UI/FoxScreen/index.js`
- `app/components/UI/GlobalAlert/index.js`
- `app/components/UI/HintModal/index.js`
- `app/components/UI/Navbar/index.js`
- `app/components/UI/NavbarBrowserTitle/index.js`
- `app/components/UI/NavbarTitle/index.js`
- `app/components/UI/NetworkMainAssetLogo/index.js`
- `app/components/UI/Notification/BaseNotification/index.js`
- `app/components/UI/Notification/SimpleNotification/index.js`
- `app/components/UI/Notification/TransactionNotification/index.js`
- `app/components/UI/Notification/index.js`
- `app/components/UI/OnboardingWizard/Coachmark/index.js`
- `app/components/UI/OptinMetrics/index.js`
- `app/components/UI/PaymentRequest/index.js`
- `app/components/UI/PaymentRequestSuccess/index.js`
- `app/components/UI/PhishingModal/index.js`
- `app/components/UI/ProtectYourWalletModal/index.js`
- `app/components/UI/ReceiveRequest/index.js`
- `app/components/UI/Screen/index.js`
- `app/components/UI/SeedphraseModal/index.js`
- `app/components/UI/SelectComponent/index.js`
- `app/components/UI/SettingsDrawer/index.js`
- `app/components/UI/SettingsNotification/index.js`
- `app/components/UI/SkipAccountSecurityModal/index.js`
- `app/components/UI/SliderButton/index.js`
- `app/components/UI/SlippageSlider/index.js`
- `app/components/UI/StyledButton/index.android.js`
- `app/components/UI/StyledButton/index.ios.js`
- `app/components/UI/StyledButton/index.js`
- `app/components/UI/Swaps/QuotesView.js`
- `app/components/UI/Swaps/components/ActionAlert.js`
- `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js`
- `app/components/UI/Swaps/components/AssetSwapButton.js`
- `app/components/UI/Swaps/components/GasEditModal.js`
- `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js`
- `app/components/UI/Swaps/components/LoadingAnimation/index.js`
- `app/components/UI/Swaps/components/Onboarding.js`
- `app/components/UI/Swaps/components/QuotesModal.js`
- `app/components/UI/Swaps/components/QuotesSummary.js`
- `app/components/UI/Swaps/components/SlippageModal.js`
- `app/components/UI/Swaps/components/TokenIcon.js`
- `app/components/UI/Swaps/components/TokenImportModal.js`
- `app/components/UI/Swaps/components/TokenSelectButton.js`
- `app/components/UI/Swaps/components/TokenSelectModal.js`
- `app/components/UI/Swaps/index.js`
- `app/components/UI/Swaps/utils/index.js`
- `app/components/UI/Swaps/utils/useBalance.js`
- `app/components/UI/Swaps/utils/useBlockExplorer.js`
- `app/components/UI/Swaps/utils/useFetchTokenMetadata.js`
- `app/components/UI/SwitchCustomNetwork/index.js`
- `app/components/UI/Tabs/TabCountIcon/index.js`
- `app/components/UI/Tabs/index.js`
- `app/components/UI/TimeEstimateInfoModal/index.js`
- `app/components/UI/TokenImage/index.js`
- `app/components/UI/TransactionActionModal/TransactionActionContent/index.js`
- `app/components/UI/TransactionActionModal/index.js`
- `app/components/UI/TransactionElement/TransactionDetails/index.js`
- `app/components/UI/TransactionElement/index.js`
- `app/components/UI/TransactionElement/utils.js`
- `app/components/UI/TransactionHeader/index.js`
- `app/components/UI/Transactions/index.js`
- `app/components/UI/WarningExistingUserModal/index.js`
- `app/components/UI/WebsiteIcon/index.js`
- `app/components/UI/WebviewError/index.js`
- `app/components/UI/WebviewProgressBar/index.js`

</details>

<details><summary>Test files (rename alongside)</summary>

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

</details>

## Phase 7 — View Components (Playbook 9)

### Playbook 9A — Standalone Views (`app/components/Views/*`)

- **Files: 38 source** + 5 test
- **Dependency order:** Final phase, after Playbook 8.
- **Risk:** High for Browser (webview), Onboarding/ChoosePassword (biometrics/seed), Settings/NetworksSettings (Infura). Class components → `Props`/`State` interfaces.

<details><summary>Source files</summary>

- `app/components/Views/AccountBackupStep1/index.js`
- `app/components/Views/AccountBackupStep1B/index.js`
- `app/components/Views/ActivityView/index.js`
- `app/components/Views/AddBookmark/index.js`
- `app/components/Views/AddressQRCode/index.js`
- `app/components/Views/Asset/index.js`
- `app/components/Views/Browser/index.js`
- `app/components/Views/ChoosePassword/index.js`
- `app/components/Views/Collectible/index.js`
- `app/components/Views/CollectibleView/index.js`
- `app/components/Views/EnterPasswordSimple/index.js`
- `app/components/Views/ErrorBoundary/index.js`
- `app/components/Views/GasEducationCarousel/index.js`
- `app/components/Views/ImportFromSecretRecoveryPhrase/index.js`
- `app/components/Views/ImportPrivateKeySuccess/index.js`
- `app/components/Views/LockScreen/index.js`
- `app/components/Views/ManualBackupStep1/index.js`
- `app/components/Views/ManualBackupStep2/index.js`
- `app/components/Views/ManualBackupStep3/index.js`
- `app/components/Views/MediaPlayer/AndroidMediaPlayer.js`
- `app/components/Views/MediaPlayer/index.js`
- `app/components/Views/NavigationUnitTest/index.js`
- `app/components/Views/OfflineMode/index.js`
- `app/components/Views/Onboarding/index.js`
- `app/components/Views/ResetPassword/index.js`
- `app/components/Views/Settings/AdvancedSettings/index.js`
- `app/components/Views/Settings/AppInformation/index.js`
- `app/components/Views/Settings/Contacts/ContactForm/index.js`
- `app/components/Views/Settings/Contacts/index.js`
- `app/components/Views/Settings/GeneralSettings/index.js`
- `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js`
- `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js`
- `app/components/Views/Settings/NetworksSettings/index.js`
- `app/components/Views/SimpleWebview/index.js`
- `app/components/Views/TermsAndConditions/index.js`
- `app/components/Views/TransactionSummary/index.js`
- `app/components/Views/TransactionsView/index.js`
- `app/components/Views/WalletConnectSessions/index.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/components/Views/Asset/index.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen1.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen2.test.js`
- `app/components/Views/NavigationUnitTest/TestScreen3.test.js`
- `app/components/Views/OnboardingSuccess/index.test.js`

</details>

### Playbook 9B — Legacy Confirmations (`app/components/Views/confirmations/legacy/*`)

- **Files: 33 source** + 4 test
- **Dependency order:** Final phase.
- **Risk:** High. SendFlow passes complex state via nav params; type txns with `TransactionMeta` from `@metamask/transaction-controller`. Manual QA (send flow, approvals, signatures, Ledger) required.

<details><summary>Source files</summary>

- `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js`
- `app/components/Views/confirmations/legacy/Approval/index.js`
- `app/components/Views/confirmations/legacy/Approve/index.js`
- `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js`
- `app/components/Views/confirmations/legacy/Send/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx`
- `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js`
- `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js`
- `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js`
- `app/components/Views/confirmations/legacy/components/CustomNonce/index.js`
- `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx`
- `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx`
- `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js`
- `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/index.js`
- `app/components/Views/confirmations/legacy/components/TypedSign/index.js`
- `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx`
- `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js`
- `app/components/Views/confirmations/mock-data.js`

</details>

<details><summary>Test files (rename alongside)</summary>

- `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx`
- `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`

</details>

## Step 2 — Child-session batch plan

Each child session: (1) `git mv` `.js`→`.ts`/`.tsx` (and matching `.test.js`), (2) add types, remove implicit `any`, introduce **no** explicit `any`, (3) fix errors in the file + immediate importers, (4) run `tsc --noEmit` / `yarn test --findRelatedTests` / `yarn lint`, (5) open one small `chore(js-ts):` PR. Batches below are independent and can run in parallel **within a phase**; respect phase ordering.

| Batch | Scope | ~Files | Phase |
|---|---|---|---|
| A | `app/actions/*` | 11 | 1 |
| B | `app/constants` + `app/components/Nav` + `app/lib` + `app/images` + `app/__mocks__` | 17 | 1 |
| C | `app/reducers/*` (+ update `RootState`, Step 3) | 12(+2 test) | 2 |
| D | `app/store/migrations/*` | 28(+10 test) | 3 |
| E | `app/util/*` (excl `util/test`) | 23 | 3 |
| F | `app/util/test/*` | 8 | 3 |
| G | `app/core/*` (excl RPCMethods/Permissions) | 11 | 4 |
| H | `app/core/RPCMethods` + `app/core/Permissions` | 8 | 4 |
| I | `app/components/Base/*` | 10 | 5 |
| J–N | `app/components/UI/*` split by subfolder (e.g. Swaps as its own batch — 20 files) | 92 | 6 |
| O | `app/components/Views/*` (excl confirmations) | 38 | 7 |
| P | `app/components/Views/confirmations/legacy/*` | 33 | 7 |

## Step 3 — RootState typing

As each reducer in Batch C is converted, in `app/reducers/index.ts` replace the corresponding `any` (and delete its `eslint-disable @typescript-eslint/no-explicit-any` comment) with the exported `State` type: `legalNotices`, `collectibles`, `privacy`, `bookmarks`, `browser`, `modals`, `settings`, `alert`, `transaction`, `wizard`, `notification`, `swaps` (also `infuraAvailability`, `networkOnboarded`, `experimentalSettings`, `signatureRequest`, `rpcEvents`, `accounts`). End goal: auto-generate `RootState` via `StateFromReducersMapObject` once all reducers are valid TS.

## Step 4 — Tighten config (after migration completes)

- Re-verify the JS-additions gate is active (it currently is; note #9723 added a broader gate, #9941 reverted it).
- Consider enabling `checkJs` / removing `allowJs` in `tsconfig.json` once no `.js` remains in the compiled set.
- Consider broadening `APP_FOLDER_JS_REGEX` enforcement / adding `check-ts-app-gate` (referenced by the blueprint but currently missing).

