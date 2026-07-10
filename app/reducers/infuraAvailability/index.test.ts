import infuraAvailabilityReducer, { InfuraAvailabilityState } from './index';
import type { InfuraAvailabilityAction } from '../../actions/infuraAvailability';

const emptyAction = { type: null } as unknown as InfuraAvailabilityAction;

describe('infuraAvailabilityReducer', () => {
  it('should return initial state', () => {
    const initialState: InfuraAvailabilityState = {
      isBlocked: false,
    };
    expect(infuraAvailabilityReducer(undefined, emptyAction)).toEqual(
      initialState,
    );
  });
});
