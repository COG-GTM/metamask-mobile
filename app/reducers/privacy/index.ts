import { AnyAction } from 'redux';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export type PrivacyAction =
  | { type: 'APPROVE_HOST'; hostname: string }
  | { type: 'REJECT_HOST'; hostname: string }
  | { type: 'CLEAR_HOSTS' }
  | { type: 'RECORD_SRP_REVEAL_TIMESTAMP'; timestamp: number };

const initialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const privacyReducer = (
  state: PrivacyState = initialState,
  action: AnyAction = { type: '' },
): PrivacyState => {
  const newHosts: Record<string, boolean> = { ...state.approvedHosts };
  switch (action.type) {
    case 'APPROVE_HOST':
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname]: true,
        },
      };
    case 'REJECT_HOST':
      delete newHosts[action.hostname];
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
