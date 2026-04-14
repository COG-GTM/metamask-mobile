import privacyReducer from '.';

describe('Privacy Reducer', () => {
  const initialState = {
    approvedHosts: {},
    revealSRPTimestamps: [],
  };

  it('should return initial state', () => {
    expect(privacyReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle APPROVE_HOST', () => {
    const result = privacyReducer(initialState, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });

    expect(result.approvedHosts).toStrictEqual({ 'example.com': true });
  });

  it('should handle REJECT_HOST', () => {
    const state = { ...initialState, approvedHosts: { 'example.com': true, 'other.com': true } };
    const result = privacyReducer(state, {
      type: 'REJECT_HOST',
      hostname: 'example.com',
    });

    expect(result.approvedHosts).toStrictEqual({ 'other.com': true });
  });

  it('should handle CLEAR_HOSTS', () => {
    const state = { ...initialState, approvedHosts: { 'a.com': true, 'b.com': true } };
    const result = privacyReducer(state, { type: 'CLEAR_HOSTS' });

    expect(result.approvedHosts).toStrictEqual({});
  });

  it('should handle RECORD_SRP_REVEAL_TIMESTAMP', () => {
    const result = privacyReducer(initialState, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1234567890,
    });

    expect(result.revealSRPTimestamps).toStrictEqual([1234567890]);
  });

  it('should return state for unknown action', () => {
    expect(privacyReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
