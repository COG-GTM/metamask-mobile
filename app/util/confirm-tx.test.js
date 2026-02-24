import {
  increaseLastGasPrice,
  hexGreaterThan,
  getHexGasTotal,
  addEth,
  addFiat,
  formatCurrency,
  roundExponential,
} from './confirm-tx';

describe('confirm-tx utilities', () => {
  describe('increaseLastGasPrice', () => {
    it('increases gas price by 10%', () => {
      const result = increaseLastGasPrice('0xa');
      // 0xa = 10, 10 * 1.1 = 11 = 0xb
      expect(result).toBe('0xb');
    });

    it('handles undefined by using 0x0', () => {
      const result = increaseLastGasPrice(undefined);
      expect(result).toBe('0x0');
    });

    it('handles null by using 0x0', () => {
      const result = increaseLastGasPrice(null);
      expect(result).toBe('0x0');
    });
  });

  describe('hexGreaterThan', () => {
    it('returns true when a > b', () => {
      expect(hexGreaterThan('0xff', '0x0a')).toBe(true);
    });

    it('returns false when a < b', () => {
      expect(hexGreaterThan('0x0a', '0xff')).toBe(false);
    });

    it('returns false when a === b', () => {
      expect(hexGreaterThan('0x0a', '0x0a')).toBe(false);
    });
  });

  describe('getHexGasTotal', () => {
    it('returns gas total from gasLimit and gasPrice', () => {
      // 0x5208 = 21000, 0x1 = 1, total = 21000 = 0x5208
      const result = getHexGasTotal({ gasLimit: '0x5208', gasPrice: '0x1' });
      expect(result).toBe('0x5208');
    });

    it('handles missing gasLimit', () => {
      const result = getHexGasTotal({ gasPrice: '0x1' });
      expect(result).toBe('0x0');
    });

    it('handles missing gasPrice', () => {
      const result = getHexGasTotal({ gasLimit: '0x5208' });
      expect(result).toBe('0x0');
    });
  });

  describe('addEth', () => {
    it('adds ETH amounts', () => {
      const result = addEth('1', '2');
      expect(Number(result)).toBe(3);
    });

    it('adds multiple ETH amounts', () => {
      const result = addEth('1', '2', '3');
      expect(Number(result)).toBe(6);
    });

    it('handles decimal ETH amounts', () => {
      const result = addEth('0.5', '0.3');
      expect(Number(result)).toBeCloseTo(0.8, 6);
    });
  });

  describe('addFiat', () => {
    it('adds fiat amounts', () => {
      const result = addFiat('10', '20');
      expect(Number(result)).toBe(30);
    });

    it('adds multiple fiat amounts', () => {
      const result = addFiat('10.50', '20.75', '5.25');
      expect(Number(result)).toBeCloseTo(36.5, 2);
    });
  });

  describe('formatCurrency', () => {
    it('formats crypto codes not in ISO 4217', () => {
      const result = formatCurrency('100', 'USDC');
      expect(result).toBe('100 USDC');
    });

    it('formats ISO 4217 currencies', () => {
      const result = formatCurrency('100', 'USD');
      expect(result).toContain('100');
    });

    it('handles lowercase currency codes', () => {
      const result = formatCurrency('50', 'usdt');
      expect(result).toBe('50 USDT');
    });
  });

  describe('roundExponential', () => {
    it('returns original string for normal numbers', () => {
      expect(roundExponential('12345')).toBe('12345');
    });

    it('rounds very large numbers with exponents > 20', () => {
      const largeNumber = '1e21';
      const result = roundExponential(largeNumber);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('does not round numbers with exponents <= 20', () => {
      expect(roundExponential('100')).toBe('100');
    });
  });
});
