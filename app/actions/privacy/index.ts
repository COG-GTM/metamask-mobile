import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  APPROVE_HOST = 'APPROVE_HOST',
  REJECT_HOST = 'REJECT_HOST',
  CLEAR_HOSTS = 'CLEAR_HOSTS',
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

export interface ClearHostsAction
  extends ReduxAction<ActionType.CLEAR_HOSTS> {}

export interface RecordSRPRevealTimestampAction
  extends ReduxAction<ActionType.RECORD_SRP_REVEAL_TIMESTAMP> {
  timestamp: string;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | ClearHostsAction
  | RecordSRPRevealTimestampAction;

export const approveHost = (hostname: string): ApproveHostAction => ({
  type: ActionType.APPROVE_HOST,
  hostname,
});

export const rejectHost = (hostname: string): RejectHostAction => ({
  type: ActionType.REJECT_HOST,
  hostname,
});

export const clearHosts = (): ClearHostsAction => ({
  type: ActionType.CLEAR_HOSTS,
});

export const recordSRPRevealTimestamp = (
  timestamp: string,
): RecordSRPRevealTimestampAction => ({
  type: ActionType.RECORD_SRP_REVEAL_TIMESTAMP,
  timestamp,
});
