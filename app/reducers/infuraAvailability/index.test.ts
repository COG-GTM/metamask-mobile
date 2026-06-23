import infuraAvailabilityReducer, { initialState } from '.';
import {
  setInfuraAvailabilityBlocked,
  setInfuraAvailabilityNotBlocked,
} from '../../actions/infuraAvailability';

describe('infuraAvailabilityReducer', () => {
  it('returns the initial state by default', () => {
    expect(
      infuraAvailabilityReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual(initialState);
  });

  it('handles INFURA_AVAILABILITY_BLOCKED', () => {
    expect(
      infuraAvailabilityReducer(initialState, setInfuraAvailabilityBlocked()),
    ).toEqual({ isBlocked: true });
  });

  it('handles INFURA_AVAILABILITY_NOT_BLOCKED', () => {
    expect(
      infuraAvailabilityReducer(
        { isBlocked: true },
        setInfuraAvailabilityNotBlocked(),
      ),
    ).toEqual({ isBlocked: false });
  });
});
