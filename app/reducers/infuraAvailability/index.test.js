import infuraAvailabilityReducer, {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
  getInfuraBlockedSelector,
} from '.';

describe('InfuraAvailability Reducer', () => {
  const initialState = { isBlocked: false };

  it('should return initial state', () => {
    expect(infuraAvailabilityReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle INFURA_AVAILABILITY_BLOCKED', () => {
    const result = infuraAvailabilityReducer(initialState, {
      type: INFURA_AVAILABILITY_BLOCKED,
    });

    expect(result.isBlocked).toBe(true);
  });

  it('should handle INFURA_AVAILABILITY_NOT_BLOCKED', () => {
    const blockedState = { isBlocked: true };
    const result = infuraAvailabilityReducer(blockedState, {
      type: INFURA_AVAILABILITY_NOT_BLOCKED,
    });

    expect(result.isBlocked).toBe(false);
  });

  it('should return state for unknown action', () => {
    expect(infuraAvailabilityReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });

  describe('getInfuraBlockedSelector', () => {
    it('should return isBlocked from state', () => {
      expect(getInfuraBlockedSelector({ infuraAvailability: { isBlocked: true } })).toBe(true);
      expect(getInfuraBlockedSelector({ infuraAvailability: { isBlocked: false } })).toBe(false);
    });
  });
});
