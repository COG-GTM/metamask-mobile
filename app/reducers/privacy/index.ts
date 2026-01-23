import { PrivacyActionTypes, PrivacyAction } from '../../actions/privacy';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export const privacyInitialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

/* eslint-disable @typescript-eslint/default-param-last */
const privacyReducer = (
  state: PrivacyState = privacyInitialState,
  action: PrivacyAction,
): PrivacyState => {
  const newHosts = { ...state.approvedHosts };
  switch (action.type) {
    case PrivacyActionTypes.APPROVE_HOST:
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      };
    case PrivacyActionTypes.REJECT_HOST:
      delete newHosts[action.hostname];
      return {
        ...state,
        approvedHosts: newHosts,
      };
    case PrivacyActionTypes.CLEAR_HOSTS:
      return {
        ...state,
        approvedHosts: {},
      };
    case PrivacyActionTypes.RECORD_SRP_REVEAL_TIMESTAMP:
      return {
        ...state,
        revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
