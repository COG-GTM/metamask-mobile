import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
  InfuraAvailabilityAction,
} from '../../reducers/infuraAvailability';

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
