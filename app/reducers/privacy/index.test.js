import privacyReducer from './';

const initialState = {
  approvedHosts: {},
  revealSRPTimestamps: [],
};

describe('privacyReducer', () => {
  it('returns initial state', () => {
    const state = privacyReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles APPROVE_HOST', () => {
    const state = privacyReducer(initialState, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
    expect(state.approvedHosts).toEqual({ 'example.com': true });
  });

  it('handles multiple APPROVE_HOST', () => {
    let state = privacyReducer(initialState, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
    state = privacyReducer(state, {
      type: 'APPROVE_HOST',
      hostname: 'metamask.io',
    });
    expect(state.approvedHosts).toEqual({
      'example.com': true,
      'metamask.io': true,
    });
  });

  it('handles REJECT_HOST', () => {
    const stateWithHost = {
      ...initialState,
      approvedHosts: { 'example.com': true, 'metamask.io': true },
    };
    const state = privacyReducer(stateWithHost, {
      type: 'REJECT_HOST',
      hostname: 'example.com',
    });
    expect(state.approvedHosts).toEqual({ 'metamask.io': true });
  });

  it('handles REJECT_HOST for non-existent host', () => {
    const state = privacyReducer(initialState, {
      type: 'REJECT_HOST',
      hostname: 'nonexistent.com',
    });
    expect(state.approvedHosts).toEqual({});
  });

  it('handles CLEAR_HOSTS', () => {
    const stateWithHosts = {
      ...initialState,
      approvedHosts: { 'example.com': true, 'metamask.io': true },
    };
    const state = privacyReducer(stateWithHosts, { type: 'CLEAR_HOSTS' });
    expect(state.approvedHosts).toEqual({});
  });

  it('handles RECORD_SRP_REVEAL_TIMESTAMP', () => {
    const state = privacyReducer(initialState, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1234567890,
    });
    expect(state.revealSRPTimestamps).toEqual([1234567890]);
  });

  it('handles multiple RECORD_SRP_REVEAL_TIMESTAMP', () => {
    let state = privacyReducer(initialState, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1000,
    });
    state = privacyReducer(state, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 2000,
    });
    expect(state.revealSRPTimestamps).toEqual([1000, 2000]);
  });

  it('returns current state for unknown action', () => {
    const state = privacyReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});
