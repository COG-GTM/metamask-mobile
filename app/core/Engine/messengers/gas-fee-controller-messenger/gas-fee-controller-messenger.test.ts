import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getGasFeeControllerMessenger } from './gas-fee-controller-messenger';

describe('getGasFeeControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to GasFeeController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getGasFeeControllerMessenger(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseMessenger as unknown as any,
    );

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getGasFeeControllerMessenger(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseMessenger as unknown as any,
    );

    (['call', 'subscribe', 'publish'] as const).forEach((method) => {
      expect(
        typeof (messenger as unknown as Record<string, unknown>)[method],
      ).toBe('function');
    });
  });
});
