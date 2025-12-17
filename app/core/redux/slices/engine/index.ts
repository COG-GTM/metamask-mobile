import Engine, { EngineState } from '../../../Engine';
import { createAction, PayloadAction } from '@reduxjs/toolkit';

export interface EngineReduxState {
  backgroundState: EngineState | Record<string, unknown>;
}

const initialState: EngineReduxState = {
  backgroundState: {},
};

// Create an action to initialize the background state
export const initBgState = createAction('INIT_BG_STATE');

interface UpdateBgStatePayload {
  key: string;
}

// Create an action to update the background state
export const updateBgState = createAction(
  'UPDATE_BG_STATE',
  (payload: UpdateBgStatePayload) => ({
    payload,
  }),
);

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

        (newState.backgroundState as Record<string, unknown>)[key] =
          newControllerState;
      }

      return newState;
    }
    default:
      return state;
  }
};

export default engineReducer;
