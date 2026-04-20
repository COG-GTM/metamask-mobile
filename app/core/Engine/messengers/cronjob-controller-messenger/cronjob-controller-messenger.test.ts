import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getCronjobControllerMessenger } from './cronjob-controller-messenger';

describe('getCronjobControllerMessenger', () => {
  it('returns a RestrictedMessenger scoped to CronjobController', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getCronjobControllerMessenger(baseMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('exposes the standard messenger methods', () => {
    const baseMessenger = new ExtendedControllerMessenger();
    const messenger = getCronjobControllerMessenger(baseMessenger);

    (['call', 'subscribe', 'publish', 'unsubscribe'] as const).forEach(
      (method) => {
        expect(typeof (messenger as unknown as Record<string, unknown>)[method]).toBe(
          'function',
        );
      },
    );
  });
});
