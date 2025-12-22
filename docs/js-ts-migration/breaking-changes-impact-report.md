# Breaking Changes Impact Report

## JavaScript to TypeScript Migration Assessment

**Generated:** December 2024  
**Repository:** metamask-mobile  
**Scope:** app/ directory

---

## Executive Summary

This report analyzes the potential breaking changes and migration challenges for converting the remaining 333 JavaScript files in the `app/` directory to TypeScript. The analysis covers PropTypes usage, implicit any patterns, null/undefined handling, and controller state typing requirements.

### Key Findings

| Metric | Count | Impact Level |
|--------|-------|--------------|
| Total JS/JSX Files | 333 | - |
| Files with PropTypes | 152 | High |
| Class Components | 79 | Medium |
| Files using Redux connect() | 74 | High |
| Files with heavy null checks | 20+ | Medium |
| Test Files | 40 | Low |

---

## 1. PropTypes Usage Analysis

### Overview

PropTypes are used extensively across 152 JavaScript files (46% of all JS files). These will need to be converted to TypeScript interfaces during migration.

### High-Impact PropTypes Files

The following files have extensive PropTypes definitions that will require careful interface design:

#### UI Components (Highest Priority)
- `app/components/UI/TransactionElement/index.js` - Complex transaction data types
- `app/components/UI/DrawerView/index.js` - Navigation and account state props
- `app/components/UI/Swaps/QuotesView.js` - Swap quote data structures
- `app/components/UI/AccountApproval/index.js` - Approval flow props
- `app/components/UI/PaymentRequest/index.js` - Payment data structures
- `app/components/UI/Tabs/index.js` - Tab navigation props
- `app/components/UI/CollectibleContracts/index.js` - NFT collection props

#### Views (High Priority)
- `app/components/Views/Browser/index.js` - Browser state and navigation
- `app/components/Views/ChoosePassword/index.js` - Authentication flow props
- `app/components/Views/Onboarding/index.js` - Onboarding state props
- `app/components/Views/confirmations/legacy/*` - Transaction confirmation props

### PropTypes to Interface Migration Pattern

```typescript
// Before (JavaScript with PropTypes)
Component.propTypes = {
  address: PropTypes.string.isRequired,
  balance: PropTypes.string,
  onPress: PropTypes.func,
  tokens: PropTypes.arrayOf(PropTypes.shape({
    symbol: PropTypes.string,
    balance: PropTypes.string
  }))
};

// After (TypeScript with Interface)
interface ComponentProps {
  address: string;
  balance?: string;
  onPress?: () => void;
  tokens?: Array<{
    symbol: string;
    balance: string;
  }>;
}
```

### Recommended Actions

1. Create shared type definitions for common prop patterns (addresses, balances, tokens)
2. Extract reusable interfaces to `app/types/` directory
3. Use existing controller types from `@metamask/*` packages where available
4. Consider using `React.ComponentProps<typeof Component>` for HOC-wrapped components

---

## 2. Implicit Any Types Analysis

### Overview

With `strict: true` enabled in `tsconfig.json`, all implicit `any` types will cause compilation errors. The ESLint rule `@typescript-eslint/no-explicit-any: 'error'` further enforces proper typing.

### High-Risk Patterns

#### 2.1 Redux mapStateToProps/mapDispatchToProps

74 files use Redux `connect()` with untyped state parameters:

```javascript
// Current pattern (implicit any)
const mapStateToProps = (state) => ({
  accounts: state.engine.backgroundState.AccountsController.internalAccounts,
  selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress
});

// Required pattern (typed)
const mapStateToProps = (state: RootState) => ({
  accounts: state.engine.backgroundState.AccountsController.internalAccounts,
  selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress
});
```

**Files requiring RootState typing:**
- `app/components/UI/DrawerView/index.js`
- `app/components/UI/AccountOverview/index.js`
- `app/components/UI/TransactionElement/index.js`
- `app/components/Nav/Main/index.js`
- `app/components/Nav/Main/RootRPCMethodsUI.js`
- All files in `app/components/Views/confirmations/legacy/`

