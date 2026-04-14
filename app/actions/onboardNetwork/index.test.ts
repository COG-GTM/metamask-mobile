import { onboardNetworkAction, networkSwitched, showNetworkOnboardingAction } from '.';

describe('OnboardNetwork Actions', () => {
  it('onboardNetworkAction should return correct action', () => {
    expect(onboardNetworkAction('0x1')).toStrictEqual({
      type: 'NETWORK_ONBOARDED',
      payload: '0x1',
    });
  });

  it('networkSwitched should return correct action', () => {
    expect(networkSwitched({
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    })).toStrictEqual({
      type: 'NETWORK_SWITCHED',
      networkUrl: 'https://mainnet.infura.io',
      networkStatus: true,
    });
  });

  it('showNetworkOnboardingAction should return correct action', () => {
    expect(showNetworkOnboardingAction({
      networkUrl: 'https://polygon-rpc.com',
      networkType: 'Polygon',
      nativeToken: 'MATIC',
      showNetworkOnboarding: true,
    })).toStrictEqual({
      type: 'SHOW_NETWORK_ONBOARDING',
      networkUrl: 'https://polygon-rpc.com',
      networkType: 'Polygon',
      nativeToken: 'MATIC',
      showNetworkOnboarding: true,
    });
  });
});
