import reducer, {
  networkIdUpdated,
  networkIdWillUpdate,
  initialState,
  NETWORK_ID_LOADING,
} from './index';

describe('inpageProvider slice', () => {
  it('has correct initial state', () => {
    expect(initialState).toEqual({ networkId: 'loading' });
  });

  it('exports NETWORK_ID_LOADING constant', () => {
    expect(NETWORK_ID_LOADING).toBe('loading');
  });

  it('returns initial state for unknown action', () => {
    const result = reducer(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual({ networkId: 'loading' });
  });

  it('updates network ID', () => {
    const result = reducer(initialState, networkIdUpdated('1'));
    expect(result.networkId).toBe('1');
  });

  it('sets network ID to loading on willUpdate', () => {
    const state = { networkId: '1' };
    const result = reducer(state, networkIdWillUpdate());
    expect(result.networkId).toBe('loading');
  });

  it('handles multiple updates', () => {
    let state = reducer(initialState, networkIdUpdated('1'));
    expect(state.networkId).toBe('1');
    state = reducer(state, networkIdUpdated('137'));
    expect(state.networkId).toBe('137');
  });
});
