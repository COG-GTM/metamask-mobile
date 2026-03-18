import { InfuraAvailabilityAction } from '../../actions/infuraAvailability';

export interface InfuraAvailabilityState {
  isBlocked: boolean;
}

const initialState: InfuraAvailabilityState = {
  isBlocked: false,
};

export const INFURA_AVAILABILITY_BLOCKED = 'INFURA_AVAILABILITY_BLOCKED';
export const INFURA_AVAILABILITY_NOT_BLOCKED =
  'INFURA_AVAILABILITY_NOT_BLOCKED';

// TODO: type this properly with RootState once all reducers are typed
export const getInfuraBlockedSelector = (state: { infuraAvailability?: InfuraAvailabilityState }) =>
  state.infuraAvailability?.isBlocked;

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
