export const PrivacyActionTypes = {
  APPROVE_HOST: 'APPROVE_HOST',
  REJECT_HOST: 'REJECT_HOST',
  CLEAR_HOSTS: 'CLEAR_HOSTS',
  RECORD_SRP_REVEAL_TIMESTAMP: 'RECORD_SRP_REVEAL_TIMESTAMP',
} as const;

export interface ApproveHostAction {
  type: typeof PrivacyActionTypes.APPROVE_HOST;
  hostname: string;
}

export interface RejectHostAction {
  type: typeof PrivacyActionTypes.REJECT_HOST;
  hostname: string;
}

export interface ClearHostsAction {
  type: typeof PrivacyActionTypes.CLEAR_HOSTS;
}

export interface RecordSRPRevealTimestampAction {
  type: typeof PrivacyActionTypes.RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: number;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: PrivacyActionTypes.APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: PrivacyActionTypes.REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(
  timestamp: number,
): RecordSRPRevealTimestampAction {
  return {
    type: PrivacyActionTypes.RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
