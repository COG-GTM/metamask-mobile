import {
  increaseLastGasPrice,
  hexGreaterThan,
  getHexGasTotal,
  addEth,
  addFiat,
  getValueFromWeiHex,
  getTransactionFee,
  formatCurrency,
  convertTokenToFiat,
  roundExponential,
} from './confirm-tx';
import BN from 'bnjs4';

describe('confirm-tx utils', () => {
  describe('increaseLastGasPrice', () => {
    it('increases the gas price by 10%', () => {
      expect(increaseLastGasPrice('0x64')).toBe('0x6e');
    });

    it('defaults to 0x0 when no gas price is provided', () => {
      expect(increaseLastGasPrice(undefined)).toBe('0x0');
    });
  });

  describe('hexGreaterThan', () => {
    it('returns true when the first value is greater', () => {
      expect(hexGreaterThan('0x2', '0x1')).toBe(true);
    });

    it('returns false when the first value is smaller or equal', () => {
      expect(hexGreaterThan('0x1', '0x2')).toBe(false);
      expect(hexGreaterThan('0x1', '0x1')).toBe(false);
    });
  });

  describe('getHexGasTotal', () => {
    it('multiplies gas limit by gas price', () => {
      expect(
        getHexGasTotal({ gasLimit: '0x5208', gasPrice: '0x3b9aca00' }),
      ).toBe('0x1319718a5000');
    });

    it('defaults missing values to 0x0', () => {
      expect(getHexGasTotal({ gasLimit: undefined, gasPrice: '0x1' })).toBe(
        '0x0',
      );
      expect(getHexGasTotal({ gasLimit: '0x1', gasPrice: undefined })).toBe(
        '0x0',
      );
    });
  });

  describe('addEth', () => {
    it('adds ETH amounts', () => {
      expect(Number(addEth('1', '2.5', '0.25'))).toBe(3.75);
    });
  });

  describe('addFiat', () => {
    it('adds fiat amounts', () => {
      expect(Number(addFiat('1.10', '2.20'))).toBe(3.3);
    });
  });

  describe('getValueFromWeiHex', () => {
    it('converts wei hex to ETH', () => {
      expect(
        Number(
          getValueFromWeiHex({
            value: '0xde0b6b3a7640000',
            toCurrency: 'ETH',
            conversionRate: 1,
            numberOfDecimals: 6,
            toDenomination: 'ETH',
          }),
        ),
      ).toBe(1);
    });

    it('converts wei hex to fiat using the conversion rate', () => {
      expect(
        Number(
          getValueFromWeiHex({
            value: '0xde0b6b3a7640000',
            toCurrency: 'usd',
            conversionRate: 2000,
            numberOfDecimals: 2,
          } as Parameters<typeof getValueFromWeiHex>[0]),
        ),
      ).toBe(2000);
    });
  });

  describe('getTransactionFee', () => {
    it('converts a BN wei value to fiat', () => {
      expect(
        Number(
          getTransactionFee({
            value: new BN('1000000000000000000'),
            toCurrency: 'usd',
            conversionRate: 1500,
            numberOfDecimals: 2,
          }),
        ),
      ).toBe(1500);
    });
  });

  describe('formatCurrency', () => {
    it('formats non ISO 4217 crypto codes with a suffix', () => {
      expect(formatCurrency('10.5', 'usdt')).toBe('10.5 USDT');
    });

    it('formats ISO 4217 currencies using Intl', () => {
      expect(formatCurrency('10', 'usd')).toBe('$10.00');
    });
  });

  describe('convertTokenToFiat', () => {
    it('returns 0 when there is no contract exchange rate', () => {
      expect(
        convertTokenToFiat({
          value: '10',
          toCurrency: 'usd',
          conversionRate: 2000,
          contractExchangeRate: undefined,
        }),
      ).toBe(0);
    });

    it('converts token amount to fiat', () => {
      expect(
        Number(
          convertTokenToFiat({
            value: '2',
            toCurrency: 'usd',
            conversionRate: 2000,
            contractExchangeRate: 0.5,
          }),
        ),
      ).toBe(2000);
    });
  });

  describe('roundExponential', () => {
    it('rounds numbers with large exponents to 4 significant digits', () => {
      expect(roundExponential('123456789012345678901234567')).toBe(
        '1.235e+26',
      );
    });

    it('returns the original value when no rounding is needed', () => {
      expect(roundExponential('12345.6789')).toBe('12345.6789');
    });
  });
});
