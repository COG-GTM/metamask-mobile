# TypeScript Type Debt Summary

This document summarizes the remaining type debt issues found across the MetaMask Mobile codebase during the Phase 2 TypeScript migration audit.

## Overview

The codebase has significant type debt that needs to be addressed incrementally. This document categorizes the remaining issues and provides recommendations for future migration work.

## Type Debt Categories

### 1. Redux State Types (app/reducers/index.ts)

The `RootState` interface in `app/reducers/index.ts` contains 21 properties typed as `any`. Proper TypeScript interfaces have been created in `app/reducers/types.ts` but cannot be directly applied to `RootState` without significant refactoring due to:

- Test files that provide partial state objects
- Selectors that expect specific state shapes
- Type mismatches between reducer implementations and expected types

**Files affected:**
- `app/reducers/index.ts` (lines 56-127)

**Recommended approach:**
1. Gradually update test files to use proper mock state factories
2. Update selectors to handle optional/partial state
3. Apply types incrementally, one reducer at a time

### 2. Component Test Files with `@typescript-eslint/no-explicit-any` Suppressions

Several test files use `any` type assertions to mock complex objects. These are difficult to fix due to:

- Complex generic type constraints (e.g., `ApprovalRequest<T>` requires `T extends Record<string, Json> | null`)
- Mock objects that don't fully implement required interfaces
- Type inference limitations with Jest mocks

**Files affected:**
- `app/components/Approvals/PermissionApproval/PermissionApproval.test.tsx`
- `app/components/Approvals/SnapAccountCustomNameApproval/test/SnapAccountCustomNameApproval.test.tsx`
- Various other test files using `ApprovalRequest<any>`

**Recommended approach:**
1. Create proper mock factories that return correctly typed objects
2. Use `jest.Mocked<T>` types consistently
3. Consider creating test utility types that relax constraints for testing

### 3. Engine Context Casting

The `Engine.context` object is properly typed as `EngineContext`, but some code still uses `any` casting when destructuring controllers.

**Files fixed in this PR:**
- `app/core/Authentication/Authentication.ts` - Removed 5 instances of `any` casting for `KeyringController`

**Remaining issues:**
- `KeyringController.createNewVaultAndRestore` expects `Uint8Array` for seed but receives `string` (pre-existing type mismatch, documented with `@ts-expect-error`)

### 4. Catch Block Error Types

Many catch blocks use `any` for the error parameter. These have been updated to use `unknown` with proper type guards.

**Files fixed in this PR:**
- `app/core/Authentication/Authentication.ts` - Updated 4 catch blocks from `any` to `unknown`

### 5. SecureKeychain Return Types

The `SecureKeychain` module (JavaScript) returns values that need careful type handling:

- `getSupportedBiometryType()` returns `BIOMETRY_TYPE | null`
- `getGenericPassword()` returns `false | UserCredentials | null`

**Files fixed in this PR:**
- `app/core/Authentication/Authentication.ts` - Added proper type handling for both methods

## Files with Remaining `@typescript-eslint/no-explicit-any` Suppressions

A comprehensive audit found the following patterns of `any` usage that require attention:

### High Priority (Core functionality)
- `app/reducers/index.ts` - RootState interface (21 `any` types)
- `app/core/Engine/Engine.ts` - Various controller type assertions

### Medium Priority (Test files)
- Multiple test files using `ApprovalRequest<any>`
- Mock state objects in test utilities

### Lower Priority (Utilities and helpers)
- Various utility functions with complex generic constraints
- Third-party library type definitions

## Recommendations for Future Work

1. **Create Mock Factories**: Develop properly typed mock factories for common test objects like `ApprovalRequest`, `RootState`, etc.

2. **Incremental RootState Migration**: Apply types to `RootState` one reducer at a time, updating dependent code as needed.

3. **Fix Pre-existing Type Mismatches**: Address the `createNewVaultAndRestore` seed type mismatch by either:
   - Converting the seed to `Uint8Array` before passing
   - Updating the method signature if the string type is intentional

4. **Update SecureKeychain Types**: Convert `app/core/SecureKeychain.js` to TypeScript with proper return types.

5. **Standardize Error Handling**: Continue replacing `catch (e: any)` with `catch (e: unknown)` and proper type guards.

## Type Definitions Created

The following TypeScript interfaces have been created in `app/reducers/types.ts` for future use:

- `AlertState`
- `BookmarksState` (and `Bookmark`)
- `BrowserState` (and `BrowserTab`, `BrowserHistoryEntry`, `FaviconEntry`)
- `CollectiblesState` (and `CollectibleFavorite`)
- `InfuraAvailabilityState`
- `ModalsState`
- `PrivacyState`
- `SettingsState`
- `TransactionState` (and `TransactionData`, `SelectedAsset`, `SecurityAlertResponseType`)
- `WizardState`
- `NotificationState` (and `Notification`, `TransactionNotification`, `SimpleNotification`)
- `SwapsState` (and `SwapsChainState`, `SwapsFeatureFlags`)
- `LegalNoticesState`
- `NetworkOnboardedState`
- `ExperimentalSettingsState`
- `SignatureRequestState`
- `RpcEventsState` (and `RpcEventStage`)
- `AccountsState`

These interfaces are based on the actual reducer implementations and can be applied incrementally as the codebase is migrated.