#### 2.2 Event Handlers

Many components use untyped event handlers:

```javascript
// Current pattern
const handlePress = (event) => { ... }

// Required pattern
const handlePress = (event: GestureResponderEvent) => { ... }
```

#### 2.3 API Response Handling

Files handling external API responses often lack type definitions:

- `app/util/transactions/index.js`
- `app/util/networks/index.js`
- `app/core/NotificationManager.js`
- `app/core/BackgroundBridge/BackgroundBridge.js`

### Recommended Actions

1. Define `RootState` type based on Redux store structure
2. Create typed selectors using `createSelector` from `@reduxjs/toolkit`
3. Use React Native's built-in event types (`GestureResponderEvent`, `NativeSyntheticEvent`, etc.)
4. Define API response types based on actual response structures

---

## 3. Null/Undefined Handling Patterns

### Overview

With `strictNullChecks` enabled (part of `strict: true`), all null/undefined access patterns must be explicitly handled.

### High-Impact Files

The following files have the most null/undefined checks and will require careful migration:

| File | Null Check Count | Complexity |
|------|------------------|------------|
| `app/components/UI/Swaps/QuotesView.js` | 67 | High |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` | 54 | High |
| `app/components/UI/Navbar/index.js` | 42 | Medium |
| `app/components/UI/Swaps/index.js` | 32 | Medium |
| `app/components/UI/TransactionElement/utils.js` | 29 | Medium |
| `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` | 23 | Medium |
| `app/util/transactions/index.js` | 18 | Medium |
| `app/core/NotificationManager.js` | 17 | Medium |

### Common Patterns Requiring Updates

#### 3.1 Optional Chaining Already Used
Many files already use optional chaining (`?.`), which is TypeScript-compatible:
```javascript
const value = obj?.property?.nested;
```

#### 3.2 Explicit Null Checks
These patterns are compatible but may need type narrowing:
```javascript
if (value !== null && value !== undefined) {
  // TypeScript will narrow the type here
}
```

#### 3.3 Default Values
These patterns work well with TypeScript:
```javascript
const value = prop || defaultValue;
const value = prop ?? defaultValue; // Preferred for null/undefined
```

### Recommended Actions

1. Use nullish coalescing (`??`) instead of logical OR (`||`) where appropriate
2. Add type guards for complex object structures
3. Use non-null assertion (`!`) sparingly and only when certain
4. Consider using `Required<T>` and `Partial<T>` utility types

---

## 4. Controller State Typing Requirements

### Overview

The Engine state is strictly typed as seen in migration files like `app/store/migrations/036.ts`. The migration must maintain compatibility with these existing type definitions.

### Existing Type Patterns

From `app/store/migrations/036.ts`:

```typescript
interface Identity {
  name: string;
  address: string;
  lastSelected?: number;
  importTime?: number;
}

