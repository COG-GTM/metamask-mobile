import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  APPROVE_HOST = 'APPROVE_HOST',
  REJECT_HOST = 'REJECT_HOST',
  RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP',
}

export interface ApproveHostAction
  extends ReduxAction<ActionType.APPROVE_HOST> {
  hostname: string;
}

export interface RejectHostAction
  extends ReduxAction<ActionType.REJECT_HOST> {
  hostname: string;
}

export interface RecordSRPRevealTimestampAction
  extends ReduxAction<ActionType.RECORD_SRP_REVEAL_TIMESTAMP> {
  timestamp: number | string;
}

export type Action =
  | ApproveHostAction
  | RejectHostAction
  | RecordSRPRevealTimestampAction;

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: ActionType.APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: ActionType.REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(
  timestamp: number | string,
): RecordSRPRevealTimestampAction {
  return {
    type: ActionType.RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
