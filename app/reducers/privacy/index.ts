const initialState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

interface PrivacyAction {
  type: string;
  hostname?: string;
  timestamp?: number;
}

const privacyReducer = (state = initialState, action: PrivacyAction) => {
  const newHosts: Record<string, boolean> = { ...state.approvedHosts };
  switch (action.type) {
    case 'APPROVE_HOST':
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [action.hostname!]: true,
        },
      };
    case 'REJECT_HOST':
      delete newHosts[action.hostname!];
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
