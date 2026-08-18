import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from '../../reducers/infuraAvailability';

export interface InfuraAvailabilityAction {
  type:
    | typeof INFURA_AVAILABILITY_BLOCKED
    | typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export function setInfuraAvailabilityBlocked(): InfuraAvailabilityAction {
  return {
    type: INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): InfuraAvailabilityAction {
  return {
    type: INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
