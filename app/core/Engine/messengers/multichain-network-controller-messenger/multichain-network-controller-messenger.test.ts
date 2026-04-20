import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger';

describe('getMultichainNetworkControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to MultichainNetworkController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainNetworkControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainNetworkControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
