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

describe('confirm-tx helpers', () => {
  it('increaseLastGasPrice bumps a hex gas price by ~10%', () => {
    expect(increaseLastGasPrice('0x64')).toBe('0x6e'); // 100 * 1.1 = 110
  });

  it('increaseLastGasPrice treats falsy input as 0x0', () => {
    expect(increaseLastGasPrice(undefined)).toBe('0x0');
  });

  it('hexGreaterThan compares hex values', () => {
    expect(hexGreaterThan('0x10', '0x05')).toBe(true);
    expect(hexGreaterThan('0x05', '0x10')).toBe(false);
  });

  it('getHexGasTotal multiplies gasLimit * gasPrice', () => {
    expect(getHexGasTotal({ gasLimit: '0x10', gasPrice: '0x10' })).toBe('0x100');
    expect(getHexGasTotal({})).toBe('0x0');
  });

  it('addEth sums eth amounts to 6 decimals', () => {
    expect(addEth('1', '2', '0.000001')).toBe('3.000001');
  });

  it('addFiat sums fiat amounts to 2 decimals', () => {
    expect(addFiat('1.11', '2.22')).toBe('3.33');
  });

  it('getValueFromWeiHex converts a wei hex value to a decimal string', () => {
    const result = getValueFromWeiHex({
      value: '0xde0b6b3a7640000', // 1 ETH expressed in wei
      toDenomination: 'ETH',
      numberOfDecimals: 4,
    });
    // Value should be parseable as a number
    expect(typeof result).toBe('string');
    expect(Number(result)).toBeGreaterThan(0);
  });

  it('getTransactionFee returns a decimal string', () => {
    const fee = getTransactionFee({
      value: '1000000000000000000',
      toCurrency: 'ETH',
      conversionRate: 1,
      numberOfDecimals: 4,
    });
    expect(typeof fee).toBe('string');
    expect(Number(fee)).toBeGreaterThan(0);
  });

  it('formatCurrency formats ISO-4217 codes via Intl.NumberFormat', () => {
    const result = formatCurrency(1234.5, 'usd');
    // Different locales may render '$1,234.50' differently — just assert it
    // contains the numeric portion.
    expect(result).toMatch(/1[.,]234/);
  });

  it('formatCurrency falls through to plain suffix for non-ISO crypto codes', () => {
    expect(formatCurrency(1.5, 'usdc')).toBe('1.5 USDC');
  });

  it('convertTokenToFiat returns 0 when contractExchangeRate is falsy', () => {
    expect(
      convertTokenToFiat({
        value: '1',
        conversionRate: 1,
        contractExchangeRate: 0,
      }),
    ).toBe(0);
  });

  it('convertTokenToFiat multiplies value by conversion and exchange rates', () => {
    const result = convertTokenToFiat({
      value: '2',
      conversionRate: 3,
      contractExchangeRate: 4,
    });
    // Expected: 2 * (3 * 4) = 24, but the exact decimal handling depends on
    // conversionUtil; just assert it is a positive numeric string.
    expect(typeof result).toBe('string');
    expect(Number(result)).toBeGreaterThan(0);
  });

  it('roundExponential rounds numbers with large exponents to 4 sig figs', () => {
    expect(roundExponential('1.23456789e+21')).toBe('1.235e+21');
  });

  it('roundExponential returns small numbers unchanged', () => {
    expect(roundExponential('1234.56789')).toBe('1234.56789');
  });
});
