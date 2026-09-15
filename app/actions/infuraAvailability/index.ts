import { type Action } from 'redux';
import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from '../../reducers/infuraAvailability';

export type InfuraAvailabilityBlockedAction = Action<
  typeof INFURA_AVAILABILITY_BLOCKED
>;

export type InfuraAvailabilityNotBlockedAction = Action<
  typeof INFURA_AVAILABILITY_NOT_BLOCKED
>;

export type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

export function setInfuraAvailabilityBlocked(): InfuraAvailabilityBlockedAction {
  return {
    type: INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): InfuraAvailabilityNotBlockedAction {
  return {
    type: INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
