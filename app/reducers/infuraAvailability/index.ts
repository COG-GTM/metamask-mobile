import { AnyAction } from 'redux';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

export type InfuraAvailabilityAction =
  | { type: typeof INFURA_AVAILABILITY_BLOCKED }
  | { type: typeof INFURA_AVAILABILITY_NOT_BLOCKED };

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const getInfuraBlockedSelector = (state: {
  infuraAvailability?: InfuraAvailabilityState;
}): boolean | undefined => state.infuraAvailability?.isBlocked;

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: AnyAction = { type: '' },
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
