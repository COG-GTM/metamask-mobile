import {
  FIAT_ORDER_PROVIDERS,
  FIAT_ORDER_STATES,
  FORMATTED_NETWORK_NAMES,
  NATIVE_ADDRESS,
} from './on-ramp';

describe('on-ramp constants', () => {
  describe('FIAT_ORDER_PROVIDERS', () => {
    it('defines all provider types', () => {
      expect(FIAT_ORDER_PROVIDERS.WYRE).toBe('WYRE');
      expect(FIAT_ORDER_PROVIDERS.WYRE_APPLE_PAY).toBe('WYRE_APPLE_PAY');
      expect(FIAT_ORDER_PROVIDERS.TRANSAK).toBe('TRANSAK');
      expect(FIAT_ORDER_PROVIDERS.MOONPAY).toBe('MOONPAY');
      expect(FIAT_ORDER_PROVIDERS.AGGREGATOR).toBe('AGGREGATOR');
    });
  });

  describe('FIAT_ORDER_STATES', () => {
    it('defines all order states', () => {
      expect(FIAT_ORDER_STATES.PENDING).toBe('PENDING');
      expect(FIAT_ORDER_STATES.FAILED).toBe('FAILED');
      expect(FIAT_ORDER_STATES.COMPLETED).toBe('COMPLETED');
      expect(FIAT_ORDER_STATES.CANCELLED).toBe('CANCELLED');
      expect(FIAT_ORDER_STATES.CREATED).toBe('CREATED');
    });
  });

  describe('FORMATTED_NETWORK_NAMES', () => {
    it('is a non-empty object', () => {
      expect(Object.keys(FORMATTED_NETWORK_NAMES).length).toBeGreaterThan(0);
    });

    it('maps chain IDs to human-readable names', () => {
      Object.values(FORMATTED_NETWORK_NAMES).forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('NATIVE_ADDRESS', () => {
    it('is the zero address', () => {
      expect(NATIVE_ADDRESS).toBe(
        '0x0000000000000000000000000000000000000000',
      );
    });
  });
});
