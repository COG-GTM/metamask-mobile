/* eslint-disable @typescript-eslint/default-param-last */
import type { Action } from '../../actions/privacy';

export interface State {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: unknown[];
}

export const initialState: State = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

type ReducerAction = Action | { type: 'CLEAR_HOSTS' };

const privacyReducer = (
  state: State = initialState,
  action: ReducerAction,
): State => {
  const newHosts = { ...state.approvedHosts };
  switch (action.type) {
    case 'APPROVE_HOST':
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname as string]: true,
        },
      };
    case 'REJECT_HOST':
      delete newHosts[action.hostname as string];
      return {
        ...state,
        approvedHosts: newHosts,
      };
    case 'CLEAR_HOSTS':
      return {
        ...state,
        approvedHosts: {},
      };
    case 'RECORD_SRP_REVEAL_TIMESTAMP':
      return {
        ...state,
        revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
