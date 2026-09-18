import infuraAvailabilityReducer, {
  getInfuraBlockedSelector,
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from './index';
import {
  setInfuraAvailabilityBlocked,
  setInfuraAvailabilityNotBlocked,
} from '../../actions/infuraAvailability';

describe('infuraAvailabilityReducer', () => {
  it('returns the initial state', () => {
    expect(infuraAvailabilityReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      isBlocked: false,
    });
  });

  it('sets blocked and not blocked', () => {
    let state = infuraAvailabilityReducer(
      undefined,
      setInfuraAvailabilityBlocked(),
    );
    expect(state.isBlocked).toBe(true);
    state = infuraAvailabilityReducer(state, setInfuraAvailabilityNotBlocked());
    expect(state.isBlocked).toBe(false);
  });

  it('creates actions', () => {
    expect(setInfuraAvailabilityBlocked()).toEqual({
      type: INFURA_AVAILABILITY_BLOCKED,
    });
    expect(setInfuraAvailabilityNotBlocked()).toEqual({
      type: INFURA_AVAILABILITY_NOT_BLOCKED,
    });
  });

  describe('getInfuraBlockedSelector', () => {
    it('returns the blocked flag', () => {
      expect(
        getInfuraBlockedSelector({ infuraAvailability: { isBlocked: true } }),
      ).toBe(true);
    });

    it('returns undefined when the slice is missing', () => {
      expect(getInfuraBlockedSelector({})).toBeUndefined();
    });
  });
});
