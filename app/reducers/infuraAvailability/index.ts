/* eslint-disable @typescript-eslint/default-param-last */
import type { AnyAction } from 'redux';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

interface InfuraBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type InfuraAvailabilityAction =
  | InfuraBlockedAction
  | InfuraNotBlockedAction;

export const getInfuraBlockedSelector = (state: {
  infuraAvailability?: InfuraAvailabilityState;
}): boolean | undefined => state.infuraAvailability?.isBlocked;

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: AnyAction,
): InfuraAvailabilityState => {
  switch (action.type) {
    case INFURA_AVAILABILITY_BLOCKED:
      return {
        ...state,
        isBlocked: true,
      };
    case INFURA_AVAILABILITY_NOT_BLOCKED:
      return {
        ...state,
        isBlocked: false,
      };
    default:
      return state;
  }
};
export default infuraAvailabilityReducer;
