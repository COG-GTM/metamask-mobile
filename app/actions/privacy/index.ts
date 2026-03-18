export interface ApproveHostAction {
  type: 'APPROVE_HOST';
  hostname: string;
}

export interface RejectHostAction {
  type: 'REJECT_HOST';
  hostname: string;
}

export interface ClearHostsAction {
  type: 'CLEAR_HOSTS';
}

export interface RecordSRPRevealTimestampAction {
  type: 'RECORD_SRP_REVEAL_TIMESTAMP';
  timestamp: number;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: 'APPROVE_HOST',
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: 'REJECT_HOST',
    hostname,
  };
}

export function recordSRPRevealTimestamp(timestamp: number): RecordSRPRevealTimestampAction {
  return {
    type: 'RECORD_SRP_REVEAL_TIMESTAMP',
    timestamp,
  };
}
