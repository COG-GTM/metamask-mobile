# Type Definitions Documentation

This document provides an overview of the type definitions used in the Engine, controllers, and utilities, along with patterns and recommendations for maintaining type consistency.

## Existing Type Definitions

### Core Engine Types (app/core/Engine/types.ts)

The main type definitions file exports the following key types:

#### Controller Types

- **`Controllers`**: A type mapping all mobile controllers by name. This includes all controller instances like `AccountsController`, `NetworkController`, `TransactionController`, etc.

- **`EngineState`**: A type mapping all engine state by controller name. Each controller's state type is properly typed (e.g., `AccountTrackerControllerState`, `NetworkState`, `TransactionControllerState`).

- **`EngineContext`**: Combines required and optional controllers. This is the type used for `Engine.context` property.

- **`StatefulControllers`**: Controllers that are defined with state, excluding stateless non-controller modules like `AssetsContractController`, `ExecutionService`, `NftDetectionController`, and `TokenDetectionController`.

#### Messenger Types

- **`BaseControllerMessenger`**: The global controller messenger type extending `ExtendedControllerMessenger` with `GlobalActions` and `GlobalEvents`.

- **`BaseRestrictedControllerMessenger`**: A restricted version of the controller messenger using `RestrictedMessenger` from `@metamask/base-controller`.

- **`ControllerMessengerCallback`**: Callback type that returns a controller messenger for a specific controller.

#### Initialization Types

- **`ControllersToInitialize`**: Union type of controller names that can be initialized through the modular initialization system.

- **`ControllerInitRequest`**: Request object passed to controller initialization functions, including `controllerMessenger`, `getController`, `getGlobalChainId`, `getState`, `initMessenger`, and `persistedState`.

- **`ControllerInitFunction`**: Function type for initializing a controller instance.

- **`ControllerInitFunctionByControllerName`**: Map of controller init functions by controller name.

- **`InitModularizedControllersFunction`**: Function type for initializing controllers in the engine.

#### Utility Types

- **`ControllerName`**: Union type of all controller names (keys of `Controllers`).
- **`Controller`**: Union type of all controller instances.
- **`ControllerByName`**: Map of controllers by name.

### Controller Messenger Types

Each controller that uses the modular initialization pattern has its own messenger types defined in `app/core/Engine/messengers/<controller-name>/types.ts`:

| Controller | Types File | Exported Types |
|------------|-----------|----------------|
| AccountsController | `accounts-controller-messenger/types.ts` | `AccountsControllerMessengerActions`, `AccountsControllerMessengerEvents` |
| MultichainNetworkController | `multichain-network-controller-messenger/types.ts` | `MultichainNetworkControllerActions`, `MultichainNetworkControllerEvents` |
| MultichainBalancesController | `multichain-balances-controller-messenger/types.ts` | Controller-specific action and event types |
| MultichainAssetsController | `multichain-assets-controller-messenger/types.ts` | Controller-specific action and event types |
| MultichainAssetsRatesController | `multichain-assets-rates-controller-messenger/types.ts` | Controller-specific action and event types |
| MultichainTransactionsController | `multichain-transactions-controller-messenger/types.ts` | Controller-specific action and event types |
| CronjobController | `cronjob-controller-messenger/types.ts` | Controller-specific action and event types |
| AppMetadataController | `app-metadata-controller-messenger/types.ts` | Controller-specific action and event types |

### Controller-Specific Types

Some controllers have additional types defined in `app/core/Engine/controllers/<controller-name>/types.ts`:

| Controller | Types File | Exported Types |
|------------|-----------|----------------|
| TransactionController | `transaction-controller/types.ts` | `TransactionMetrics`, `TransactionEventHandlerRequest` |
| TokenSearchDiscoveryController | `TokenSearchDiscoveryController/types.ts` | Controller-specific types |
| RemoteFeatureFlagController | `remote-feature-flag-controller/types.ts` | Controller-specific types |

### Other Type Directories

The codebase has several other type directories for specific features:

| Directory | Purpose |
|-----------|---------|
| `app/util/notifications/notification-states/types/` | Notification state types (`NotificationState`, `NotificationMenuItem`, `NotificationModalDetails`) |
| `app/util/notifications/types/` | Notification types and type utilities |
| `app/components/Views/confirmations/types/` | Confirmation alert types (`Alert`, `Severity`) |
| `app/components/UI/Ramp/types/` | Ramp-related types (`QuickAmount`, `RampIntent`, `PROVIDER_LINKS`) |
| `app/core/Snaps/types.ts` | Snap-related types (`HandleSnapRequestArgs`) |
| `app/core/GasPolling/types.ts` | Gas polling types |
| `app/core/Encryptor/types.ts` | Encryptor types |
| `app/core/SnapKeyring/types.ts` | Snap keyring types |
| `app/core/redux/types.ts` | Redux-related types |
| `app/core/RPCMethods/eth_accounts/types.ts` | RPC method types |

## Missing Type Definitions

### Areas Using `any` Types

The following areas in the Engine use `any` types that could benefit from proper typing:

1. **Engine.ts:216** - `currentChainId: any` - Should be typed as `Hex` from `@metamask/utils`
2. **Engine.ts:246** - `lastIncomingTxBlockInfo: any` - Needs a proper interface definition
3. **Engine.ts:620-623** - Snap dialog content and placeholder types - Should use types from `@metamask/snaps-ui`
4. **Engine.ts:1870** - Controller iteration uses `any` - Could use proper controller type

