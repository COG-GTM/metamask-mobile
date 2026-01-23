import { RootState } from '../index';

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const infuraAvailabilityInitialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export interface SetInfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

export interface SetInfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export type InfuraAvailabilityAction =
  | SetInfuraAvailabilityBlockedAction
  | SetInfuraAvailabilityNotBlockedAction;

export const getInfuraBlockedSelector = (state: RootState): boolean =>
  state.infuraAvailability?.isBlocked;

/* eslint-disable @typescript-eslint/default-param-last */
const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = infuraAvailabilityInitialState,
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
