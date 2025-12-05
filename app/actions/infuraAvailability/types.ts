import { type Action } from 'redux';

/**
 * Infura availability action type enum
 */
export enum InfuraAvailabilityActionType {
  INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED',
  INFURA_AVAILABILITY_NOT_BLOCKED = 'INFURA_AVAILABILITY_NOT_BLOCKED',
}

export type InfuraAvailabilityBlockedAction =
  Action<InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED>;

export type InfuraAvailabilityNotBlockedAction =
  Action<InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED>;

/**
 * Infura availability action union type
 */
export type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;
