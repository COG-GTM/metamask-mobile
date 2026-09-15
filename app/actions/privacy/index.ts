import { type Action } from 'redux';

export enum PrivacyActionType {
  APPROVE_HOST = 'APPROVE_HOST',
  REJECT_HOST = 'REJECT_HOST',
  CLEAR_HOSTS = 'CLEAR_HOSTS',
  RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP',
}

export type ApproveHostAction = Action<PrivacyActionType.APPROVE_HOST> & {
  hostname: string;
};

export type RejectHostAction = Action<PrivacyActionType.REJECT_HOST> & {
  hostname: string;
};

export type ClearHostsAction = Action<PrivacyActionType.CLEAR_HOSTS>;

export type RecordSRPRevealTimestampAction =
  Action<PrivacyActionType.RECORD_SRP_REVEAL_TIMESTAMP> & {
    timestamp: string;
  };

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: PrivacyActionType.APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: PrivacyActionType.REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(
  timestamp: string,
): RecordSRPRevealTimestampAction {
  return {
    type: PrivacyActionType.RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
