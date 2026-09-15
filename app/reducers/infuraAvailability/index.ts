import type { RootState } from '..';
import type { InfuraAvailabilityAction } from '../../actions/infuraAvailability';

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

/* eslint-disable @typescript-eslint/default-param-last */
const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: InfuraAvailabilityAction | Record<'type', null>,
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
