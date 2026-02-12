# TypeScript Migration Guide

**Date:** 2026-02-12

## Conversion Checklist

For each file being converted from JavaScript to TypeScript:

- [ ] Rename `.js` to `.ts` or `.jsx` to `.tsx`
- [ ] Add explicit return types to all exported functions
- [ ] Type all function parameters (no implicit `any`)
- [ ] Replace `any` with proper types (see patterns below)
- [ ] Add interfaces for component props and state
- [ ] Update imports to use typed versions where available
- [ ] Run `yarn lint:tsc` and fix all errors
- [ ] Run `yarn test:unit` to verify tests still pass
- [ ] Ensure no new `eslint-disable @typescript-eslint/no-explicit-any` comments are added
- [ ] Verify the fitness function still passes (no new `.js`/`.jsx` files created)

## PR Naming Convention

All conversion PRs should follow this pattern:

```
chore(js-ts): Convert [file path] to TypeScript
```

Examples from the changelog:
- `chore(js-ts): Convert app/components/Views/AndroidBackHandler/index.js to TypeScript`
- `chore(js-ts): Convert app/util/transaction-reducer-helpers.js to TypeScript`
- `chore(js-ts): Convert app/components/Base/HorizontalSelector/index.js to TypeScript`
- `chore(js-ts): Convert app/components/UI/Fox/index.js to TypeScript`
- `chore(js-ts): Convert app/components/UI/StyledButton/styledButtonStyles.js to TypeScript`
- `chore(js-ts): Convert app/util/test/ganache-contract-address-registry.js to TypeScript`

## Common Patterns

### 1. Redux Reducers

The root state in `app/reducers/index.ts` currently has many `any`-typed properties. When converting a reducer:

**Before (JavaScript):**
```js
const initialState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

const alertReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return { ...state, ...action.payload };
    case 'HIDE_ALERT':
      return initialState;
    default:
      return state;
  }
};

export default alertReducer;
```

**After (TypeScript):**
```typescript
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

const initialState: AlertState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  payload: Partial<AlertState>;
}

interface HideAlertAction {
  type: 'HIDE_ALERT';
}

type AlertAction = ShowAlertAction | HideAlertAction;

const alertReducer = (
  state: AlertState = initialState,
  action: AlertAction,
): AlertState => {
  switch (action.type) {
    case 'SHOW_ALERT':
      return { ...state, ...action.payload };
    case 'HIDE_ALERT':
      return initialState;
    default:
      return state;
  }
};

export default alertReducer;
```

After converting a reducer, update the corresponding property in `RootState` (in `app/reducers/index.ts`) to use the exported state type instead of `any`.

### 2. React Components

**Before (JSX):**
```jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const MyComponent = ({ title, onPress, isEnabled }) => (
  <View>
    <TouchableOpacity onPress={onPress} disabled={!isEnabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  </View>
);

export default MyComponent;
```

**After (TSX):**
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, GestureResponderEvent } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  isEnabled: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress, isEnabled }) => (
  <View>
    <TouchableOpacity onPress={onPress} disabled={!isEnabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  </View>
);

export default MyComponent;
```

### 3. Type Predicates and Type Guards

Reference: `app/selectors/featureFlagController/confirmations/index.ts` demonstrates proper use of type predicates:

```typescript
import { Json, hasProperty, isObject } from '@metamask/utils';

export type ConfirmationRedesignRemoteFlags = {
  signatures: boolean;
  staking_confirmations: boolean;
  contract_interaction: boolean;
  transfer: boolean;
};

const isRemoteFeatureFlagValuesValid = (
  obj: Json,
): obj is ConfirmationRedesignRemoteFlags =>
  isObject(obj) &&
  hasProperty(obj, 'signatures') &&
  hasProperty(obj, 'staking_confirmations') &&
  hasProperty(obj, 'contract_interaction');
```

Use `@metamask/utils` helpers (`isObject`, `hasProperty`) for runtime type narrowing instead of type assertions.

### 4. Utility Functions

**Before (JavaScript):**
```js
export const formatBalance = (balance, decimals) => {
  if (!balance) return '0';
  const divisor = Math.pow(10, decimals);
  return (balance / divisor).toFixed(4);
};
```

**After (TypeScript):**
```typescript
export const formatBalance = (balance: number | null, decimals: number): string => {
  if (!balance) return '0';
  const divisor = Math.pow(10, decimals);
  return (balance / divisor).toFixed(4);
};
```

### 5. Action Creators

**Before (JavaScript):**
```js
export const showAlert = (config) => ({
  type: 'SHOW_ALERT',
  config,
});
```

**After (TypeScript):**
```typescript
interface AlertConfig {
  isVisible: boolean;
  autodismiss: number;
  content: string;
}

export const showAlert = (config: AlertConfig) => ({
  type: 'SHOW_ALERT' as const,
  config,
});
```

Use `as const` for action type strings to enable discriminated unions.

### 6. Test Files

When converting test files, type the mock data and test utilities:

```typescript
import { renderScreen } from '../../../util/test/renderWithProvider';

interface MockState {
  engine: {
    backgroundState: Record<string, unknown>;
  };
}

const mockInitialState: MockState = {
  engine: {
    backgroundState: {},
  },
};
```

## Key Rules

1. **No new `any` types**: The ESLint rule `@typescript-eslint/no-explicit-any` is set to `error`. Use `unknown`, generics, or specific types instead.

2. **No new `.js`/`.jsx` files**: The fitness function at `.github/scripts/fitness-functions/rules/javascript-additions.test.ts` prevents new JavaScript files from being added to the `app/` directory.

3. **Strict mode is enabled**: `tsconfig.json` has `"strict": true`, which enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, and other strict checks.

4. **Use `Record<string, unknown>` instead of `any` for objects**: When the shape is not known, prefer `unknown` over `any`.

5. **Export state types from reducers**: Each reducer should export its state interface so it can be used in `RootState`.

## Reference PRs

These PRs from the changelog demonstrate successful conversions:

- [#11546](https://github.com/MetaMask/metamask-mobile/pull/11546): Convert `app/components/Views/AndroidBackHandler/index.js` - Simple view component
- [#11629](https://github.com/MetaMask/metamask-mobile/pull/11629): Convert `app/util/transaction-reducer-helpers.js` - Utility functions
- [#11661](https://github.com/MetaMask/metamask-mobile/pull/11661): Convert `app/components/Base/HorizontalSelector/index.js` - Base component
- [#11650](https://github.com/MetaMask/metamask-mobile/pull/11650): Convert `app/components/UI/Swaps/components/InfoModal.js` - UI component
- [#11406](https://github.com/MetaMask/metamask-mobile/pull/11406): Convert `app/util/test/ganache-contract-address-registry.js` - Test utility
- [#11556](https://github.com/MetaMask/metamask-mobile/pull/11556): Convert `app/components/UI/Fox/index.js` - UI component
- [#11525](https://github.com/MetaMask/metamask-mobile/pull/11525): Convert `app/components/UI/StyledButton/styledButtonStyles.js` - Style definitions

## Project Tracking

The TypeScript migration is tracked on the project board at: https://cog-gtm.atlassian.net/jira/software/projects/PRIYA/boards/397
