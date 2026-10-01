/* eslint-disable @typescript-eslint/default-param-last */
import { RootState } from '..';

// TODO: import from actions when migrated
export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

type InfuraBlockedAction = {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
};

type InfuraNotBlockedAction = {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
};

type InfuraAvailabilityAction = InfuraBlockedAction | InfuraNotBlockedAction;

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const getInfuraBlockedSelector = (state: RootState) =>
  state.infuraAvailability?.isBlocked;

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
