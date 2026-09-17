export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: string[];
}

interface PrivacyAction {
  type:
    | 'APPROVE_HOST'
    | 'REJECT_HOST'
    | 'CLEAR_HOSTS'
    | 'RECORD_SRP_REVEAL_TIMESTAMP';
  hostname: string;
  timestamp: string;
}

const initialState: PrivacyState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

const privacyReducer = (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: PrivacyState = initialState,
  action: PrivacyAction,
): PrivacyState => {
  const newHosts = { ...state.approvedHosts };
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
