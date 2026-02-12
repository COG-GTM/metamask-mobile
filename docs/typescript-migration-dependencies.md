# TypeScript Migration - Dependency Analysis

**Date:** 2026-02-12

## Circular Dependencies

Running `yarn circular:deps` (`dpdm ./app/* --circular --exit-code circular:1 --warning=false`) identified **165 circular dependency chains** across the codebase. The command exits with code 1, confirming circular dependencies exist.

### Key Circular Dependency Clusters

The circular dependencies are concentrated in these areas:

#### 1. Engine / Network / Multichain Cycle
The most pervasive cycle involves the core Engine and network utilities:
```
app/core/Engine/Engine.ts -> app/util/networks/index.js -> app/core/Multichain/utils.ts
  -> app/util/address/index.ts -> app/selectors/networkController.ts -> app/reducers/index.ts
  -> app/core/redux/slices/engine/index.ts
```

#### 2. SDKConnect Cycle
A large cluster (chains 95-165) involves SDKConnect and its connection management:
```
app/core/SDKConnect/SDKConnect.ts -> app/core/SDKConnect/AndroidSDK/AndroidService.ts
  -> app/core/SDKConnect/utils/wait.util.ts -> app/core/SDKConnect/Connection/Connection.ts
  -> app/core/SDKConnect/Connection/EventListenersHandlers/...
```

#### 3. Reducer / Selector Cycle
Reducers import selectors and vice versa:
```
app/reducers/index.ts -> app/reducers/fiatOrders/index.ts -> app/selectors/accountsController.ts
app/reducers/index.ts -> app/reducers/swaps/index.js -> app/selectors/tokensController.ts
```

#### 4. Component Library Cycle
Type definition circular references:
```
app/component-library/components/Buttons/Button/Button.types.ts
  -> .../ButtonLink/ButtonLink.types.ts -> .../ButtonBase/ButtonBase.types.ts
```

#### 5. Store / Sagas / Engine Cycle
```
app/store/index.ts -> app/store/sagas/index.ts -> app/core/Engine/index.ts
  -> app/core/Engine/Engine.ts -> ... -> app/reducers/index.ts
```

### Files Most Frequently Involved in Circular Dependencies

- `app/core/Engine/Engine.ts` - Central engine orchestrator
- `app/util/networks/index.js` - Network utilities (still JavaScript)
- `app/core/Multichain/utils.ts` - Multichain utilities
- `app/util/address/index.ts` - Address utilities
- `app/selectors/networkController.ts` - Network selectors
- `app/reducers/index.ts` - Root reducer with extensive `any` types
- `app/core/SDKConnect/SDKConnect.ts` - SDK connection manager
- `app/store/index.ts` - Redux store configuration

## Leaf Node Files (Good Candidates for Early Conversion)

These JavaScript files have **zero imports** and can be converted independently with minimal risk:

### Mocks (`app/__mocks__/`)
- `app/__mocks__/pngMock.js`
- `app/__mocks__/react-native-device-info.js`
- `app/__mocks__/react-native-splash-screen.js`
- `app/__mocks__/react-native-view-shot.js`
- `app/__mocks__/rn-fetch-blob.js`
- `app/__mocks__/svgMock.js`

### Action Creators (Zero-Import Files)
- `app/actions/alert/index.js`
- `app/actions/bookmarks/index.js`
- `app/actions/browser/index.js`
- `app/actions/modals/index.js`
- `app/actions/privacy/index.js`
- `app/actions/settings/index.js`
- `app/actions/wizard/index.js`

### Simple Reducers (Zero-Import Files)
- `app/reducers/alert/index.js`
- `app/reducers/bookmarks/index.js`
- `app/reducers/infuraAvailability/index.js`
- `app/reducers/modals/index.js`
- `app/reducers/privacy/index.js`

### Constants and Simple Modules
- `app/constants/navigation.js`
- `app/core/InpageBridgeWeb3.js`
- `app/core/TransactionTypes.js`
- `app/lib/ens-ipfs/contracts/registry.js`
- `app/lib/ens-ipfs/contracts/resolver.js`
- `app/lib/ppom/blockaid-version.js`
- `app/lib/ppom/ppom.html.js`

### Store Migrations (Zero-Import Files)
- `app/store/migrations/000.js`
- `app/store/migrations/005.js`
- `app/store/migrations/007.js` through `app/store/migrations/017.js`

### UI Components with Minimal Dependencies
- `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` (0 imports)
- `app/components/Views/confirmations/mock-data.js` (0 imports)

## High-Risk Areas

### 1. `app/reducers/index.ts` - Root Reducer
- 14+ properties typed as `any` in the `RootState` interface (lines 56-127)
- Central to the circular dependency cluster with selectors
- Every `any` replacement here affects the entire application's type safety

### 2. `app/util/networks/index.js` - Network Utilities
- Involved in the most circular dependency chains
- JavaScript file importing from and imported by TypeScript files
- Part of the Engine -> Networks -> Multichain -> Address -> Selectors -> Reducers cycle

### 3. Complex View Components (High Import Count)
| File | Import Count |
|------|-------------|
| `app/components/Nav/Main/MainNavigator.js` | 93 |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` | 78 |
| `app/components/UI/Swaps/QuotesView.js` | 71 |
| `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` | 64 |
| `app/components/UI/DrawerView/index.js` | 58 |
| `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` | 57 |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` | 56 |

### 4. Core Engine Integration Points
- `app/core/Engine/Engine.ts` - Already TypeScript but heavily involved in circular deps
- `app/core/BackgroundBridge/BackgroundBridge.js` - DApp communication bridge (still JS)
- `app/core/RPCMethods/` - 6 JavaScript files handling RPC methods
- `app/core/SecureKeychain.js` - Security-critical keychain management
- `app/core/Permissions/` - 2 JavaScript files for permission management

### 5. Swaps Module
- `app/components/UI/Swaps/` - 14 JS files in components, 5 in utils
- `QuotesView.js` alone has 71 imports
- Tightly coupled with selectors and reducers

## Recommended Conversion Order

1. **Phase 1 - Leaf Nodes** (zero/minimal imports): Mocks, action creators, simple reducers, constants, store migrations
2. **Phase 2 - Utilities**: `app/util/` files starting with those not involved in circular deps
3. **Phase 3 - Component Library**: Resolve type-level circular deps in Button/Banner types
4. **Phase 4 - Reducers/Selectors**: Type the `RootState` properly, replace `any` types
5. **Phase 5 - Core**: `app/util/networks/index.js`, BackgroundBridge, RPCMethods
6. **Phase 6 - Complex Views**: MainNavigator, SendFlow, Swaps (highest risk, most dependencies)
