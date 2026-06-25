import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
  SetInfuraAvailabilityBlockedAction,
  SetInfuraAvailabilityNotBlockedAction,
} from '../../reducers/infuraAvailability';

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
