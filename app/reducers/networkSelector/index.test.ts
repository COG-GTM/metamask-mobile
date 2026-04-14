import networkOnboardReducer, { initialState } from '.';

describe('NetworkSelector Reducer', () => {
  it('should return initial state', () => {
    expect(networkOnboardReducer(undefined, undefined)).toStrictEqual(initialState);
  });

  it('should handle SHOW_NETWORK_ONBOARDING', () => {
    const result = networkOnboardReducer(initialState, {
      type: 'SHOW_NETWORK_ONBOARDING',
      showNetworkOnboarding: true,
      nativeToken: 'MATIC',
      networkType: 'Polygon',
      networkUrl: 'https://polygon-rpc.com',
      networkStatus: false,
      payload: undefined,
    });

    expect(result.networkState).toStrictEqual({
      showNetworkOnboarding: true,
      nativeToken: 'MATIC',
      networkType: 'Polygon',
      networkUrl: 'https://polygon-rpc.com',
    });
  });

  it('should handle NETWORK_SWITCHED', () => {
    const result = networkOnboardReducer(initialState, {
      type: 'NETWORK_SWITCHED',
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
      nativeToken: '',
      networkType: '',
      showNetworkOnboarding: false,
      payload: undefined,
    });

    expect(result.switchedNetwork).toStrictEqual({
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    });
  });

  it('should handle NETWORK_ONBOARDED', () => {
    const result = networkOnboardReducer(initialState, {
      type: 'NETWORK_ONBOARDED',
      payload: '0x89',
      nativeToken: '',
      networkType: '',
      networkUrl: '',
      networkStatus: false,
      showNetworkOnboarding: false,
    });

    expect(result.networkOnboardedState).toStrictEqual({ '0x89': true });
    expect(result.networkState.showNetworkOnboarding).toBe(false);
  });

  it('should return state for unknown action', () => {
    expect(
      networkOnboardReducer(initialState, {
        type: 'UNKNOWN',
        nativeToken: '',
        networkType: '',
        networkUrl: '',
        networkStatus: false,
        showNetworkOnboarding: false,
        payload: undefined,
      }),
    ).toStrictEqual(initialState);
  });
});
