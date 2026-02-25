import { Action } from 'redux';
import { RootState } from '..';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

interface InfuraBlockedAction extends Action<typeof INFURA_AVAILABILITY_BLOCKED> {}
interface InfuraNotBlockedAction extends Action<typeof INFURA_AVAILABILITY_NOT_BLOCKED> {}

type InfuraAvailabilityAction = InfuraBlockedAction | InfuraNotBlockedAction;

export const getInfuraBlockedSelector = (state: RootState): boolean | undefined =>
  state.infuraAvailability?.isBlocked;

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

const infuraAvailabilityReducer = (
  state: InfuraAvailabilityState = initialState,
  action: InfuraAvailabilityAction = { type: INFURA_AVAILABILITY_NOT_BLOCKED },
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
