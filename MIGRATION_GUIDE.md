# JavaScript to TypeScript Migration Guide

This document defines conventions for migrating MetaMask Mobile source files from JavaScript to TypeScript.

## File Renaming

| Original | Target |
|----------|--------|
| `.js` | `.ts` |
| `.jsx` | `.tsx` |
| `.test.js` / `.spec.js` | `.test.ts` / `.spec.ts` |
| `.test.jsx` / `.spec.jsx` | `.test.tsx` / `.spec.tsx` |

Rename files using `git mv` so that git tracks the rename:

```bash
git mv app/components/UI/Foo/index.js app/components/UI/Foo/index.tsx
```

## Type Annotations

### Function parameters and return types

```ts
// Before (JS)
function calculateGas(value, decimals) {
  return parseFloat(value) * Math.pow(10, decimals);
}

// After (TS)
function calculateGas(value: string, decimals: number): number {
  return parseFloat(value) * Math.pow(10, decimals);
}
```

### Component props — replace PropTypes with interfaces

```tsx
// Before (JS with PropTypes)
import PropTypes from 'prop-types';

const MyComponent = ({ title, onPress, isVisible }) => { ... };

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  isVisible: PropTypes.bool,
};

// After (TSX)
interface MyComponentProps {
  title: string;
  onPress?: () => void;
  isVisible?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress, isVisible }) => { ... };
```

### Component state

```tsx
// Before
this.state = { loading: false, data: null };

// After
interface MyComponentState {
  loading: boolean;
  data: SomeDataType | null;
}

state: MyComponentState = { loading: false, data: null };
```

## Module Syntax

### Replace `require()` with `import`/`export`

```ts
// Before
const { colors } = require('../theme');
module.exports = MyComponent;

// After
import { colors } from '../theme';
export default MyComponent;
```

## Type Preferences

| Avoid | Prefer |
|-------|--------|
| `any` | `unknown`, then narrow with type guards |
| `object` | `Record<string, unknown>` or a specific interface |
| `Function` | `() => void` or specific signature |
| `// @ts-ignore` | `// @ts-expect-error` with explanation |
| `as` type assertions | Type guards and narrowing |

When `any` is truly unavoidable during migration, add the ESLint disable comment:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

## Redux Patterns

Use the typed hooks from `app/types/redux.ts`:

```ts
import { useAppSelector, useAppDispatch } from '../types/redux';

// Instead of:
// const value = useSelector((state: any) => state.settings.foo);
// Use:
const value = useAppSelector((state) => state.settings.foo);
const dispatch = useAppDispatch();
```

When typing selectors:

```ts
import type { RootState } from '../reducers';

export const selectFoo = (state: RootState): string => state.settings.foo;
```

## Navigation Typing

Use React Navigation's typed patterns:

```tsx
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<RootStackParamList, 'MyScreen'>;

const MyScreen: React.FC<Props> = ({ navigation, route }) => { ... };
```

## Constants

Use `as const` for constant objects and arrays:

```ts
// Before
const NETWORKS = { MAINNET: 'mainnet', GOERLI: 'goerli' };

// After
const NETWORKS = { MAINNET: 'mainnet', GOERLI: 'goerli' } as const;
```

## Validation Checklist

Before submitting a PR, verify:

1. `yarn lint:tsc` passes (`tsc --noEmit`)
2. `yarn lint` passes (ESLint)
3. Existing Jest tests still pass (`yarn test:unit`)
4. No new `// @ts-ignore` comments added
5. No `require()` calls introduced
6. All `PropTypes` imports removed from converted files
7. All function parameters have explicit types
8. All component props use TypeScript interfaces (not PropTypes)

## Branch Naming

Each workstream uses a dedicated branch:

```
migrate/ts-workstream-0   # Pre-migration setup (this branch)
migrate/ts-workstream-1   # Core Engine & Controllers
migrate/ts-workstream-2   # Redux Store, Actions, Reducers
...
migrate/ts-workstream-10  # Configuration, Scripts & Build Files
```

## Sub-PR Strategy

Each workstream should be broken into sub-PRs of ~20-50 files to keep reviews manageable. Name sub-PRs as:

```
chore(ts-migration): convert app/core/DeeplinkManager to TypeScript [WS-1]
chore(ts-migration): convert app/reducers to TypeScript [WS-2]
```
