import infuraAvailabilityReducer, {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from './index';

describe('infuraAvailabilityReducer', () => {
  it('returns initial state', () => {
    const state = infuraAvailabilityReducer(undefined, {
      type: 'UNKNOWN',
    } as never);
    expect(state).toEqual({ isBlocked: false });
  });

  it('marks Infura as blocked', () => {
    const state = infuraAvailabilityReducer(undefined, {
      type: INFURA_AVAILABILITY_BLOCKED,
    });
    expect(state.isBlocked).toBe(true);
  });

  it('marks Infura as not blocked', () => {
    const state = infuraAvailabilityReducer(
      { isBlocked: true },
      { type: INFURA_AVAILABILITY_NOT_BLOCKED },
    );
    expect(state.isBlocked).toBe(false);
  });
});
