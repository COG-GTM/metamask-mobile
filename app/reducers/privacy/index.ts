/* eslint-disable @typescript-eslint/default-param-last */
import {
  type PrivacyAction,
  PrivacyActionType,
} from '../../actions/privacy';

/**
 * Privacy state interface
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PrivacyState = {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
};

const initialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const privacyReducer = (
  state: PrivacyState = initialState,
  action: PrivacyAction,
): PrivacyState => {
  const newHosts = { ...state.approvedHosts };
  switch (action.type) {
    case PrivacyActionType.APPROVE_HOST:
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      };
    case PrivacyActionType.REJECT_HOST:
      delete newHosts[action.hostname];
      return {
        ...state,
        approvedHosts: newHosts,
      };
    case PrivacyActionType.RECORD_SRP_REVEAL_TIMESTAMP:
      return {
        ...state,
        revealSRPTimestamps: [...state.revealSRPTimestamps, action.timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
