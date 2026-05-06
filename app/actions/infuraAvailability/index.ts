import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED',
  INFURA_AVAILABILITY_NOT_BLOCKED = 'INFURA_AVAILABILITY_NOT_BLOCKED',
}

export interface InfuraAvailabilityBlockedAction
  extends ReduxAction<ActionType.INFURA_AVAILABILITY_BLOCKED> {}

export interface InfuraAvailabilityNotBlockedAction
  extends ReduxAction<ActionType.INFURA_AVAILABILITY_NOT_BLOCKED> {}

export type Action =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

export function setInfuraAvailabilityBlocked(): InfuraAvailabilityBlockedAction {
  return {
    type: ActionType.INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): InfuraAvailabilityNotBlockedAction {
  return {
    type: ActionType.INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
