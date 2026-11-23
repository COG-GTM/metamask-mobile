export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

export interface PrivacyAction {
  type: string;
  hostname?: string;
  timestamp?: number;
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
        revealSRPTimestamps: [
          ...state.revealSRPTimestamps,
          action.timestamp as number,
        ],
      };
    default:
      return state;
  }
};

export default privacyReducer;
