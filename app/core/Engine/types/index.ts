/**
 * Engine type definitions — barrel export.
 *
 * This directory centralizes all Engine-related type definitions into
 * focused modules. Import types from here (or from `Engine/types`)
 * rather than reaching into individual files.
 *
 * ## Directory Structure
 *
 * | File                | Contents                                                    |
 * |---------------------|-------------------------------------------------------------|
 * | `controllers.ts`    | Controller map, state map, context, name, and init unions   |
 * | `messenger.ts`      | Global/restricted messenger types and messenger callbacks   |
 * | `controller-init.ts`| Modularized controller init request/function types          |
 * | `utility.ts`        | Return types for Engine utility methods                     |
 *
 * ## Adding New Types
 *
 * 1. Add the type to `../types.ts` (the canonical source).
 * 2. Choose the appropriate module in this directory based on the type's domain.
 * 3. Re-export the type from that module file.
 * 4. Re-export it here so it is part of the public barrel.
 *
 * ## Conventions
 *
 * - Use `type` keyword for type aliases (not `interface`) when the type is a union or mapped type.
 * - Use `interface` for object shapes that may be extended.
 * - Always add JSDoc comments explaining the purpose and usage of each exported type.
 * - Keep imports sorted: external packages first, then internal modules.
 */

// Controller types
export type {
  Controllers,
  EngineState,
  StatefulControllers,
  EngineContext,
  ControllerName,
  Controller,
  ControllerByName,
  ControllersToInitialize,
} from './controllers';

// Messenger types
export type {
  BaseControllerMessenger,
  BaseRestrictedControllerMessenger,
  ControllerMessengerCallback,
} from './messenger';

// Controller initialization types
export type {
  ControllerInitRequest,
  ControllerInitFunction,
  ControllerInitFunctionByControllerName,
  InitModularizedControllersFunction,
} from './controller-init';

// Utility types
export type { TotalFiatBalance, SnapPreferences } from './utility';
