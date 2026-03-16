interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

interface RootState {
  infuraAvailability?: InfuraAvailabilityState;
  [key: string]: unknown;
}

export const getInfuraBlockedSelector = (state: RootState): boolean | undefined =>
  state.infuraAvailability?.isBlocked;

interface InfuraBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAvailabilityAction = InfuraBlockedAction | InfuraNotBlockedAction;

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

/* eslint-disable @typescript-eslint/default-param-last */
const infuraAvailabilityReducer = (state: InfuraAvailabilityState = initialState, action: InfuraAvailabilityAction): InfuraAvailabilityState => {
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
