/* eslint-disable @typescript-eslint/default-param-last */
import type { RootState } from '..';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

export const getInfuraBlockedSelector = (state: RootState) =>
  state.infuraAvailability?.isBlocked;

interface InfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: InfuraAvailabilityAction,
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
