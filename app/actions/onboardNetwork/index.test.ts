import {
  onboardNetworkAction,
  networkSwitched,
  showNetworkOnboardingAction,
} from './index';

describe('onboardNetwork actions', () => {
  it('onboardNetworkAction creates correct action', () => {
    expect(onboardNetworkAction('0x1')).toEqual({
      type: 'NETWORK_ONBOARDED',
      payload: '0x1',
    });
  });

  it('networkSwitched creates correct action', () => {
    expect(networkSwitched({
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    })).toEqual({
      type: 'NETWORK_SWITCHED',
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    });
  });

  it('showNetworkOnboardingAction creates correct action', () => {
    expect(showNetworkOnboardingAction({
      networkUrl: 'https://polygon-rpc.com',
      networkType: 'polygon',
      nativeToken: 'MATIC',
      showNetworkOnboarding: true,
    })).toEqual({
      type: 'SHOW_NETWORK_ONBOARDING',
      networkUrl: 'https://polygon-rpc.com',
      networkType: 'polygon',
      nativeToken: 'MATIC',
      showNetworkOnboarding: true,
    });
  });
});
