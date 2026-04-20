import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger';

describe('getMultichainTransactionsControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to MultichainTransactionsController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger =
      getMultichainTransactionsControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger =
      getMultichainTransactionsControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
