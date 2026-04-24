# TypeScript Migration Guide

This document defines the conventions and patterns to follow when migrating `.js`/`.jsx` files to `.ts`/`.tsx` in the MetaMask Mobile codebase.

## File Naming

- `.ts` for logic-only modules (utilities, constants, Redux, services).
- `.tsx` for any file containing JSX (React components).
- Platform-specific files: `index.android.ts` / `index.ios.ts` (or `.tsx` if JSX).

## Type Declaration Conventions

### Prefer `interface` over `type` for object shapes

```typescript
// Good
interface AccountActionsProps {
  address: string;
  onClose: () => void;
}

// Avoid for object shapes (use type only for unions, intersections, mapped types)
type AccountActionsProps = {
  address: string;
  onClose: () => void;
};
```

### Use `unknown` over `any`

```typescript
// Good
function parseData(input: unknown): ParsedData { ... }

// Avoid
function parseData(input: any): ParsedData { ... }
```

If `any` is absolutely unavoidable (e.g., third-party library constraints), add an eslint-disable comment:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

### Union types over enums

Prefer string literal union types for simple cases:
```typescript
// Preferred
type NetworkType = 'mainnet' | 'goerli' | 'sepolia';

// Use enum only for complex cases with computed values
enum MigrationVersion {
  V0 = 0,
  V1 = 1,
}
```

### `as const` for constant objects

```typescript
export const ActionTypes = {
  SHOW_ALERT: 'SHOW_ALERT',
  HIDE_ALERT: 'HIDE_ALERT',
} as const;
```

## Redux Patterns

### Action Creators

```typescript
export const SHOW_ALERT = 'SHOW_ALERT' as const;
export const HIDE_ALERT = 'HIDE_ALERT' as const;

interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export function showAlert(payload: ShowAlertPayload) {
  return { type: SHOW_ALERT, ...payload };
}

export function hideAlert() {
  return { type: HIDE_ALERT };
}

export type AlertAction =
  | ReturnType<typeof showAlert>
  | ReturnType<typeof hideAlert>;
```

### Reducers

```typescript
export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

const initialState: AlertState = { ... };

const alertReducer = (
  state: AlertState = initialState,
  action: AlertAction,
): AlertState => {
  switch (action.type) { ... }
};
```

### Selectors

```typescript
import { RootState } from '../../reducers';

export const selectAlertIsVisible = (state: RootState): boolean =>
  state.alert.isVisible;
```

### Typed Hooks

```typescript
import { useSelector, useDispatch } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
```

## React Component Patterns

### Function Components

```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  isVisible?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  children,
  style,
  isVisible = true,
}) => { ... };
```

### Class Components (keep as-is during migration)

```typescript
interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ScreenName'>;
  route: RouteProp<RootStackParamList, 'ScreenName'>;
}

interface State {
  loading: boolean;
}

class MyScreen extends Component<Props, State> {
  state: State = { loading: false };
  ...
}
```

### Connected Components (keep `connect()`, do not convert to hooks)

```typescript
interface OwnProps {
  itemId: string;
}

interface StateProps {
  selectedAddress: string;
}

interface DispatchProps {
  showAlert: (payload: ShowAlertPayload) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

const mapStateToProps = (state: RootState): StateProps => ({ ... });
const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({ ... });

export default connect(mapStateToProps, mapDispatchToProps)(MyComponent);
```

### PropTypes Mapping

| PropTypes | TypeScript |
|-----------|------------|
| `PropTypes.string` | `string` |
| `PropTypes.number` | `number` |
| `PropTypes.bool` | `boolean` |
| `PropTypes.func` | `() => void` (or specific signature) |
| `PropTypes.node` | `React.ReactNode` |
| `PropTypes.element` | `React.ReactElement` |
| `PropTypes.arrayOf(PropTypes.string)` | `string[]` |
| `PropTypes.shape({...})` | named `interface` |
| `.isRequired` | non-optional (no `?`) |
| optional prop | add `?` suffix |

After conversion, remove `import PropTypes from 'prop-types'`.

## React Navigation

```typescript
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Use the navigation param list defined in app/components/Nav
type RootStackParamList = {
  Home: undefined;
  AccountActions: { address: string };
  SendFlow: { txMeta?: TransactionMeta };
};
```

## Style Objects

```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: 16,
  } as TextStyle,
});
```

Or let TypeScript infer the types (preferred when no complex typing needed).

## Store Migrations

```typescript
import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) return state as Record<string, unknown>;
  // ... narrow with hasProperty checks
}
```

## Preprocessor Directives

Preserve build preprocessor directives exactly as-is:
```typescript
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { ... } from '...';
///: END:ONLY_INCLUDE_IF
```

## General Rules

1. **Minimal behavioral changes**: Only add types. Do not refactor logic during migration.
2. **Keep `connect()` HOCs**: Do not convert to hooks during this migration.
3. **Follow existing TS patterns**: Look at already-migrated neighbors for conventions.
4. **Snapshot parity**: Snapshot tests must produce identical output after migration.
5. **No `any` leaks**: The ESLint rule `@typescript-eslint/no-explicit-any` is enforced as error.
6. **Validation pipeline** for every migrated file:
   ```bash
   yarn tsc --noEmit
   yarn test --findRelatedTests <migrated-file>
   yarn lint
   ```
