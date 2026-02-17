/* eslint-disable @typescript-eslint/default-param-last */
import { ActionType, Action } from '../../actions/privacy';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export const initialState: Readonly<PrivacyState> = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const privacyReducer = (
  state: PrivacyState = initialState,
  action: Action,
): PrivacyState => {
  const newHosts = { ...state.approvedHosts };
  switch (action.type) {
    case ActionType.APPROVE_HOST:
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      };
    case ActionType.REJECT_HOST:
      delete newHosts[action.hostname];
      return {
        ...state,
        approvedHosts: newHosts,
      };
    case ActionType.CLEAR_HOSTS:
      return {
        ...state,
        approvedHosts: {},
      };
    case ActionType.RECORD_SRP_REVEAL_TIMESTAMP:
      return {
        ...state,
        revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
