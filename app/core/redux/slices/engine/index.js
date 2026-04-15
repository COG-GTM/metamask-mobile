import Engine from '../../../Engine';
import { createAction } from '@reduxjs/toolkit';

const initialState = {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundState: {}
};

// Create an action to initialize the background state
export const initBgState = createAction('INIT_BG_STATE');

// Create an action to update the background state
export const updateBgState = createAction('UPDATE_BG_STATE', (key) => ({
  payload: key
}));

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const counter = {};
const engineReducer = (
// eslint-disable-next-line @typescript-eslint/default-param-last
state = initialState,


action) =>
{
  switch (action.type) {
    case initBgState.type:{
        return { backgroundState: Engine.state };
      }
    case updateBgState.type:{
        const newState = { ...state };

        if (action.payload) {
          const newControllerState =
          Engine.state[action.payload.key];

          newState.backgroundState[action.payload.key] = newControllerState;
        }

        return newState;
      }
    default:
      return state;
  }
};

export default engineReducer;