// State access pattern
state.engine.backgroundState.AccountsController.internalAccounts.accounts
state.engine.backgroundState.PreferencesController.selectedAddress
state.engine.backgroundState.KeyringController
```

### Controller Types to Reference

The following controller types from `@metamask/*` packages should be used:

| Controller | Package | Key Types |
|------------|---------|-----------|
| AccountsController | `@metamask/accounts-controller` | `InternalAccount` |
| KeyringController | `@metamask/keyring-controller` | `KeyringTypes` |
| PreferencesController | `@metamask/preferences-controller` | `PreferencesState` |
| TransactionController | `@metamask/transaction-controller` | `TransactionMeta` |
| NetworkController | `@metamask/network-controller` | `NetworkState` |
| TokensController | `@metamask/assets-controllers` | `Token` |

### Engine State Structure

The Engine state follows this general structure:

```typescript
interface EngineState {
  backgroundState: {
    AccountsController: AccountsControllerState;
    PreferencesController: PreferencesControllerState;
    KeyringController: KeyringControllerState;
    TransactionController: TransactionControllerState;
    NetworkController: NetworkControllerState;
    TokensController: TokensControllerState;
    // ... other controllers
  };
}
```

### Files Requiring Controller Type Updates

- `app/core/Engine/Engine.ts` (already TypeScript - reference for types)
- `app/core/BackgroundBridge/BackgroundBridge.js`
- `app/core/NotificationManager.js`
- `app/core/WalletConnect/WalletConnect.js`
- All Redux-connected components accessing `state.engine.backgroundState`

### Recommended Actions

1. Import types from `@metamask/*` packages rather than redefining
2. Use the existing `RootState` type from `app/reducers/` if available
3. Create selector functions with proper return types
4. Reference `app/core/Engine/types.ts` for Engine-specific types

---

## 5. Class Component Migration Considerations

### Overview

79 JavaScript files contain class components that extend `React.Component` or `React.PureComponent`. These require special attention for typing.

### Class Component Typing Pattern

```typescript
// Before
class MyComponent extends Component {
  state = { loading: false };
  
  render() {
    return <View>{this.props.title}</View>;
  }
}

// After
interface MyComponentProps {
  title: string;
}

interface MyComponentState {
  loading: boolean;
}

class MyComponent extends Component<MyComponentProps, MyComponentState> {
  state: MyComponentState = { loading: false };
  
  render() {
    return <View>{this.props.title}</View>;
  }
}
```

### High-Priority Class Components

- `app/components/UI/DrawerView/index.js` - Complex state management
- `app/components/UI/TransactionElement/index.js` - Transaction display
- `app/components/Views/Browser/index.js` - Browser state
- `app/components/Views/ChoosePassword/index.js` - Authentication flow
- `app/components/UI/Swaps/QuotesView.js` - Swap functionality

### Recommended Actions

1. Define separate `Props` and `State` interfaces for each class component
2. Consider converting simple class components to functional components with hooks
3. Use `React.ComponentProps` for HOC-wrapped components
4. Ensure lifecycle methods are properly typed

---

## 6. Migration Risk Assessment

### High Risk (Requires Careful Planning)

| Category | Files | Risk Factors |
|----------|-------|--------------|
| Confirmation Flow | 25+ | Complex state, multiple PropTypes, Redux integration |
| Swaps Components | 15+ | Heavy null checks, external API types |
| Core Systems | 25 | Engine integration, background bridge |
| Navigation | 5 | Deep Redux integration, complex props |

### Medium Risk (Standard Migration)

| Category | Files | Risk Factors |
|----------|-------|--------------|
| UI Components | 103 | PropTypes conversion, style typing |
| Views | 83 | Redux connect, navigation props |
| Utilities | 32 | Function signatures, return types |

### Low Risk (Quick Wins)

| Category | Files | Risk Factors |
|----------|-------|--------------|
| Mocks | 6 | Simple exports |
| Constants | 3 | Static values |
| Test Files | 40 | Can be migrated alongside source |
| Actions/Reducers | 25 | Well-defined patterns |

---

## 7. Recommendations Summary

### Immediate Actions

1. **Create shared type definitions** in `app/types/` for common patterns
2. **Define RootState type** for Redux store access
3. **Import controller types** from `@metamask/*` packages
4. **Start with leaf nodes** (files with 0-2 dependents)

### Migration Order

1. Utilities and constants (low dependency)
2. Actions and reducers (well-defined patterns)
3. Base components (foundation for UI)
4. UI components (building blocks)
5. Views (complex integration)
6. Core systems (highest complexity)

### Quality Gates

- All files must pass `yarn lint:tsc` before merge
- No `@ts-ignore` or `@ts-expect-error` without justification
- PropTypes must be fully replaced with interfaces
- Redux-connected components must use typed selectors

---

## Appendix: Files by Category

### Files with PropTypes (152 total)

See `js-files-inventory.json` for complete list with `hasPropTypes: true`.

### Class Components (79 total)

See `js-files-inventory.json` for complete list filtered by class component detection.

### Redux Connected Files (74 total)

See `js-files-inventory.json` for complete list with Redux integration markers.
