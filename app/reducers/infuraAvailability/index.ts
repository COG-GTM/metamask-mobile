/* eslint-disable @typescript-eslint/default-param-last */

/**
 * Infura availability action type constants
 */
export const InfuraAvailabilityActionType = {
  INFURA_AVAILABILITY_BLOCKED: 'INFURA_AVAILABILITY_BLOCKED',
  INFURA_AVAILABILITY_NOT_BLOCKED: 'INFURA_AVAILABILITY_NOT_BLOCKED',
} as const;

export const INFURA_AVAILABILITY_BLOCKED = InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED;
export const INFURA_AVAILABILITY_NOT_BLOCKED = InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED;

/**
 * Infura availability state interface
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InfuraAvailabilityState = {
  isBlocked: boolean;
};

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getInfuraBlockedSelector = (state: any) =>
  state.infuraAvailability?.isBlocked;

interface InfuraAvailabilityBlockedAction {
  type: typeof InfuraAvailabilityActionType.INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof InfuraAvailabilityActionType.INFURA_AVAILABILITY_NOT_BLOCKED;
}

type InfuraAvailabilityAction =
  | InfuraAvailabilityBlockedAction
  | InfuraAvailabilityNotBlockedAction;

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
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
