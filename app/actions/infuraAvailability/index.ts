import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from '../../reducers/infuraAvailability';

export function setInfuraAvailabilityBlocked(): {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
} {
  return {
    type: INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
} {
  return {
    type: INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
