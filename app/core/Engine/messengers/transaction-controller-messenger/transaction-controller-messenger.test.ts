import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
} from './transaction-controller-messenger';

describe('transaction-controller-messenger', () => {
  describe('getTransactionControllerMessenger', () => {
    it('returns a RestrictedMessenger scoped to TransactionController', () => {
      const baseMessenger = new ExtendedControllerMessenger();
      const messenger = getTransactionControllerMessenger(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseMessenger as unknown as any,
      );

      expect(messenger).toBeInstanceOf(RestrictedMessenger);
    });
  });

  describe('getTransactionControllerInitMessenger', () => {
    it('returns a RestrictedMessenger scoped to TransactionControllerInit', () => {
      const baseMessenger = new ExtendedControllerMessenger();
      const messenger = getTransactionControllerInitMessenger(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseMessenger as unknown as any,
      );

      expect(messenger).toBeInstanceOf(RestrictedMessenger);
    });

    it('exposes the standard messenger methods', () => {
      const baseMessenger = new ExtendedControllerMessenger();
      const messenger = getTransactionControllerInitMessenger(
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
});
