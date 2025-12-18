# TypeScript Migration Plan

This document outlines the comprehensive migration strategy for the ongoing JavaScript to TypeScript migration in the MetaMask Mobile repository.

## Current State

The MetaMask Mobile repository has established a solid TypeScript foundation with the following infrastructure in place:

### TypeScript Configuration

The project's `tsconfig.json` is configured with `allowJs: true` to enable incremental migration while maintaining `strict: true` for type safety. This allows JavaScript and TypeScript files to coexist during the migration process while ensuring new TypeScript code adheres to strict type checking.

### Migration Enforcement

A fitness function at `.github/scripts/fitness-functions/rules/javascript-additions.ts` prevents new JavaScript files from being added to the `app/` directory. The rule uses the regex pattern `^(app).*\.(js|jsx)$` to detect and block any new `.js` or `.jsx` files, ensuring the migration only moves forward. This is enforced through CI checks on pull requests.

### Migrations System

The state migrations system at `app/store/migrations/index.ts` is fully TypeScript with 76 migrations defined (migrations 0-76, with migration 73 skipped). This demonstrates that critical infrastructure has already been successfully migrated and serves as a reference for proper TypeScript patterns in the codebase.

## Priority Areas

### Phase 1: Redux State Types (Highest Priority)

**Location:** `app/reducers/index.ts`

The `RootState` interface currently has 18 reducers typed as `any`, which blocks proper typing throughout the application since components depend on these types. The following reducers need proper typing:

| Reducer | Line | Current Type |
|---------|------|--------------|
| `legalNotices` | 59 | `any` |
| `collectibles` | 62 | `any` |
| `privacy` | 66 | `any` |
| `bookmarks` | 69 | `any` |
| `browser` | 72 | `any` |
| `modals` | 75 | `any` |
| `settings` | 78 | `any` |
| `alert` | 81 | `any` |
| `transaction` | 84 | `any` |
| `wizard` | 88 | `any` |
| `notification` | 92 | `any` |
| `swaps` | 95 | `any` |
| `infuraAvailability` | 99 | `any` |
| `networkOnboarded` | 104 | `any` |
| `experimentalSettings` | 110 | `any` |
| `signatureRequest` | 113 | `any` |
| `rpcEvents` | 116 | `any` |
| `accounts` | 119 | `any` |

Several reducers already have proper typing and can serve as reference implementations: `user` (UserState), `onboarding` (OnboardingState), `navigation` (NavigationState), `security` (SecurityState), `fiatOrders`, `sdk`, `inpageProvider`, `confirmationMetrics`, `originThrottling`, `notifications`, `bridge`, and `banners` (BannersState).

**Impact:** Completing Redux state typing will enable proper type inference throughout the application, eliminating the need for `any` type assertions in components that access Redux state.

### Phase 2: Settings Components

The following Settings components need conversion from JavaScript to TypeScript:

**AdvancedSettings** (`app/components/Views/Settings/AdvancedSettings/index.js`)

This 536-line component uses PropTypes and class-based React patterns. Key conversion requirements:
- Convert PropTypes to TypeScript interfaces
- Type the `mapStateToProps` and `mapDispatchToProps` functions properly
- Type the component state and refs
- Ensure proper typing for navigation and route props

**AppInformation** (`app/components/Views/Settings/AppInformation/index.js`)

This 242-line component is simpler but still requires:
- PropTypes to interface conversion
- Proper typing for navigation props
- Type definitions for component state

### Phase 3: Signature Request Components

The documentation at `docs/confirmation-refactoring/signature-requests/README.md` specifically requires TypeScript conversion as part of the refactoring effort. The signature request components have been relocated to `app/components/Views/confirmations/legacy/components/`.

**Components requiring conversion:**

**TypedSign** (`app/components/Views/confirmations/legacy/components/TypedSign/index.js`)

This 316-line class component handles `eth_signTypedData` and `eth_signTypedData_v3` requests. It needs:
- PropTypes to interface conversion
- Proper typing for message parameters and signature handling
- Type definitions for the recursive `renderTypedMessageV3` method

