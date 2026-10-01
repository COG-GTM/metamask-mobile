/* eslint-disable @typescript-eslint/default-param-last */
import { RootState } from '..';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

export const getInfuraBlockedSelector = (state: RootState) =>
  state.infuraAvailability?.isBlocked;

interface InfuraBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAction = InfuraBlockedAction | InfuraNotBlockedAction;

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: InfuraAction,
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
