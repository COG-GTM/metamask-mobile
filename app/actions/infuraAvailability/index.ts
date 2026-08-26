export const INFURA_AVAILABILITY_BLOCKED =
  'INFURA_AVAILABILITY_BLOCKED' as const;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED' as const;

interface InfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type Action =
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
