/**
 * Messenger type definitions.
 *
 * Re-exports messenger-related types from the canonical `../types.ts`.
 *
 * ## Types
 * - `BaseControllerMessenger` — The unrestricted root messenger parameterized with all global actions/events.
 * - `BaseRestrictedControllerMessenger` — A restricted messenger that individual controllers receive.
 * - `ControllerMessengerCallback` — Factory that produces a restricted messenger from the base messenger.
 *
 * ## Pattern
 * - The Engine creates a single `BaseControllerMessenger` at startup.
 * - Each controller receives a `BaseRestrictedControllerMessenger` that limits
 *   which actions/events it can access.
 * - Messenger callbacks in `Engine/messengers/` generate restricted messengers
 *   from the base messenger.
 *
 * ## Adding a New Controller's Messenger
 * 1. Import the controller's action and event types in `../types.ts`.
 * 2. Add them to the `GlobalActions` and `GlobalEvents` unions in `../types.ts`.
 * 3. Create a messenger callback in `Engine/messengers/<controller-name>-messenger.ts`.
 * 4. Register it in `Engine/messengers/index.ts`.
 */
export type {
  BaseControllerMessenger,
  BaseRestrictedControllerMessenger,
  ControllerMessengerCallback,
} from '../types';
