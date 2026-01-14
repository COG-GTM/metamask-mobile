export const APPROVE_HOST = 'APPROVE_HOST';
export const REJECT_HOST = 'REJECT_HOST';
export const CLEAR_HOSTS = 'CLEAR_HOSTS';
export const RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

interface ApproveHostAction {
  type: typeof APPROVE_HOST;
  hostname: string;
}

interface RejectHostAction {
  type: typeof REJECT_HOST;
  hostname: string;
}

interface ClearHostsAction {
  type: typeof CLEAR_HOSTS;
}

interface RecordSRPRevealTimestampAction {
  type: typeof RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: number;
}

type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

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
