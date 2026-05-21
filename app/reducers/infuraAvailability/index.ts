/* eslint-disable @typescript-eslint/default-param-last */

export const INFURA_AVAILABILITY_BLOCKED =
  'INFURA_AVAILABILITY_BLOCKED' as const;
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED' as const;

interface InfuraBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAvailabilityAction = InfuraBlockedAction | InfuraNotBlockedAction;

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

const initialState: Readonly<InfuraAvailabilityState> = {
  isBlocked: false,
};

export const getInfuraBlockedSelector = (state: {
  infuraAvailability?: InfuraAvailabilityState;
}): boolean | undefined => state.infuraAvailability?.isBlocked;

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
