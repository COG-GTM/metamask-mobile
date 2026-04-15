/**
 * Re-export the canonical EngineState from `app/core/Engine/types.ts`.
 *
 * The previous version of this file defined a hand-maintained subset of
 * controller states that drifted from the source of truth.  To keep a single
 * definition, we now re-export and wrap it in the `{ engine: { backgroundState } }`
 * shape that selectors expect.
 *
 * Selectors should use `RootState` (from `app/reducers`) whenever possible.
 * This file remains for backward-compatibility with any code that imports
 * `EngineState` from here.
 */

import type { EngineState as BackgroundState } from '../core/Engine/types';

/**
 * The shape of the engine slice as it appears in Redux state.
 *
 * ```ts
 * state.engine.backgroundState.<ControllerName>
 * ```
 */
export interface EngineState {
  engine: {
    backgroundState: BackgroundState;
  };
}
