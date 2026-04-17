import { formatCurrency, roundExponential } from './confirm-tx';

describe('confirm-tx utils', () => {
  describe('formatCurrency', () => {
    it('formats non-ISO currency with symbol', () => {
      const result = formatCurrency('100', 'USDC');
      expect(result).toContain('USDC');
      expect(result).toContain('100');
    });

    it('formats USDT as crypto code', () => {
      const result = formatCurrency('50.5', 'USDT');
      expect(result).toContain('USDT');
    });

    it('formats USD as ISO currency', () => {
      const result = formatCurrency('100', 'USD');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('formats EUR as ISO currency', () => {
      const result = formatCurrency('100', 'EUR');
      expect(result).toBeDefined();
    });
  });

  describe('roundExponential', () => {
    it('returns small numbers unchanged', () => {
      expect(roundExponential('123.456')).toBe('123.456');
    });

    it('returns zero unchanged', () => {
      expect(roundExponential('0')).toBe('0');
    });

    it('returns regular number unchanged', () => {
      expect(roundExponential('1000000')).toBe('1000000');
    });
  });
});
