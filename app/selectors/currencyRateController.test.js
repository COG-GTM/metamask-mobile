import {
  selectConversionRate,
  selectCurrentCurrency,
  selectCurrencyRates,
  selectConversionRateByChainId } from
'./currencyRateController';
import { isTestNet } from '../../app/util/networks';


jest.mock('../../app/util/networks', () => ({
  isTestNet: jest.fn()
}));

describe('CurrencyRateController Selectors', () => {
  const mockCurrencyRateState = {
    currencyRates: {
      ETH: { conversionRate: 3000 },
      BTC: { conversionRate: 60000 }
    },
    currentCurrency: 'USD'
  };

  describe('selectConversionRate', () => {
    const mockChainId = '1';
    const mockTicker = 'ETH';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns undefined if on a testnet and fiat is disabled', () => {
      isTestNet.mockReturnValue(true);

      const result = selectConversionRate.resultFunc(
        mockCurrencyRateState,
        mockChainId,
        mockTicker,
        false
      );
      expect(result).toBeUndefined();
    });

    it('returns the conversion rate for a valid ticker', () => {
      isTestNet.mockReturnValue(false);

      const result = selectConversionRate.resultFunc(
        mockCurrencyRateState,
        mockChainId,
        mockTicker,
        true
      );
      expect(result).toBe(3000);
    });

    it('returns undefined if no ticker is provided', () => {
      isTestNet.mockReturnValue(false);

      const result = selectConversionRate.resultFunc(
        mockCurrencyRateState,
        mockChainId,
        '',
        true
      );
      expect(result).toBeUndefined();
    });
  });

  describe('selectConversionRateByChainId', () => {
    const mockChainId = '1';
    const mockNativeCurrency = 'ETH';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns undefined if on a testnet and fiat is disabled', () => {
      isTestNet.mockReturnValue(true);

      const result = selectConversionRateByChainId.resultFunc(
        mockCurrencyRateState.currencyRates,
        mockChainId,
        false,
        mockNativeCurrency
      );

      expect(result).toBeUndefined();
    });

    it('returns the conversion rate for the native currency of the chain id', () => {
      isTestNet.mockReturnValue(false);

      const result = selectConversionRateByChainId.resultFunc(
        mockCurrencyRateState.currencyRates,
        mockChainId,
        true,
        mockNativeCurrency
      );

      expect(result).toBe(3000);
    });
  });

  describe('selectCurrentCurrency', () => {
    it('returns the current currency from the state', () => {
      const result = selectCurrentCurrency.resultFunc(
        mockCurrencyRateState
      );
      expect(result).toBe('USD');
    });

    it('returns undefined if current currency is not set', () => {
      const result = selectCurrentCurrency.resultFunc(
        {}
      );
      expect(result).toBeUndefined();
    });
  });

  describe('selectCurrencyRates', () => {
    it('returns all conversion rates from the state', () => {
      const result = selectCurrencyRates.resultFunc(
        mockCurrencyRateState
      );
      expect(result).toStrictEqual(mockCurrencyRateState.currencyRates);
    });

    it('returns undefined if conversion rates are not set', () => {
      const result = selectCurrencyRates.resultFunc(
        {}
      );
      expect(result).toBeUndefined();
    });
  });
});