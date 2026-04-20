import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger';

describe('getMultichainAssetsControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to MultichainAssetsController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainAssetsControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainAssetsControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
