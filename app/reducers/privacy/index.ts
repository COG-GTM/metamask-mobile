import { Action } from 'redux';

export interface PrivacyState {
  approvedHosts: Record<string, boolean>;
  revealSRPTimestamps: number[];
}

interface ApproveHostAction extends Action<'APPROVE_HOST'> {
  hostname: string;
}

interface RejectHostAction extends Action<'REJECT_HOST'> {
  hostname: string;
}

interface ClearHostsAction extends Action<'CLEAR_HOSTS'> {}

interface RecordSRPRevealTimestampAction extends Action<'RECORD_SRP_REVEAL_TIMESTAMP'> {
  timestamp: number;
}

type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction
  | Action<string>;

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
    case 'APPROVE_HOST':
      return {
        ...state,
        approvedHosts: {
          ...state.approvedHosts,
          [(action as ApproveHostAction).hostname]: true,
        },
      };
    case 'REJECT_HOST':
      delete newHosts[(action as RejectHostAction).hostname];
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
        revealSRPTimestamps: [...state.revealSRPTimestamps, (action as RecordSRPRevealTimestampAction).timestamp],
      };
    default:
      return state;
  }
};

export default privacyReducer;
