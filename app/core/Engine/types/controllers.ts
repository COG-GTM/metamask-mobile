/**
 * Controller type definitions.
 *
 * Re-exports controller-related types from the canonical `../types.ts`.
 *
 * ## Types
 * - `Controllers` — All mobile controllers, keyed by name.
 * - `EngineState` — All engine state, keyed by controller name.
 * - `StatefulControllers` — Controllers that have state (excludes detection controllers and execution services).
 * - `EngineContext` — Combines required and optional controllers for the Engine context.
 * - `ControllerName` — Union of all controller name strings.
 * - `Controller` — Union of all controller instance types.
 * - `ControllerByName` — Map from controller name to its instance type.
 * - `ControllersToInitialize` — Subset of controllers that use the modularized init pattern.
 *
 * ## Adding a New Controller
 * 1. Import the controller class and its state type in `../types.ts`.
 * 2. Add the controller to the `Controllers` type.
 * 3. Add the state to the `EngineState` type.
 * 4. If the controller uses modularized init, add it to `ControllersToInitialize`.
 * 5. If the controller is optional (may not be instantiated), add it to `OptionalControllers`.
 */
export type {
  Controllers,
  EngineState,
  StatefulControllers,
  EngineContext,
  ControllerName,
  Controller,
  ControllerByName,
  ControllersToInitialize,
} from '../types';
