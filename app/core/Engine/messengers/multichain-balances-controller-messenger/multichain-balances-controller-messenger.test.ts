import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger';

describe('getMultichainBalancesControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to MultichainBalancesController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainBalancesControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getMultichainBalancesControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
