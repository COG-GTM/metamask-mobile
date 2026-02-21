import infuraAvailabilityReducer, {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
  getInfuraBlockedSelector,
} from './';

describe('infuraAvailabilityReducer', () => {
  const initialState = {
    isBlocked: false,
  };

  it('should return the initial state', () => {
    expect(infuraAvailabilityReducer(undefined, { type: 'UNKNOWN' })).toEqual(
      initialState,
    );
  });

  it('should handle INFURA_AVAILABILITY_BLOCKED', () => {
    const result = infuraAvailabilityReducer(initialState, {
      type: INFURA_AVAILABILITY_BLOCKED,
    });
    expect(result).toEqual({ isBlocked: true });
  });

  it('should handle INFURA_AVAILABILITY_NOT_BLOCKED', () => {
    const blockedState = { isBlocked: true };
    const result = infuraAvailabilityReducer(blockedState, {
      type: INFURA_AVAILABILITY_NOT_BLOCKED,
    });
    expect(result).toEqual({ isBlocked: false });
  });

  it('should return state unchanged for unknown action', () => {
    const state = { isBlocked: true };
    expect(infuraAvailabilityReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });
});

describe('getInfuraBlockedSelector', () => {
  it('should return isBlocked when state exists', () => {
    const state = { infuraAvailability: { isBlocked: true } };
    expect(getInfuraBlockedSelector(state)).toBe(true);
  });

  it('should return false when isBlocked is false', () => {
    const state = { infuraAvailability: { isBlocked: false } };
    expect(getInfuraBlockedSelector(state)).toBe(false);
  });

  it('should return undefined when infuraAvailability is undefined', () => {
    const state = {};
    expect(getInfuraBlockedSelector(state)).toBeUndefined();
  });
});

describe('exported constants', () => {
  it('should export correct action types', () => {
    expect(INFURA_AVAILABILITY_BLOCKED).toBe('INFURA_AVAILABILITY_BLOCKED');
    expect(INFURA_AVAILABILITY_NOT_BLOCKED).toBe(
      'INFURA_AVAILABILITY_NOT_BLOCKED',
    );
  });
});
