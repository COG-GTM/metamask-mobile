import type { RootState } from '..';

/**
 * State shape for the infuraAvailability reducer
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

interface InfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

export const getInfuraBlockedSelector = (state: RootState) =>
  state.infuraAvailability?.isBlocked;

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

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
