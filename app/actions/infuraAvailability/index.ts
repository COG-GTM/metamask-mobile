import { type Action } from 'redux';
import {
  InfuraAvailabilityActionType,
} from '../../reducers/infuraAvailability';

export type SetInfuraAvailabilityBlockedAction =
  Action<typeof InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED>;

export type SetInfuraAvailabilityNotBlockedAction =
  Action<typeof InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED>;

/**
 * Union type for infura availability actions
 */
export type InfuraAvailabilityAction =
  | SetInfuraAvailabilityBlockedAction
  | SetInfuraAvailabilityNotBlockedAction;

export function setInfuraAvailabilityBlocked(): SetInfuraAvailabilityBlockedAction {
  return {
    type: InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): SetInfuraAvailabilityNotBlockedAction {
  return {
    type: InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
