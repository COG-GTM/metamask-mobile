/**
 * Controller initialization type definitions.
 *
 * Re-exports initialization-related types from the canonical `../types.ts`.
 *
 * ## Types
 * - `ControllerInitRequest` — Dependencies provided to a controller's init function.
 * - `ControllerInitFunction` — Function that creates a controller instance.
 * - `ControllerInitFunctionByControllerName` — Map of init functions keyed by controller name.
 * - `InitModularizedControllersFunction` — Top-level function that initializes all modularized controllers.
 *
 * ## Pattern
 * When migrating a controller to the modularized init pattern:
 * 1. Add the controller name to `ControllersToInitialize` in `../types.ts`.
 * 2. Create a messenger callback in `Engine/messengers/`.
 * 3. Create an init function in `Engine/controllers/` that satisfies `ControllerInitFunction`.
 * 4. Register the init function in `Engine.ts`.
 */
export type {
  ControllerInitRequest,
  ControllerInitFunction,
  ControllerInitFunctionByControllerName,
  InitModularizedControllersFunction,
} from '../types';
