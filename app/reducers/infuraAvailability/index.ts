/* eslint-disable @typescript-eslint/default-param-last */
import type { Action } from '../../actions/infuraAvailability';

export interface State {
  isBlocked: boolean;
}

export const initialState: State = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED' as const;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED' as const;

export const getInfuraBlockedSelector = (state: {
  infuraAvailability?: State;
}): boolean | undefined => state.infuraAvailability?.isBlocked;

const infuraAvailabilityReducer = (
  state: State = initialState,
  action: Action,
): State => {
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