**PersonalSign** - Already converted to TypeScript (`PersonalSign.tsx`) but contains several `any` type usages that should be addressed:
- Line 71: `reduxState: any` in useSelector
- Line 86: `colors: any` from useTheme
- Line 204: `e: any` in shouldTruncateMessage

**SignatureRequestBase** - As noted in the documentation, a new `SignatureRequestBase` component should be created at `/app/components/Nav/UI/SignatureRequestBase` to consolidate signature request event listeners and modal rendering logic currently in `RootRPCMethodsUI`.

### Phase 4: UI Components with `any` Types

Many TypeScript components still use `any` types that should be replaced with proper types.

**Example: Wallet Component** (`app/components/Views/Wallet/index.tsx`)

Lines 815-833 contain `any` type usages in Redux mappings:
```typescript
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => ({
  shouldShowNewPrivacyToast: shouldShowNewPrivacyToastSelector(state),
});

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  // ...
});
```

These patterns are common throughout the codebase and should be systematically addressed once the Redux state types are properly defined.

## Dependencies

The migration must follow this dependency chain to avoid type errors and ensure smooth progress:

1. **Redux State Types** must be completed first, as all other components depend on properly typed state
2. **Settings and Signature Request Components** can be migrated in parallel after Redux types are complete
3. **Remaining UI Components** depend on both Redux types and established component patterns from earlier phases
4. **Component Library Integration** and consistency improvements are the final step

## Work Order Recommendations

### Phase 1: Complete Redux Reducer Typing

**Timeline:** High priority - enables all other work

1. Create type definitions for each reducer's state shape
2. Export state types from individual reducer files
3. Update `RootState` interface to use proper types instead of `any`
4. Remove eslint-disable comments as types are added
5. Verify type inference works correctly in consuming components

### Phase 2: Migrate Settings and Signature Request Components

**Timeline:** After Phase 1 completion

**Settings Components:**
1. Convert `AdvancedSettings/index.js` to TypeScript
2. Convert `AppInformation/index.js` to TypeScript
3. Follow existing TypeScript patterns in the codebase
4. Use interfaces for props (not type aliases)
5. Use `StyleProp<ViewStyle>` for style props

**Signature Request Components:**
1. Convert `TypedSign/index.js` to TypeScript
2. Address `any` types in `PersonalSign.tsx`
3. Create `SignatureRequestBase` component as specified in documentation
4. Consolidate duplicated code as outlined in the refactoring documentation

### Phase 3: Convert Remaining UI Components with `any` Types

**Timeline:** After Phase 2 completion

1. Search for `@typescript-eslint/no-explicit-any` eslint-disable comments
2. Prioritize components by usage frequency and impact
3. Replace `any` types with proper type definitions
4. Update `mapStateToProps` and `mapDispatchToProps` to use `RootState` and proper dispatch types

### Phase 4: Component Library Integration and Consistency

**Timeline:** Final phase

1. Ensure all components follow component library patterns
2. Verify consistent typing patterns across the codebase
3. Update documentation with TypeScript best practices
4. Remove remaining `any` types and eslint-disable comments

## TypeScript Conversion Guidelines

When converting components, follow these patterns established in the codebase:

1. **Use interfaces for prop and state type definitions** (not type aliases)
2. **Use `ReactNode` for children prop types**
3. **Use `StyleProp<ViewStyle>` for style prop types**
4. **Properly type React Native's Animated API values**
5. **Ensure proper typing for optional callbacks**
6. **Maintain all existing functionality during conversion**
7. **Verify that all consuming components still work after conversion**

## PR Naming Convention

Use the following format for migration PRs:
```
chore(js-ts): Convert [filename] to TypeScript
```

## Success Metrics

The migration will be considered complete when:
- No `any` types remain in the `RootState` interface
- All components in `app/components/Views/Settings/` are TypeScript
- All signature request components are TypeScript with proper types
- The fitness function continues to prevent new JavaScript files
- No eslint-disable comments for `@typescript-eslint/no-explicit-any` remain in migrated files
