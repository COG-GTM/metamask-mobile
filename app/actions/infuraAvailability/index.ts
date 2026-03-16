import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from '../../reducers/infuraAvailability';

interface SetInfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface SetInfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type InfuraAvailabilityActionTypes = SetInfuraAvailabilityBlockedAction | SetInfuraAvailabilityNotBlockedAction;

export function setInfuraAvailabilityBlocked(): SetInfuraAvailabilityBlockedAction {
  return {
    type: INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): SetInfuraAvailabilityNotBlockedAction {
  return {
    type: INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
