import Engine, { EngineState } from '../../../Engine';
import { createAction, PayloadAction } from '@reduxjs/toolkit';

/**
 * State interface for the engine reducer
 */
export interface EngineReduxState {
  backgroundState: EngineState | Record<string, unknown>;
}

const initialState: EngineReduxState = {
  backgroundState: {},
};

// Create an action to initialize the background state
export const initBgState = createAction('INIT_BG_STATE');

/**
 * Payload for updateBgState action - key is a string representing a controller name
 */
interface UpdateBgStatePayload {
  key: string;
}

// Create an action to update the background state
export const updateBgState = createAction(
  'UPDATE_BG_STATE',
  (key: string) => ({
    payload: { key },
  }),
);

/**
 * Counter for tracking state updates (used for debugging/metrics)
 */
export const counter: Record<string, number> = {};

const engineReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: EngineReduxState = initialState,
  action: PayloadAction<UpdateBgStatePayload | undefined>,
) => {
  switch (action.type) {
    case initBgState.type: {
      return { backgroundState: Engine.state };
    }
    case updateBgState.type: {
      const newState = { ...state };

      if (action.payload) {
        const key = action.payload.key as keyof typeof Engine.state;
        const newControllerState = Engine.state[key];

        // Use type assertion to handle the dynamic key assignment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newState.backgroundState as Record<string, any>)[key] =
          newControllerState;
      }

      return newState;
    }
    default:
      return state;
  }
};

export default engineReducer;
