import {
  InfuraAvailabilityActionType,
  type InfuraAvailabilityBlockedAction,
  type InfuraAvailabilityNotBlockedAction,
} from './types';

export * from './types';

export function setInfuraAvailabilityBlocked(): InfuraAvailabilityBlockedAction {
  return {
    type: InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): InfuraAvailabilityNotBlockedAction {
  return {
    type: InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
