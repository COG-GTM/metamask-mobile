import type { Action as ReduxAction } from 'redux';

export enum PrivacyActionType {
  APPROVE_HOST = 'APPROVE_HOST',
  REJECT_HOST = 'REJECT_HOST',
  RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP',
}

export interface ApproveHostAction
  extends ReduxAction<PrivacyActionType.APPROVE_HOST> {
  hostname: string;
}

export interface RejectHostAction
  extends ReduxAction<PrivacyActionType.REJECT_HOST> {
  hostname: string;
}

export interface RecordSRPRevealTimestampAction
  extends ReduxAction<PrivacyActionType.RECORD_SRP_REVEAL_TIMESTAMP> {
  timestamp: number;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
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
  timestamp: number,
): RecordSRPRevealTimestampAction {
  return {
    type: PrivacyActionType.RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
