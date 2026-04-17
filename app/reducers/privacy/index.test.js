import privacyReducer from './index';

const initialState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

describe('privacy reducer', () => {
  it('returns initial state', () => {
    expect(privacyReducer(undefined, {})).toEqual(initialState);
  });

  it('handles APPROVE_HOST', () => {
    const result = privacyReducer(initialState, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
    expect(result.approvedHosts).toEqual({ 'example.com': true });
  });

  it('handles multiple APPROVE_HOST', () => {
    let state = initialState;
    state = privacyReducer(state, { type: 'APPROVE_HOST', hostname: 'a.com' });
    state = privacyReducer(state, { type: 'APPROVE_HOST', hostname: 'b.com' });
    expect(state.approvedHosts).toEqual({ 'a.com': true, 'b.com': true });
  });

  it('handles REJECT_HOST', () => {
    const state = { ...initialState, approvedHosts: { 'a.com': true, 'b.com': true } };
    const result = privacyReducer(state, { type: 'REJECT_HOST', hostname: 'a.com' });
    expect(result.approvedHosts).toEqual({ 'b.com': true });
  });

  it('handles CLEAR_HOSTS', () => {
    const state = { ...initialState, approvedHosts: { 'a.com': true } };
    const result = privacyReducer(state, { type: 'CLEAR_HOSTS' });
    expect(result.approvedHosts).toEqual({});
  });

  it('handles RECORD_SRP_REVEAL_TIMESTAMP', () => {
    const result = privacyReducer(initialState, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1234567890,
    });
    expect(result.revealSRPTimestamps).toEqual([1234567890]);
  });

  it('accumulates SRP reveal timestamps', () => {
    let state = initialState;
    state = privacyReducer(state, { type: 'RECORD_SRP_REVEAL_TIMESTAMP', timestamp: 100 });
    state = privacyReducer(state, { type: 'RECORD_SRP_REVEAL_TIMESTAMP', timestamp: 200 });
    expect(state.revealSRPTimestamps).toEqual([100, 200]);
  });

  it('returns same state for unknown action', () => {
    const result = privacyReducer(initialState, { type: 'UNKNOWN' });
    expect(result).toEqual(initialState);
  });
});
