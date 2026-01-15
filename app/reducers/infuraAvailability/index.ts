import { Reducer } from 'redux';
import type { RootState } from '..';

/**
 * State shape for the infuraAvailability reducer
 */
export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

/**
 * Action types for infuraAvailability
 */
export const ACTIONS = {
  INFURA_AVAILABILITY_BLOCKED: 'INFURA_AVAILABILITY_BLOCKED',
  INFURA_AVAILABILITY_NOT_BLOCKED: 'INFURA_AVAILABILITY_NOT_BLOCKED',
} as const;

export const INFURA_AVAILABILITY_BLOCKED = ACTIONS.INFURA_AVAILABILITY_BLOCKED;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  ACTIONS.INFURA_AVAILABILITY_NOT_BLOCKED;

interface InfuraAvailabilityBlockedAction {
  type: typeof ACTIONS.INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof ACTIONS.INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

export const getInfuraBlockedSelector = (state: RootState): boolean =>
  state.infuraAvailability?.isBlocked ?? false;

export const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

const infuraAvailabilityReducer: Reducer<
  InfuraAvailabilityState,
  InfuraAvailabilityAction | { type: string }
> = (state = initialState, action): InfuraAvailabilityState => {
  switch (action.type) {
    case ACTIONS.INFURA_AVAILABILITY_BLOCKED:
      return {
        ...state,
        isBlocked: true,
      };
    case ACTIONS.INFURA_AVAILABILITY_NOT_BLOCKED:
      return {
        ...state,
        isBlocked: false,
      };
    default:
      return state;
  }
};

export default infuraAvailabilityReducer;
