# JS → TS Migration: Parallel Devin Session Prompts

> **Purpose**: Each section below is a standalone prompt that can be handed to an independent Devin session. Sessions within the same wave have no dependencies on each other and can run simultaneously. See the [Parallelism Guide](#parallelism-guide) at the bottom for execution order.

---

## Global Instructions

**Include these rules in every session. They apply to ALL prompts below.**

1. **Repository**: `COG-GTM/metamask-mobile`
2. **Do NOT use `any`** — The project enforces `@typescript-eslint/no-explicit-any: 'error'` in `.eslintrc.js` (line 37). All types must be explicit.
3. **Follow existing TS patterns** — Look at neighboring `.ts`/`.tsx` files in the same directory for conventions (e.g., `app/reducers/security/index.ts` for reducer patterns).
4. **For each file**: Rename `.js` → `.ts` (or `.jsx` → `.tsx` if it contains JSX), add type annotations for function parameters, return types, and variables. Replace `PropTypes` with TypeScript `interface`/`type` for React component props.
5. **Update corresponding test files** — If a `.test.js` or `.test.jsx` file exists for the converted file, convert it too.
6. **Ensure the build passes** — Run `yarn tsc --noEmit` to verify no type errors are introduced.
7. **Ensure lint passes** — Run `yarn lint` on changed files.
8. **Each session should create a single PR** with a clear title like `chore: migrate [category] from JS to TS`.

---

## Session Prompts

---

### Session 1: Constants (`app/constants/`)

**Files to convert (3 files)**:
- `app/constants/navigation.js`
- `app/constants/network.js`
- `app/constants/onboarding.js`

**Instructions**:

Rename each file from `.js` to `.ts`. Add explicit type annotations to all exported constants, enums, and objects. Use `as const` assertions where appropriate for string literal types. These files have no internal dependencies — they are leaf nodes.

Check that all importers across the codebase still resolve correctly after renaming. Reference `app/constants/urls.ts` and `app/constants/bridge.ts` for conventions.

Create a PR titled `chore: migrate app/constants from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn lint
```

---

### Session 2: Redux Actions (`app/actions/`)

**Files to convert (11 files)**:
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

**Instructions**:

For each action file, rename to `.ts`. Follow the pattern in `app/actions/onboarding/index.ts` (already migrated).

For each file:
1. Define action type string constants with `as const`:
   ```typescript
   export const SHOW_ALERT = 'SHOW_ALERT' as const;
   ```
2. Define typed action creator functions with explicit parameter types and return types.
3. Define a discriminated union `Action` type for all actions in the module and export it.

Convert associated test files too (rename `.test.js` → `.test.ts`).

Create a PR titled `chore: migrate app/actions from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/actions/alert/index.ts app/actions/bookmarks/index.ts app/actions/browser/index.ts app/actions/collectibles/index.ts app/actions/infuraAvailability/index.ts app/actions/modals/index.ts app/actions/notification/index.ts app/actions/privacy/index.ts app/actions/settings/index.ts app/actions/transaction/index.ts app/actions/wizard/index.ts
yarn lint
```

---

### Session 3: Redux Reducers (`app/reducers/`)

**Files to convert (12 files)**:
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

**Instructions**:

For each reducer, rename to `.ts`. Use `app/reducers/security/index.ts` as the reference pattern.

For each file:
1. Define a `State` interface matching the `initialState` shape.
2. Type the action parameter (import the `Action` union from the corresponding action module if already converted; otherwise define local action types that can be reconciled later).
3. Type the reducer function signature: `(state: State, action: Action): State`.
4. Export the `State` interface for use by selectors and `RootState`.

Convert associated test files (e.g., `browser/index.test.js`, `notification/notification.test.js`). Rename `.test.js` → `.test.ts`.

**Note**: This session can run in parallel with Session 2 (actions). If the actions haven't been converted yet, define local action types in the reducer files that can be reconciled later.

Create a PR titled `chore: migrate app/reducers from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/reducers/alert/index.ts app/reducers/bookmarks/index.ts app/reducers/browser/index.ts app/reducers/collectibles/index.ts app/reducers/infuraAvailability/index.ts app/reducers/modals/index.ts app/reducers/notification/index.ts app/reducers/privacy/index.ts app/reducers/settings/index.ts app/reducers/swaps/index.ts app/reducers/transaction/index.ts app/reducers/wizard/index.ts
yarn lint
```

---

### Session 4: Utilities — Group A (`app/util/` — data/conversion utilities)

**Files to convert (~10 files)**:
- `app/util/networks/index.js`
- `app/util/transactions/index.js`
- `app/util/conversion/index.js`
- `app/util/number/index.js`
- `app/util/custom-gas/index.js`
- `app/util/date/index.js`
- `app/util/conversions.js`
- `app/util/gasUtils.js`
- `app/util/confirm-tx.js`
- `app/util/etherscan.js`

**Instructions**:

Rename each to `.ts`. Add parameter and return types to all exported functions. For complex objects (network configs, transaction objects), define interfaces. For BN.js usage in `conversions.js` and `gasUtils.js`, import the `BN` type from `bn.js`.

These utility files are heavily imported across the codebase — focus on getting the exported API types right. Reference `app/util/string/index.ts` and `app/util/mnemonic/index.ts` (already migrated) for conventions.

Convert associated test files (rename `.test.js` → `.test.ts`).

Create a PR titled `chore: migrate app/util data utilities from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/util/networks/index.ts app/util/transactions/index.ts app/util/conversion/index.ts app/util/number/index.ts app/util/custom-gas/index.ts app/util/date/index.ts app/util/conversions.ts app/util/gasUtils.ts app/util/confirm-tx.ts app/util/etherscan.ts
yarn lint
```

---

### Session 5: Utilities — Group B (`app/util/` — general/device/ENS/misc utilities)

**Files to convert (~13 files)**:
- `app/util/general/index.js`
- `app/util/device/index.js`
- `app/util/ENSUtils.js`
- `app/util/blockies.js`
- `app/util/dapp-url-list.js`
- `app/util/middlewares.js`
- `app/util/payment-link-generator.js`
- `app/util/scaling.js`
- `app/util/streams.js`
- `app/util/walletconnect.js`
- `app/util/confusables/index.js`
- `app/util/sentry/utils.js`
- `app/util/confirmation/signatureUtils.js`

**Instructions**:

Same approach as Session 4. Rename to `.ts`, add parameter/return types to all exported functions.

For `device/index.js`, type platform-specific branching using `Platform.OS` literal types. For `streams.js`, type the Duplex stream interfaces.

Convert associated test files. Reference `app/util/string/index.ts` and `app/util/mnemonic/index.ts` for conventions.

Create a PR titled `chore: migrate app/util general utilities from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/util/general/index.ts app/util/device/index.ts app/util/ENSUtils.ts app/util/blockies.ts app/util/dapp-url-list.ts app/util/middlewares.ts app/util/payment-link-generator.ts app/util/scaling.ts app/util/streams.ts app/util/walletconnect.ts app/util/confusables/index.ts app/util/sentry/utils.ts app/util/confirmation/signatureUtils.ts
yarn lint
```

---

### Session 6: Core Services — Group A (`app/core/` — standalone services)

**Files to convert (9 files)**:
- `app/core/TransactionTypes.js`
- `app/core/DrawerStatusTracker.js`
- `app/core/ClipboardManager.js`
- `app/core/PreventScreenshot.js`
- `app/core/MobilePortStream.js`
- `app/core/EntryScriptWeb3.js`
- `app/core/SecureKeychain.js`
- `app/core/Vault.js`
- `app/core/NotificationManager.js`

**Instructions**:

Rename each to `.ts`. Start with the simplest files and work toward the most complex.

Reference `app/core/Authentication/Authentication.ts` and `app/core/Encryptor/Encryptor.ts` for conventions.

Specific guidance by file:
- **`TransactionTypes.js`**: Pure constants — add `as const` and type annotations.
- **`DrawerStatusTracker.js`**: Simple state module — type the state object and exported functions.
- **`ClipboardManager.js`**: Type the module object with explicit method signatures. Import `Clipboard` types from `@react-native-clipboard/clipboard`.
- **`PreventScreenshot.js`**: Create a type declaration for `NativeModules.PreventScreenshot` since no published types exist. Use `declare module` or inline type assertion.
- **`MobilePortStream.js`**: Use `Duplex` from `stream` module, type the port interface.
- **`EntryScriptWeb3.js`**: Type the async loading pattern and return types.
- **`SecureKeychain.js`**: Pay special attention to typing crypto/keychain-related APIs. Type `encryptPassword`/`decryptPassword` return types as `Promise<string>`, type the singleton pattern.
- **`Vault.js`**: Import `KeyringController` types from `@metamask/keyring-controller`.
- **`NotificationManager.js`**: Type the singleton, type notification payload interfaces.

Convert associated test files (e.g., `BackgroundBridge.test.js` → `.test.ts`). Existing TS tests (`SecureKeychain.test.ts`, `Vault.test.ts`, `NotificationsManager.test.ts`) should pass without changes after source migration.

Create a PR titled `chore: migrate app/core standalone services from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/core/TransactionTypes.ts app/core/DrawerStatusTracker.ts app/core/ClipboardManager.ts app/core/PreventScreenshot.ts app/core/MobilePortStream.ts app/core/EntryScriptWeb3.ts app/core/SecureKeychain.ts app/core/Vault.ts app/core/NotificationManager.ts
yarn lint
```

---

### Session 7: Core Services — Group B (`app/core/` — complex modules)

**Files to convert (~10 files)**:
- `app/core/BackgroundBridge/BackgroundBridge.js`
- `app/core/WalletConnect/WalletConnect.js`
- `app/core/Permissions/specifications.js`
- `app/core/RPCMethods/index.js`
- `app/core/RPCMethods/eth-request-accounts.js`
- `app/core/RPCMethods/wallet_addEthereumChain.js`
- `app/core/RPCMethods/wallet_switchEthereumChain.js`
- `app/core/RPCMethods/handlers/index.js`
- `app/core/RPCMethods/lib/ethereum-chain-utils.js`
- `app/core/RPCMethods/createEip1193MethodMiddleware/index.js`

**Instructions**:

These are the most complex files in the migration. Rename to `.ts`.

Reference `app/core/RPCMethods/RPCMethodMiddleware.ts` (already migrated) for RPC handler patterns, and `app/core/RPCMethods/eth-request-accounts.test.ts` for how to type RPC test fixtures.

Specific guidance:
- **RPC Methods**: Import JSON-RPC types from `@metamask/utils` (`JsonRpcRequest`, `PendingJsonRpcResponse`, `JsonRpcParams`). For each handler, define a `Hooks` interface listing the hook functions it receives.
- **`specifications.js`**: Type caveat/permission specs using types from `@metamask/permission-controller`.
- **`BackgroundBridge.js`**: Define a `BackgroundBridgeParams` interface for the constructor. Type the middleware stack using `@metamask/json-rpc-engine` types. Type EventEmitter events.
- **`WalletConnect.js`**: Define WalletConnect session types.
- **IMPORTANT**: Preserve `///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)` preprocessor directives exactly as-is.

Convert associated test files:
- `wallet_addEthereumChain.test.js` → `.test.ts`
- `wallet_switchEthereumChain.test.js` → `.test.ts`
- `createEip1193MethodMiddleware/index.test.js` → `.test.ts`
- `BackgroundBridge.test.js` → `.test.ts`

Create a PR titled `chore: migrate app/core complex modules from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/core/BackgroundBridge/BackgroundBridge.ts app/core/WalletConnect/WalletConnect.ts app/core/Permissions/specifications.ts app/core/RPCMethods/index.ts app/core/RPCMethods/eth-request-accounts.ts app/core/RPCMethods/wallet_addEthereumChain.ts app/core/RPCMethods/wallet_switchEthereumChain.ts app/core/RPCMethods/handlers/index.ts app/core/RPCMethods/lib/ethereum-chain-utils.ts app/core/RPCMethods/createEip1193MethodMiddleware/index.ts
yarn lint
```

---

### Session 8: Store Migrations (`app/store/migrations/`)

**Files to convert (28 source files + 9 test files)**:

Source files:
- `app/store/migrations/000.js` through `app/store/migrations/027.js`

Test files:
- `app/store/migrations/019.test.js` through `app/store/migrations/027.test.js`

**Instructions**:

Rename each from `.js` to `.ts`. Each migration is a self-contained function that transforms a state object.

Use `app/store/migrations/028.ts` (and later numbered TS migrations) as the reference pattern. They use `hasProperty`, `isObject` from `@metamask/utils` and `captureException` from `@sentry/react-native`.

For each migration:
1. Type the function signature:
   ```typescript
   export default function migrate(state: unknown): Record<string, unknown>
   ```
2. Use `@metamask/utils` type guards (`isObject`, `hasProperty`) for runtime type narrowing.
3. For early migrations (000–018) that access `state.engine.backgroundState.*` directly, add type narrowing guards or use type assertions with comments explaining the expected shape.

For test files (019–027):
- Rename `.test.js` → `.test.ts`
- Add `jest.mocked()` typing to mock factories
- Tests mock `@sentry/react-native`, `redux-persist-filesystem-storage`, `@metamask/utils`

Run `app/store/migrations/index.test.ts` for full pipeline validation.

Create a PR titled `chore: migrate store migrations 000-027 from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests app/store/migrations/000.ts app/store/migrations/001.ts app/store/migrations/002.ts app/store/migrations/003.ts app/store/migrations/004.ts app/store/migrations/005.ts app/store/migrations/006.ts app/store/migrations/007.ts app/store/migrations/008.ts app/store/migrations/009.ts app/store/migrations/010.ts app/store/migrations/011.ts app/store/migrations/012.ts app/store/migrations/013.ts app/store/migrations/014.ts app/store/migrations/015.ts app/store/migrations/016.ts app/store/migrations/017.ts app/store/migrations/018.ts app/store/migrations/019.ts app/store/migrations/020.ts app/store/migrations/021.ts app/store/migrations/022.ts app/store/migrations/023.ts app/store/migrations/024.ts app/store/migrations/025.ts app/store/migrations/026.ts app/store/migrations/027.ts
yarn lint
```

---

### Session 9: UI Components — Leaf components batch 1 (`app/components/UI/` A–L)

**Files to convert (~50 files)**:

All `.js`/`.jsx` files in `app/components/UI/` directories whose component name starts with A through L alphabetically. This includes (but is not limited to):
- `app/components/UI/AddCustomToken/index.js`
- `app/components/UI/AddressInputs/index.js` (+ `index.test.jsx`)
- `app/components/UI/AnimatedTransactionModal/index.js`
- `app/components/UI/AssetList/index.js`
- `app/components/UI/BrowserBottomBar/index.js`
- `app/components/UI/CollectibleContractOverview/index.js`
- `app/components/UI/CollectibleOverview/index.js`
- `app/components/UI/Confetti/index.js`
- `app/components/UI/CustomAlert/index.js`
- `app/components/UI/HintModal/index.js`

Run `find app/components/UI -name "*.js" -o -name "*.jsx"` and filter for components starting A–L to get the full list.

**Instructions**:

For each component:
1. Rename `.jsx` → `.tsx` (or `.js` → `.tsx` if it contains JSX).
2. Replace `PropTypes` with a TypeScript `Props` interface:

   | PropTypes | TypeScript |
   |-----------|------------|
   | `PropTypes.string` | `string` |
   | `PropTypes.number` | `number` |
   | `PropTypes.func` | `() => void` (or more specific signature) |
   | `PropTypes.bool` | `boolean` |
   | `PropTypes.node` | `React.ReactNode` |
   | `PropTypes.element` | `React.ReactElement` |
   | `PropTypes.arrayOf(PropTypes.string)` | `string[]` |
   | `PropTypes.shape({...})` | named interface |
   | `.isRequired` | non-optional prop; otherwise add `?` |

3. Type `StyleSheet.create()` — either let TS infer or use explicit style types.
4. Convert component to typed function: `const Component = ({ prop1, prop2 }: Props) => ...`
5. Remove `import PropTypes from 'prop-types'`.
6. Type refs: `useRef<View>(null)`, `useRef<TextInput>(null)`, etc.

Reference any component in `app/component-library/components/` for conventions (`Component.tsx`, `Component.types.ts`, `Component.styles.ts`).

Convert associated test/story files. **Snapshot tests should produce identical output** — if snapshots change, something broke.

Create a PR titled `chore: migrate app/components/UI (A-L) from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests <converted-files>
yarn lint
```

---

### Session 10: UI Components — Leaf components batch 2 (`app/components/UI/` M–Z)

**Files to convert (~50 files)**:

All `.js`/`.jsx` files in `app/components/UI/` directories whose component name starts with M through Z alphabetically. This includes (but is not limited to):
- `app/components/UI/ManageNetworks/ManageNetworks.test.js`
- `app/components/UI/Navbar/index.js` (+ `index.test.jsx`)
- `app/components/UI/NavbarBrowserTitle/index.js`
- `app/components/UI/NetworkMainAssetLogo/index.js`
- `app/components/UI/Notification/**/*.js`
- `app/components/UI/OnboardingWizard/Coachmark/index.js`
- `app/components/UI/PaymentRequestSuccess/index.js`
- `app/components/UI/ProtectYourWalletModal/index.js`
- `app/components/UI/ReceiveRequest/index.js`
- `app/components/UI/SeedphraseModal/index.js`
- `app/components/UI/SkipAccountSecurityModal/index.js`
- `app/components/UI/SliderButton/index.js`
- `app/components/UI/SlippageSlider/index.js`
- `app/components/UI/Swaps/**/*.js`
- `app/components/UI/TimeEstimateInfoModal/index.js`
- `app/components/UI/TokenImage/index.js`
- `app/components/UI/TransactionActionModal/**/*.js`
- `app/components/UI/TransactionHeader/index.js`
- `app/components/UI/Transactions/index.js`
- `app/components/UI/WarningExistingUserModal/index.js`
- `app/components/UI/WebviewProgressBar/index.js`

Run `find app/components/UI -name "*.js" -o -name "*.jsx"` and filter for components starting M–Z to get the full list.

**Instructions**:

Same approach as Session 9. For `connect()`-based components (e.g., Navbar, Notification, Swaps, Transactions), define three interfaces:
```typescript
interface OwnProps { /* props passed by parent */ }
interface StateProps { /* props from mapStateToProps */ }
interface DispatchProps { /* props from mapDispatchToProps */ }
type Props = OwnProps & StateProps & DispatchProps;
```

Type `mapStateToProps` as `(state: RootState): StateProps => ({...})`.

**Keep `connect()` rather than converting to hooks** — minimize behavioral changes during migration.

Reference `app/components/UI/ManageNetworks/ManageNetworks.tsx` and `app/components/UI/Tokens/index.tsx` for connected component conventions.

Create a PR titled `chore: migrate app/components/UI (M-Z) from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests <converted-files>
yarn lint
```

---

### Session 11: View Components — batch 1 (`app/components/Views/` — first half)

**Files to convert (~40 files)**:

All `.js`/`.jsx` files in `app/components/Views/` directories, first half alphabetically. This includes (but is not limited to):
- `app/components/Views/AddBookmark/index.js`
- `app/components/Views/AddressQRCode/index.js`
- `app/components/Views/Asset/index.js` (+ `index.test.js`)
- `app/components/Views/CollectibleView/index.js`
- `app/components/Views/Collectible/index.js`
- `app/components/Views/EnterPasswordSimple/index.js`
- `app/components/Views/GasEducationCarousel/index.js`
- `app/components/Views/ImportFromSecretRecoveryPhrase/index.js`
- `app/components/Views/ImportPrivateKeySuccess/index.js`
- `app/components/Views/ManualBackupStep1/index.js`
- `app/components/Views/ManualBackupStep3/index.js`
- `app/components/Views/Settings/AdvancedSettings/index.js`
- `app/components/Views/Settings/AppInformation/index.js`
- `app/components/Views/Settings/Contacts/index.js`
- `app/components/Views/Settings/Contacts/ContactForm/index.js`
- `app/components/Views/Settings/GeneralSettings/index.js`
- `app/components/Views/Settings/NetworksSettings/index.js`
- `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js`
- `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js`

Run `find app/components/Views -name "*.js" -o -name "*.jsx"` and take the first half alphabetically.

**Instructions**:

Same component migration approach as Sessions 9/10. These are page-level components and may have more complex props/state.

For class components, define `Props` and `State` interfaces:
```typescript
class MyView extends Component<Props, State> { ... }
```

Type navigation params:
```typescript
type RouteParams = { address: string; ... }
```

Reference `app/components/Views/Wallet/index.tsx` and `app/components/Views/Login/index.tsx` for conventions.

Create a PR titled `chore: migrate app/components/Views (batch 1) from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests <converted-files>
yarn lint
```

---

### Session 12: View Components — batch 2 (`app/components/Views/` — second half)

**Files to convert (~40 files)**:

All `.js`/`.jsx` files in `app/components/Views/` directories, second half alphabetically. This includes (but is not limited to):
- `app/components/Views/OnboardingSuccess/index.test.js`
- `app/components/Views/TermsAndConditions/index.js`
- `app/components/Views/TransactionSummary/index.js`
- `app/components/Views/TransactionsView/index.js`
- `app/components/Views/confirmations/legacy/Approval/index.js`
- `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js`
- `app/components/Views/confirmations/legacy/Approve/index.js`
- `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js`
- `app/components/Views/confirmations/legacy/Send/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx`
- `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx`
- `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js`
- `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js`
- `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js`
- `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` (+ `index.test.jsx`)
- `app/components/Views/confirmations/legacy/components/CustomNonce/index.js`
- `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx`
- `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx`
- `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js`
- `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` (+ `index.test.jsx`)
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` (+ `index.test.js`)
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` (+ `index.test.jsx`)
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js`
- `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js`
- `app/components/Views/confirmations/legacy/components/TypedSign/index.js`
- `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx`
- `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js`

Run `find app/components/Views -name "*.js" -o -name "*.jsx"` and take the second half.

**Instructions**:

Same approach as Session 11. For legacy confirmation components additionally:
- Type transaction objects using `TransactionMeta` from `@metamask/transaction-controller`.
- Type approval request objects.
- Be careful with `SendFlow` components which pass complex state between screens via navigation params.

Create a PR titled `chore: migrate app/components/Views (batch 2) from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test --findRelatedTests <converted-files>
yarn lint
```

---

### Session 13: Remaining Components & Misc (`app/components/` — other subdirectories + misc files)

**Files to convert (~15 files)**:

Any remaining `.js`/`.jsx` files in `app/components/` not covered by Sessions 9-12, plus miscellaneous files:

**Navigation**:
- `app/components/Nav/Main/MainNavigator.js`
- `app/components/Nav/Main/index.js`
- `app/components/Nav/Main/RootRPCMethodsUI.js`

**Lib/ENS**:
- `app/lib/ens-ipfs/contracts/registry.js`
- `app/lib/ens-ipfs/contracts/resolver.js`
- `app/lib/ens-ipfs/resolver.js`

**Mocks**:
- `app/__mocks__/pngMock.js`
- `app/__mocks__/react-native-splash-screen.js`
- `app/__mocks__/svgMock.js`
- `app/__mocks__/rn-fetch-blob.js`
- `app/__mocks__/react-native-view-shot.js`
- `app/__mocks__/react-native-device-info.js`

**Other**:
- `app/images/image-icons.js`
- `app/lib/ppom/blockaid-version.js`

Run `find app/components -name "*.js" -o -name "*.jsx" | grep -v "/UI/" | grep -v "/Views/"` to find any additional files.

**Instructions**:

- **Navigation**: Rename `.js` → `.tsx`, define `RootStackParamList` type for the navigation tree, type `createStackNavigator<ParamList>()`. Reference existing TS navigation files in the same directory.
- **Lib/ENS**: Rename `.js` → `.ts`, type contract ABI interfaces, type resolver function params/returns.
- **Mocks**: Rename `.js` → `.ts`, type mock implementations to match the modules they mock. Be careful — wrong mock types will cause test failures across the entire suite.
- **Other**: Rename `.js` → `.ts`, add appropriate types.

Create a PR titled `chore: migrate remaining app/components and misc files from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn test  # Run full test suite since mock changes affect everything
yarn lint
```

---

### Session 14: E2E Tests (`e2e/`)

**Files to convert (~356 files)**:

All `.js` files in the `e2e/` directory.

Run `find e2e -name "*.js"` to get the full list.

**Instructions**:

Rename all `.js` files to `.ts`. Add types for page objects, test helpers, and assertion utilities. These files use Detox APIs — use `@types/detox` for typing.

For page objects, define interfaces for element selectors and interaction methods. For test helpers, type the utility functions used across tests.

Create a PR titled `chore: migrate e2e tests from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn lint
```

---

### Session 15: WDIO Tests (`wdio/`)

**Files to convert (~124 files)**:

All `.js` files in the `wdio/` directory.

Run `find wdio -name "*.js"` to get the full list.

**Instructions**:

Rename all `.js` files to `.ts`. Add types for WebDriverIO page objects and test utilities. Use `@wdio/types` for typing.

For page objects, define interfaces for element selectors. For test specs, type the test data and configuration objects.

Create a PR titled `chore: migrate wdio tests from JS to TS`.

**Validation**:
```bash
yarn tsc --noEmit
yarn lint
```

---

### Final Session: Disable `allowJs` (run LAST after ALL other PRs merge)

**Files to modify**:
- `tsconfig.json` — Set `"allowJs": false`
- `.github/scripts/fitness-functions/rules/javascript-additions.ts` — Remove or disable the `preventJavaScriptFileAdditions` rule since it's no longer needed
- `.github/scripts/fitness-functions/rules/index.ts` — Remove the JS additions rule entry (lines 10-14)

**Instructions**:

This session runs **LAST** after all other PRs have merged.

1. Verify zero `.js`/`.jsx` files remain in `app/`:
   ```bash
   find app -name "*.js" -o -name "*.jsx" | wc -l
   # Should output 0
   ```
2. Set `"allowJs": false` in `tsconfig.json` (line 9).
3. Remove the `preventJavaScriptFileAdditions` rule from `.github/scripts/fitness-functions/rules/index.ts`:
   - Remove the import of `preventJavaScriptFileAdditions`
   - Remove the rule object `{ name: 'Check for js or jsx file being added', fn: preventJavaScriptFileAdditions, ... }`
   - Remove the re-export of `preventJavaScriptFileAdditions`
4. Delete or empty `.github/scripts/fitness-functions/rules/javascript-additions.ts` if no other code depends on it.
5. Run full build and test suite to confirm everything passes.

Create a PR titled `chore: disable allowJs, complete TS migration`.

**Validation**:
```bash
find app -name "*.js" -o -name "*.jsx" | wc -l  # Must be 0
yarn tsc --noEmit
yarn test
yarn lint
```

---

## Parallelism Guide

Sessions are organized into waves. All sessions within a wave can run as **parallel Devin sessions** simultaneously. Wait for each wave's PRs to merge before starting the next wave (except Wave 5, which is independent).

```
┌─────────────────────────────────────────────────────────────────┐
│ Wave 1 (no dependencies — start immediately)                    │
│   Session 1:  Constants (3 files)                               │
│   Session 8:  Store Migrations (28+9 files)                     │
├─────────────────────────────────────────────────────────────────┤
│ Wave 2 (after Wave 1 merges)                                    │
│   Session 2:  Redux Actions (11 files)                          │
│   Session 3:  Redux Reducers (12 files)                         │
│   Session 4:  Utilities — Group A (10 files)                    │
│   Session 5:  Utilities — Group B (13 files)                    │
├─────────────────────────────────────────────────────────────────┤
│ Wave 3 (after Wave 2 merges)                                    │
│   Session 6:  Core Services — Group A (9 files)                 │
│   Session 7:  Core Services — Group B (10 files)                │
├─────────────────────────────────────────────────────────────────┤
│ Wave 4 (after Wave 3 merges)                                    │
│   Session 9:  UI Components A–L (~50 files)                     │
│   Session 10: UI Components M–Z (~50 files)                     │
│   Session 11: View Components batch 1 (~40 files)               │
│   Session 12: View Components batch 2 (~40 files)               │
│   Session 13: Remaining Components & Misc (~15 files)           │
├─────────────────────────────────────────────────────────────────┤
│ Wave 5 (independent — can run anytime)                          │
│   Session 14: E2E Tests (~356 files)                            │
│   Session 15: WDIO Tests (~124 files)                           │
├─────────────────────────────────────────────────────────────────┤
│ Wave 6 (after ALL other PRs merge)                              │
│   Final Session: Disable allowJs                                │
└─────────────────────────────────────────────────────────────────┘
```

### Summary

| Wave | Sessions | Total Files | Can Start After |
|------|----------|-------------|-----------------|
| 1 | 1, 8 | ~40 | Immediately |
| 2 | 2, 3, 4, 5 | ~46 | Wave 1 merged |
| 3 | 6, 7 | ~19 | Wave 2 merged |
| 4 | 9, 10, 11, 12, 13 | ~195 | Wave 3 merged |
| 5 | 14, 15 | ~480 | Anytime |
| 6 | Final | ~3 | All others merged |
