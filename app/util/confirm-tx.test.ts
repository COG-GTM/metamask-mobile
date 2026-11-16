import BN4 from 'bnjs4';
import {
  addEth,
  addFiat,
  convertTokenToFiat,
  formatCurrency,
  getHexGasTotal,
  getTransactionFee,
  getValueFromWeiHex,
  hexGreaterThan,
  increaseLastGasPrice,
  roundExponential,
} from './confirm-tx';
import I18n from '../../locales/i18n';

const ONE_GWEI_HEX = '0x3b9aca00';
const ONE_ETH_IN_WEI_HEX = '0xde0b6b3a7640000';

describe('confirm-tx', () => {
  describe('getHexGasTotal', () => {
    it('multiplies hex gas limit by hex gas price', () => {
      // 21000 * 1 gwei = 21000000000000 wei
      expect(
        getHexGasTotal({ gasLimit: '0x5208', gasPrice: ONE_GWEI_HEX }),
      ).toBe('0x1319718a5000');
      expect(parseInt('0x1319718a5000', 16)).toBe(21000 * 1e9);
    });

    it('treats both inputs as hex, not decimal', () => {
      expect(getHexGasTotal({ gasLimit: '0x10', gasPrice: '0x10' })).toBe(
        '0x100',
      );
    });

    it('returns 0x0 when gas limit or gas price is missing', () => {
      expect(
        getHexGasTotal({ gasLimit: undefined, gasPrice: ONE_GWEI_HEX }),
      ).toBe('0x0');
      expect(getHexGasTotal({ gasLimit: '0x5208', gasPrice: undefined })).toBe(
        '0x0',
      );
      expect(getHexGasTotal({ gasLimit: undefined, gasPrice: undefined })).toBe(
        '0x0',
      );
    });
  });

  describe('increaseLastGasPrice', () => {
    it('increases a hex gas price by 10%', () => {
      expect(increaseLastGasPrice(ONE_GWEI_HEX)).toBe('0x4190ab00');
      expect(parseInt('0x4190ab00', 16)).toBe(1.1e9);
      expect(increaseLastGasPrice('0xa')).toBe('0xb');
    });

    it('returns 0x0 when the last gas price is missing', () => {
      expect(increaseLastGasPrice(undefined)).toBe('0x0');
    });
  });

  describe('hexGreaterThan', () => {
    it('compares values as hex', () => {
      expect(hexGreaterThan('0x10', '0xf')).toBe(true);
      expect(hexGreaterThan('0xf', '0x10')).toBe(false);
    });

    it('returns false for equal values', () => {
      expect(hexGreaterThan('0x5208', '0x5208')).toBe(false);
    });
  });

  describe('addEth', () => {
    it('sums decimal ETH amounts', () => {
      expect(addEth('0.1', '0.2')).toBe('0.3');
      expect(addEth('1', '2', '3.5')).toBe('6.5');
    });

    it('rounds the sum to 6 decimals (half down)', () => {
      expect(addEth('1.1234566', '0')).toBe('1.123457');
      expect(addEth('1.1234565', '0')).toBe('1.123456');
    });
  });

  describe('addFiat', () => {
    it('sums decimal fiat amounts', () => {
      expect(addFiat('0.1', '0.2')).toBe('0.3');
    });

    it('rounds the sum to 2 decimals (half down)', () => {
      expect(addFiat('1.006', '2')).toBe('3.01');
      expect(addFiat('1.005', '2')).toBe('3');
    });
  });

  describe('getValueFromWeiHex', () => {
    it('converts hex wei to fiat using the conversion rate', () => {
      expect(
        getValueFromWeiHex({
          value: ONE_ETH_IN_WEI_HEX,
          toCurrency: 'usd',
          conversionRate: 2000,
          numberOfDecimals: 2,
          toDenomination: undefined,
        }),
      ).toBe('2000');
    });

    it('converts hex wei to the requested denomination', () => {
      expect(
        getValueFromWeiHex({
          value: ONE_ETH_IN_WEI_HEX,
          toCurrency: 'ETH',
          conversionRate: undefined,
          numberOfDecimals: 6,
          toDenomination: 'GWEI',
        }),
      ).toBe('1000000000');
    });
  });

  describe('getTransactionFee', () => {
    it('converts a wei BN fee to fiat', () => {
      expect(
        getTransactionFee({
          value: new BN4('21000000000000'),
          toCurrency: 'usd',
          conversionRate: 2000,
          numberOfDecimals: 2,
        }),
      ).toBe('0.04');
    });
  });

  describe('convertTokenToFiat', () => {
    it('returns 0 when the contract exchange rate is missing', () => {
      expect(
        convertTokenToFiat({
          value: '2',
          toCurrency: 'usd',
          conversionRate: 2000,
          contractExchangeRate: undefined,
        }),
      ).toBe(0);
      expect(
        convertTokenToFiat({
          value: '2',
          toCurrency: 'usd',
          conversionRate: 2000,
          contractExchangeRate: 0,
        }),
      ).toBe(0);
    });

    it('multiplies the native conversion rate by the token exchange rate', () => {
      expect(
        convertTokenToFiat({
          value: '2',
          toCurrency: 'usd',
          conversionRate: 2000,
          contractExchangeRate: 0.5,
        }),
      ).toBe('2000');
    });

    it('rounds the fiat value to 2 decimals', () => {
      expect(
        convertTokenToFiat({
          value: '1.2345',
          toCurrency: 'usd',
          conversionRate: 1,
          contractExchangeRate: 1,
        }),
      ).toBe('1.23');
    });
  });

  describe('formatCurrency', () => {
    it('formats ISO 4217 codes with Intl.NumberFormat', () => {
      expect(I18n.locale).toBe('en');
      expect(formatCurrency('1.5', 'usd')).toBe('$1.50');
      expect(formatCurrency('1234.5', 'EUR')).toBe('€1,234.50');
    });

    it.each(['usdc', 'USDT', 'zec'])(
      'formats non-ISO 4217 crypto code %s without Intl.NumberFormat',
      (code) => {
        expect(formatCurrency('1.5', code)).toBe(`1.5 ${code.toUpperCase()}`);
      },
    );

    it('relies on the non-ISO branch because Intl rejects those codes', () => {
      expect(() =>
        new Intl.NumberFormat('en', {
          currency: 'USDC',
          style: 'currency',
        }).format(1),
      ).toThrow(RangeError);
    });
  });

  describe('roundExponential', () => {
    it('returns the input unchanged when the exponent is 20 or less', () => {
      expect(roundExponential('123.456789')).toBe('123.456789');
      expect(roundExponential('100000000000000000000')).toBe(
        '100000000000000000000',
      );
    });

    it('rounds to 4 significant digits when the exponent is above 20', () => {
      expect(roundExponential('1000000000000000000000')).toBe('1.000e+21');
      expect(roundExponential('123456789012345678901234')).toBe('1.235e+23');
    });
  });
});
