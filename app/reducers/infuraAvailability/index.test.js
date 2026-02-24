import infuraAvailabilityReducer, {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
  getInfuraBlockedSelector,
} from './';

const initialState = {
  isBlocked: false,
};

describe('infuraAvailabilityReducer', () => {
  it('returns initial state', () => {
    const state = infuraAvailabilityReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles INFURA_AVAILABILITY_BLOCKED', () => {
    const state = infuraAvailabilityReducer(initialState, {
      type: INFURA_AVAILABILITY_BLOCKED,
    });
    expect(state.isBlocked).toBe(true);
  });

  it('handles INFURA_AVAILABILITY_NOT_BLOCKED', () => {
    const blockedState = { isBlocked: true };
    const state = infuraAvailabilityReducer(blockedState, {
      type: INFURA_AVAILABILITY_NOT_BLOCKED,
    });
    expect(state.isBlocked).toBe(false);
  });

  it('returns current state for unknown action', () => {
    const state = infuraAvailabilityReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});

describe('getInfuraBlockedSelector', () => {
  it('returns isBlocked from state', () => {
    const state = { infuraAvailability: { isBlocked: true } };
    expect(getInfuraBlockedSelector(state)).toBe(true);
  });

  it('returns false when not blocked', () => {
    const state = { infuraAvailability: { isBlocked: false } };
    expect(getInfuraBlockedSelector(state)).toBe(false);
  });

  it('returns undefined when infuraAvailability is undefined', () => {
    const state = {};
    expect(getInfuraBlockedSelector(state)).toBeUndefined();
  });
});
