/* eslint-disable @typescript-eslint/default-param-last */

const APPROVE_HOST = 'APPROVE_HOST' as const;
const REJECT_HOST = 'REJECT_HOST' as const;
const CLEAR_HOSTS = 'CLEAR_HOSTS' as const;
const RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP' as const;

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

interface RecordSrpRevealTimestampAction {
  type: typeof RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: number;
}

type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSrpRevealTimestampAction;

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

const initialState: Readonly<PrivacyState> = {
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
