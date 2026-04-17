import networkOnboardReducer, { initialState } from './index';

describe('networkSelector reducer', () => {
  it('returns initial state', () => {
    expect(networkOnboardReducer(undefined, undefined as any)).toEqual(initialState);
  });

  it('handles SHOW_NETWORK_ONBOARDING', () => {
    const action = {
      type: 'SHOW_NETWORK_ONBOARDING',
      showNetworkOnboarding: true,
      nativeToken: 'ETH',
      networkType: 'mainnet',
      networkUrl: 'https://mainnet.infura.io',
    } as any;
    const result = networkOnboardReducer(initialState, action);
    expect(result.networkState).toEqual({
      showNetworkOnboarding: true,
      nativeToken: 'ETH',
      networkType: 'mainnet',
      networkUrl: 'https://mainnet.infura.io',
    });
  });

  it('handles NETWORK_SWITCHED', () => {
    const action = {
      type: 'NETWORK_SWITCHED',
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    } as any;
    const result = networkOnboardReducer(initialState, action);
    expect(result.switchedNetwork).toEqual({
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    });
  });

  it('handles NETWORK_ONBOARDED', () => {
    const action = {
      type: 'NETWORK_ONBOARDED',
      payload: 'mainnet',
    } as any;
    const result = networkOnboardReducer(initialState, action);
    expect(result.networkOnboardedState).toEqual({ mainnet: true });
    expect(result.networkState.showNetworkOnboarding).toBe(false);
  });

  it('handles unknown action type', () => {
    const action = { type: 'UNKNOWN' } as any;
    const result = networkOnboardReducer(initialState, action);
    expect(result).toEqual(initialState);
  });

  it('accumulates onboarded networks', () => {
    let state = initialState;
    state = networkOnboardReducer(state, { type: 'NETWORK_ONBOARDED', payload: 'mainnet' } as any);
    state = networkOnboardReducer(state, { type: 'NETWORK_ONBOARDED', payload: 'polygon' } as any);
    expect(state.networkOnboardedState).toEqual({ mainnet: true, polygon: true });
  });
});
