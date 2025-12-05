import {
  type InfuraAvailabilityAction,
  InfuraAvailabilityActionType,
} from '../../actions/infuraAvailability/types';
import { InfuraAvailabilityState } from './types';

export * from './types';

export * from './selectors';

/**
 * Initial infura availability state
 */
export const initialInfuraAvailabilityState: InfuraAvailabilityState = {
  isBlocked: false,
};

/**
 * Infura availability reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialInfuraAvailabilityState,
  action: InfuraAvailabilityAction,
): InfuraAvailabilityState => {
  switch (action.type) {
    case InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED:
      return {
        ...state,
        isBlocked: true,
      };
    case InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED:
      return {
        ...state,
        isBlocked: false,
      };
    default:
      return state;
  }
};

export default infuraAvailabilityReducer;
