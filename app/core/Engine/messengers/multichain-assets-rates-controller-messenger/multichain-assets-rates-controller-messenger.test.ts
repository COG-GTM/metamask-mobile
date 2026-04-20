import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';

describe('getMultichainAssetsRatesControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to MultichainAssetsRatesController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
