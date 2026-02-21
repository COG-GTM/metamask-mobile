import {
  increaseLastGasPrice,
  hexGreaterThan,
  getHexGasTotal,
  addEth,
  addFiat,
  formatCurrency,
  roundExponential,
} from './confirm-tx';

describe('confirm-tx utils', () => {
  describe('increaseLastGasPrice', () => {
    it('should increase gas price by 10%', () => {
      const result = increaseLastGasPrice('0xa');
      // 0xa = 10, 10 * 1.1 = 11 = 0xb
      expect(result).toBe('0xb');
    });

    it('should handle null/undefined by defaulting to 0x0', () => {
      const result = increaseLastGasPrice(null);
      expect(result).toBe('0x0');
    });

    it('should handle zero gas price', () => {
      const result = increaseLastGasPrice('0x0');
      expect(result).toBe('0x0');
    });
  });

  describe('hexGreaterThan', () => {
    it('should return true when a > b', () => {
      expect(hexGreaterThan('0xf', '0xa')).toBe(true);
    });

    it('should return false when a < b', () => {
      expect(hexGreaterThan('0xa', '0xf')).toBe(false);
    });

    it('should return false when a === b', () => {
      expect(hexGreaterThan('0xa', '0xa')).toBe(false);
    });
  });

  describe('getHexGasTotal', () => {
    it('should multiply gas limit and gas price', () => {
      // 0x2 * 0x3 = 6 = 0x6
      const result = getHexGasTotal({ gasLimit: '0x2', gasPrice: '0x3' });
      expect(result).toBe('0x6');
    });

    it('should default to 0x0 when gasLimit is undefined', () => {
      const result = getHexGasTotal({ gasPrice: '0x3' });
      expect(result).toBe('0x0');
    });

    it('should default to 0x0 when gasPrice is undefined', () => {
      const result = getHexGasTotal({ gasLimit: '0x3' });
      expect(result).toBe('0x0');
    });
  });

  describe('addEth', () => {
    it('should add multiple ETH amounts', () => {
      const result = addEth('1', '2', '3');
      expect(Number(result)).toBe(6);
    });

    it('should handle decimal amounts', () => {
      const result = addEth('0.1', '0.2');
      expect(Number(result)).toBeCloseTo(0.3, 6);
    });
  });

  describe('addFiat', () => {
    it('should add multiple fiat amounts', () => {
      const result = addFiat('10', '20', '30');
      expect(Number(result)).toBe(60);
    });

    it('should handle decimal amounts with 2 decimal places', () => {
      const result = addFiat('1.50', '2.75');
      expect(Number(result)).toBeCloseTo(4.25, 2);
    });
  });

  describe('formatCurrency', () => {
    it('should format crypto currencies not in ISO 4217', () => {
      const result = formatCurrency('100', 'USDT');
      expect(result).toBe('100 USDT');
    });

    it('should format USDC correctly', () => {
      const result = formatCurrency('50.5', 'USDC');
      expect(result).toBe('50.5 USDC');
    });

    it('should format standard ISO 4217 currencies using Intl', () => {
      const result = formatCurrency('100', 'USD');
      expect(result).toBeDefined();
      // The result should contain the number 100
      expect(result).toContain('100');
    });

    it('should handle case insensitivity for currency code', () => {
      const result = formatCurrency('100', 'usdt');
      expect(result).toBe('100 USDT');
    });
  });

  describe('roundExponential', () => {
    it('should return the original string for normal numbers', () => {
      expect(roundExponential('12345')).toBe('12345');
    });

    it('should return the original string for small decimals', () => {
      expect(roundExponential('0.001')).toBe('0.001');
    });

    it('should round numbers with exponentials greater than 20', () => {
      // A number with exponent > 20
      const bigNumber = '1e22';
      const result = roundExponential(bigNumber);
      // Should have 4 significant digits
      expect(result).toBe('1.000e+22');
    });

    it('should not round numbers with exponentials less than or equal to 20', () => {
      expect(roundExponential('100000')).toBe('100000');
    });
  });
});