### Type Mismatches (`@ts-expect-error`)

Several areas have type mismatches that are suppressed with `@ts-expect-error`:

1. **QRHardwareKeyring type** (Engine.ts:476) - Keyring type needs updating
2. **SmartTransactionsController types** (Engine.ts:891, 900) - Base controller version mismatch
3. **SwapsController messenger** (Engine.ts:1321) - Base controller version mismatch
4. **PPOMController messenger** (Engine.ts:1363) - Base controller version mismatch
5. **TransactionController messenger** (transaction-controller-messenger.ts:57) - Base controller version mismatch
6. **Snap controller types** (snap-controller-init.ts) - Multiple type incompatibilities
7. **SignatureController options** (signature-controller-init.ts:27) - Partial type not marked correctly

### Controllers Without Dedicated Types Files

The following controllers in `CONTROLLER_MESSENGERS` do not have dedicated `types.ts` files in their messenger directories:

- `TransactionController` (has types in controller directory, not messenger)
- `CurrencyRateController`
- `GasFeeController`
- `SignatureController`
- `ExecutionService`
- `SnapController`
- `SnapInterfaceController`
- `SnapsRegistry`
- `NotificationServicesController`
- `NotificationServicesPushController`

## Type Definition Patterns

### Pattern 1: Controller Messenger Types

When creating messenger types for a controller, follow this pattern:

```typescript
// app/core/Engine/messengers/<controller-name>/types.ts

import { SomeControllerAction, SomeControllerEvent } from '@metamask/some-controller';

/**
 * The actions that the <ControllerName>Messenger can use.
 */
export type <ControllerName>MessengerActions =
  | SomeControllerAction
  | AnotherControllerAction;

/**
 * The events that the <ControllerName>Messenger can handle.
 */
export type <ControllerName>MessengerEvents =
  | SomeControllerEvent
  | AnotherControllerEvent;
```

### Pattern 2: Controller Initialization Types

When creating initialization types for a controller:

```typescript
// app/core/Engine/controllers/<controller-name>/types.ts

import type { ControllerInitFunction } from '../../types';
import type { SomeControllerMessenger } from '@metamask/some-controller';

/**
 * Custom types specific to this controller's initialization.
 */
export interface <ControllerName>InitOptions {
  // Controller-specific options
}
```

### Pattern 3: Messenger Callback Function

When creating a messenger callback function:

```typescript
// app/core/Engine/messengers/<controller-name>/index.ts

import { <ControllerName>Messenger } from '@metamask/some-controller';
import { BaseControllerMessenger } from '../../types';

export * from './types';

export function get<ControllerName>Messenger(
  baseControllerMessenger: BaseControllerMessenger,
): <ControllerName>Messenger {
  return baseControllerMessenger.getRestricted({
    name: '<ControllerName>',
    allowedEvents: [
      // List allowed events
    ],
    allowedActions: [
      // List allowed actions
    ],
  });
}
```

### Pattern 4: Controller Initialization Function

When creating a controller initialization function:

```typescript
// app/core/Engine/controllers/<controller-name>/index.ts

import { <ControllerName>, type <ControllerName>Messenger } from '@metamask/some-controller';
import type { ControllerInitFunction } from '../../types';

export const <controllerName>Init: ControllerInitFunction<
  <ControllerName>,
  <ControllerName>Messenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new <ControllerName>({
    messenger: controllerMessenger,
    state: persistedState.<ControllerName>,
  });

  return { controller };
};
```

## Recommendations

### 1. Standardize Messenger Type Files

Create `types.ts` files for all controller messengers that don't have them, following the pattern established by `accounts-controller-messenger/types.ts`.

### 2. Replace `any` Types

Replace the identified `any` types with proper type definitions:

- Create an interface for `lastIncomingTxBlockInfo`
- Use `Hex` type for `currentChainId`
- Import proper types from `@metamask/snaps-ui` for snap dialog content

### 3. Address Type Mismatches

Work with the MetaMask controller packages team to resolve base-controller version mismatches that cause `@ts-expect-error` suppressions.

### 4. Document Engine.context Access Patterns

The `Engine.context` property is typed as `EngineContext`, which properly types all controller access. When accessing controllers:

```typescript
// Correct usage - fully typed
const { NetworkController, AccountsController } = Engine.context;
const chainId = NetworkController.state.selectedNetworkClientId;

// For optional controllers like PPOMController
const ppom = Engine.context.PPOMController; // Type: PPOMController | undefined
```

### 5. Centralized Types Directory

Consider creating a centralized `app/types/` directory for shared types that are used across multiple features, while keeping controller-specific types in their respective directories.

## Directory Structure

The recommended type definition directory structure:

```
app/
  core/
    Engine/
      types.ts                    # Core Engine types
      controllers/
        <controller-name>/
          types.ts                # Controller-specific types (if needed)
          index.ts                # Controller initialization
      messengers/
        <controller-name>/
          types.ts                # Messenger action/event types
          index.ts                # Messenger callback function
  declarations/
    index.d.ts                    # Global type declarations
```

## References

- [Engine README](./README.md) - How to integrate a new controller
- [@metamask/base-controller](https://github.com/MetaMask/core/tree/main/packages/base-controller) - Base controller types
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) - TypeScript best practices
