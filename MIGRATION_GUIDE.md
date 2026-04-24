# JavaScript to TypeScript Migration Guide

This document establishes conventions for the ongoing JS → TS migration of `metamask-mobile`. **Every contributor and Devin agent must follow these rules.**

---

## 1. File Renaming

| From | To | When |
|------|----|------|
| `.js` (no JSX) | `.ts` | Utility modules, constants, reducers, actions, migrations |
| `.js` (contains JSX) | `.tsx` | React components rendered with JSX |
| `.jsx` | `.tsx` | Always |
| `.test.js` / `.test.jsx` | `.test.ts` / `.test.tsx` | Corresponding test file |

## 2. Type Annotations

### Functions

Add explicit parameter types and return types to **every exported function**:

```typescript
// Before
export function toLocaleDateTime(timestamp) { ... }

// After
export function toLocaleDateTime(timestamp: number): string { ... }
```

### React Components

Replace `PropTypes` with a `Props` interface:

```typescript
// Before
import PropTypes from 'prop-types';
const MyComponent = ({ title, onPress, children }) => { ... };
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  children: PropTypes.node,
};

// After
import { ReactNode } from 'react';

interface Props {
  title: string;
  onPress?: () => void;
  children?: ReactNode;
}
const MyComponent = ({ title, onPress, children }: Props) => { ... };
```

#### PropTypes → TypeScript Mapping

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
| `.isRequired` | Non-optional (omit `?`) |

### Class Components

```typescript
interface Props { ... }
interface State { ... }
class MyView extends Component<Props, State> { ... }
```

### Style Prop Types

Use `StyleProp<ViewStyle>` (or `TextStyle`, `ImageStyle`) for style props:

```typescript
import { StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
}
```

### Redux-Connected Components

Define three interfaces and keep `connect()` HOC — do NOT convert to hooks:

```typescript
interface OwnProps { ... }
interface StateProps { ... }
interface DispatchProps { ... }
type Props = OwnProps & StateProps & DispatchProps;

const mapStateToProps = (state: RootState): StateProps => ({ ... });
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({ ... });
export default connect(mapStateToProps, mapDispatchToProps)(MyComponent);
```

### Navigation Props

```typescript
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'ScreenName'>;
  route: RouteProp<RootStackParamList, 'ScreenName'>;
}
```

### Refs

```typescript
const viewRef = useRef<View>(null);
const inputRef = useRef<TextInput>(null);
```

### Animated Values

```typescript
const animatedValue = useRef(new Animated.Value(0)).current;
```

## 3. Redux Actions

```typescript
export const SHOW_ALERT = 'SHOW_ALERT' as const;

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  payload: { ... };
}

export type AlertAction = ShowAlertAction | HideAlertAction;
```

**Reference**: `app/actions/onboarding/index.ts`

## 4. Redux Reducers

```typescript
export interface AlertState { ... }

const initialState: AlertState = { ... };

const alertReducer = (
  state: AlertState = initialState,
  action: AlertAction,
): AlertState => { ... };
```

**Reference**: `app/reducers/security/index.ts`

## 5. Store Migrations

```typescript
import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) return state as Record<string, unknown>;
  // Use hasProperty() for runtime type narrowing
}
```

**Reference**: `app/store/migrations/028.ts`

## 6. Constants

Add `as const` assertions for literal values:

```typescript
export const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  GOERLI: 'goerli',
} as const;
```

## 7. Critical Rules

1. **No runtime behavior changes** — This is a type-only migration. Do not refactor logic.
2. **No `any` unless unavoidable** — Use `unknown` as a safer fallback. If `any` is required, add an eslint-disable comment explaining why.
3. **Use existing `@metamask/*` types** — Controller packages ship their own TypeScript definitions. Import them instead of redefining.
4. **Preserve preprocessor directives** — Lines like `///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)` must remain exactly as-is.
5. **Remove `PropTypes` imports** — After replacing with TS interfaces, delete `import PropTypes from 'prop-types'`.
6. **Update explicit extension imports** — If any import references `.js` explicitly, update to `.ts`/`.tsx`.
7. **Keep `connect()` HOCs** — Do not convert to hooks during migration.
8. **Snapshot parity** — Snapshot tests must produce identical output after migration.

## 8. Validation Pipeline

Every migrated file **must** pass all three checks before committing:

```bash
# 1. Type check
tsc --noEmit

# 2. Related tests
yarn test --findRelatedTests <migrated-file>

# 3. Lint
yarn lint
```

## 9. PR Conventions

- **Branch name**: `migrate/ts/<directory-name>` (e.g., `migrate/ts/app-util`)
- **PR title**: `chore(js-ts): Convert <scope> to TypeScript`
- **Base branch**: `migrate/ts/base` (contains shared types and this guide)
- **Max files per PR**: ~50 files to keep reviews manageable
- **No logic changes**: Only type annotations

## 10. Reference Patterns

| Area | Reference File |
|------|---------------|
| Actions | `app/actions/onboarding/index.ts` |
| Reducers | `app/reducers/security/index.ts` |
| Migrations | `app/store/migrations/028.ts` |
| Simple component | Any file in `app/component-library/components/` |
| Utility function | `app/util/string/index.ts`, `app/util/mnemonic/index.ts` |
| Core service | `app/core/Authentication/Authentication.ts` |
| Constants | `app/constants/urls.ts`, `app/constants/bridge.ts` |
