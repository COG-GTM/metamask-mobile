import Engine from '../../../Engine';
import { createAction, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundState: {} as any,
};

// Create an action to initialize the background state
export const initBgState = createAction('INIT_BG_STATE');

/**
 * `key` updates a single controller; `keys` carries every controller that
 * changed since the last flush (see EngineService).
 */
export type UpdateBgStatePayload = { key: string } | { keys: string[] };

// Create an action to update the background state
export const updateBgState = createAction(
  'UPDATE_BG_STATE',
  (payload: UpdateBgStatePayload) => ({ payload }),
);

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const counter: any = {};
const engineReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state = initialState,
  action: PayloadAction<UpdateBgStatePayload | undefined>,
) => {
  switch (action.type) {
    case initBgState.type: {
      return { backgroundState: Engine.state };
    }
    case updateBgState.type: {
      const newState = { ...state };

      if (action.payload) {
        const keys =
          'keys' in action.payload ? action.payload.keys : [action.payload.key];

        if (keys.length > 0) {
          // Build the Engine state snapshot once per dispatch, not once per key
          const engineState = Engine.state;
          keys.forEach((key) => {
            newState.backgroundState[key] =
              engineState[key as keyof typeof engineState];
          });
        }
      }

      return newState;
    }
    default:
      return state;
  }
};

export default engineReducer;
