import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getCurrencyRateControllerMessenger } from './currency-rate-controller-messenger';

describe('getCurrencyRateControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to CurrencyRateController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getCurrencyRateControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getCurrencyRateControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
