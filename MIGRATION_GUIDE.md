# JavaScript → TypeScript Migration Guide

This document defines the conventions and patterns for converting MetaMask Mobile from JavaScript to TypeScript. All contributors (human and automated agents) must follow these guidelines to ensure consistency.

---

## File Naming

| Content | Extension |
|---------|-----------|
| Pure logic (no JSX) | `.ts` |
| Components with JSX | `.tsx` |
| Type-only files | `.ts` (never `.tsx`) |
| Test files | `.test.ts` / `.test.tsx` (match the source file) |
| Style files | `.styles.ts` |

When renaming a file, update **all imports** within the same domain/directory that reference it. Cross-domain imports will be fixed in Phase 2.

---

## Type Definition Conventions

### Interfaces vs Types

- **Use `interface`** for component props, state shapes, and any object type that might be extended:

  ```ts
  interface AssetScreenProps {
    navigation: NavigationProp<RootStackParamList>;
    route: RouteProp<RootStackParamList, 'Asset'>;
  }
  ```

- **Use `type`** for unions, intersections, mapped types, and utility types:

  ```ts
  type NetworkId = string | number;
  type TokenWithBalance = Token & { balance: string };
  ```

### Naming

- Props interfaces: `<ComponentName>Props` (e.g., `TokenListProps`)
- State interfaces: `<ComponentName>State` (e.g., `SwapsQuotesViewState`)
- Enum-like constants: Use `as const` objects + `typeof` extraction:

  ```ts
  const TransactionStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
  } as const;

  type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];
  ```

---

## Component Patterns

### Functional Components

Use explicit return types instead of `React.FC`. This avoids implicit `children` and is the community-preferred pattern:

```tsx
interface TokenRowProps {
  address: string;
  symbol: string;
  balance: string;
  onPress?: (address: string) => void;
}

const TokenRow = ({ address, symbol, balance, onPress }: TokenRowProps): JSX.Element => {
  // ...
};

export default TokenRow;
```

If the component accepts `children`, declare it explicitly:

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
```

### Class Components

For class components that cannot be easily converted to functional components during this migration:

```tsx
interface MyComponentProps {
  title: string;
}

interface MyComponentState {
  isLoading: boolean;
}

class MyComponent extends Component<MyComponentProps, MyComponentState> {
  state: MyComponentState = { isLoading: false };
  // ...
}
```

---

## Style Typing

Use `StyleSheet.create` with explicit typing:

```ts
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface Styles {
  container: ViewStyle;
  title: TextStyle;
  icon: ImageStyle;
}

const styles = StyleSheet.create<Styles>({
  container: { flex: 1 },
  title: { fontSize: 16 },
  icon: { width: 24, height: 24 },
});
```

For style props, use `StyleProp<ViewStyle>`:

```ts
interface Props {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}
```

For dynamic styles that use the theme, type the function parameter:

```ts
const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { backgroundColor: colors.background.default },
  });
```

---

## Redux Patterns

### Typed Hooks

Use the typed hooks from `app/types/redux.ts` instead of plain `useSelector` / `useDispatch`:

```ts
import { useAppSelector, useAppDispatch } from '../types/redux';

// In a component:
const chainId = useAppSelector(selectChainId);
const dispatch = useAppDispatch();
```

### Action Creators

Type action creators with explicit return types:

```ts
interface SetChainIdAction {
  type: 'SET_CHAIN_ID';
  chainId: string;
}

export const setChainId = (chainId: string): SetChainIdAction => ({
  type: 'SET_CHAIN_ID',
  chainId,
});
```

### Reducers

```ts
interface SwapsState {
  quotes: Quote[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SwapsState = {
  quotes: [],
  isLoading: false,
  error: null,
};

const swapsReducer = (
  state: SwapsState = initialState,
  action: SwapsAction,
): SwapsState => {
  switch (action.type) {
    // ...
  }
};
```

### Selectors

```ts
import { RootState } from '../reducers';

export const selectChainId = (state: RootState): string =>
  state.engine.backgroundState.NetworkController.providerConfig.chainId;
```

---

## PropTypes Removal

When converting a file, **remove all PropTypes**:

1. Delete `import PropTypes from 'prop-types';`
2. Delete the `Component.propTypes = { ... }` block
3. Delete `Component.defaultProps = { ... }` — use default parameter values instead:

   ```tsx
   // Before (JS)
   Component.defaultProps = { visible: true };

   // After (TS)
   const Component = ({ visible = true }: Props) => { ... };
   ```

---

## Navigation Typing

Use React Navigation's typed param lists:

```ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define param list for a navigator
type RootStackParamList = {
  Wallet: undefined;
  Asset: { address: string; chainId: string };
  Settings: { initialRoute?: string };
};

// Type the navigation and route props
type AssetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Asset'>;
type AssetScreenRouteProp = RouteProp<RootStackParamList, 'Asset'>;

interface AssetScreenProps {
  navigation: AssetScreenNavigationProp;
  route: AssetScreenRouteProp;
}
```

---

## Avoiding `any`

- **Never** use `any` unless absolutely necessary (e.g., interfacing with untyped third-party APIs that have no `@types` package).
- Use `unknown` + type guards for truly unknown data:

  ```ts
  function processResponse(data: unknown): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      return (data as { message: string }).message;
    }
    return String(data);
  }
  ```

- For existing `any` types that are too complex to fix during migration, add a `// TODO: Replace "any" with type` comment (following the existing repo convention).

---

## Animated API Typing

Type React Native's `Animated` values properly:

```ts
import { Animated } from 'react-native';

// In component state or refs
const fadeAnim = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(100)).current;

// For animated style objects
const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
  opacity: fadeAnim,
  transform: [{ translateY }],
};
```

---

## Third-Party Module Declarations

If a third-party module has no types, add an ambient declaration in `app/declarations/index.d.ts`:

```ts
declare module 'untyped-library' {
  export function doSomething(input: string): Promise<void>;
  export default class Client {
    constructor(config: { apiKey: string });
  }
}
```

For modules that are too complex to type fully, use a minimal declaration:

```ts
declare module 'complex-untyped-lib' {
  const lib: {
    init: (config: Record<string, unknown>) => void;
    // Add more signatures as you use them
  };
  export default lib;
}
```

---

## Conversion Checklist (Per File)

- [ ] Rename `.js`/`.jsx` → `.ts`/`.tsx`
- [ ] Add explicit type annotations to function parameters and return types
- [ ] Replace `PropTypes` with TypeScript `interface` definitions
- [ ] Replace `defaultProps` with default parameter values
- [ ] Fix all `tsc` errors in the converted file
- [ ] Update imports within the same domain that reference the renamed file
- [ ] Run existing unit tests and fix any breakage
- [ ] Ensure no new `any` types are introduced without a `// TODO` comment

---

## PR Conventions

- Branch naming: `devin/<timestamp>-<domain>-ts-migration`
- PR title: `chore(js-ts): Convert <domain> files to TypeScript`
- Each agent should create one PR per domain
- All existing tests must pass before merging
