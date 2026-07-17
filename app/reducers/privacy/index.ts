/* eslint-disable @typescript-eslint/default-param-last */
import {
  APPROVE_HOST,
  PrivacyAction,
  RECORD_SRP_REVEAL_TIMESTAMP,
  REJECT_HOST,
} from '../../actions/privacy';

export interface PrivacyState {
  approvedHosts: { [hostname: string]: boolean };
  revealSRPTimestamps: string[];
}

const initialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const CLEAR_HOSTS = 'CLEAR_HOSTS' as const;

interface ClearHostsAction {
  type: typeof CLEAR_HOSTS;
}

type PrivacyReducerAction = PrivacyAction | ClearHostsAction;

const privacyReducer = (
  state: PrivacyState = initialState,
  action: PrivacyReducerAction,
): PrivacyState => {
  const newHosts = { ...state.approvedHosts };
  switch (action.type) {
    case APPROVE_HOST:
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      };
    case REJECT_HOST:
      delete newHosts[action.hostname];
      return {
        ...state,
        approvedHosts: newHosts,
      };
    case CLEAR_HOSTS:
      return {
        ...state,
        approvedHosts: {},
      };
    case RECORD_SRP_REVEAL_TIMESTAMP:
      return {
        ...state,
        revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
