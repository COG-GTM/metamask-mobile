import privacyReducer from './index';

describe('privacyReducer', () => {
  it('returns initial state', () => {
    expect(privacyReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual({
      approvedHosts: {},
      revealSRPTimestamps: [],
    });
  });

  it('approves a host', () => {
    const state = privacyReducer(undefined, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
    expect(state.approvedHosts['example.com']).toBe(true);
  });

  it('rejects a host', () => {
    const firstState = privacyReducer(undefined, {
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
    const secondState = privacyReducer(firstState, {
      type: 'REJECT_HOST',
      hostname: 'example.com',
    });
    expect(secondState.approvedHosts['example.com']).toBeUndefined();
  });

  it('records SRP reveal timestamp', () => {
    const state = privacyReducer(undefined, {
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 12345,
    });
    expect(state.revealSRPTimestamps).toEqual([12345]);
  });
});
